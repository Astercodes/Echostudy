import {test} from 'node:test';
import assert from 'node:assert/strict';
import {recurringCommitments,storePlannerBlock,hasStudy,hasStretch,studyMinutes,stretchMinutes} from '../src/planner-blocks.js';
import {saveStudySchedule,scheduledStudies} from '../src/study-scheduling.js';
const empty=()=>({plans:{},goals:[],stretches:[],sessions:[],timer:null});
test('combined block reserves one hour and shares the split with Study and Stretch',()=>{
 const b={id:'both',title:'Feedback',start:600,end:660,kind:'combined',studyMinutes:25,environment:'social',stretchLevel:'adapt'};
 let data=storePlannerBlock(empty(),'2026-09-15',b);
 assert.ok(hasStudy(b)&&hasStretch(b));assert.equal(studyMinutes(b),25);assert.equal(stretchMinutes(b),35);
 assert.equal(data.stretches[0].planned,35);assert.equal(data.stretches[0].environment,'social');
 assert.equal(scheduledStudies(data,'2026-09-15').length,1);
 data=saveStudySchedule(data,{blockId:'both',topic:'Feedback',planned:25},{date:'2026-09-15',start:600},true);
 assert.equal(data.plans['2026-09-15'][0].end,660);
 assert.throws(()=>saveStudySchedule({...data,timer:null},{blockId:'both',topic:'Feedback',planned:60},{date:'2026-09-15',start:600},true),/Keep time for Stretch/);
});
test('weekdays recur without duplicates, skip weekends and surface conflicts',()=>{
 const data=storePlannerBlock(empty(),'2026-09-14',{id:'work',title:'Work',kind:'life',start:540,end:1020,repeat:'weekdays'});
 assert.equal(recurringCommitments(data,'2026-09-15').blocks.length,1);
 assert.equal(recurringCommitments(data,'2026-09-19').blocks.length,0);
 assert.equal(recurringCommitments(data,'2026-09-14').blocks.length,1);
 data.plans['2026-09-16']=[{id:'appointment',title:'Appointment',start:600,end:660}];
 assert.equal(recurringCommitments(data,'2026-09-16').conflicts.length,1);
 data.skippedCommitments=['work:2026-09-15'];assert.equal(recurringCommitments(data,'2026-09-15').blocks.length,0);
});
test('editing a recurring commitment changes future dates and preserves the earlier rule',()=>{
 let data=storePlannerBlock(empty(),'2026-09-14',{id:'work',title:'Work',kind:'life',start:540,end:1020,repeat:'daily'});
 const occurrence=recurringCommitments(data,'2026-09-17').blocks[0];
 data=storePlannerBlock(data,'2026-09-17',{...occurrence,start:600});
 assert.equal(recurringCommitments(data,'2026-09-16').blocks[0].start,540);
 assert.equal(recurringCommitments(data,'2026-09-18').blocks[0].start,600);
});
