import { NextResponse } from 'next/server';
import { createQr } from '@/lib/whatsapp-store';

export async function POST(req:Request){
  const body=await req.json().catch(()=>({}));
  return NextResponse.json(createQr(body.deviceId));
}
