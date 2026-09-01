import { disconnectSession, markSessionLinked, renameSession } from '@/lib/whatsapp';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  if (body.action === 'disconnect') {
    const session = disconnectSession(id);
    return session ? Response.json({ session }) : Response.json({ error: 'Session not found' }, { status: 404 });
  }
  if (body.action === 'link' && typeof body.phone === 'string') {
    const session = markSessionLinked(id, body.phone);
    return session ? Response.json({ session }) : Response.json({ error: 'Session not found' }, { status: 404 });
  }
  if (body.action === 'rename' && typeof body.alias === 'string') {
    const session = renameSession(id, body.alias.trim());
    return session ? Response.json({ session }) : Response.json({ error: 'Session not found' }, { status: 404 });
  }
  return Response.json({ error: 'Unsupported action' }, { status: 400 });
}
