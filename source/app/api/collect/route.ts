import {collect} from '@/lib/server';
import seed from '@/lib/seed.json';
import {normalise} from '@/lib/types';
export async function POST(req:Request){try{if(Number(req.headers.get('content-length')||0)>8000)return Response.json({error:'Request too large'},{status:413});const {url,refresh}=await req.json() as {url?:unknown;refresh?:boolean};if(typeof url!=='string'||url.length>2000)throw new Error('Enter a valid product URL');const key=normalise(url);const known=seed.find(p=>normalise(p.url)===key);if(known&&!refresh)return Response.json({product:known});const product=await collect(key);return Response.json('items' in product?{directory:product}:{product});}catch(e){return Response.json({error:(e as Error).message||'Collection unavailable. Try again.'},{status:422})}}
