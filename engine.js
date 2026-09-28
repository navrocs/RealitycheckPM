(function(root){
 'use strict';
 const median=a=>{const s=[...a].sort((a,b)=>a-b);return s.length%2?s[(s.length-1)/2]:(s[s.length/2-1]+s[s.length/2])/2;};
 const valid=n=>typeof n==='number'&&Number.isFinite(n);
 function evaluate(s){
  const h=s.history, histOK=Array.isArray(h)&&h.length>0&&h.every(n=>valid(n)&&n>0);
  const drift=histOK?(h[h.length-1]-h[0])/h[0]:null;
  const revisions=histOK?h.slice(1).filter((v,i)=>v>h[i]).length:0;
  const refs=s.references,refOK=Array.isArray(refs)&&refs.length>=5&&refs.every(n=>valid(n)&&n>0)&&valid(s.newEstimate)&&s.newEstimate>0;
  const mid=refOK?median(refs):null,gap=refOK?(mid-s.newEstimate)/mid:null;
  let consecutive=0;const cycles=Array.isArray(s.cycles)?s.cycles:[];
  for(let i=cycles.length-1;i>=0;i--){if(cycles[i].missed===true&&cycles[i].continued===true&&cycles[i].changed===false)consecutive++;else break;}
  const f=s.forecasts,calOK=Array.isArray(f)&&f.length>=10&&f.every(x=>valid(x.p)&&x.p>=0&&x.p<=1&&(x.y===0||x.y===1));
  const confidence=calOK?f.reduce((a,x)=>a+x.p,0)/f.length:null,rate=calOK?f.reduce((a,x)=>a+x.y,0)/f.length:null;
  const brier=calOK?f.reduce((a,x)=>a+(x.p-x.y)**2,0)/f.length:null;
  return [
   {id:'drift',name:'Estimate drift',task:'Payment integration',value:drift,metric:drift===null?'Insufficient data':(drift*100).toFixed(1)+'%',flag:histOK&&(drift>=s.thresholds.drift||revisions>=3),eligible:histOK,detail:histOK?`${h[0]} → ${h[h.length-1]} days · ${revisions} upward revisions`:'Add a valid positive baseline and revision history.',rule:`Review at ${Math.round(s.thresholds.drift*100)}% drift or 3 upward revisions.`,evidence:histOK?h.map((d,i)=>['Revision '+i,d+' days']):[]},
   {id:'reference',name:'Reference class gap',task:'Account setup',value:gap,metric:gap===null?'Insufficient data':(gap*100).toFixed(1)+'%',flag:refOK&&gap>=s.thresholds.gap,eligible:refOK,detail:refOK?`${s.newEstimate}-day estimate vs ${mid}-day median · n = ${refs.length}`:'At least 5 comparable completed tasks required.',rule:`Review when an estimate is ${Math.round(s.thresholds.gap*100)}% or more below its reference median.`,evidence:refOK?refs.map((d,i)=>['Comparable task '+(i+1),d+' days']):[]},
   {id:'retention',name:'Repeated continuation',task:'Analytics beta',value:consecutive,metric:cycles.length?consecutive+' cycles':'Insufficient data',flag:consecutive>=3,eligible:cycles.length>0,detail:'Consecutive missed goals with continued funding and unchanged scope',rule:'Review after 3 consecutive qualifying cycles; a scope change resets the count.',evidence:cycles.map((c,i)=>['Cycle '+(i+1),c.changed?'Scope changed':c.missed&&c.continued?'Missed · continued · unchanged':'No qualifying pattern'])},
   {id:'calibration',name:'Confidence calibration',task:'Team delivery forecasts',value:calOK?confidence-rate:null,metric:calOK?((confidence-rate)*100).toFixed(1)+' pp':'Insufficient data',flag:calOK&&(confidence-rate>=s.thresholds.calibration-1e-10),eligible:calOK,detail:calOK?`${Math.round(confidence*100)}% confidence · ${Math.round(rate*100)}% on time · n = ${f.length}`:'At least 10 completed probability forecasts required.',rule:`Review at ${Math.round(s.thresholds.calibration*100)} percentage points of overconfidence.`,brier,evidence:calOK?f.map((x,i)=>['Forecast '+(i+1),Math.round(x.p*100)+'% · '+(x.y?'On time':'Late')]):[]}
  ];
 }
 function seed(){return {history:[14,17,20,23],references:[8,10,12,14,16],newEstimate:7,cycles:[{missed:true,continued:true,changed:false},{missed:true,continued:true,changed:false},{missed:true,continued:true,changed:false}],forecasts:Array.from({length:10},(_,i)=>({p:.8,y:i<5?1:0})),thresholds:{drift:.25,gap:.25,calibration:.2},decisions:[],premortem:[]};}
 root.RCPM={evaluate,seed,median};
})(typeof window==='undefined'?globalThis:window);
