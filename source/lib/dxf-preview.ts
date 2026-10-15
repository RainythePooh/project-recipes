import DxfParser from 'dxf-parser';
type Point={x:number;y:number};type Matrix=[number,number,number,number,number,number];
// A bounded, read-only geometry preview. Text, dimensions and unsupported entities are omitted.
export function dxfPreview(bytes:Uint8Array){
 if(bytes.length>8*1024*1024)throw new Error('Drawing is too large to preview. Download the CAD file.');
 const d=new DxfParser().parseSync(new TextDecoder().decode(bytes));if(!d)throw new Error('DXF preview unavailable');
 const paths:Point[][]=[];let count=0;
 const identity:Matrix=[1,0,0,1,0,0];
 const transform=(p:Point,m:Matrix)=>({x:m[0]*p.x+m[2]*p.y+m[4],y:m[1]*p.x+m[3]*p.y+m[5]});
 function output(points:Point[],m:Matrix){const result=points.map(p=>transform(p,m));if(result.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&Math.abs(p.x)<1e12&&Math.abs(p.y)<1e12)&&result.length>1)paths.push(result)}
 function arc(cx:number,cy:number,r:number,start:number,sweep:number){return Array.from({length:65},(_,i)=>({x:cx+r*Math.cos(start+sweep*i/64),y:cy+r*Math.sin(start+sweep*i/64)}))}
 function walk(entities:any[],m:Matrix,depth:number){if(depth>8)return;for(const e of entities){if(++count>20000)throw new Error('Drawing is too complex to preview. Download the CAD file.');if(e.inPaperSpace||e.visible===false)continue;
  if(e.type==='INSERT'){
   const b=d!.blocks[e.name];if(!b?.entities)continue;const a=(e.rotation||0)*Math.PI/180,c=Math.cos(a),s=Math.sin(a),sx=e.xScale??1,sy=e.yScale??1,origin=b.position||{x:0,y:0},pos=e.position||{x:0,y:0};
   const local:Matrix=[c*sx,s*sx,-s*sy,c*sy,pos.x-c*sx*origin.x+s*sy*origin.y,pos.y-s*sx*origin.x-c*sy*origin.y];
   const next:Matrix=[m[0]*local[0]+m[2]*local[1],m[1]*local[0]+m[3]*local[1],m[0]*local[2]+m[2]*local[3],m[1]*local[2]+m[3]*local[3],m[0]*local[4]+m[2]*local[5]+m[4],m[1]*local[4]+m[3]*local[5]+m[5]];walk(b.entities,next,depth+1);
  }else if(['LINE','LWPOLYLINE','POLYLINE'].includes(e.type)){
   const v=e.vertices||[],out:Point[]=[];for(let i=0;i<v.length;i++){const p=v[i],q=v[(i+1)%v.length];out.push(p);if(p.bulge&&q&&(i<v.length-1||e.shape)){const chord=Math.hypot(q.x-p.x,q.y-p.y);if(chord>0){const b=p.bulge,cx=(p.x+q.x)/2-(q.y-p.y)*(1-b*b)/(4*b),cy=(p.y+q.y)/2+(q.x-p.x)*(1-b*b)/(4*b),r=chord*(1+b*b)/(4*Math.abs(b));out.push(...arc(cx,cy,r,Math.atan2(p.y-cy,p.x-cx),4*Math.atan(b)).slice(1))}}}if(e.shape&&v.length)out.push(v[0]);output(out,m);
  }else if(e.type==='CIRCLE'||e.type==='ARC'){let sweep=e.type==='CIRCLE'?2*Math.PI:(e.endAngle-e.startAngle+2*Math.PI)%(2*Math.PI);output(arc(e.center.x,e.center.y,e.radius,e.startAngle||0,sweep),m)}
 }}
 walk(d.entities,identity,0);if(!paths.length)throw new Error('No supported plan geometry found. Download the CAD file.');
 let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;for(const points of paths)for(const p of points){minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y)}
 const span=Math.max(maxX-minX,maxY-minY,1),scale=900/span,offsetX=(1000-(maxX-minX)*scale)/2,offsetY=(1000-(maxY-minY)*scale)/2;
 const geometry=paths.map(points=>'<polyline points="'+points.map(p=>`${((p.x-minX)*scale+offsetX).toFixed(2)},${((maxY-p.y)*scale+offsetY).toFixed(2)}`).join(' ')+'"/>').join('');
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000"><rect width="1000" height="1000" fill="white"/><g fill="none" stroke="#34503b" stroke-width="1" stroke-linejoin="round">${geometry}</g></svg>`;
}
