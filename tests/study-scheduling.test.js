import {test} from 'node:test';
import assert from 'node:assert/strict';
import {saveStudySchedule,scheduledStudies} from '../src/study-scheduling.js';
const day='2026-09-15';
const session={id:'session',blockId:'study',topic:'Feedback',objective:'Explain feedback',planned:30,goalId:'a',goalIds:['a','b'],resourceId:'book',intention:'chew',date:day};
const empty=()=>({plans:{},sessions:[],timer:null});
test('Study-created session appears in planner and upcoming without starting timer',()=>{
 const data=saveStudySchedule(empty(),session,{date:day,start:600},false);
 assert.equal(data.timer,null);
 assert.equal(data.plans[day][0].end,630);
 assert.equal(scheduledStudies(data,day)[0].resourceId,'book');
 assert.deepEqual(scheduledStudies(data,day)[0].goalIds,['a','b']);
});
test('launching scheduled study updates same block and completion clears upcoming',()=>{
 let data=saveStudySchedule(empty(),session,{date:day,start:600},false);
 data=saveStudySchedule(data,{...session,intention:'peel'},{date:day,start:600},true);
 assert.equal(data.plans[day].length,1);assert.equal(data.timer.blockId,'study');
 assert.equal(data.plans[day][0].intention,'peel');assert.equal(scheduledStudies(data,day).length,0);
 data={...data,sessions:[data.timer],timer:null};assert.equal(scheduledStudies(data,day).length,0);
});
test('conflicts and midnight overflow cannot overwrite commitments',()=>{
 const data={...empty(),plans:{[day]:[{id:'work',title:'Work',start:610,end:700,kind:'fixed'}]}};
 assert.throws(()=>saveStudySchedule(data,session,{date:day,start:600},true),/overlaps/);
 assert.equal(data.plans[day].length,1);
 assert.throws(()=>saveStudySchedule(empty(),session,{date:day,start:1430},true),/within this day/);
});
test('upcoming is ordered by day and excludes non-study and completed blocks',()=>{
 let data=saveStudySchedule(empty(),session,{date:'2026-09-17',start:600},false);
 data=saveStudySchedule(data,{...session,blockId:'earlier'},{date:day,start:900},false);
 assert.deepEqual(scheduledStudies(data,day).map(b=>b.id),['earlier','study']);
 assert.throws(()=>saveStudySchedule({...data,timer:session},session,{date:day,start:600},true),/already active/);
});
