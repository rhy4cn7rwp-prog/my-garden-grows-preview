const {test}=require('node:test'),assert=require('node:assert/strict');
const G=require('../src/game.js');
const cents=n=>Math.round(n*100);
function stand(count=0){const s=G.initial();s.dreamPurchaseCount=count;s.owned.table=s.owned.scale=1;s.bagCount=1000;
 for(const c of G.crops)s.inventory[c.id]=s.display[c.id]=1000;G.openMarket(s,1000);return s;}
function prepare(s,visit=0){s.visitors=visit;G.newCustomer(s,'Maya',1001+visit);G.greet(s);s.basket={...s.customer.want};
 for(let id;(id=G.nextMathLine(s));)G.answerMathLine(s,id,G.lineTotal(s,id));G.ring(s,G.totalOrder(s));}
function count(s,denoms=[20,10,5,1,.25,.1,.05,.01]){let due=cents(G.changeDue(s));
 for(const n of denoms)while(due>=cents(n)){G.addChange(s,n);due-=cents(n);}assert.equal(due,0);}
function fixtureChange(due){const s=stand();prepare(s);s.customer.want={carrot:1};s.basket={carrot:1};s.tendered=2+due;return s;}
test('prices unlock quarter fractions first, then selected five-cent amounts; all displayed snapshots survive recovery',()=>{
 const found={};
 for(const n of [0,1,2,3,4,5,6,7,8,10]){const fractions=new Set();
  for(let visit=0;visit<80;visit++){const s=stand(n);prepare(s,visit);const total=G.totalOrder(s);let sum=0;
   for(const [id,q]of Object.entries(s.basket)){const p=cents(G.marketPrice(s,id));fractions.add(p%100);assert.equal(p%5,0);assert.equal(cents(G.lineTotal(s,id)),p*q);sum+=p*q;}
   assert.equal(cents(total),sum);assert.ok(cents(s.tendered)>=sum);assert.equal(cents(G.changeDue(s)),cents(s.tendered)-sum);
   const r=G.recover(JSON.stringify(s));assert.equal(r.step,'pay');assert.deepEqual(r.customer.prices,s.customer.prices);assert.equal(G.totalOrder(r),total);
   if(n<2)assert.deepEqual([...fractions],[0]);if(n<4)assert.ok(!fractions.has(75));if(n<6)assert.ok([...fractions].every(x=>[0,25,50,75].includes(x)));
  }found[n]=fractions;
 }
 assert.ok(found[2].has(50)&&found[2].has(25));assert.ok(found[4].has(75));
 assert.ok(found[6].has(5)&&found[6].has(10));assert.ok(!found[6].has(15));
 assert.ok(found[8].has(5)&&found[8].has(15));assert.equal(found[10].size,20);
});
test('all quarter, mixed-coin and non-optimal penny/nickel combinations are accepted with identical cash movement',()=>{
 for(const [due,combos]of [[.25,[[.25],[.1,.1,.05],Array(25).fill(.01)]],[.5,[[.25,.25],Array(5).fill(.1),Array(10).fill(.05)]],[.75,[[.25,.25,.25],[.25,.1,.1,.1,.1,.05,.05],[...Array(15).fill(.05)]]],[1.35,[[1,.25,.1],[1,.1,.1,.1,.05],[...Array(135).fill(.01)]]],[6.35,[[5,1,.25,.1],[1,1,1,1,1,1,.1,.1,.1,.05],[5,...Array(27).fill(.05)]]]]){
  for(const combination of combos){const s=fixtureChange(due);const before=s.cash;for(const n of combination)G.addChange(s,n);
   assert.equal(cents(s.change),cents(due));assert.equal(G.finish(s),2);assert.equal(cents(s.cash),cents(before)+200);assert.equal(s.bagCount,999);
   assert.throws(()=>G.finish(s));assert.equal(cents(s.cash),cents(before)+200);
  }
 }
});
test('wrong change, overcount, restart and repeated coin taps cannot change money, inventory or history before payment',()=>{
 const s=fixtureChange(.35),before=JSON.stringify([s.cash,s.inventory,s.display,s.bagCount,s.sales,s.customerHistory]);
 G.addChange(s,.25);assert.throws(()=>G.finish(s),/Count up/);G.addChange(s,.25);assert.throws(()=>G.finish(s),/Count up/);
 assert.equal(JSON.stringify([s.cash,s.inventory,s.display,s.bagCount,s.sales,s.customerHistory]),before);
 s.change=0;for(let i=0;i<35;i++)G.addChange(s,.01);assert.equal(s.change,.35);G.finish(s);assert.equal(s.cash,52);
 assert.throws(()=>G.addChange(s,.25));const r=fixtureChange(.35);assert.throws(()=>G.addChange(r,1.001));assert.throws(()=>G.addChange(r,.02));assert.throws(()=>G.addChange(r,NaN));
});
test('change mistakes ease future prices and payments independently of correct item math, then clean transactions restore support',()=>{
 const s=stand(6);prepare(s,22);assert.ok(s.tendered>=50);const agreed=structuredClone(s.customer.prices);
 for(let i=0;i<6;i++)assert.throws(()=>G.finish(s),/Count up/);
 assert.equal(s.changePractice.support,3);assert.equal(G.dreamPurchaseCount(s),6);assert.deepEqual(s.customer.prices,agreed);
 const r=G.recover(JSON.stringify(s));assert.deepEqual(r.changePractice,s.changePractice);count(r);G.finish(r);G.advanceCustomer(r,'good',1100);
 prepare(r,0);assert.equal(r.customer.mathLevel,0);assert.ok(r.tendered<=20);assert.equal(r.changePractice.support,3);
 let support=r.changePractice.support;
 for(let i=0;i<10;i++){count(r);G.finish(r);assert.ok(r.changePractice.support<=support);assert.ok(support-r.changePractice.support<=1);support=r.changePractice.support;
  G.advanceCustomer(r,'good',1101+i);prepare(r,i+1);}
 assert.equal(r.changePractice.support,0);assert.equal(G.dreamPurchaseCount(r),6);
});
test('six purchased dreams unlock occasional $50/$100 payments; no big notes appear before that milestone',()=>{
 const payments=new Set();for(let visit=0;visit<90;visit++){const s=stand(6);prepare(s,visit);payments.add(s.tendered);assert.ok(s.tendered>=G.totalOrder(s));}
 assert.ok(payments.has(50));assert.ok(payments.has(100));
 for(const n of [0,1,2,3,4,5])for(let visit=0;visit<30;visit++){const s=stand(n);prepare(s,visit);assert.ok(s.tendered<=20);}
});
test('all 5-cent prices including binary-float edge cases retain exact in-progress payment and counted coins',()=>{
 for(let f=0;f<100;f+=5){const s=stand(10);prepare(s);s.customer.prices.carrot=(200+f)/100;s.customer.want={carrot:3};s.basket={carrot:3};s.tendered=20;s.change=0;
  const expected=3*(200+f);assert.equal(cents(G.totalOrder(s)),expected);G.addChange(s,.1);G.addChange(s,.05);
  const r=G.recover(JSON.stringify(s));assert.equal(r.step,'pay');assert.equal(cents(G.totalOrder(r)),expected);assert.equal(r.change,.15);assert.equal(r.customer.prices.carrot,s.customer.prices.carrot);
 }
 const old=stand();prepare(old);delete old.changePractice;const r=G.recover(JSON.stringify(old));assert.equal(r.step,'pay');assert.deepEqual(r.changePractice,G.initial().changePractice);assert.equal(r.cash,old.cash);
});
test('repeated fractional sales and reports match integer-cent cash movement without duplicated rentals or bag deductions',()=>{
 const s=stand(8);s.cash=100;G.closeMarket(s,1001);G.endDay(s);s.display={...s.inventory};s.owned.scale=0;s.cash=0;G.rentEquipment(s,'scale','deferred');G.openMarket(s,2000);
 const initial=cents(s.cash);let sales=0;
 for(let i=0;i<120;i++){prepare(s,i);sales+=cents(G.totalOrder(s));count(s);G.finish(s);G.advanceCustomer(s,'good',2100+i);assert.equal(cents(s.cash),initial+sales);}
 G.closeMarket(s,3000);const after=s.cash,report=G.accountingReport(s);assert.equal(cents(report.sales),sales);assert.equal(cents(s.cash),initial+sales-200);assert.equal(cents(report.net),sales-200);
 G.closeMarket(s,3001);assert.equal(s.cash,after);assert.equal(s.bagCount,880);
});

test('beginners also get smaller future orders after repeated change errors, then regain normal practice',()=>{
 const s=stand(0);prepare(s,3);assert.throws(()=>G.finish(s));assert.throws(()=>G.finish(s));assert.equal(s.changePractice.support,1);
 count(s);G.finish(s);G.advanceCustomer(s,'good',1100);prepare(s,3);
 assert.equal(s.customer.mathLevel,0);assert.equal(Object.keys(s.customer.want).length,1);assert.deepEqual(Object.values(s.customer.want),[1]);assert.ok(s.tendered<=10);
 for(let i=0;i<3;i++){count(s);G.finish(s);G.advanceCustomer(s,'good',1101+i);if(i<2)prepare(s,3);}
 assert.equal(s.changePractice.support,0);prepare(s,3);assert.equal(Object.keys(s.customer.want).length,2);assert.equal(G.dreamPurchaseCount(s),0);
});
