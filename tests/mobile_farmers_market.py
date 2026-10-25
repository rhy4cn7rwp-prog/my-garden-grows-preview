"""First-person visual scene, true inventory, touch targets and saved customer.
Chromium touch contexts simulate Safari's available viewport and safe areas;
physical iPhone Safari still requires a device playtest.
"""
import os
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)))
Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  sizes=[(320,360,0,0),(320,440,20,0),(375,548,20,0),(390,664,47,34),(428,746,47,34),(428,892,47,34),(667,320,0,21)]
  for w,h,t,b in sizes:
   page=browser.new_page(viewport={'width':w,'height':h},is_mobile=True,has_touch=True,ignore_https_errors=bool(os.environ.get('PREVIEW_URL')))
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.set_default_timeout(6000)
   page.add_init_script("document.addEventListener('DOMContentLoaded',()=>{document.documentElement.style.setProperty('--viewport-safe-top','"+str(t)+"px');document.documentElement.style.setProperty('--viewport-safe-bottom','"+str(b)+"px');syncGameViewport()})")
   page.goto(os.environ.get('PREVIEW_URL',f'http://127.0.0.1:{server.server_port}/'))
   def tap(name):page.get_by_role('button',name=name,exact=True).tap()
   tap('Farmers Market')
   assert page.locator('.market-active-customer').count()==0
   assert page.locator('.market-produce').count()==0
   tap('Open cash register');assert 'Welcome a customer' in page.locator('.dialog').inner_text();tap('Close ✕')
   page.evaluate("""()=>{state=Game.initial();state.cash=37;state.goal=2;state.bagCount=4;state.owned.table=1;state.owned.scale=1;state.standMode='owned';state.marketOpen=state.marketPlayed=true;state.visitors=1;
    for(const c of CROPS){state.inventory[c.id]=5;state.display[c.id]=3;}
    state.customer={name:'Maya',want:{carrot:2},personality:'curious',decision:50,satisfaction:50,response:'arrival',greeting:null,alternativeOffered:false};state.step='greet';render();}""")
   before=page.evaluate('state')
   assert page.locator('.market-active-customer').count()==1
   assert page.locator('.market-produce').count()==10
   assert page.locator('.farmers-market-game .spot,.farmers-market-game .tip').count()==0
   assert page.locator('[aria-label="Money balance"]').count()==1
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth && document.documentElement.scrollHeight<=innerHeight+1')
   assert page.locator('#app').evaluate('e=>e.scrollWidth<=e.clientWidth+1')
   # Real horizontal touch gesture reveals additional produce, without opening
   # a detail popup or scrolling the whole page sideways.
   tray=page.locator('.market-produce-tray');tray.scroll_into_view_if_needed()
   q=tray.bounding_box();cdp=page.context.new_cdp_session(page)
   sx=q['x']+q['width']*.85;sy=q['y']+35
   cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':sx,'y':sy}]})
   for step in range(1,7):
    cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':sx-step*q['width']*.1,'y':sy}]})
   cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
   page.wait_for_function("document.querySelector('.market-produce-tray').scrollLeft>10")
   assert page.locator('.dialog').count()==0
   assert page.locator('.market-tray-hint').is_visible()
   for product in page.locator('.market-produce').all():
    r=product.bounding_box();assert r['width']>=44 and r['height']>=44,r
    assert product.locator('.market-produce-label').evaluate('e=>e.scrollWidth<=e.clientWidth+1&&e.scrollHeight<=e.clientHeight+1')
    product.tap();assert 'On hand: 5' in page.locator('.dialog').inner_text();tap('Close ✕')
   assert page.evaluate('state')==before
   appearance=page.locator('.market-active-customer svg').first.get_attribute('viewBox')
   page.reload();assert page.evaluate('state.customer.name')=='Maya'
   assert page.locator('.market-active-customer svg').first.get_attribute('viewBox')==appearance
   assert page.evaluate('state')==before
   # Both the visible illustrated register and the existing count-change button work.
   tap('Hi! What can I get for you?');tap('🧺 Fill customer basket')
   tap('Add Carrots');tap('Add Carrots');tap('Check basket')
   page.locator('#total-answer').fill('4');tap('⚖️ Check total / collect payment')
   paid_before=page.evaluate('[state.cash,state.bagCount,state.inventory.carrot]')
   tap('Open cash register')
   register=page.locator('.register-dialog')
   assert register.evaluate('e=>e.scrollHeight<=e.clientHeight+1')
   for button in register.locator('button').all():
    r=button.bounding_box();assert r['width']>=44 and r['height']>=44,r
    assert r['x']>=0 and r['x']+r['width']<=w+1 and r['y']>=0 and r['y']+r['height']<=h+1,r
   due=page.evaluate('state.tendered-Game.totalOrder(state)')
   for _ in range(int(due)):tap('$1')
   tap('Give change')
   assert page.evaluate('[state.cash,state.bagCount,state.inventory.carrot]')==[paid_before[0]+4,paid_before[1]-1,paid_before[2]-2]
   assert page.locator('.market-active-customer').count()==1
   tap('Thanks for shopping with us!');assert page.locator('.market-active-customer').count()==0
   page.evaluate("()=>{Object.defineProperty(visualViewport,'height',{configurable:true,get:()=>innerHeight-35});visualViewport.dispatchEvent(new Event('resize'))}")
   assert page.locator('#app').evaluate('e=>e.scrollWidth<=e.clientWidth+1')
   tap('Back to village');tap('Farmers Market')
   assert page.evaluate('[state.cash,state.bagCount,state.inventory.carrot]')==[41,3,3]
   if w==428 and h==746:
    page.evaluate("()=>{delete visualViewport.height;syncGameViewport();state.customer={name:'Maya',want:{carrot:2},personality:'curious',decision:50,satisfaction:50,response:'arrival',greeting:null,alternativeOffered:false};state.step='greet';render();document.querySelector('#app').scrollTop=0}")
    page.screenshot(path='/tmp/phase4a-market-iphone.png')
   assert not errors,errors
   page.close();print(f'PASS first-person stall, 10 real crops/prices, one human, checkout/bag, reload and mobile {w}x{h}',flush=True)
  browser.close()
finally:server.shutdown()
