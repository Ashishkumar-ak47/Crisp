# Crisp – AI-Powered Interview Assistant

A React + Vite SPA with an Express server that runs a fully local AI-style interview assistant:
- Two tabs: Interviewee (chat) and Interviewer (dashboard)
- Resume upload (PDF/DOCX) with Name/Email/Phone extraction
- Missing fields collected via chat before starting
- Timed interview: 6 questions (2 Easy • 2 Medium • 2 Hard) with autosubmit
- Scoring and final summary, dashboard with search/sort and details
- Full local persistence (refresh-safe) and Welcome Back resume modal

## Live Preview
- https://68de4b5e831060d1e9e1b88a--crispaiv1.netlify.app/

## Getting Started
- pnpm dev
- pnpm build && pnpm start

## Resume Parsing
- Uses pdfjs-dist and mammoth in the browser when available to read text and extract Email/Phone. If parsing fails, we gracefully fallback to filename-based name guess, then collect missing details in chat.

## Features
- 5-second remaining timer alert (toast)
- Pause/Resume timers with preservation on refresh
- Animated, responsive UI built with Tailwind and shadcn primitives

## Deploy
- deployed on netlify

## Notes
- Data is stored in localStorage on the device; no backend data persistence is used.
