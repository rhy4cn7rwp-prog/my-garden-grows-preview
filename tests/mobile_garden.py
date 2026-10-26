"""Real touch Garden controls on isolated farms; Chromium, not native Safari."""
import os
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)));Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  for w,h,top,bottom in [(320,440,20,0),(375,548,20,0),(428,746,47,34)]:
   page=browser.new_page(viewport={'width':w,'height':h},is_mobile=True,has_touch=True,ignore_https_errors=bool(os.environ.get('PREVIEW_URL')))
   page.set_default_timeout(7000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.add_init_script("document.addEventListener('DOMContentLoaded',()=>{document.documentElement.style.setProperty('--viewport-safe-top','"+str(top)+"px');document.documentElement.style.setProperty('--viewport-safe-bottom','"+str(bottom)+"px');syncGameViewport()})")
   page.goto(os.environ.get('PREVIEW_URL',f'http://127.0.0.1:{server.server_port}/'))
   def tap(name):page.get_by_role('button',name=name,exact=True).tap()
   def setup():page.evaluate("()=>{state=Game.initial();state.seeds.carrot=8;state.seeds.beans=3;state.plots=Array.from({length:25},(_,i)=>{const c=CROPS[i%CROPS.length];return {id:c.id,age:i%3===0?c.days:0,left:c.repeat,quality:100,watered:false}});go('garden')}")
   setup()
   page.wait_for_function("[...document.querySelectorAll('.garden-ripe-art image')].every(i=>i.href.baseVal)")
   page.wait_for_timeout(150)
   assert page.locator('[data-garden-plot]').count()==25
   assert page.locator('.hud').count()==1
   assert page.locator('.calendar').inner_text()=='Season 1 · Day 1'
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   for plot in page.locator('[data-garden-plot]').all():
    q=plot.bounding_box();assert q['width']>=44 and q['height']>=44,(w,h,q)
   for label in ['End Day','Water All','Harvest All Ready Crops']:
    q=page.get_by_role('button',name=label,exact=True).bounding_box();assert q['height']>=44 and q['y']+q['height']<=h-bottom+1,(w,h,label,q)
   if w==428:page.screenshot(path='/tmp/phase8-garden.png')
   # Real watering-can drag to a growing plant. Capture the same data object.
   can=page.get_by_role('button',name='Watering can',exact=True).bounding_box();plant=page.locator('[data-garden-plot="1"]').bounding_box()
   session=page.context.new_cdp_session(page)
   def touch(kind,x=0,y=0):session.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':[] if kind in ['touchEnd','touchCancel'] else [{'x':x,'y':y}]})
   def drag(start,end):
    x,y=start['x']+start['width']/2,start['y']+start['height']/2
    tx,ty=end['x']+end['width']/2,end['y']+end['height']/2
    touch('touchStart',x,y)
    for i in range(1,9):touch('touchMove',x+(tx-x)*i/8,y+(ty-y)*i/8);page.wait_for_timeout(15)
    touch('touchEnd');page.wait_for_timeout(450)
   before=page.evaluate('JSON.stringify(state.plots[1])')
   drag(can,plant)
   assert page.evaluate('state.plots[1].watered') is True
   assert page.evaluate('state.plots[1].age')==0
   assert page.locator('[data-garden-plot="1"]').get_attribute('class').find('is-watered')>=0
   # Tap alternative and repeated watering must not add growth or money.
   tap('Watering can');page.locator('[data-garden-plot="1"]').tap()
   assert 'already watered' in page.locator('.garden-heading output').inner_text()
   assert page.evaluate('state.plots[1].age')==0
   if w==428:page.screenshot(path='/tmp/phase8-garden-watered.png')
   tap('Plant / Inspect')
   # Harvest by real drag into the visible basket, not a direct rule call.
   ripe=page.locator('[data-garden-plot="0"]').bounding_box();basket=page.get_by_role('button',name='Harvest basket',exact=True).bounding_box()
   expected=page.evaluate('Game.harvestAmount(state,0)');drag(ripe,basket)
   assert page.evaluate('state.inventory.carrot')==expected
   assert page.evaluate('state.plots[0]') is None
   assert str(expected) in page.locator('.garden-heading output').inner_text()
   # Lower rows remain usable after scrolling: the tools/basket stay visible.
   page.locator('[data-garden-plot="24"]').scroll_into_view_if_needed()
   lower=page.locator('[data-garden-plot="24"]').bounding_box();basket=page.get_by_role('button',name='Harvest basket',exact=True).bounding_box()
   assert basket['y']>=top and basket['y']+basket['height']<=h-bottom,(w,h,lower,basket)
   lower_id=page.evaluate('state.plots[24].id');lower_amount=page.evaluate('Game.harvestAmount(state,24)');drag(lower,basket)
   assert page.evaluate('id=>state.inventory[id]',lower_id)==lower_amount
   page.locator('[data-garden-plot="0"]').scroll_into_view_if_needed()
   # Dropping the can on an empty plot changes no plants, stock or money.
   unchanged=page.evaluate('JSON.stringify(state)');can=page.get_by_role('button',name='Watering can',exact=True).bounding_box();empty=page.locator('[data-garden-plot="0"]').bounding_box();drag(can,empty);assert page.evaluate('JSON.stringify(state)')==unchanged
   # Existing empty-plot planting menu and reservation counts stay intact.
   page.locator('[data-garden-plot="0"]').tap();tap('🥕 Carrot Seeds (8 available)')
   assert page.evaluate('state.plan[0]')=='carrot'
   assert page.evaluate('state.seeds.carrot')==8
   tap('Plant Plan (1)');assert page.evaluate('state.seeds.carrot')==7
   assert page.evaluate('state.plots[0].watered') is True
   # Dry plants require confirmation; cancel does not move time or lose stock.
   prior=page.evaluate('JSON.stringify(state)');tap('End Day')
   assert page.locator('.dialog h2').inner_text()=='Some plants need water!'
   tap('Keep gardening');assert page.evaluate('JSON.stringify(state)')==prior
   tap('Water All');assert page.evaluate('state.plots.filter(Boolean).every(p=>p.watered)')
   ages=page.evaluate('state.plots.map(p=>p?.age)');tap('End Day')
   assert page.evaluate('Game.farmDay(state)')==2
   assert page.evaluate('state.plots[0].age')==1
   # Repeat harvest via original crop-info popup, then bulk shortcut, exactly once.
   page.evaluate("()=>{state.plots[2].age=crop('beans').days;state.plots[2].watered=true;render()}")
   page.locator('[data-garden-plot="2"]').tap();tap('🧺 Harvest')
   assert page.evaluate('state.inventory.beans')==page.evaluate("crop('beans').yield")
   assert page.evaluate('state.plots[2].age')==0 and page.evaluate('state.plots[2].watered') is False
   left=page.evaluate('state.plots[2].left');tap('End Day');tap('Water All and End Day');assert page.evaluate('state.plots[2].age')==1
   tap('Harvest All Ready Crops')
   assert page.evaluate('state.plots[2].left')==left
   stock=page.evaluate('JSON.stringify(state.inventory)');tap('Harvest All Ready Crops');assert page.evaluate('JSON.stringify(state.inventory)')==stock
   saved=page.evaluate('JSON.stringify(state)');page.reload()
   assert page.evaluate('(s)=>JSON.stringify(state)===JSON.stringify(Game.recover(s))',saved)
   tap('Go to Town');page.evaluate("go('garden')")
   # Continuous day label across the old seasonal boundary, without clearing crops.
   page.evaluate('''()=>{state.day=20;state.season=2;Game.water(state);render()}''')
   seeds=page.evaluate('JSON.stringify(state.seeds)');stock=page.evaluate('JSON.stringify(state.inventory)')
   tap('End Day');assert page.evaluate('Game.farmDay(state)')==41
   assert page.locator('.calendar').inner_text()=='Season 3 · Day 41'
   assert page.evaluate('JSON.stringify(state.seeds)')==seeds and page.evaluate('JSON.stringify(state.inventory)')==stock
   # Moving Safari toolbars resize controls, never crops or farming time.
   stable=page.evaluate('JSON.stringify(state)')
   for visible in [h-50,h]:
    page.evaluate("h=>{Object.defineProperty(visualViewport,'height',{configurable:true,get:()=>h});visualViewport.dispatchEvent(new Event('resize'))}",visible)
    end=page.get_by_role('button',name='End Day',exact=True).bounding_box();assert end['y']+end['height']<=visible-bottom+1
    assert page.evaluate('JSON.stringify(state)')==stable
   # Ending a farming day cannot discard an unfinished customer transaction.
   page.evaluate("()=>{state.inventory.corn=state.display.corn=10;state.bagCount=4;Game.openMarket(state);Game.newCustomer(state,'Noah');Game.pauseMarketClock(state);marketAwaitingResume=true;render()}")
   pending=page.evaluate('[state.customer,state.basket,state.cash,state.inventory,state.day,state.season]');tap('End Day')
   assert page.locator('.dialog h2').inner_text()=='Your customer is waiting'
   tap('Close ✕');assert page.evaluate('[state.customer,state.basket,state.cash,state.inventory,state.day,state.season]')==pending
   # Reduced motion keeps feedback and controls without falling-water animation.
   page.emulate_media(reduced_motion='reduce');tap('Watering can');page.locator('[data-garden-plot="2"]').scroll_into_view_if_needed();page.locator('[data-garden-plot="2"]').tap()
   assert page.evaluate('state.plots[2].watered') is True
   assert not errors,errors
   print(f'PASS 25 accessible plots, actual can/harvest drags, tap watering, plan/crop info, bulk actions, guarded days, repeats, continuous calendar and save recovery {w}x{h}',flush=True)
   page.close()
  browser.close()
finally:server.shutdown()
