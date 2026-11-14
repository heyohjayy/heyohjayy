// Lightweight README-only cards. The interactive site is maintained separately.
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const sharp=require(process.env.SHARP_MODULE||'sharp');
const root=fileURLToPath(new URL('../',import.meta.url));
const sources=JSON.parse(await fs.readFile(path.join(root,'assets/tool-logos/sources.json'),'utf8'));
const logos=new Map(await Promise.all(Object.entries(sources).map(async([name,source])=>{
 const png=await sharp(path.join(root,'assets/tool-logos',source.file)).resize(64,64,{fit:'contain',background:'#00000000'}).png({palette:true,quality:90}).toBuffer();
 return [name,`data:image/png;base64,${png.toString('base64')}`];
})));
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const stack=[
  ['Cloud',['AWS','EC2','EKS','ECS']],
  ['Infrastructure as Code',['Terraform']],
  ['Containers',['Docker','Docker Compose','Kubernetes']],
  ['CI/CD',['Jenkins','GitHub Actions','GitLab CI','GitOps']],
  ['Systems & Automation',['Linux','Bash','Python']],
  ['Observability',['Prometheus','Grafana','CloudWatch']],
  ['DevSecOps',['SonarQube','Trivy','Checkov','TruffleHog','KubeLinter']],
];
for(const theme of ['light','dark']){
 const dark=theme==='dark',c=dark?
  {bg:'#111e2c',text:'#e5eef6',muted:'#9bb0c4',line:'#32475c',accent:'#68bdff',panel:'#1b2d40',sky:'#173b62',horizon:'#476a8d'}:
  {bg:'#f8fbff',text:'#1d3042',muted:'#58748c',line:'#cbdbe9',accent:'#0879c4',panel:'#eaf3fb',sky:'#75bcec',horizon:'#d9edfa'};
 const parts=[`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="640" viewBox="0 0 1200 640" role="img" aria-labelledby="title desc"><title id="title">Hi, welcome. I'm Godspower Ojeifo.</title><desc id="desc">Cloud infrastructure, reliability and observability, CI/CD pipelines and containerization. The tools I work with, displayed with their project logos, and my professional focus.</desc>`,
  `<defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="${c.sky}"/><stop offset="1" stop-color="${c.horizon}"/></linearGradient><clipPath id="frame"><rect width="1200" height="640" rx="16"/></clipPath></defs>`,
  `<style>text{font-family:Consolas,'DejaVu Sans Mono',monospace}.cloud{animation:drift 28s ease-in-out infinite alternate}.cloud.second{animation-delay:-14s;animation-duration:34s}.star{animation:twinkle 4s ease-in-out infinite alternate}.bird{animation:fly 30s linear infinite}@keyframes drift{to{transform:translateX(160px)}}@keyframes twinkle{to{opacity:.3}}@keyframes fly{from{transform:translateX(-80px)}to{transform:translateX(1260px)}}@media(prefers-reduced-motion:reduce){.cloud,.star,.bird{animation:none}}</style>`,
  '<g clip-path="url(#frame)"><rect width="1200" height="640" fill="url(#sky)"/>'];
 for(const [i,x,y] of [[0,-70,22],[1,730,615]]){
  parts.push(`<g class="cloud${i?' second':''}" fill="${dark?'#9bb7d1':'#ffffff'}" opacity="${dark?.15:.45}"><ellipse cx="${x+120}" cy="${y}" rx="190" ry="30"/><ellipse cx="${x+290}" cy="${y+10}" rx="210" ry="22"/></g>`);
 }
 if(dark){for(let i=0;i<20;i++){const x=42+(i*137)%1120,y=i%2?622:14;parts.push(`<circle class="star" cx="${x}" cy="${y}" r="${i%3===0?1.7:1}" fill="#e7f5ff" opacity=".8" style="animation-delay:-${i%5}s"/>`);}}
 else parts.push('<g class="bird" stroke="#386783" stroke-width="1.7" fill="none"><path d="M0 16q4 5 8 0q4 5 8 0 M35 25q3 4 6 0q3 4 6 0"/></g>');
 parts.push(`<rect x="32" y="32" width="1136" height="576" rx="14" fill="${c.bg}"/></g>`);
 const text=(x,y,label,size=16,color=c.text,extra='')=>parts.push(`<text x="${x}" y="${y}" font-size="${size}" fill="${color}" ${extra}>${esc(label)}</text>`);
 const line=y=>parts.push(`<path d="M64 ${y}H1136" stroke="${c.line}" stroke-dasharray="2 5"/>`);
 const section=(y,label)=>{text(64,y,label,13,c.muted,'letter-spacing="1.4"');line(y+13);};
 text(64,55,'heyohjayy@github:~',12,c.muted);
 text(1136,55,'DEV / OPS',11,c.muted,'text-anchor="end" letter-spacing="2"');
 text(64,78,'Hi, welcome.',16,c.accent);
 text(64,111,"I'm Godspower Ojeifo",30,c.text,'font-weight="700" textLength="330" lengthAdjust="spacingAndGlyphs"');
 parts.push(`<image data-wave="true" x="408" y="85" width="30" height="30" href="${logos.get('wave')}"/>`);
 text(64,137,'Cloud infrastructure · Reliability / Observability · CI/CD pipelines · Containerization',14,c.muted);
 text(64,159,'Here are some of the tools I work with.',14,c.text);
 text(64,181,'01 / STACK',13,c.muted,'letter-spacing="1.4"');
 line(187);
 parts.push(`<g data-stack-grid="true" fill="none" stroke="${c.line}" stroke-width="1"><rect x="64" y="194" width="818" height="280"/><path d="M282 194V474"/>`);
 for(let i=1;i<5;i++)parts.push(`<path data-tool-divider="true" d="M${282+i*120} 194V474"/>`);
 for(let i=1;i<7;i++)parts.push(`<path d="M64 ${194+i*40}H882"/>`);
 parts.push('</g>');
 stack.forEach(([label,items],i)=>{
  const y=197+i*40;text(80,y+21,label,14,c.accent);
  items.forEach((item,j)=>{
   const x=340+j*120;
   if(!logos.has(item))throw new Error(`Missing actual logo: ${item}`);
   parts.push(`<g data-tool="${esc(item)}"><title>${esc(item)}</title><rect x="${x-15}" y="${y-1}" width="30" height="24" rx="5" fill="${item==='Trivy'?'#171c39':'#ffffff'}"/><image x="${x-11}" y="${y}" width="22" height="22" href="${logos.get(item)}"/>`);
   text(x,y+32,item,12,c.text,'text-anchor="middle"');parts.push('</g>');
  });
 });
 section(507,'02 / FOCUS');
 text(64,540,'Helping engineering teams scale cloud infrastructure, operate reliable production services,',15);
 text(64,562,'and automate infrastructure and software delivery.',15);
 line(577);
 text(64,598,'heyohjayy@github:~$',12,c.accent);
 parts.push(`<rect x="217" y="587" width="7" height="13" fill="${c.accent}"/>`);
 text(1136,598,'gojex.og@gmail.com',12,c.muted,'text-anchor="end"');
 parts.push('</svg>');
 const svg=parts.join('\n');await fs.writeFile(path.join(root,`assets/profile-${theme}.svg`),svg);
 console.log(`Built ${theme} README card: 1200 × 640, ${(Buffer.byteLength(svg)/1024).toFixed(1)} KiB`);
}
