import {test} from 'node:test';
import assert from 'node:assert/strict';
import {weekDays,shiftWeek} from '../src/planner-week.js';
test('weeks run Monday through Sunday across month and year boundaries',()=>{assert.deepEqual(weekDays('2027-01-01'),['2026-12-28','2026-12-29','2026-12-30','2026-12-31','2027-01-01','2027-01-02','2027-01-03']);assert.equal(shiftWeek('2027-01-01',-1),'2026-12-25');assert.equal(shiftWeek('2027-01-01',1),'2027-01-08');});
