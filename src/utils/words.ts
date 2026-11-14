const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function below1000(n: number): string {
  const parts: string[] = [];
  if (n >= 100) { parts.push(`${ONES[Math.floor(n / 100)]} Hundred`); n %= 100; }
  if (n >= 20) { parts.push(TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : "")); }
  else if (n > 0) parts.push(ONES[n]);
  return parts.join(" ");
}

/** Indian numbering system (thousand, lakh, crore). e.g. 125430 → "One Lakh Twenty-Five Thousand Four Hundred Thirty". */
export function amountInWords(amount: number): string {
  let n = Math.round(amount);
  if (!Number.isFinite(n) || n < 0) return "";
  if (n === 0) return "Zero Rupees Only";
  const out: string[] = [];
  const crore = Math.floor(n / 1e7); n %= 1e7;
  const lakh = Math.floor(n / 1e5); n %= 1e5;
  const thousand = Math.floor(n / 1e3); n %= 1e3;
  if (crore) out.push(`${below1000(crore)} Crore`);
  if (lakh) out.push(`${below1000(lakh)} Lakh`);
  if (thousand) out.push(`${below1000(thousand)} Thousand`);
  if (n) out.push(below1000(n));
  return `${out.join(" ")} Rupees Only`;
}
