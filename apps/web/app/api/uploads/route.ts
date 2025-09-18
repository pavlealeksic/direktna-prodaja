import { NextRequest } from 'next/server';
import { put } from '@vercel/blob';
import { getAuthContext } from '@/lib/clerk';

export async function POST(req: NextRequest) {
  await getAuthContext();
  const form = await req.formData();
  const file = form.get('file');
  const keyPrefix = (form.get('keyPrefix') as string) || 'uploads';
  if (!(file instanceof File)) return new Response('No file', { status: 400 });
  const filename = file.name || 'upload';
  const key = `${keyPrefix}/${Date.now()}-${filename}`;
  const blob = await put(key, file, { access: 'public', addRandomSuffix: false, token: process.env.BLOB_READ_WRITE_TOKEN });
  return Response.json({ url: blob.url, pathname: blob.pathname });
}

