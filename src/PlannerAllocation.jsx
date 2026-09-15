import React,{useState} from 'react';
import {Button,Field} from './App';
import {clock,duration,uid,today} from './model';
import {availableWindows} from './planner-windows';
import './planner-allocation.css';
export function PlannerGoals({goals,areas,value,onChange}) {
  const [area,setArea]=useState(''),[sub,setSub]=useState(''),[search,setSearch]=useState('');
  const visible=goals.filter(g=>[{areaId:g.areaId,subAreaId:g.subAreaId},...(g.locations||[])].some(l=>(!area||l.areaId===area)&&(!sub||l.subAreaId===sub))&&g.title.toLowerCase().includes(search.toLowerCase()));
  return <div className="planner-goal-picker"><div className="form-grid"><Field label="Filter life area"><select value={area} onChange={e=>{setArea(e.target.value);setSub('');}}><option value="">All life areas</option>{areas.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></Field><Field label="Filter sub-area"><select value={sub} disabled={!area} onChange={e=>setSub(e.target.value)}><option value="">All sub-areas</option>{areas.find(a=>a.id===area)?.subAreas.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></Field></div>
    <input aria-label="Search contributing goals" placeholder="Search goals…" value={search} onChange={e=>setSearch(e.target.value)}/>
    <div className="planner-goal-options">{visible.map(g=><label key={g.id}><input type="checkbox" checked={value.includes(g.id)} onChange={e=>onChange(e.target.checked?[...value,g.id]:value.filter(id=>id!==g.id))}/><span>{g.title}<small>{g.level} · {areas.find(a=>a.id===g.areaId)?.name}</small></span></label>)}{!visible.length&&<p>No goals match these filters.</p>}</div>
    <div className="planner-selected">{value.map(id=><button type="button" key={id} onClick={()=>onChange(value.filter(x=>x!==id))} aria-label={`Remove ${goals.find(g=>g.id===id)?.title}`}>{goals.find(g=>g.id===id)?.title || 'Unavailable goal'} ×</button>)}</div>
    <small>{value.length} goals selected · selections stay as you change filters</small>
  </div>;
}
export default function PlannerAllocation({blocks,data,date,update,notify}) {
  const [hours,setHours]=useState(1),[kind,setKind]=useState('deep'),[ids,setIds]=useState([]),[show,setShow]=useState(false),[title,setTitle]=useState('');
  const gaps=availableWindows(blocks), requested=Math.round(hours*60);
  const now=new Date();
  return <section className="planner-allocation"><header><div><span className="eyebrow">DESIGN YOUR DAY</span><h2>Give your growth a place in the day.</h2><p>Add sleep, meals, work and other commitments first. Then choose an open window for Study or Stretch.</p></div><time dateTime={today()} className="planner-current-date"><span>{now.getFullYear()} · {now.toLocaleString(undefined,{month:'long'})}</span><strong>{String(now.getDate()).padStart(2,'0')}</strong><small>{now.toLocaleString(undefined,{weekday:'long'})}</small></time></header>
    <div className="form-grid"><Field label="Use this time for"><select value={kind} onChange={e=>setKind(e.target.value)}><option value="deep">Study · deep focus</option><option value="light">Study · light review</option><option value="stretch">Stretch · deliberate practice</option></select></Field><Field label="Hours to allocate"><input type="number" min="0.25" max="24" step="0.25" value={hours} onChange={e=>setHours(Number(e.target.value))}/></Field></div>
    <Field label="Session intention (optional)"><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="What will you study or practise?"/></Field>
    <h3>Which goals does this time support?</h3><PlannerGoals goals={data.goals} areas={data.lifeAreas} value={ids} onChange={setIds}/>
    <Button primary onClick={()=>setShow(true)}>Find available windows</Button>
    {show&&<div className="planner-window-results"><h3>Available on {date}</h3><p>These gaps exclude every existing block, including Study and Stretch. Choose where to place your time.</p>{!gaps.length&&<p>Your full 24 hours are allocated. Edit a block to make space.</p>}{gaps.map(gap=><div className="planner-window" key={gap.start}><span><strong>{clock(gap.start)}–{clock(gap.end)}</strong><small>{duration(gap.end-gap.start)} free</small></span><Button disabled={!Number.isFinite(requested)||requested<15||requested>1440||requested>gap.end-gap.start||!ids.length} onClick={()=>{
      const block={id:uid(),title:title.trim() || (kind==='stretch'?'Stretch practice':'Intentional study'),start:gap.start,end:gap.start+requested,kind,goalIds:ids,goalId:ids[0],objective:title.trim()};
      update([...blocks,block].sort((a,b)=>a.start-b.start));notify('Time allocated. Edit the block to adjust its start within the window.');
    }}>Use this window</Button></div>)}{!ids.length&&<p>Select at least one contributing goal to allocate time.</p>}{(!Number.isFinite(requested)||requested<15||requested>1440)&&<p>Choose between 0.25 and 24 hours.</p>}{gaps.length>0&&Number.isFinite(requested)&&!gaps.some(g=>g.end-g.start>=requested)&&<p>No single window fits. Reduce the hours and place smaller sessions in separate windows.</p>}</div>}
  </section>;
}
