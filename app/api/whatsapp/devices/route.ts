import { NextResponse } from 'next/server';
import { listDevices, pairQr, removeDevice, setStatus } from '@/lib/whatsapp-store';

export async function GET(){ return NextResponse.json({devices:listDevices()}); }
export async function PATCH(req:Request){
  const body=await req.json();
  if(body.token){ const device=pairQr(body.token,body.name,body.phone); return device?NextResponse.json({device}):NextResponse.json({error:'QR expired or invalid'}, {status:400}); }
  if(body.id && body.status){ const device=setStatus(body.id,body.status); return device?NextResponse.json({device}):NextResponse.json({error:'Device not found'},{status:404}); }
  return NextResponse.json({error:'Invalid request'},{status:400});
}
export async function DELETE(req:Request){
  const body=await req.json();
  if(!body.id) return NextResponse.json({error:'id required'},{status:400});
  return NextResponse.json({removed:removeDevice(body.id)});
}
