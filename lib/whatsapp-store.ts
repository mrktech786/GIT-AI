export type WaStatus = 'online' | 'syncing' | 'offline';
export type WaDevice = { id:string; name:string; phone:string; status:WaStatus; lastSeen:string; createdAt:string };

const devices = new Map<string, WaDevice>();
const qrTokens = new Map<string, { deviceId:string; createdAt:number }>();

export function listDevices(){ return [...devices.values()]; }
export function getDevice(id:string){ return devices.get(id); }
export function createQr(deviceId?:string){
  const id = deviceId || `wa-${crypto.randomUUID()}`;
  const token = crypto.randomUUID();
  qrTokens.set(token,{deviceId:id,createdAt:Date.now()});
  return { token, deviceId:id, qr:`wa-hub://pair/${token}` };
}
export function pairQr(token:string,name?:string,phone?:string){
  const item=qrTokens.get(token); if(!item || Date.now()-item.createdAt>120000) return null;
  const existing=devices.get(item.deviceId);
  const device:WaDevice={id:item.deviceId,name:name?.trim()||existing?.name||`WhatsApp ${devices.size+1}`,phone:phone||existing?.phone||'Pending number',status:'online',lastSeen:new Date().toISOString(),createdAt:existing?.createdAt||new Date().toISOString()};
  devices.set(device.id,device); qrTokens.delete(token); return device;
}
export function setStatus(id:string,status:WaStatus){ const d=devices.get(id); if(!d) return null; const next={...d,status,lastSeen:new Date().toISOString()}; devices.set(id,next); return next; }
export function removeDevice(id:string){ return devices.delete(id); }
