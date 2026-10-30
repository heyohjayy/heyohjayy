const canvas=document.querySelector('#portrait');
const stage=document.querySelector('#stage');
const brush=document.querySelector('#brush');
const status=document.querySelector('#status');
const pauseButton=document.querySelector('#pause');
const resetButton=document.querySelector('#reset');
const ctx=canvas.getContext('2d');
const motion=matchMedia('(prefers-reduced-motion: reduce)');
const dark=matchMedia('(prefers-color-scheme: dark)');
let paused=motion.matches,visible=true,raf=0,last=0,particles=[],inks=[];
const pointer={x:-1000,y:-1000,active:false};
function palette(){inks=dark.matches?['#d9eafa','#9ab7cc','#68849e','#68bdff']:['#213c52','#718b9e','#b2c8d9','#168bda'];}
function resize(){const box=stage.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(box.width*dpr);canvas.height=Math.round(box.height*dpr);draw();}
function draw(){
  if(!particles.length)return;
  ctx.setTransform(canvas.width/500,0,0,canvas.height/600,0,0);ctx.clearRect(0,0,500,600);
  // Separate dots only: no underlying photograph or texture.
  for(let tone=0;tone<4;tone++){
    ctx.fillStyle=inks[tone];ctx.beginPath();
    for(const p of particles)if(p.tone===tone){ctx.moveTo(p.x+p.r,p.y);ctx.arc(p.x,p.y,p.r,0,Math.PI*2);}
    ctx.fill();
  }
}
function frame(stamp){
  raf=0;if(paused||!visible||document.hidden)return;
  const step=Math.min((stamp-(last||stamp))/16.667,2);last=stamp;let unsettled=false;
  for(let i=0;i<particles.length;i++){
    const p=particles[i];
    p.vx+=(p.ox-p.x)*.025*step;p.vy+=(p.oy-p.y)*.025*step;
    if(pointer.active){const dx=p.x-pointer.x,dy=p.y-pointer.y,d=Math.hypot(dx,dy),r=68;if(d<r){const f=(1-d/r)*2.5*step;p.vx+=(d?dx/d:1)*f;p.vy+=(d?dy/d:0)*f;}}
    const damp=Math.pow(.87,step);p.vx*=damp;p.vy*=damp;p.x+=p.vx*step;p.y+=p.vy*step;
    if(Math.abs(p.x-p.ox)+Math.abs(p.y-p.oy)+Math.abs(p.vx)+Math.abs(p.vy)>.03)unsettled=true;
  }
  if(!unsettled&&!pointer.active)for(const p of particles){p.x=p.ox;p.y=p.oy;p.vx=p.vy=0;}
  draw();if(unsettled||pointer.active)start();else last=0;
}
function start(){if(!raf&&!paused&&visible&&!document.hidden){raf=requestAnimationFrame(frame);}}
function stop(){cancelAnimationFrame(raf);raf=0;last=0;}
function updateButton(){pauseButton.textContent=paused?'Enable interaction':'Pause interaction';pauseButton.setAttribute('aria-pressed',String(paused));stage.classList.toggle('is-interactive',!paused);}
function locate(e){const b=stage.getBoundingClientRect();pointer.x=(e.clientX-b.left)*500/b.width;pointer.y=(e.clientY-b.top)*600/b.height;brush.style.left=`${e.clientX-b.left}px`;brush.style.top=`${e.clientY-b.top}px`;}
stage.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||paused)return;locate(e);pointer.active=true;start();});
stage.addEventListener('pointerleave',()=>pointer.active=false);
stage.addEventListener('pointerdown',e=>{if(!paused){locate(e);burst(pointer.x,pointer.y,68);}});
function burst(x,y,r=68){for(const p of particles){const dx=p.x-x,dy=p.y-y,d=Math.hypot(dx,dy);if(d<r){const f=(1-d/r)*12;p.vx+=(d?dx/d:1)*f;p.vy+=(d?dy/d:0)*f;}}start();}
function reset(){pointer.active=false;stop();for(const p of particles){p.x=p.ox;p.y=p.oy;p.vx=p.vy=0;}draw();}
resetButton.addEventListener('click',reset);
canvas.addEventListener('keydown',e=>{if(paused)return;const delta={ArrowLeft:[-18,0],ArrowRight:[18,0],ArrowUp:[0,-18],ArrowDown:[0,18]}[e.key];if(delta||e.code==='Space'){e.preventDefault();if(pointer.x<0){pointer.x=250;pointer.y=280;}if(delta){pointer.x=Math.max(20,Math.min(480,pointer.x+delta[0]));pointer.y=Math.max(20,Math.min(580,pointer.y+delta[1]));}burst(pointer.x,pointer.y);}});
canvas.addEventListener('blur',()=>{pointer.active=false;});
pauseButton.addEventListener('click',()=>{paused=!paused;pointer.active=false;updateButton();if(paused)stop();else start();});
motion.addEventListener('change',()=>{paused=motion.matches;pointer.active=false;updateButton();if(paused){stop();for(const p of particles){p.x=p.ox;p.y=p.oy;p.vx=p.vy=0;}draw();}else start();});
dark.addEventListener('change',()=>{palette();draw();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else start();});
new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)start();else stop();},{threshold:.05}).observe(stage);
new ResizeObserver(resize).observe(stage);
try{
  const response=await fetch('points.json');if(!response.ok)throw new Error('Unable to load portrait');
  const points=await response.json();
  particles=points.map(([x,y,r,tone],i)=>({x:x+40,y:y+80,ox:x+40,oy:y+80,r,tone,vx:0,vy:0,phase:i*2.399}));
  palette();resize();status.hidden=true;updateButton();start();
}catch(error){status.textContent='Portrait unavailable. Please reload, or explore my GitHub profile.';resetButton.disabled=pauseButton.disabled=true;console.error(error);}
