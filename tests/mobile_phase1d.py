"""Compact register fit, exact bag consumption, and checkout-preserving restocks."""
import os
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(root)))
Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  sizes=[(390,664),(375,548),(320,460),(320,440),(667,320)]
  for width,height in sizes:
   page=browser.new_page(viewport={'width':width,'height':height},is_mobile=True,has_touch=True,device_scale_factor=3)
   page.set_default_timeout(5000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(os.environ.get('PREVIEW_URL',f'http://127.0.0.1:{server.server_port}/'))
   page.evaluate('''()=>{state=Game.initial();state.bagCount=1;state.inventory={corn:3,onion:3};state.display={corn:3,onion:3};state.marketOpen=true;state.marketPlayed=true;state.customer={name:'Isabella',want:{corn:2,onion:1}};state.basket={corn:2,onion:1};state.step='choose';Game.ring(state,8);go('market');payment();}''')
   def tap(name):page.get_by_role('button',name=name,exact=True).tap()
   def fits():
    page.wait_for_function("getComputedStyle(document.documentElement).getPropertyValue('--visible-height').trim() === visualViewport.height + 'px'")
    data=page.locator('.register-dialog').evaluate('''e=>({scroll:e.scrollHeight,height:e.clientHeight,rect:e.getBoundingClientRect().toJSON(),viewport:visualViewport.height,buttons:[...e.querySelectorAll('button')].map(b=>({name:b.getAttribute('aria-label')||b.textContent.trim(),...b.getBoundingClientRect().toJSON()})),count:e.querySelector('.register-count').getBoundingClientRect().toJSON(),bags:e.querySelector('.register-bags').getBoundingClientRect().toJSON(),actions:e.querySelector('.register-actions').getBoundingClientRect().toJSON()})''')
    assert data['scroll']<=data['height']+1,(width,height,data)
    assert data['rect']['top']>=0 and data['rect']['bottom']<=data['viewport']+1,data
    for b in data['buttons']:
     assert b['width']>=44 and b['height']>=44,(width,height,b)
     assert b['top']>=0 and b['bottom']<=data['viewport']+1,(width,height,b)
     assert b['left']>=0 and b['right']<=width+1,(width,height,b)
    assert data['count']['bottom']<=data['bags']['top']+1 and data['bags']['bottom']<=data['actions']['top']+1,data
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   fits()
   if width==390:
    page.set_viewport_size({'width':390,'height':440});fits()
    page.set_viewport_size({'width':width,'height':height});fits()
   if width==375:
    page.set_viewport_size({'width':375,'height':500})
    page.locator('.register-modal').evaluate("e=>{e.style.setProperty('--register-safe-top','47px');e.style.setProperty('--register-safe-bottom','34px');}")
    fits()
    page.locator('.register-modal').evaluate("e=>{e.style.removeProperty('--register-safe-top');e.style.removeProperty('--register-safe-bottom');}")
    page.set_viewport_size({'width':width,'height':height});fits()
   page.screenshot(path=f'/tmp/phase1d-register-{width}x{height}.png')
   assert page.locator('.register-dialog .money-piece svg').count()==8
   # Complete the mixed multi-item purchase: $8 total, $10 tendered, $2 change.
   tap('$1');fits();tap('$1');tap('Give change')
   assert page.evaluate('[state.bagCount,state.customersServed,state.cash]')==[0,1,58]
   assert 'Paper bags remaining: 0' in page.locator('.bottom').inner_text()
   # Next customer with no bags can count change, replenish, and finish without losing progress.
   page.evaluate('''()=>{Game.advanceCustomer(state);state.inventory.corn=2;state.display.corn=2;Game.newCustomer(state,'Maya');state.customer.want={corn:1};Game.greet(state);state.basket={corn:1};Game.ring(state,3);render();payment();}''')
   tap('$1');tap('$1');tap('Give change')
   assert page.locator('.dialog h2').inner_text()=='Paper bag refill'
   assert page.evaluate('[state.step,state.change,state.customersServed,state.bagCount]')==['pay',2,1,0]
   customer=page.evaluate('JSON.stringify(state.customer)')
   tap('Buy 10 bags · $3')
   assert page.evaluate('JSON.stringify(state.customer)')==customer
   assert page.evaluate('[state.change,state.bagCount]')==[2,10]
   fits();tap('Give change')
   assert page.evaluate('[state.bagCount,state.customersServed,state.cash]')==[9,2,58]
   page.reload();assert page.evaluate('[state.bagCount,state.customersServed]')==[9,2]
   assert not errors,errors
   page.close()
  browser.close()
  print('PASS: register fits without scrolling at 390×664, 375×548, 320×460, 320×440 and 667×320; all targets >=44px, bags below counted change, one bag per sale, immediate counts, zero-bag refill preserves change/customer, saves retained')
finally:server.shutdown()
