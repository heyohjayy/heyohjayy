// Lightweight README-only cards. The interactive site is maintained separately.
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const stack=[
  ['Cloud',['AWS','EC2','EKS','ECS']],
  ['Infrastructure as Code',['Terraform','Reusable modules']],
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
 const parts=[`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="640" viewBox="0 0 1200 640" role="img" aria-labelledby="title desc"><title id="title">Godspower Ojeifo | Senior DevOps Engineer</title><desc id="desc">Cloud infrastructure, reliability and observability, CI/CD pipelines and containerization. Stack and professional focus.</desc>`,
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
 text(64,63,'heyohjayy@github:~',12,c.muted);
 text(1136,63,'DEV / OPS',11,c.muted,'text-anchor="end" letter-spacing="2"');
 text(64,108,'Godspower Ojeifo',34,c.text,'font-weight="700"');
 text(64,138,'Senior DevOps Engineer',19,c.accent);
 text(64,165,'Cloud infrastructure · Reliability / Observability · CI/CD pipelines · Containerization',14,c.muted);
 section(201,'01 / STACK');
 stack.forEach(([label,items],i)=>{
  const y=239+i*34;text(64,y,label,14,c.accent);let x=340;
  for(const item of items){const width=item.length*8+22;parts.push(`<rect x="${x}" y="${y-18}" width="${width}" height="27" rx="13.5" fill="${c.panel}" stroke="${c.line}"/>`);text(x+11,y,item,13);x+=width+9;}
 });
 section(481,'02 / FOCUS');
 text(64,517,'Helping engineering teams scale cloud infrastructure, operate reliable production services,',16);
 text(64,543,'and automate infrastructure and software delivery.',16);
 line(565);
 text(64,590,'heyohjayy@github:~$',13,c.accent);
 parts.push(`<rect x="227" y="578" width="8" height="14" fill="${c.accent}"/>`);
 text(1136,590,'gojex.og@gmail.com',13,c.muted,'text-anchor="end"');
 parts.push('</svg>');
 const svg=parts.join('\n');await fs.writeFile(path.join(root,`assets/profile-${theme}.svg`),svg);
 console.log(`Built ${theme} README card: 1200 × 640, ${(Buffer.byteLength(svg)/1024).toFixed(1)} KiB`);
}
