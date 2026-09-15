import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateGoal,goalProgress} from '../src/model.js';
const areas=[{id:'a',subAreas:[{id:'s'}]},{id:'b',subAreas:[{id:'t'}]}];
const first={id:'first',title:'First',level:'Year',areaId:'a',progress:0};
const second={id:'second',title:'Second',level:'Quarter',areaId:'b',progress:0};
const child={id:'child',title:'Shared',level:'Month',areaId:'a',progress:60,parent:'first',locations:[{areaId:'b',subAreaId:'t'}],contributesTo:['second']};
test('shared goal validates across areas and contributes to both parents',()=>{
 const goals=[first,second,child];
 assert.equal(validateGoal(child,goals,areas),'');
 assert.equal(goalProgress('first',goals),60);
 assert.equal(goalProgress('second',goals),60);
});
test('invalid locations and reverse-horizon links are rejected',()=>{
 assert.ok(validateGoal({...child,locations:[{areaId:'b',subAreaId:'s'}]},[first,second,child],areas));
 assert.ok(validateGoal({...first,contributesTo:['child']},[first,second,child],areas));
});
test('same child contributes only once to a parent',()=>{
 assert.equal(goalProgress('first',[first,{...child,contributesTo:['first']}]),60);
});
