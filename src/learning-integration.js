import {goalPeriod} from './goal-planning.js';
import {recurringCommitments,storePlannerBlock,hasStudy,hasStretch,studyMinutes,stretchMinutes} from './planner-blocks.js';
import {availableWindows} from './planner-windows.js';
import {uid,validateBlock} from './model.js';
export const linkedGoals=item=>[...new Set([item.goalId,...(item.goalIds||[])].filter(Boolean))];
export function goalTime(data,g,day) {
 const horizon=({Week:'weekly',Month:'monthly',Year:'yearly',Day:'daily'})[g.level];
 const fallback=horizon?goalPeriod(horizon,g.due||day):{start:'0000-01-01',end:day};
 const period=g.repeat&&g.repeat!=='none'?goalPeriod(g.repeat,day):{start:g.periodStart||fallback.start,end:g.due||fallback.end};
 const within=d=>d>=period.start&&d<=period.end;
 const sessions=data.sessions.filter(s=>linkedGoals(s).includes(g.id)&&within(s.date));
 const stretches=(data.stretches||[]).filter(s=>s.status==='completed'&&linkedGoals(s).includes(g.id)&&within(s.date));
 const life=Object.entries(data.plans).flatMap(([date,bs])=>within(date)?bs.filter(b=>!hasStudy(b)&&!hasStretch(b)&&b.status==='completed'&&linkedGoals(b).includes(g.id)):[]);
 const completed=g.timeActivity==='stretch'?stretches.reduce((n,s)=>n+(s.actualMinutes||0),0):g.timeActivity==='life'?life.reduce((n,b)=>n+b.end-b.start,0):sessions.reduce((n,s)=>n+(s.actualMs||0)/60000,0);
 return {completed,remaining:Math.max(0,(g.targetHours||0)*60-completed),period};
}
export function integrateLearning(data,day) {
 const goals=data.goals.map(g=>{const evidence={studyIds:data.sessions.filter(s=>linkedGoals(s).includes(g.id)).map(s=>s.id),stretchIds:(data.stretches||[]).filter(s=>s.status==='completed'&&linkedGoals(s).includes(g.id)).map(s=>s.id)};return {...g,contributionEvidence:evidence,...(g.targetHours>0?{progress:Math.min(100,Math.round(goalTime(data,g,day).completed/(g.targetHours*60)*100))}:{})};});
 const concepts=data.concepts.map(c=>{const sessions=data.sessions.filter(s=>s.conceptId===c.id);return sessions.length?{...c,studySessionIds:sessions.map(s=>s.id),lastStudiedAt:sessions.at(-1).completedAt}:c;});
 return {...data,goals,concepts};
}
const dateString=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export function suggestGoalBlocks(data,g,day,now=new Date()) {
 const stats=goalTime(data,g,day);if(!g.targetHours||g.timeActivity==='life')return {...stats,blocks:[],unscheduled:stats.remaining};
 let remaining=stats.remaining,scheduled=0;const days=[];const end=stats.period.end;
 for(let i=0;i<31;i++){const d=new Date(day+'T12:00:00');d.setDate(d.getDate()+i);const date=dateString(d);if(date>end)break;const blocks=recurringCommitments(data,date).blocks;
   scheduled+=blocks.filter(b=>b.status!=='skipped'&&b.status!=='completed'&&linkedGoals(b).includes(g.id)&&!(g.timeActivity==='stretch'?(data.stretches||[]).some(s=>s.blockId===b.id&&s.date===date&&s.status==='completed'):data.sessions.some(s=>s.blockId===b.id&&(s.scheduledDate||s.date)===date))).reduce((n,b)=>n+(g.timeActivity==='stretch'?(hasStretch(b)?stretchMinutes(b):0):(hasStudy(b)?(b.focusMinutes ?? studyMinutes(b)):0)),0);
   const earliest=date===dateString(now)?Math.max(480,Math.ceil((now.getHours()*60+now.getMinutes())/5)*5):480;
   days.push({date,windows:availableWindows(blocks).map(w=>({start:Math.max(w.start,earliest),end:Math.min(w.end,1260)})).filter(w=>w.end>w.start)});
 }
 remaining=Math.max(0,Math.ceil(remaining-scheduled));const suggestions=[];
 days.forEach((d,i)=>{let wanted=Math.ceil(remaining/(days.length-i));for(const w of d.windows){if(wanted<=0)break;let amount=Math.min(wanted,w.end-w.start);const wall=n=>n+(g.timeActivity==='stretch'?0:Math.floor((n-1)/25)*5);while(amount>0&&wall(amount)>w.end-w.start)amount--;if(amount<5)continue;suggestions.push({id:uid(),date:d.date,title:g.title,kind:g.timeActivity==='stretch'?'stretch':'deep',start:w.start,end:w.start+wall(amount),focusMinutes:amount,goalId:g.id,goalIds:[g.id],objective:g.title,intention:'peel',capacityIds:g.capacityIds||[],repeat:'none'});remaining-=amount;wanted-=amount;}});
 return {...stats,scheduled,blocks:suggestions,unscheduled:remaining,daysRemaining:days.length};
}
export function addGoalBlocks(data,blocks){let next=data;for(const {date,...b} of blocks){const error=validateBlock(b,recurringCommitments(next,date).blocks);if(error)throw Error(error);next=storePlannerBlock(next,date,b);}return next;}
