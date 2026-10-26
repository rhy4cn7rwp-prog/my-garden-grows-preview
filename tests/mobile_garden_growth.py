"""Crop-specific closeups, correct stages/regrowth and reachable controls on phones."""
import os
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
   page=browser.new_page(viewport={'width':w,'height':h},is_mobile=True,has_touch=True)
   page.set_default_timeout(7000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.add_init_script("document.addEventListener('DOMContentLoaded',()=>{document.documentElement.style.setProperty('--viewport-safe-top','"+str(top)+"px');document.documentElement.style.setProperty('--viewport-safe-bottom','"+str(bottom)+"px');syncGameViewport()})")
   page.goto(f'http://127.0.0.1:{server.server_port}/')
   crops=page.evaluate('CROPS')
   for c in crops:
    for age in sorted(set([0,1,c['days']-1,c['days']])):
     page.evaluate("({id,age})=>{state=Game.initial();state.plots[0]={id,age,left:crop(id).repeat,quality:100,watered:false};go('garden');plot(0)}",{'id':c['id'],'age':age})
     img=page.locator('.garden-crop-closeup img');img.evaluate('img=>img.decode()')
     assert c['name'] in img.get_attribute('alt')
     assert img.bounding_box()['width']>=200 and img.bounding_box()['height']>=110
     info=page.locator('.dialog').inner_text();assert 'watered days' in info and 'Estimated market value' in info
     assert ('Multiple harvests' if c['repeat'] else 'one harvest') in info
     close=page.get_by_role('button',name='Close ✕',exact=True);r=close.bounding_box();assert r['height']>=44 and top<=r['y'] and r['y']+r['height']<=h-bottom+1,(w,c['id'],r)
     if age<c['days']:assert page.get_by_role('button',name='Water this plant',exact=True).is_enabled()
     else:assert page.get_by_role('button',name='🧺 Harvest',exact=True).count()==1
     assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
     # All four illustrations remain accessible even for quick two-day crops.
     page.locator('.garden-growth-guide summary').tap()
     images=page.locator('.garden-growth-guide img');assert images.count()==4
     for n,img in enumerate(images.all(),1):img.evaluate('img=>img.decode()');assert img.get_attribute('src').endswith(f'{c["id"]}-{n}.svg')
     close.tap();assert page.locator('.garden-crop').count()==0
    if c['repeat']:
     page.evaluate("id=>{state.plots[0]={id,age:0,left:crop(id).repeat-1,quality:100,watered:false};plot(0)}",c['id'])
     assert 'Regrowing after harvest' in page.locator('.garden-crop-closeup figcaption').inner_text()
     assert page.locator('.garden-crop-closeup').get_attribute('data-growth-stage')=='3'
     page.get_by_role('button',name='Close ✕',exact=True).tap()
   if w==428:
    page.evaluate("()=>{state.plots[0]={id:'carrot',age:3,left:0,quality:100,watered:false};plot(0)}")
    page.locator('.garden-crop-closeup img').evaluate('img=>img.decode()');page.screenshot(path='/tmp/garden-growth-carrot.png')
    page.get_by_role('button',name='Close ✕',exact=True).tap()
    page.evaluate("()=>{state.plots[0]={id:'tomato',age:4,left:2,quality:100,watered:false};plot(0)}")
    page.locator('.garden-crop-closeup img').evaluate('img=>img.decode()');page.screenshot(path='/tmp/garden-growth-tomato.png')
   assert not errors,errors
   print(f'PASS 10 crop closeups, 40 decoded stage illustrations, regrowth, crop values/info, accessible close/water/harvest {w}x{h}',flush=True)
   page.close()
  # Contact sheet used for visual review of all four stages for every crop.
  page=browser.new_page(viewport={'width':1200,'height':1000})
  base=f'http://127.0.0.1:{server.server_port}/'
  page.set_content('<body style="background:#f6edd5;font:18px Georgia"><h1>Garden growth illustrations</h1>'+''.join(f'<section style="display:flex;align-items:center"><b style="width:100px">{c["name"]}</b>'+''.join(f'<img style="width:250px" src="{base}assets/garden-growth/{c["id"]}-{n}.svg"/>' for n in range(1,5))+'</section>' for c in crops)+'</body>')
  page.locator('img').evaluate_all('imgs=>Promise.all(imgs.map(i=>i.decode()))');page.screenshot(path='/tmp/garden-growth-contact-sheet.png',full_page=True)
  browser.close()
finally:server.shutdown()
