/**
 * PostgreSQL jsonb obyekt kalitlarini qayta tartiblaydi (uzunlik, keyin alifbo): "I","II","IV","III".
 * Shuning uchun moslashtirish ustunlari kalitlarini ko'rsatishdan oldin tabiiy tartibga keltiramiz:
 * rim raqamlari (I, II, III, IV...) -> arab raqamlari -> harflar (a..f).
 */
const ROMAN_VALUES: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100 };

function romanToInt(s: string): number | null {
  if (!/^[IVXLC]+$/.test(s)) return null;
  let total = 0;
  for (let i = 0; i < s.length; i++) {
    const v = ROMAN_VALUES[s[i]], next = ROMAN_VALUES[s[i + 1]] ?? 0;
    total += v < next ? -v : v;
  }
  return total;
}

function rank(key: string): [number, number | string] {
  const r = romanToInt(key);
  if (r !== null) return [0, r];
  if (/^\d+$/.test(key)) return [1, Number(key)];
  return [2, key];
}

export function sortedKeys(keys: string[]): string[] {
  return [...keys].sort((a, b) => {
    const [ga, va] = rank(a), [gb, vb] = rank(b);
    if (ga !== gb) return ga - gb;
    return va < vb ? -1 : va > vb ? 1 : 0;
  });
}

export function sortedEntries<T>(obj: Record<string, T>): Array<[string, T]> {
  return sortedKeys(Object.keys(obj)).map((k) => [k, obj[k]]);
}
