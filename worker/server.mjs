import express from 'express';
import cors from 'cors';
import QRCode from 'qrcode';
import pino from 'pino';
import fs from 'node:fs';
import path from 'node:path';
import { Boom } from '@hapi/boom';
import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';

const app = express();
const PORT = Number(process.env.PORT || 3001);
const HOST = process.env.HOST || '0.0.0.0';
const API_TOKEN = process.env.WA_WORKER_TOKEN || '';
const AUTH_DIR = process.env.WA_AUTH_DIR || path.resolve('./auth');
const sessions = new Map();
fs.mkdirSync(AUTH_DIR, { recursive: true });

app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));

function auth(req, res, next) {
  if (!API_TOKEN) return next();
  const supplied = req.get('authorization')?.replace(/^Bearer\s+/i, '') || req.get('x-worker-token');
  if (supplied !== API_TOKEN) return res.status(401).json({ error: 'Unauthorized' });
  next();
}
app.use(auth);

function state(id) {
  if (!sessions.has(id)) sessions.set(id, { id, alias: `WhatsApp ${sessions.size + 1}`, status: 'offline', phone: null, qr: null, qrImage: null, chats: new Map(), messages: [], sock: null, reconnectTimer: null });
  return sessions.get(id);
}

function publicState(s) {
  return { id:s.id, alias:s.alias, status:s.status, phone:s.phone, qr:s.qr, qrImage:s.qrImage, lastSeen:s.lastSeen || null, messages:s.messages.slice(-100) };
}

async function startSession(id, alias) {
  const s = state(id);
  if (alias) s.alias = alias;
  if (s.sock) return publicState(s);
  s.status = 'syncing';
  s.qr = null;
  s.qrImage = null;
  const dir = path.join(AUTH_DIR, id);
  fs.mkdirSync(dir, { recursive: true });
  const { state: authState, saveCreds } = await useMultiFileAuthState(dir);
  const sock = makeWASocket({ auth: authState, printQRInTerminal: false, logger: pino({ level: 'silent' }), browser: ['WA Hub','Chrome','1.0.0'] });
  s.sock = sock;
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) { s.qr = qr; s.qrImage = await QRCode.toDataURL(qr, { margin: 1, width: 320 }); s.status = 'syncing'; }
    if (connection === 'open') {
      s.status = 'online'; s.lastSeen = new Date().toISOString(); s.qr = null; s.qrImage = null;
      s.phone = sock.user?.id?.split(':')[0] || sock.user?.id || null;
    }
    if (connection === 'close') {
      s.sock = null; s.status = 'offline'; s.lastSeen = new Date().toISOString();
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
      if (code !== DisconnectReason.loggedOut) {
        clearTimeout(s.reconnectTimer);
        s.reconnectTimer = setTimeout(() => startSession(id).catch(console.error), 1500);
      } else {
        s.qr = null; s.qrImage = null;
      }
    }
  });
  sock.ev.on('messages.upsert', ({ messages }) => {
    for (const m of messages || []) {
      if (!m.message) continue;
      const jid = m.key.remoteJid;
      if (!jid || jid === 'status@broadcast') continue;
      const text = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || '';
      const item = { id:m.key.id, sessionId:id, jid, fromMe:Boolean(m.key.fromMe), text, timestamp: Number(m.messageTimestamp || Math.floor(Date.now()/1000)) };
      s.messages.push(item); if (s.messages.length > 5000) s.messages.splice(0, s.messages.length - 5000);
    }
  });
  return publicState(s);
}

app.get('/health', (_req,res) => res.json({ ok:true, service:'wa-hub-worker', sessions:sessions.size, time:new Date().toISOString() }));
app.get('/sessions', (_req,res) => res.json({ sessions:[...sessions.values()].map(publicState) }));
app.post('/sessions', async (req,res) => {
  const id = String(req.body?.id || `wa_${Date.now()}_${Math.random().toString(36).slice(2,8)}`);
  try { res.status(201).json({ session: await startSession(id, String(req.body?.alias || 'WhatsApp Account')) }); }
  catch (e) { console.error(e); res.status(500).json({ error:'Could not start WhatsApp session' }); }
});
app.get('/sessions/:id', (req,res) => { const s=sessions.get(req.params.id); return s ? res.json({session:publicState(s)}) : res.status(404).json({error:'Session not found'}); });
app.get('/sessions/:id/qr', (req,res) => { const s=sessions.get(req.params.id); return s ? res.json({id:s.id,status:s.status,qr:s.qr,qrImage:s.qrImage}) : res.status(404).json({error:'Session not found'}); });
app.patch('/sessions/:id', async (req,res) => {
  const s=sessions.get(req.params.id); if (!s) return res.status(404).json({error:'Session not found'});
  if (req.body?.alias) s.alias=String(req.body.alias).trim() || s.alias;
  if (req.body?.action === 'reconnect') { if (s.sock) try { s.sock.end(undefined); } catch {} s.sock=null; await startSession(s.id); }
  if (req.body?.action === 'logout') { try { await s.sock?.logout(); } catch {} s.sock=null; s.status='offline'; s.phone=null; s.qr=null; s.qrImage=null; }
  res.json({session:publicState(s)});
});
app.delete('/sessions/:id', async (req,res) => { const s=sessions.get(req.params.id); if(!s) return res.status(404).json({error:'Session not found'}); try { await s.sock?.logout(); } catch {} s.sock=null; sessions.delete(req.params.id); res.json({removed:true}); });
app.get('/sessions/:id/messages', (req,res) => { const s=sessions.get(req.params.id); return s ? res.json({messages:s.messages}) : res.status(404).json({error:'Session not found'}); });
app.post('/sessions/:id/messages', async (req,res) => {
  const s=sessions.get(req.params.id); if(!s) return res.status(404).json({error:'Session not found'});
  const to=String(req.body?.to || '').trim(); const text=String(req.body?.text || '').trim();
  if(!to || !text) return res.status(400).json({error:'to and text are required'});
  if(!s.sock || s.status !== 'online') return res.status(409).json({error:'WhatsApp session is not online'});
  const jid = to.includes('@') ? to : `${to.replace(/\D/g,'')}@s.whatsapp.net`;
  const sent = await s.sock.sendMessage(jid, { text });
  res.json({sent:true,id:sent?.key?.id || null});
});

app.listen(PORT, HOST, async () => {
  console.log(`WA Hub worker listening on ${HOST}:${PORT}`);
  for (const id of fs.readdirSync(AUTH_DIR, { withFileTypes:true }).filter(x=>x.isDirectory()).map(x=>x.name)) {
    startSession(id).catch(err=>console.error(`Failed to restore ${id}`,err));
  }
});
