import { SignIn } from '@clerk/nextjs';

export default function Page() {
  return (
    <main className="grid" style={{ placeItems: 'center', minHeight: '60vh' }}>
      <SignIn />
    </main>
  );
}

