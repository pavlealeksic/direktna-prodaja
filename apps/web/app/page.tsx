export default function HomePage() {
  return (
    <main className="grid" style={{ gap: 24 }}>
      <section className="card">
        <h1>Direct-to-Buyer Marketplace</h1>
        <p>Upload a single CSV to publish a project microsite and collect leads — fast, simple, professional.</p>
        <a className="btn" href="/dashboard">Go to Dashboard</a>
      </section>
      <section className="card">
        <h2>How it works</h2>
        <ol>
          <li>Upload CSV of apartments</li>
          <li>Customize project and publish</li>
          <li>Share your project link</li>
          <li>Get leads directly</li>
        </ol>
      </section>
    </main>
  );
}

