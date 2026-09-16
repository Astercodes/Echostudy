import { validateBlock } from './model.js';
import {hasStudy,recurringCommitments,storePlannerBlock} from './planner-blocks.js';
export const isStudyBlock = hasStudy;
export function scheduledStudies(data, fromDate) {
  const dates=new Set(Object.keys(data.plans));
  if(data.commitmentRules?.length) for(let i=0;i<30;i++){const d=new Date(fromDate+'T12:00:00');d.setDate(d.getDate()+i);dates.add(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);}
  return [...dates].flatMap(date=>recurringCommitments(data,date).blocks
    .filter(b=>isStudyBlock(b) && date>=fromDate && !data.sessions.some(s=>s.blockId===b.id && (s.scheduledDate || s.date)===date) && data.timer?.blockId!==b.id)
    .map(b=>({...b,scheduledDate:date})))
    .sort((a,b)=>a.scheduledDate.localeCompare(b.scheduledDate)||a.start-b.start);
}
export function saveStudySchedule(data, session, schedule, runNow) {
  if (runNow && data.timer) throw Error('A study session is already active. Return to it before starting another.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(schedule.date)) throw Error('Choose a valid session date.');
  if (!Number.isFinite(session.planned) || session.planned<1 || session.planned>1440) throw Error('Choose a focus duration between 1 and 1440 minutes.');
  const blocks=recurringCommitments(data,schedule.date).blocks;
  const existing=blocks.find(b=>b.id===session.blockId);
  if (existing && !isStudyBlock(existing)) throw Error('This time belongs to a different activity. Choose a Study block.');
  if(existing?.kind==='combined' && (session.planned>=existing.end-existing.start || schedule.start!==existing.start)) throw Error('Keep time for Stretch in this combined block. Move the whole block in the planner.');
  const block={...existing,id:session.blockId,title:session.topic,objective:session.objective,
    start:schedule.start,end:existing?.kind==='combined'?existing.end:schedule.start+session.planned,kind:existing?.kind || 'deep',
    ...(existing?.kind==='combined'?{studyMinutes:session.planned}:{}),
    goalId:session.goalId,goalIds:session.goalIds,capacityIds:session.capacityIds,
    resourceId:session.resourceId,conceptId:session.conceptId,intention:session.intention};
  const error=validateBlock(block,blocks);
  if(error) throw Error(error);
  return {...storePlannerBlock({...data,plans:{...data.plans,[schedule.date]:blocks}},schedule.date,block),
    ...(runNow?{timer:{...session,scheduledDate:schedule.date}}:{})};
}
