// Original contribution-calendar adaptation inspired by Snake 404 / Dithered 404.
// Source activity is immutable; eaten/scorched dots are temporary visual state.
import {routeTo,chooseTarget,cellKey} from './snake-chase.js';
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
let cells=[],labels=[],body=[],embers=[],manual=false,paused=reduced.matches,visible=false,raf=0,lastTick=0;
let heading=[1,0],nextHeading=[1,0],index=10,length=12,palette=[],touchStart=null;
let target=null,previousTarget='',caughtAt=-Infinity,clock=0,lastFrame=0;
let targetColors=[],catches=0,impacts=[],greetingDone=reduced.matches;
let snakeColor={name:'red',fill:'#e43d48',edge:'#842133',eyes:'#ffffff'};
const intro=document.querySelector('#chase-intro');
const targetColor=()=>targetColors[catches%targetColors.length]||snakeColor;
function greeting(now){
 if(greetingDone){intro.hidden=true;return;}
 intro.hidden=false;intro.style.opacity=String(Math.min(1,now/250,(3200-now)/350));
 intro.querySelector('[data-hello]').textContent=Array.from('> hello, visitor 👋').slice(0,Math.max(0,Math.floor((now-180)/45))).join('');
 intro.querySelector('[data-building]').textContent='> catch me building.'.slice(0,Math.max(0,Math.floor((now-1150)/45)));
 if(now>=3200){greetingDone=true;intro.hidden=true;}
}
const key=([x,y])=>x+','+y;
function isDark(){const theme=document.documentElement.dataset.theme;return theme?theme==='dark':dark.matches;}
function colors(){palette=isDark()?['#1c3043','#375e7c','#4c8ab6','#6ab5ea','#9cd8ff']:['#e5eef6','#bfdef5','#79bfee','#328fce','#086caf'];}
function reset(){index=10;length=12;body=Array.from({length},(_,i)=>cycle[(index-i+cycle.length)%cycle.length]);heading=nextHeading=[1,0];target=chooseTarget(body,cells,clock,previousTarget);caughtAt=-Infinity;}
function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(r.width*d);canvas.height=Math.round(r.height*d);draw(clock);}
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
 if(target&&greetingDone){
   const [x,y]=target,c=targetColor(),cx=38.5+x*21,cy=58.5+y*20,pulse=1+Math.sin(now/170)*.16;
   const halo=ctx.createRadialGradient(cx,cy,1,cx,cy,18*pulse);halo.addColorStop(0,c.fill+'b0');halo.addColorStop(1,c.fill+'00');ctx.fillStyle=halo;ctx.fillRect(cx-23,cy-23,46,46);
   ctx.strokeStyle=c.edge;ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(cx,cy,8*pulse,0,Math.PI*2);ctx.stroke();ctx.fillStyle=c.fill;ctx.beginPath();ctx.arc(cx,cy,4,0,Math.PI*2);ctx.fill();ctx.stroke();
   for(let i=0;i<4;i++){const angle=now/700+i*Math.PI/2,r=12+Math.sin(now/190+i)*2,sx=cx+Math.cos(angle)*r,sy=cy+Math.sin(angle)*r;ctx.strokeStyle=i%2?c.fill:c.edge;ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(sx-2.4,sy);ctx.lineTo(sx+2.4,sy);ctx.moveTo(sx,sy-2.4);ctx.lineTo(sx,sy+2.4);ctx.stroke();}
 }
 for(let i=body.length-1;i>=0;i--){const [x,y]=body[i],cx=38.5+x*21,cy=58.5+y*20,r=i===0?6:Math.max(3,5-i*.09);ctx.fillStyle=snakeColor.fill;ctx.strokeStyle=snakeColor.edge;ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();ctx.stroke();const glow=(now-caughtAt-i*38)/350;if(glow>=0&&glow<1){ctx.globalAlpha=(1-glow)*.7;ctx.strokeStyle=snakeColor.fill;ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy,r+2+glow*3,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}}
 if(body.length){const [x,y]=body[0];ctx.fillStyle=snakeColor.eyes;for(const off of [-2,2])ctx.fillRect(40+x*21,57+y*20+off,1.5,1.5);}
 impacts=impacts.filter(e=>now-e.at<950);
 for(const e of impacts){const t=(now-e.at)/950;ctx.globalAlpha=(1-t)*.85;ctx.strokeStyle=e.color.fill;ctx.lineWidth=2.6*(1-t)+.4;ctx.beginPath();ctx.arc(e.x,e.y,5+(1-Math.pow(1-t,3))*49,0,Math.PI*2);ctx.stroke();ctx.strokeStyle=e.color.edge;ctx.lineWidth=1;ctx.beginPath();ctx.arc(e.x,e.y,3+t*32,0,Math.PI*2);ctx.stroke();}
 embers=embers.filter(e=>now-e.at<(e.impact?1100:850));
 for(const e of embers){const t=(now-e.at)/(e.impact?1100:850);ctx.globalAlpha=(1-t)*(1-t);ctx.fillStyle=e.color?.fill||palette[3];const size=e.impact?3.2:1.6,x=e.x+e.vx*t*(e.impact?58:24),y=e.y+e.vy*t*(e.impact?58:12)+(e.impact?20*t*t:-22*t);ctx.fillRect(x,y,size,size);if(e.impact){ctx.strokeStyle=e.color.edge;ctx.lineWidth=.5;ctx.strokeRect(x,y,size,size);}}
 ctx.globalAlpha=1;ctx.fillStyle=ink;ctx.fillText('Less',1015,216);
 for(let i=0;i<5;i++){ctx.fillStyle=palette[i];ctx.fillRect(1054+i*19,205,15,15);}ctx.fillStyle=ink;ctx.fillText('More',1156,216);
 greeting(now);
}
function scorch(c,now){if(now-c.eaten<300)return;c.eaten=now;for(let i=0;i<5;i++)embers.push({x:38+c.column*21,y:58+c.row*20,at:now,vx:Math.sin(i*2.4),vy:Math.cos(i*2.4)});}
function tick(now){
 if(!greetingDone)return;
 if(now-caughtAt<420)return;
 if(!target)target=chooseTarget(body,cells,now,previousTarget);
 let head;
 if(manual){heading=nextHeading;head=[body[0][0]+heading[0],body[0][1]+heading[1]];
   if(head[0]<0||head[0]>53||head[1]<0||head[1]>6||body.slice(0,-1).some(p=>key(p)===key(head))){manual=false;message.textContent='Snake reset. Autopilot is back on.';reset();buttons();return;}
 }else{
   const route=target?routeTo(body,target):null;
   if(route?.length)head=route[0];
   else{const escape=[[1,0],[0,1],[-1,0],[0,-1]].map(([dx,dy])=>[body[0][0]+dx,body[0][1]+dy]).find(p=>p[0]>=0&&p[0]<54&&p[1]>=0&&p[1]<7&&!body.slice(0,-1).some(b=>key(b)===key(p)));if(!escape){reset();return;}head=escape;target=null;}
   heading=[head[0]-body[0][0],head[1]-body[0][1]];nextHeading=heading;
 }
 body.unshift(head);
 const food=cells.find(c=>c.column===head[0]&&c.row===head[1]&&c.level&&now-c.eaten>2600);
 if(target&&key(head)===key(target)){
   if(food)scorch(food,now);
   snakeColor=targetColor();catches++;
   impacts.push({x:38.5+head[0]*21,y:58.5+head[1]*20,at:now,color:snakeColor});
   for(let i=0;i<32;i++){const angle=i*Math.PI*2/32,speed=i%2?.65:1;embers.push({x:38.5+head[0]*21,y:58.5+head[1]*20,at:now,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,impact:true,color:snakeColor});}
   previousTarget=cellKey(target);target=null;caughtAt=now;
 }
 while(body.length>length)body.pop();
}
function frame(now){raf=0;if(paused||!visible||document.hidden)return;clock+=lastFrame?Math.min(now-lastFrame,50):0;lastFrame=now;const distance=target?Math.abs(target[0]-body[0][0])+Math.abs(target[1]-body[0][1]):99;if(clock-lastTick>(distance<5?95:165)){tick(clock);lastTick=clock;}draw(clock);start();}
function start(){if(!raf&&!paused&&visible&&!document.hidden&&cells.length)raf=requestAnimationFrame(frame);}
function stop(){cancelAnimationFrame(raf);raf=0;lastFrame=0;}
function buttons(){play.textContent=manual?'Return to autopilot':'Play snake';pause.textContent=paused?'Resume animation':'Pause animation';pause.setAttribute('aria-pressed',String(paused));canvas.classList.toggle('playing',manual);}
function playGame(){manual=true;paused=false;greetingDone=true;intro.hidden=true;message.textContent='Use arrow keys / WASD, or swipe. Catch a target to take its colour. Escape returns to autopilot.';reset();buttons();canvas.focus({preventScroll:true});start();}
play.addEventListener('click',()=>{if(manual){manual=false;reset();message.textContent='Chasing colours. Catch a sparkling target to change the snake.';buttons();}else playGame();});
pause.addEventListener('click',()=>{paused=!paused;buttons();if(paused)stop();else start();});
canvas.addEventListener('click',()=>{if(!manual)playGame();});
canvas.addEventListener('keydown',e=>{if(e.key==='Escape'){manual=false;reset();buttons();message.textContent='Autopilot on.';return;}const dir={ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0],ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1]}[e.key];if(!dir)return;e.preventDefault();if(!manual)playGame();if(dir[0]!==-heading[0]||dir[1]!==-heading[1])nextHeading=dir;});
canvas.addEventListener('blur',()=>{manual=false;reset();buttons();});
canvas.addEventListener('pointermove',e=>{if(paused||e.pointerType==='touch')return;const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*1200/r.width,y=(e.clientY-r.top)*226/r.height;for(const c of cells)if(c.level&&Math.hypot(38+c.column*21-x,58+c.row*20-y)<27)scorch(c,clock);});
canvas.addEventListener('touchstart',e=>{const t=e.touches[0];touchStart=[t.clientX,t.clientY];},{passive:true});
canvas.addEventListener('touchend',e=>{if(!touchStart)return;const t=e.changedTouches[0],dx=t.clientX-touchStart[0],dy=t.clientY-touchStart[1];touchStart=null;if(Math.hypot(dx,dy)<20)return;if(!manual)playGame();const dir=Math.abs(dx)>Math.abs(dy)?[Math.sign(dx),0]:[0,Math.sign(dy)];if(dir[0]!==-heading[0]||dir[1]!==-heading[1])nextHeading=dir;},{passive:true});
dark.addEventListener('change',()=>{colors();draw(clock);});
window.addEventListener('profile-theme-change',()=>{colors();draw(clock);});
reduced.addEventListener('change',()=>{paused=reduced.matches;buttons();if(paused){greetingDone=true;stop();for(const c of cells)c.eaten=-Infinity;embers=[];impacts=[];draw(clock);}else start();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else start();});
new ResizeObserver(resize).observe(canvas);
new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(visible)start();else stop();}).observe(canvas);
try{
 const [response,colorResponse]=await Promise.all([fetch('contributions.json'),fetch('chase-palette.json')]);if(!response.ok||!colorResponse.ok)throw new Error('Contribution data unavailable');const calendar=await response.json();targetColors=await colorResponse.json();
 cells=calendar.weeks.flatMap((w,column)=>w.contributionDays.map(d=>({column,row:d.weekday,date:d.date,count:d.contributionCount,level:['NONE','FIRST_QUARTILE','SECOND_QUARTILE','THIRD_QUARTILE','FOURTH_QUARTILE'].indexOf(d.contributionLevel),eaten:-Infinity})));
 let month='';for(const c of cells){const date=new Date(c.date+'T12:00:00Z'),next=date.toLocaleDateString('en',{month:'short',timeZone:'UTC'});if(next!==month){if(c.column||date.getUTCDate()<=7)labels.push({text:next,column:c.column});month=next;}}
 summary.textContent=`${calendar.totalContributions.toLocaleString()} contributions in the last year`;
 colors();reset();resize();buttons();start();
}catch(error){summary.textContent='Activity unavailable — view GitHub for the live calendar.';message.textContent='Please reload to try again.';play.disabled=pause.disabled=true;console.error(error);}
