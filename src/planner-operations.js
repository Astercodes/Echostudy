import {uid,validateBlock} from './model.js';
import {recurringCommitments,storePlannerBlock} from './planner-blocks.js';

export function changePlannerBlock(data,day,block,action,options={}) {
  const target=options.date || day;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(target)) throw Error('Choose a destination date.');
  const recorded=data.timer?.blockId===block.id || data.sessions.some(s=>s.blockId===block.id) || (data.stretches || []).some(s=>s.blockId===block.id && s.status!=='planned');
  if(recorded && action!=='duplicate') throw Error('This block has activity recorded. Duplicate it to plan new time without changing its history.');
  let next={...data,plans:{...data.plans}},items=[];
  const clean={...block,repeat:'none'};delete clean.repeatRuleId;
  if(action==='split') {
    const first=Number(options.first),gap=Number(options.gap),length=block.end-block.start;
    if(!Number.isFinite(first)||!Number.isFinite(gap)||first<1||gap<0||first+gap>=length) throw Error('Leave at least one minute in each session, with a break that fits inside the original block.');
    const segment=(start,end)=>{const b={...clean,id:uid(),start,end};if(block.kind==='combined'){const boundary=block.start+block.studyMinutes;if(end<=boundary)b.kind='deep';else if(start>=boundary)b.kind='stretch';else b.studyMinutes=boundary-start;}return b;};
    items=[segment(block.start,block.start+first),...(gap?[{id:uid(),title:'Break',kind:'life',start:block.start+first,end:block.start+first+gap,repeat:'none'}]:[]),segment(block.start+first+gap,block.end)];
  } else {
    const start=Number(options.start ?? block.start),end=Number(options.end ?? start+block.end-block.start);
    items=[{...clean,id:action==='duplicate'?uid():block.id,start,end}];
  }
  if(action!=='duplicate') {
    next.plans[day]=recurringCommitments(data,day).blocks.filter(b=>b.id!==block.id);
    if(block.repeatRuleId) next.skippedCommitments=[...(data.skippedCommitments || []),block.id];
    next.stretches=(data.stretches || []).filter(s=>!(s.blockId===block.id && s.date===day));
  }
  for(const b of items){
    const error=validateBlock(b,recurringCommitments(next,target).blocks);if(error)throw Error(error);
    const source=(data.stretches || []).find(s=>s.blockId===block.id && s.date===day);
    if(source && ['stretch','combined'].includes(b.kind)) {
      const plan={...source,id:action==='move'?source.id:uid(),blockId:b.id,date:target,status:'planned',actualMinutes:0,outcome:'',evidence:'',harvest:'',harvests:[]};
      next.stretches=[...(next.stretches || []).filter(s=>s.id!==plan.id),plan];
    }
    next=storePlannerBlock(next,target,b);
  }
  return next;
}
