import {enrichPdf} from './pdf-spec';
import {supplierDomains,type Directory} from './suppliers';
import {collectAdditional} from './supplier-collect';
import {cadEntries,extractCad} from './zip';
import * as cheerio from 'cheerio';
import {type Product,type Asset,fieldNames,unknown,safe,normalise,supplierHost} from './types';
const hosts=[...Object.keys(supplierDomains).flatMap(h=>[h,'www.'+h]),'static.wixstatic.com','static.wixstatic.com','drive.google.com','drive.usercontent.google.com','docs.google.com','moduplay.com.au','www.moduplay.com.au','vanrytind.com.au','www.vanrytind.com.au','kompan.com','www.kompan.com','assets.kompan.com','kompandam.blob.core.windows.net','images.ctfassets.net'];
export function allowed(u:string){const x=new URL(u);if(x.protocol!=='https:'||x.username||x.password||x.port||!hosts.includes(x.hostname.toLowerCase()))throw new Error('Unsupported file host');return x.toString()}
export async function remote(url:string,init?:RequestInit){
 let current=allowed(url);
 for(let i=0;i<5;i++){
  const r=await fetch(current,{...init,headers:{'User-Agent':'Mozilla/5.0 (compatible; LandscapeProductLibrary/1.0)','Accept':'*/*',...init?.headers},redirect:'manual',signal:AbortSignal.timeout(22000)});
  if(r.status>=300&&r.status<400){const loc=r.headers.get('location');if(!loc)throw new Error('Supplier redirect has no destination');current=allowed(new URL(loc,current).toString());continue;}
  if(!r.ok)throw new Error(`Supplier returned HTTP ${r.status}; sign-in or manual access may be required`);
  return r;
 }throw new Error('Too many redirects');
}
export async function bytes(r:Response,max=22*1024*1024){
 if(Number(r.headers.get('content-length')||0)>max)throw new Error('File exceeds 22 MB. Download from the supplier.');
 const reader=r.body?.getReader();if(!reader)throw new Error('Empty file');const chunks:Uint8Array[]=[];let size=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max)throw new Error('File too large');chunks.push(value)}}catch(e){await reader.cancel();throw e}
 const all=new Uint8Array(size);let offset=0;for(const c of chunks){all.set(c,offset);offset+=c.length}return all;
}
export function format(b:Uint8Array){const h=new TextDecoder().decode(b.slice(0,300));if(h.startsWith('AC10'))return {ext:'dwg',mime:'application/acad'};if(h.startsWith('%PDF'))return {ext:'pdf',mime:'application/pdf'};if(b[0]===137&&b[1]===80)return {ext:'png',mime:'image/png'};if(b[0]===255&&b[1]===216)return {ext:'jpg',mime:'image/jpeg'};if((/^\s*0\s+SECTION/.test(h))||h.startsWith('AutoCAD Binary DXF'))return {ext:'dxf',mime:'application/dxf'};if(h.startsWith('RIFF')&&h.includes('WEBP'))return {ext:'webp',mime:'image/webp'};throw new Error('Not a CAD, image or PDF file. Sign-in may be required.')}
export function proxy(url:string,filename='',inline=false){return '/api/file?url='+encodeURIComponent(url)+(filename?'&name='+encodeURIComponent(filename):'')+(inline?'&inline=1':'')}
function findProduct(o:any):any{if(!o||typeof o!=='object')return null;if(o.productReference&&o.productName)return o;for(const v of Object.values(o)){const r=findProduct(v);if(r)return r}return null}
function clean(s:string){return s.replace(/\s+/g,' ').trim()}
export async function collect(value:string):Promise<Product|Directory>{
 const url=normalise(value);if(!supplierHost(url))throw new Error('Unsupported supplier. See the supported supplier list.');
 const fetchUrl=new URL(url);if(['lypaproduct.com.au','ironcladwa.com.au'].includes(fetchUrl.hostname))fetchUrl.hostname='www.'+fetchUrl.hostname;
 const source=new TextDecoder().decode(await bytes(await remote(fetchUrl.toString()),6*1024*1024));const $=cheerio.load(source);
 const fields=Object.fromEntries(fieldNames.map(k=>[k,unknown])) as Product['fields'];
 const p:Product={id:url,name:'',code:'',url,fields,assets:[],notes:[],checkedAt:new Date().toISOString(),reviewed:false,fromSnapshot:false};
 const add=(role:string,u:string|undefined,kind:Asset['kind'],ext?:string)=>{if(!u)return;try{const full=allowed(new URL(u,url).toString());const suffix=ext||new URL(full).pathname.match(/\.(\w+)$/)?.[1]||(kind==='cad'?'dwg':kind==='pdf'?'pdf':'png');const filename=safe(p.name)+'_'+safe(p.code)+'_'+safe(role)+'.'+suffix;const a:Asset={role,url:proxy(full,filename),filename,kind,status:'available'};if(!p.assets.some(v=>v.url===a.url))p.assets.push(a);return a}catch{return}};
 if(new URL(url).hostname.includes('kompan.com')){
  const j=$('#__NEXT_DATA__').text();if(!j)throw new Error('KOMPAN product data unavailable');const d=findProduct(JSON.parse(j));if(!d)throw new Error('Use a KOMPAN product page URL');
  p.name=d.productName;p.code=d.productReference;fields.Supplier=url.includes('/au/')?'KOMPAN Australia':'KOMPAN';
  const details=d.details||[];fields.Material=details.filter((v:any)=>/wood|handle|membrane/i.test(v.name)).map((v:any)=>clean(v.description)).join(' ').slice(0,900)||unknown;
  fields.Finishes=details.filter((v:any)=>/paint|spring/i.test(v.name)).map((v:any)=>clean(v.description)).join(' ').slice(0,600)||unknown;
  fields.Colour=[...new Set((d.variants||[]).map((v:any)=>v.name))].join(' / ')||unknown;
  fields['Fixing options']=(d.anchorings||[]).filter((v:any)=>v.available).map((v:any)=>v.name).join(' / ')||unknown;
  fields.Price=d.price&&url.includes('/au/')?`AUD ${Number(d.price).toLocaleString('en-AU')} price guide; confirm GST, delivery and installation with supplier.`:unknown;
  if(/This price example is exclusive of GST/.test(source))fields.Price=fields.Price.replace('confirm GST, delivery and installation with supplier.','excluding GST, shipping and installation. Subject to change.');
  const v=(d.variants||[]).find((v:any)=>v.isMainVariant)||d.variants?.[0];p.image=add('Main_Image',v?.imageCad1?.url,'image')?.url;
  add('Supplier_2D_AS',d.twoDDrawing?.url,'cad');add('Footprint_AS',d.footprintDocument?.url,'pdf');add('Elevation_AS',d.sideprintDocument?.url,'pdf');
  p.plan=d.footprintImage?.url?proxy(allowed(d.footprintImage.url),'',true):undefined;p.planLabel='Supplier plan reference';
  for(const [i,v] of (d.productSheets||[]).entries())add('Product_Sheet_'+(i+1),v.sheetPdf?.url,'pdf');
  p.notes.push('Materials and finishes are supplier source excerpts. Confirm the selected item suffix, colour and footing before specifying.');
 }else if(new URL(url).hostname.includes('moduplay')){
  p.name=clean($('h1').first().text());p.code=clean($('.product__code').first().text());if(!p.code)throw new Error('Use a Moduplay product page URL');fields.Supplier='Moduplay';fields.Price=/Login or Register/.test(source)?'Login / registration required':unknown;
  const imgs=$('img').toArray().map(e=>$(e).attr('src')||'').filter(u=>u.toLowerCase().includes(p.code.toLowerCase()));
  p.image=add('Main_Image',imgs[0],'image')?.url;
  for(const u of imgs.slice(1)){const a=add(/top/i.test(u)?'Plan_Reference':'Elevation_Reference',u,'image');if(/top/i.test(u)&&a){p.plan=a.url;p.planLabel='Supplier plan reference'}}
  for(const e of $('a[href]').toArray()){const u=$(e).attr('href')!;if(/file_2d|\.(dwg|dxf)(?:$|\?)/i.test(u))add('Supplier_2D',u,'cad')}
  p.assets.push({role:'Product_Sheet',url:'/api/file?spec='+encodeURIComponent(url),filename:safe(p.name)+'_'+p.code+'_Product_Sheet.pdf',kind:'pdf',status:'available'});
  p.notes.push('Material, coating, colour and fixing details not explicitly found in the public product page require supplier confirmation.');
 }else if(new URL(url).hostname.includes('vanrytind.com.au')){
  const hs=$('h1').toArray().map(e=>clean($(e).text()));p.code=hs.find(x=>/^\d{3}-[A-Z0-9-]+$/i.test(x))||'';p.name=hs.find(x=>x!==p.code)||'';if(!p.code)throw new Error('Use a VRI product page URL');fields.Supplier='Van Ryt Industries';
  const text=clean($('main').text()||$('body').text());fields.Material=/Jarrah/i.test(text)?'WA Jarrah mentioned in product description; confirm all component materials.':unknown;
  fields.Colour=/colour options can be customised/i.test(text)?'Customisable colour options; final selection to be confirmed.':unknown;
  for(const e of $('a[href]').toArray()){const u=$(e).attr('href')!;if(/\.(dwg|dxf)(?:$|\?)/i.test(u))add('Supplier_2D',u,'cad');else if(/\.pdf(?:$|\?)/i.test(u))add('Product_Sheet',u,'pdf')}
  const imgs=$('img').toArray().map(e=>$(e).attr('src')||$(e).attr('data-src')||'').filter(u=>u.toLowerCase().includes(p.code.toLowerCase()));p.image=add('Main_Image',imgs[0],'image')?.url;
  const cad=p.assets.find(a=>a.kind==='cad');if(cad){p.plan=cad.url+'&thumbnail=1';p.planLabel='Embedded CAD thumbnail'}
 }
 else {const result=await collectAdditional(url,source);if('items' in result)return result;Object.assign(p,result);Object.assign(fields,result.fields);p.fields=fields}
 if(!p.name)throw new Error('Product name not found');fields['Product code']=p.code;
 // Validate CAD bytes: never turn a login/error page into a .dwg download.
 const expanded:Asset[]=[];
 for(const a of p.assets.filter(a=>a.kind==='cad'&&a.status==='available')){
  try{const params=new URL(a.url,'https://local').searchParams;const u=params.get('url')!;const b=await bytes(await remote(u));
   if(b[0]===80&&b[1]===75){const entries=cadEntries(b);if(!entries.length)throw new Error('No DWG or DXF found in supplier archive');for(const [i,entry] of entries.entries()){const f=format(extractCad(b,entry.name));const asset={...a,filename:safe(p.name)+'_'+safe(p.code)+'_'+safe(entry.name.replace(/\.\w+$/,''))+'.'+f.ext,url:proxy(u,safe(p.name)+'_'+safe(p.code)+'_'+safe(entry.name))+'&entry='+encodeURIComponent(entry.name)};if(i===0)Object.assign(a,asset);else expanded.push(asset)}}
   else {const f=format(b);if(!['dwg','dxf'].includes(f.ext))throw new Error('CAD requires supplier access');a.filename=a.filename.replace(/\.\w+$/,'.'+f.ext)}
  }catch(e){a.status='blocked';a.note=(e as Error).message}
 }
 p.assets.push(...expanded);
 if(!/kompan\.com|moduplay\.com\.au|vanrytind\.com\.au/.test(new URL(url).hostname))await enrichPdf(p);
 const dxf=p.assets.find(a=>a.kind==='cad'&&a.status==='available'&&a.filename.endsWith('.dxf'));
 if(dxf){p.plan=dxf.url+'&preview=1';p.planLabel='DXF geometry preview · Text and dimensions omitted'}
 fields['CAD status']=p.assets.some(a=>a.kind==='cad'&&a.status==='available')?'Supplier CAD available; verify plan content, units and layers in CAD.':'No publicly accessible CAD found; contact supplier or sign in.';
 return p;
}
export async function specBytes(url:string){if(!supplierHost(url)||!new URL(url).hostname.endsWith('moduplay.com.au'))throw new Error('Unsupported datasheet source');const s=new TextDecoder().decode(await bytes(await remote(url),6*1024*1024));const $=cheerio.load(s);const id=$('.btn-pdf-spec').first().attr('data-id');const m=s.match(/var nucleoAjax = (.*?);/);if(!id||!m)throw new Error('Datasheet generator unavailable');const d=JSON.parse(m[1]);const data=new URLSearchParams({action:'pdf_generate',nonce:d.nonce,id});return bytes(await remote(d.url,{method:'POST',body:data,headers:{'Content-Type':'application/x-www-form-urlencoded'}}));}
