import { useMemo, useState } from "react";
import { useStore } from "@/state/store";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function CandidateTable() {
  const { state } = useStore();
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState<"score" | "date">("score");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const rows = useMemo(() => {
    let list = [...state.candidates];
    if (q.trim()) {
      const t = q.toLowerCase();
      list = list.filter((c) =>
        (c.name ?? "").toLowerCase().includes(t) || (c.email ?? "").toLowerCase().includes(t) || (c.phone ?? "").toLowerCase().includes(t),
      );
    }
    list.sort((a, b) => {
      if (sortBy === "score") return (b.finalScore ?? -1) - (a.finalScore ?? -1);
      return b.updatedAt - a.updatedAt;
    });
    return list;
  }, [state.candidates, q, sortBy]);

  const selected = state.candidates.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <input
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="Search by name, email, or phone"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="rounded-md border bg-background px-3 py-2 text-sm"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
        >
          <option value="score">Sort by Score</option>
          <option value="date">Sort by Date</option>
        </select>
      </div>
      <div className="overflow-hidden rounded-md border">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-secondary text-secondary-foreground">
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Phone</Th>
              <Th>Status</Th>
              <Th>Score</Th>
              <Th>Updated</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card text-card-foreground">
            {rows.map((c) => (
              <tr key={c.id} className={cn("cursor-pointer hover:bg-accent", selectedId === c.id && "bg-accent")}
                  onClick={() => setSelectedId(c.id)}>
                <Td className="font-medium">{c.name ?? "—"}</Td>
                <Td>{c.email ?? "—"}</Td>
                <Td>{c.phone ?? "—"}</Td>
                <Td className="capitalize">{c.status.replace("_", " ")}</Td>
                <Td>{c.finalScore != null ? `${c.finalScore}/60` : "—"}</Td>
                <Td>{new Date(c.updatedAt).toLocaleString()}</Td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <Td colSpan={6} className="py-10 text-center text-muted-foreground">No candidates</Td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelectedId(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Candidate Details</DialogTitle>
          </DialogHeader>
          {selected && <CandidateDetails id={selected.id} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide">{children}</th>;
}

function Td({ children, className, colSpan }: { children?: React.ReactNode; className?: string; colSpan?: number }) {
  return (
    <td className={cn("px-4 py-2", className)} colSpan={colSpan}>
      {children}
    </td>
  );
}

function CandidateDetails({ id }: { id: string }) {
  const { state } = useStore();
  const c = state.candidates.find((x) => x.id === id)!;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-md border p-3"><div className="text-xs text-muted-foreground">Name</div><div className="font-medium">{c.name ?? "—"}</div></div>
        <div className="rounded-md border p-3"><div className="text-xs text-muted-foreground">Email</div><div className="font-medium">{c.email ?? "—"}</div></div>
        <div className="rounded-md border p-3"><div className="text-xs text-muted-foreground">Phone</div><div className="font-medium">{c.phone ?? "—"}</div></div>
      </div>
      <div className="rounded-md border p-3">
        <div className="text-xs text-muted-foreground">Summary</div>
        <div>{c.summary ?? "—"}</div>
      </div>
      <div className="rounded-md border">
        <div className="border-b p-3 text-sm font-semibold">Q&A Detail</div>
        <div className="divide-y">
          {c.interview.questions.map((q, i) => (
            <div key={q.id} className="grid gap-2 p-3 md:grid-cols-12">
              <div className="md:col-span-7">
                <div className="text-xs text-muted-foreground">Question {i + 1} • {q.difficulty.toUpperCase()}</div>
                <div className="font-medium">{q.text}</div>
              </div>
              <div className="md:col-span-5">
                <div className="text-xs text-muted-foreground">Answer</div>
                <div className="whitespace-pre-wrap">{q.answer?.text || "—"}</div>
                <div className="mt-1 text-xs text-muted-foreground">Time: {q.answer ? `${q.answer.timeSpentSec}s` : "—"} • Auto: {q.answer?.autoSubmitted ? "Yes" : "No"} • Score: {q.score ?? "—"}/10</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-md border p-3">
        <div className="text-xs text-muted-foreground mb-2">Chat Transcript</div>
        <div className="max-h-64 overflow-y-auto rounded-md border bg-background p-3 text-sm">
          <ul className="space-y-2">
            {c.chat.map((m) => (
              <li key={m.id}>
                <span className="mr-2 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary-foreground">{m.role}</span>
                <span>{m.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
