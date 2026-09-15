import {test} from 'node:test';
import assert from 'node:assert/strict';
import {availableWindows} from '../src/planner-windows.js';
test('all commitments, study and stretch are preserved and excluded',()=>{
 const blocks=[{start:600,end:660,kind:'stretch'},{start:0,end:480,kind:'fixed'},{start:510,end:570,kind:'deep'}];
 const before=JSON.stringify(blocks);
 assert.deepEqual(availableWindows(blocks),[{start:480,end:510},{start:570,end:600},{start:660,end:1440}]);
 assert.equal(JSON.stringify(blocks),before);
});
test('full, empty, adjacent and overlapping days',()=>{
 assert.deepEqual(availableWindows([]),[{start:0,end:1440}]);
 assert.deepEqual(availableWindows([{start:0,end:600},{start:600,end:1440}]),[]);
 assert.deepEqual(availableWindows([{start:0,end:700},{start:600,end:800}]),[{start:800,end:1440}]);
});
