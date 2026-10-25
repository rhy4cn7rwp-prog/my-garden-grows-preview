const {test}=require('node:test');const assert=require('node:assert/strict');
const G=require('../src/game.js'),C=require('../src/market-customers.js');
function stand(){const s=G.initial();s.bagCount=100;s.owned.scale=s.owned.table=1;for(const c of G.crops)s.inventory[c.id]=s.display[c.id]=100;G.openMarket(s,1000);return s;}
test('all 28 preserved customers have consistent personalities and unique character details',()=>{
 assert.equal(C.profiles.length,28);const tones=new Set(C.profiles.map(p=>p.tone));
 for(const tone of ['shy','talkative','practical','playful','curious','cook','storyteller'])assert.ok(tones.has(tone));
 assert.equal(new Set(C.profiles.map(p=>p.details[0])).size,28);
 for(const p of C.profiles){const behaviors=new Set();
  for(let visit=0;visit<4;visit++){const s=stand();s.visitors=visit;s.day=visit+1;G.newCustomer(s,p.name,1001);behaviors.add(s.customer.personality);
   const r=G.recover(JSON.stringify(s));assert.equal(r.customer.personality,s.customer.personality);assert.equal(C.profile(r.customer.name).trait,p.trait);}
  assert.equal(behaviors.size,1,p.name);assert.equal([...behaviors][0],C.behavior(p.name));
 }
});
test('every greeting style permits an order and a completed purchase for every customer without financial penalties',()=>{
 for(const p of C.profiles){const outcomes=[];
  for(const greeting of ['excellent','good','wait']){
   const s=stand();G.newCustomer(s,p.name,1001);const wanted={...s.customer.want};const cash=s.cash,stock=structuredClone(s.inventory),practice=structuredClone(s.mathPractice);
   G.greet(s,greeting);assert.equal(s.step,'choose',p.name+greeting);assert.deepEqual(s.customer.want,wanted);
   assert.equal(s.customer.satisfaction,60);assert.equal(s.cash,cash);assert.deepEqual(s.inventory,stock);assert.deepEqual(s.mathPractice,practice);
   s.basket={...s.customer.want};const total=G.totalOrder(s);G.ring(s,total);s.change=s.tendered-total;G.finish(s);G.advanceCustomer(s,'good',1002);
   assert.equal(s.notice,'');assert.equal(s.customer,null);outcomes.push([s.cash,s.inventory,s.bagCount,s.sales,s.customerHistory]);
  }
  assert.deepEqual(outcomes[0],outcomes[1],p.name);assert.deepEqual(outcomes[1],outcomes[2],p.name);
 }
});
test('greeting variants respond differently by personality and choice while remaining short',()=>{
 for(const p of C.profiles){
  for(let v=0;v<3;v++){
   const replies=new Set();
   for(const response of ['excellent','good','wait-stayed']){
    const lines=C.dialogue({name:p.name,dialogueVariant:v,response},'choose','2 carrots','$5.00',null);
    replies.add(lines[0]);assert.equal(lines.length,2);assert.ok(lines[0].length<=40,[p.name,response,lines]);assert.ok(lines[1].includes('2 carrots'));
   }
   assert.equal(replies.size,3,[p.name,v,...replies].join(' / '));
  }
 }
 const quiet=C.dialogue({name:'Ella',dialogueVariant:0,response:'good'},'choose','1 carrot','$5.00',null);
 const chat=C.dialogue({name:'Zoe',dialogueVariant:0,response:'good'},'choose','1 carrot','$5.00',null);
 assert.notEqual(quiet[0],chat[0]);
});
test('alternative acceptance depends on preferences rather than greeting enthusiasm',()=>{
 for(const p of C.profiles)for(const decision of [0,35,50,80,99]){
  const results=[];
  for(const greeting of ['excellent','good','wait']){const s=stand();G.newCustomer(s,p.name,1001);G.greet(s,greeting);
   s.customer.want={onion:1};s.display.onion=0;s.customer.decision=decision;results.push(G.offerSomethingElse(s));}
  assert.deepEqual(results,[results[0],results[0],results[0]],p.name);
 }
});
test('old pending orders keep their math, history, tender and conversation state through recovery',()=>{
 const s=stand();s.dreamPurchaseCount=4;G.newCustomer(s,'Ella',1001);G.greet(s,'wait');s.basket={...s.customer.want};
 for(let id;(id=G.nextMathLine(s));)G.answerMathLine(s,id,s.basket[id]*G.marketPrice(s,id));G.ring(s,G.totalOrder(s));
 const r=G.recover(JSON.stringify(s));
 for(const key of ['cash','inventory','display','bagCount','tendered','basket','customerHistory','dreamPurchaseCount','mathPractice','marketElapsedMs'])assert.deepEqual(r[key],s[key],key);
 assert.equal(r.step,'pay');assert.deepEqual(r.customer.lineAnswers,s.customer.lineAnswers);assert.deepEqual(r.customer.prices,s.customer.prices);
 r.change=r.tendered-G.totalOrder(r);G.finish(r);assert.equal(r.bagCount,99);
});
