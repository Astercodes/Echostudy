export const linkedGoals=item=>[...new Set([item.goalId,...(item.goalIds||[])].filter(Boolean))];
export function integrateLearning(data) {
 const goals=data.goals.map(g=>({...g,contributionEvidence:{studyIds:data.sessions.filter(s=>linkedGoals(s).includes(g.id)).map(s=>s.id),stretchIds:(data.stretches||[]).filter(s=>s.status==='completed'&&linkedGoals(s).includes(g.id)).map(s=>s.id)}}));
 const concepts=data.concepts.map(c=>{const sessions=data.sessions.filter(s=>s.conceptId===c.id);return sessions.length?{...c,studySessionIds:sessions.map(s=>s.id),lastStudiedAt:sessions.at(-1).completedAt}:c;});
 return {...data,goals,concepts};
}
