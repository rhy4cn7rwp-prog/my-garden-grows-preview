const {test}=require('node:test');const assert=require('node:assert/strict');
const C=require('../src/market-customers.js'),G=require('../src/game.js');
function stand(){const s=G.initial();s.bagCount=10000;s.owned.table=s.owned.scale=1;for(const c of G.crops)s.inventory[c.id]=s.display[c.id]=10000;G.openMarket(s,1000);return s;}
function sell(s,i=0){G.newCustomer(s,undefined,1001+i);const name=s.customer.name;G.greet(s);s.basket={...s.customer.want};G.ring(s,G.totalOrder(s));s.change=s.tendered-G.totalOrder(s);G.finish(s);G.advanceCustomer(s,'good',1002+i);return name;}
test('28 named, visually distinct profiles retain the four original portraits and twenty existing names',()=>{
 assert.equal(C.profiles.length,28);assert.equal(new Set(C.profiles.map(p=>p.name)).size,28);
 assert.equal(new Set(C.profiles.map(p=>p.trait)).size,28);
 assert.deepEqual(C.profiles.slice(0,4).map(p=>p.legacyPortrait),[2,1,0,3]);
 assert.equal(new Set(C.profiles.map(p=>p.portrait===undefined?'old'+p.legacyPortrait:'new'+p.portrait)).size,28);
 for(const p of C.profiles){const phrases=new Set(),orders=new Set(),goodbyes=new Set();
  for(let v=0;v<3;v++){const c={name:p.name,dialogueVariant:v,response:'good'};
   const lines=C.dialogue(c,'choose','2 carrots','$5.00',null);phrases.add(lines[0]);orders.add(lines[1]);
   c.response='sale-complete';goodbyes.add(C.dialogue(c,'thanks','','',null).join(' '));}
  assert.equal(phrases.size,3,p.name);assert.equal(orders.size,3,p.name);assert.equal(goodbyes.size,3,p.name);
 }
});
test('rotation covers every neighbor, avoids the last eight arrivals, has occasional regulars and no visitor cap',()=>{
 const s=stand(),seen=[],names=new Set();
 for(let i=0;i<180;i++){const name=sell(s,i);assert.ok(!seen.slice(-8).includes(name),[i,name,seen.slice(-8)]);seen.push(name);names.add(name);
  if(i===39)assert.equal(names.size,28);}
 assert.equal(names.size,28);assert.equal(s.visitors,180);assert.equal(s.customersServed,180);
 assert.ok(seen.slice(0,28).some((name,i,a)=>a.indexOf(name)!==i),'familiar customer can return before every stranger');
 assert.equal(Object.keys(s.customerHistory.people).length,28);assert.equal(s.customerHistory.recent.length,8);
});
test('history persists across days, seasons, refresh and backup without duplicate visits or purchases',()=>{
 const s=stand();for(let i=0;i<15;i++)sell(s,i);const history=structuredClone(s.customerHistory);
 const r=G.recover(JSON.stringify(s));assert.deepEqual(r.customerHistory,history);
 assert.deepEqual(G.recover('{bad',JSON.stringify(s)).customerHistory,history);
 G.closeMarket(r,2000);r.day=20;G.endDay(r);assert.equal(r.season,2);assert.deepEqual(r.customerHistory,history);
 G.openMarket(r,3000);G.newCustomer(r,undefined,3001);const active=structuredClone(r.customerHistory);
 const refreshed=G.recover(JSON.stringify(r));assert.deepEqual(refreshed.customerHistory,active);
 assert.equal(refreshed.customer.name,r.customer.name);assert.deepEqual(refreshed.customer.want,r.customer.want);
});
test('remembered produce only comes from a completed sale; leaving or failing checkout adds no purchases',()=>{
 const s=stand();G.newCustomer(s,'Maya',1001);G.greet(s);s.customer.want={carrot:1};s.basket={carrot:1};
 assert.throws(()=>G.ring(s,99));assert.equal(s.customerHistory.people.Maya.purchases,0);
 G.ring(s,2);s.change=s.tendered-2;G.finish(s);assert.equal(s.customerHistory.people.Maya.purchases,1);
 assert.throws(()=>G.finish(s));assert.equal(s.customerHistory.people.Maya.purchases,1);
 G.advanceCustomer(s,'good',1002);s.day=2;G.newCustomer(s,'Maya',1003);
 assert.ok(s.customer.returning);assert.ok(s.customer.rememberVisit);assert.equal(s.customer.rememberedCrop,'carrot');
 G.greet(s);assert.match(C.dialogue(s.customer,'choose','1 carrot','$5.00','carrots')[0],/carrots/);
 G.declineOrder(s);G.advanceCustomer(s,'good',1004);assert.equal(s.customerHistory.people.Maya.purchases,1);
 const n=stand();G.newCustomer(n,'Noah',1001);G.greet(n);G.declineOrder(n);G.advanceCustomer(n,'good',1002);
 n.day=2;G.newCustomer(n,'Noah',1003);assert.equal(n.customer.rememberedCrop,null);
 assert.doesNotMatch(C.dialogue(n.customer,'choose','1 carrot','$5.00',null).join(' '),/Loved|delicious/);
});
test('missing/malformed optional history preserves existing farm, math work, ownership and active checkout',()=>{
 const s=stand();s.dreamPurchaseCount=2;s.mathPractice.support=1;s.customerHistory={people:{Maya:{visits:-4,purchases:'bad',lastCrop:'unknown'}},recent:['Maya','<bad>'],sequence:4};
 G.newCustomer(s,'Oliver',1001);G.greet(s);s.basket={...s.customer.want};for(let id;(id=G.nextMathLine(s));)G.answerMathLine(s,id,s.basket[id]*G.marketPrice(s,id));G.ring(s,G.totalOrder(s));
 delete s.customerHistory;const r=G.recover(JSON.stringify(s));assert.equal(r.step,'pay');assert.deepEqual(r.customerHistory,C.emptyHistory());
 for(const k of ['cash','inventory','plots','bagCount','dreamPurchaseCount','dreamPurchases','mathPractice','marketElapsedMs'])assert.deepEqual(r[k],s[k],k);
 assert.deepEqual(r.customer.prices,s.customer.prices);assert.deepEqual(r.customer.lineAnswers,s.customer.lineAnswers);
 r.change=r.tendered-G.totalOrder(r);const before=r.cash;const amount=G.totalOrder(r);G.finish(r);assert.equal(r.cash,before+amount);assert.equal(r.customerHistory.people.Oliver.purchases,1);
 s.customerHistory='bad';assert.equal(G.recover(JSON.stringify(s)).cash,s.cash);
});
