"""Touch-only Phase 1E service/order/payment flow and visual-viewport regression.
Uses isolated browser storage. Set BROWSER=webkit with an installed WebKit runtime
for an additional engine check; this is not a substitute for real iPhone testing.
"""
import os
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
root = Path(__file__).resolve().parents[1]
server = ThreadingHTTPServer(('127.0.0.1', 0), partial(SimpleHTTPRequestHandler, directory=str(root)))
Thread(target=server.serve_forever, daemon=True).start()
try:
 with sync_playwright() as p:
  engine = os.environ.get('BROWSER', 'chromium')
  browser = p.webkit.launch() if engine == 'webkit' else p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
  for width, height in [(390,664),(375,500),(320,400),(320,360),(568,256)]:
   page = browser.new_page(viewport={'width':width,'height':height}, is_mobile=True, has_touch=True, device_scale_factor=3)
   page.set_default_timeout(5000)
   errors=[]; page.on('pageerror', lambda e: errors.append(str(e)))
   page.goto(os.environ.get('PREVIEW_URL', f'http://127.0.0.1:{server.server_port}/'))
   def tap(name): page.get_by_role('button', name=name, exact=True).tap()
   def baseline(): return page.evaluate('JSON.stringify([CROPS.map(c=>[state.inventory[c.id]||0,state.display[c.id]||0]),state.cash,state.bagCount,state.sales,state.marketExpenses,state.equipmentDebt])')
   def fixture(want="{carrot:2,tomato:1}", personality="curious", decision=50):
    page.evaluate('''()=>{state=Game.initial();state.bagCount=3;state.owned.table=1;state.standMode='owned';state.marketOpen=state.marketPlayed=true;
     Object.assign(state.inventory,{carrot:4,tomato:3,corn:2,cucumber:3,lettuce:2,onion:4});
     Object.assign(state.display,{carrot:3,tomato:2,corn:2,cucumber:3,lettuce:2});
     state.customer={name:'Maya',want:'''+want+''',personality:"'''+personality+'''",decision:'''+str(decision)+''',satisfaction:50,response:'arrival'};
     state.step='greet';go('market');}''')
   def fit():
    page.wait_for_function("getComputedStyle(document.documentElement).getPropertyValue('--visible-height').trim() === visualViewport.height + 'px'")
    data=page.locator('.register-dialog').evaluate('''e=>({scroll:e.scrollHeight,height:e.clientHeight,rect:e.getBoundingClientRect().toJSON(),top:visualViewport.offsetTop,bottom:visualViewport.offsetTop+visualViewport.height,buttons:[...e.querySelectorAll('button')].map(b=>({name:b.getAttribute('aria-label')||b.textContent,...b.getBoundingClientRect().toJSON()})),blocks:[...e.querySelectorAll('.register-receipt,.money-tray,.register-count,.register-bags,.register-actions')].map(b=>b.getBoundingClientRect().toJSON())})''')
    assert data['scroll'] <= data['height']+1,(width,height,data)
    assert data['rect']['top']>=data['top'] and data['rect']['bottom']<=data['bottom']+1,data
    for b in data['buttons']:
     assert b['width']>=44 and b['height']>=44,b
     assert b['top']>=data['top'] and b['bottom']<=data['bottom']+1,b
     assert b['left']>=0 and b['right']<=width+1,b
    for a,b in zip(data['blocks'],data['blocks'][1:]):
     if width<540: assert a['bottom']<=b['top']+1,(a,b)
    for i,a in enumerate(data['buttons']):
     for b in data['buttons'][i+1:]:
      assert min(a['right'],b['right'])-max(a['left'],b['left'])<=1 or min(a['bottom'],b['bottom'])-max(a['top'],b['top'])<=1,(a,b)
   fixture();before=baseline()
   assert page.locator('.customer-actions button').count()==3
   tap('Hi! Welcome to my stand! What can I help you find today?')
   assert 'lovely welcome' in page.locator('.bottom').inner_text()
   tap('🧺 Fill customer basket')
   assert page.locator('.produce-choices .basketline').count()==5
   assert page.locator('#total-answer').evaluate('e=>parseFloat(getComputedStyle(e).fontSize)')>=16
   assert page.get_by_role('button',name='Add Onions',exact=True).count()==0  # harvested but not on stand
   assert page.get_by_role('button',name='Add Green beans',exact=True).count()==0
   # Wrong vegetable; over-request quantity is allowed up to stand stock, but never deducted.
   tap('Add Corn');tap('Add Carrots');tap('Add Carrots');tap('Add Carrots');tap('Add Tomatoes')
   assert page.get_by_role('button',name='Add Carrots',exact=True).is_disabled()
   page.evaluate("basketChange('carrot',1)");assert page.evaluate('state.basket.carrot')==3
   tap('Check basket');assert 'quantities' in page.locator('.order-feedback').inner_text()
   assert baseline()==before
   page.reload();assert page.evaluate('state.basket')=={'corn':1,'carrot':3,'tomato':1}
   tap('🧺 Fill customer basket');tap('Remove Carrots');tap('Check basket')
   assert 'not on the order' in page.locator('.order-feedback').inner_text()
   page.locator('#total-answer').fill('10');tap('⚖️ Check total / collect payment')
   assert page.evaluate('state.step')=='choose';assert baseline()==before
   tap('Remove Corn');tap('Check basket');assert 'matches the order' in page.locator('.order-feedback').inner_text()
   page.locator('#total-answer').fill('8');tap('⚖️ Check total / collect payment')
   assert 'multiplying' in page.locator('.order-feedback').inner_text();assert baseline()==before
   page.locator('#total-answer').fill('7');tap('⚖️ Check total / collect payment');tap('💵 Count change');fit()
   if width==375:
    # Model Safari: layout viewport stays tall while visible toolbar space is smaller and offset.
    page.evaluate('''()=>{const v=visualViewport;Object.defineProperty(v,'height',{configurable:true,get:()=>380});Object.defineProperty(v,'offsetTop',{configurable:true,get:()=>12});v.dispatchEvent(new Event('resize'));}''')
    page.locator('.register-modal').evaluate("e=>{e.style.setProperty('--register-safe-bottom','34px');}")
    fit();page.screenshot(path='/tmp/phase1e-safari-toolbar.png')
    # Toolbar expands/collapses while the same checkout remains open.
    for available in [350,440,380]:
     page.evaluate(f"()=>{{Object.defineProperty(visualViewport,'height',{{configurable:true,get:()=>{available}}});visualViewport.dispatchEvent(new Event('resize'));}}")
     fit()
    page.locator('.register-modal').evaluate("e=>e.style.setProperty('--register-safe-top','47px')")
    for available in [480,440]:
     page.evaluate(f"()=>{{Object.defineProperty(visualViewport,'height',{{configurable:true,get:()=>{available}}});visualViewport.dispatchEvent(new Event('resize'));}}")
     fit()
    page.locator('.register-modal').evaluate("e=>e.style.removeProperty('--register-safe-top')")
    page.evaluate("()=>{delete visualViewport.height;delete visualViewport.offsetTop;visualViewport.dispatchEvent(new Event('resize'));}")
    page.locator('.register-modal').evaluate("e=>e.style.removeProperty('--register-safe-bottom')")
    fit()
   page.screenshot(path=f'/tmp/phase1e-register-{width}x{height}.png')
   tap('$1');tap('Give change');assert page.evaluate('state.step')=='pay';assert baseline()==before
   tap('Close ✕');tap('💵 Count change');tap('Start over')
   for _ in range(3):tap('$1');fit()
   tap('Give change')
   assert page.evaluate('[state.cash,state.bagCount,state.customersServed,state.inventory.carrot,state.inventory.tomato,state.inventory.corn]')==[57,2,1,2,2,2]
   paid=baseline();tap('Thank you so much! I hope to see you again!');assert baseline()==paid
   assert 'smiles' in page.locator('.bottom').inner_text();page.reload();assert page.evaluate('[state.cash,state.bagCount]')==[57,2]
   # Sold-out request, real stock alternatives, accepted substitution, full educational checkout.
   fixture('{onion:1}',decision=10);before=baseline();tap('Hi! What can I get for you?')
   page.reload();assert page.evaluate('state.customer.want')=={'onion':1}
   tap('Help with sold-out produce')
   assert page.locator('.dialog [onclick^="offerAlternative"]').count()==5
   page.locator('[onclick="offerAlternative(\'cucumber\')"]').tap()
   assert 'try that instead' in page.locator('.bottom').inner_text();assert baseline()==before
   tap('🧺 Fill customer basket');tap('Add Cucumbers');tap('Check basket')
   page.locator('#total-answer').fill('3');tap('⚖️ Check total / collect payment');tap('💵 Count change');fit();tap('$1');tap('$1');tap('Give change')
   assert page.evaluate('[state.cash,state.bagCount,state.customersServed,state.inventory.cucumber]')==[53,2,1,2]
   tap('Thanks for shopping with us!')
   # Some customers decline: no forced sale, no money, produce, or bag consumed.
   fixture('{onion:1}',personality='thoughtful',decision=99);before=baseline();tap('Hi! What can I get for you?');tap('Help with sold-out produce')
   page.locator('[onclick="offerAlternative(\'carrot\')"]').tap()
   assert 'on my list' in page.locator('.bottom').inner_text();assert page.evaluate('state.step')=='thanks'
   tap('Bye!');assert baseline()==before
   for personality,expected in [('curious','choose'),('hurried','thanks')]:
    fixture(personality=personality);before=baseline();tap('Wait quietly for the customer to ask for something.')
    assert page.evaluate('state.step')==expected;assert baseline()==before
    if expected=='choose':
     tap('Talk about the order');tap("We're sold out today, but I hope you'll visit us again!")
     assert 'come back another day' in page.locator('.bottom').inner_text()
    tap('Bye!');assert baseline()==before
   fixture('{onion:1}');before=baseline();tap('Hi! What can I get for you?');tap('Help with sold-out produce');tap("I'm sorry, we're sold out of that today.")
   assert 'letting me know' in page.locator('.bottom').inner_text();tap('Thanks for shopping with us!');assert baseline()==before
   assert not errors,errors
   page.close()
  browser.close()
  print('PASS: all-stock order selection, quantity caps, wrong basket retries/reload, totals, change, one bag, all greetings/farewells, accepted/declined alternatives and apologies; register fully visible with >=44px targets at 390x664, 375x500, 320x400, 320x360, 568x256, and simulated Safari toolbar transitions.')
finally:
 server.shutdown()
