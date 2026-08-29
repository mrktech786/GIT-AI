'use client';

import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';

type Repo = { id:number; name:string; full_name:string; description:string|null; stargazers_count:number; forks_count:number; language:string|null; html_url:string; owner:{login:string; avatar_url:string}; default_branch:string };
type Content = { name:string; path:string; type:'file'|'dir'; download_url:string|null; html_url:string; size:number };
type Issue = { number:number; title:string; state:string; body:string|null; user?:{login:string;avatar_url:string}; html_url:string; comments:number };
type Pull = Issue & { head?:{ref:string}; base?:{ref:string} };

type Tab = 'explore'|'tools'|'chat'|'saved'|'profile';

const tools = [
  ['CODE_REVIEW','Code Review'],['COMMIT_GEN','Commit Message'],['PR_SUMMARY','PR Summary'],['DEBUG','Debug Assistant'],['EXPLAIN','Explain Code']
] as const;

export default function Home() {
  const [tab,setTab] = useState<Tab>('explore');
  const [query,setQuery] = useState('');
  const [sort,setSort] = useState('stars');
  const [repos,setRepos] = useState<Repo[]>([]);
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState('');
  const [selected,setSelected] = useState<Repo|null>(null);
  const [repoTab,setRepoTab] = useState<'readme'|'code'|'issues'|'pulls'|'commits'>('readme');
  const [contents,setContents] = useState<Content[]>([]);
  const [path,setPath] = useState('');
  const [readme,setReadme] = useState('');
  const [code,setCode] = useState('');
  const [codeName,setCodeName] = useState('');
  const [issues,setIssues] = useState<Issue[]>([]);
  const [pulls,setPulls] = useState<Pull[]>([]);
  const [commits,setCommits] = useState<any[]>([]);
  const [saved,setSaved] = useState<Repo[]>([]);
  const [tool,setTool] = useState<typeof tools[number][0]>('COMMIT_GEN');
  const [prompt,setPrompt] = useState('');
  const [context,setContext] = useState('');
  const [result,setResult] = useState('');
  const [aiLoading,setAiLoading] = useState(false);
  const [messages,setMessages] = useState<{role:'user'|'assistant';content:string}[]>([{role:'assistant',content:'👋 Hello! I am GitAI. Ask me to review code, explain an architecture, draft a Conventional Commit, summarize a PR, or debug a Git workflow.'}]);
  const [chat,setChat] = useState('');

  useEffect(()=>{ const raw=localStorage.getItem('gitai-saved'); if(raw) setSaved(JSON.parse(raw)); },[]);
  useEffect(()=>{ localStorage.setItem('gitai-saved',JSON.stringify(saved)); },[saved]);

  const search = async () => {
    setLoading(true); setError('');
    try { const r=await fetch(`/api/github/search?q=${encodeURIComponent(query)}&sort=${sort}`); const d=await r.json(); if(!r.ok) throw new Error(d.error||'GitHub request failed'); setRepos(d.items||[]); }
    catch(e:any){setError(e.message||'Failed to search GitHub');} finally{setLoading(false)}
  };

  useEffect(()=>{ search(); },[]);

  const openRepo = async (repo:Repo) => {
    setSelected(repo); setRepoTab('readme'); setPath(''); setCode('');
    const d=await fetch(`/api/github/repo/${repo.owner.login}/${repo.name}/contents?path=`).then(r=>r.json()); setContents(d.items||[]);
    const rd=await fetch(`/api/github/repo/${repo.owner.login}/${repo.name}/readme`).then(r=>r.json()); setReadme(rd.content||'');
  };
  const loadContent = async (p:string) => {
    if(!selected) return; const d=await fetch(`/api/github/repo/${selected.owner.login}/${selected.name}/contents?path=${encodeURIComponent(p)}`).then(r=>r.json());
    if(d.type==='file'){ setCode(d.content||''); setCodeName(d.name||p); } else { setContents(d.items||[]); setPath(p); }
  };
  const loadRepoTab = async (t:typeof repoTab) => {
    if(!selected) return; setRepoTab(t);
    const base=`/api/github/repo/${selected.owner.login}/${selected.name}`;
    if(t==='issues') setIssues((await fetch(`${base}/issues?state=open`).then(r=>r.json())).items||[]);
    if(t==='pulls') setPulls((await fetch(`${base}/pulls`).then(r=>r.json())).items||[]);
    if(t==='commits') setCommits((await fetch(`${base}/commits`).then(r=>r.json())).items||[]);
    if(t==='code') { setCode(''); setContents((await fetch(`${base}/contents?path=${encodeURIComponent(path)}`).then(r=>r.json())).items||[]); }
  };
  const toggleSave=(r:Repo)=>setSaved(s=>s.some(x=>x.id===r.id)?s.filter(x=>x.id!==r.id):[r,...s]);

  const runAi = async (p=prompt,c=context,t=tool) => {
    if(!p.trim()) return; setAiLoading(true); setResult('');
    try { const r=await fetch('/api/ai',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({tool:t,prompt:p,context:c})}); const d=await r.json(); if(!r.ok) throw new Error(d.error||'AI request failed'); setResult(d.text||''); }
    catch(e:any){setResult(`⚠️ ${e.message||'AI request failed'}`)} finally{setAiLoading(false)}
  };
  const sendChat=async()=>{ if(!chat.trim()) return; const text=chat; setChat(''); setMessages(m=>[...m,{role:'user',content:text}]); setAiLoading(true); try{ const r=await fetch('/api/ai',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({tool:'CHAT',prompt:text,context:selected?.full_name||'',history:messages})}); const d=await r.json(); setMessages(m=>[...m,{role:'assistant',content:d.text||d.error||'No response'}]); }finally{setAiLoading(false)} };

  const nav = useMemo(()=>[['explore','Explore'],['tools','AI Tools'],['chat','AI Chat'],['saved','Saved'],['profile','Profile']] as [Tab,string][],[]);

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">✦</span><div><b>GitAI</b><small>Developer cockpit</small></div></div>
      <nav>{nav.map(([id,label])=><button key={id} className={tab===id?'nav active':'nav'} onClick={()=>setTab(id)}><span>{({explore:'⌕',tools:'✦',chat:'◌',saved:'★',profile:'●'} as any)[id]}</span>{label}</button>)}</nav>
      <div className="sidebar-note"><b>Gemini powered</b><span>AI features run securely through Vercel server routes.</span></div>
    </aside>

    <main className="main">
      <header className="topbar"><div><h1>{tab==='explore'?'Explore GitHub':tab==='tools'?'AI Developer Tools':tab==='chat'?'AI Chat':tab==='saved'?'Saved Repositories':'Profile & Settings'}</h1><p>{tab==='explore'?'Search repositories, inspect code, issues, PRs and commits.':'GitAI — your AI coding assistant.'}</p></div><a className="github-link" href="https://github.com/mrktech786/gitdevai786" target="_blank">Source ↗</a></header>

      {tab==='explore' && <section className="content-grid">
        <div className="search-row"><input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&search()} placeholder="Search GitHub repositories…"/><select value={sort} onChange={e=>setSort(e.target.value)}><option value="stars">Stars</option><option value="forks">Forks</option><option value="updated">Updated</option></select><button className="primary" onClick={search}>{loading?'Searching…':'Search'}</button></div>
        {error&&<div className="error">{error}</div>}
        <div className="repo-list">{repos.map(r=><article className="repo-card" key={r.id} onClick={()=>openRepo(r)}><div className="repo-head"><img src={r.owner.avatar_url}/><div><h3>{r.full_name}</h3><p>{r.description||'No description provided.'}</p></div><button className="icon" onClick={e=>{e.stopPropagation();toggleSave(r)}}>{saved.some(x=>x.id===r.id)?'★':'☆'}</button></div><div className="meta"><span>★ {r.stargazers_count}</span><span>⑂ {r.forks_count}</span><span>{r.language||'Unknown'}</span></div></article>)}</div>
      </section>}

      {tab==='saved' && <section className="repo-list">{saved.length===0?<div className="empty">No saved repositories yet.</div>:saved.map(r=><article className="repo-card" key={r.id} onClick={()=>{setTab('explore');openRepo(r)}}><div className="repo-head"><img src={r.owner.avatar_url}/><div><h3>{r.full_name}</h3><p>{r.description||'No description provided.'}</p></div><button className="icon" onClick={e=>{e.stopPropagation();toggleSave(r)}}>★</button></div><div className="meta"><span>★ {r.stargazers_count}</span><span>⑂ {r.forks_count}</span><span>{r.language||'Unknown'}</span></div></article>)}</section>}

      {tab==='tools' && <section className="tool-layout"><div className="panel tool-menu">{tools.map(([id,label])=><button className={tool===id?'tool active':'tool'} key={id} onClick={()=>setTool(id)}>{label}</button>)}</div><div className="panel"><label>Prompt</label><textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Describe what you want GitAI to do…"/><label>Context (optional)</label><textarea value={context} onChange={e=>setContext(e.target.value)} placeholder="Paste code, repository details, error logs, PR description…"/><button className="primary wide" onClick={()=>runAi()}>{aiLoading?'Generating…':'Generate with Gemini'}</button>{result&&<div className="ai-result"><ReactMarkdown>{result}</ReactMarkdown></div>}</div></section>}

      {tab==='chat' && <section className="chat panel"><div className="messages">{messages.map((m,i)=><div key={i} className={m.role==='user'?'msg user':'msg'}><ReactMarkdown>{m.content}</ReactMarkdown></div>)}</div><div className="chat-input"><textarea value={chat} onChange={e=>setChat(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendChat()}}} placeholder="Ask GitAI…"/><button className="primary" onClick={sendChat}>{aiLoading?'…':'Send'}</button></div></section>}

      {tab==='profile' && <section className="panel profile"><h2>GitAI Web</h2><p>This Vercel edition preserves the core product idea of the Android app: GitHub exploration plus Gemini-powered coding assistance.</p><div className="feature-list"><div><b>Public GitHub data</b><span>Search repositories and inspect README, files, issues, pull requests and commits.</span></div><div><b>AI tools</b><span>Code review, commit generation, PR summaries, debugging and explanations.</span></div><div><b>Local saves</b><span>Saved repositories are kept in your browser using localStorage.</span></div><div><b>Security</b><span>Gemini API credentials stay server-side in Vercel environment variables.</span></div></div></section>}

      {selected && <div className="overlay"><div className="drawer"><div className="drawer-head"><div><h2>{selected.full_name}</h2><p>{selected.description}</p></div><button className="icon" onClick={()=>setSelected(null)}>×</button></div><div className="tabs">{(['readme','code','issues','pulls','commits'] as const).map(t=><button className={repoTab===t?'tab active':'tab'} key={t} onClick={()=>loadRepoTab(t)}>{t}</button>)}</div>
        {repoTab==='readme'&&<div className="markdown"><ReactMarkdown>{readme||'No README found.'}</ReactMarkdown></div>}
        {repoTab==='code'&&<div className="code-layout"><div className="file-list"><div className="path">/{path||''}</div>{contents.map(c=><button key={c.path} onClick={()=>c.type==='dir'?loadContent(c.path):loadContent(c.path)} className="file">{c.type==='dir'?'📁':'📄'} {c.name}</button>)}</div>{code&&<div className="code-view"><div className="code-head"><b>{codeName}</b><button className="small" onClick={()=>{setContext(code);setPrompt(`Review ${codeName} for bugs, security issues, maintainability and concrete improvements.`);setTab('tools');setSelected(null)}}>AI Review</button></div><pre><code>{code}</code></pre></div>}</div>}
        {repoTab==='issues'&&<div className="items">{issues.map(i=><div className="item" key={i.number}><b>#{i.number} {i.title}</b><span>{i.state} · {i.user?.login||'unknown'} · {i.comments} comments</span><p>{i.body||''}</p></div>)}</div>}
        {repoTab==='pulls'&&<div className="items">{pulls.map(p=><div className="item" key={p.number}><b>#{p.number} {p.title}</b><span>{p.state} · {p.head?.ref||''} → {p.base?.ref||''}</span><p>{p.body||''}</p></div>)}</div>}
        {repoTab==='commits'&&<div className="items">{commits.map(c=><div className="item" key={c.sha}><b>{c.commit?.message?.split('\n')[0]}</b><span>{c.sha?.slice(0,8)} · {c.author?.login||c.commit?.author?.name||'unknown'}</span></div>)}</div>}
      </div></div>}
    </main>
  </div>
}
