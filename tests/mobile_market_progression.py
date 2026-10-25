"""Touch checkout at each milestone with real generated orders, decimal prices and large tenders."""
import os
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
from market_ui_helpers import enter_total, solve_lines
root=Path(__file__).resolve().parents[1]
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)));Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  for w,h in [(320,440),(375,548),(428,746)]:
   page=browser.new_page(viewport={'width':w,'height':h},is_mobile=True,has_touch=True,ignore_https_errors=bool(os.environ.get('PREVIEW_URL')))
   page.set_default_timeout(6000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(os.environ.get('PREVIEW_URL',f'http://127.0.0.1:{server.server_port}/'))
   def tap(label):page.get_by_role('button',name=label,exact=True).tap()
   for count in [0,2,4,6,8,10]:
    page.evaluate('''count=>{state=Game.initial();state.dreamPurchaseCount=count;state.bagCount=5;state.owned.scale=state.owned.table=1;for(const c of CROPS)state.inventory[c.id]=state.display[c.id]=50;Game.openMarket(state);state.visitors=count>=10?7:count>=8?3:1;Game.newCustomer(state,'Oliver');go('market')}''',count)
    assert page.locator('.market-conversation').count()==0
    tap('Hi! What can I get for you?');tap('🧺 Fill customer basket')
    want=page.evaluate('Object.entries(state.customer.want).map(([id,n])=>[crop(id).name,n])')
    for name,n in want:
     for _ in range(n):tap('Add '+name)
    tap('Check basket');tap('Calculate total')
    actual=page.evaluate('Object.entries(state.basket).map(([id,n])=>`${n} × ${money(Game.marketPrice(state,id))} = ${Game.requiresLineMath(state)?"?":money(n*Game.marketPrice(state,id))}`)')
    for line in actual:assert line in page.locator('.total-keypad-order').inner_text()
    assert 'Total: $?' in page.locator('.total-keypad-order').inner_text()
    assert page.locator('.total-keypad-dialog').evaluate('e=>e.scrollHeight<=e.clientHeight+1')
    for button in page.locator('.total-keypad-keys button').all():
     q=button.bounding_box();assert q['height']>=44 and q['y']+q['height']<=h+1,(w,h,q)
    page.screenshot(path='/tmp/market-math-current.png')
    if h>=548:
     assert page.locator('.total-keypad-order').evaluate('e=>e.scrollHeight<=e.clientHeight+1'),(w,h,count,page.locator('.total-keypad-order').evaluate('e=>({text:e.innerText,scroll:e.scrollHeight,height:e.clientHeight})'))
    if w==428:page.screenshot(path=f'/tmp/market-math-tier-{count}.png')
    solve_lines(page)
    total=page.evaluate('Game.totalOrder(state)')
    enter_total(page,str(total+.01));tap('Confirm total');assert page.evaluate('state.step')=='choose'
    enter_total(page,str(total));tap('Confirm total')
    cash=page.evaluate('state.cash');payment=page.evaluate('state.tendered')
    page.reload();assert page.evaluate('Game.totalOrder(state)')==total
    tap('💵 Count change')
    assert page.locator('.register-dialog').evaluate('e=>e.scrollHeight<=e.clientHeight+1')
    change=round((payment-total)*100)
    for cents,label in [(2000,'$20'),(1000,'$10'),(500,'$5'),(100,'$1'),(25,'25¢'),(10,'10¢'),(5,'5¢'),(1,'1¢')]:
     while change>=cents:tap(label);change-=cents
    # Crossing closing time cannot interrupt a paying customer.
    page.evaluate('()=>{Game.pauseMarketClock(state);state.marketElapsedMs=1200000;tickMarketClock()}')
    assert page.locator('.register-dialog').is_visible()
    tap('Give change');assert page.evaluate('[state.cash,state.bagCount]')==[cash+total,4]
    tap('Thanks for shopping with us!')
    page.get_by_role('heading',name='The Market Has Closed!',exact=True).wait_for()
    assert "It's 1:00 PM!" in page.locator('.dialog').inner_text()
    if w==428:page.screenshot(path='/tmp/market-closing-announcement.png')
    tap('View Daily Market Report');assert page.locator('.accounting-report').is_visible()
    assert page.evaluate('Game.accountingReport(state).sales')==total
    tap('Close ✕')
   assert not errors,errors
   page.close();print(f'PASS six math tiers, real stock, retries, decimal totals, $100 tender, change, refresh, closing/report {w}x{h}',flush=True)
  browser.close()
finally:server.shutdown()
