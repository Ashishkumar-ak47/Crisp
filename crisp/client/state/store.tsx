import { createContext, useContext, useEffect, useMemo, useReducer } from "react";

export type Difficulty = "easy" | "medium" | "hard";
export type Role = "system" | "assistant" | "user";

export interface ChatMessage { id: string; role: Role; text: string; ts: number }
export interface Question {
  id: string;
  difficulty: Difficulty;
  text: string;
  keywords: string[];
  answer?: { text: string; timeSpentSec: number; autoSubmitted: boolean };
  score?: number;
}
export interface InterviewState {
  startedAt: number | null;
  finishedAt: number | null;
  currentIndex: number;
  questions: Question[];
  // timing
  questionStartTs: number | null;
  questionDurationSec: number | null;
  paused: boolean;
  pausedRemainingSec: number | null;
}
export interface Candidate {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  createdAt: number;
  updatedAt: number;
  status: "in_progress" | "completed";
  finalScore: number | null;
  summary: string | null;
  chat: ChatMessage[];
  interview: InterviewState;
  resume?: { name: string; type: string; size: number };
}

interface State {
  candidates: Candidate[];
  currentSessionId: string | null;
}

type Action =
  | { type: "START_SESSION"; payload: { candidate: Partial<Candidate> & { resume?: Candidate["resume"] } ; questions: Question[] } }
  | { type: "UPDATE_CANDIDATE"; payload: { id: string; patch: Partial<Candidate> } }
  | { type: "APPEND_CHAT"; payload: { id: string; message: ChatMessage } }
  | { type: "SET_TIMER"; payload: { id: string; questionStartTs: number; questionDurationSec: number } }
  | { type: "PAUSE"; payload: { id: string; remainingSec: number } }
  | { type: "RESUME"; payload: { id: string; now: number } }
  | { type: "ANSWER"; payload: { id: string; index: number; answer: Question["answer"] } }
  | { type: "SCORE"; payload: { id: string; index: number; score: number } }
  | { type: "NEXT"; payload: { id: string; now: number } }
  | { type: "FINISH"; payload: { id: string; finalScore: number; summary: string; now: number } }
  | { type: "SET_CURRENT"; payload: { id: string | null } }
  | { type: "REPLACE_STATE"; payload: State };

const initialState: State = { candidates: [], currentSessionId: null };

const STORAGE_KEY = "ai-interview-data-v1";

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "REPLACE_STATE":
      return action.payload;
    case "START_SESSION": {
      const id = crypto.randomUUID();
      const now = Date.now();
      const candidate: Candidate = {
        id,
        name: action.payload.candidate.name ?? null,
        email: action.payload.candidate.email ?? null,
        phone: action.payload.candidate.phone ?? null,
        createdAt: now,
        updatedAt: now,
        status: "in_progress",
        finalScore: null,
        summary: null,
        chat: [],
        resume: action.payload.candidate.resume,
        interview: {
          startedAt: now,
          finishedAt: null,
          currentIndex: 0,
          questions: action.payload.questions,
          questionStartTs: null,
          questionDurationSec: null,
          paused: true,
          pausedRemainingSec: null,
        },
      };
      return {
        candidates: [candidate, ...state.candidates],
        currentSessionId: id,
      };
    }
    case "UPDATE_CANDIDATE": {
      const { id, patch } = action.payload;
      return {
        ...state,
        candidates: state.candidates.map((c) =>
          c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c,
        ),
      };
    }
    case "APPEND_CHAT": {
      const { id, message } = action.payload;
      return {
        ...state,
        candidates: state.candidates.map((c) =>
          c.id === id ? { ...c, chat: [...c.chat, message], updatedAt: Date.now() } : c,
        ),
      };
    }
    case "SET_TIMER": {
      const { id, questionStartTs, questionDurationSec } = action.payload;
      return {
        ...state,
        candidates: state.candidates.map((c) =>
          c.id === id
            ? {
                ...c,
                interview: {
                  ...c.interview,
                  questionStartTs,
                  questionDurationSec,
                  paused: false,
                  pausedRemainingSec: null,
                },
              }
            : c,
        ),
      };
    }
    case "PAUSE": {
      const { id, remainingSec } = action.payload;
      return {
        ...state,
        candidates: state.candidates.map((c) =>
          c.id === id
            ? {
                ...c,
                interview: {
                  ...c.interview,
                  paused: true,
                  pausedRemainingSec: remainingSec,
                },
              }
            : c,
        ),
      };
    }
    case "RESUME": {
      const { id, now } = action.payload;
      return {
        ...state,
        candidates: state.candidates.map((c) =>
          c.id === id
            ? {
                ...c,
                interview: {
                  ...c.interview,
                  paused: false,
                  questionStartTs: now,
                  questionDurationSec: c.interview.pausedRemainingSec ?? c.interview.questionDurationSec,
                  pausedRemainingSec: null,
                },
              }
            : c,
        ),
      };
    }
    case "ANSWER": {
      const { id, index, answer } = action.payload;
      return {
        ...state,
        candidates: state.candidates.map((c) =>
          c.id === id
            ? {
                ...c,
                interview: {
                  ...c.interview,
                  questions: c.interview.questions.map((q, i) => (i === index ? { ...q, answer } : q)),
                },
              }
            : c,
        ),
      };
    }
    case "SCORE": {
      const { id, index, score } = action.payload;
      return {
        ...state,
        candidates: state.candidates.map((c) =>
          c.id === id
            ? {
                ...c,
                interview: {
                  ...c.interview,
                  questions: c.interview.questions.map((q, i) => (i === index ? { ...q, score } : q)),
                },
              }
            : c,
        ),
      };
    }
    case "NEXT": {
      const { id, now } = action.payload;
      return {
        ...state,
        candidates: state.candidates.map((c) =>
          c.id === id
            ? {
                ...c,
                interview: {
                  ...c.interview,
                  currentIndex: Math.min(c.interview.currentIndex + 1, c.interview.questions.length),
                  questionStartTs: now,
                },
              }
            : c,
        ),
      };
    }
    case "FINISH": {
      const { id, finalScore, summary, now } = action.payload;
      return {
        ...state,
        candidates: state.candidates.map((c) =>
          c.id === id
            ? {
                ...c,
                status: "completed",
                finalScore,
                summary,
                updatedAt: now,
                interview: { ...c.interview, finishedAt: now, paused: true },
              }
            : c,
        ),
      };
    }
    case "SET_CURRENT":
      return { ...state, currentSessionId: action.payload.id };
    default:
      return state;
  }
}

function persistLoad(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as State;
    return parsed;
  } catch {
    return initialState;
  }
}

function persistSave(state: State) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

const StoreCtx = createContext<{ state: State; dispatch: React.Dispatch<Action> } | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState, () => persistLoad());

  useEffect(() => {
    persistSave(state);
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
