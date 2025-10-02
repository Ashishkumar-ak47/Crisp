import CandidateTable from "@/components/interviewer/CandidateTable";

export default function Interviewer() {
  return (
    <section className="space-y-4">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Interviewer Dashboard</h1>
          <p className="text-muted-foreground">Review candidates, scores, and chat transcripts.</p>
        </div>
      </header>
      <CandidateTable />
    </section>
  );
}
