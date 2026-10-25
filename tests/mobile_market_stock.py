"""Stand-only stock, real sale/removal/restock, balanced displays and bubble-only farewells."""
import os
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
from market_ui_helpers import enter_total
root=Path(__file__).resolve().parents[1]
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)));Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  for w,h,t,b in [(320,360,0,0),(320,440,20,0),(375,548,20,0),(390,664,47,34),(428,746,47,34),(667,320,0,21)]:
   page=browser.new_page(viewport={'width':w,'height':h},is_mobile=True,has_touch=True,ignore_https_errors=bool(os.environ.get('PREVIEW_URL')))
   page.set_default_timeout(6000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.add_init_script("document.addEventListener('DOMContentLoaded',()=>{document.documentElement.style.setProperty('--viewport-safe-top','"+str(t)+"px');document.documentElement.style.setProperty('--viewport-safe-bottom','"+str(b)+"px');syncGameViewport()})")
   page.goto(os.environ.get('PREVIEW_URL',f'http://127.0.0.1:{server.server_port}/'))
   def tap(label):page.get_by_role('button',name=label,exact=True).tap()
   def displayed():return page.locator('.market-produce').evaluate_all('es=>es.map(e=>e.dataset.marketCrop)')
   def balanced(n):
    if n==0:assert page.locator('.market-produce-tray,.market-produce').count()==0;return
    boxes=page.locator('.market-produce').evaluate_all('es=>es.map(e=>e.getBoundingClientRect().toJSON())')
    tray=page.locator('.market-produce-tray').bounding_box()
    assert len(boxes)==n
    for box in boxes:assert box['width']>=44 and box['height']>=44
    if n<=3:
     assert abs((boxes[0]['left']+boxes[-1]['right'])/2-(tray['x']+tray['width']/2))<=2,(w,h,n,boxes,tray)
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   page.evaluate("""()=>{state=Game.initial();state.owned.table=state.owned.scale=1;state.bagCount=4;state.inventory={carrot:4,tomato:2,corn:1,onion:1,radish:5,lettuce:0};state.display={carrot:1,tomato:2,corn:1,onion:1,radish:0,lettuce:2};Game.openMarket(state);Game.newCustomer(state,'Maya');Game.greet(state);state.customer.want={carrot:1};go('market')}""")
   assert set(displayed())=={'carrot','tomato','corn','onion'}
   before=page.evaluate('[state.inventory,state.display,state.customerHistory,state.marketExpenses,state.mathPractice]')
   page.evaluate('render()');assert page.evaluate('[state.inventory,state.display,state.customerHistory,state.marketExpenses,state.mathPractice]')==before
   tap('🧺 Fill customer basket');tap('Add Carrots');enter_total(page,'2');tap('Confirm total');tap('💵 Count change')
   tap('$1');tap('$1');tap('$1');tap('Give change')
   assert set(displayed())=={'tomato','corn','onion'};balanced(3)
   assert page.evaluate('[state.inventory.carrot,state.display.carrot,state.cash,state.bagCount]')==[3,0,52,3]
   assert page.locator('.market-tableau > .market-conversation').count()==1
   assert 'Thank' in page.locator('.market-conversation').inner_text()
   assert 'Your customer' not in page.locator('.market-controls').inner_text()
   if w==428:page.screenshot(path='/tmp/market-stock-sale-goodbye.png')
   tap('Thank you so much! I hope to see you again!')
   assert page.locator('.market-conversation').count()==0
   assert 'Your customer' not in page.locator('.market-controls').inner_text()
   # Old saved goodbye text is suppressed, including the arrange-stand dialog.
   for message in ['Your customer smiles: Thank you!','Your customer says: Thanks!','Your customer waves goodbye.']:
    page.evaluate('s=>{state.notice=s;render()}',message)
    assert 'Your customer' not in page.locator('.market-controls').inner_text()
   tap('Arrange Produce');assert 'Your customer' not in page.locator('.dialog').inner_text()
   tap('Add All Produce to Stand');tap('Ready to serve')
   assert 'carrot' in displayed() and 'radish' in displayed()
   assert page.locator('[data-market-crop="carrot"] .market-produce-label').inner_text().endswith('$2.00 each')
   snapshot=page.evaluate('[state.cash,state.inventory,state.display,state.customerHistory,state.bagCount]')
   page.reload();tap('Farmers Market');assert page.evaluate('[state.cash,state.inventory,state.display,state.customerHistory,state.bagCount]')==snapshot
   assert 'carrot' in displayed()
   # Exercise every sparse arrangement without changing harvest records/history.
   for n in [3,2,1,0]:
    page.evaluate("n=>{state.display={};['carrot','corn','onion'].slice(0,n).forEach(id=>state.display[id]=1);render()}",n)
    balanced(n)
    if w==428:page.screenshot(path=f'/tmp/market-stock-balanced-{n}.png')
   # Functional purchase feedback still appears; only customer dialogue was removed.
   page.evaluate("()=>{state.notice='Bought 10 paper bags for $3.';render()}")
   assert 'Bought 10 paper bags' in page.locator('.market-controls').inner_text()
   assert not errors,errors
   page.close();print(f'PASS sold-out sale/removal, positive harvest off stand hidden, balanced 3/2/1/0, restock/refresh, bubble-only goodbye {w}x{h}',flush=True)
  browser.close()
finally:server.shutdown()
