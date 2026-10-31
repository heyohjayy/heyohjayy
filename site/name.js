// Type the name once per page visit, then leave it fully visible.
const heading=document.querySelector('#name');
const words=[...heading.querySelectorAll('.name-word')];
const full=words.map(word=>word.textContent);
const carets=[...heading.querySelectorAll('.typing-caret')];
const dot=heading.querySelector('.name-dot');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let finished=false;
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function finish(){
 finished=true;
 words.forEach((word,index)=>{word.textContent=full[index];word.style.visibility='visible';});
 dot.dataset.visible='true';heading.dataset.typing='false';heading.dataset.nameState='done';
 carets.forEach(caret=>delete caret.dataset.active);
}
async function waitVisible(){
 if(!document.hidden)return;
 await new Promise(resolve=>{const resume=()=>{if(!document.hidden){document.removeEventListener('visibilitychange',resume);resolve();}};document.addEventListener('visibilitychange',resume);});
}
async function type(){
 words.forEach(word=>{word.textContent='';word.style.visibility='visible';});
 heading.dataset.typing='true';heading.dataset.nameState='waiting';
 await waitVisible();await delay(350);
 if(finished)return;
 heading.dataset.nameState='typing';
 for(let index=0;index<words.length;index++){
   carets.forEach(caret=>delete caret.dataset.active);carets[index].dataset.active='true';
   for(const letter of full[index]){
     await waitVisible();if(finished)return;
     words[index].textContent+=letter;await delay(105);
   }
   if(index<words.length-1)await delay(260);
 }
 finish();
}
reduced.addEventListener('change',()=>{if(reduced.matches)finish();});
if(reduced.matches)finish();else type();
