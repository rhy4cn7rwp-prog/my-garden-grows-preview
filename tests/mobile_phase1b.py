"""Phase 1B touch/scroll/inventory/deferred-payment regression, in isolated browser saves."""
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
  for width,height in [(390,844),(320,568)]:
   page=browser.new_page(viewport={'width':width,'height':height},is_mobile=True,has_touch=True,device_scale_factor=3)
   page.set_default_timeout(5000)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(os.environ.get('PREVIEW_URL',f'http://127.0.0.1:{server.server_port}/'))
   def fixture(js):page.evaluate('()=>{state=Game.initial();'+js+';go("town");}')
   def tap(name):page.get_by_role('button',name=name,exact=True).tap()
   def repeated(locator):
    locator.scroll_into_view_if_needed()
    before=page.locator('.dialog').evaluate('(e)=>({top:e.scrollTop,window:scrollY})')
    page.locator('.dialog').evaluate('(e)=>e.dataset.kept="yes"')
    locator.tap();page.wait_for_timeout(50)
    after=page.locator('.dialog').evaluate('(e)=>({top:e.scrollTop,window:scrollY,kept:e.dataset.kept})')
    assert abs(after['top']-before['top'])<=2,(before,after)
    assert abs(after['window']-before['window'])<=2,(before,after)
    assert after['kept']=='yes'
   # Long preparation dialog reproduces the iPhone scroll bug at the bottom of inventory.
   fixture("for(const c of CROPS)state.inventory[c.id]=8")
   tap('Farmers Market');tap('Arrange Produce / Open Market')
   for _ in range(3):repeated(page.locator('[onclick="displayChange(\'radish\',1)"]'))
   repeated(page.locator('[onclick="displayChange(\'radish\',-1)"]'))
   assert page.evaluate('state.display.radish')==2
   tap('Add All Produce to Stand')
   assert 'a scale is required' in page.locator('.dialog').inner_text()
   assert page.evaluate('state.display.beans')==0
   inventory=page.evaluate('JSON.stringify(state.inventory)')
   tap('Add All Produce to Stand')
   assert 'No new produce added' in page.locator('.dialog').inner_text()
   assert page.evaluate('JSON.stringify(state.inventory)')==inventory
   tap('Close ✕');tap('Home');tap('Seed & Feed');tap('Tomatoes seeds')
   for _ in range(2):repeated(page.get_by_role('button',name='+',exact=True))
   tap('🛒 View basket');tap('Pay at checkout');tap('Close ✕')
   assert page.evaluate('state.seeds.tomato')==2
   tap('Home');tap('My Garden')
   for i,remaining in [(0,2),(1,1)]:
    page.locator('.plot').nth(i).tap()
    before=page.evaluate('scrollY')
    tap(f'🍅 Tomatoes ({remaining} available)')
    page.wait_for_timeout(50)
    assert abs(page.evaluate('scrollY')-before)<=2
   assert 'Tomatoes: 0' in page.locator('.bottom').inner_text()
   page.reload();assert page.evaluate('Game.availableSeeds(state,"tomato")')==0
   tap('My Garden');page.locator('.plot').nth(2).tap()
   assert page.get_by_role('button',name='🍅 Tomatoes (0 available)',exact=True).is_disabled()
   tap('Close ✕');tap('Cancel planting plan')
   assert page.evaluate('Game.availableSeeds(state,"tomato")')==2
   page.locator('.plot').first.tap();tap('🍅 Tomatoes (2 available)');tap('🌱 Plant plan (1)')
   assert page.evaluate('state.seeds.tomato')==1
   page.evaluate("state.plots[0].age=4;state.plots[1]={id:'carrot',age:3,left:0,quality:40,watered:false};render()")
   button=page.get_by_role('button',name='Harvest All Ready Crops',exact=True);button.scroll_into_view_if_needed()
   before=page.evaluate('scrollY');button.tap();page.wait_for_timeout(50)
   assert abs(page.evaluate('scrollY')-before)<=2
   assert page.evaluate('[state.inventory.tomato,state.inventory.carrot,state.plots[0].age]')==[11,9,0]
   tap('Harvest All Ready Crops');assert 'No crops are ready' in page.locator('.bottom').inner_text()
   # Explicitly agree to all three deferred fees, make a by-pound sale, close and carry balance.
   fixture("state.cash=0;state.inventory.beans=3;state.goal=4")
   tap('Farmers Market');tap('Arrange Produce / Open Market');tap('Rent table · $1 today')
   assert '$1.00' in page.locator('.dialog').inner_text() and '$3.00' in page.locator('.dialog').inner_text()
   assert page.evaluate('Game.debtTotal(state)')==0
   tap('Agree to $3.00 after market');tap('Review scale rental');tap('Agree to $2.00 after market')
   tap('Review bags rental');tap('Agree to $1.00 after market')
   assert page.evaluate('Game.debtTotal(state)')==6
   tap('Close ✕');tap('Arrange Produce / Open Market');tap('Add All Produce to Stand')
   assert page.evaluate('state.display.beans')==3
   tap('Open market')
   buttons=page.locator('.bottom button').all_text_contents()
   assert buttons[0]=='Welcome Next Customer' and 'Open market' not in buttons
   tap('Welcome Next Customer');tap('😊 Welcome! What can I get you?');tap('🧺 Fill customer basket');tap('+')
   page.locator('#total-answer').fill('4');tap('⚖️ Check total / collect payment');tap('💵 Count change');tap('$1');tap('Give change');tap('👋 Thank you! Come again!')
   assert page.evaluate('state.cash')==4
   tap('Close market')
   assert 'Equipment charges paid from earnings: $4.00' in page.locator('.dialog').inner_text()
   assert page.evaluate('[state.cash,Game.debtTotal(state)]')==[0,2]
   page.reload();assert page.evaluate('[state.cash,Game.debtTotal(state),state.goal]')==[0,2,4]
   tap('My Garden');tap('☀️ End day');tap('Home');tap('Farmers Market');tap('Arrange Produce / Open Market')
   tap('Daily equipment rentals');tap('Review table rental')
   assert 'Deferred rental unavailable' in page.locator('.dialog').inner_text()
   # Limit feedback is friendly and the idle market action order remains sensible.
   fixture("state.inventory.carrot=2;state.display.carrot=2;state.marketOpen=true;state.marketPlayed=true;state.visitors=3")
   tap('Farmers Market');tap('Welcome Next Customer')
   assert 'Your blanket attracted 3 customers today!' in page.locator('.dialog').inner_text()
   assert "Let's try that again" not in page.locator('.dialog').inner_text()
   assert not errors,errors
   page.close()
  browser.close()
  print('PASS: 390×844 and 320×568 touch/scroll preservation, shopping, seed reservation/reload/cancel, harvest/display bulk actions, scale eligibility, explicit deferred rentals, checkout/settlement/carryover, friendly limits')
finally:server.shutdown()
