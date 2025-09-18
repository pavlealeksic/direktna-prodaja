import { ApartmentUnitSchema, ApartmentUnitInput } from './schemas';

// Minimal CSV parser for well-formed CSV with headers
export function parseUnitsCsv(csv: string): ApartmentUnitInput[] {
  const lines = csv.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const header = lines[0].split(',').map((h) => h.trim());
  const rows = lines.slice(1).map((l) => l.split(',').map((c) => c.trim()));
  const records = rows.map((cols) => Object.fromEntries(header.map((h, i) => [h, cols[i] ?? ''])));

  return records.map((r) => {
    const parsed = ApartmentUnitSchema.safeParse({
      number: r.number ?? r.apartment ?? r.unit ?? '',
      sizeSqm: r.sizeSqm ?? r.size ?? r.sqm,
      floor: r.floor,
      rooms: r.rooms,
      price: r.price || undefined,
      orientation: r.orientation,
      status: r.status,
    });
    if (!parsed.success) {
      const firstMsg = parsed.error.issues[0]?.message ?? 'Invalid row';
      throw new Error(`CSV validation error: ${firstMsg}`);
    }
    return parsed.data;
  });
}
