"""Actual greeting buttons: 28 people, three phrase variants, all greeting styles and scene geometry."""
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
  for w,h,t,b in [(320,440,20,0),(375,548,20,0),(428,746,47,34)]:
   page=browser.new_page(viewport={'width':w,'height':h},is_mobile=True,has_touch=True,ignore_https_errors=bool(os.environ.get('PREVIEW_URL')))
   page.set_default_timeout(6000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.add_init_script("document.addEventListener('DOMContentLoaded',()=>{document.documentElement.style.setProperty('--viewport-safe-top','"+str(t)+"px');document.documentElement.style.setProperty('--viewport-safe-bottom','"+str(b)+"px');syncGameViewport()})")
   page.emulate_media(reduced_motion='reduce')
   page.goto(os.environ.get('PREVIEW_URL',f'http://127.0.0.1:{server.server_port}/'))
   labels={'excellent':'Hi! Welcome to my stand! What can I help you find today?','good':'Hi! What can I get for you?','wait':'Wait quietly for the customer to ask for something.'}
   for name in page.evaluate('MarketCustomers.profiles.map(p=>p.name)'):
    for variant in range(3):
     replies=[]
     for choice,label in labels.items():
      page.evaluate('''({name,variant})=>{state=Game.initial();state.owned.table=state.owned.scale=1;state.bagCount=5;for(const c of CROPS)state.inventory[c.id]=state.display[c.id]=5;Game.openMarket(state);Game.newCustomer(state,name);state.customer.want={beans:2,strawberry:1};state.customer.dialogueVariant=variant;go('market')}''',{'name':name,'variant':variant})
      before=page.evaluate('[state.cash,state.inventory,state.bagCount,state.dreamPurchaseCount,state.mathPractice,state.customerHistory,state.customer.want,state.customer.prices]')
      assert page.locator('.market-conversation').count()==0
      page.get_by_role('button',name=label,exact=True).tap()
      assert page.evaluate('state.step')=='choose',(name,choice)
      assert page.evaluate('state.customer.satisfaction')==60
      assert page.evaluate('[state.cash,state.inventory,state.bagCount,state.dreamPurchaseCount,state.mathPractice,state.customerHistory,state.customer.want,state.customer.prices]')==before
      bubble=page.locator('.market-tableau > .market-conversation');assert bubble.count()==1
      assert page.locator('.market-controls .market-conversation').count()==0
      replies.append(bubble.locator('p').first.inner_text())
      geom=bubble.evaluate('''e=>{const s=e.closest('.market-tableau'),b=e.getBoundingClientRect(),r=s.getBoundingClientRect(),k=Math.max(r.width/1536,r.height/1024);return {b:b.toJSON(),r:r.toJSON(),head:r.left+(r.width-1536*k)/2+900*k,scroll:e.querySelector('.market-speech-copy').scrollHeight,height:e.querySelector('.market-speech-copy').clientHeight,obstacles:[...s.querySelectorAll('.market-clock,.market-produce-tray,.market-tray-hint')].map(x=>x.getBoundingClientRect().toJSON())}}''')
      q=geom['b'];s=geom['r'];assert q['left']>=geom['head'] and q['right']<=s['right']+1 and q['top']>=s['top'] and q['bottom']<=s['bottom']+1,(w,name,choice,variant,geom)
      assert geom['scroll']<=geom['height']+1,(w,name,choice,variant,geom)
      for obstacle in geom['obstacles']:
       assert not(min(q['right'],obstacle['right'])-max(q['left'],obstacle['left'])>1 and min(q['bottom'],obstacle['bottom'])-max(q['top'],obstacle['top'])>1),(w,name,choice,variant,geom)
      assert 'Your customer' not in page.locator('.market-controls').inner_text()
      if w==428 and variant==2 and name in ['Ella','Zoe','Sam','Noah','Ava']:
       page.locator('#app').evaluate('e=>e.scrollTop=0');page.screenshot(path=f'/tmp/phase3-{name}-{choice}.png')
     assert len(set(replies))==3,(name,variant,replies)
   assert not errors,errors
   print(f'PASS 28 profiles × 3 variants × 3 actual greetings, no greeting penalty, scene bubble fits/clears face and stock {w}x{h}',flush=True)
   page.close()
  browser.close()
finally:server.shutdown()
