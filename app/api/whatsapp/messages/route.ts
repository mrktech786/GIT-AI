import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!body.sessionId || !body.to || !body.text) {
    return NextResponse.json({ error: 'sessionId, to and text are required' }, { status: 400 });
  }
  // Production: resolve the session in the persistent Baileys worker and call sendMessage().
  return NextResponse.json({ queued: true, sessionId: body.sessionId, to: body.to, text: body.text });
}
