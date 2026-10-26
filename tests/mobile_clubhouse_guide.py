"""Optional book/startup and resumable market regression; isolated touch browsers only.
Chromium Safari-sized/safe-area emulation is not a substitute for native Safari.
"""
import os
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)))
Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  for w,h,t,b in [(320,480,20,0),(375,548,20,0),(390,664,47,34),(428,746,47,34),(428,892,47,34),(667,320,0,21)]:
   page=browser.new_page(viewport={'width':w,'height':h},is_mobile=True,has_touch=True,ignore_https_errors=bool(os.environ.get('PREVIEW_URL')))
   page.set_default_timeout(7000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.add_init_script("document.addEventListener('DOMContentLoaded',()=>{document.documentElement.style.setProperty('--viewport-safe-top','"+str(t)+"px');document.documentElement.style.setProperty('--viewport-safe-bottom','"+str(b)+"px');syncGameViewport()})")
   page.goto(os.environ.get('PREVIEW_URL',f'http://127.0.0.1:{server.server_port}/'))
   page.emulate_media(reduced_motion='reduce')
   def tap(name):page.get_by_role('button',name=name,exact=True).tap()
   def snapshot():return page.evaluate('JSON.stringify(state)')
   assert page.evaluate('view')=='clubhouse'
   assert page.evaluate('state.cash')==50
   page.wait_for_function("document.querySelector('.clubhouse-world')?.dataset.composited==='true'")
   page.wait_for_function('!!clubhouseRoom.bookImage?.naturalWidth && !!clubhouseRoom.bookTableImage?.naturalWidth')
   if h>w:
    book=page.locator('.clubhouse-guidebook').bounding_box()
    assert book is not None and book['width']>=44 and book['height']>=44
    assert abs(book['x']+book['width']/2-w/2)<2,(w,h,book)
   fresh=snapshot()
   if w==428 and h==746:page.screenshot(path='/tmp/guidebook-clubhouse.png')
   # Book is genuinely in room space, and also accessible without turning.
   if w>=375 and h>=500:
    page.locator('.clubhouse-guidebook').tap()
   else:tap('How to Play')
   titles=['Choose Your Dream!',"Shop for Your Garden!",'Plant, Water, Harvest!','Harvest and Keep Growing!',"Help Your Customers!",'Count, Save, Dream!']
   for i,title in enumerate(titles):
    assert page.locator('#guidebook-title').inner_text()==title
    assert page.locator('.guidebook-pages output').inner_text()==f'{i+1} of 6'
    assert page.get_by_role('button',name='← Back',exact=True).is_disabled()==(i==0)
    assert page.get_by_role('button',name='Next →',exact=True).is_disabled()==(i==5)
    # Validate the actual illustration, not just an empty frame before download.
    page.locator('.guidebook-illustration').evaluate("""async el=>{
     await Promise.all([...el.querySelectorAll('img')].map(img=>img.decode()));
     await Promise.all([...el.querySelectorAll('image')].map(el=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve();img.onerror=()=>reject(new Error('Missing guide artwork: '+el.href.baseVal));img.src=el.href.baseVal})));
    }""")
    page.wait_for_timeout(40)
    # No concealed controls, horizontal overflow, or dialog scrolling at phone sizes.
    boxes=page.locator('.guidebook-dialog').evaluate('''el=>({rect:el.getBoundingClientRect().toJSON(),client:el.clientHeight,scroll:el.scrollHeight,width:el.clientWidth,sw:el.scrollWidth})''')
    assert boxes['scroll']<=boxes['client']+1,(w,h,i,boxes)
    assert boxes['sw']<=boxes['width']+1,(w,h,i,boxes)
    assert boxes['rect']['y']>=t-1 and boxes['rect']['bottom']<=h-b+1,(w,h,i,boxes)
    for button in page.locator('.guidebook-dialog button').all():
     q=button.bounding_box();assert q['height']>=44 and q['y']>=t-1 and q['y']+q['height']<=h-b+1,(w,h,i,q)
    assert page.locator('.guidebook-illustration').bounding_box()['height']>=79
    if w==428 and h==746:page.screenshot(path=f'/tmp/guidebook-page-{i+1}.png')
    if i<5:tap('Next →')
   # Safari toolbar height can change without the layout viewport changing.
   if h>=500:
    for visible in [h-40,h]:
     page.evaluate("h=>{Object.defineProperty(visualViewport,'height',{configurable:true,get:()=>h});visualViewport.dispatchEvent(new Event('resize'))}",visible)
     bounds=page.locator('.guidebook-dialog').evaluate("el=>({r:el.getBoundingClientRect().toJSON(),scroll:el.scrollHeight,client:el.clientHeight})")
     assert bounds['r']['bottom']<=visible-b+1 and bounds['r']['y']>=t-1,(w,h,visible,bounds)
     assert bounds['scroll']<=bounds['client']+1,(w,h,visible,bounds)
   tap('← Back');assert page.locator('.guidebook-pages output').inner_text()=='5 of 6'
   tap('Close How to Play');assert page.locator('.guidebook-dialog').count()==0
   assert snapshot()==fresh
   tap('How to Play');assert page.locator('#guidebook-title').inner_text()==titles[0]
   page.keyboard.press('Escape');assert page.locator('.guidebook-dialog').count()==0
   page.evaluate('lookClubhouse(80)');tap('How to Play');tap('Close How to Play')
   assert page.evaluate('clubhouseRoom.yaw')==80
   tap('Go to Town');assert page.evaluate('view')=='town'
   for destination in ['seeds','supplies','garden','dream','market','town']:
    page.evaluate('v=>go(v)',destination);tap('Clubhouse');assert page.evaluate('view')=='clubhouse'
   # Own several rewards and retain their exact placements and unrelated progress.
   page.evaluate('''()=>{state.cash=1000;Game.purchaseDream(state,'ball');Game.purchaseDream(state,'bike');Game.purchaseDream(state,'camera');Game.moveClubhouseItem(state,'ball',ClubhouseLayout.canonical('ball','window-seat',1000));state.seeds.carrot=7;state.inventory.carrot=state.display.carrot=60;state.bagCount=20;state.plots[0]={id:'carrot',age:1,watered:true,left:0,quality:100};state.owned.scale=1;state.marketElapsedMs=0;Game.openMarket(state);Game.newCustomer(state);Game.pauseMarketClock(state);marketAwaitingResume=true;state.marketElapsedMs=23456;save();go('clubhouse')}''')
   old=snapshot();page.reload();assert page.evaluate('view')=='clubhouse'
   assert page.evaluate('marketAwaitingResume') is True
   recovered=snapshot()
   # Sanitization is the existing Game.recover contract, not a fresh farm.
   assert page.evaluate('(old)=>JSON.stringify(Game.recover(old))',old)==recovered
   page.wait_for_timeout(1250)
   assert snapshot()==recovered
   tap('How to Play');tap('Next →');tap('Close How to Play');assert snapshot()==recovered
   tap('Resume Market');assert page.evaluate('view')=='market'
   assert page.evaluate('marketAwaitingResume') is False
   customer=page.evaluate('state.customer');assert customer is not None
   elapsed=page.evaluate('Game.marketTime(state).elapsedMs');assert 23456<=elapsed<24456
   # Finish an order after restoring the session, through the existing rules.
   page.evaluate('''()=>{if(state.step==='greet')Game.greet(state,'good');state.customer.want={carrot:1};state.customer.declined=false;state.basket={carrot:1};while(Game.nextMathLine(state))Game.answerMathLine(state,Game.nextMathLine(state),Game.lineTotal(state,Game.nextMathLine(state)));Game.ring(state,Game.totalOrder(state));state.change=Game.changeDue(state);Game.finish(state);save();render()}''')
   assert page.evaluate('state.step')=='thanks'
   assert page.evaluate('state.bagCount')==19
   assert page.evaluate('state.inventory.carrot')==59
   # A hidden/pagehide event freezes time; returning resumes without absence charge.
   page.evaluate("()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('pagehide'))}")
   paused=page.evaluate('Game.marketTime(state).elapsedMs');page.wait_for_timeout(1200)
   assert page.evaluate('Game.marketTime(state).elapsedMs')==paused
   page.evaluate("()=>{Object.defineProperty(document,'hidden',{value:false,configurable:true});document.dispatchEvent(new Event('visibilitychange'))}")
   assert page.evaluate('Game.marketTime(state).elapsedMs')<paused+500
   page.evaluate('pauseHiddenMarket()');saved=page.evaluate('JSON.stringify(state)');page.reload()
   assert page.evaluate('view')=='clubhouse'
   assert page.evaluate('(old)=>JSON.stringify(Game.recover(old))',saved)==snapshot()
   # Recovered payment customer can finish farewell and still welcome the next.
   tap('Resume Market');assert page.evaluate('state.step')=='thanks'
   page.evaluate("()=>{Game.advanceCustomer(state,'good');render()}")
   assert page.evaluate('state.marketOpen') is True
   assert page.evaluate('state.customer') is None
   page.evaluate("pauseHiddenMarket()")
   frozen=snapshot()
   page.evaluate("window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))")
   assert page.evaluate('view')=='clubhouse' and page.evaluate('marketAwaitingResume') is True
   assert snapshot()==frozen
   tap('Resume Market');assert page.evaluate('view')=='market'
   assert not errors,errors
   print(f'PASS home/startup, six illustrated guide pages, exact save recovery, market resume/sale and hidden pause {w}x{h}',flush=True)
   page.close()
  browser.close()
finally:server.shutdown()
