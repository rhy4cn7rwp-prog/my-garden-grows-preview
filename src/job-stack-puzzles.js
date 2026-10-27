/* Deeper reversible scrambles. Every board carries a legal solution proof. */
(function(root){'use strict';
 const kinds=['carrot','corn','tomato','cucumber'];
 function rng(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
 function attempt(seed,cap,types){const r=rng(seed),crates=Array.from({length:types+2},(_,i)=>i<types?Array(cap).fill(kinds[i]):[]),states=[JSON.stringify(crates)],index=new Map([[states[0],0]]),path=[];let last=[];
 for(let step=0;step<700;step++){const options=[];for(let from=0;from<crates.length;from++)for(let to=0;to<crates.length;to++)if(from!==to&&!(last[0]===to&&last[1]===from)&&crates[from].length&&crates[to].length<cap&&(crates[from].length===1||crates[from].at(-1)===crates[from].at(-2)))options.push([from,to]);if(!options.length)break;
 const [from,to]=options[Math.floor(r()*options.length)];crates[to].push(crates[from].pop());last=[from,to];const key=JSON.stringify(crates),seen=index.get(key);
 if(seen!==undefined){while(states.length>seen+1)index.delete(states.pop());path.length=seen;}
 else{path.push([from,to]);states.push(key);index.set(key,path.length);}}
 const transitions=crates.reduce((n,c)=>n+c.slice(1).filter((v,i)=>v!==c[i]).length,0),mixed=crates.filter(c=>new Set(c).size>1).length;
 return {cap,crates,initial:JSON.parse(JSON.stringify(crates)),undo:[],solution:path.slice().reverse().map(([from,to])=>[to,from]),transitions,mixed};}
 function make(seed,mode,level=0){const cap=mode==='growing'?8:[3,4,5][level],types=mode==='growing'?4:level===0?2:3,minimum=cap===8?10:cap===3?3:5;
 for(let i=0;i<80;i++){const d=attempt((seed+i*179)>>>0,cap,types);if(d.transitions>=minimum&&d.mixed>=(cap===8?3:2)&&d.solution.length>=minimum*2)return d;}
 // Fixed, independently verifiable hard seeds guarantee a fallback for every input.
 const fallback={3:11,4:49,5:98,8:42}[cap];return attempt(fallback,cap,types);}
 const api={make};if(typeof module!=='undefined')module.exports=api;root.JobStackPuzzles=api;
})(typeof globalThis!=='undefined'?globalThis:this);
