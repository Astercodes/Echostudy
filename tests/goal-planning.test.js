import { test } from 'node:test';
import assert from 'node:assert/strict';
import { goalPeriod, refreshRecurringGoals, suggestGoal } from '../src/goal-planning.js';
test('weekly and monthly periods cross years and leap days',()=>{
  assert.deepEqual(goalPeriod('weekly','2026-01-01'),{start:'2025-12-29',end:'2026-01-04'});
  assert.deepEqual(goalPeriod('monthly','2028-02-11'),{start:'2028-02-01',end:'2028-02-29'});
});
test('rollover preserves evidence and is idempotent',()=>{
  const goals=[{id:'g',repeat:'weekly',periodStart:'2026-09-07',due:'2026-09-13',progress:100}];
  const next=refreshRecurringGoals(goals,'2026-09-14');
  assert.equal(next[0].progress,0); assert.equal(next[0].due,'2026-09-20');
  assert.equal(next[0].periodHistory[0].progress,100);
  assert.equal(refreshRecurringGoals(next,'2026-09-15'),next);
});
test('Bible study suggests faith and spiritual capacity; unknown wording stays unclassified',()=>{
  const areas=[{id:'faith',name:'Faith & spirituality',subAreas:[{id:'scripture',name:'Scripture knowledge'}]},{id:'work',name:'Career',subAreas:[]}];
  const result=suggestGoal('Study the Bible each week',areas);
  assert.equal(result.areaId,'faith'); assert.ok(result.capacityIds.includes('spiritual'));
  assert.equal(suggestGoal('xyz',areas).areaId,'');
});
