"""Actual touch gestures and save/record checks at iPhone-sized viewports.
Chromium automation; native Safari/VoiceOver still require device playtesting.
"""
import os,re
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)));Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  for w,h in [(320,440),(375,548),(428,746)]:
   page=browser.new_page(viewport={'width':w,'height':h},is_mobile=True,has_touch=True,ignore_https_errors=bool(os.environ.get('PREVIEW_URL')));page.set_default_timeout(10000)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(os.environ.get('PREVIEW_URL',f'http://127.0.0.1:{server.server_port}/'))
   page.get_by_role('button',name=re.compile("^I'm still learning to read!")).tap()
   page.evaluate("()=>{state.cash=77.37;state.inventory.carrot=8;go('jobs')}")
   assert page.locator('[data-records]').count()==10
   for id,art in [('labels','magee'),('catch','jones')]:
    assert page.locator(f'[data-job-card="{id}"] svg').get_attribute('aria-label')
    assert page.locator(f'[data-job-card="{id}"] path').count()>=15
   def tap(name):page.get_by_role('button',name=name,exact=True).tap()
   def start(id,mode='little',seed=97):
    page.evaluate("([id,mode,seed])=>{Neighborhood.stop();NeighborhoodJobs.quit(state);closeDialog();state.jobs.cooldowns[id]=0;Game.chooseExperience(state,mode);go('jobs');const r=Math.random;Math.random=()=>(seed-1)/0xffffffff;try{Neighborhood.start(id)}finally{Math.random=r}}",[id,mode,seed])
   session=page.context.new_cdp_session(page)
   def touch(kind,x=0,y=0):session.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':[] if kind=='touchEnd' else [{'x':x,'y':y}]})
   def drag(source,target):
    source.scroll_into_view_if_needed();target.scroll_into_view_if_needed()
    a=source.bounding_box();b=target.bounding_box();mid=(a['y']+a['height']/2+b['y']+b['height']/2)/2
    page.locator('#app').evaluate('(e,dy)=>e.scrollTop+=dy',mid-(h+60)/2)
    a=source.bounding_box();b=target.bounding_box();x,y=a['x']+a['width']/2,a['y']+a['height']/2;tx,ty=b['x']+b['width']/2,b['y']+b['height']/2
    touch('touchStart',x,y)
    for n in range(1,13):touch('touchMove',x+(tx-x)*n/12,y+(ty-y)*n/12);page.wait_for_timeout(15)
    touch('touchEnd');page.wait_for_timeout(100)
   for mode in ['little','growing']:
    start('labels',mode);n=page.evaluate('state.jobs.active.data.slots.length')
    page.locator('.free-letter-tray [data-item="0"]').tap();page.locator(f'[data-job-drop="letter-{n-1}"]').tap()
    assert page.evaluate('state.jobs.active.data.slots.at(-1)')==0
    drag(page.locator('.free-letter-tray [data-item="1"]'),page.locator('[data-job-drop="letter-0"]'))
    assert page.evaluate('state.jobs.active.data.slots[0]')==1
    drag(page.locator(f'[data-job-drop="letter-{n-1}"]'),page.locator('[data-job-drop="letter-0"]'))
    assert page.evaluate('[state.jobs.active.data.slots[0],state.jobs.active.data.slots.at(-1)]')==[0,1]
    drag(page.locator('[data-job-drop="letter-0"]'),page.locator('.free-letter-tray'))
    assert page.evaluate('state.jobs.active.data.slots[0]') is None
    page.locator(f'[data-job-drop="letter-{n-1}"]').tap();tap('Return selected letter to tray');assert page.evaluate('state.jobs.active.data.slots.every(x=>x===null)')
    page.evaluate('Neighborhood.stop();save()');saved=page.evaluate('state.jobs.active');page.reload();assert page.evaluate('state.jobs.active')==saved;page.evaluate("go('jobs')");tap('Play / Resume')
    indices=page.evaluate("()=>{const d=state.jobs.active.data,used=[];return [...d.words[d.round]].map(v=>{const i=d.tiles.findIndex((x,i)=>x===v&&!used.includes(i));used.push(i);return i})}")
    diff=page.evaluate('state.jobs.active.data.words[0].split(\'\').findIndex(x=>x!==state.jobs.active.data.words[0][0])')
    wrong=indices[:];wrong[0],wrong[diff]=wrong[diff],wrong[0]
    for slot,i in enumerate(wrong):page.locator(f'.free-letter-tray [data-item="{i}"]').tap();page.locator(f'[data-job-drop="letter-{slot}"]').tap()
    assert page.evaluate('state.jobs.active.score')==0;assert 'Try changing a letter' in page.locator('.job-feedback').inner_text()
    page.locator('[data-job-drop="letter-0"]').tap();page.locator(f'[data-job-drop="letter-{diff}"]').tap();assert page.evaluate('state.jobs.active.score')==1
    page.screenshot(path=f'/tmp/jobs-refined-labels-{mode}-{w}.png')
    print(f'PASS free tile selection/drag/arbitrary slots/swap/return/correct/reload {mode} {w}x{h}',flush=True)
   # Manual scenery pans stop on release and picking never advances the row.
   for id in ['weeds','tomatoes']:
    start(id);row=page.locator('[data-job-row]');row.scroll_into_view_if_needed();r=row.bounding_box();x=r['x']+r['width']*.85;y=max(115,r['y']+20)
    touch('touchStart',x,y)
    for n in range(1,13):touch('touchMove',x-n*18,y);page.wait_for_timeout(15)
    touch('touchEnd');page.wait_for_timeout(80);left=row.evaluate('(e)=>e.scrollLeft');assert left>100,(id,left,r)
    page.wait_for_timeout(300);assert abs(row.evaluate('(e)=>e.scrollLeft')-left)<1
    r=row.bounding_box();x=r['x']+30;touch('touchStart',x,y)
    for n in range(1,11):touch('touchMove',x+n*14,y);page.wait_for_timeout(15)
    touch('touchEnd');page.wait_for_timeout(80);assert row.evaluate('(e)=>e.scrollLeft')<left
    i=page.evaluate("()=>{const a=state.jobs.active;return a.data.items.findIndex(v=>v.kind===(a.id==='weeds'?'weed':'ripe'))}")
    item=page.locator(f'.job-row-pick[data-item="{i}"]');item.scroll_into_view_if_needed();before=row.evaluate('(e)=>e.scrollLeft');item.tap();page.wait_for_timeout(250)
    assert page.evaluate('state.jobs.active.score')==1;assert abs(row.evaluate('(e)=>e.scrollLeft')-before)<1
    assert page.locator(f'.job-row-pick[data-item="{i}"]').evaluate('(e)=>getComputedStyle(e.querySelector("svg")).opacity')=='0'
    if id=='weeds':assert page.locator('.yellow-weed').count()==16;assert page.locator('.carrot-healthy').count()==4
    page.screenshot(path=f'/tmp/jobs-refined-{id}-{w}.png')
   print(f'PASS manually controlled forward/back row pans, no drift/auto advance, carrot bed and ripe picks {w}x{h}',flush=True)
   # Steer and drag the mower; walls prevent shortcuts. Rake responds to a sweep.
   start('tidy');tap('Mow right');assert page.evaluate('state.jobs.active.data.mower')==1
   drag(page.locator('[data-lawn-cell="1"]'),page.locator('[data-lawn-cell="2"]'));assert page.evaluate('state.jobs.active.data.mower')>=2
   page.evaluate("()=>{const d=state.jobs.active.data,seen=new Set([d.mower]);function walk(i){for(const j of JobLawn.neighbors(d,i))if(!seen.has(j)){seen.add(j);if(d.stage==='mow')NeighborhoodJobs.action(state,{type:'mow',cell:j});walk(j);if(d.stage==='mow')NeighborhoodJobs.action(state,{type:'mow',cell:i});}}walk(d.mower);render()}")
   assert page.evaluate("state.jobs.active.data.stage==='rake'");assert not page.evaluate('state.jobs.active.won')
   drag(page.locator('[data-lawn-cell="0"]'),page.locator('[data-lawn-cell="3"]'));assert page.evaluate('state.jobs.active.data.cells.filter(x=>x.raked).length')>=2
   page.screenshot(path=f'/tmp/jobs-refined-lawn-{w}.png')
   # Finish remaining sweeps through rules, then move each visible pile by touch.
   page.evaluate("()=>{const d=state.jobs.active.data;for(let cell=0;cell<d.cells.length;cell++)if(!d.cells[cell].blocked&&!d.cells[cell].raked)NeighborhoodJobs.action(state,{type:'rake',cell});render()}")
   drag(page.get_by_role('button',name='Grass pile 1',exact=True),page.get_by_role('button',name='Compost bin',exact=True));assert page.evaluate('state.jobs.active.data.collected[0]')
   for pile in [2,3]:tap(f'Grass pile {pile}');tap('Compost bin')
   assert page.evaluate('state.jobs.active.won');assert page.get_by_role('button',name='Collect $1',exact=True).count()==1
   print(f'PASS mower direction/drag, obstacles, rake sweep and compost drag/tap finish {w}x{h}',flush=True)
   # Genuine completion-time record: $1 first, $3 better, $1 exact tie.
   page.evaluate('NeighborhoodJobs.quit(state);state.jobs=NeighborhoodJobs.empty();save()')
   for elapsed,reward,expected in [(20000,1,78.37),(10000,3,81.37),(10000,1,82.37)]:
    start('flowers','growing');page.evaluate('Neighborhood.stop()')
    page.evaluate("ms=>{NeighborhoodJobs.tick(state,Math.max(0,ms-state.jobs.active.elapsed));while(!state.jobs.active.ended){const item=state.jobs.active.data.items.findIndex(x=>!x.done);NeighborhoodJobs.action(state,{type:'chore',item});}save();render()}",elapsed)
    if reward==3:assert page.get_by_role('heading',name='New Personal Best!',exact=True).count()==1
    page.reload();page.evaluate("go('jobs')");assert page.get_by_role('button',name=f'Collect ${reward}',exact=True).count()==1,(elapsed,reward,page.evaluate('NeighborhoodJobs.result(state.jobs)'))
    page.get_by_role('button',name=f'Collect ${reward}',exact=True).dispatch_event('pointerup',{'pointerType':'touch','bubbles':True});page.locator('.modal').dispatch_event('click');page.evaluate('Neighborhood.collect()')
    assert page.evaluate('state.cash')==expected
    stamp=page.evaluate('state.jobs.cooldowns.flowers');assert stamp>page.evaluate('Date.now()')+290000
    page.reload();assert page.evaluate('state.cash')==expected;assert page.evaluate('state.jobs.cooldowns.flowers')==stamp
   page.evaluate("go('jobs')");page.locator('[data-records="flowers"]').tap();text=page.locator('.dialog').inner_text();assert 'Personal best: 10.00 seconds' in text;assert 'Latest result: 10.00 seconds' in text;assert 'Previous best: 10.00 seconds' in text
   assert page.evaluate('state.inventory.carrot')==8
   # New match is ninety seconds, hidden and paused clocks do not advance.
   tap('Close ✕');start('match');assert page.locator('[data-job-time]').inner_text() in ['1:30','1:29'];tap('Pause');elapsed=page.evaluate('state.jobs.active.elapsed');page.wait_for_timeout(100);assert page.evaluate('state.jobs.active.elapsed')==elapsed
   tap('Play / Resume');page.evaluate("()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))}");elapsed=page.evaluate('state.jobs.active.elapsed');page.wait_for_timeout(100);assert page.evaluate('state.jobs.active.elapsed')==elapsed
   page.evaluate("()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'))}")
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   page.emulate_media(reduced_motion='reduce');assert page.locator('.job-match-grid').count()==1
   # Decode every bundled clip to catch missing/invalid letter hints.
   assert page.evaluate("async()=>{const a=new AudioContext();for(const letter of 'abcdefghijklmnopqrstuvwxyz'){const r=await fetch('assets/neighborhood/phonics/'+letter+'.wav');if(!r.ok)return false;const b=await a.decodeAudioData(await r.arrayBuffer());if(b.duration<=0)return false;}await a.close();return true}")
   assert not errors,errors
   print(f'PASS $1/$3/tie records, duplicate/reload safety, all 26 sounds, pause/hidden clock and preserved farm {w}x{h}',flush=True)
   page.close()
  browser.close()
finally:server.shutdown()
