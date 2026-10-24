"""Phase 2A: real village objects, shared navigation and unchanged saved gameplay.
Run against an isolated local server by default. PREVIEW_URL can select a hosted copy.
Mobile Chromium emulation is not a claim of physical iPhone Safari verification.
"""
import os
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
server = ThreadingHTTPServer(('127.0.0.1', 0), partial(SimpleHTTPRequestHandler, directory=str(root)))
Thread(target=server.serve_forever, daemon=True).start()
locations = [('Dream Shop','dream'),('Seed & Feed','seeds'),('Market Supplies','supplies'),('My Garden','garden'),('Farmers Market','market')]
try:
 with sync_playwright() as p:
  browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
  for width,height in [(320,360),(320,440),(375,548),(390,664),(430,740),(667,320)]:
   page = browser.new_page(viewport={'width':width,'height':height}, is_mobile=True, has_touch=True, device_scale_factor=2)
   page.set_default_timeout(5000)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(os.environ.get('PREVIEW_URL',f'http://127.0.0.1:{server.server_port}/'))
   page.wait_for_function("performance.getEntriesByType('resource').some(e=>e.name.endsWith('/assets/town/buildings.png') && e.responseEnd>0)")
   def tap(name):page.get_by_role('button',name=name,exact=True).tap()
   def saved():return page.evaluate('JSON.stringify(state)')
   def fit():
    page.wait_for_function("getComputedStyle(document.documentElement).getPropertyValue('--visible-height').trim()===visualViewport.height+'px'")
    data=page.locator('.town-game').evaluate('''e=>({rect:e.getBoundingClientRect().toJSON(),top:visualViewport.offsetTop,bottom:visualViewport.offsetTop+visualViewport.height,width:visualViewport.width,buttons:[...e.querySelectorAll('button')].map(b=>({name:b.getAttribute('aria-label'),...b.getBoundingClientRect().toJSON()})),world:e.querySelector('.town-world').getBoundingClientRect().toJSON()})''')
    assert data['rect']['top']>=data['top'] and data['rect']['bottom']<=data['bottom']+1,(width,height,data)
    for b in data['buttons']:
     assert b['width']>=44 and b['height']>=44,(width,height,b)
     assert b['top']>=data['top'] and b['bottom']<=data['bottom']+1,(width,height,b)
     assert b['left']>=0 and b['right']<=data['width']+1,(width,height,b)
    for i,a in enumerate(data['buttons']):
     for b in data['buttons'][i+1:]:
      assert min(a['right'],b['right'])-max(a['left'],b['left'])<=1 or min(a['bottom'],b['bottom'])-max(a['top'],b['top'])<=1,(a,b)
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth && document.documentElement.scrollHeight<=innerHeight+1')
    for sign in page.locator('.town-sign').all():
     r=sign.bounding_box()
     assert r['x']>=0 and r['x']+r['width']<=width+1,r
    assert page.locator('.town-world .spot').count()==0
    assert page.locator('.town-building svg image').count()==6
    assert page.locator('.town-building svg clipPath').count()==6
    assert page.locator('[aria-label="Money balance"]').count()==1
    assert page.locator('[aria-label="Season and day"]').count()==1
    assert page.locator('nav[aria-label="Farm navigation"]').count()==1
    assert page.get_by_role('button',name='Home',exact=True).count()==1
   fit()
   page.screenshot(path=f'/tmp/phase2a-town-{width}x{height}.png')
   before=saved()
   # Touch the actual building art rather than an unrelated overlay or label.
   for name,scene in locations:
    art=page.get_by_role('button',name=name,exact=True).locator('svg').bounding_box()
    point={'x':art['x']+art['width']/2,'y':art['y']+art['height']/2}
    assert page.evaluate('p=>document.elementFromPoint(p.x,p.y).closest("button").dataset.location',point)==scene
    page.touchscreen.tap(point['x'],point['y'])
    assert page.locator('.game').get_attribute('data-scene')==scene
    assert saved()==before,(scene,'navigation changed gameplay')
    assert page.locator('.hud').count()==1
    assert page.locator('[aria-label="Money balance"]').inner_text()=='$50.00'
    # Confirm that baked header strips sit wholly above the visible crop window.
    trim=128 if scene in ['garden','supplies','market'] else 64
    geometry=page.locator('.interior-crop').evaluate('e=>({crop:e.getBoundingClientRect().toJSON(),stage:e.querySelector(".stage").getBoundingClientRect().toJSON()})')
    assert abs(geometry['stage']['top']+trim*geometry['stage']['width']/512-geometry['crop']['top'])<1
    assert page.get_by_role('button',name='Back to village',exact=True).count()==1
    if width==390:
     page.screenshot(path=f'/tmp/phase2a-{scene}.png')
     # Header cropping must not break any existing merchandise or garden target.
     selector='.plot' if scene=='garden' else '.spot'
     for index in range(page.locator(selector).count()):
      target=page.locator(selector).nth(index)
      target.tap()
      assert page.locator('.dialog').is_visible(),(scene,index)
      tap('Close ✕')
    tap('Back to village' if scene in ['dream','garden'] else 'Home');fit()
   tap('Job Board');assert 'Coming soon' in page.locator('.dialog').inner_text()
   assert page.locator('.dialog input').count()==0
   tap('Close ✕');assert saved()==before;fit()
   tap('Settings');assert 'Farm Settings' in page.locator('.dialog').inner_text();tap('Close ✕')
   tap('Community seed help');assert 'Community seed help' in page.locator('.dialog h2').inner_text();tap('Close ✕')
   assert saved()==before
   # Shared art is requested once; all six buttons reuse its cached image.
   assert page.evaluate("performance.getEntriesByType('resource').filter(e=>e.name.endsWith('/assets/town/buildings.png')).length")==1
   # Existing state: savings goal, seed stock, harvest, plots, paid rental and bags survive navigation/reload.
   page.evaluate('''()=>{state=Game.initial();state.cash=27.50;state.day=8;state.season=2;state.goal=3;state.bagCount=7;state.seeds.carrot=5;
    state.inventory.carrot=4;state.display.carrot=3;state.plots[0]={id:'carrot',age:3,left:0,quality:100,watered:false};
    Game.rentEquipment(state,'table','upfront');go('town');}''')
   stable=page.evaluate('JSON.stringify([state.cash,state.day,state.season,state.goal,state.bagCount,state.seeds,state.inventory,state.plots,state.rentals,state.marketExpenses])')
   assert '1 ready' in page.locator('.town-garden').inner_text()
   assert page.locator('.calendar').inner_text()=='Season 2 · Day 8/20'
   assert page.locator('.balance').inner_text()=='$26.50'
   page.reload()
   assert page.evaluate('JSON.stringify([state.cash,state.day,state.season,state.goal,state.bagCount,state.seeds,state.inventory,state.plots,state.rentals,state.marketExpenses])')==stable
   fit();tap('My Garden');tap('Harvest All Ready Crops');tap('Home')
   assert page.locator('.town-garden .town-badge').count()==0
   assert page.evaluate('state.inventory.carrot')==6
   # The existing market can be left and revisited without losing customer or counted change.
   page.evaluate('''()=>{state.marketOpen=state.marketPlayed=true;state.customer={name:'Maya',want:{carrot:1}};state.basket={carrot:1};state.step='choose';Game.ring(state,2);state.change=1;render();}''')
   pending=page.evaluate('JSON.stringify([state.customer,state.step,state.basket,state.change,state.cash,state.bagCount])')
   assert 'Market open' in page.locator('.town-market').inner_text()
   tap('Farmers Market');tap('Home');tap('Seed & Feed');tap('Home');tap('Farmers Market')
   assert page.evaluate('JSON.stringify([state.customer,state.step,state.basket,state.change,state.cash,state.bagCount])')==pending
   page.reload();assert page.evaluate('[state.step,state.change,state.bagCount]')==['pay',1,7]
   tap('Home');fit()
   if width==390:
    # Safari chrome: the layout viewport stays tall while visible space/insets change.
    page.evaluate("()=>{document.documentElement.style.setProperty('--viewport-safe-top','47px');document.documentElement.style.setProperty('--viewport-safe-bottom','34px');Object.defineProperty(visualViewport,'offsetTop',{configurable:true,get:()=>12});}")
    for visible in [548,440,400,548]:
     page.evaluate(f"()=>{{Object.defineProperty(visualViewport,'height',{{configurable:true,get:()=>{visible}}});visualViewport.dispatchEvent(new Event('resize'));}}")
     fit()
    page.screenshot(path='/tmp/phase2a-safari-safe-area.png')
    page.evaluate("()=>{delete visualViewport.height;delete visualViewport.offsetTop;document.documentElement.style.removeProperty('--viewport-safe-top');document.documentElement.style.removeProperty('--viewport-safe-bottom');visualViewport.dispatchEvent(new Event('resize'));}")
    fit()
   # Existing deferred charges remain visible in town, with no extra charge on revisits.
   page.evaluate("()=>{state=Game.initial();state.cash=0;Game.rentEquipment(state,'table','deferred');go('town')}")
   fit();assert 'Equipment owed: $3.00' in page.locator('.town-debt').inner_text()
   assert page.evaluate('Game.savings(state)')==0
   owed=saved();tap('My Garden');tap('Home');assert saved()==owed
   page.emulate_media(reduced_motion='reduce')
   page.get_by_role('button',name='Dream Shop',exact=True).focus();page.keyboard.press('Enter')
   assert page.locator('.game').get_attribute('data-scene')=='dream'
   tap('Home');assert page.evaluate('document.getAnimations().filter(a=>a.playState==="running").length')==0
   assert not errors,errors
   page.close()
  browser.close()
  print('PASS: six visible interactive locations; no-scroll town at 320x360, 320x440, 375x548, 390x664, 430x740, 667x320; >=44px targets; all navigation, single live HUD, cropped baked headers, no gameplay mutation, saved rentals/progress, harvest readiness, pending checkout recovery, keyboard/reduced motion, and Safari visible-height/safe-area simulations.')
finally:
 server.shutdown()
