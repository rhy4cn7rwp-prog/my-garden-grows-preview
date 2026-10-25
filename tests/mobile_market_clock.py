"""Active-play clock tests using a controlled wall clock, never waiting 20 minutes.
Mobile Chromium simulates Safari viewports; not native iPhone Safari certification.
"""
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
  for w,h,t,b in [(320,440,20,0),(375,548,20,0),(390,664,47,34),(428,746,47,34),(667,320,0,21)]:
   page=browser.new_page(viewport={'width':w,'height':h},is_mobile=True,has_touch=True,ignore_https_errors=bool(os.environ.get('PREVIEW_URL')))
   page.set_default_timeout(6000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.add_init_script("window.__marketNow=Number(localStorage.getItem('__marketTestNow'))||1800000000000;Date.now=()=>window.__marketNow;document.addEventListener('DOMContentLoaded',()=>{document.documentElement.style.setProperty('--viewport-safe-top','"+str(t)+"px');document.documentElement.style.setProperty('--viewport-safe-bottom','"+str(b)+"px');syncGameViewport()})")
   page.goto(os.environ.get('PREVIEW_URL',f'http://127.0.0.1:{server.server_port}/'))
   def tap(label):page.get_by_role('button',name=label,exact=True).tap()
   def start():
    page.evaluate("()=>{state=Game.initial();state.inventory.carrot=state.display.carrot=100;state.bagCount=5;go('market')}")
    assert page.evaluate('state.marketStartedAt') is None
    tap('Arrange Produce / Open Market');tap('Open market')
    return page.evaluate('state.marketStartedAt')
   def at(stamp):
    page.evaluate("n=>{window.__marketNow=n;localStorage.setItem('__marketTestNow',String(n));document.dispatchEvent(new Event('visibilitychange'))}",stamp)
   started=start();assert started==1800000000000
   assert page.locator('.market-clock-time').inner_text()=='9:00 AM'
   assert page.locator('.market-clock').count()==1
   q=page.locator('.market-clock').bounding_box();assert q['x']>=0 and q['x']+q['width']<=w and q['y']>=t
   at(started+4999);assert page.locator('.market-clock-time').inner_text()=='9:00 AM'
   hand=page.locator('.market-minute-hand').get_attribute('transform')
   at(started+5000);assert page.locator('.market-clock-time').inner_text()=='9:01 AM'
   assert page.locator('.market-minute-hand').get_attribute('transform')!=hand
   at(started+300000);assert page.locator('.market-clock-time').inner_text()=='10:00 AM'
   page.reload();assert page.evaluate('state.marketStartedAt')==started
   # Reload uses the same wall time, then focus catches up from suspension.
   tap('Farmers Market');assert page.locator('.market-clock-time').inner_text()=='10:00 AM'
   tap('Back to village')
   page.evaluate('n=>window.__marketNow=n',started+900000)
   page.evaluate("window.dispatchEvent(new Event('focus'))")
   tap('Farmers Market');assert page.locator('.market-clock-time').inner_text()=='12:00 PM'
   tap('Back to village');at(started+1199990);tap('Farmers Market')
   assert page.locator('.market-clock-time').inner_text()=='12:59 PM'
   tap('Welcome Next Customer');tap('Hi! What can I get for you?')
   clock=page.locator('.market-clock').bounding_box();scene=page.locator('.market-first-person').bounding_box()
   scale=max(scene['width']/1536,scene['height']/1024)
   customer_head_left=scene['x']+(scene['width']-1536*scale)/2+640*scale
   assert clock['x']+clock['width']<=customer_head_left+1,(w,h,clock,customer_head_left)
   if w==428:
    page.locator('#app').evaluate('e=>e.scrollTop=0');page.screenshot(path='/tmp/market-clock-customer-iphone.png')
   tap('🧺 Fill customer basket');tap('Add Carrots')
   enter_total(page,'2');tap('Confirm total');tap('💵 Count change')
   pending=page.evaluate('[state.customer,state.basket,state.change,state.cash,state.bagCount]')
   # Safari lifecycle events: hidden time is never charged, including reload.
   active_before=page.evaluate('Game.marketTime(state).elapsedMs')
   page.evaluate("()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('pagehide'))}")
   at(started+1500000)
   assert page.evaluate('Game.marketTime(state).elapsedMs')==active_before
   assert page.evaluate('[state.customer,state.basket,state.change,state.cash,state.bagCount]')==pending
   page.reload();tap('💵 Count change')
   assert page.evaluate('Game.marketTime(state).elapsedMs')==active_before
   page.evaluate("()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))}")
   at(started+5500000)
   assert page.evaluate('Game.marketTime(state).elapsedMs')==active_before
   page.evaluate("()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'))}")
   at(started+5500010)
   assert page.locator('.register-dialog').is_visible()
   assert page.locator('.market-clock-time').inner_text()=='1:00 PM'
   assert page.evaluate('state.marketOpen')
   page.reload();assert page.evaluate('state.marketStartedAt')==started
   at(started+5500010);tap('💵 Count change')
   assert page.locator('.register-dialog').evaluate('e=>e.scrollHeight<=e.clientHeight+1')
   for _ in range(3):tap('$1')
   tap('Give change');assert page.evaluate('[state.cash,state.bagCount,state.inventory.carrot]')==[52,4,99]
   tap('Thanks for shopping with us!');page.get_by_role('heading',name='Market-day report',exact=True).wait_for()
   assert not page.evaluate('state.marketOpen') and page.evaluate('state.marketSettled')
   assert page.locator('.accounting-report').is_visible();tap('Close ✕')
   at(started+9999999);assert page.evaluate('state.cash')==52
   assert page.locator('.market-clock-time').inner_text()=='1:00 PM'
   if w==428:page.screenshot(path='/tmp/market-clock-iphone.png')
   # Idle market automatically closes, including while exploring another location.
   started=start();tap('Back to village');at(started+1200000)
   assert not page.evaluate('state.marketOpen')
   tap('Farmers Market');page.get_by_role('heading',name='Market-day report',exact=True).wait_for();tap('Close ✕')
   # A last-millisecond admission click shows the report, without reopening it
   # a second time when dismissed.
   started=start()
   page.evaluate("n=>{window.__marketNow=n;newCustomer()}",started+1200000)
   page.get_by_role('heading',name='Market-day report',exact=True).wait_for();tap('Close ✕')
   assert page.locator('.dialog').count()==0
   # Early closing remains possible and preserves its actual clock time.
   started=start();at(started+15000);tap('Close market');tap('Close ✕')
   assert page.locator('.market-clock-time').inner_text()=='9:03 AM'
   page.reload();tap('Farmers Market');at(started+9000000)
   assert page.locator('.market-clock-time').inner_text()=='9:03 AM'
   assert page.evaluate('state.cash')==50 and not page.evaluate('state.marketOpen')
   assert not errors,errors
   page.close();print(f'PASS exact game clock, active-time/reload/background, active checkout, auto report and early close {w}x{h}',flush=True)
  browser.close()
finally:server.shutdown()
