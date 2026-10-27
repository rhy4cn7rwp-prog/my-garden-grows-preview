"""Quick usable-height and touch-target checks before longer picture playthroughs."""
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
class Q(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
s=ThreadingHTTPServer(('127.0.0.1',0),partial(Q,directory=str(Path(__file__).resolve().parents[1])));Thread(target=s.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  for w,h,top,bottom in [(320,440,20,0),(375,548,20,0),(428,746,47,34)]:
   page=b.new_page(viewport={'width':w,'height':h},is_mobile=True,has_touch=True);page.add_init_script(f"document.addEventListener('DOMContentLoaded',()=>{{document.documentElement.style.setProperty('--viewport-safe-top','{top}px');document.documentElement.style.setProperty('--viewport-safe-bottom','{bottom}px');syncGameViewport()}})");page.goto(f'http://127.0.0.1:{s.server_port}/')
   for mode in ['little','growing']:
    for id in ['hidden','sliding','stacks']:
     page.evaluate("([id,mode])=>{Neighborhood.stop();state=Game.newGame();Game.chooseExperience(state,mode);Neighborhood.start(id)}",[id,mode])
     footer=page.locator('.job-main-actions').bounding_box()['y']
     if id!='stacks':
      for selector in ['[data-picture-begin]','.picture-prepare-actions']:
       r=page.locator(selector).bounding_box();assert r['y']+r['height']<=footer+1,(w,mode,id,selector,r,footer)
      page.locator('[data-picture-begin]').tap()
     selector='.picture-tools' if id=='hidden' else '.picture-sliding' if id=='sliding' else '.job-play-area'
     r=page.locator(selector).bounding_box();assert r['y']+r['height']<=footer+1,(w,mode,id,r,footer)
     if id=='sliding':assert page.locator('.picture-tile').first.bounding_box()['width']>=43
     assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
     page.screenshot(path=f'/tmp/picture-layout-{id}-{mode}-{w}.png')
     print('PASS mobile layout',id,mode,w,h,flush=True)
   page.close()
  b.close()
finally:s.shutdown()
