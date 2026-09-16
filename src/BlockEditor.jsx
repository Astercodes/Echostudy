import React,{useState} from 'react';
import {Button,Modal,Field} from './App';
import {clock,minutes,duration,uid,validateBlock} from './model';
import {PlannerGoals} from './PlannerAllocation';
import StudyIntentionPicker from './StudyIntentionPicker';
import {availableWindows} from './planner-windows';
import {blockCategory,hasStudy,hasStretch} from './planner-blocks';
import {practiceNodes} from './stretch-engine';

export default function BlockEditor({block,blocks,goals,areas,data,close,submit,remove,createGoal}) {
  const [b,setB]=useState(()=>block || {id:uid(),title:'',start:480,end:540,kind:'deep',goalId:'',goalIds:[],objective:'',repeat:'none'});
  const [from,setFrom]=useState(clock(b.start)),[to,setTo]=useState(b.end===1440?'00:00':clock(b.end));
  const [error,setError]=useState(''),[showWindows,setShowWindows]=useState(false);
  const category=blockCategory(b),study=hasStudy(b),stretch=hasStretch(b),life=category==='life';
  const total=(to==='00:00'?1440:minutes(to))-minutes(from);
  const studyTime=b.studyMinutes ?? Math.floor(total/2);
  const plans=(data.stretches || []).filter(s=>s.status!=='completed');
  const nodes=practiceNodes(data);
  const change=(key,value)=>setB({...b,[key]:value});
  const draft=()=>({...b,start:minutes(from),end:to==='00:00'?1440:minutes(to)});
  return <Modal title={life?'Add Life Commitment':category==='combined'?'Schedule Study + Stretch':stretch?'Schedule Stretch':'Schedule Study'} onClose={close}>
    <form onSubmit={e=>{e.preventDefault();const next={...draft(),...(study?{intention:b.intention || 'peel'}:{}),...(stretch?{environment:b.environment || 'internal',stretchLevel:b.stretchLevel || 'practice',knowledgeIds:b.knowledgeIds || []}:{}),...(category==='combined'?{studyMinutes:studyTime}:{})};
      if(category==='combined' && (!Number.isFinite(studyTime)||studyTime<1||studyTime>=total)){setError('Give both Study and Stretch at least one minute within this block.');return;}
      const message=validateBlock(next,blocks);if(message){const movable=blocks.filter(x=>x.id!==next.id && next.start<x.end && next.end>x.start && ['could','should'].includes(x.priority)).sort((a,b)=>(a.priority==='could'?0:1)-(b.priority==='could'?0:1));setError(message+(movable.length?` Consider rescheduling “${movable[0].title}” (${movable[0].priority==='could'?'Could Do':'Should Do'}) to make room.`:''));return;}submit(next);
    }}>
      <div className="block-category-picker" role="group" aria-label="Time block category">{[['study','Study'],['stretch','Stretch'],['combined','Study + Stretch'],['life','Life commitment']].map(([id,label])=><button type="button" key={id} aria-pressed={category===id} onClick={()=>setB({...b,kind:{study:'deep',stretch:'stretch',combined:'combined',life:'life'}[id]})}>{label}</button>)}</div>
      {stretch && <Field label="Practice plan"><select aria-label="Practice plan" value={b.stretchPlanId || ''} onChange={e=>{const plan=plans.find(p=>p.id===e.target.value);setB({...b,stretchPlanId:e.target.value,...(plan?{title:plan.title,objective:plan.objective || '',environment:plan.environment || 'internal',stretchLevel:plan.stretchLevel || 'practice',knowledgeIds:plan.knowledgeIds || [],goalIds:plan.goalIds || (plan.goalId?[plan.goalId]:[]),goalId:plan.goalId || ''}:{})});}}><option value="">Create quick practice</option>{plans.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select></Field>}
      <Field label={life?'What?':stretch&&!study?'What are you practicing?':'What is this time for?'}><input autoFocus required value={b.title} onChange={e=>change('title',e.target.value)} placeholder={life?'Work, sleep, dentist, family…':study?'Topic or session title':'Ability or activity to practise'}/></Field>
      {life && <Field label="Life area (optional)"><select aria-label="Life area (optional)" value={b.areaId || ''} onChange={e=>change('areaId',e.target.value)}><option value="">No life area</option>{areas.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></Field>}
      <div className="form-grid"><Field label="Starts"><input type="time" required value={from} onChange={e=>setFrom(e.target.value)}/></Field><Field label="Ends"><input type="time" required value={to} onChange={e=>setTo(e.target.value)}/></Field></div>
      <p className="field-help">00:00 as an end time means midnight. Split overnight commitments into two blocks.</p>
      {!life && <Field label="Duration (hours)"><input type="number" min="0.25" max="24" step="0.25" value={Math.max(0,total/60)} onChange={e=>{const end=minutes(from)+Math.round(Number(e.target.value)*60);if(end<=1440&&end>minutes(from))setTo(end===1440?'00:00':clock(end));}}/></Field>}
      <Field label="Repeat"><select aria-label="Repeat" value={b.repeat || 'none'} onChange={e=>change('repeat',e.target.value)}><option value="none">Does not repeat</option><option value="daily">Every day</option><option value="weekdays">Weekdays</option><option value="weekly">Weekly on this day</option></select></Field>
      {b.repeat && b.repeat!=='none' && <p className="muted">Repeats from this day onward. Editing the repeat updates future occurrences; removing a block skips only that date.</p>}
      {!life && <><button type="button" className="text-btn" onClick={()=>setShowWindows(!showWindows)}>Find available windows</button>{showWindows&&<div className="planner-window-results">{availableWindows(blocks.filter(x=>x.id!==b.id)).map(w=><button type="button" className="planner-window" key={w.start} disabled={!Number.isFinite(total)||total<1||w.end-w.start<total} onClick={()=>{setFrom(clock(w.start));setTo(w.start+total===1440?'00:00':clock(w.start+total));}}>{clock(w.start)}–{clock(w.end)} · {duration(w.end-w.start)} free</button>)}<p className="muted">Only windows that fit the whole duration can be selected.</p></div>}</>}
      {category==='combined'&&<Field label="Study minutes within this block"><input aria-label="Study minutes within this block" type="number" required min="1" max={Math.max(1,total-1)} value={studyTime} onChange={e=>change('studyMinutes',Number(e.target.value))}/><small>Study first, then {Math.max(0,total-studyTime)} minutes of Stretch. One reserved block, with no double-counted time.</small></Field>}
      {study && <Field label="Study intention"><StudyIntentionPicker value={b.intention || 'peel'} onChange={value=>change('intention',value)}/></Field>}
      {stretch && <><Field label="Connected knowledge"><select aria-label="Connected knowledge" value={b.knowledgeIds?.[0] || ''} onChange={e=>change('knowledgeIds',e.target.value?[e.target.value]:[])}><option value="">Choose knowledge (optional)</option>{nodes.map(n=><option key={n.id} value={n.id}>{n.title}</option>)}</select></Field><div className="form-grid"><Field label="Practice environment"><select aria-label="Practice environment" value={b.environment || 'internal'} onChange={e=>change('environment',e.target.value)}>{[['internal','Internal'],['simulated','Simulated'],['social','Social'],['real','Real-world']].map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></Field><Field label="Stretch level"><select aria-label="Stretch level" value={b.stretchLevel || 'practice'} onChange={e=>change('stretchLevel',e.target.value)}>{[['rehearse','Rehearse'],['practice','Practice'],['perform','Perform'],['adapt','Adapt'],['lead-create','Lead/Create']].map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></Field></div></>}
      {!life && <><Field label="Session objective"><textarea value={b.objective || ''} onChange={e=>change('objective',e.target.value)} placeholder="What should this session help you understand or do?"/></Field><PlannerGoals goals={goals} areas={areas} value={b.goalIds || (b.goalId?[b.goalId]:[])} onChange={ids=>setB({...b,goalIds:ids,goalId:ids[0] || ''})} createGoal={defaults=>createGoal(defaults,draft())}/></>}
      <Field label="Priority (optional)"><select aria-label="Priority (optional)" value={b.priority || ''} onChange={e=>change('priority',e.target.value)}><option value="">No priority</option><option value="must">Must Do</option><option value="should">Should Do</option><option value="could">Could Do</option></select><small>If the day gets crowded, consider moving Could Do blocks first, then Should Do. Nothing moves automatically.</small></Field>
      {error&&<p className="error" role="alert">{error}</p>}
      <div className="form-actions">{block&&<button type="button" className="text-btn danger" onClick={()=>remove(b.id)}>Remove block</button>}<Button primary type="submit">{life?'Add':category==='combined'?'Schedule Study + Stretch':stretch?'Schedule Stretch':'Save time block'}</Button></div>
    </form>
  </Modal>;
}
