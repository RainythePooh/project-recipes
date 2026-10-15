import * as cheerio from 'cheerio';
import {type Product,type Asset,fieldNames,unknown,safe,normalise,supplierHost} from './types';
import {supplierName,type Directory} from './suppliers';
import {allowed,proxy,remote,bytes} from './server';
const clean=(s:string)=>s.replace(/\s+/g,' ').trim();
const label=(s:string)=>decodeURIComponent(s).replace(/[-_]/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
export function pageKind(url:string):'product'|'category'{const u=new URL(url),h=u.hostname,p=u.pathname;
 if(/willplay/.test(h))return /^\/[^/]+\/[^/]+\/?$/.test(p)&&!/^\/(post|blog|projects)/.test(p)?'product':'category';
 if(/lypaproduct/.test(h))return /^\/play\/.+/.test(p)?'product':'category';
 if(/ironclad/.test(h))return /^\/(?:[^/]+-shelter|project\/[^/]+|portfolio-items\/[^/]+)\/?$/.test(p)&&!/^\/(custom-shelter|standard-shelter)\/?$/.test(p)?'product':'category';
 return /^\/product\/[^/]+\/?$/.test(p)?'product':'category';
}
export async function collectAdditional(url:string,source:string):Promise<Product|Directory>{
 const $=cheerio.load(source),host=new URL(url).hostname,name=supplierName(url),isLypa=/lypaproduct/.test(host);
 const base=new URL($('base').attr('href')||url,url).toString();
 const full=(v:string)=>new URL(v,base).toString();
 if(pageKind(url)==='category'){
  const found=new Map<string,Directory['items'][number]>();
  const add=(u:string,n:string,kind?:'product'|'category')=>{try{u=normalise(full(u));if(!supplierHost(u)||u===normalise(url))return;const k=kind||pageKind(u);if(!found.has(u))found.set(u,{name:n.slice(0,160)||label(new URL(u).pathname.split('/').filter(Boolean).pop()||name),url:u,kind:k})}catch{}};
  // Lypa's main website delegates its catalogue to its official product website.
  if(/lypa\.com\.au/.test(host))add('https://www.lypaproduct.com.au/','Browse Lypa products','category');
  for(const e of $('a[href]').toArray()){
   const a=$(e),raw=a.attr('href')||'';let u:URL;try{u=new URL(raw,base)}catch{continue}
   if(!supplierHost(u.toString())||!raw||raw.startsWith('#')||/\.(pdf|zip|jpg|png|svg)$/i.test(u.pathname))continue;
   const same=supplierName(u.toString())===name;if(!same)continue;
   const k=pageKind(u.toString());
   if(k==='category'&&!/product-category|\/products\/?$|\/our-range|\/range\/|\/ranges|\/standard-products|\/projects\/?$|\/portfolio_category\/|\/page\/|[?&](page|paged)=/.test(u.toString()))continue;
   const heading=clean(a.find('h2,h3,h4,figcaption').first().text());let title=heading||clean(a.text());
   if(!title||/^(View Product|Read More|View|\d+)$/i.test(title))title=label(u.pathname.split('/').filter(Boolean).pop()||'Browse products');
   // Lypa cards carry the product name before the options count and description.
   if(isLypa)title=title.split(/\s+\d+\s+Options?/i)[0];
   add(u.toString(),title,k);
  }
  if(!found.size)throw new Error('No product links found on this page. Paste a specific product URL.');
  return {name,url,items:[...found.values()].sort((a,b)=>a.kind===b.kind?0:a.kind==='product'?-1:1).slice(0,250)};
 }
 $('script,style,nav,header,footer,noscript,form,.related,.related-products').remove();
 const root:cheerio.Cheerio<any>=isLypa?$.root():$('main').length?$('main').first():$.root();
 const text=clean(root.text());
 const fields=Object.fromEntries(fieldNames.map(k=>[k,unknown])) as Product['fields'];fields.Supplier=name;
 const p:Product={id:url,url,name:clean($('.product_title').first().text()||$('h1').first().text()),code:'Not published',fields,assets:[],notes:[],checkedAt:new Date().toISOString(),reviewed:false,fromSnapshot:false};
 function add(role:string,raw:string|undefined,kind:Asset['kind'],ext?:string){if(!raw)return;try{let u=full(raw);if(/streetfurniture\.com/.test(u)){const stable=new URL(u);stable.searchParams.delete('refresh');u=stable.toString()}if(/static\.wixstatic\.com\/media\//.test(u))u=u.split('/v1/')[0];allowed(u);const extension=ext||new URL(u).pathname.match(/\.(\w{2,5})$/)?.[1]||(kind==='pdf'?'pdf':kind==='cad'?'dwg':'jpg');const filename=safe(p.name)+'_'+safe(p.code)+'_'+safe(role)+'.'+extension;if(p.assets.some(a=>new URL(a.url,'https://local').searchParams.get('url')===u))return;p.assets.push({role,url:proxy(u,filename),filename,kind,status:'available'});return p.assets[p.assets.length-1]}catch{return}}
 const section=(title:RegExp)=>{const h=root.find('h2,h3,h4,h5,h6,dt').filter((_,e)=>title.test(clean($(e).text()))).first();return h.length?clean(h.nextUntil('h2,h3,h4,h5,h6,dt').text()):''};
 if(/willplay/.test(host)){
  p.code=clean(root.find('h1,h2').first().text())||new URL(url).pathname.split('/').pop()!.toUpperCase();p.name=p.code+' · '+(text.match(new RegExp(p.code+'\\s*([^]+?)Complies'))?.[1]?.trim()||'Play Equipment');
  fields.Material=(text.split('Product Materials')[1]||'').split(/DXF Plan|Product Spec Sheet|Downloads/)[0].trim()||unknown;
  fields.Finishes=[...new Set(fields.Material.match(/Powder Coated (?:Marine Grade Aluminum|Stainless Steel)/gi)||[])].join('; ')||unknown;
 }else if(/lypaproduct/.test(host)){
  p.name=clean($('h3').first().text())||label(new URL(url).pathname.split('/').pop()!);p.code=clean($('figure.selected .code').first().text()||$('.code').first().text())||'Not published';
  fields.Material=section(/^DESCRIPTION$/i)||unknown;
  const variants=[...new Set($('figure .code').map((_,e)=>clean($(e).text())).get())];if(variants.length>1)p.notes.push('Multiple variants available: '+variants.join(', ')+'. Data reflects the selected supplier variant.');
 }else if(/activediscovery/.test(host)){
  p.code=clean($('.sku').first().text())||text.match(/Product Code:\s*([A-Za-z0-9][A-Za-z0-9 ._-]*?)(?=Category|Partner|Downloads|$)/)?.[1]?.trim()||'Not published';
  fields.Material=section(/^Materials?$/i)||unknown;
 }else if(/landmarkpro/.test(host)){
  const codes=[...new Set((text.match(/\b(?:KF|KSC|FFS[A-Z])[A-Z0-9-]+\b/g)||[]))];p.code=clean($('.sku').first().text())||codes.join(', ')||'Not published';
  fields.Material=[section(/^Frame$/i),section(/^Slats$/i),section(/^Materials?$/i)].filter(Boolean).join('; ')||unknown;
  fields.Finishes=[...new Set(text.match(/Powdercoated Finish|Powder Coat(?:ed)? Finish|Cutek Stain|Hot Dip Galvani[sz]ed/gi)||[])].join('; ')||unknown;
  fields['Fixing options']=section(/^Features$/i).split(/(?<=\.)\s/).filter(s=>/bolt|mount|fix|anchor/i.test(s)).join('; ')||unknown;
 }else if(/streetfurniture/.test(host)){
  fields.Material=text.match(/Materials\s+(.+?)(?=2D\/3D Models|Resources|Detail matters)/)?.[1]?.trim()||unknown;
  fields.Finishes=[...new Set(fields.Material.match(/Powder Coated|Anodised|Woodgrain|Oiled|Raw/gi)||[])].join('; ')||unknown;
  fields['Fixing options']=text.match(/Choose (.+?)(?=, in straight|\. )/)?.[1]||unknown;
  p.code=clean($('.sku').first().text())||'Not published';
  if($('.dd-cad-login-popup').length)p.assets.push({role:'Supplier_2D',url:proxy(url),filename:safe(p.name)+'_CAD.dwg',kind:'cad',status:'blocked',note:'Supplier account required for CAD access.'});
 }else if(/ironclad/.test(host)){
  p.notes.push('Confirm product code, material options, finish and fixing with IronClad WA. Project photos may show custom configurations.');
  // Standard-product brochures are linked from the catalogue, rather than each photo page.
  const catalogue=new TextDecoder().decode(await bytes(await remote('https://www.ironcladwa.com.au/standard-products/'),6*1024*1024));const cat=cheerio.load(catalogue);const slug=p.name.split(' ')[0].toLowerCase();
  cat('a[href]').each((_,e)=>{const href=cat(e).attr('href')!;if(/\.pdf/i.test(href)&&href.toLowerCase().includes(slug))add('Product_Sheet',href,'pdf')});
 }
 if(!p.name||/Page not found|404|Access Denied/i.test(p.name))throw new Error('Product details unavailable. Check the supplier page.');
 // Keep extraction scoped to this product, not the supplier navigation or related-product cards.
 const description=fields.Material!==unknown?fields.Material:clean(root.find('.woocommerce-product-details__short-description,.product-description').first().text());
 if(fields.Finishes===unknown)fields.Finishes=[...new Set(description.match(/powder[ -]?coat(?:ed|ing)?|galvani[sz]ed|honed|polished|oiled|painted/gi)||[])].join('; ')||unknown;
 const explicit=root.find('tr').toArray();for(const row of explicit){const cells=$(row).find('th,td');const key=clean(cells.first().text()),value=clean(cells.slice(1).text());if(!value)continue;if(/^colou?rs?$/i.test(key))fields.Colour=value;if(/^fixing|^mounting|^installation options/i.test(key))fields['Fixing options']=value;if(/^materials?$/i.test(key))fields.Material=value}
 const price=clean(root.find('.summary .price').first().text());if(price&&/\$|AUD/.test(price))fields.Price=price+'; confirm GST, delivery and installation.';
 let img:string|undefined;
 if(isLypa)img=$('img').map((_,e)=>$(e).attr('src')).get().find(u=>/ProductImage/i.test(u)&&!u.includes('?'));
 else if(/willplay/.test(host))img=root.find('img').first().attr('src');
 else if(/ironclad/.test(host))img=root.find('a[href]').map((_,e)=>$(e).attr('href')).get().find(u=>/\.(jpg|jpeg|png)(\?|$)/i.test(u));
 else img=$('meta[property="og:image"]').attr('content')||root.find('.woocommerce-product-gallery img').first().attr('data-src')||root.find('.woocommerce-product-gallery img').first().attr('src');
 if(!img)img=root.find('img').map((_,e)=>$(e).attr('data-src')||$(e).attr('src')||'').get().find(u=>u&&!/logo|icon|data:image|\.svg/i.test(u));
 p.image=add('Main_Image',img,'image')?.url;
 for(const e of root.find('a[href]').toArray()){
  const raw=$(e).attr('href')||'',title=clean($(e).text());if(!raw||raw.startsWith('javascript:'))continue;
  if(/\.(dwg|dxf)(?:$|\?)|\.zip(?:$|\?)/i.test(raw)&&(/\.(dwg|dxf)/i.test(raw)||/CAD|DXF|DWG|plan/i.test(title)))add('Supplier_2D',raw,'cad');
  else if(/CAD Plan/i.test(title))add('Supplier_2D',raw,'cad');
  else if(/\.pdf(?:$|\?)/i.test(raw)||(/Datasheet|Tech Sheet|Colour Chart|Specification Sheet/.test(title)&&/wpdmdl=|_the\/doc\/file/.test(raw)))add((title||'Product_Sheet').slice(0,100),raw,'pdf');
  else if(/drive.google.com\/file\/d\//.test(raw)){const id=raw.match(/\/d\/([^/]+)/)?.[1];if(id)add('Product_Sheet','https://drive.google.com/uc?export=download&id='+id,'pdf')}
 }
 p.name=p.name.slice(0,250);p.code=p.code.slice(0,200);fields['Product code']=p.code;for(const k of fieldNames)fields[k]=fields[k].slice(0,1800);
 return p;
}
