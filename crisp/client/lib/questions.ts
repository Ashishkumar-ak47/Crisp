import type { Difficulty, Question } from "@/state/store";

const EASY: Array<{ text: string; keywords: string[] }> = [
  { text: "Explain the difference between var, let, and const in JavaScript.", keywords: ["var", "let", "const", "scope", "hoisting", "reassign"] },
  { text: "What is JSX and how does it relate to React?", keywords: ["JSX", "React", "syntax", "transpile", "Babel"] },
  { text: "How do you create a REST API route in Express?", keywords: ["Express", "route", "GET", "POST", "req", "res"] },
  { text: "What is the Virtual DOM?", keywords: ["virtual dom", "reconciliation", "diffing", "performance"] },
  { text: "How do you handle state in a React component?", keywords: ["useState", "state", "props", "setState"] },
];

const MEDIUM: Array<{ text: string; keywords: string[] }> = [
  { text: "Describe how to manage side effects in React (data fetching, subscriptions).", keywords: ["useEffect", "cleanup", "dependency", "fetch", "async"] },
  { text: "Explain middleware in Express and write an example of a logging middleware.", keywords: ["middleware", "next", "logging", "request", "response"] },
  { text: "How does React Router work and what are nested routes?", keywords: ["react router", "route", "nested", "outlet", "params"] },
  { text: "What are HTTP status codes you commonly use and why?", keywords: ["200", "401", "404", "500", "201", "status"] },
  { text: "How do you implement input validation on a Node/Express API?", keywords: ["validation", "zod", "joi", "schema", "sanitize"] },
];

const HARD: Array<{ text: string; keywords: string[] }> = [
  { text: "Design an authentication flow with JWT for a React + Node app.", keywords: ["jwt", "access", "refresh", "httpOnly", "expiry", "middleware"] },
  { text: "How would you optimize a React app suffering from re-renders?", keywords: ["memo", "useMemo", "useCallback", "context", "selector", "profiling"] },
  { text: "Explain scaling an Express API: clustering, horizontal scaling, and caching.", keywords: ["cluster", "pm2", "load balancer", "cache", "redis", "scaling"] },
  { text: "Design a CRUD for tasks using PostgreSQL with proper indexes and error handling.", keywords: ["postgres", "index", "constraint", "transaction", "migration"] },
  { text: "How would you implement SSR or hydration with React/Vite?", keywords: ["ssr", "hydrate", "vite", "server", "bundle"] },
];

function pickN<T>(arr: T[], n: number): T[] {
  const pool = [...arr];
  const out: T[] = [];
  while (out.length < Math.min(n, pool.length)) {
    const i = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
}

export function generateQuestions(): Question[] {
  const easy = pickN(EASY, 2).map((q) => ({ id: crypto.randomUUID(), difficulty: "easy" as Difficulty, text: q.text, keywords: q.keywords }));
  const medium = pickN(MEDIUM, 2).map((q) => ({ id: crypto.randomUUID(), difficulty: "medium" as Difficulty, text: q.text, keywords: q.keywords }));
  const hard = pickN(HARD, 2).map((q) => ({ id: crypto.randomUUID(), difficulty: "hard" as Difficulty, text: q.text, keywords: q.keywords }));
  return [...easy, ...medium, ...hard];
}

export function durationFor(d: Difficulty): number {
  if (d === "easy") return 20;
  if (d === "medium") return 60;
  return 120;
}
