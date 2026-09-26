import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,migrateWorkspace} from '../src/model.js';
test('palette migration updates legacy colors without changing content or identifiers',()=>{
 const state=initialState();state.lifeAreas[0].color='#173dc5';state.paletteFixture={id:'my-idea',color:'#ff7900',text:'Long-term idea — preserve #173dc5 exactly',custom:{color:'#123456'}};
 const result=migrateWorkspace(state);
 assert.equal(result.lifeAreas[0].color,'#c200fb');assert.equal(result.paletteFixture.color,'#ec7d10');assert.equal(result.paletteFixture.text,state.paletteFixture.text);assert.equal(result.paletteFixture.id,'my-idea');assert.equal(result.paletteFixture.custom.color,'#123456');assert.deepEqual(migrateWorkspace(result),result);
});
