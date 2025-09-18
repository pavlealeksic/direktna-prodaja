export function SocialShare({ url, text }: { url: string; text: string }) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(text);
  const links = [
    { name: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { name: 'Twitter/X', href: `https://twitter.com/intent/tweet?url=${u}&text=${t}` },
    { name: 'LinkedIn', href: `https://www.linkedin.com/shareArticle?mini=true&url=${u}&title=${t}` },
    { name: 'Viber', href: `viber://forward?text=${t}%20${u}` },
  ];
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <span>Share:</span>
      {links.map((l) => (
        <a key={l.name} href={l.href} target="_blank" rel="noreferrer">{l.name}</a>
      ))}
    </div>
  );
}

