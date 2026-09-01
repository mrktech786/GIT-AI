export type WhatsAppSessionStatus = 'online' | 'syncing' | 'offline';

export type WhatsAppSession = {
  id: string;
  alias: string;
  phone: string | null;
  status: WhatsAppSessionStatus;
  qr: string | null;
  createdAt: string;
  lastSeen: string;
};

const sessions = new Map<string, WhatsAppSession>();

export function listSessions() {
  return Array.from(sessions.values());
}

export function createSession(alias = 'WhatsApp Account'): WhatsAppSession {
  const id = `wa_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const session: WhatsAppSession = {
    id,
    alias,
    phone: null,
    status: 'syncing',
    // Production adapter should replace this token with the QR payload emitted by Baileys.
    qr: `WA-LINK:${id}:${Date.now()}`,
    createdAt: new Date().toISOString(),
    lastSeen: new Date().toISOString()
  };
  sessions.set(id, session);
  return session;
}

export function disconnectSession(id: string) {
  const session = sessions.get(id);
  if (!session) return null;
  session.status = 'offline';
  session.qr = null;
  session.lastSeen = new Date().toISOString();
  return session;
}

export function markSessionLinked(id: string, phone: string) {
  const session = sessions.get(id);
  if (!session) return null;
  session.phone = phone;
  session.status = 'online';
  session.qr = null;
  session.lastSeen = new Date().toISOString();
  return session;
}

export function renameSession(id: string, alias: string) {
  const session = sessions.get(id);
  if (!session) return null;
  session.alias = alias;
  return session;
}

/**
 * Integration point for a real WhatsApp transport.
 * Implement this interface with @whiskeysockets/baileys (recommended) or
 * whatsapp-web.js on a persistent Node worker. Keep credentials server-side.
 */
export interface WhatsAppTransport {
  createSession(id: string): Promise<void>;
  disconnectSession(id: string): Promise<void>;
  sendText(sessionId: string, jid: string, text: string): Promise<void>;
}
