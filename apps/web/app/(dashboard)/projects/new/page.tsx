"use client";
import { useMemo, useState } from 'react';

type UnitDraft = {
  number: string;
  sizeSqm: number | '';
  floor: number | '';
  rooms: number | '';
  orientation?: string;
  status: 'AVAILABLE' | 'RESERVED' | 'SOLD';
};

const orientations = ['North', 'East', 'South', 'West', 'Northeast', 'Northwest', 'Southeast', 'Southwest'];

export default function NewProjectPage() {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [slug, setSlug] = useState('');
  const [brandColor, setBrandColor] = useState('#0ea5e9');
  const [description, setDescription] = useState('');
  const [units, setUnits] = useState<UnitDraft[]>([
    { number: 'A1', sizeSqm: 50, floor: 1, rooms: 2, orientation: 'South', status: 'AVAILABLE' },
  ]);
  const [status, setStatus] = useState<string | null>(null);
  const [bulk, setBulk] = useState({ prefix: 'A', fromFloor: 1 as number | '', toFloor: 5 as number | '', unitsPerFloor: 4 as number | '', sizeSqm: 55 as number | '', rooms: 2 as number | '', orientation: '' as string });

  const metrics = useMemo(() => {
    const valid = units.filter((u) => u.sizeSqm && u.rooms);
    const total = valid.length;
    const avgSize = valid.length ? Math.round(valid.reduce((acc, u) => acc + Number(u.sizeSqm), 0) / valid.length) : 0;
    return { total, avgSize };
  }, [units]);

  const addUnit = () => setUnits((u) => [...u, { number: '', sizeSqm: '', floor: '', rooms: '', orientation: undefined, status: 'AVAILABLE' }]);
  const removeUnit = (idx: number) => setUnits((u) => u.filter((_, i) => i !== idx));
  const updateUnit = (idx: number, patch: Partial<UnitDraft>) =>
    setUnits((arr) => arr.map((u, i) => (i === idx ? { ...u, ...patch } : u)));

  const duplicateNumbers = useMemo(() => {
    const counts = new Map<string, number>();
    for (const u of units) {
      const key = (u.number || '').trim();
      if (!key) continue;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return new Set([...counts.entries()].filter(([, c]) => c > 1).map(([k]) => k));
  }, [units]);

  const addPreset = (size: number, rooms: number) => {
    setUnits((u) => [...u, { number: '', sizeSqm: size, floor: '', rooms, orientation: undefined, status: 'AVAILABLE' }]);
  };

  const generateBulk = () => {
    const { prefix, fromFloor, toFloor, unitsPerFloor, sizeSqm, rooms, orientation } = bulk;
    if (!fromFloor || !toFloor || !unitsPerFloor || !sizeSqm || !rooms) {
      setStatus('Fill all bulk fields (floors, units per floor, size, rooms).');
      return;
    }
    const created: UnitDraft[] = [];
    for (let f = Number(fromFloor); f <= Number(toFloor); f++) {
      for (let i = 1; i <= Number(unitsPerFloor); i++) {
        const num = `${prefix}${f}${String(i).padStart(2, '0')}`;
        created.push({ number: num, sizeSqm: Number(sizeSqm), floor: f, rooms: Number(rooms), orientation: orientation || undefined, status: 'AVAILABLE' });
      }
    }
    setUnits((u) => [...u, ...created]);
    setStatus(`${created.length} apartments generated.`);
  };

  const submit = async () => {
    try {
      if (!name || !location || !slug) throw new Error('Please fill project name, location, and slug.');
      const cleaned = units
        .map((u) => ({
          number: String(u.number || '').trim(),
          sizeSqm: Number(u.sizeSqm),
          floor: Number(u.floor || 0),
          rooms: Number(u.rooms),
          price: Number(u.price),
          orientation: u.orientation?.trim() || undefined,
          status: u.status,
        }))
        .filter((u) => u.number && u.sizeSqm > 0 && u.rooms > 0);
      if (!cleaned.length) throw new Error('Add at least one valid apartment.');

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, location, micrositeSlug: slug, brandColor, description, units: cleaned }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setStatus(`Created project ${data.project.name}. Microsite: ${data.url}`);
    } catch (e: any) {
      setStatus(e.message);
    }
  };

  return (
    <main className="grid" style={{ gap: 16 }}>
      <h1>New Project</h1>
      <section className="card">
        <h3>Project Details</h3>
        <div className="grid" style={{ gap: 8, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
          <input placeholder="Project name" value={name} onChange={(e) => setName(e.target.value)} />
          <input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
          <input placeholder="Microsite slug (e.g., green-park)" value={slug} onChange={(e) => setSlug(e.target.value)} />
          <input placeholder="# Brand color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} />
          <textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} style={{ gridColumn: '1 / span 2' }} />
        </div>
      </section>

      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Apartments</h3>
          <button className="btn" onClick={addUnit}>Add Apartment</button>
        </div>
        <div className="grid" style={{ gap: 8, marginTop: 8 }}>
          <div className="card">
            <h4>Presets</h4>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button className="btn" onClick={() => addPreset(30, 1)}>Studio ~30m²</button>
              <button className="btn" onClick={() => addPreset(45, 2)}>1BR ~45m²</button>
              <button className="btn" onClick={() => addPreset(65, 3)}>2BR ~65m²</button>
              <button className="btn" onClick={() => addPreset(85, 4)}>3BR ~85m²</button>
            </div>
          </div>
          <div className="card">
            <h4>Bulk Add</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
              <input placeholder="Prefix" value={bulk.prefix} onChange={(e) => setBulk({ ...bulk, prefix: e.target.value })} />
              <input type="number" placeholder="From floor" value={bulk.fromFloor as any} onChange={(e) => setBulk({ ...bulk, fromFloor: e.target.value ? Number(e.target.value) : '' })} />
              <input type="number" placeholder="To floor" value={bulk.toFloor as any} onChange={(e) => setBulk({ ...bulk, toFloor: e.target.value ? Number(e.target.value) : '' })} />
              <input type="number" placeholder="# / floor" value={bulk.unitsPerFloor as any} onChange={(e) => setBulk({ ...bulk, unitsPerFloor: e.target.value ? Number(e.target.value) : '' })} />
              <input type="number" placeholder="Size (m²)" value={bulk.sizeSqm as any} onChange={(e) => setBulk({ ...bulk, sizeSqm: e.target.value ? Number(e.target.value) : '' })} />
              <input type="number" placeholder="Rooms" value={bulk.rooms as any} onChange={(e) => setBulk({ ...bulk, rooms: e.target.value ? Number(e.target.value) : '' })} />
              <select value={bulk.orientation} onChange={(e) => setBulk({ ...bulk, orientation: e.target.value })}>
                <option value="">Orientation</option>
                {orientations.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: 8, marginTop: 8 }}>
              <button className="btn" onClick={generateBulk}>Generate</button>
            </div>
          </div>
        </div>
        <div className="grid" style={{ gap: 8 }}>
          {units.map((u, i) => {
            return (
              <div key={i} className="card" style={{ borderColor: '#e2e8f0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, alignItems: 'center' }}>
                  <div>
                    <input placeholder="Number (e.g., A1)" value={u.number} onChange={(e) => updateUnit(i, { number: e.target.value })} />
                    {duplicateNumbers.has((u.number || '').trim()) && (
                      <div style={{ color: '#8b5cf6', fontSize: 12 }}>Duplicate number (allowed)</div>
                    )}
                  </div>
                  <input type="number" placeholder="Size (m²)" value={u.sizeSqm as any} onChange={(e) => updateUnit(i, { sizeSqm: e.target.value ? Number(e.target.value) : '' })} />
                  <input type="number" placeholder="Floor" value={u.floor as any} onChange={(e) => updateUnit(i, { floor: e.target.value ? Number(e.target.value) : '' })} />
                  <input type="number" placeholder="Rooms" value={u.rooms as any} onChange={(e) => updateUnit(i, { rooms: e.target.value ? Number(e.target.value) : '' })} />
                  <select value={u.status} onChange={(e) => updateUnit(i, { status: e.target.value as any })}>
                    <option value="AVAILABLE">Available</option>
                    <option value="RESERVED">Reserved</option>
                    <option value="SOLD">Sold</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                  <select value={u.orientation || ''} onChange={(e) => updateUnit(i, { orientation: e.target.value || undefined })}>
                    <option value="">Orientation</option>
                    {orientations.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                  <button className="btn" onClick={() => removeUnit(i)} style={{ marginLeft: 'auto' }}>Remove</button>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 16 }}>
          <strong>Total units: {metrics.total}</strong>
        </div>
      </section>

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn" onClick={submit}>Create Project</button>
        {status && <p>{status}</p>}
      </div>
    </main>
  );
}
