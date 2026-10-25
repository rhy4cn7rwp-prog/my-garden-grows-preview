"""Rendered speech placement, not just component presence.
Checks four portraits, greeting/order/payment/thanks, safe areas and resizing.
"""
import os
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)));Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  for w,h,t,b in [(320,360,0,0),(320,440,20,0),(375,548,20,0),(390,664,47,34),(428,746,47,34),(667,320,0,21)]:
   page=browser.new_page(viewport={'width':w,'height':h},is_mobile=True,has_touch=True,ignore_https_errors=bool(os.environ.get('PREVIEW_URL')))
   page.set_default_timeout(5000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.add_init_script("document.addEventListener('DOMContentLoaded',()=>{document.documentElement.style.setProperty('--viewport-safe-top','"+str(t)+"px');document.documentElement.style.setProperty('--viewport-safe-bottom','"+str(b)+"px');syncGameViewport()})")
   if w==667:page.add_init_script("document.addEventListener('DOMContentLoaded',()=>{document.documentElement.style.setProperty('--village-safe-right','47px');document.documentElement.style.setProperty('--village-safe-left','47px')})")
   page.goto(os.environ.get('PREVIEW_URL',f'http://127.0.0.1:{server.server_port}/'))
   for name in ['Maya','Noah','Ava','Oliver']:
    for step in ['greet','choose','pay','thanks']:
     page.evaluate("""({name,step})=>{state=Game.initial();state.owned.scale=state.owned.table=1;state.bagCount=5;for(const c of CROPS)state.inventory[c.id]=state.display[c.id]=5;Game.openMarket(state);Game.newCustomer(state,name);state.customer.want={beans:2,strawberry:1};if(step!=='greet')Game.greet(state,'excellent');if(['pay','thanks'].includes(step)){state.basket={...state.customer.want};Game.ring(state,14)}if(step==='thanks'){state.change=state.tendered-14;Game.finish(state)}go('market');document.querySelector('#app').scrollTop=0;syncGameViewport()}""",{'name':name,'step':step})
     before=page.evaluate('[state.cash,state.inventory,state.bagCount,state.goal,state.day,state.season,state.customer,state.basket,state.marketStartedAt]')
     assert page.locator('.market-tableau > .market-conversation').count()==1
     assert page.locator('.market-controls .market-conversation').count()==0
     assert page.locator('.market-conversation strong').inner_text()==name
     assert page.locator('.market-speech-tail path').get_attribute('d')
     geometry=page.locator('.market-conversation').evaluate("""e=>{const scene=e.closest('.market-tableau'),r=scene.getBoundingClientRect(),b=e.getBoundingClientRect(),k=Math.max(r.width/1536,r.height/1024);return {bubble:b.toJSON(),scene:r.toJSON(),headRight:r.left+(r.width-1536*k)/2+900*k,below:document.querySelector('.market-controls').getBoundingClientRect().toJSON(),obstacles:[...scene.querySelectorAll('.market-clock,.market-produce-tray,.market-register-prop,.market-tray-hint')].map(x=>x.getBoundingClientRect().toJSON()),copy:{scroll:e.querySelector('.market-speech-copy').scrollHeight,client:e.querySelector('.market-speech-copy').clientHeight}}}""")
     q=geometry['bubble'];s=geometry['scene']
     assert q['left']>=s['left'] and q['right']<=s['right']-(47 if w==667 else 0)+1 and q['top']>=s['top'] and q['bottom']<=s['bottom']+1,(w,h,name,step,geometry)
     assert q['left']>=geometry['headRight'],(w,h,name,step,geometry)
     for obstacle in geometry['obstacles']:
      overlap=min(q['right'],obstacle['right'])-max(q['left'],obstacle['left'])>1 and min(q['bottom'],obstacle['bottom'])-max(q['top'],obstacle['top'])>1
      assert not overlap,(w,h,name,step,q,obstacle)
     assert geometry['below']['top']>=s['bottom']-1
     assert geometry['copy']['scroll']<=geometry['copy']['client']+1,(w,h,name,step,geometry)
     assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
     assert page.evaluate('[state.cash,state.inventory,state.bagCount,state.goal,state.day,state.season,state.customer,state.basket,state.marketStartedAt]')==before
     if w in [320,428,667] and (step=='choose' or w==428):
      page.wait_for_timeout(1300 if w==428 else 20)
      page.screenshot(path=f'/tmp/market-speech-{w}-{name}-{step}.png')
   # The camera anchors reproject after rotating/resizing the same live scene.
   if w==428:
    page.set_viewport_size({'width':390,'height':664});page.evaluate('syncGameViewport()')
    assert page.locator('.market-conversation').evaluate('e=>e.getBoundingClientRect().right<=innerWidth')
   assert not errors,errors
   page.close();print(f'PASS inside-scene speech/tail, four portraits × four stages, clear face/clock/stock/register {w}x{h}',flush=True)
  browser.close()
finally:server.shutdown()
