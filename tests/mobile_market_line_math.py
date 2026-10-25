"""First-dream teaching stage, saved line answers, no register prop, touch/desktop keypad."""
import os
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
from market_ui_helpers import enter_total,solve_lines
root=Path(__file__).resolve().parents[1]
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)));Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  for w,h,t,b in [(320,360,0,0),(320,440,20,0),(375,548,20,0),(390,664,47,34),(428,746,47,34),(667,320,0,21),(1024,768,0,0)]:
   page=browser.new_page(viewport={'width':w,'height':h},is_mobile=w<800,has_touch=True,ignore_https_errors=bool(os.environ.get('PREVIEW_URL')))
   page.set_default_timeout(6000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.add_init_script("document.addEventListener('DOMContentLoaded',()=>{document.documentElement.style.setProperty('--viewport-safe-top','"+str(t)+"px');document.documentElement.style.setProperty('--viewport-safe-bottom','"+str(b)+"px');syncGameViewport()})")
   page.goto(os.environ.get('PREVIEW_URL',f'http://127.0.0.1:{server.server_port}/'))
   def tap(label):page.get_by_role('button',name=label,exact=True).tap()
   def fixture(count):
    page.evaluate('''count=>{state=Game.initial();state.dreamPurchaseCount=count;state.bagCount=5;state.owned.table=state.owned.scale=1;for(const c of CROPS)state.inventory[c.id]=state.display[c.id]=5;Game.openMarket(state);Game.newCustomer(state,'Maya');Game.greet(state);state.customer.want={carrot:2,tomato:1};state.basket={...state.customer.want};go('market')}''',count)
   def open_keypad():tap('🧺 Fill customer basket');tap('Calculate total')
   def fit():
    assert page.locator('.total-keypad-dialog').evaluate('e=>e.scrollHeight<=e.clientHeight+1')
    for button in page.locator('.total-keypad-dialog button').all():
     q=button.bounding_box();assert q['width']>=44 and q['height']>=44,(w,h,q)
     assert q['y']>=t-1 and q['y']+q['height']<=h-b+1,(w,h,q)
    assert page.locator('.total-keypad-dialog input,.total-keypad-dialog textarea').count()==0
   fixture(0)
   assert page.locator('.market-register-prop').count()==0
   tray=page.locator('.market-produce-tray').bounding_box();assert tray['width']>=page.locator('.market-tableau').bounding_box()['width']-20
   if w==428:page.screenshot(path='/tmp/market-produce-no-register.png')
   open_keypad();fit()
   assert '2 × $2.00 = $4.00' in page.locator('.total-keypad-order').inner_text()
   assert '1 × $3.00 = $3.00' in page.locator('.total-keypad-order').inner_text()
   assert page.get_by_role('button',name='Confirm line',exact=True).count()==0
   if w==428:page.screenshot(path='/tmp/market-math-addition.png')
   enter_total(page,'7');tap('Confirm total');assert page.evaluate('state.step')=='pay'
   fixture(1);before=page.evaluate('[state.cash,state.inventory,state.bagCount,state.dreamPurchaseCount]')
   open_keypad();fit()
   assert page.locator('#total-answer').inner_text()=='—'
   assert '2 × $2.00 = ?' in page.locator('.total-keypad-order').inner_text()
   assert page.get_by_role('button',name='Confirm line',exact=True).inner_text()=='Confirm line'
   if w==428:page.screenshot(path='/tmp/market-math-multiply.png')
   enter_total(page,'5');tap('Confirm line');fit();assert 'try again' in page.locator('.total-keypad-feedback').inner_text()
   assert '2 × $2.00 = ?' in page.locator('.total-keypad-order').inner_text()
   assert page.evaluate('[state.cash,state.inventory,state.bagCount,state.dreamPurchaseCount]')==before
   enter_total(page,'4')
   if w>=800:page.keyboard.press('Enter')
   else:tap('Confirm line')
   assert '2 × $2.00 = $4.00 ✓' in page.locator('.total-keypad-order').inner_text()
   assert page.evaluate('Game.nextMathLine(state)')=='tomato'
   page.reload();open_keypad();fit()
   assert '2 × $2.00 = $4.00 ✓' in page.locator('.total-keypad-order').inner_text()
   assert page.evaluate('Game.nextMathLine(state)')=='tomato'
   solve_lines(page);fit();assert page.get_by_role('button',name='Confirm total',exact=True).is_visible()
   enter_total(page,'8');tap('Confirm total');assert page.evaluate('state.step')=='choose';fit()
   enter_total(page,'7');tap('Confirm total');assert page.evaluate('state.step')=='pay'
   assert page.evaluate('[state.cash,state.inventory,state.bagCount,state.dreamPurchaseCount]')==before
   tap('💵 Count change');tap('$1');tap('$1');tap('$1');tap('Give change')
   assert page.evaluate('[state.cash,state.bagCount,state.inventory.carrot,state.inventory.tomato]')==[57,4,3,4]
   tap('Thanks for shopping with us!');assert not errors,errors
   page.close();print(f'PASS beginner addition, first-dream lines, retries, saved subtotals, payment and full-width produce {w}x{h}',flush=True)
  browser.close()
finally:server.shutdown()
