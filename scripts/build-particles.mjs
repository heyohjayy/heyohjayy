// Sample the supplied photo into actual separated vector points. The photo stays local.
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const sharp = require(process.env.SHARP_MODULE || 'sharp');
const photo = process.argv[2];
if (!photo) throw new Error('Usage: node scripts/build-particles.mjs path/to/portrait.png');
const {data,info} = await sharp(photo).rotate().resize(420,420,{fit:'contain',background:'#ffffff'}).removeAlpha().raw().toBuffer({resolveWithObject:true});
let seed=1942;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const points=[];
const luminance=(x,y)=>{const i=(Math.max(0,Math.min(419,y))*info.width+Math.max(0,Math.min(419,x)))*info.channels;return data[i]*.299+data[i+1]*.587+data[i+2]*.114;};
for(let y=4;y<416;y+=2.05) for(let x=4;x<416;x+=2.05){
  const px=Math.round(x),py=Math.round(y),i=(py*info.width+px)*info.channels;
  const lum=data[i]*.299+data[i+1]*.587+data[i+2]*.114;
  const edge=Math.min(1,(Math.abs(luminance(px+2,py)-luminance(px-2,py))+Math.abs(luminance(px,py+2)-luminance(px,py-2)))/90);
  const ink=Math.max(0,(236-lum)/236);
  // Light clothing used to be discarded with the pale background. Keep its
  // highlights and local edges so collar seams and both shoulders remain legible.
  const neutral=Math.max(data[i],data[i+1],data[i+2])-Math.min(data[i],data[i+1],data[i+2]);
  const garment=y>278&&Math.abs(x-210)<82+(y-278)*1.03;
  const fabric=garment&&lum>232&&neutral<13;
  const density=Math.min(.92,Math.pow(ink,.82)*.87+edge*.24+(fabric?.23:0));
  if(random()>density)continue;
  const tone=random()<.045?3:fabric?1:lum<110?0:lum<180?1:2;
  const radius=fabric?.6+random()*.18:.62+random()*.35;
  points.push([+(x+(random()-.5)*1.1).toFixed(2),+(y+(random()-.5)*1.1).toFixed(2),+radius.toFixed(2),tone]);
}
await fs.mkdir(new URL('../site/',import.meta.url),{recursive:true});
await fs.writeFile(new URL('../site/points.json',import.meta.url),JSON.stringify(points));
console.log(`Sampled ${points.length} particles; original photo excluded.`);
