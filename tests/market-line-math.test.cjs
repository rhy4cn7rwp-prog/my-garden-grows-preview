const {test}=require('node:test');
const assert=require('node:assert/strict');
const G=require('../src/game.js');
function stand(count=0){const s=G.initial();s.dreamPurchaseCount=count;s.owned.scale=s.owned.table=1;s.bagCount=20;
 for(const c of G.crops)s.inventory[c.id]=s.display[c.id]=50;G.openMarket(s,1000);G.newCustomer(s,'Maya',1001);G.greet(s);s.basket={...s.customer.want};return s;}
function solve(s){for(let id;(id=G.nextMathLine(s));)G.answerMathLine(s,id,s.basket[id]*G.marketPrice(s,id));}
test('first purchase adds multiplication steps without changing beginner prices, quantity or numerical tier',()=>{
 const beginner=stand(0), first=stand(1);
 assert.equal(G.requiresLineMath(beginner),false);assert.equal(G.nextMathLine(beginner),undefined);
 assert.equal(G.requiresLineMath(first),true);assert.ok(G.nextMathLine(first));
 assert.deepEqual(first.customer.want,beginner.customer.want);assert.deepEqual(first.customer.prices,beginner.customer.prices);
 assert.equal(first.customer.mathLevel,0);assert.throws(()=>G.ring(first,G.totalOrder(first)),/each item/);
 solve(first);G.ring(first,G.totalOrder(first));assert.equal(first.step,'pay');
 G.ring(beginner,G.totalOrder(beginner));assert.equal(beginner.step,'pay');
});
test('wrong subtotals and final totals retry without revealing answers or moving money, produce or bags',()=>{
 const s=stand(1), id=G.nextMathLine(s);const before=JSON.stringify([s.cash,s.inventory,s.bagCount,s.marketElapsedMs]);
 assert.throws(()=>G.answerMathLine(s,id,999),/try again/i);assert.ok(!G.lineSolved(s,id));
 assert.equal(JSON.stringify([s.cash,s.inventory,s.bagCount,s.marketElapsedMs]),before);
 G.answerMathLine(s,id,s.basket[id]*G.marketPrice(s,id));
 assert.throws(()=>G.answerMathLine(s,id,2),/highlighted/);
 solve(s);assert.throws(()=>G.ring(s,G.totalOrder(s)+1),/Try multiplying/);
 assert.equal(s.step,'choose');assert.equal(JSON.stringify([s.cash,s.inventory,s.bagCount,s.marketElapsedMs]),before);
});
test('solved item work survives refresh and stale or forged subtotal records cannot skip practice',()=>{
 const s=stand(2);const id=G.nextMathLine(s);G.answerMathLine(s,id,s.basket[id]*G.marketPrice(s,id));
 const r=G.recover(JSON.stringify(s));assert.equal(r.step,'choose');assert.ok(G.lineSolved(r,id));
 assert.deepEqual(r.customer.prices,s.customer.prices);
 r.customer.want[id]++;r.basket[id]++;assert.ok(!G.lineSolved(r,id));
 const recovered=G.recover(JSON.stringify(r));assert.ok(!G.lineSolved(recovered,id));
 recovered.customer.lineAnswers[id]={quantity:r.basket[id],priceCents:999,answerCents:999};
 assert.ok(!G.lineSolved(G.recover(JSON.stringify(recovered)),id));
});
test('older saved choose/pay checkouts gain the right stage without losing an already accepted payment',()=>{
 const s=stand(1);delete s.customer.lineMath;delete s.customer.lineAnswers;delete s.mathPractice;
 const r=G.recover(JSON.stringify(s));assert.ok(G.requiresLineMath(r));assert.ok(G.nextMathLine(r));
 solve(r);G.ring(r,G.totalOrder(r));delete r.customer.lineMath;delete r.customer.lineAnswers;
 const payment=G.recover(JSON.stringify(r));assert.equal(payment.step,'pay');payment.change=payment.tendered-G.totalOrder(payment);
 G.finish(payment);assert.equal(payment.bagCount,19);
});
test('repeat mistakes ease future orders; clean practice gradually restores the unlocked tier and survives saves',()=>{
 const s=stand(6), prices={...s.customer.prices};const id=G.nextMathLine(s);
 for(let i=0;i<4;i++)assert.throws(()=>G.answerMathLine(s,id,999));
 assert.equal(s.mathPractice.support,2);assert.deepEqual(s.customer.prices,prices);
 const r=G.recover(JSON.stringify(s));assert.equal(r.mathPractice.support,2);
 solve(r);G.ring(r,G.totalOrder(r));r.change=r.tendered-G.totalOrder(r);G.finish(r);G.advanceCustomer(r,'good',1002);
 r.visitors=0;G.newCustomer(r,'Noah',1003);assert.ok(r.customer.mathLevel<3);G.greet(r);r.basket={...r.customer.want};
 for(let visit=0;visit<5;visit++){
  solve(r);G.ring(r,G.totalOrder(r));r.change=r.tendered-G.totalOrder(r);G.finish(r);G.advanceCustomer(r,'good',1004+visit);
  G.newCustomer(r,'Oliver',1005+visit);G.greet(r);r.basket={...r.customer.want};
 }
 assert.equal(r.mathPractice.support,0);assert.equal(G.mathLevel(r),3);assert.equal(G.dreamPurchaseCount(r),6);
});
