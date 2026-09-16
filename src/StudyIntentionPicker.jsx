import React from 'react';
export const STUDY_INTENTIONS = [['taste','Taste','Explore'],['peel','Peel','Understand'],['squeeze','Squeeze','Deepen'],['chew','Chew','Process'],['regurgitate','Regurgitate','Retrieve'],['absorb','Absorb','Integrate'],['take-root','Take Root','Retain'],['test','Test','Assess']];
export default function StudyIntentionPicker({value,onChange}) {
  return <div className="study-intention-picker" role="group" aria-label="Study intention">{STUDY_INTENTIONS.map(([id,label,hint])=><button type="button" key={id} className={value===id?'selected':''} aria-pressed={value===id} onClick={()=>onChange(id)}><strong>{label}</strong><small>{hint}</small></button>)}</div>;
}
