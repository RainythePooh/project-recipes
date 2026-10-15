import {PDFDocument, rgb, type PDFFont} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import {pricingFor,lineTotal,priceSummary,money} from './pricing';
import {fieldNames,type Product} from './types';
const green=rgb(.125,.302,.259),ink=rgb(.14,.21,.19),muted=rgb(.35,.43,.4),line=rgb(.83,.88,.85);
export async function makePdf(products:Product[],load:(url:string)=>Promise<Uint8Array>=async url=>{const r=await fetch(url);if(!r.ok)throw new Error('Unable to load '+url);return new Uint8Array(await r.arrayBuffer())}){
 const doc=await PDFDocument.create();doc.registerFontkit(fontkit);
 const [regular,bold]=await Promise.all([load('/fonts/Vera.ttf'),load('/fonts/VeraBd.ttf')]);
 const font=await doc.embedFont(regular,{subset:true}),strong=await doc.embedFont(bold,{subset:true});
 const charset=new Set(font.getCharacterSet());const text=(s:string)=>[...s.replace(/[\u2010-\u2015]/g,'-').replace(/[\u2018\u2019]/g,"'")].map(c=>charset.has(c.codePointAt(0)!)?c:'?').join('');
 function wrap(s:string,size:number,width:number,f:PDFFont=font){const lines:string[]=[];for(const para of text(s).split('\n')){let line='';for(let word of para.split(/\s+/)){if(!word)continue;if(f.widthOfTextAtSize(word,size)>width){for(const c of word){if(f.widthOfTextAtSize(line+c,size)>width){lines.push(line);line=''}line+=c}continue}const candidate=line?line+' '+word:word;if(f.widthOfTextAtSize(candidate,size)>width&&line){lines.push(line);line=word}else line=candidate}lines.push(line)}return lines}
 let page=doc.addPage([595.28,841.89]),y=0,pageCount=0;
 function footer(){page.drawLine({start:{x:45,y:39},end:{x:550,y:39},thickness:.5,color:line});page.drawText('DESIGN REFERENCE | Confirm final specification and selected variant with supplier',{x:45,y:26,size:7,font,color:muted});page.drawText(String(++pageCount),{x:541,y:26,size:8,font,color:muted})}
 function header(p:Product,index:number,continued=false){y=799;page.drawText('LANDSCAPE PRODUCT REGISTER  /  '+String(index+1).padStart(2,'0'),{x:50,y,size:8,font,color:muted});y-=35;for(const t of wrap(p.name+(continued?' (continued)':''),23,500,strong)){page.drawText(t,{x:50,y,size:23,font:strong,color:green});y-=29}y-=2;for(const t of wrap(p.code+' | '+p.fields.Supplier,11,495,strong)){page.drawText(t,{x:50,y,size:11,font:strong,color:ink});y-=15}y-=10}
 for(let index=0;index<products.length;index++){
  const p=products[index];if(index)page=doc.addPage([595.28,841.89]);header(p,index);
  let imageMissing=false;
  if(p.image){try{let b=await load(p.image);let im;if(b[0]===137)im=await doc.embedPng(b);else if(b[0]===255)im=await doc.embedJpg(b);else if(typeof document!=='undefined'){const blob=new Blob([b as unknown as BlobPart]);const bitmap=await createImageBitmap(blob);const canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;canvas.getContext('2d')!.drawImage(bitmap,0,0);b=new Uint8Array(await(await fetch(canvas.toDataURL('image/png'))).arrayBuffer());im=await doc.embedPng(b)}if(im){const ratio=Math.min(490/im.width,180/im.height);page.drawImage(im,{x:(595-im.width*ratio)/2,y:y-180+(180-im.height*ratio)/2,width:im.width*ratio,height:im.height*ratio});y-=195}else imageMissing=true}catch{imageMissing=true}}else imageMissing=true;
  if(imageMissing){page.drawText('Main image unavailable - refer to supplier webpage.',{x:50,y:y-15,size:9,font,color:muted});y-=40}
  for(const key of fieldNames){const lines=wrap(p.fields[key]||'Not published / supplier confirmation required',9,389);const height=Math.max(27,lines.length*13+12);if(y-height<125){footer();page=doc.addPage([595.28,841.89]);header(p,index,true)}page.drawRectangle({x:50,y:y-height,width:100,height,color:rgb(.918,.945,.929)});page.drawText(key,{x:58,y:y-16,size:9,font,color:ink});lines.forEach((s,i)=>page.drawText(s,{x:158,y:y-16-i*13,size:9,font,color:ink}));page.drawLine({start:{x:50,y:y-height},end:{x:550,y:y-height},thickness:.4,color:line});y-=height}
  y-=18;
  const notes=[...p.notes,...(imageMissing?['Image could not be retrieved during export.']:[]),'Source: '+p.url,'Evidence checked: '+p.checkedAt.slice(0,10)+(p.fromSnapshot?' (reviewed snapshot).':' (automatically collected; confirm specification).')];
  for(const note of notes){const lines=wrap(note,8,500);if(y-lines.length*11<61){footer();page=doc.addPage([595.28,841.89]);header(p,index,true)}for(const s of lines){page.drawText(s,{x:50,y,size:8,font,color:muted});y-=11}y-=4}
  footer();
 }
 // Append the price summary while retaining the approved product-page layout.
 function priceHeader(continued=false){
  page=doc.addPage([595.28,841.89]);y=799;
  page.drawText('PROJECT RECIPES  /  PRICE SUMMARY',{x:50,y,size:8,font,color:muted});y-=35;
  page.drawText('Price summary'+(continued?' (continued)':''),{x:50,y,size:23,font:strong,color:green});y-=24;
  page.drawText('AUD | Edited unit prices and project quantities',{x:50,y,size:9,font,color:muted});y-=29;
  page.drawRectangle({x:50,y:y-25,width:500,height:25,color:rgb(.918,.945,.929)});
  for(const [title,x] of [['Product',58],['Code',233],['Unit price',348],['Qty',430],['Total',504]] as const)page.drawText(title,{x,y:y-16,size:8,font:strong,color:ink});
  y-=25;
 }
 function amount(value:string,right:number,baseline:number){page.drawText(value,{x:right-font.widthOfTextAtSize(value,9),y:baseline,size:9,font,color:ink})}
 priceHeader();
 for(const p of products){const cost=pricingFor(p),total=lineTotal(cost);const names=wrap(p.name,9,161),codes=wrap(p.code,8,93);const height=Math.max(35,Math.max(names.length,codes.length)*12+15);
  if(y-height<115){footer();priceHeader(true)}
  names.forEach((v,i)=>page.drawText(v,{x:58,y:y-16-i*12,size:9,font,color:ink}));codes.forEach((v,i)=>page.drawText(v,{x:233,y:y-16-i*12,size:8,font,color:muted}));
  if(cost.unitPrice!==null)amount(money(cost.unitPrice),418,y-16);amount(String(cost.quantity),459,y-16);if(total!==null)amount(money(total),542,y-16);
  page.drawLine({start:{x:50,y:y-height},end:{x:550,y:y-height},thickness:.4,color:line});y-=height;
 }
 const summary=priceSummary(products);if(y<140){footer();priceHeader(true)}
 page.drawRectangle({x:50,y:y-35,width:500,height:35,color:rgb(.918,.945,.929)});page.drawText(summary.missing?'Known-price total':'Project total',{x:58,y:y-22,size:10,font:strong,color:green});if(summary.total!==null)amount(money(summary.total),542,y-22);y-=52;
 if(summary.missing)page.drawText(String(summary.missing)+' '+(summary.missing===1?'product has':'products have')+' no unit price. Blank prices are excluded from the total.',{x:50,y,size:8,font,color:muted});
 footer();
 doc.setTitle('Project Recipes - Product Register');doc.setSubject('Supplier product information and CAD availability');doc.setCreator('Project Recipes');return doc.save();
}
