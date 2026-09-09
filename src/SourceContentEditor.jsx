import React, { useContext, useState } from "react";
import { Field } from "./App";
import { VoiceField } from "./VoiceField";
import { KnowledgeSourceContext, SourceOpen } from "./KnowledgeSources";
import { LEARNING_MODES } from "./knowledge-learning";
import { ACTION_COMPONENTS } from "./action-components";
import { graftKnowledge, knowledgeEntries } from "./knowledge-tree";

export default function SourceContentEditor({node, data, persist}) {
  const [section, setSection] = useState("main");
  const context = useContext(KnowledgeSourceContext);
  const contentLabel = ["life-area","sub-area"].includes(node.kind) ? "Workspace content" : "Fruit content";
  const parts = [{id:"main",group:"Source",label:"Main content",fieldLabel:contentLabel,value:node.description || "",resourceScope:node.id+":content",write:value=>persist({description:value})}];
  for (const mode of ["plant","pluck"]) {
    for (const [key,label,prompt] of ACTION_COMPONENTS[mode].fields) {
      const values = node.learning?.[mode]?.components || {};
      parts.push({id:`${mode}:${key}`,group:ACTION_COMPONENTS[mode].title,label,fieldLabel:label,prompt,value:values[key] || "",mode,scope:`${node.id}:${mode}:${key}`,
        write:value=>persist({learning:{...node.learning,[mode]:{...node.learning?.[mode],components:{...values,[key]:value}}}})});
    }
  }
  for (const [mode,spec] of Object.entries(LEARNING_MODES)) {
    for (const [key,label,prompt] of spec.fields.filter(([key])=>node.learning?.[mode]?.[key])) {
      parts.push({id:`study:${mode}:${key}`,group:spec.title,label,fieldLabel:label,prompt,value:node.learning[mode][key],mode:mode === "tasteExplore" ? "taste" : mode,scope:`${node.id}:${mode === "tasteExplore" ? "taste" : mode}`,
        write:value=>persist({learning:{...node.learning,[mode]:{...node.learning[mode],[key]:value}}})});
    }
  }
  const entries = knowledgeEntries(data);
  for (const [target,graft] of Object.entries(node.grafts || {})) {
    const title = entries.find(n=>n.id===target)?.title || "Linked source";
    const writeGraft = patch => context.save(d=>graftKnowledge(d,node.id,node.links || [],{...node.grafts,[target]:{...graft,...patch}}));
    parts.push({id:`graft:${target}`,group:"Graft",label:title,fieldLabel:`Why connect to ${title}?`,value:graft.note || "",mode:"graft",scope:`${node.id}:graft:${target}`,slot:"explanation",write:value=>writeGraft({note:value})});
    for(const [key,label,prompt] of ACTION_COMPONENTS.graft.fields) parts.push({id:`graft:${target}:${key}`,group:`Graft · ${title}`,label,fieldLabel:label,prompt,value:graft.components?.[key] || "",mode:"graft",scope:`${node.id}:graft:${target}:${key}`,write:value=>writeGraft({components:{...graft.components,[key]:value}})});
  }
  for(const note of data.notes.filter(n=>n.concepts?.includes(node.id))) parts.push({id:`note:${note.id}`,group:"Source excerpts",label:(note.text || note.quote || "Untitled excerpt").slice(0,70),fieldLabel:"Excerpt notes",value:note.text || "",quote:note.quote,resource:data.resources.find(r=>r.id===note.resourceId),scope:`${node.id}:note:${note.id}`,
    write:value=>context.save(d=>({...d,notes:d.notes.map(n=>n.id===note.id?{...n,text:value,updatedAt:new Date().toISOString()}:n)}))});
  const current = parts.find(p=>p.id===section) || parts[0];
  const groups = [...new Set(parts.map(p=>p.group))];
  return <>
    <Field label="Content section"><select value={current.id} onChange={e=>setSection(e.target.value)}>{groups.map(group=><optgroup key={group} label={group}>{parts.filter(p=>p.group===group).map(p=><option key={p.id} value={p.id}>{p.label}{p.id !== "main" && p.value.trim() ? " · Has content" : ""}</option>)}</optgroup>)}</select></Field>
    {current.prompt && <p>{current.prompt}</p>}
    {current.quote && <blockquote>{current.quote}</blockquote>}
    {current.resource && <SourceOpen resource={current.resource}/>}
    <KnowledgeSourceContext.Provider value={{...context,action:current.mode || "content"}}>
      <VoiceField key={current.id} label={current.fieldLabel} scope={current.scope} slot={current.slot} resourceScope={current.resourceScope}>
        <textarea rows={12} value={current.value} onChange={e=>current.write(e.target.value)}/>
      </VoiceField>
    </KnowledgeSourceContext.Provider>
  </>;
}
