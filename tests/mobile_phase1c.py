"""Touch-only bag/refill/register/report tests, isolated from real players' saves."""
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
   page.set_default_timeout(5000);errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(os.environ.get('PREVIEW_URL',f'http://127.0.0.1:{server.server_port}/'))
   def tap(name):page.get_by_role('button',name=name,exact=True).tap()
   def modalTap(name):page.locator('.dialog').get_by_role('button',name=name,exact=True).tap()
   def row(label):return page.locator('.accounting-report tr').filter(has=page.get_by_role('rowheader',name=label,exact=True)).inner_text()
   # Simulate an existing saved bag pack; migrate once and leave money/goals unchanged.
   page.evaluate('''()=>{let old=Game.initial();old.cash=23;old.goal=4;old.owned.bags=1;delete old.bagCount;delete old.rentalBagsRemaining;localStorage.setItem('mgg10',JSON.stringify(old));}''')
   page.reload();assert page.evaluate('[state.bagCount,state.cash,state.goal]')==[10,23,4]
   page.reload();assert page.evaluate('state.bagCount')==10
   page.evaluate('''()=>{state=Game.initial();state.inventory={beans:20};state.display={beans:20};state.owned.scale=1;state.owned.table=1;state.standMode='owned';go('market');}''')
   # Sticky touch hover no longer exposes labels or dotted produce selection frames.
   assert page.locator('.market-scene .spot[title],.market-scene .spot .tip').count()==0
   page.locator('.market-scene .spot').nth(1).hover()
   assert page.locator('.market-scene .spot').nth(1).evaluate('(e)=>getComputedStyle(e).outlineStyle')=='none'
   tap('Arrange Produce / Open Market')
   assert 'Paper bags remaining: 0' in page.locator('.dialog').inner_text()
   tap('Open market');tap('Welcome Next Customer');tap('Hi! What can I get for you?');tap('🧺 Fill customer basket')
   page.locator('.produce-choices button[aria-label^="Add " ]').first.tap();page.locator('#total-answer').fill('4');tap('⚖️ Check total / collect payment')
   assert page.evaluate('state.step')=='pay'
   tap('💵 Count change')
   before=page.evaluate('JSON.stringify([state.customer,state.basket,state.visitors,state.hour,state.step])')
   modalTap('Buy more bags');tap('Buy 10 bags · $3')
   assert page.evaluate('JSON.stringify([state.customer,state.basket,state.visitors,state.hour,state.step])')==before
   assert page.evaluate('[state.cash,state.bagCount]')==[47,10]
   assert 'Paper bags remaining: 10' in page.locator('.dialog').inner_text()
   # Refresh returns to the same customer/order rather than discarding progress.
   page.reload();assert page.evaluate('state.step')=='pay'
   tap('💵 Count change')
   assert page.locator('.money-piece').count()==8
   for label in ['$1','$5','$10','$20','1¢','5¢','10¢','25¢']:
    piece=page.get_by_role('button',name=label,exact=True)
    assert piece.locator('svg').count()==1
    box=piece.bounding_box();assert box['width']>=44 and box['height']>=44
    assert label in piece.locator('svg').text_content()
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   page.screenshot(path=f'/tmp/phase1c-money-{width}.png')
   # Wrong change must never consume stock, cash, or a bag.
   tap('$5');tap('Give change');assert 'Count back the exact change' in page.locator('.dialog').inner_text()
   assert page.evaluate('[state.bagCount,state.inventory.beans,state.customersServed]')==[10,20,0]
   modalTap('Close ✕');tap('💵 Count change');tap('Start over')
   # A real touch sequence using all four coin denominations totals exactly $1.
   for label in ['25¢','25¢','25¢','10¢','5¢','5¢','1¢','1¢','1¢','1¢','1¢']:
    piece=page.get_by_role('button',name=label,exact=True);piece.scroll_into_view_if_needed()
    beforeScroll=page.locator('.dialog').evaluate('(e)=>e.scrollTop')
    piece.tap();page.wait_for_timeout(30)
    assert abs(page.locator('.dialog').evaluate('(e)=>e.scrollTop')-beforeScroll)<=2
   tap('Give change');assert page.evaluate('[state.cash,state.bagCount,state.customersServed]')==[51,9,1]
   page.reload();assert page.evaluate('[state.step,state.bagCount,state.customersServed]')==['thanks',9,1]
   tap('Thank you so much! I hope to see you again!');tap('Close market')
   assert '$4.00' in row('Total produce sales')
   assert row('Customers served').endswith('1')
   assert '−$3.00' in row('Bag purchases / daily-use bag fees')
   assert '$0.00' in row('Deferred equipment payments')
   assert '$1.00' in row('Today’s net market earnings')
   assert 'free blanket' not in page.locator('.accounting-report').inner_text().lower()
   assert 'not total farm profit' in page.locator('.accounting-report').inner_text()
   assert page.evaluate('state.cash-50')==page.evaluate('Game.accountingReport(state).net')
   assert page.locator('.accounting-report').evaluate('(e)=>e.scrollWidth<=e.clientWidth')
   page.screenshot(path=f'/tmp/phase1c-report-{width}.png')
   modalTap('Close ✕');tap('Return to garden · end day to reopen');tap('☀️ End day')
   assert page.evaluate('[state.bagCount,state.lastMarketReport.net,state.lastMarketReport.customers]')==[9,1,1]
   page.reload();assert page.evaluate('state.bagCount')==9
   # Empty bag stock offers a refill at completion and keeps counted change.
   page.evaluate('''()=>{state=Game.initial();state.inventory.corn=3;state.display.corn=3;go('market');}''')
   tap('Arrange Produce / Open Market');tap('Open market');tap('Welcome Next Customer');tap('Hi! What can I get for you?');tap('🧺 Fill customer basket');page.locator('.produce-choices button[aria-label^="Add " ]').first.tap()
   page.locator('#total-answer').fill('3');tap('⚖️ Check total / collect payment');tap('💵 Count change');tap('$1');tap('$1');tap('Give change')
   assert page.evaluate('[state.sales,state.bagCount]')==[0,0]
   tap('Buy 10 bags · $3');tap('Give change')
   assert page.evaluate('[state.cash,state.bagCount,state.customersServed]')==[50,9,1]
   assert not errors,errors
   page.close()
  browser.close()
  print('PASS: Phase 1C at 390×844 and 320×568 — legacy saves, no market hover labels, bag refill with live customer, refresh, illustrated/touch-sized money, exact coin/bill change, scroll retention, one-bag sale, cash-matched report, saved leftovers and bag refill at checkout')
finally:server.shutdown()
