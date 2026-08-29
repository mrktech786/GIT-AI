import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req:NextRequest){
  try{
    if(!process.env.GEMINI_API_KEY) return NextResponse.json({error:'GEMINI_API_KEY is not configured in Vercel.'},{status:500});
    const body=await req.json(); const tool=body.tool||'CHAT'; const prompt=String(body.prompt||''); const context=String(body.context||''); const history=Array.isArray(body.history)?body.history:[];
    if(!prompt.trim()) return NextResponse.json({error:'Prompt is required.'},{status:400});
    const ai=new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY});
    const system=`You are GitAI, a senior software engineer and GitHub assistant. Tool: ${tool}. Be practical, concise, technically accurate. Never invent repository facts. If code is provided, analyze the actual code. For commit messages use Conventional Commits when appropriate. Context: ${context.slice(0,30000)}`;
    const historyText=history.slice(-12).map((m:any)=>`${m.role}: ${m.content}`).join('\n');
    const contents=tool==='CHAT'&&historyText?`${system}\nConversation:\n${historyText}\nuser: ${prompt}`:`${system}\nUser request:\n${prompt}`;
    const response=await ai.models.generateContent({model:'gemini-2.5-flash',contents});
    return NextResponse.json({text:response.text||'No response generated.'});
  }catch(e:any){return NextResponse.json({error:e.message||'Gemini request failed'},{status:500})}
}
