"use client";
import { useEffect } from 'react';

export function ViewLogger({ projectId, unitId, path }: { projectId: string; unitId?: string; path: string }) {
  useEffect(() => {
    fetch('/api/analytics/view', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId, unitId, path }) });
  }, [projectId, unitId, path]);
  return null;
}

