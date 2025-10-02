import type { Question } from "@/state/store";

export function scoreAnswer(q: Question, answer: string): number {
  const text = (answer || "").toLowerCase();
  if (!text.trim()) return 0;
  let score = 0;
  const uniqueHits = new Set<string>();
  for (const k of q.keywords) {
    if (text.includes(k.toLowerCase())) uniqueHits.add(k.toLowerCase());
  }
  score += Math.min(uniqueHits.size * 2, 8); // up to 8 points from keywords
  const lengthBonus = Math.min(Math.floor(text.split(/\s+/).length / 25), 2); // up to 2 for depth
  score += lengthBonus;
  return Math.max(0, Math.min(10, score));
}

export function summarizeCandidate(name: string | null, total: number, questions: Question[]): string {
  const strengths = new Set<string>();
  const weaknesses = new Set<string>();
  for (const q of questions) {
    const s = q.score ?? 0;
    if (s >= 8) strengths.add(q.keywords[0]);
    if (s <= 4) weaknesses.add(q.keywords[0]);
  }
  const sArr = Array.from(strengths).slice(0, 3).join(", ") || "solid fundamentals";
  const wArr = Array.from(weaknesses).slice(0, 2).join(", ") || "no major gaps identified";
  const nm = name ?? "The candidate";
  return `${nm} scored ${total}/60. Strengths: ${sArr}. Areas to improve: ${wArr}.`;
}
