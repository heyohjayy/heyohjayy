import {createShaderSky,skyFallback} from './vendor/shader-sky.js';
const background=document.querySelector('#sky-background');
const canvas=document.querySelector('#sky');
const themeButton=document.querySelector('#preview-theme');
const toggleButton=document.querySelector('#preview-sky');
const pauseButton=document.querySelector('#preview-pause');
const systemDark=matchMedia('(prefers-color-scheme: dark)');
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
let choice='auto',enabled=true,paused=false,engine=null;
const palettes={light:['#358bce','#b1dafa','#fcfdff','#c8dfed'],dark:['#152d4c','#385a7e','#294462','#142941']};
function isDark(){return choice==='dark'||(choice==='auto'&&systemDark.matches);}
function sync(){
 const dark=isDark();
 if(choice==='auto')document.documentElement.removeAttribute('data-theme');else document.documentElement.dataset.theme=choice;
 document.documentElement.dataset.skyTheme=dark?'dark':'light';
 Object.assign(background.style,skyFallback(palettes[dark?'dark':'light'],dark));
 background.hidden=!enabled;
 engine?.setOptions({theme:dark?'dark':'light',colors:palettes[dark?'dark':'light'],paused:paused||!enabled});
 themeButton.textContent=`Theme: ${choice[0].toUpperCase()+choice.slice(1)}`;
 toggleButton.textContent=enabled?'Sky: On':'Sky: Off';toggleButton.setAttribute('aria-pressed',String(enabled));
 pauseButton.textContent=reduce.matches?'Reduced motion':paused?'Resume sky':'Pause sky';
 pauseButton.setAttribute('aria-pressed',String(paused||reduce.matches));pauseButton.disabled=reduce.matches||!enabled||!engine;
 document.body.classList.toggle('sky-off',!enabled);
 window.dispatchEvent(new Event('profile-theme-change'));
}
sync();
try{
 engine=createShaderSky(canvas,{speed:.035,coverage:.4,intensity:.58,amount:.35,scale:.4,variation:.65,interactive:false,lightning:false,glass:false,theme:isDark()?'dark':'light',colors:palettes[isDark()?'dark':'light']});
 document.documentElement.dataset.skyState=engine?'webgl':'fallback';
}catch(error){document.documentElement.dataset.skyState='fallback';console.warn('Sky preview is using its static background.',error);}
sync();
themeButton.addEventListener('click',()=>{choice=choice==='auto'?'light':choice==='light'?'dark':'auto';sync();});
toggleButton.addEventListener('click',()=>{enabled=!enabled;sync();});
pauseButton.addEventListener('click',()=>{paused=!paused;sync();});
systemDark.addEventListener('change',sync);reduce.addEventListener('change',sync);
window.addEventListener('pagehide',()=>engine?.destroy(),{once:true});
