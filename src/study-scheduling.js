import { validateBlock } from './model.js';
export const isStudyBlock = b => ['deep','light'].includes(b.kind);
export function scheduledStudies(data, fromDate) {
  return Object.entries(data.plans).flatMap(([date,blocks])=>blocks
    .filter(b=>isStudyBlock(b) && date>=fromDate && !data.sessions.some(s=>s.blockId===b.id && (s.scheduledDate || s.date)===date) && data.timer?.blockId!==b.id)
    .map(b=>({...b,scheduledDate:date})))
    .sort((a,b)=>a.scheduledDate.localeCompare(b.scheduledDate)||a.start-b.start);
}
export function saveStudySchedule(data, session, schedule, runNow) {
  if (runNow && data.timer) throw Error('A study session is already active. Return to it before starting another.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(schedule.date)) throw Error('Choose a valid session date.');
  if (!Number.isFinite(session.planned) || session.planned<1 || session.planned>1440) throw Error('Choose a focus duration between 1 and 1440 minutes.');
  const blocks=data.plans[schedule.date] || [];
  const existing=blocks.find(b=>b.id===session.blockId);
  if (existing && !isStudyBlock(existing)) throw Error('This time belongs to a different activity. Choose a Study block.');
  const block={...existing,id:session.blockId,title:session.topic,objective:session.objective,
    start:schedule.start,end:schedule.start+session.planned,kind:existing?.kind || 'deep',
    goalId:session.goalId,goalIds:session.goalIds,capacityIds:session.capacityIds,
    resourceId:session.resourceId,conceptId:session.conceptId,intention:session.intention};
  const error=validateBlock(block,blocks);
  if(error) throw Error(error);
  return {...data,plans:{...data.plans,[schedule.date]:[...blocks.filter(b=>b.id!==block.id),block].sort((a,b)=>a.start-b.start)},
    ...(runNow?{timer:{...session,scheduledDate:schedule.date}}:{})};
}
