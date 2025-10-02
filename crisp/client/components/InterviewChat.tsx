import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/state/store";
import { parseResume } from "@/lib/resume";
import { durationFor, generateQuestions } from "@/lib/questions";
import { scoreAnswer, summarizeCandidate } from "@/lib/scoring";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function formatSeconds(s: number) {
  const mm = Math.floor(s / 60).toString().padStart(2, "0");
  const ss = Math.floor(s % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function InterviewChat() {
  const { state, dispatch } = useStore();
  const active = useMemo(() => state.candidates.find((c) => c.id === state.currentSessionId) ?? null, [state]);

  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);
  const warnedFive = useRef(false);

  useEffect(() => {
    function onStart(e: any) {
      const file: File | undefined = e.detail?.file;
      if (!file) return;
      (async () => {
        const parsed = await parseResume(file).catch(() => ({ name: null, email: null, phone: null }));
        const questions = generateQuestions();
        dispatch({ type: "START_SESSION", payload: { candidate: { name: parsed.name, email: parsed.email, phone: parsed.phone, resume: { name: file.name, type: file.type, size: file.size } }, questions } });
      })();
    }
    window.addEventListener("crisp:start-interview", onStart as any);
    return () => window.removeEventListener("crisp:start-interview", onStart as any);
  }, [dispatch]);

  useEffect(() => {
    // Auto-scroll chat
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [active?.chat.length]);

  useEffect(() => {
    if (!active) return;
    const c = active;
    // If just started, ask for missing fields first
    if (c.interview.startedAt && c.chat.length === 0) {
      const greet = `Hi${c.name ? ` ${c.name}` : ""}! Welcome to the Crisp AI interview for a Full Stack (React/Node) role.`;
      dispatch({ type: "APPEND_CHAT", payload: { id: c.id, message: { id: crypto.randomUUID(), role: "assistant", text: greet, ts: Date.now() } } });
      enqueueMissingFieldPrompt(c.id, c.name, c.email, c.phone);
    }
  }, [active]);

  // reset 5s warning flag when question changes or resumes
  useEffect(() => {
    warnedFive.current = false;
  }, [active?.interview.currentIndex, active?.interview.questionStartTs]);

  function enqueueMissingFieldPrompt(id: string, name: string | null, email: string | null, phone: string | null) {
    const now = Date.now();
    let prompt: string | null = null;
    if (!name) prompt = "Before we begin, please enter your full name.";
    else if (!email) prompt = "Please provide your email address.";
    else if (!phone) prompt = "Please provide your phone number.";
    if (prompt) {
      dispatch({ type: "APPEND_CHAT", payload: { id, message: { id: crypto.randomUUID(), role: "assistant", text: prompt, ts: now } } });
    } else {
      dispatch({ type: "APPEND_CHAT", payload: { id, message: { id: crypto.randomUUID(), role: "assistant", text: "Let's start the interview!", ts: now } } });
      startQuestion(id);
    }
  }

  function startQuestion(id: string) {
    const c = state.candidates.find((x) => x.id === id)!;
    const idx = c.interview.currentIndex;
    if (idx >= c.interview.questions.length) return; // already finished
    const q = c.interview.questions[idx];
    const now = Date.now();
    dispatch({ type: "APPEND_CHAT", payload: { id, message: { id: crypto.randomUUID(), role: "assistant", text: `(${q.difficulty.toUpperCase()}) ${q.text}`, ts: now } } });
    const dur = durationFor(q.difficulty);
    dispatch({ type: "SET_TIMER", payload: { id, questionStartTs: now, questionDurationSec: dur } });
  }

  const remaining = useMemo(() => {
    if (!active) return null;
    const itv = active.interview;
    if (itv.finishedAt) return null;
    if (itv.paused) return itv.pausedRemainingSec ?? itv.questionDurationSec;
    if (!itv.questionStartTs || !itv.questionDurationSec) return null;
    const elapsed = Math.floor((Date.now() - itv.questionStartTs) / 1000);
    return Math.max(0, itv.questionDurationSec - elapsed);
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const id = active.id;
    const t = setInterval(() => {
      const c = state.candidates.find((x) => x.id === id);
      if (!c) return;
      const itv = c.interview;
      if (itv.finishedAt) return;
      if (itv.paused) return;
      if (!itv.questionStartTs || !itv.questionDurationSec) return;
      const elapsed = Math.floor((Date.now() - itv.questionStartTs) / 1000);
      const remaining = Math.max(0, itv.questionDurationSec - elapsed);
      if (remaining === 5 && !warnedFive.current) {
        warnedFive.current = true;
        toast.warning("5 seconds left!", { duration: 1500 });
      }
      if (remaining === 0) {
        // auto submit current input
        handleSubmitAnswer(undefined, true);
      }
    }, 500);
    return () => clearInterval(t);
  }, [active, state.candidates]);

  function handleSubmitAnswer(text?: string, auto = false) {
    const c = active;
    if (!c) return;
    const itv = c.interview;
    // If collecting metadata
    const needsName = !c.name;
    const needsEmail = !c.email && !needsName;
    const needsPhone = !c.phone && !needsName && !needsEmail;
    const message = (text ?? input).trim();

    if (needsName || needsEmail || needsPhone) {
      if (!auto && message) {
        const userMsg = { id: crypto.randomUUID(), role: "user" as const, text: message, ts: Date.now() };
        dispatch({ type: "APPEND_CHAT", payload: { id: c.id, message: userMsg } });
        const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
        const PHONE_RE = /(\+?\d[\d\s\-()]{7,}\d)/;
        if (needsEmail && !EMAIL_RE.test(message)) {
          dispatch({ type: "APPEND_CHAT", payload: { id: c.id, message: { id: crypto.randomUUID(), role: "assistant", text: "That doesn't look like a valid email. Please try again.", ts: Date.now() } } });
          setInput("");
          return;
        }
        if (needsPhone && !PHONE_RE.test(message)) {
          dispatch({ type: "APPEND_CHAT", payload: { id: c.id, message: { id: crypto.randomUUID(), role: "assistant", text: "Please enter a valid phone number (with country/area code if applicable).", ts: Date.now() } } });
          setInput("");
          return;
        }
        if (needsName) dispatch({ type: "UPDATE_CANDIDATE", payload: { id: c.id, patch: { name: message } } });
        else if (needsEmail) dispatch({ type: "UPDATE_CANDIDATE", payload: { id: c.id, patch: { email: message } } });
        else if (needsPhone) dispatch({ type: "UPDATE_CANDIDATE", payload: { id: c.id, patch: { phone: message } } });
        enqueueMissingFieldPrompt(c.id, needsName ? message : c.name, needsEmail ? message : c.email, needsPhone ? message : c.phone);
        setInput("");
      }
      return;
    }

    // Otherwise we are answering a question
    if (itv.currentIndex >= itv.questions.length) return;
    const q = itv.questions[itv.currentIndex];
    const now = Date.now();
    const elapsed = itv.questionStartTs && itv.questionDurationSec ? Math.min(itv.questionDurationSec, Math.floor((now - itv.questionStartTs) / 1000)) : 0;
    const answerText = auto ? message : message;
    if (!auto && answerText) {
      dispatch({ type: "APPEND_CHAT", payload: { id: c.id, message: { id: crypto.randomUUID(), role: "user", text: answerText, ts: now } } });
    }

    dispatch({ type: "ANSWER", payload: { id: c.id, index: itv.currentIndex, answer: { text: answerText, timeSpentSec: elapsed, autoSubmitted: auto } } });
    const scr = scoreAnswer(q, answerText);
    dispatch({ type: "SCORE", payload: { id: c.id, index: itv.currentIndex, score: scr } });

    const nextIndex = itv.currentIndex + 1;
    if (nextIndex >= itv.questions.length) {
      // finish
      const total = [...itv.questions].reduce((acc, qq, i) => acc + (i === itv.currentIndex ? scr : qq.score ?? 0), 0);
      const summary = summarizeCandidate(c.name, total, itv.questions.map((qq, i) => (i === itv.currentIndex ? { ...qq, score: scr } : qq)));
      const baseMsg = `Interview complete. Final Score: ${total}/60. Summary: ${summary}`;
      const congrats = total === 60 ? " 🎉 Congratulations on a perfect score!" : total >= 45 ? " Great job!" : "";
      dispatch({ type: "APPEND_CHAT", payload: { id: c.id, message: { id: crypto.randomUUID(), role: "assistant", text: baseMsg + congrats, ts: now } } });
      dispatch({ type: "FINISH", payload: { id: c.id, finalScore: total, summary, now } });
      setInput("");
      return;
    }

    // next question
    dispatch({ type: "NEXT", payload: { id: c.id, now } });
    const nq = itv.questions[nextIndex];
    const textPrompt = `(${nq.difficulty.toUpperCase()}) ${nq.text}`;
    dispatch({ type: "APPEND_CHAT", payload: { id: c.id, message: { id: crypto.randomUUID(), role: "assistant", text: textPrompt, ts: now } } });
    dispatch({ type: "SET_TIMER", payload: { id: c.id, questionStartTs: now, questionDurationSec: durationFor(nq.difficulty) } });
    setInput("");
  }

  function handlePauseResume() {
    if (!active) return;
    const itv = active.interview;
    if (itv.paused) {
      dispatch({ type: "RESUME", payload: { id: active.id, now: Date.now() } });
    } else {
      const rem = remaining ?? 0;
      dispatch({ type: "PAUSE", payload: { id: active.id, remainingSec: rem ?? 0 } });
    }
  }

  return (
    <div className="flex h-[60vh] min-h-[420px] flex-col">
      <div ref={listRef} className="flex-1 overflow-y-auto rounded-md border bg-background p-4">
        {active?.chat.length ? (
          <ul className="space-y-3">
            {active.chat.map((m) => (
              <li key={m.id} className={m.role === "user" ? "text-right" : "text-left"}>
                <div className={(m.role === "user" ? "inline-block max-w-[80%] rounded-lg bg-primary px-3 py-2 text-primary-foreground" : "inline-block max-w-[80%] rounded-lg bg-secondary px-3 py-2 text-secondary-foreground") + " animate-in fade-in-0 slide-in-from-bottom-1"}>
                  {m.text}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="grid h-full place-items-center text-sm text-muted-foreground">Upload your resume and click Start Interview to begin.</div>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {active && active.status === "in_progress" && (
            <>
              <span className={`inline-flex items-center gap-2 rounded-md border bg-card px-2.5 py-1.5 text-card-foreground ${remaining != null && remaining <= 5 ? "ring-2 ring-destructive animate-pulse" : ""}`}>
                <span className={`h-2 w-2 rounded-full ${remaining != null && remaining <= 5 ? "bg-destructive" : "bg-emerald-500"}`} />
                {remaining != null ? `Time: ${formatSeconds(remaining)}` : "Timer"}
              </span>
              <span className="text-xs text-muted-foreground">Q {active.interview.currentIndex + 1} / {active.interview.questions.length}</span>
              <Button variant="outline" size="sm" onClick={handlePauseResume}>{active.interview.paused ? "Resume" : "Pause"}</Button>
            </>
          )}
        </div>
        <form
          className="flex min-w-0 flex-1 items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!input.trim()) return;
            handleSubmitAnswer(input, false);
          }}
        >
          <input
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            placeholder={active ? (active.interview.currentIndex < active.interview.questions.length ? "Type your answer…" : "Session complete") : "Type here…"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!active || active.status === "completed"}
          />
          <Button type="submit" disabled={!active || active.status === "completed"}>Send</Button>
        </form>
      </div>
    </div>
  );
}
