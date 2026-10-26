"""Touch weeding, backward-compatible farm saves and bonus recovery at phone sizes."""
import os
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from pathlib import Path
from playwright.sync_api import sync_playwright
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
root=Path(__file__).resolve().parents[1]
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)));Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  for w,h in [(320,440),(375,548),(428,746)]:
   page=browser.new_page(viewport={'width':w,'height':h},is_mobile=True,has_touch=True)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(os.environ.get('PREVIEW_URL',f'http://127.0.0.1:{server.server_port}/'))
   page.evaluate("()=>{state=Game.initial();state.cash=123.45;state.seeds.carrot=7;state.plots=Array.from({length:25},()=>({id:'carrot',age:3,left:0,quality:100,watered:false}));delete state.gardenWeeding;delete state.weedingCredits;save();}")
   page.reload();page.evaluate("go('garden')")
   page.get_by_role('button',name='Pull weeds',exact=True).tap()
   for i in range(1,4):page.get_by_role('button',name=f'Pull weed {i}',exact=True).tap()
   page.reload();page.evaluate("go('garden')");page.get_by_role('button',name='Pull weeds',exact=True).tap()
   assert page.evaluate('state.gardenWeeding.pulled.length')==3
   for i in range(4,7):
    button=page.get_by_role('button',name=f'Pull weed {i}',exact=True);button.scroll_into_view_if_needed();r=button.bounding_box();assert r['height']>=44 and r['width']>=44;button.tap()
   assert page.evaluate('state.plots.every(p=>p.weedingBonus)')
   page.get_by_role('button',name='Close ✕',exact=True).tap()
   page.reload();page.evaluate("go('garden')")
   assert page.evaluate('[state.cash,state.seeds.carrot]')==[123.45,7]
   assert page.evaluate('state.plots.every(p=>p.weedingBonus)')
   page.get_by_role('button',name='Harvest All Ready Crops',exact=True).tap()
   assert page.evaluate('state.inventory.carrot')==60
   page.reload();page.evaluate("go('garden')")
   assert page.evaluate('state.inventory.carrot')==60
   assert page.evaluate('Game.weedingAvailable(state)') is False
   assert page.evaluate("Object.keys(localStorage).every(k=>!k.startsWith('mgg-pr-1:')&&!k.startsWith('mgg-phase-8:'))")
   assert not errors,errors
   if w==428:page.screenshot(path='/tmp/consolidation-garden-weeding.png')
   print(f'PASS touch weeds, partial/complete reload, legacy save, one bonus only, cash/seeds preserved {w}x{h}',flush=True)
   page.close()
  browser.close()
finally:server.shutdown()
