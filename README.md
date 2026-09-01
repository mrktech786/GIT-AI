# WA Hub — Multi WhatsApp Management SaaS

A professional Next.js dashboard for managing many WhatsApp accounts from one workspace. The UI is designed around QR-based device pairing, a unified inbox, broadcasts, automation and analytics.

## Included

- Dark emerald/cyan SaaS dashboard
- Add/link unlimited account records from the UI
- QR pairing modal with a production-ready transport boundary
- Device grid/table-style management with online/syncing/offline states
- Reconnect QR, rename and disconnect actions
- Unified inbox with account filter and message composer
- Broadcast center with multi-account selection
- Auto-responder / chatbot rule UI
- Analytics dashboard
- Responsive desktop/mobile layout
- Server-side WhatsApp session API structure
- `@whiskeysockets/baileys` dependency and adapter interface for the real transport

## Important production architecture

The dashboard is ready for a real WhatsApp transport, but the browser must **not** contain WhatsApp credentials. The current pairing flow intentionally uses a demo QR payload so the UI can be tested safely.

For production, run a persistent Node.js worker/service (VM, container, or managed worker) that owns Baileys sockets and auth state. Connect it to the Next.js app through REST/WebSocket or a queue. Store per-account auth state in encrypted persistent storage. This is preferable to trying to keep long-lived WhatsApp sockets inside a serverless request function.

Suggested structure:

```text
Next.js Dashboard
   │
   ├── /api/whatsapp/sessions
   ├── /api/whatsapp/messages
   └── WebSocket / event stream
             │
             ▼
      WhatsApp Worker
      └── Baileys socket per account
             │
             └── encrypted auth/session store
```

## Local development

```bash
npm install
npm run dev
```

Then open the local Next.js URL. Click **Link WhatsApp** to test the pairing UI and account management flow.

## Vercel

Import the repository into Vercel and deploy the Next.js dashboard. For real WhatsApp connectivity, host the persistent Baileys worker separately and configure the dashboard's server routes to communicate with that worker.
