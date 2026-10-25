const {test}=require('node:test');
const assert=require('node:assert/strict');
const G=require('../src/game.js');
function stand(count=0){const s=G.initial();s.dreamPurchaseCount=count;s.bagCount=100;s.owned.scale=s.owned.table=1;
 for(const c of G.crops)s.inventory[c.id]=s.display[c.id]=50;G.openMarket(s,1000);return s;}
test('purchase count migrates from proven ownership and increments only on explicit successful purchase',()=>{
 const s=G.initial();s.cash=1000;G.purchaseDream(s,'ball');assert.equal(G.dreamPurchaseCount(s),1);
 assert.throws(()=>G.purchaseDream(s,'ball'));assert.equal(G.dreamPurchaseCount(s),1);
 delete s.dreamPurchaseCount;const r=G.recover(JSON.stringify(s));assert.equal(G.dreamPurchaseCount(r),1);
 G.purchaseDream(r,'bike');assert.equal(G.dreamPurchaseCount(r),2);
 const before=JSON.stringify(r);assert.throws(()=>G.purchaseDream(r,'unknown'));assert.equal(JSON.stringify(r),before);
 r.dreamPurchaseCount=10;assert.equal(G.recover(JSON.stringify(r)).dreamPurchaseCount,10);
});
test('all tiers mix review orders, respect stock, unlock fractions and cap payments at milestones',()=>{
 const seen=new Map();
 for(const count of [0,1,2,3,4,5,6,7,8,9,10,12]){
  const fractions=new Set(),payments=new Set(),sizes=new Set();let big=false;
  for(let visit=0;visit<40;visit++){
   const s=stand(count);s.visitors=visit;G.newCustomer(s,'Oliver',1001);
   const level=s.customer.mathLevel;assert.ok(level<=Math.floor(count/2));
   if(visit%3===2&&count>=2)assert.equal(level,Math.min(5,Math.floor(count/2))-1);
   for(const [id,n] of Object.entries(s.customer.want)){assert.ok(n>0&&n<=G.marketStock(s,id));fractions.add(Math.round(G.marketPrice(s,id)*100)%100);}
   sizes.add(Object.keys(s.customer.want).length);G.greet(s);s.basket={...s.customer.want};
   const total=G.totalOrder(s);if(total>=30)big=true;
   assert.throws(()=>G.ring(s,total+.01));assert.equal(s.step,'choose');G.ring(s,total);
   payments.add(s.tendered);assert.ok(s.tendered>=total);
   assert.ok(s.tendered<=(count<8?20:count<10?50:100));
   s.change=(Math.round(s.tendered*100)-Math.round(total*100))/100;
   const r=G.recover(JSON.stringify(s));assert.equal(r.step,'pay');assert.equal(G.totalOrder(r),total);
   const cash=r.cash;G.finish(r);assert.equal(r.cash, cash+total);assert.equal(r.bagCount,99);
  }
  if(count<2)assert.deepEqual([...fractions],[0]);
  if(count===2){assert.ok(fractions.has(25));assert.ok(fractions.has(50));assert.ok(!fractions.has(75));}
  if(count===4)assert.ok(fractions.has(75));
  if(count>=6)assert.ok(sizes.has(3));
  if(count>=10){assert.ok(big);assert.ok(payments.has(100));}
  seen.set(count,payments);
 }
 assert.ok(seen.get(8).has(50));
});
test('a purchase during checkout and refresh never reprices an existing transaction',()=>{
 const s=stand(1);s.cash=1000;s.visitors=1;G.newCustomer(s,'Maya',1001);G.greet(s);s.basket={...s.customer.want};
 const total=G.totalOrder(s),prices={...s.customer.prices};G.ring(s,total);G.purchaseDream(s,'ball');
 const r=G.recover(JSON.stringify(s));assert.equal(r.step,'pay');assert.deepEqual(r.customer.prices,prices);assert.equal(G.totalOrder(r),total);
});
test('one sold-out response chooses stocked produce or declines without spending inventory or bags',()=>{
 for(const decision of [0,99]){const s=stand();G.newCustomer(s,'Maya',1001);G.greet(s);s.customer.want={onion:2};s.display.onion=0;s.customer.decision=decision;s.customer.personality='thoughtful';
 const before=JSON.stringify([s.cash,s.bagCount,s.inventory]);const accepted=G.offerSomethingElse(s);
 assert.equal(accepted,decision===0);assert.equal(JSON.stringify([s.cash,s.bagCount,s.inventory]),before);
 if(accepted){assert.equal(G.missingProduce(s).length,0);for(const [id,n] of Object.entries(s.customer.want))assert.ok(n<=G.marketStock(s,id));}
 else assert.equal(s.step,'thanks');
 }
});

test('a sold-out berry request can offer stocked vegetables when no fruit alternative exists',()=>{
 const s=stand();G.newCustomer(s,'Maya',1001);G.greet(s);s.customer.want={strawberry:1};s.display.strawberry=0;
 s.customer.decision=0;s.customer.personality='curious';assert.equal(G.offerSomethingElse(s),true);
 assert.equal(G.missingProduce(s).length,0);assert.ok(!s.customer.want.strawberry);
});
