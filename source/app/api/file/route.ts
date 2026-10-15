import {extractCad} from '@/lib/zip';
import {dxfPreview} from '@/lib/dxf-preview';
import {bytes,format,remote,specBytes} from '@/lib/server';
import {safe} from '@/lib/types';
export async function GET(req:Request){try{const u=new URL(req.url);const source=u.searchParams.get('url');const spec=u.searchParams.get('spec');if((!source&&!spec)||(source?.length||0)>2500)throw new Error('Invalid file URL');let b=spec?await specBytes(spec):await bytes(await remote(source!));if(u.searchParams.has('entry'))b=extractCad(b,u.searchParams.get('entry')!);let f=format(b);
 if(u.searchParams.has('preview')){if(f.ext!=='dxf')throw new Error('DXF preview unavailable');return new Response(dxfPreview(b),{headers:{'Content-Type':'image/svg+xml','Cache-Control':'public, max-age=3600','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'"}})}
 if(u.searchParams.has('thumbnail')){if(f.ext!=='dwg')throw new Error('No CAD thumbnail');const sig=[137,80,78,71,13,10,26,10];let start=-1,end=-1;for(let i=0;i<b.length-8;i++){if(sig.every((v,k)=>b[i+k]===v)){start=i;break}}if(start>=0){for(let i=start;i<b.length-8;i++){if(b[i]===73&&b[i+1]===69&&b[i+2]===78&&b[i+3]===68){end=i+8;break}}}if(start<0||end<0)throw new Error('This DWG has no readable thumbnail');b=b.slice(start,end);f={ext:'png',mime:'image/png'}}
 const filename=safe(u.searchParams.get('name')||'Supplier_File').replace(/\.(dwg|dxf|png|jpg|jpeg|pdf|webp)$/i,'')+'.'+f.ext;
 return new Response(b as unknown as BodyInit,{headers:{'Content-Type':f.mime,'Content-Disposition':`${u.searchParams.has('inline')||u.searchParams.has('thumbnail')?'inline':'attachment'}; filename="${filename}"`,'Cache-Control':'public, max-age=3600','X-Content-Type-Options':'nosniff'}});
 }catch(e){return Response.json({error:(e as Error).message},{status:422})}}
