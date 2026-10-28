"""All ten jobs, modes, pointer gestures, payouts and isolated save recovery.
Chromium touch + Safari-sized safe areas; not actual iPhone Safari hardware.
"""
import os,re,json
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
  for w,h,top,bottom in [(320,440,20,0),(375,548,20,0),(428,746,47,34)]:
   page=browser.new_page(viewport={'width':w,'height':h},is_mobile=True,has_touch=True,ignore_https_errors=bool(os.environ.get('PREVIEW_URL')));page.set_default_timeout(7000)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.add_init_script("document.addEventListener('DOMContentLoaded',()=>{document.documentElement.style.setProperty('--viewport-safe-top','"+str(top)+"px');document.documentElement.style.setProperty('--viewport-safe-bottom','"+str(bottom)+"px');syncGameViewport()})")
   page.goto(os.environ.get('PREVIEW_URL',f'http://127.0.0.1:{server.server_port}/'))
   def tap(name):page.get_by_role('button',name=name,exact=True).tap()
   assert page.evaluate('state.cash')==0
   page.get_by_role('button',name=re.compile("^I'm still learning to read!")).tap()
   assert page.evaluate('state.learningExperience')=='little'
   page.evaluate("go('jobs')");assert page.locator('[data-job-card]').count()==12
   if w==428:page.screenshot(path='/tmp/phase9-job-board-iphone.png',full_page=True)
   # Every card is available, readable and has original artwork.
   for card in page.locator('[data-job-card]').all():
    assert card.is_enabled();b=card.bounding_box();assert b['width']>=120 and b['height']>=140
    assert card.locator('svg,img').count()>0
   session=page.context.new_cdp_session(page)
   def touch(kind,x=0,y=0):session.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':[] if kind=='touchEnd' else [{'x':x,'y':y}]})
   def drag(source,target):
    # Conveyor produce moves continuously; scroll its stationary lane instead.
    (source.locator('..') if source.get_attribute('data-pack-item') is not None else source).scroll_into_view_if_needed()
    target.scroll_into_view_if_needed()
    # Center the pair in the reading viewport without changing the game state.
    a=source.bounding_box();b=target.bounding_box();middle=(a['y']+a['height']/2+b['y']+b['height']/2)/2
    page.locator('#app').evaluate('(e,dy)=>e.scrollTop+=dy',middle-page.evaluate("()=>{const hud=document.querySelector('.hud').getBoundingClientRect(),foot=document.querySelector('.job-main-actions').getBoundingClientRect();return (hud.bottom+30+foot.top)/2}"))
    a=source.bounding_box();b=target.bounding_box();x,y=a['x']+a['width']/2,a['y']+a['height']/2;tx,ty=b['x']+b['width']/2,b['y']+b['height']/2
    assert top<y<h-bottom and top<ty<h-bottom,(w,h,a,b)
    touch('touchStart',x,y)
    for k in range(1,9):touch('touchMove',x+(tx-x)*k/8,y+(ty-y)*k/8);page.wait_for_timeout(15)
    touch('touchEnd');page.wait_for_timeout(450)
   for mode in ['little','growing']:
    for job in os.environ.get('JOB_FILTER','words,packing,stacks,labels,match,catch,weeds,tomatoes,flowers,tidy').split(','):
     page.evaluate("mode=>{if(view==='jobs')Neighborhood.stop();state=Game.initial();state.cash=0;Game.chooseExperience(state,mode);go('jobs')}",mode)
     page.locator(f'[data-job-card="{job}"]').tap();assert page.locator('.job-play').count()==1,(job,errors,page.evaluate('[view,popup,state.jobs.active]'))
     assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
     assert page.evaluate('state.jobs.active.mode')==mode
     if w==428 and mode=='little':page.screenshot(path=f'/tmp/phase9-{job}-iphone.png')
     if job=='words':
      paths=page.evaluate('Object.values(state.jobs.active.data.paths)')
      drag(page.locator(f'[data-letter="{paths[0][0]}"]'),page.locator(f'[data-letter="{paths[0][-1]}"]'))
      assert page.evaluate('state.jobs.active.data.found.length')==1
      for path in paths[1:]:page.locator(f'[data-letter="{path[0]}"]').tap();page.locator(f'[data-letter="{path[-1]}"]').tap()
     elif job=='packing':
      i=page.locator('[data-pack-item]').first.get_attribute('data-pack-item');kind=page.evaluate('i=>state.jobs.active.data.items[i]',int(i))
      drag(page.locator(f'[data-pack-item="{i}"]'),page.locator(f'[data-job-drop="{kind}"]'))
      assert page.evaluate('state.jobs.active.score')==1
      while not page.evaluate('state.jobs.active.ended'):
       el=page.locator('[data-pack-item]').first;i=int(el.get_attribute('data-pack-item'));kind=page.evaluate('i=>state.jobs.active.data.items[i]',i);el.tap(force=True);page.locator(f'[data-job-drop="{kind}"]').tap()
     elif job=='stacks':
      solution=page.evaluate('state.jobs.active.data.solution');initial=page.evaluate('state.jobs.active.data.crates')
      first=solution[0]
      page.locator('.job-stack').nth(first[0]).tap();page.locator('.job-stack').nth(first[1]).tap()
      if not page.evaluate('state.jobs.active.ended'):
       tap('Undo');assert page.evaluate('state.jobs.active.data.crates')==initial
       tap('Restart');assert page.evaluate('state.jobs.active.data.crates')==initial
       for a,b in solution:
        if page.evaluate('state.jobs.active.ended'):break
        page.locator('.job-stack').nth(a).tap();page.locator('.job-stack').nth(b).tap()
     elif job=='labels':
      while not page.evaluate('state.jobs.active.ended'):
       indices=page.evaluate("()=>{const d=state.jobs.active.data,used=[];return [...d.words[d.round]].map(v=>{const i=d.tiles.findIndex((x,i)=>x===v&&!used.includes(i));used.push(i);return i})}")
       # Place from right to left into explicitly selected slots.
       for slot in reversed(range(len(indices))):
        i=indices[slot]
        page.locator(f'.free-letter-tray [data-item="{i}"]').tap()
        page.locator(f'[data-job-drop="letter-{slot}"]').tap()
     elif job=='match':
      m=page.evaluate('NeighborhoodJobs.moves(state.jobs.active.data.grid)[0]');drag(page.locator(f'[data-match-cell="{m[0]}"]'),page.locator(f'[data-match-cell="{m[1]}"]'))
      assert page.evaluate('state.jobs.active.score')>0
      while page.evaluate('state.jobs.active.score<state.jobs.active.data.target'):
       m=page.evaluate('NeighborhoodJobs.moves(state.jobs.active.data.grid)[0]');page.locator(f'[data-match-cell="{m[0]}"]').tap();page.locator(f'[data-match-cell="{m[1]}"]').tap();page.wait_for_timeout(280)
      # Real active-play pause/background/reload, then rule-tested completion.
      page.wait_for_timeout(120);tap('Pause');elapsed=page.evaluate('state.jobs.active.elapsed');page.wait_for_timeout(150);assert page.evaluate('state.jobs.active.elapsed')==elapsed
      page.reload();page.evaluate("go('jobs')");assert page.evaluate('state.jobs.active.elapsed')>=elapsed;paused=page.evaluate('state.jobs.active.elapsed');page.wait_for_timeout(120);assert page.evaluate('state.jobs.active.elapsed')==paused
      tap('Play / Resume');page.wait_for_timeout(120);assert page.evaluate('state.jobs.active.elapsed')>paused
      page.evaluate("()=>{Neighborhood.stop();NeighborhoodJobs.tick(state,NeighborhoodJobs.clockLimit(state.jobs.active)-state.jobs.active.elapsed);render()}")
     elif job=='catch':
      world=page.locator('[data-catch-world]');world.scroll_into_view_if_needed();r=world.bounding_box();touch('touchStart',r['x']+r['width']*.8,r['y']+r['height']*.7);touch('touchMove',r['x']+r['width']*.4,r['y']+r['height']*.7);touch('touchEnd');assert page.evaluate('state.jobs.active.data.basket')<.6
      page.wait_for_timeout(100);page.evaluate("()=>{Neighborhood.stop();const a=state.jobs.active,d=a.data;for(let i=0;i<Math.ceil(60000/d.launchEvery);i++){const c=NeighborhoodJobs.carrot(a,i),time=c.launch+c.flight;if(time<=a.elapsed||time>60000)continue;NeighborhoodJobs.action(state,{type:'basket',x:c.end});NeighborhoodJobs.tick(state,time-a.elapsed);}NeighborhoodJobs.tick(state,60000-a.elapsed);render()}")
     elif job=='tidy':
      # Direction buttons and actual dragging, then remaining route through UI taps.
      route=page.evaluate("()=>{const d=state.jobs.active.data,seen=new Set([d.mower]),route=[];function walk(i){for(const j of JobLawn.neighbors(d,i))if(!seen.has(j)){seen.add(j);route.push(j);walk(j);route.push(i)}}walk(d.mower);return route}")
      for cell in route:
       if page.evaluate("state.jobs.active.data.stage!=='mow'"):break
       current=page.evaluate('state.jobs.active.data.mower');direction='right' if cell==current+1 else 'left' if cell==current-1 else 'down' if cell>current else 'up'
       page.get_by_role('button',name='Mow '+direction,exact=True).tap()
      assert page.evaluate("state.jobs.active.data.stage==='rake'")
      # Tap each lawn patch to sweep all required clippings, no deadline.
      for cell in page.evaluate('state.jobs.active.data.cells.map((c,i)=>c.blocked?-1:i).filter(i=>i>=0)'):
       el=page.locator(f'[data-lawn-cell="{cell}"]');el.scroll_into_view_if_needed();r=el.bounding_box();touch('touchStart',r['x']+r['width']/2,r['y']+r['height']/2);touch('touchEnd')
      assert page.evaluate("state.jobs.active.data.stage==='compost'"),(w,mode,page.evaluate("state.jobs.active.data.cells.map((c,i)=>!c.blocked&&!c.raked?i:-1).filter(i=>i>=0)"),page.locator(".job-lawn-world").bounding_box())
      for pile in range(3):
       page.get_by_role('button',name=f'Grass pile {pile+1}',exact=True).tap()
       page.get_by_role('button',name='Compost bin',exact=True).tap()
     else:
      if job=='flowers':
       drag(page.locator('[data-job-drag="water"]'),page.locator('[data-job-drop="yard-0"]'))
       assert page.evaluate('state.jobs.active.data.items[0].done')
      elif job=='tidy':
       k=page.evaluate('state.jobs.active.data.items[0].kind');drag(page.locator('[data-job-drag="chore"][data-item="0"]'),page.locator(f'[data-job-drop="{k}"]'));assert page.evaluate('state.jobs.active.score')==1
      else:
       i=page.evaluate("()=>{const a=state.jobs.active;return a.data.items.findIndex(v=>v.kind===(a.id==='weeds'?'weed':'ripe'))}");drag(page.locator(f'[data-job-drag="chore"][data-item="{i}"]'),page.locator('[data-job-drop="basket"]'));assert page.evaluate('state.jobs.active.score')==1
      while not page.evaluate('state.jobs.active.ended'):
       i=page.evaluate("()=>{const a=state.jobs.active;return a.data.items.findIndex(v=>!v.done&&(a.id==='weeds'?v.kind==='weed':a.id==='tomatoes'?v.kind==='ripe':true))}")
       if job=='flowers':page.locator('[data-job-drag="water"]').tap()
       page.locator(f'[data-job-drag="chore"][data-item="{i}"]').tap()
       if job=='tidy':
        k=page.evaluate('i=>state.jobs.active.data.items[i].kind',i);page.locator(f'[data-job-drop="{k}"]').tap()
     assert page.locator('.job-results').count()==1,(mode,job)
     tap('Collect $1');page.wait_for_function('state.cash===1');page.evaluate('Neighborhood.collect()');assert page.evaluate('state.cash')==1,(mode,job,page.evaluate('[state.cash,state.jobs.active,popup]'),errors)
     tap('Back to Job Board');assert page.locator(f'[data-job-card="{job}"]').is_disabled()
     assert 'Available in' in page.locator(f'[data-job-cooldown="{job}"]').inner_text()
     page.reload();assert page.evaluate('state.cash')==1;page.evaluate("go('jobs')");assert page.locator(f'[data-job-card="{job}"]').is_disabled()
     assert not errors,(w,mode,job,errors)
     print(f'PASS {mode} {job}: touch play, $1, cooldown and reload {w}x{h}',flush=True)
   page.close()
  browser.close()
finally:server.shutdown()
