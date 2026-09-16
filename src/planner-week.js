export const localDay=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export function weekDays(day){const monday=new Date(day+'T12:00:00');monday.setDate(monday.getDate()-(monday.getDay()+6)%7);return Array.from({length:7},(_,i)=>{const d=new Date(monday);d.setDate(d.getDate()+i);return localDay(d);});}
export function shiftWeek(day,offset){const d=new Date(day+'T12:00:00');d.setDate(d.getDate()+offset*7);return localDay(d);}
