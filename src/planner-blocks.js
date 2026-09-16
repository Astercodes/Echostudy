export const blockCategory = b => ['deep','light'].includes(b.kind) ? 'study' : b.kind === 'combined' ? 'combined' : b.kind === 'stretch' ? 'stretch' : 'life';
export const hasStudy = b => ['study','combined'].includes(blockCategory(b));
export const hasStretch = b => ['stretch','combined'].includes(blockCategory(b));
export const studyMinutes = b => b.kind === 'combined' ? b.studyMinutes : b.end-b.start;
export const stretchMinutes = b => b.kind === 'combined' ? b.end-b.start-b.studyMinutes : b.end-b.start;
export function recurringCommitments(data, day) {
  const blocks=[...(data.plans[day] || [])], conflicts=[];
  for(const rule of data.commitmentRules || []) {
    const weekday=new Date(day+'T12:00:00').getDay();
    if(day<rule.from || (rule.until && day>=rule.until) || (rule.repeat==='weekdays' && [0,6].includes(weekday)) || (rule.repeat==='weekly' && weekday!==new Date(rule.from+'T12:00:00').getDay())) continue;
    const id=`${rule.id}:${day}`;
    if(blocks.some(b=>b.id===id) || (data.skippedCommitments || []).includes(id)) continue;
    const b={...rule.block,id,repeatRuleId:rule.id,repeat:rule.repeat};
    if(blocks.some(x=>x.status!=='skipped' && b.start<x.end && b.end>x.start)) {conflicts.push(b);continue;}
    blocks.push(b);
  }
  return {blocks:blocks.sort((a,b)=>a.start-b.start),conflicts};
}
export function storePlannerBlock(data, day, block) {
  let plans={...data.plans},rules=[...(data.commitmentRules || [])];
  const repeat=block.repeat || 'none';
  let saved={...block};
  if(block.repeatRuleId || repeat!=='none') {
    const ruleId=block.repeatRuleId || block.id;
    // Changing a recurring commitment affects the selected day onward.
    rules=rules.flatMap(r=>r.id!==ruleId?[r]:r.from<day?[{...r,until:!r.until || r.until>day?day:r.until}]:[]);
    for(const [date,items] of Object.entries(plans)) if(date>=day) plans[date]=items.filter(b=>b.repeatRuleId!==ruleId);
    if(repeat!=='none') {
      saved={...block,id:`${ruleId}:${day}`,repeatRuleId:ruleId};
      rules.push({id:ruleId,from:day,repeat,block:{...saved}});
    } else { delete saved.repeatRuleId; saved.repeat='none'; }
  }
  plans[day]=[...(plans[day] || []).filter(b=>b.id!==block.id && b.id!==saved.id),saved].sort((a,b)=>a.start-b.start);
  let stretches=data.stretches || [];
  if(hasStretch(saved)) {
    const existing=stretches.find(s=>s.blockId===saved.id && s.date===day);
    const source=stretches.find(s=>s.id===saved.stretchPlanId);
    const goal=data.goals?.find(g=>g.id===saved.goalId);
    const record={title:'',objective:'',success:'',capacityIds:[],areaId:'',subAreaId:'',status:'planned',actualMinutes:0,completion:100,outcome:'',nextStep:'',source:'user',environment:'internal',challenge:1,knowledgeIds:[],repeat:'once',studyGap:'',gapResolved:false,evidence:'',harvest:'',harvests:[],applyAction:'',horizon:'daily',parentStretchId:'',targetDate:'',
      ...source,...existing,id:existing?.id || `stretch:${saved.id}`,blockId:saved.id,date:day,title:saved.title,objective:saved.objective || '',
      goalId:saved.goalId || '',goalIds:saved.goalIds || [],areaId:goal?.areaId || '',subAreaId:goal?.subAreaId || '',capacityIds:existing?.capacityIds || source?.capacityIds || goal?.capacityIds || [],
      environment:saved.environment || 'internal',stretchLevel:saved.stretchLevel || 'practice',knowledgeIds:saved.knowledgeIds || [],planned:stretchMinutes(saved),status:existing?.status || 'planned'};
    stretches=[...stretches.filter(s=>s.id!==record.id),record];
  }
  return {...data,plans,commitmentRules:rules,stretches};
}
