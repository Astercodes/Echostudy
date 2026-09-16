export function availableWindows(blocks) {
  let cursor=0;
  const gaps=[];
  for(const b of blocks.filter(b=>b.status!=='skipped').sort((a,b)=>a.start-b.start)) {
    if(b.start>cursor) gaps.push({start:cursor,end:b.start});
    cursor=Math.max(cursor,b.end);
  }
  if(cursor<1440) gaps.push({start:cursor,end:1440});
  return gaps;
}
