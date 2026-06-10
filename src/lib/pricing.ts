// Demo-only pricing: derive a deterministic mock price per class id so
// the booking + payment flow has a believable total to charge. When the
// classes table grows a real price_cents column, delete this file and
// read cls.price_cents instead.
export function mockPriceForClass(classId: string): number {
  let h = 0;
  for (let i = 0; i < classId.length; i++) h = (h * 31 + classId.charCodeAt(i)) >>> 0;
  // $15 - $65 in $5 increments
  return 15 + (h % 11) * 5;
}

export const SERVICE_FEE = 2.5;
