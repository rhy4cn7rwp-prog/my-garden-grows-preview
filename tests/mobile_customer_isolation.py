"""Actual portrait pixels, all 28 neighbors and their transaction transitions.
No atlas pixels or player saves are edited. Native Safari remains a manual check.
"""
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from pathlib import Path
from io import BytesIO
from PIL import Image
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)));Thread(target=server.serve_forever,daemon=True).start()
witnesses={2:[(1,251)],3:[(206,275)],4:[(207,251)],6:[(207,250)],8:[(2,270)],9:[(205,251)],12:[(207,251)],14:[(5,260),(204,200)],18:[(205,230)],23:[(1,260)]}
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  for w,h,top,bottom in [(320,440,20,0),(375,548,20,0),(428,746,47,34)]:
   page=browser.new_page(viewport={'width':w,'height':h},is_mobile=True,has_touch=True)
   page.set_default_timeout(7000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.add_init_script("document.addEventListener('DOMContentLoaded',()=>{document.documentElement.style.setProperty('--viewport-safe-top','"+str(top)+"px');document.documentElement.style.setProperty('--viewport-safe-bottom','"+str(bottom)+"px');syncGameViewport()})")
   page.emulate_media(reduced_motion='reduce');page.goto(f'http://127.0.0.1:{server.server_port}/')
   for profile in page.evaluate('MarketCustomers.profiles'):
    name=profile['name']
    page.evaluate('''name=>{state=Game.initial();state.owned.scale=state.owned.table=1;state.bagCount=5;state.inventory.carrot=state.display.carrot=10;Game.openMarket(state);Game.newCustomer(state,name);state.customer.want={carrot:1};Game.pauseMarketClock(state);marketAwaitingResume=true;go('market')}''',name)
    group=page.locator('.market-active-customer');assert group.count()==1
    assert group.get_attribute('data-customer')==name
    assert group.locator('image').count()==1 and group.locator('clipPath polygon').count()==1
    page.evaluate('''async()=>{const el=document.querySelector('.market-active-customer image');await new Promise((resolve,reject)=>{const i=new Image();i.onload=resolve;i.onerror=reject;i.src=el.href.baseVal})}''')
    # At known stray-arm coordinates, the rendered image must show exactly the
    # same scenery as when the current customer is hidden, never another sleeve.
    if profile.get('portrait') in witnesses:
     points=page.evaluate('''points=>{const el=document.querySelector('.market-active-customer image'),[x,y]=marketPortraitBounds(MarketCustomers.profile(state.customer.name).portrait);return points.map(([a,b])=>{const p=new DOMPoint(x+a,y+b).matrixTransform(el.getScreenCTM());return [p.x,p.y]})}''',witnesses[profile['portrait']])
     visible=Image.open(BytesIO(page.screenshot())).convert('RGB')
     group.evaluate("e=>e.style.visibility='hidden'")
     background=Image.open(BytesIO(page.screenshot())).convert('RGB')
     group.evaluate("e=>e.style.removeProperty('visibility')")
     # Negative control: removing only the new silhouette clip must recreate
     # the Ruby/Mateo offcut. This prevents scenery/produce occlusion from making
     # the pixel assertion pass without exercising the original visual bug.
     if w==428 and name=='Ruby':
      image=group.locator('image');clip=image.get_attribute('clip-path')
      image.evaluate("e=>e.removeAttribute('clip-path')")
      unmasked=Image.open(BytesIO(page.screenshot())).convert('RGB')
      image.evaluate("(e,v)=>e.setAttribute('clip-path',v)",clip)
      assert any(max(abs(a-b) for a,b in zip(unmasked.getpixel((round(x),round(y))),background.getpixel((round(x),round(y)))))>10 for x,y in points),'negative control did not reproduce the neighboring sleeve'
     for x,y in points:
      assert 1<=x<w-1 and 1<=y<h-1,(w,name,x,y)
      for xx in range(round(x)-1,round(x)+2):
       for yy in range(round(y)-1,round(y)+2):
        assert max(abs(a-b) for a,b in zip(visible.getpixel((xx,yy)),background.getpixel((xx,yy))))<=3,(w,name,(xx,yy),'stray portrait pixels')
    if w==428 and name in ['Ella','Emma','Mia','Zoe','Ruby','Nina']:page.screenshot(path=f'/tmp/issue1-market-{name}.png')
    assert page.locator('.market-conversation').count()==0
    page.get_by_role('button',name='Hi! What can I get for you?',exact=True).tap()
    assert page.locator('.market-tableau > .market-conversation').count()==1
    assert page.locator('.market-active-customer').count()==1
    page.evaluate('''()=>{state.basket={carrot:1};Game.ring(state,Game.totalOrder(state));state.change=Game.changeDue(state);save();render()}''')
    assert page.locator('.market-active-customer').count()==1
    page.evaluate('finish()');assert page.evaluate('[state.cash,state.bagCount,state.inventory.carrot]')==[52,4,9]
    assert page.locator('.market-active-customer').count()==1
    page.get_by_role('button',name='Thanks for shopping with us!',exact=True).tap()
    assert page.locator('.market-active-customer').count()==0
    assert page.locator('.market-conversation').count()==0
   assert not errors,errors
   print(f'PASS 28 isolated portraits, actual stray-pixel checks, greeting/payment/farewell transitions {w}x{h}',flush=True)
   page.close()
  browser.close()
finally:server.shutdown()
