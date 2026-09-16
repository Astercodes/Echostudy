import React,{useState} from 'react';
import {Button} from './App';
import {duration,clock,today} from './model';
import {suggestGoalBlocks,addGoalBlocks} from './learning-integration';
export default function GoalTimeSuggestions({data,save,notify}){
 const [open,setOpen]=useState(false);
 const goals=data.goals.filter(g=>g.targetHours>0&&g.timeActivity!=='life'&&g.progress<100);
 if(!goals.length)return null;
 return <section className="card" style={{margin:'16px 0',padding:18}}><button className="text-btn" onClick={()=>setOpen(!open)}>Plan time toward your goals · {goals.length} {open?'−':'+'}</button>{open&&goals.map(g=>{const s=suggestGoalBlocks(data,g,today());return <article key={g.id} style={{padding:'16px 0',borderTop:'1px solid #e8eef7'}}><h3>{g.title}</h3><p>{duration(Math.floor(s.completed))} completed · {duration(Math.ceil(s.remaining))} remaining · {s.daysRemaining||0} days available</p>{s.scheduled>0&&<small>{duration(s.scheduled)} already scheduled</small>}<ul>{s.blocks.map(b=><li key={b.id}>{b.date} · {clock(b.start)}–{clock(b.end)} · {duration(b.focusMinutes)} {g.timeActivity==='stretch'?'practice':'focus + breaks'}</li>)}</ul><small>Suggestions use available time between 8 AM and 9 PM, looking up to 31 days ahead. Study blocks include five-minute breaks.</small>{s.unscheduled>0&&<p>{duration(Math.ceil(s.unscheduled))} still needs space.</p>}{s.blocks.length>0&&<Button onClick={()=>{try{save(addGoalBlocks(data,s.blocks));notify('Suggested blocks added.');}catch(e){notify(e.message);}}}>Add suggested blocks</Button>}</article>;})}</section>;
}
