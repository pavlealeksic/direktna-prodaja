"use client";
import { useRef } from 'react';

export function AdCardGenerator({ title, subtitle, imageUrl }: { title: string; subtitle: string; imageUrl?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = async () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const w = (canvas.width = 1080);
    const h = (canvas.height = 1080);
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(0, 0, w, h);
    if (imageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((res) => { img.onload = res; img.src = imageUrl!; });
      const ratio = Math.min(w / img.width, h / img.height);
      const iw = img.width * ratio, ih = img.height * ratio;
      ctx.drawImage(img, (w - iw) / 2, (h - ih) / 2, iw, ih);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(0, h - 260, w, 260);
    } else {
      ctx.fillStyle = '#0d9488';
      ctx.fillRect(0, h - 260, w, 260);
    }
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 64px system-ui';
    ctx.fillText(title, 48, h - 160, w - 96);
    ctx.font = '36px system-ui';
    ctx.fillText(subtitle, 48, h - 96, w - 96);
  };

  const download = () => {
    const canvas = canvasRef.current!;
    const a = document.createElement('a');
    a.download = 'ad-card.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
  };

  return (
    <div className="card">
      <h3>Ad Card Generator</h3>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button className="btn" onClick={draw}>Generate</button>
        <button className="btn" onClick={download}>Download PNG</button>
      </div>
      <canvas ref={canvasRef} style={{ width: 360, height: 360, border: '1px solid #e2e8f0', borderRadius: 8 }} />
    </div>
  );
}

