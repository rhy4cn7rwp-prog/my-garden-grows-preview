"""Real illustrated seed merchandise, mixed basket, exact payments and saved inventory.
Mobile Chromium touch automation; physical iPhone Safari remains a manual check.
"""
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
  for width,height,top,bottom in [(320,360,0,0),(320,440,20,0),(375,548,20,0),(390,664,47,34),(428,746,47,34),(428,892,47,34),(667,320,0,21)]:
   page=browser.new_page(viewport={'width':width,'height':height},is_mobile=True,has_touch=True,ignore_https_errors=bool(os.environ.get('PREVIEW_URL')))
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.set_default_timeout(6000)
   page.add_init_script("document.addEventListener('DOMContentLoaded',()=>{document.documentElement.style.setProperty('--viewport-safe-top','"+str(top)+"px');document.documentElement.style.setProperty('--viewport-safe-bottom','"+str(bottom)+"px');syncGameViewport();});")
   page.goto(os.environ.get('PREVIEW_URL',f'http://127.0.0.1:{server.server_port}/'))
   page.evaluate("([t,b])=>{document.documentElement.style.setProperty('--viewport-safe-top',t+'px');document.documentElement.style.setProperty('--viewport-safe-bottom',b+'px');syncGameViewport();go('seeds')}",[top,bottom])
   page.wait_for_function("document.querySelector('.seed-shop-interior')?.naturalWidth>0")
   def tap(name):page.get_by_role('button',name=name,exact=True).tap()
   def fit():
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth && document.documentElement.scrollHeight<=innerHeight+1')
    available=page.evaluate('visualViewport.height')
    data=page.evaluate("[...document.querySelectorAll('.seed-shop-game button')].map(e=>({name:e.getAttribute('aria-label')||e.textContent,...e.getBoundingClientRect().toJSON()}))")
    compact=width<height and available<548
    for b in data:
     assert b['width']>=44 and b['height']>=44,(width,height,b)
     assert b['left']>=-1 and b['right']<=width+1,(width,height,b)
     if not compact or b['name'] in ['Back to village','Clubhouse','View seed basket']:
      assert b['top']>=top-1 and b['bottom']<=available-bottom+1,(width,height,b)
    assert page.locator('.spot').count()==0 and page.locator('.seed-packet').count()==10
    assert page.locator('[aria-label="Money balance"]').count()==1
    if compact:return
    for e in page.locator('.seed-packet-price').all():
     assert e.bounding_box()['y']+e.bounding_box()['height']<=page.locator('.seed-shop-bottom').bounding_box()['y']+1,(width,height,'price hidden')
   fit();before=page.evaluate("({...state,cart:null,seeds:null,cash:null,display:Object.fromEntries(Object.entries(state.display).filter(([,n])=>n>0))})")
   crops=page.evaluate('CROPS')
   for c in crops:
    if width<height and height<=530:
     page.locator('[data-seed='+c['id']+']').evaluate("e=>{const app=document.querySelector('#app'),top=document.querySelector('.hud').getBoundingClientRect().bottom;app.scrollTop+=e.getBoundingClientRect().top-top-12}")
    target=page.locator('[data-seed='+c['id']+'] .seed-produce-art').bounding_box()
    assert target and target['height']>5
    page.touchscreen.tap(target['x']+target['width']/2,target['y']+target['height']/2)
    assert c['name']+' Seeds' in page.locator('.dialog h2').inner_text()
    assert f"${c['seed']:.2f} per packet" in page.locator('.dialog').inner_text()
    assert f"${c['price']:.2f}" in page.locator('.dialog').inner_text()
    tap('+');assert page.evaluate('id=>state.cart[id]',c['id'])==1;tap('Close ✕')
    if c['id']=='beans':
     pending=page.evaluate('state.cart');page.reload();tap('Seed & Feed');assert page.evaluate('state.cart')==pending
   assert page.evaluate('state.cash')==50 and page.evaluate('state.seeds')=={}
   tap('Variety bundle · $11.00 Fixed assortment · save $1.00')
   assert '3 carrots, 2 onions, 2 green beans, 1 strawberry' in page.locator('.dialog').inner_text()
   assert 'cannot be customized' in page.locator('.dialog').inner_text()
   plus=page.get_by_role('button',name='+',exact=True);plus.scroll_into_view_if_needed()
   scroll=page.locator('.seed-detail-body').evaluate('(e)=>e.scrollTop');page.locator('.dialog').evaluate("e=>e.dataset.kept='yes'")
   tap('+');assert page.locator('.dialog').get_attribute('data-kept')=='yes'
   assert abs(page.locator('.seed-detail-body').evaluate('(e)=>e.scrollTop')-scroll)<2
   tap('View basket');assert 'Total: $29.00' in page.locator('.dialog').inner_text()
   # Basket edits retain the basket, and can be reversed without spending money.
   page.get_by_role('button',name='Remove one Onions',exact=True).tap();assert page.evaluate('state.cart.onion')==0
   page.evaluate("seedShopBasketChange('onion',1)");assert 'Total: $29.00' in page.locator('.dialog').inner_text()
   tap('Pay at checkout');assert 'You paid $29.00' in page.locator('.dialog').inner_text()
   assert 'Your balance is $21.00' in page.locator('.dialog').inner_text()
   assert 'Carrots: 4 packets purchased' in page.locator('.dialog').inner_text()
   expected={c['id']:1+page.evaluate('id=>Game.bundle[id]||0',c['id']) for c in crops}
   assert page.evaluate('state.seeds')==expected and page.evaluate('state.cash')==21
   assert page.evaluate('state.cart')=={}
   tap('Back to the shelves');fit()
   if width==428 and height==746:page.screenshot(path='/tmp/seed-shop-final.png')
   page.reload();tap('Seed & Feed');fit();assert page.evaluate('state.seeds')==expected and page.evaluate('state.cash')==21
   after=page.evaluate("({...state,cart:null,seeds:null,cash:null,display:Object.fromEntries(Object.entries(state.display).filter(([,n])=>n>0))})")
   assert after==before,(width,height,'other gameplay changed')
   # Over-budget and empty checkout are visibly disabled, inventory unchanged.
   page.evaluate("()=>{state.cart={strawberry:100};cart('seeds')}")
   assert page.get_by_role('button',name='Pay at checkout',exact=True).is_disabled()
   assert 'over your balance' in page.locator('.dialog').inner_text()
   tap('Close ✕');assert page.evaluate('state.cash')==21 and page.evaluate('state.seeds')==expected
   page.evaluate("()=>{state.cart={};cart('seeds')}");assert page.get_by_role('button',name='Pay at checkout',exact=True).is_disabled();tap('Close ✕')
   # Same-origin backups recover the existing farm; opening/closing shops preserves it.
   page.evaluate("()=>{localStorage.setItem('mgg10','{bad')}");page.reload();tap('Seed & Feed')
   assert page.evaluate('state.seeds')==expected and page.evaluate('state.cash')==21
   page.evaluate("()=>{Object.defineProperty(visualViewport,'height',{configurable:true,get:()=>innerHeight-35});visualViewport.dispatchEvent(new Event('resize'))}");fit()
   assert not errors,errors
   page.close();print(f'PASS Seed & Feed touch purchases, bundle, exact receipt, saves and layout {width}x{height}',flush=True)
  browser.close()
finally:server.shutdown()
