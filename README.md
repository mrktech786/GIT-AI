# GitAI — Vercel Web Edition

A Vercel-ready web conversion of the `mrktech786/gitdevai786` Android GitAI concept.

## Included

- GitHub repository search
- Repository README viewer
- Repository file browser and code viewer
- Issues, pull requests and commits
- Browser-local saved repositories
- Gemini-powered code review, commit generation, PR summaries, debugging and explanations
- Gemini chat with server-side API key handling
- Responsive desktop/mobile layout

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set `GEMINI_API_KEY` in `.env.local` for AI features. `GITHUB_TOKEN` is optional and can increase GitHub API limits.

## Vercel

Import the repository into Vercel. Framework should be detected as Next.js. Add `GEMINI_API_KEY` under Project Settings → Environment Variables, then deploy.
