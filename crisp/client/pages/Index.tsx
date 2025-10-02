import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import InterviewChat from "@/components/InterviewChat";

export default function Index() {
  return (
    <section className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Interviewee</h1>
          <p className="text-muted-foreground">Upload your resume to begin. We’ll auto-detect your details and guide you through a timed interview.</p>
        </div>
      </header>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4 rounded-xl border bg-card/90 p-6 shadow-sm ring-1 ring-black/5">
          <ResumeStarter />
          <div className="h-px w-full bg-border" />
          <InterviewChat />
        </div>
        <aside className="rounded-xl border bg-card/90 p-6 shadow-sm ring-1 ring-black/5">
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li>1. Upload resume (PDF/DOCX)</li>
            <li>2. Confirm Name / Email / Phone</li>
            <li>3. Timed Q&A (6 questions)</li>
            <li>4. Get your score & summary</li>
          </ol>
        </aside>
      </div>
    </section>
  );
}


function ResumeStarter() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx"
          onChange={() => setError(null)}
          className="block w-full text-sm file:mr-4 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-accent"
        />
        <Button onClick={() => inputRef.current?.click()}>Choose File</Button>
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <div className="flex items-center gap-3">
        <Button
          onClick={() => {
            const file = inputRef.current?.files?.[0];
            if (!file) {
              setError("Please select a PDF or DOCX file.");
              return;
            }
            const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
            const isDocx = file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || file.name.toLowerCase().endsWith(".docx");
            if (!isPdf && !isDocx) {
              setError("Invalid file type. Only PDF or DOCX is supported.");
              return;
            }
            const event = new CustomEvent("crisp:start-interview", { detail: { file } });
            window.dispatchEvent(event);
          }}
        >
          Start Interview
        </Button>
        <p className="text-xs text-muted-foreground">Your data is stored locally on this device.</p>
      </div>
    </div>
  );
}
