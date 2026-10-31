// Original contribution-calendar adaptation inspired by Snake 404 / Dithered 404.
// Source activity is immutable; eaten/scorched dots are temporary visual state.
const canvas=document.querySelector('#contributions');
const ctx=canvas.getContext('2d');
const summary=document.querySelector('#activity-summary');
const message=document.querySelector('#game-status');
const play=document.querySelector('#play-snake');
const pause=document.querySelector('#pause-snake');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const dark=matchMedia('(prefers-color-scheme: dark)');
const cycle=[];
for(let x=0;x<54;x++)cycle.push([x,0]);
for(let x=53;x>0;x--)for(const y of x%2?[1,2,3,4,5,6]:[6,5,4,3,2,1])cycle.push([x,y]);
for(let y=6;y>0;y--)cycle.push([0,y]);
const bayer=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
let cells=[],labels=[],body=[],embers=[],manual=false,paused=reduced.matches,visible=true,raf=0,lastTick=0;
let heading=[1,0],nextHeading=[1,0],index=10,length=12,palette=[],touchStart=null;
const key=([x,y])=>x+','+y;
function isDark(){const theme=document.documentElement.dataset.theme;return theme?theme==='dark':dark.matches;}
function colors(){palette=isDark()?['#1c3043','#375e7c','#4c8ab6','#6ab5ea','#9cd8ff']:['#e5eef6','#bfdef5','#79bfee','#328fce','#086caf'];}
function reset(){index=10;length=12;body=Array.from({length},(_,i)=>cycle[(index-i+cycle.length)%cycle.length]);heading=nextHeading=[1,0];}
function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(r.width*d);canvas.height=Math.round(r.height*d);draw(performance.now());}
function draw(now){
 ctx.setTransform(canvas.width/1200,0,0,canvas.height/226,0,0);ctx.clearRect(0,0,1200,226);
 const ink=isDark()?'#9badbf':'#61778c';ctx.font='11px Consolas,monospace';ctx.fillStyle=ink;
 for(const label of labels)ctx.fillText(label.text,30+label.column*21,32);
 for(const c of cells){
   const x=30+c.column*21,y=50+c.row*20;
   ctx.globalAlpha=1;ctx.fillStyle=palette[0];ctx.fillRect(x,y,17,17);
   const elapsed=now-c.eaten,opacity=Math.min(1,Math.max(0,(elapsed-1200)/1400));
   if(c.level){ctx.fillStyle=palette[c.level];ctx.globalAlpha=opacity;
     for(let py=0;py<8;py++)for(let px=0;px<8;px++)if(bayer[(py%4)*4+px%4]<[0,4,8,12,16][c.level])ctx.fillRect(x+px*2,y+py*2,1.3,1.3);
   }
 }
 ctx.globalAlpha=1;
 for(let i=body.length-1;i>=0;i--){const [x,y]=body[i];ctx.fillStyle=i===0?palette[4]:palette[3];ctx.beginPath();ctx.arc(38.5+x*21,58.5+y*20,i===0?6:Math.max(3,5-i*.09),0,Math.PI*2);ctx.fill();}
 if(body.length){const [x,y]=body[0];ctx.fillStyle=isDark()?'#111a25':'white';for(const off of [-2,2])ctx.fillRect(40+x*21,57+y*20+off,1.5,1.5);}
 embers=embers.filter(e=>now-e.at<850);
 for(const e of embers){const t=(now-e.at)/850;ctx.globalAlpha=1-t;ctx.fillStyle=palette[3];ctx.fillRect(e.x+e.vx*t*24,e.y-22*t+e.vy*t*12,1.6,1.6);}
 ctx.globalAlpha=1;ctx.fillStyle=ink;ctx.fillText('Less',1015,216);
 for(let i=0;i<5;i++){ctx.fillStyle=palette[i];ctx.fillRect(1054+i*19,205,15,15);}ctx.fillStyle=ink;ctx.fillText('More',1156,216);
}
function scorch(c,now){if(now-c.eaten<300)return;c.eaten=now;for(let i=0;i<5;i++)embers.push({x:38+c.column*21,y:58+c.row*20,at:now,vx:Math.sin(i*2.4),vy:Math.cos(i*2.4)});}
function tick(now){
 let head;
 if(manual){heading=nextHeading;head=[body[0][0]+heading[0],body[0][1]+heading[1]];
   if(head[0]<0||head[0]>53||head[1]<0||head[1]>6||body.slice(0,-1).some(p=>key(p)===key(head))){manual=false;message.textContent='Snake reset. Autopilot is back on.';reset();buttons();return;}
 }else{index=(index+1)%cycle.length;head=cycle[index];}
 body.unshift(head);
 const food=cells.find(c=>c.column===head[0]&&c.row===head[1]&&c.level&&now-c.eaten>2600);
 if(food){scorch(food,now);length=Math.min(24,length+1);}
 while(body.length>length)body.pop();
}
function frame(now){raf=0;if(paused||!visible||document.hidden)return;if(now-lastTick>140){tick(now);lastTick=now;}draw(now);start();}
function start(){if(!raf&&!paused&&visible&&!document.hidden&&cells.length)raf=requestAnimationFrame(frame);}
function stop(){cancelAnimationFrame(raf);raf=0;lastTick=0;}
function buttons(){play.textContent=manual?'Return to autopilot':'Play snake';pause.textContent=paused?'Resume animation':'Pause animation';pause.setAttribute('aria-pressed',String(paused));canvas.classList.toggle('playing',manual);}
function playGame(){manual=true;paused=false;message.textContent='Use arrow keys / WASD, or swipe. Escape returns to autopilot.';reset();buttons();canvas.focus({preventScroll:true});start();}
play.addEventListener('click',()=>{if(manual){manual=false;reset();message.textContent='Autopilot on. Hover to dither the contribution dots.';buttons();}else playGame();});
pause.addEventListener('click',()=>{paused=!paused;buttons();if(paused)stop();else start();});
canvas.addEventListener('click',()=>{if(!manual)playGame();});
canvas.addEventListener('keydown',e=>{if(e.key==='Escape'){manual=false;reset();buttons();message.textContent='Autopilot on.';return;}const dir={ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0],ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1]}[e.key];if(!dir)return;e.preventDefault();if(!manual)playGame();if(dir[0]!==-heading[0]||dir[1]!==-heading[1])nextHeading=dir;});
canvas.addEventListener('blur',()=>{manual=false;reset();buttons();});
canvas.addEventListener('pointermove',e=>{if(paused||e.pointerType==='touch')return;const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*1200/r.width,y=(e.clientY-r.top)*226/r.height,now=performance.now();for(const c of cells)if(c.level&&Math.hypot(38+c.column*21-x,58+c.row*20-y)<27)scorch(c,now);});
canvas.addEventListener('touchstart',e=>{const t=e.touches[0];touchStart=[t.clientX,t.clientY];},{passive:true});
canvas.addEventListener('touchend',e=>{if(!touchStart)return;const t=e.changedTouches[0],dx=t.clientX-touchStart[0],dy=t.clientY-touchStart[1];touchStart=null;if(Math.hypot(dx,dy)<20)return;if(!manual)playGame();const dir=Math.abs(dx)>Math.abs(dy)?[Math.sign(dx),0]:[0,Math.sign(dy)];if(dir[0]!==-heading[0]||dir[1]!==-heading[1])nextHeading=dir;},{passive:true});
dark.addEventListener('change',()=>{colors();draw(performance.now());});
window.addEventListener('profile-theme-change',()=>{colors();draw(performance.now());});
reduced.addEventListener('change',()=>{paused=reduced.matches;buttons();if(paused){stop();for(const c of cells)c.eaten=-Infinity;embers=[];draw(performance.now());}else start();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else start();});
new ResizeObserver(resize).observe(canvas);
new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(visible)start();else stop();}).observe(canvas);
try{
 const response=await fetch('contributions.json');if(!response.ok)throw new Error('Contribution data unavailable');const calendar=await response.json();
 cells=calendar.weeks.flatMap((w,column)=>w.contributionDays.map(d=>({column,row:d.weekday,date:d.date,count:d.contributionCount,level:['NONE','FIRST_QUARTILE','SECOND_QUARTILE','THIRD_QUARTILE','FOURTH_QUARTILE'].indexOf(d.contributionLevel),eaten:-Infinity})));
 let month='';for(const c of cells){const date=new Date(c.date+'T12:00:00Z'),next=date.toLocaleDateString('en',{month:'short',timeZone:'UTC'});if(next!==month){if(c.column||date.getUTCDate()<=7)labels.push({text:next,column:c.column});month=next;}}
 summary.textContent=`${calendar.totalContributions.toLocaleString()} contributions in the last year`;
 colors();reset();resize();buttons();start();
}catch(error){summary.textContent='Activity unavailable — view GitHub for the live calendar.';message.textContent='Please reload to try again.';play.disabled=pause.disabled=true;console.error(error);}
