'use client';

import { useEffect, useMemo, useState } from 'react';

type Status = 'online'|'syncing'|'offline';
type Device = { id:string; name:string; phone:string; status:Status; lastSeen:string; unread:number; messages:number };
type Chat = { id:string; deviceId:string; name:string; phone:string; preview:string; time:string; unread:number; avatar:string };

const seedDevices:Device[] = [
  {id:'wa-1',name:'Sales Account',phone:'+92 300 1234567',status:'online',lastSeen:'Now',unread:8,messages:126},
  {id:'wa-2',name:'Support Team 1',phone:'+92 301 7654321',status:'online',lastSeen:'Now',unread:3,messages:84},
  {id:'wa-3',name:'Personal',phone:'+92 333 9876543',status:'syncing',lastSeen:'1 min ago',unread:1,messages:42},
  {id:'wa-4',name:'Orders',phone:'+92 312 4455667',status:'offline',lastSeen:'18 min ago',unread:0,messages:31},
  {id:'wa-5',name:'Marketing',phone:'+92 320 1122334',status:'online',lastSeen:'Now',unread:12,messages:211}
];
const seedChats:Chat[] = [
  {id:'c1',deviceId:'wa-1',name:'Ali Traders',phone:'+92 301 1112223',preview:'Can you confirm the order?',time:'10:18',unread:2,avatar:'AT'},
  {id:'c2',deviceId:'wa-2',name:'Ayesha Khan',phone:'+92 333 4445566',preview:'Thank you! I received it.',time:'10:12',unread:1,avatar:'AK'},
  {id:'c3',deviceId:'wa-5',name:'Bilal Ahmed',phone:'+92 322 7788990',preview:'Is the campaign live?',time:'09:54',unread:4,avatar:'BA'},
  {id:'c4',deviceId:'wa-1',name:'Hassan Store',phone:'+92 300 8877665',preview:'Please send the invoice.',time:'09:41',unread:0,avatar:'HS'},
  {id:'c5',deviceId:'wa-3',name:'Sara',phone:'+92 315 9988776',preview:'See you tomorrow.',time:'Yesterday',unread:0,avatar:'SA'}
];

function QrCode({seed}:{seed:string}){
  const cells=useMemo(()=>Array.from({length:361},(_,i)=>{let n=(i*9301+seed.length*49297+i*i*233)%997; return n>490; }),[seed]);
  return <div className="qr">{cells.map((on,i)=><i key={i} className={on?'on':''}/>)}</div>;
}

export default function Home(){
  const [section,setSection]=useState<'overview'|'devices'|'inbox'|'broadcast'|'automation'|'analytics'|'settings'>('overview');
  const [devices,setDevices]=useState<Device[]>(seedDevices);
  const [chats]=useState<Chat[]>(seedChats);
  const [selectedDevice,setSelectedDevice]=useState('all');
  const [selectedChat,setSelectedChat]=useState<Chat|null>(seedChats[0]);
  const [message,setMessage]=useState('');
  const [qrOpen,setQrOpen]=useState(false);
  const [qrDevice,setQrDevice]=useState<Device|null>(null);
  const [newName,setNewName]=useState('');
  const [search,setSearch]=useState('');
  const [toast,setToast]=useState('');

  useEffect(()=>{ const raw=localStorage.getItem('wa-hub-devices'); if(raw) setDevices(JSON.parse(raw)); },[]);
  useEffect(()=>localStorage.setItem('wa-hub-devices',JSON.stringify(devices)),[devices]);
  const notify=(text:string)=>{setToast(text);window.setTimeout(()=>setToast(''),2200)};
  const addDevice=()=>{setQrDevice(null);setQrOpen(true);};
  const completePair=()=>{
    const id=`wa-${Date.now()}`; const phone=`+92 ${300+Math.floor(Math.random()*100)} ${Math.floor(1000000+Math.random()*8999999)}`;
    setDevices(d=>[...d,{id,name:newName.trim()||`WhatsApp ${d.length+1}`,phone,status:'online',lastSeen:'Now',unread:0,messages:0}]);
    setNewName('');setQrOpen(false);notify('WhatsApp device linked successfully');
  };
  const disconnect=(id:string)=>{setDevices(d=>d.map(x=>x.id===id?{...x,status:'offline',lastSeen:'Just now'}:x));notify('Device disconnected');};
  const rename=(id:string)=>{const name=window.prompt('New account alias');if(name?.trim())setDevices(d=>d.map(x=>x.id===id?{...x,name:name.trim()}:x));};
  const send=()=>{if(!message.trim()||!selectedChat)return;setMessage('');notify(`Message sent via ${devices.find(d=>d.id===selectedChat.deviceId)?.name||'WhatsApp'}`);};
  const online=devices.filter(d=>d.status==='online').length;
  const filteredChats=chats.filter(c=>(selectedDevice==='all'||c.deviceId===selectedDevice)&&`${c.name} ${c.phone} ${c.preview}`.toLowerCase().includes(search.toLowerCase()));

  const nav=[['overview','Overview','⌂'],['devices','WhatsApp Devices','▦'],['inbox','Unified Inbox','▤'],['broadcast','Broadcast','◉'],['automation','Automation','✦'],['analytics','Analytics','⌁'],['settings','Settings','⚙']] as const;
  return <div className="wa-app">
    <aside className="wa-sidebar">
      <div className="wa-brand"><div className="wa-logo">◔</div><div><b>WA Hub</b><span>Multi WhatsApp</span></div></div>
      <button className="add-device" onClick={addDevice}>＋ Link WhatsApp</button>
      <nav>{nav.map(([id,label,icon])=><button key={id} className={section===id?'active':''} onClick={()=>setSection(id)}><span>{icon}</span>{label}{id==='inbox'&&<em>24</em>}</button>)}</nav>
      <div className="side-bottom"><div className="connection"><i/> All systems operational</div><small>Secure multi-account workspace</small></div>
    </aside>

    <main className="wa-main">
      <header className="wa-topbar"><div><h1>{nav.find(n=>n[0]===section)?.[1]}</h1><p>Manage all your WhatsApp accounts from one professional dashboard.</p></div><div className="top-actions"><span className="live"><i/> {online} online</span><button className="avatar">MR</button></div></header>

      {section==='overview'&&<section className="wa-content">
        <div className="hero"><div><span className="eyebrow">MULTI-ACCOUNT CONTROL CENTER</span><h2>One dashboard.<br/><strong>All your WhatsApp.</strong></h2><p>Link 5, 10, 15 or more accounts and manage chats, broadcasts and automations from one place.</p><button onClick={addDevice}>＋ Link another account</button></div><div className="hero-orb"><div className="orb-ring">◔</div><span>Unlimited<br/>connections</span></div></div>
        <div className="stats"><div><span>Total Devices</span><b>{devices.length}</b><small>↑ Ready to scale</small></div><div><span>Active Connections</span><b>{online}</b><small>Live now</small></div><div><span>Messages Today</span><b>1,248</b><small>↑ 18.4% vs yesterday</small></div><div><span>Failed Messages</span><b>7</b><small>↓ 3.2% improvement</small></div></div>
        <div className="section-head"><div><h3>Connected WhatsApp Accounts</h3><p>Monitor and control every linked number.</p></div><button className="ghost" onClick={()=>setSection('devices')}>View all →</button></div>
        <div className="device-grid">{devices.slice(0,6).map(d=><DeviceCard key={d.id} d={d} onQr={()=>{setQrDevice(d);setQrOpen(true)}} onDisconnect={()=>disconnect(d.id)} onRename={()=>rename(d.id)} />)}</div>
      </section>}

      {section==='devices'&&<section className="wa-content"><div className="toolbar"><div><h3>WhatsApp Devices</h3><p>{devices.length} linked accounts • Add as many as your infrastructure supports.</p></div><button className="primary" onClick={addDevice}>＋ Link WhatsApp</button></div><div className="device-grid full">{devices.map(d=><DeviceCard key={d.id} d={d} onQr={()=>{setQrDevice(d);setQrOpen(true)}} onDisconnect={()=>disconnect(d.id)} onRename={()=>rename(d.id)} />)}</div></section>}

      {section==='inbox'&&<section className="inbox"><div className="inbox-left"><div className="inbox-head"><div><h3>Unified Inbox</h3><span>{chats.length} conversations</span></div><select value={selectedDevice} onChange={e=>setSelectedDevice(e.target.value)}><option value="all">All accounts</option>{devices.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></div><input className="chat-search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search conversations…"/>{filteredChats.map(c=><button key={c.id} className={selectedChat?.id===c.id?'chat-row selected':'chat-row'} onClick={()=>setSelectedChat(c)}><div className="chat-avatar">{c.avatar}</div><div><b>{c.name}</b><small>{devices.find(d=>d.id===c.deviceId)?.name}</small><p>{c.preview}</p></div><aside><span>{c.time}</span>{c.unread>0&&<em>{c.unread}</em>}</aside></button>)}</div><div className="conversation">{selectedChat?<><div className="conv-head"><div className="chat-avatar">{selectedChat.avatar}</div><div><b>{selectedChat.name}</b><span>{selectedChat.phone} · via {devices.find(d=>d.id===selectedChat.deviceId)?.name}</span></div><button>⋮</button></div><div className="messages"><div className="date-pill">Today</div><div className="bubble them">Hello! How can we help you today?<small>10:14 ✓✓</small></div><div className="bubble me">Hi, I wanted to confirm my order.<small>10:16 ✓✓</small></div><div className="bubble them">Can you confirm the order number for me?<small>10:18</small></div></div><div className="composer"><button>＋</button><input value={message} onChange={e=>setMessage(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Type a message…"/><button className="send" onClick={send}>➤</button></div></>:<div className="empty-chat">Select a conversation</div>}</div></section>}

      {section==='broadcast'&&<section className="wa-content"><div className="toolbar"><div><h3>Broadcast Center</h3><p>Send campaigns from one or multiple linked accounts.</p></div></div><div className="broadcast-layout"><div className="panel"><label>Sending accounts</label><div className="check-list">{devices.map(d=><label key={d.id}><input type="checkbox" defaultChecked={d.status==='online'}/><span>{d.name}</span><small>{d.phone}</small></label>)}</div></div><div className="panel"><label>Message template</label><textarea placeholder="Write your broadcast message…"/><div className="broadcast-foot"><span>0 / 4096</span><button className="primary" onClick={()=>notify('Broadcast queued for selected accounts')}>Schedule / Send</button></div></div></div></section>}

      {section==='automation'&&<section className="wa-content"><div className="toolbar"><div><h3>Automation & Chatbots</h3><p>Configure auto-replies for each WhatsApp account.</p></div><button className="primary" onClick={()=>notify('Automation rule created')}>＋ New rule</button></div><div className="automation-grid">{['Welcome message','Away response','Order status bot','FAQ assistant'].map((x,i)=><div className="automation-card" key={x}><div className="automation-icon">✦</div><div><b>{x}</b><p>{['Greet new customers automatically.','Reply outside business hours.','Send live order updates.','Answer common questions.'][i]}</p></div><label className="switch"><input type="checkbox" defaultChecked={i<2}/><i/></label></div>)}</div></section>}

      {section==='analytics'&&<section className="wa-content"><div className="toolbar"><div><h3>Analytics</h3><p>Performance across all linked accounts.</p></div><select><option>Last 7 days</option><option>Last 30 days</option></select></div><div className="analytics-grid"><div className="big-chart"><div className="chart-head"><b>Messages</b><span>1,248 total</span></div><div className="bars">{[42,64,51,78,60,88,72,95,68,83,76,100,91,86].map((h,i)=><i key={i} style={{height:`${h}%`}}/>)}</div></div><div className="panel"><b>Account performance</b>{devices.map(d=><div className="perf" key={d.id}><span>{d.name}</span><b>{d.messages+Math.floor(Math.random()*20)}</b><i><em style={{width:`${Math.min(100,30+d.messages/3)}%`}}/></i></div>)}</div></div></section>}

      {section==='settings'&&<section className="wa-content"><div className="panel settings"><h3>Workspace Settings</h3><div className="setting"><div><b>Session persistence</b><p>Keep WhatsApp sessions stored by your backend session manager.</p></div><label className="switch"><input type="checkbox" defaultChecked/><i/></label></div><div className="setting"><div><b>Realtime WebSocket events</b><p>Receive connection, message and sync events instantly.</p></div><label className="switch"><input type="checkbox" defaultChecked/><i/></label></div><div className="setting"><div><b>API integration mode</b><p>Baileys / whatsapp-web.js adapter endpoints are ready for server integration.</p></div><span className="badge">READY</span></div></div></section>}

      {toast&&<div className="toast">✓ {toast}</div>}
      {qrOpen&&<div className="modal-backdrop"><div className="qr-modal"><button className="close" onClick={()=>setQrOpen(false)}>×</button><span className="eyebrow">SECURE DEVICE PAIRING</span><h2>{qrDevice?'Re-link':'Link'} WhatsApp</h2><p>Open WhatsApp → Linked devices → Link a device, then scan this QR code.</p><QrCode seed={qrDevice?.id||'new-device'}/><div className="qr-status"><i/> Waiting for scan…</div><input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Account alias (e.g. Sales Account)"/><button className="primary wide" onClick={completePair}>Simulate successful scan</button><small>This demo UI is integration-ready; the production QR should be emitted by your Baileys/WhatsApp Web backend.</small></div></div>}
    </main>
  </div>
}

function DeviceCard({d,onQr,onDisconnect,onRename}:{d:Device;onQr:()=>void;onDisconnect:()=>void;onRename:()=>void}){return <article className="device-card"><div className="device-top"><div className="wa-device-icon">◔</div><span className={`status ${d.status}`}><i/>{d.status}</span><button className="more">⋮</button></div><h4>{d.name}</h4><p className="phone">{d.phone}</p><div className="device-meta"><span>💬 {d.messages} msgs</span><span>◷ {d.lastSeen}</span>{d.unread>0&&<b>{d.unread} unread</b>}</div><div className="device-actions"><button onClick={onQr}>QR / Reconnect</button><button onClick={onRename}>Rename</button><button className="danger" onClick={onDisconnect}>Disconnect</button></div></article>}
