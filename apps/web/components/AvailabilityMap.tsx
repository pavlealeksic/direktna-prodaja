type Unit = { id: string; number: string; status: 'AVAILABLE' | 'RESERVED' | 'SOLD'; floor?: number };

export function AvailabilityMap({ units, hrefForUnit }: { units: Unit[]; hrefForUnit?: (u: Unit) => string }) {
  const byFloor = new Map<number, Unit[]>();
  for (const u of units) {
    const f = (u as any).floor ?? 0;
    byFloor.set(f, [...(byFloor.get(f) || []), u]);
  }
  const floors = [...byFloor.entries()].sort((a, b) => a[0] - b[0]);
  return (
    <div className="grid" style={{ gap: 12 }}>
      {floors.map(([floor, items]) => (
        <div key={floor}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Floor {floor}</div>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
            {items.map((u) => (
              hrefForUnit ? (
                <a key={u.id} href={hrefForUnit(u)} className="card" style={{
                  background:
                    u.status === 'AVAILABLE' ? '#dcfce7' : u.status === 'RESERVED' ? '#fef9c3' : '#fee2e2',
                  display: 'block'
                }}>
                  <strong>{u.number}</strong>
                  <div style={{ fontSize: 12 }}>{u.status}</div>
                </a>
              ) : (
                <div key={u.id} className="card" style={{
                  background:
                    u.status === 'AVAILABLE' ? '#dcfce7' : u.status === 'RESERVED' ? '#fef9c3' : '#fee2e2',
                }}>
                  <strong>{u.number}</strong>
                  <div style={{ fontSize: 12 }}>{u.status}</div>
                </div>
              )
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
