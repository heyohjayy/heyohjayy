// Letterforms are individual bricks placed directly across the calendar.
export function paintBrickGreeting(canvas,now,font,dark){
  const box=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);
  const width=Math.round(box.width*dpr),height=Math.round(box.height*dpr);
  if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
  const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,box.width,box.height);
  const lines=box.width<600?['HELLO','CATCH ME','BUILDING']:['HELLO','CATCH ME BUILDING'];
  const size=Math.min(6,(box.width-24)/(Math.max(...lines.map(l=>l.length))*6),(box.height-32)/(lines.length*9));
  const top=(box.height-lines.length*9*size)/2;
  const dissolve=Math.max(0,Math.min(1,(now-1800)/1400));
  let index=0;
  lines.forEach((line,lineIndex)=>{
    const left=(box.width-(line.length*6-1)*size)/2;
    [...line].forEach((letter,charIndex)=>{(font[letter]||[]).forEach((row,y)=>{[...row].forEach((pixel,x)=>{
      if(pixel!=='1')return;const i=index++,arrive=Math.max(0,Math.min(1,(now-(i%13)*16)/350));
      const dx=Math.sin(i*2.399)*32*dissolve*size/4,dy=Math.cos(i*1.719)*24*dissolve*size/4;
      ctx.globalAlpha=arrive*Math.pow(1-dissolve,1.2);ctx.fillStyle=lineIndex===0?(dark?'#9cd8ff':'#0879c4'):(dark?'#68bdff':'#375e7c');
      ctx.fillRect(left+(charIndex*6+x)*size+dx,top+(lineIndex*9+y)*size+dy+(1-arrive)*8,size*.8,size*.8);
    });});});
  });
  ctx.globalAlpha=1;
}
