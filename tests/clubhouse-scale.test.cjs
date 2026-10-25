const {test}=require('node:test'),assert=require('node:assert/strict');
const L=require('../src/clubhouse-layout.js'),G=require('../src/game.js');
function farm(){const s=G.initial();s.cash=2500;for(const d of G.dreams)G.purchaseDream(s,d.id);s.seeds.carrot=7;s.inventory.tomato=6;s.bagCount=9;return G.recover(JSON.stringify(s));}
function otherState(s){return Object.fromEntries(Object.entries(s).filter(([k])=>k!=='clubhousePositions'));}
test('room-calibrated item sizes distinguish a child bicycle, ball, guitar, tablet and small keepsakes',()=>{
 const p=L.point('floor',950,630),m=Object.fromEntries(Object.keys(L.defaults).map(id=>[id,L.metrics(id,p)]));
 assert.equal(L.baseSize('ball').width,64);
 assert.ok(m.bike.width/m.ball.width>=4.8 && m.bike.width/m.ball.width<=5.5);
 assert.ok(m.guitar.height/m.ball.height>=3 && m.guitar.height/m.ball.height<=3.5);
 assert.ok(m.tablet.width/m.ball.width>.8 && m.tablet.width/m.ball.width<1.05);
 assert.ok(m.camera.width/m.ball.width>.45 && m.camera.width/m.ball.width<.65);
 assert.ok(m.puppy.width<m.ball.width);
 assert.ok(L.baseSize('bike').width>=L.sizeReference.windowSeatWidthPx);
 assert.ok(L.baseSize('bike').height>L.sizeReference.benchSeatHeightPx*2);
 for(const id of ['bike','guitar','tablet']){
  const b=L.baseSize(id);assert.ok(Math.abs(b.width/b.height-L.itemSizes[id].aspect)<1e-9);
 }
});
test('every item shares floor depth and room projection without per-item zoom or rotation-dependent size metadata',()=>{
 for(const id of Object.keys(L.defaults)){
  const far=L.point('floor',950,530),near=L.point('floor',950,680),m=L.metrics(id,near);
  assert.ok(m.width>L.metrics(id,far).width,id);
  for(const yaw of [-80,-40,0,40,80]){const g=L.geometry(428,746);L.project(near,yaw,g);assert.deepEqual(L.metrics(id,near),m);assert.equal(g.focal,L.geometry(428,746).focal);}
 }
});
test('safe existing placements remain exact; an enlarged edge bicycle migrates locally and then remains stable',()=>{
 const s=farm();s.clubhousePositions=structuredClone(L.defaults);const original=structuredClone(s.clubhousePositions);
 assert.deepEqual(G.recover(JSON.stringify(s)).clubhousePositions,original);
 s.clubhousePositions.bike=L.point('floor',260,620);const before=structuredClone(otherState(s));
 const r=G.recover(JSON.stringify(s));assert.ok(L.valid('bike',r.clubhousePositions.bike));
 assert.ok(Math.abs(L.pixelAt(r.clubhousePositions.bike.angle)-260)<150);
 assert.deepEqual(otherState(r),before);
 assert.deepEqual(G.recover(JSON.stringify(r)).clubhousePositions,r.clubhousePositions);
 assert.deepEqual(G.recover('{bad',JSON.stringify(r)).clubhousePositions,r.clubhousePositions);
});
test('newly enlarged overlaps move only as needed and preserve the chosen small treasure surface',()=>{
 const s=farm();s.clubhousePositions={ball:L.canonical('ball','reading-bench',465),bike:structuredClone(L.defaults.bike)};
 const ball=structuredClone(s.clubhousePositions.ball),before=structuredClone(otherState(s));
 const r=G.recover(JSON.stringify(s));assert.deepEqual(r.clubhousePositions.ball,ball);assert.notDeepEqual(r.clubhousePositions.bike,s.clubhousePositions.bike);
 assert.deepEqual(otherState(r),before);
 for(const d of G.dreams){const p=L.effective(r.clubhousePositions,d.id);assert.ok(L.valid(d.id,p));assert.deepEqual(L.blockers(d.id,p,r.clubhousePositions,r.dreamPurchases),[]);}
 assert.deepEqual(G.recover(JSON.stringify(r)).clubhousePositions,r.clubhousePositions);
});
test('buying a bicycle safely clears space around existing chosen positions without changing prices or ownership',()=>{
 const s=G.initial();s.cash=1000;G.purchaseDream(s,'ball');const ball=L.canonical('ball','reading-bench',465);G.moveClubhouseItem(s,'ball',ball);
 const cash=s.cash;G.purchaseDream(s,'bike');assert.equal(s.cash,cash-250);assert.equal(G.dreamPurchaseCount(s),2);
 assert.deepEqual(s.clubhousePositions.ball,ball);assert.ok(G.ownsDream(s,'bike'));
 assert.deepEqual(L.blockers('bike',L.effective(s.clubhousePositions,'bike'),s.clubhousePositions,s.dreamPurchases),[]);
});
test('large floor treasures still have multiple valid destinations and reject furniture/off-room drops',()=>{
 for(const id of ['bike','guitar'])for(const [x,y]of [[434,603],[950,665],[1760,680]]){
  const p=L.canonical(id,'floor',x,y);assert.ok(p,[id,x,y]);assert.ok(L.drop(id,p.angle,p.y));
 }
 assert.equal(L.drop('bike',L.angleAt(1300),.5),null);assert.equal(L.drop('bike',110,.9),null);
});
