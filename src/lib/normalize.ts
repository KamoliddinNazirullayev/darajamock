/**
 * Ochiq javoblarni solishtirish uchun normalizatsiya va tekshirish.
 * Maqsad: imlo variantlari (oʻ/o'/o‘, g‘/g'), kirill/lotin, ortiqcha belgilar tufayli
 * to'g'ri javob rad etilmasin; lekin yolg'on qabul ham bo'lmasin (masalan, "Aleksandr II" ≠ "Aleksandr III").
 */

const CYR_TO_LAT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z", и: "i", й: "y", к: "k", л: "l",
  м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "x", ц: "ts", ч: "ch", ш: "sh",
  щ: "sh", ъ: "", ы: "i", ь: "", э: "e", ю: "yu", я: "ya", ў: "o", қ: "q", ғ: "g", ҳ: "h",
};

const APOSTROPHES = /[ʻʼ'’‘`´ʹʾʿ]/g;

/** Kichik harf, kirill -> lotin, apostroflarni olib tashlash, faqat harf/raqam va bo'sh joy. */
export function normalizeText(input: string): string {
  const lower = input.toLowerCase().normalize("NFKC");
  let out = "";
  for (const ch of lower) out += CYR_TO_LAT[ch] ?? ch;
  return out
    .replace(APOSTROPHES, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(s: string): string[] {
  return s.length ? s.split(" ") : [];
}

const ROMAN = /^[ivxlc]+$/;

function romanTokens(toks: string[]): string[] {
  return toks.filter((t) => ROMAN.test(t) || /^\d+$/.test(t));
}

/** Levenshtein masofasi (1 dan oshsa erta to'xtaydi). */
function withinOneEdit(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1);
  if (a.length < b.length) return a.slice(i) === b.slice(i + 1);
  return a.slice(i + 1) === b.slice(i);
}

function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

export type OpenKind = "text" | "year" | "number";

export function isOpenAnswerCorrect(given: string, accepted: string[], kind: OpenKind = "text"): boolean {
  const raw = given.trim();
  if (!raw) return false;

  if (kind === "year" || kind === "number") {
    const g = digitsOnly(raw);
    return g.length > 0 && accepted.some((a) => digitsOnly(a) === g);
  }

  const g = normalizeText(raw);
  if (!g) return false;
  const gTokens = tokens(g);

  for (const acc of accepted) {
    const a = normalizeText(acc);
    if (!a) continue;
    if (a === g) return true;

    const aTokens = tokens(a);
    // Rim raqamlari / raqamlar aniq mos kelishi shart (Aleksandr II ≠ Aleksandr III)
    const gRoman = romanTokens(gTokens).join(" ");
    const aRoman = romanTokens(aTokens).join(" ");
    if (gRoman !== aRoman) continue;

    // Berilgan javob to'g'ri javobning barcha so'zlarini o'z ichiga oladi ("Gana davlati" -> "Gana")
    if (aTokens.every((t) => gTokens.includes(t))) return true;

    // Bitta harf xatosi (faqat uzun javoblarda)
    if (a.length >= 7 && withinOneEdit(a, g)) return true;
  }
  return false;
}
