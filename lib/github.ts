const API='https://api.github.com';
export async function gh(path:string, init:RequestInit={}){
  const headers=new Headers(init.headers); headers.set('Accept','application/vnd.github+json'); headers.set('X-GitHub-Api-Version','2022-11-28');
  if(process.env.GITHUB_TOKEN) headers.set('Authorization',`Bearer ${process.env.GITHUB_TOKEN}`);
  const r=await fetch(API+path,{...init,headers,cache:'no-store'}); const text=await r.text(); let data:any; try{data=JSON.parse(text)}catch{data={message:text}}; if(!r.ok) throw new Error(data.message||`GitHub ${r.status}`); return data;
}
