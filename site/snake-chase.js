// Shortest safe route to a target; the departing tail is available next step.
export const cellKey=([x,y])=>`${x},${y}`;
export function routeTo(body,target,width=54,height=7){
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
      if(next[0]<0||next[0]>=width||next[1]<0||next[1]>=height||blocked.has(id)||seen.has(id))continue;
      seen.add(id);queue.push([next,[...path,next]]);
    }
  }
  return null;
}
export function chooseTarget(body,cells,now,previous){
  const occupied=new Set(body.map(cellKey));
  const candidates=cells.filter(c=>c.level>0&&now-c.eaten>2600&&!occupied.has(cellKey([c.column,c.row]))&&cellKey([c.column,c.row])!==previous);
  // Prefer a visible, manageable chase; random selection prevents a fixed circuit.
  const near=candidates.filter(c=>{const d=Math.abs(c.column-body[0][0])+Math.abs(c.row-body[0][1]);return d>=6&&d<=24;});
  const pool=[...(near.length?near:candidates)].sort(()=>Math.random()-.5);
  for(const c of pool){const point=[c.column,c.row];if(routeTo(body,point)?.length)return point;}
  return null;
}
