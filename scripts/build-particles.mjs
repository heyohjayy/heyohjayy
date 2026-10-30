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
for(let y=3;y<417;y+=2.65) for(let x=3;x<417;x+=2.65){
  const px=Math.round(x),py=Math.round(y),i=(py*info.width+px)*info.channels;
  const lum=data[i]*.299+data[i+1]*.587+data[i+2]*.114;
  const ink=Math.max(0,(246-lum)/246);
  if(random()>Math.pow(ink,1.35)*.86)continue;
  const tone=random()<.09?3:lum<80?0:lum<145?1:2;
  points.push([+(x+(random()-.5)*1.8).toFixed(2),+(y+(random()-.5)*1.8).toFixed(2),+(.65+random()*.5).toFixed(2),tone]);
}
// A few detached particles make the silhouette feel suspended.
for(let i=0;i<100;i++)points.push([+(20+random()*380).toFixed(2),+(random()*420).toFixed(2),.55,2]);
await fs.mkdir(new URL('../site/',import.meta.url),{recursive:true});
await fs.writeFile(new URL('../site/points.json',import.meta.url),JSON.stringify(points));
console.log(`Sampled ${points.length} particles; original photo excluded.`);
