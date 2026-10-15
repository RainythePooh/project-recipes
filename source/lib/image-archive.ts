import {zipSync,strToU8} from 'fflate';
import {safe,type Product} from './types';
const fileLimit=22*1024*1024,archiveLimit=64*1024*1024;
export function imageExtension(b:Uint8Array){
 if(b[0]===255&&b[1]===216&&b[2]===255)return 'jpg';
 if([137,80,78,71,13,10,26,10].every((v,i)=>b[i]===v))return 'png';
 const header=new TextDecoder().decode(b.slice(0,32));
 if(header.startsWith('RIFF')&&header.slice(8,12)==='WEBP')return 'webp';
 if(/^GIF8[79]a/.test(header))return 'gif';
 if(header.slice(4,8)==='ftyp'&&/avif|avis/.test(header.slice(8)))return 'avif';
 throw new Error('Supplier response is not a supported image.');
}
async function loadImage(url:string){
 if(!url.startsWith('/products/')&&!url.startsWith('/api/file?'))throw new Error('Unsupported image source.');
 const response=await fetch(url,{signal:AbortSignal.timeout(30000)});
 if(!response.ok){const error=await response.json().catch(()=>({})) as {error?:string};throw new Error(error.error||'Image download unavailable.');}
 if(Number(response.headers.get('content-length')||0)>fileLimit)throw new Error('Image exceeds 22 MB.');
 const reader=response.body?.getReader();if(!reader)throw new Error('Empty image response.');
 const chunks:Uint8Array[]=[];let length=0;
 try{for(;;){const {value,done}=await reader.read();if(done)break;length+=value.length;if(length>fileLimit)throw new Error('Image exceeds 22 MB.');chunks.push(value)}}catch(e){await reader.cancel();throw e}
 const b=new Uint8Array(length);let offset=0;for(const chunk of chunks){b.set(chunk,offset);offset+=chunk.length}return b;
}
export async function buildImageArchive(products:Product[],load:(url:string)=>Promise<Uint8Array>=loadImage,onProgress?:(completed:number,total:number)=>void){
 const files:Record<string,Uint8Array>={},used=new Set<string>(),missing:{name:string;code:string;url:string;reason:string}[]=[];let downloaded=0,totalBytes=0;
 for(const [index,p] of products.entries()){
  try{
   const url=p.image||p.assets.find(a=>a.kind==='image'&&a.status==='available'&&/^(Main_Image|Product_Image)$/i.test(a.role))?.url;
   if(!url)throw new Error('No main image published.');if(p.assets.some(a=>a.url===url&&a.status==='blocked'))throw new Error('Supplier image access required.');
   const b=await load(url);const ext=imageExtension(b);if(b.length>fileLimit)throw new Error('Image exceeds 22 MB.');if(totalBytes+b.length>archiveLimit)throw new Error('Image ZIP exceeds 64 MB. Download this image individually.');
   const stem=safe(p.name)+'_'+safe(p.code);let fileStem=stem,number=1;while(used.has(fileStem.toLowerCase()))fileStem=stem+'_'+(++number);used.add(fileStem.toLowerCase());
   files[fileStem+'_Main_Image.'+ext]=b;totalBytes+=b.length;downloaded++;
  }catch(e){missing.push({name:p.name,code:p.code,url:p.url,reason:(e as Error).message||'Image download failed.'})}
  onProgress?.(index+1,products.length);
 }
 if(!downloaded)throw new Error('No product images could be downloaded. Check the product image previews or supplier pages.');
 if(missing.length)files['_Download_Report.txt']=strToU8('PROJECT RECIPES - IMAGE DOWNLOAD REPORT\n\nDownloaded: '+downloaded+' of '+products.length+' main images.\n\nMissing images:\n\n'+missing.map(p=>p.name+' | '+p.code+'\n'+p.url+'\n'+p.reason).join('\n\n'));
 return {bytes:zipSync(files,{level:0}),downloaded,missing};
}
