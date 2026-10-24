"""Both signs remain on their scenery, readable and clear of touch targets.
Isolated Chromium phone contexts; native iPhone Safari remains a manual check.
"""
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
s=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)));Thread(target=s.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  for w,h,t,b in [(320,360,0,0),(320,440,20,0),(375,548,20,0),(390,664,47,34),(428,746,47,34),(428,892,47,34),(667,320,0,21)]:
   page=browser.new_page(viewport={'width':w,'height':h},is_mobile=True,has_touch=True)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.add_init_script("document.addEventListener('DOMContentLoaded',()=>{document.documentElement.style.setProperty('--viewport-safe-top','"+str(t)+"px');document.documentElement.style.setProperty('--viewport-safe-bottom','"+str(b)+"px');syncGameViewport();});")
   page.goto(f'http://127.0.0.1:{s.server_port}/')
   for season in range(1,5):
    page.evaluate('n=>{state.season=n;render()}',season)
    d=page.locator('.town-intro h1').evaluate("e=>({rect:e.getBoundingClientRect().toJSON(),color:getComputedStyle(e).color,bg:getComputedStyle(e).backgroundImage,font:parseFloat(getComputedStyle(e).fontSize),world:document.querySelector('.town-world').getBoundingClientRect().toJSON()})")
    assert d['color']=='rgb(81, 51, 31)' and 'gradient' in d['bg']
    assert d['font']>=20
    assert d['rect']['left']>=0 and d['rect']['right']<=w+1
    assert d['rect']['bottom']<=d['world']['top']+1,(w,h,d)
    assert page.locator('.town-building').count()==6
    if w==428 and h==746:page.screenshot(path=f'/tmp/title-sign-season-{season}.png')
   before=page.evaluate("({...state,display:Object.fromEntries(Object.entries(state.display).filter(([,n])=>n>0))})")
   page.get_by_role('button',name='Seed & Feed',exact=True).tap()
   page.wait_for_function("document.querySelector('.seed-counter-sign')?.style.width")
   def sign_fit():
    d=page.evaluate("()=>{const sign=document.querySelector('.seed-counter-plaque'),r=sign.getBoundingClientRect(),image=document.querySelector('.seed-shop-interior').getBoundingClientRect(),world=document.querySelector('.seed-shop-world'),scale=Math.max(world.clientWidth/1024,world.clientHeight/1536);return {rect:r.toJSON(),image:image.toJSON(),scale,signs:document.querySelectorAll('.seed-counter-sign').length,old:document.querySelector('.seed-shop-heading h1')!==null,buttons:[...document.querySelectorAll('.seed-packet,.seed-shop-bottom button,.hud button')].map(e=>e.getBoundingClientRect().toJSON())}}")
    assert d['signs']==1 and not d['old']
    r=d['rect'];assert r['left']>=0 and r['right']<=w+1 and r['top']>=t-1 and r['bottom']<=h-b+1,(w,h,d)
    for q in d['buttons']:
     assert min(r['right'],q['right'])-max(r['left'],q['left'])<=1 or min(r['bottom'],q['bottom'])-max(r['top'],q['top'])<=1,(w,h,r,q)
    # The plaque centers on source x512 / y617 of the counter, not the HUD.
    if w<h:
     center=(r['left']+r['right'])/2
     assert abs(center-w/2)<2,(w,h,d)
     assert abs(r['top']-570*d['scale'])<1,(w,h,d)
   sign_fit()
   assert page.evaluate("({...state,display:Object.fromEntries(Object.entries(state.display).filter(([,n])=>n>0))})")==before
   if w==428 and h==746:page.screenshot(path='/tmp/counter-sign-final.png')
   page.get_by_role('button',name='Carrots seeds',exact=True).tap();assert 'Carrots Seeds' in page.locator('.dialog').inner_text()
   page.get_by_role('button',name='Close ✕',exact=True).tap()
   page.evaluate("document.querySelector('#app').scrollTop=0")
   sign_fit();assert page.evaluate("({...state,display:Object.fromEntries(Object.entries(state.display).filter(([,n])=>n>0))})")==before
   # Source-space attachment survives a toolbar-height change.
   if h>530:
    page.evaluate("()=>{Object.defineProperty(visualViewport,'height',{configurable:true,get:()=>innerHeight-35});visualViewport.dispatchEvent(new Event('resize'))}")
    sign_fit()
   page.reload();page.get_by_role('button',name='Seed & Feed',exact=True).tap();sign_fit()
   assert page.evaluate("({...state,display:Object.fromEntries(Object.entries(state.display).filter(([,n])=>n>0))})")==before
   assert not errors,errors
   page.close();print(f'PASS four-season title, attached counter plaque, touch/navigation and saves {w}x{h}',flush=True)
  browser.close()
finally:s.shutdown()
