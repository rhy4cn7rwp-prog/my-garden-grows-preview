"""Visible keypad and staged conversation; isolated touch and desktop contexts."""
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
  for w,h,t,b in [(320,360,0,0),(320,440,20,0),(375,548,20,0),(390,664,47,34),(428,746,47,34),(667,320,0,21),(1024,768,0,0)]:
   page=browser.new_page(viewport={'width':w,'height':h},is_mobile=w<800,has_touch=w<800,ignore_https_errors=bool(os.environ.get('PREVIEW_URL')))
   page.set_default_timeout(6000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.add_init_script("document.addEventListener('DOMContentLoaded',()=>{document.documentElement.style.setProperty('--viewport-safe-top','"+str(t)+"px');document.documentElement.style.setProperty('--viewport-safe-bottom','"+str(b)+"px');syncGameViewport()})")
   page.goto(os.environ.get('PREVIEW_URL',f'http://127.0.0.1:{server.server_port}/'))
   def tap(label):page.get_by_role('button',name=label,exact=True).click() if w>=800 else page.get_by_role('button',name=label,exact=True).tap()
   page.evaluate("""()=>{state=Game.initial();state.bagCount=2;state.owned.table=state.owned.scale=1;state.standMode='owned';state.marketOpen=state.marketPlayed=true;state.visitors=1;state.inventory={carrot:4,tomato:3,corn:2};state.display={...state.inventory};state.customer={name:'Maya',want:{carrot:2,tomato:1},personality:'curious',satisfaction:50,decision:50,greeting:null,alternativeOffered:false,response:'arrival'};state.step='greet';go('market')}""")
   initial=page.evaluate('[state.cash,state.bagCount,state.inventory,state.sales,state.day,state.season]')
   assert '2 carrots and 1 tomato' in page.locator('.market-conversation').inner_text()
   assert '$' not in page.locator('.market-conversation').inner_text()
   assert page.locator('.market-dialogue-line').count()==2
   assert page.locator('.market-payment-offer').count()==0
   tap('Hi! What can I get for you?');tap('🧺 Fill customer basket')
   tap('Add Carrots');tap('Add Carrots');tap('Add Tomatoes');tap('Check basket')
   tap('Calculate total')
   def fit():
    box=page.locator('.total-keypad-dialog').evaluate('e=>({s:e.scrollHeight,h:e.clientHeight,r:e.getBoundingClientRect().toJSON()})')
    assert box['s']<=box['h']+1,(w,h,box)
    assert box['r']['top']>=t-1 and box['r']['bottom']<=h-b+1,(w,h,box)
    for button in page.locator('.total-keypad-dialog button').all():
     r=button.bounding_box();assert r['width']>=44 and r['height']>=44,(w,h,r)
     assert r['x']>=0 and r['x']+r['width']<=w+1 and r['y']>=t-1 and r['y']+r['height']<=h-b+1,(w,h,r)
    assert page.locator('.total-keypad-dialog input,.total-keypad-dialog [contenteditable=true]').count()==0
    assert page.evaluate("!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)")
   fit();assert page.locator('#total-answer').inner_text()=='—'
   if w==428:page.screenshot(path='/tmp/phase4b-keypad-iphone.png')
   assert '$7.00' not in page.locator('.total-keypad-dialog').inner_text()
   assert 'at $2.00 each' in page.locator('.total-keypad-order').inner_text()
   assert page.get_by_role('button',name='Confirm total',exact=True).is_disabled()
   for k in ['Decimal point','2','5','9']:tap(k)
   assert page.locator('#total-answer').inner_text()=='$0.25'
   tap('Decimal point');assert page.locator('#total-answer').inner_text()=='$0.25'
   tap('Backspace');assert page.locator('#total-answer').inner_text()=='$0.2'
   tap('Clear');assert page.locator('#total-answer').inner_text()=='—'
   if w>=800:
    page.keyboard.type('8');page.keyboard.press('Enter')
   else:tap('8');tap('Confirm total')
   assert page.evaluate('state.step')=='choose'
   assert 'multiplying' in page.locator('.total-keypad-feedback').inner_text();fit()
   assert page.evaluate('[state.cash,state.bagCount,state.inventory,state.sales,state.day,state.season]')==initial
   tap('Close ✕');tap('Open cash register')
   assert page.locator('#total-answer').inner_text()=='$8'
   tap('Clear')
   if w>=800:page.keyboard.type('7.00');page.keyboard.press('Enter')
   else:
    for k in ['7','Decimal point','0','0']:tap(k)
    tap('Confirm total')
   assert page.evaluate('state.step')=='pay'
   assert page.locator('.market-payment-offer').count()==1
   if w==428:page.screenshot(path='/tmp/phase4b-payment-iphone.png')
   assert '$10.00' in page.locator('.market-conversation').inner_text()
   assert page.evaluate('[state.cash,state.bagCount,state.inventory,state.sales,state.day,state.season]')==initial
   page.reload();assert page.evaluate('state.step')=='pay';assert '$10.00' in page.locator('.market-conversation').inner_text()
   tap('💵 Count change')
   assert page.locator('.register-dialog').evaluate('e=>e.scrollHeight<=e.clientHeight+1')
   for _ in range(3):tap('$1')
   tap('Give change');assert page.evaluate('[state.cash,state.bagCount,state.inventory.carrot,state.inventory.tomato]')==[57,1,2,2]
   assert 'Thank you' in page.locator('.market-conversation').inner_text()
   page.emulate_media(reduced_motion='reduce')
   assert page.locator('.market-dialogue-line').first.evaluate('e=>getComputedStyle(e).animationName')=='none'
   tap('Thanks for shopping with us!');assert page.evaluate('state.customer') is None
   page.reload();assert page.evaluate('[state.cash,state.bagCount]')==[57,1]
   assert not errors,errors
   page.close();print(f'PASS conversational order/payment/thanks, keypad edits/retries, no native input, sale/recovery {w}x{h}',flush=True)
  browser.close()
finally:server.shutdown()
