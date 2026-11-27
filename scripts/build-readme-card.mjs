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
const focus=[
 'Over the last few years, my work has been about helping engineering teams get their applications from code to production with fewer headaches.',
 'That means building and managing cloud infrastructure on AWS with Terraform, automating builds and deployments with Jenkins and GitHub Actions, and adding security checks and rollback strategies so teams can catch problems early and recover when a release goes wrong.',
 'It also means running containerized applications on Kubernetes, managing clusters across regions, and using monitoring and alerts to understand what’s happening when something breaks.',
 'My focus is simple: make releases easier, reduce repetitive work, and help teams spend more time building.',
];
const wrap=(paragraph,max=63)=>{
 const lines=[];let current='';
 for(const word of paragraph.split(' ')){if(current&&current.length+word.length+1>max){lines.push(current);current=word;}else current+=(current?' ':'')+word;}
 if(current)lines.push(current);return lines;
};
for(const theme of ['light','dark']){
 const dark=theme==='dark',c=dark?
  {bg:'#111e2c',text:'#e5eef6',muted:'#9bb0c4',line:'#32475c',accent:'#68bdff',panel:'#1b2d40',sky:'#173b62',horizon:'#476a8d'}:
  {bg:'#f8fbff',text:'#1d3042',muted:'#58748c',line:'#cbdbe9',accent:'#0879c4',panel:'#eaf3fb',sky:'#75bcec',horizon:'#d9edfa'};
 const parts=[`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="640" viewBox="0 0 1200 640" role="img" aria-labelledby="title desc"><title id="title">Hi, welcome.</title><desc id="desc">Cloud infrastructure, reliability and observability, CI/CD pipelines and containerization. The tools I work with, displayed in square cells with their project logos, and my professional focus.</desc>`,
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
 text(64,95,'Hi, welcome.',30,c.text,'font-weight="700"');
 text(64,121,'Cloud infrastructure · Reliability / Observability · CI/CD pipelines · Containerization',13,c.muted);
 text(64,143,'Here are some of the tools I work with.',13,c.text);
 text(64,163,'01 / STACK',13,c.muted,'letter-spacing="1.4"');
 parts.push(`<path d="M64 169H562" stroke="${c.line}" stroke-dasharray="2 5"/>`);
 const cellSize=56,tableTop=177,tableBottom=tableTop+7*cellSize,toolsLeft=282,tableRight=toolsLeft+5*cellSize;
 parts.push(`<g data-stack-grid="true" fill="none" stroke="${c.line}" stroke-width="1"><rect x="64" y="${tableTop}" width="${tableRight-64}" height="${tableBottom-tableTop}"/><path d="M${toolsLeft} ${tableTop}V${tableBottom}"/>`);
 for(let i=1;i<5;i++)parts.push(`<path data-tool-divider="true" d="M${toolsLeft+i*cellSize} ${tableTop}V${tableBottom}"/>`);
 for(let i=1;i<7;i++)parts.push(`<path d="M64 ${tableTop+i*cellSize}H${tableRight}"/>`);
 parts.push('</g>');
 stack.forEach(([label,items],i)=>{
  const y=tableTop+i*cellSize;text(80,y+33,label,14,c.accent);
  items.forEach((item,j)=>{
   const x=toolsLeft+(j+.5)*cellSize;
   if(!logos.has(item))throw new Error(`Missing actual logo: ${item}`);
   parts.push(`<g data-tool="${esc(item)}" data-cell-x="${x-cellSize/2}" data-cell-y="${y}" data-cell-size="${cellSize}"><title>${esc(item)}</title><rect x="${x-14}" y="${y+3}" width="28" height="28" rx="5" fill="${item==='Trivy'?'#171c39':'#ffffff'}"/><image x="${x-12}" y="${y+5}" width="24" height="24" href="${logos.get(item)}"/>`);
   const captions={'Docker Compose':['Docker','Compose'],'GitHub Actions':['GitHub','Actions'],'GitLab CI':['GitLab','CI'],'CloudWatch':['Cloud','Watch'],'TruffleHog':['Truffle','Hog'],'KubeLinter':['Kube','Linter']};
   const lines=captions[item]||[item];
   lines.forEach((caption,k)=>text(x,y+(lines.length===1?45:40+k*11),caption,Math.min(11,50/(caption.length*.55)),c.text,'text-anchor="middle"'));
   parts.push('</g>');
  });
 });
 text(620,163,'02 / FOCUS',13,c.muted,'letter-spacing="1.4"');
 parts.push(`<path d="M620 176H1136" stroke="${c.line}" stroke-dasharray="2 5"/>`);
 let focusY=204;
 focus.forEach((paragraph,index)=>{
  wrap(paragraph).forEach(label=>{text(620,focusY,label,14,index===focus.length-1?c.accent:c.text,index===focus.length-1?'font-weight="700"':'');focusY+=22;});
  focusY+=12;
 });
 if(focusY-34>563)throw new Error('Focus text exceeds the available card height');
 line(577);
 text(64,598,'heyohjayy@github:~$',12,c.accent);
 parts.push(`<rect x="217" y="587" width="7" height="13" fill="${c.accent}"/>`);
 text(1136,598,'gojex.og@gmail.com',12,c.muted,'text-anchor="end"');
 parts.push('</svg>');
 const svg=parts.join('\n');await fs.writeFile(path.join(root,`assets/profile-${theme}.svg`),svg);
 console.log(`Built ${theme} README card: 1200 × 640, ${(Buffer.byteLength(svg)/1024).toFixed(1)} KiB`);
}
