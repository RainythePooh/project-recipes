import {extractText,getDocumentProxy} from 'unpdf';
import {type Product,unknown,safe} from './types';
import {bytes,remote,format} from './server';
export async function enrichPdf(p:Product){
 const asset=p.assets.find(a=>a.kind==='pdf'&&a.status==='available'&&!/Colour|BrochureBrowse/i.test(a.role));if(!asset)return;
 const source=new URL(asset.url,'https://local').searchParams.get('url');if(!source)return;
 let doc:Awaited<ReturnType<typeof getDocumentProxy>>|undefined;
 try{
  const b=await bytes(await remote(source),8*1024*1024);if(format(b).ext!=='pdf')throw new Error('Supplier did not return a PDF');
  doc=await getDocumentProxy(b,{useSystemFonts:false});if(doc.numPages>12)return;
  const {text}=await extractText(doc,{mergePages:true});const compact=text.replace(/\s+/g,' ').trim();
  if(p.code==='Not published'){
   const code=compact.match(/(?:Product Code|MCODE|Model Code)\s*:\s*([A-Z0-9][A-Z0-9._/-]+)/i)?.[1];
   if(code){p.code=code;p.fields['Product code']=code;for(const a of p.assets){a.filename=a.filename.replace('Not_published',safe(code));if(a.url.startsWith('/api/file?')){const u=new URL(a.url,'https://local');u.searchParams.set('name',a.filename);const previous=a.url;a.url=u.pathname+u.search;if(p.image===previous)p.image=a.url}}}
  }
  if(p.fields.Material===unknown){const material=compact.match(/Structural Members\s*:\s*(.+?)(?=Product Code|$)/i)?.[1];if(material)p.fields.Material=material.slice(0,900)}
  if(p.fields.Finishes===unknown){const matches=compact.match(/Hot Dip Galvani[sz]ed|Powder Coat(?:ed)? Finish|Anodised Finish|Oiled Finish/gi);if(matches)p.fields.Finishes=[...new Set(matches)].join('; ')}
  const fixings=[...new Set(compact.match(/\bSurface Fixed\b|\bSubsurface Fixed\b|\bFreestanding\b|Fixed to Side of Wall|Fixed on Top of Wall|\bIn-ground\b|\bBolt[ -]down\b/gi)||[])];
  if(fixings.length)p.fields['Fixing options']=(p.fields['Fixing options']===unknown?'':p.fields['Fixing options']+'; ')+fixings.join(' / ')+' (supplier datasheet options; confirm selected configuration)';
  if(p.fields.Colour===unknown&&/See Colour Chart/i.test(compact))p.fields.Colour='Select from supplier colour chart; confirm selected configuration.';
  p.notes.push('Technical fields supplemented from the linked supplier PDF.');
  if(!p.plan&&/TOP VIEW|\bTop\b|PLAN VIEW|Preliminary Drawings/i.test(text+' '+asset.role)){p.plan=asset.url+'&inline=1';p.planLabel='Supplier PDF drawing'}
 }catch(e){p.notes.push('Datasheet specification extraction unavailable; inspect the supplier PDF.');}finally{await doc?.loadingTask.destroy()}
}
