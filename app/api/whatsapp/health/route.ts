import { NextResponse } from 'next/server';
export async function GET(){ return NextResponse.json({ok:true,provider:'baileys-adapter',mode:'integration-ready',timestamp:new Date().toISOString()}); }
