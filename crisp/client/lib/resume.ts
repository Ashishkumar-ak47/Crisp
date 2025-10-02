export interface ParsedResume { name: string | null; email: string | null; phone: string | null; text?: string }

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_RE = /(\+?\d[\d\s\-()]{7,}\d)/;

export async function parseResume(file: File): Promise<ParsedResume> {
  const lower = file.name.toLowerCase();
  try {
    if (lower.endsWith(".pdf")) return await parsePdf(file);
    if (lower.endsWith(".docx")) return await parseDocx(file);
  } catch (e) {
    console.warn("Resume parse failed", e);
  }
  // graceful fallback
  const baseName = file.name.replace(/\.[^.]+$/, "");
  const guessName = baseName.replace(/[\-_]/g, " ").split(/\s+/).slice(0, 3).join(" ") || null;
  return { name: guessName, email: null, phone: null };
}

async function parsePdf(file: File): Promise<ParsedResume> {
  try {
    const buf = await file.arrayBuffer();
    const { getDocument, GlobalWorkerOptions }: any = await import("pdfjs-dist");
    try {
      const workerUrl = (await import("pdfjs-dist/build/pdf.worker.mjs?url")).default;
      if (GlobalWorkerOptions) GlobalWorkerOptions.workerSrc = workerUrl;
    } catch {}
    const doc = await getDocument({ data: buf }).promise;
    let text = "";
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const items = await page.getTextContent();
      const str = items.items.map((it: any) => it.str).join(" ");
      text += "\n" + str;
    }
    return extractFields(text);
  } catch (e) {
    console.warn("PDF parse failed", e);
    const baseName = file.name.replace(/\.[^.]+$/, "");
    const guessName = baseName.replace(/[\-_]/g, " ").split(/\s+/).slice(0, 3).join(" ") || null;
    return { name: guessName, email: null, phone: null };
  }
}

async function parseDocx(file: File): Promise<ParsedResume> {
  try {
    const buf = await file.arrayBuffer();
    const mammoth: any = await import("mammoth/mammoth.browser");
    const { value } = await mammoth.extractRawText({ arrayBuffer: buf });
    return extractFields(value);
  } catch (e) {
    console.warn("DOCX parse failed", e);
    const baseName = file.name.replace(/\.[^.]+$/, "");
    const guessName = baseName.replace(/[\-_]/g, " ").split(/\s+/).slice(0, 3).join(" ") || null;
    return { name: guessName, email: null, phone: null };
  }
}

function extractFields(text: string): ParsedResume {
  const email = text.match(EMAIL_RE)?.[0] ?? null;
  const phone = text.match(PHONE_RE)?.[0]?.trim() ?? null;
  // crude name guess: first non-empty line that isn't email/phone
  const firstLine = text.split(/\n|\r/).map((l) => l.trim()).find((l) => l && !l.includes("@") && !l.match(PHONE_RE));
  const name = firstLine ? titleCase(firstLine.split(/[,|\-]/)[0].slice(0, 60)) : null;
  return { name, email, phone, text };
}

function titleCase(s: string) {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
