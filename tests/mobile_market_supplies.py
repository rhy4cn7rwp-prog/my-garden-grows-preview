"""New market supplies, existing equipment, safe phone layout, recovery and cash ledger.
Isolated Chromium touch contexts, not native iPhone Safari verification.
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
  for w,h,t,b in [(320,360,0,0),(320,440,20,0),(375,548,20,0),(390,664,47,34),(428,746,47,34),(428,892,47,34),(667,320,0,21)]:
   page=browser.new_page(viewport={'width':w,'height':h},is_mobile=True,has_touch=True,ignore_https_errors=bool(os.environ.get('PREVIEW_URL')))
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.set_default_timeout(6000)
   page.add_init_script("document.addEventListener('DOMContentLoaded',()=>{document.documentElement.style.setProperty('--viewport-safe-top','"+str(t)+"px');document.documentElement.style.setProperty('--viewport-safe-bottom','"+str(b)+"px');syncGameViewport();});")
   page.goto(os.environ.get('PREVIEW_URL',f'http://127.0.0.1:{server.server_port}/'))
   def tap(name):page.get_by_role('button',name=name,exact=True).tap()
   page.evaluate("()=>{state=Game.initial();go('town')}");tap('Market Supplies');page.wait_for_function("document.querySelector('.supply-shop-interior')?.naturalWidth>0")
   def baseline():return page.evaluate("Object.fromEntries(Object.entries(state).filter(([k])=>!['cash','marketSupplyCart','marketSupplyStock','marketExpenses','bagCount'].includes(k)).map(([k,v])=>[k,k==='display'?Object.fromEntries(Object.entries(v).filter(([,n])=>n>0)):v]))")
   before=baseline()
   def fit():
    assert page.locator('.supply-packet').count()==5 and page.locator('.spot').count()==0
    assert page.locator('[aria-label="Money balance"]').count()==1
    assert page.locator('.supply-shelf').count()==0
    assert page.locator('.supply-table-products [data-market-product]').count()==4
    assert page.locator('.supply-display > [data-market-product=sign]').count()==1
    assert page.locator('.supply-table-art').evaluate('e=>e.complete&&e.naturalWidth>0')
    assert page.locator('.supply-display .supply-aframe-art').evaluate('e=>e.complete&&e.naturalWidth>0')
    for label in page.locator('.supply-packet-name').all():
     assert label.evaluate("e=>e.scrollWidth<=e.clientWidth+1&&e.scrollHeight<=e.clientHeight+1&&parseInt(getComputedStyle(e.parentElement).zIndex)>=1"),label.evaluate("e=>({text:e.textContent,sw:e.scrollWidth,cw:e.clientWidth,sh:e.scrollHeight,ch:e.clientHeight,z:getComputedStyle(e.parentElement).zIndex})")
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth && document.documentElement.scrollHeight<=innerHeight+1')
    assert page.evaluate("document.querySelector('#app').scrollWidth<=innerWidth+1")
    for e in page.locator('.supply-shop-game button').all():
     q=e.bounding_box();assert q['width']>=44 and q['height']>=44,(w,h,q)
     assert q['x']>=-1 and q['x']+q['width']<=w+1,(w,h,q)
   fit()
   if w==428 and h==746:page.screenshot(path='/tmp/market-supplies-final.png')
   def product(id):
    loc=page.locator('[data-market-product='+id+']')
    if w<h and h<548:loc.evaluate("e=>{const a=document.querySelector('#app');a.scrollTop+=e.getBoundingClientRect().top-document.querySelector('.hud').getBoundingClientRect().bottom-12}")
    loc.tap()
   product('bags');assert '20¢ each' in page.locator('.dialog').inner_text() and '15¢ each' in page.locator('.dialog').inner_text()
   tap('Add 5 paper produce bags');assert page.evaluate('state.marketSupplyCart.bags5')==1
   tap('Close ✕');pending=page.evaluate('state.marketSupplyCart');page.reload();tap('Go to Town');tap('Market Supplies');assert page.evaluate('state.marketSupplyCart')==pending
   product('bags');add=page.get_by_role('button',name='Add 20 paper produce bags',exact=True);add.scroll_into_view_if_needed();scroll=page.locator('.supply-detail-body').evaluate('e=>e.scrollTop');page.locator('.dialog').evaluate("e=>e.dataset.kept='yes'");add.tap()
   assert page.locator('.dialog').get_attribute('data-kept')=='yes'
   assert abs(page.locator('.supply-detail-body').evaluate('e=>e.scrollTop')-scroll)<2
   assert 'Save $1' in page.locator('.dialog').inner_text();tap('Close ✕')
   for id,name,n in [('boxes','5 cardboard produce boxes',1),('tags','10 price tags',2),('sign','Market sign',1),('basket','Produce basket',2)]:
    product(id)
    for _ in range(n):tap('Add '+name)
    tap('Close ✕')
   assert page.evaluate('state.cash')==50 and page.evaluate('state.bagCount')==0
   tap('Supply basket');assert 'Total: $27.00' in page.locator('.dialog').inner_text();tap('Buy supplies')
   assert 'You paid $27.00' in page.locator('.dialog').inner_text() and 'Money remaining: $23.00' in page.locator('.dialog').inner_text()
   assert page.evaluate('state.bagCount')==25
   expected={'consumables':{'boxes':5,'priceTags':20},'reusable':{'marketSigns':1,'produceBaskets':2}}
   assert page.evaluate('state.marketSupplyStock')==expected and page.evaluate('state.cash')==23
   assert page.evaluate('state.marketExpenses.reduce((n,e)=>n+e.cents,0)')==2700
   assert baseline()==before
   tap('See my supplies');text=page.locator('.dialog').inner_text();assert all(v in text for v in ['Consumables','Reusable supplies','25','20','2','optional for selling'])
   tap('Close ✕');page.reload();tap('Go to Town');tap('Market Supplies');fit()
   assert page.evaluate('state.marketSupplyStock')==expected and page.evaluate('[state.bagCount,state.cash]')==[25,23]
   # Original supply/equipment checkout and rentals remain accessible.
   tap('Equipment & rentals');tap('Wooden market table · $8.00');assert '$8.00' in page.locator('.dialog').inner_text();tap('Close ✕')
   tap('Equipment & rentals');tap('Daily equipment rentals');assert page.locator('.dialog h2').inner_text()=='Daily equipment rentals';tap('Close ✕')
   # An earlier, unpurchased ten-bag cart remains editable rather than stranded.
   page.evaluate("()=>{state.supcart={bags:1};marketSupplyEquipment()}")
   tap('Review earlier 10-bag pack (1 in basket)');tap('−');assert page.evaluate('state.supcart.bags')==0;tap('Close ✕')
   page.evaluate('state.supcart={}')
   # Affordability is checked both in the UI and by the transaction rules.
   page.evaluate("()=>{state.marketSupplyCart={sign:100};marketSupplyBasket()}");assert page.get_by_role('button',name='Buy supplies',exact=True).is_disabled();tap('Close ✕')
   assert page.evaluate('[state.bagCount,state.cash]')==[25,23] and page.evaluate('state.marketSupplyStock')==expected
   # Paid costs appear once in the accounting report and leave balances alone.
   page.evaluate('showMarketReport()');assert '$23.00' in page.locator('.accounting-report').inner_text();assert '$4.00' in page.locator('.accounting-report').inner_text();tap('Close ✕')
   assert page.evaluate('state.cash')==23
   page.evaluate("()=>{state.marketSupplyCart={};save();localStorage.setItem('mgg10','{bad')}");page.reload();tap('Go to Town');tap('Market Supplies')
   assert page.evaluate('state.marketSupplyStock')==expected and page.evaluate('[state.bagCount,state.cash]')==[25,23]
   # Toolbar change, return navigation and all other saved farm values are stable.
   page.evaluate("()=>{Object.defineProperty(visualViewport,'height',{configurable:true,get:()=>innerHeight-35});visualViewport.dispatchEvent(new Event('resize'))}");fit()
   tap('Back to village');assert baseline()==before
   assert not errors,errors
   page.close();print(f'PASS supply packs/bulk, inventory, $27 checkout, $23 balance, recovery, equipment/rentals and layout {w}x{h}',flush=True)
  browser.close()
finally:server.shutdown()
