"""Existing illustrated money controls: whole/quarter/mixed change, large notes, retry and recovery."""
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
  for w,h,t,b in [(320,360,0,0),(320,440,20,0),(375,548,20,0),(390,664,47,34),(428,746,47,34),(667,320,0,21)]:
   page=browser.new_page(viewport={'width':w,'height':h},is_mobile=True,has_touch=True,ignore_https_errors=bool(os.environ.get('PREVIEW_URL')))
   page.set_default_timeout(6000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.add_init_script("document.addEventListener('DOMContentLoaded',()=>{document.documentElement.style.setProperty('--viewport-safe-top','"+str(t)+"px');document.documentElement.style.setProperty('--viewport-safe-bottom','"+str(b)+"px');syncGameViewport()})")
   page.goto(os.environ.get('PREVIEW_URL',f'http://127.0.0.1:{server.server_port}/'))
   def tap(label):page.get_by_role('button',name=label,exact=True).tap()
   def fit():
    assert page.locator('.register-dialog').evaluate('e=>e.scrollHeight<=e.clientHeight+1'),(w,h)
    for button in page.locator('.register-dialog button').all():
     q=button.bounding_box();assert q['width']>=44 and q['height']>=44,(w,h,q)
     assert q['y']>=t-1 and q['y']+q['height']<=h-b+1,(w,h,q)
   for count,visit,kind in [(0,0,'whole'),(2,7,'quarter'),(4,7,'mixed'),(6,4,'fivecent'),(6,12,'fifty'),(6,22,'hundred')]:
    page.evaluate('''({count,visit})=>{state=Game.initial();state.dreamPurchaseCount=count;state.bagCount=5;state.owned.scale=state.owned.table=1;for(const c of CROPS)state.inventory[c.id]=state.display[c.id]=100;Game.openMarket(state);state.visitors=visit;Game.newCustomer(state,'Maya');go('market')}''',{'count':count,'visit':visit})
    assert page.locator('.market-conversation').count()==0
    tap('Hi! What can I get for you?');tap('🧺 Fill customer basket')
    for label,n in page.evaluate('Object.entries(state.customer.want).map(([id,n])=>[crop(id).name,n])'):
     for _ in range(n):tap('Add '+label)
    tap('Check basket');tap('Calculate total');solve_lines(page)
    total=page.evaluate('Game.totalOrder(state)');enter_total(page,str(total));tap('Confirm total')
    tender=page.evaluate('state.tendered');due=round(page.evaluate('Game.changeDue(state)')*100)
    if kind=='fifty':assert tender==50
    if kind=='hundred':assert tender==100
    before=page.evaluate('[state.cash,state.inventory,state.display,state.bagCount,state.sales,state.customerHistory]')
    prices=page.evaluate('state.customer.prices')
    tap('💵 Count change');fit()
    assert f'${due/100:.2f}' in page.locator('.register-receipt').inner_text()
    if kind=='fivecent':
     # Two wrong change submissions simplify future orders, never this saved order.
     for _ in range(2):
      tap('Give change');assert 'Count up' in page.locator('.dialog').inner_text()
      assert page.evaluate('[state.cash,state.inventory,state.display,state.bagCount,state.sales,state.customerHistory]')==before
      tap('Close ✕');tap('💵 Count change');fit()
     assert page.evaluate('state.changePractice.support')==1
     assert page.evaluate('state.customer.prices')==prices
     assert page.evaluate('state.mathPractice.support')==0
    if kind=='mixed':pieces=[(100,'$1'),(10,'10¢'),(10,'10¢'),(5,'5¢')];assert due==125
    elif kind=='fivecent':
     pieces=[(25,'25¢'),(10,'10¢'),(10,'10¢'),(10,'10¢'),(5,'5¢'),(5,'5¢')]+[(1,'1¢')]*5+[(100,'$1')]*4
     assert due==470
    else:
     pieces=[];remaining=due
     for cents,label in [(2000,'$20'),(1000,'$10'),(500,'$5'),(100,'$1'),(25,'25¢'),(10,'10¢'),(5,'5¢'),(1,'1¢')]:
      while remaining>=cents:pieces.append((cents,label));remaining-=cents
    counted=0
    for i,(cents,label) in enumerate(pieces):
     tap(label);counted+=cents;fit()
     assert page.locator('.register-count strong').inner_text()==f'Change counted: ${counted/100:.2f}'
     if i==2:
      partial=page.evaluate('[state.customer,state.change,state.changePractice,state.cash,state.inventory,state.bagCount]')
      page.reload();assert page.evaluate('[state.customer,state.change,state.changePractice,state.cash,state.inventory,state.bagCount]')==partial
      assert page.evaluate('state.customer.prices')==prices
      tap('💵 Count change');fit()
    assert counted==due
    if w==428:page.screenshot(path=f'/tmp/market-cents-{kind}.png')
    tap('Give change');assert page.evaluate('state.step')=='thanks'
    assert round(page.evaluate('state.cash')*100)==5000+round(total*100)
    assert page.evaluate('state.bagCount')==4
    tap('Thanks for shopping with us!')
    if kind=='fivecent':
     tap('Welcome Next Customer');assert page.evaluate('state.customer.mathLevel')<=2
     assert page.evaluate('Object.values(state.customer.prices).every(p=>[0,25,50,75].includes(Math.round(p*100)%100))')
     tap('Hi! What can I get for you?');tap('Talk about the order');tap("I'm sorry, we're sold out of that today.");tap('Bye!')
    tap('Close market');assert page.locator('.accounting-report').is_visible()
    assert round(page.evaluate('Game.accountingReport(state).sales')*100)==round(total*100)
    assert round(page.evaluate('Game.accountingReport(state).net')*100)==round(total*100)
    paid=page.evaluate('state.cash');tap('Close ✕');tap('View market-day report');tap('Close ✕');assert page.evaluate('state.cash')==paid
   assert not errors,errors
   print(f'PASS illustrated coin/bill change, non-optimal mixes, wrong-change support, refresh and exact reports ($50/$100 included) {w}x{h}',flush=True)
   page.close()
  browser.close()
finally:server.shutdown()
