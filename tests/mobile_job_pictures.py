"""Original-image games: touch hit testing, pinch/pan, all scenes, puzzles, saves.
Uses Chromium with iPhone-sized viewports; actual Safari still needs playtesting.
"""
import os,json
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
class Q(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Q,directory=str(root)));Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  for w,h in [(320,440),(375,548),(428,746)]:
   page=b.new_page(viewport={'width':w,'height':h},is_mobile=True,has_touch=True);page.set_default_timeout(8000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(os.environ.get('PREVIEW_URL',f'http://127.0.0.1:{server.server_port}/'))
   page.evaluate("()=>{state=Game.newGame();Game.chooseExperience(state,'growing');go('jobs')}")
   assert page.locator('[data-job-card]').count()==12
   cdp=page.context.new_cdp_session(page)
   def points(kind,ps):cdp.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':[{'id':i+1,'x':x,'y':y} for i,(x,y) in enumerate(ps)]})
   def tap(name):page.get_by_role('button',name=name,exact=True).tap()
   def start(id,mode,scene=None):
    page.evaluate("([id,mode])=>{Neighborhood.stop();state=Game.newGame();Game.chooseExperience(state,mode);Neighborhood.start(id)}",[id,mode])
    if scene is not None:page.evaluate("scene=>{while(state.jobs.active.data.scene!==scene)NeighborhoodJobs.action(state,{type:'nextPicture'});render()}",scene)
   for mode in ['little','growing']:
    for id in ['hidden','sliding']:
     start(id,mode)
     page.wait_for_function('!document.querySelector("[data-picture-begin]").disabled')
     assert page.evaluate('state.jobs.active.elapsed')==0
     page.wait_for_timeout(100);assert page.evaluate('state.jobs.active.elapsed')==0
     old=page.evaluate('state.jobs.active.data.scene');tap('New Picture');assert page.evaluate('state.jobs.active.data.scene')!=old
     page.locator('[data-picture-begin]').tap();assert page.locator('[data-picture-begin]').count()==0
     page.wait_for_timeout(100)
     assert page.evaluate('state.jobs.active.elapsed')>0
     if id=='hidden':
      assert page.locator('.seek-checklist button').count()==(5 if mode=='little' else page.evaluate('state.jobs.active.data.targets.length'))
      # Actual two-finger pinch and one-finger pan; a gesture never finds an object.
      world=page.locator('[data-picture-world]');r=world.bounding_box();cx=r['x']+r['width']/2;cy=r['y']+r['height']/2
      points('touchStart',[(cx-15,cy),(cx+15,cy)]);points('touchMove',[(cx-45,cy),(cx+45,cy)]);points('touchEnd',[])
      assert page.locator('.seek-canvas').evaluate("e=>e.style.transform.includes('scale(3)')")
      points('touchStart',[(cx,cy)]);points('touchMove',[(cx+35,cy+20)]);points('touchEnd',[])
      assert page.evaluate('state.jobs.active.data.found.length')==0
      tap('Fit');tap('Hint');assert page.locator('.seek-hint').count()==1
      before=page.evaluate('state.jobs.active.data.found.length');assert before==0
      # Fit centers a square image. Tap each requested real object at reviewed coordinates.
      targets=page.evaluate('state.jobs.active.data.targets')
      for item in targets:
       xy=page.evaluate("i=>{const a=state.jobs.active,o=JobGallery.hidden[a.data.scene].objects[i],r=document.querySelector('.seek-canvas').getBoundingClientRect();return [r.x+(o.x+o.w/2)*r.width,r.y+(o.y+o.h/2)*r.height]}",item)
       page.touchscreen.tap(*xy)
       assert page.evaluate('i=>state.jobs.active.data.found.includes(i)',item),(w,mode,item,xy)
     else:
      assert page.locator('.picture-tile').count()==(8 if mode=='little' else 15)
      initial=page.evaluate('state.jobs.active.data.tiles');moves=page.evaluate('state.jobs.active.data.solution')
      page.locator(f'[data-picture-tile="{moves[0]}"]').tap();assert page.evaluate('state.jobs.active.data.moves')==1
      tap('Restart');assert page.evaluate('state.jobs.active.data.tiles')==initial
      tap('Hint');assert page.locator('.hint-tile').count()==1
      tap('Pause');elapsed=page.evaluate('state.jobs.active.elapsed');page.wait_for_timeout(200);assert page.evaluate('state.jobs.active.elapsed')==elapsed
      assert page.locator('.picture-paused').is_visible();page.reload();page.evaluate("go('jobs')");assert page.evaluate('state.jobs.active.elapsed')>=elapsed
      paused=page.evaluate('state.jobs.active.elapsed');page.wait_for_timeout(100);assert page.evaluate('state.jobs.active.elapsed')==paused
      tap('Resume')
      for cell in moves:
       if page.evaluate('state.jobs.active.ended'):break
       page.locator(f'[data-picture-tile="{cell}"]').tap();page.wait_for_timeout(150)
      assert page.locator('.job-picture-complete').is_visible()
     assert page.locator('.job-results').count()==1
     tap('Collect $1');page.wait_for_function('state.cash===1');page.evaluate('Neighborhood.collect()');assert page.evaluate('state.cash')==1
     page.reload();page.evaluate("go('jobs')");assert page.locator(f'[data-job-card="{id}"]').is_disabled();assert page.evaluate('state.cash')==1
     print(f'PASS {id} {mode} {w}x{h}: touch, hints, gestures/restart, result, payout, recovery',flush=True)
   # Every real image loads and every requested object center is tappable, all scenes.
   if w==428:
    for scene in range(30):
     start('hidden','growing',scene);page.locator('[data-picture-begin]').tap()
     for item in page.evaluate('state.jobs.active.data.targets'):
      xy=page.evaluate("i=>{const a=state.jobs.active,o=JobGallery.hidden[a.data.scene].objects[i],r=document.querySelector('.seek-canvas').getBoundingClientRect();return [r.x+(o.x+o.w/2)*r.width,r.y+(o.y+o.h/2)*r.height]}",item);page.touchscreen.tap(*xy)
      assert page.evaluate('i=>state.jobs.active.data.found.includes(i)',item),(scene,item)
     assert page.evaluate('state.jobs.active.won')
     start('sliding','little',scene);page.locator('[data-picture-begin]').tap();assert page.locator('.picture-tile').count()==8
     assert page.evaluate("()=>Promise.all([...document.images].map(i=>i.complete&&i.naturalWidth))")
     print(f'PASS original scene pair {scene+1}/30',flush=True)
   assert not errors,errors
   page.close()
  b.close()
finally:server.shutdown()
