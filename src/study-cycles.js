import {focusedMs} from './model.js';
export const focusWallMinutes=n=>n+Math.max(0,Math.floor((n-1)/25))*5;
export function focusWithinWindow(n){let focused=n;while(focused>0&&focusWallMinutes(focused)>n)focused--;return focused;}
export function advanceStudyCycle(timer,now=Date.now()) {
 if(!timer?.focusCycles||!timer.started||timer.cyclePhase==='break')return timer;
 const limit=Math.min(timer.planned*60000,(timer.cycleBase||0)+25*60000);
 if(focusedMs(timer,now)<limit)return timer;
 return {...timer,elapsed:limit,started:null,cyclePhase:limit>=timer.planned*60000?'complete':'break',breakUntil:now+5*60000,pauses:[...(timer.pauses||[]),{start:now,end:null,reason:'focus-cycle'}]};
}
export function nextStudyCycle(timer,now=Date.now()) {
 if(timer.cyclePhase!=='break'||now<timer.breakUntil)return timer;
 return {...timer,cyclePhase:'focus',cycleBase:timer.elapsed,started:now,pauses:timer.pauses.map((p,i)=>i===timer.pauses.length-1?{...p,end:now}:p)};
}
