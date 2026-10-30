const canvas=document.querySelector('#portrait');
const stage=document.querySelector('#stage');
const brush=document.querySelector('#brush');
const status=document.querySelector('#status');
const pauseButton=document.querySelector('#pause');
const scatterButton=document.querySelector('#scatter');
const ctx=canvas.getContext('2d');
const motion=matchMedia('(prefers-reduced-motion: reduce)');
const dark=matchMedia('(prefers-color-scheme: dark)');
let paused=motion.matches,visible=true,raf=0,last=0,time=0,particles=[],inks=[];
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
  const step=Math.min((stamp-(last||stamp))/16.667,2);last=stamp;time+=step*.013;
  for(let i=0;i<particles.length;i++){
    const p=particles[i],idle=motion.matches?0:1;
    const tx=p.ox+Math.sin(time+p.phase)*.8*idle,ty=p.oy+Math.cos(time*.8+p.phase)*1.2*idle;
    p.vx+=(tx-p.x)*.025*step;p.vy+=(ty-p.y)*.025*step;
    if(pointer.active){const dx=p.x-pointer.x,dy=p.y-pointer.y,d=Math.hypot(dx,dy),r=68;if(d<r){const f=(1-d/r)*2.5*step;p.vx+=(d?dx/d:1)*f;p.vy+=(d?dy/d:0)*f;}}
    const damp=Math.pow(.87,step);p.vx*=damp;p.vy*=damp;p.x+=p.vx*step;p.y+=p.vy*step;
  }
  draw();start();
}
function start(){if(!raf&&!paused&&visible&&!document.hidden){raf=requestAnimationFrame(frame);}}
function stop(){cancelAnimationFrame(raf);raf=0;last=0;}
function updateButton(){pauseButton.textContent=paused?'Resume motion':'Pause motion';pauseButton.setAttribute('aria-pressed',String(paused));stage.classList.toggle('is-interactive',!paused);}
function locate(e){const b=stage.getBoundingClientRect();pointer.x=(e.clientX-b.left)*500/b.width;pointer.y=(e.clientY-b.top)*600/b.height;brush.style.left=`${e.clientX-b.left}px`;brush.style.top=`${e.clientY-b.top}px`;}
stage.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||paused)return;locate(e);pointer.active=true;});
stage.addEventListener('pointerleave',()=>pointer.active=false);
stage.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&!paused){locate(e);burst(pointer.x,pointer.y,100);}});
function burst(x,y,r=230){for(const p of particles){const dx=p.x-x,dy=p.y-y,d=Math.hypot(dx,dy);if(d<r){const f=(1-d/r)*15;p.vx+=(d?dx/d:1)*f;p.vy+=(d?dy/d:0)*f;}}start();}
scatterButton.addEventListener('click',()=>{if(paused){paused=false;updateButton();}burst(250,285);});
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
}catch(error){status.textContent='Portrait unavailable. Please reload, or explore my GitHub profile.';scatterButton.disabled=pauseButton.disabled=true;console.error(error);}
