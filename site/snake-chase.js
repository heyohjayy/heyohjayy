// Shortest safe route to a target; the departing tail is available next step.
export const cellKey=([x,y])=>`${x},${y}`;
export function routeTo(body,target,width=54,height=7,allowed=null){
  const blocked=new Set(body.slice(0,-1).map(cellKey));
  const queue=[[body[0],[]]],seen=new Set([cellKey(body[0])]);
  for(let i=0;i<queue.length;i++){
    const [head,path]=queue[i];
    if(cellKey(head)===cellKey(target))return path;
    const directions=[[1,0],[0,1],[-1,0],[0,-1]].sort((a,b)=>
      Math.abs(head[0]+a[0]-target[0])+Math.abs(head[1]+a[1]-target[1])-
      Math.abs(head[0]+b[0]-target[0])-Math.abs(head[1]+b[1]-target[1]));
    for(const [dx,dy] of directions){
      const next=[head[0]+dx,head[1]+dy],id=cellKey(next);
      if(next[0]<0||next[0]>=width||next[1]<0||next[1]>=height||(allowed&&!allowed.has(id))||blocked.has(id)||seen.has(id))continue;
      seen.add(id);queue.push([next,[...path,next]]);
    }
  }
  return null;
}
export function startingBody(cells,length=12){
  const allowed=new Set(cells.map(c=>cellKey([c.column,c.row])));
  for(let row=0;row<7;row++)for(let head=length-1;head<54;head++){
    const body=Array.from({length},(_,i)=>[head-i,row]);
    if(body.every(p=>allowed.has(cellKey(p))))return body;
  }
  const first=cells[0];return first?[[first.column,first.row]]:[];
}
export function chooseTarget(body,cells,now,previous,state={}){
  const occupied=new Set(body.map(cellKey));
  const allowed=new Set(cells.map(c=>cellKey([c.column,c.row])));
  const min=Math.min(...cells.map(c=>c.column)),max=Math.max(...cells.map(c=>c.column));
  const zone=c=>Math.min(2,Math.floor((c.column-min)*3/(max-min+1)));
  const shuffle=items=>{for(let i=items.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[items[i],items[j]]=[items[j],items[i]];}return items;};
  // Gameplay targets can use empty days: source activity always stays unchanged.
  const candidates=cells.filter(c=>!occupied.has(cellKey([c.column,c.row]))&&cellKey([c.column,c.row])!==previous);
  if(!state.zones?.length)state.zones=shuffle([0,1,2]);
  for(const area of [...state.zones]){
    for(const c of shuffle(candidates.filter(c=>zone(c)===area))){
      const point=[c.column,c.row];
      if(routeTo(body,point,54,7,allowed)?.length){state.zones.splice(state.zones.indexOf(area),1);return point;}
    }
  }
  return null;
}
