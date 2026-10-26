"""Result activation without a compatibility click, then duplicate delivery."""
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
   page=browser.new_page(viewport={'width':w,'height':h},is_mobile=True,has_touch=True);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(f'http://127.0.0.1:{server.server_port}/')
   page.evaluate("()=>{state=Game.initial();state.cash=0;NeighborhoodJobs.start(state,'flowers');while(!state.jobs.active.ended){const i=state.jobs.active.data.items.findIndex(v=>!v.done);NeighborhoodJobs.action(state,{type:'chore',item:i});}go('jobs')}")
   page.get_by_role('button',name='Collect $1',exact=True).dispatch_event('pointerup',{'pointerType':'touch','bubbles':True})
   page.locator('.modal').dispatch_event('click');assert page.get_by_role('button',name='Back to Job Board',exact=True).count()==1
   assert page.evaluate('state.cash')==1;stamp=page.evaluate('state.jobs.cooldowns.flowers')
   page.evaluate('Neighborhood.collect()');assert page.evaluate('state.cash')==1;assert page.evaluate('state.jobs.cooldowns.flowers')==stamp
   page.reload();assert page.evaluate('state.cash')==1
   page.evaluate("()=>{state=Game.initial();state.cash=0;NeighborhoodJobs.start(state,'catch');NeighborhoodJobs.action(state,{type:'basket',x:0});NeighborhoodJobs.tick(state,60000);go('jobs')}")
   assert page.evaluate('state.jobs.active.won') is False
   page.get_by_role('button',name='Try again',exact=True).dispatch_event('pointerup',{'pointerType':'touch','bubbles':True})
   serial=page.evaluate('state.jobs.active.serial');assert page.evaluate('state.jobs.active.ended') is False
   page.evaluate('Neighborhood.retry()');assert page.evaluate('state.jobs.active.serial')==serial
   assert page.evaluate('state.cash')==0 and page.evaluate('state.jobs.cooldowns')=={}
   assert not errors,errors
   print(f'PASS touch-release-only reward/retry and duplicate compatibility delivery {w}x{h}',flush=True)
   page.close()
  browser.close()
finally:server.shutdown()
