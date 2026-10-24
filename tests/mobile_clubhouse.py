"""Clubhouse purchases, personal collections, legacy/backup saves and phone layouts.
Uses isolated fixture farms and touch Chromium; physical iPhone Safari is unverified.
"""
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
class QuietHandler(SimpleHTTPRequestHandler):
 def log_message(self, *_): pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(QuietHandler,directory=str(root)))
Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  for width,height,top,bottom in [(320,360,0,0),(320,440,20,0),(375,548,20,0),(390,664,47,34),(428,746,47,34),(428,892,47,34),(667,320,0,21),(926,368,0,21)]:
   page=browser.new_page(viewport={'width':width,'height':height},is_mobile=True,has_touch=True,device_scale_factor=2)
   page.set_default_timeout(5000); errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.add_init_script("document.addEventListener('DOMContentLoaded',()=>{document.documentElement.style.setProperty('--viewport-safe-top','"+str(top)+"px');document.documentElement.style.setProperty('--viewport-safe-bottom','"+str(bottom)+"px');if(innerWidth>600){document.documentElement.style.setProperty('--village-safe-left','44px');document.documentElement.style.setProperty('--village-safe-right','44px');}syncGameViewport();});")
   page.goto(f'http://127.0.0.1:{server.server_port}/')
   page.emulate_media(reduced_motion='reduce')
   page.evaluate('''([top,bottom])=>{document.documentElement.style.setProperty('--viewport-safe-top',top+'px');document.documentElement.style.setProperty('--viewport-safe-bottom',bottom+'px');if(innerWidth>600){document.documentElement.style.setProperty('--village-safe-left','44px');document.documentElement.style.setProperty('--village-safe-right','44px');}syncGameViewport();}''',[top,bottom])
   def tap(name):
    target=page.get_by_role('button',name=name,exact=True)
    if ' · ' in name:
     page.wait_for_function("document.querySelector('.clubhouse-world')?.dataset.painted==='true'")
    if ' · ' in name and not target.is_visible():
     page.get_by_role('button',name='My treasures',exact=True).tap()
     page.get_by_role('button',name='Find '+name.split(' · ')[0],exact=True).tap()
    target.tap()
   def state(): return page.evaluate('JSON.stringify(state)')
   def fit():
    page.wait_for_function("document.querySelector('.clubhouse-world')?.dataset.painted==='true'")
    page.wait_for_timeout(30)
    data=page.evaluate('''()=>({width:visualViewport.width,height:visualViewport.height,top:visualViewport.offsetTop,rect:document.querySelector('.clubhouse-game').getBoundingClientRect().toJSON(),buttons:[...document.querySelectorAll('.clubhouse-game button:not([hidden])')].map(e=>({name:e.getAttribute('aria-label')||e.textContent,...e.getBoundingClientRect().toJSON()}))})''')
    assert data['rect']['top']>=data['top']-1 and data['rect']['bottom']<=data['top']+data['height']+1,data
    for b in data['buttons']:
     assert b['width']>=44 and b['height']>=44,(width,height,b)
     assert b['left']>=0 and b['right']<=data['width']+1,(width,height,b)
     assert b['top']>=data['top']+top-1 and b['bottom']<=data['top']+data['height']-bottom+1,(width,height,b)
    for i,a in enumerate(data['buttons']):
     for b in data['buttons'][i+1:]:
      assert min(a['right'],b['right'])-max(a['left'],b['left'])<1 or min(a['bottom'],b['bottom'])-max(a['top'],b['top'])<1,(width,height,a,b)
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth && document.documentElement.scrollHeight<=innerHeight+1')
    assert page.locator('.hud').count()==1
    assert page.locator('[aria-label="Money balance"]').count()==1
    assert page.locator('[aria-label="Season and day"]').count()==1
    assert page.locator('.clubhouse-room-art').evaluate('e=>e.complete && e.naturalWidth>0')
    assert page.locator('.clubhouse-nav').get_attribute('aria-current')=='page'
    assert page.locator('html').get_attribute('data-clubhouse-canvas')=='true'
    assert page.locator('html').get_attribute('data-village-canvas') is None
   # An older player may have reached a goal, but no purchase was recorded.
   page.evaluate('''()=>{delete state.dreamPurchases;state.won=true;state.cash=126;state.goal=0;state.day=9;state.season=2;state.bagCount=8;state.inventory.carrot=4;state.seeds.corn=3;state.plots[3]={id:'carrot',age:2,left:0,quality:100,watered:true};Game.rentEquipment(state,'table','upfront');save();}''')
   page.reload();before=state();tap('Clubhouse');fit()
   assert page.locator('.clubhouse-item').count()==0
   assert page.evaluate('state.cash')==125
   assert page.locator('.balance').inner_text()=='$125.00'
   assert page.locator('.calendar').inner_text()=='Season 2 · Day 9/20'
   if width==390:page.screenshot(path='/tmp/clubhouse-empty-phone.png')
   tap('Dream Shop');tap('Soccer ball')
   assert page.get_by_role('button',name='Buy for $100.00',exact=True).is_enabled()
   tap('Buy for $100.00');assert page.evaluate('state.cash')==25
   tap('Visit my Clubhouse');fit()
   assert page.locator('.clubhouse-item').count()==1
   tap('Soccer ball · Sports corner')
   assert 'Season 2, Day 9' in page.locator('.dialog').inner_text()
   tap('Close ✕');after=state()
   tap('Back to village')
   next_goal=page.get_by_role('button',name='Choose next savings goal',exact=True)
   assert next_goal.bounding_box()['height']>=44
   next_goal.tap();tap('Bicycle');tap('🎯 Choose this dream')
   assert page.evaluate('[state.goal,state.cash]')==[1,25]
   assert not page.evaluate("Game.ownsDream(state,'bike')")
   tap('My Clubhouse')
   assert page.evaluate("JSON.parse(localStorage.getItem('mgg10')).dreamPurchases.ball.price")==100
   tap('Dream Shop')
   assert page.get_by_role('button',name='Soccer ball',exact=True).count()==0
   assert page.locator('.dream-owned-marker').count()==1
   page.evaluate("buyDream('ball')")
   assert 'already' in page.locator('.dialog').inner_text()
   assert page.evaluate('state.cash')==25;tap('Close ✕')
   page.reload();tap('Clubhouse');fit()
   assert page.locator('[data-dream="ball"]').count()==1
   tap('Soccer ball · Sports corner');assert 'Season 2, Day 9' in page.locator('.dialog').inner_text();tap('Close ✕')
   # Every original farm field remains unchanged except the intended reward payment/goal.
   import json
   old=json.loads(before);new=json.loads(state())
   for field in old:
    if field not in ['cash','goal','won','dreamPurchases','notice']:assert new[field]==old[field],field
   page.evaluate("localStorage.setItem('mgg10','{broken')")
   page.reload();tap('Clubhouse');fit()
   assert page.locator('.clubhouse-item').count()==1 and page.evaluate('state.cash')==25
   # No date is invented for explicit ownership with no recorded historical date.
   page.evaluate("()=>{state.dreamPurchases.ball={owned:true,season:null,day:null,price:null};save();}")
   page.reload();tap('Clubhouse');tap('Soccer ball · Sports corner')
   assert 'date was not recorded' in page.locator('.dialog').inner_text();tap('Close ✕')
   # Inspect every reward together, with separate touch targets and no scrolling.
   page.evaluate('''()=>{state=Game.initial();state.cash=2000;for(const d of Game.dreams)Game.purchaseDream(state,d.id);go('clubhouse');}''')
   page.wait_for_function("performance.getEntriesByType('resource').some(e=>e.name.endsWith('/assets/clubhouse/rewards.webp')&&e.responseEnd>0)")
   fit();assert page.locator('.clubhouse-item').count()==6
   for item in page.locator('.clubhouse-item').all():
    label=item.get_attribute('aria-label');tap(label);assert label.split(' · ')[0] in page.locator('.dialog h2').inner_text();tap('Close ✕')
   page.screenshot(path=f'/tmp/clubhouse-full-{width}x{height}.png')
   tap('Back to village');assert page.locator('.town-world').is_visible()
   assert page.locator('html').get_attribute('data-clubhouse-canvas') is None
   assert page.locator('html').get_attribute('data-village-canvas')=='spring'
   assert 'Every dream collected' in page.locator('.town-goal').inner_text()
   tap('Dream Shop');assert page.locator('.spot').count()==0
   assert 'collection is complete' in page.locator('.bottom').inner_text()
   tap('Back to village');tap('Clubhouse');fit()
   # Toolbar changes preserve all items, date records, finances and navigation.
   preserved=state()
   for visible in [height-40,height]:
    page.evaluate('''h=>{Object.defineProperty(visualViewport,'height',{configurable:true,get:()=>h});visualViewport.dispatchEvent(new Event('resize'));}''',visible)
    fit();assert state()==preserved
   assert not errors,errors
   page.close()
  # Clubhouse visits and reward purchase during a market do not lose checkout.
  page=browser.new_page(viewport={'width':390,'height':664},is_mobile=True,has_touch=True)
  page.goto(f'http://127.0.0.1:{server.server_port}/')
  page.evaluate('''()=>{state=Game.initial();state.cash=150;state.bagCount=5;state.inventory.carrot=state.display.carrot=4;Game.openMarket(state);Game.newCustomer(state,'Maya');Game.greet(state);state.customer.want={carrot:2};state.basket={carrot:2};Game.ring(state,4);state.change=state.tendered-4;go('market');}''')
  pending=page.evaluate('[{...state.customer,alternativeOffered:!!state.customer.alternativeOffered},state.step,state.basket,state.change,state.inventory,state.bagCount]')
  page.get_by_role('button',name='Clubhouse',exact=True).tap()
  page.get_by_role('button',name='Dream Shop',exact=True).tap()
  page.get_by_role('button',name='Soccer ball',exact=True).tap()
  page.get_by_role('button',name='Buy for $100.00',exact=True).tap()
  page.get_by_role('button',name='Visit my Clubhouse',exact=True).tap()
  assert page.evaluate('[{...state.customer,alternativeOffered:!!state.customer.alternativeOffered},state.step,state.basket,state.change,state.inventory,state.bagCount]')==pending
  page.reload();assert page.locator('.game').get_attribute('data-scene')=='market'
  assert page.evaluate('[{...state.customer,alternativeOffered:!!state.customer.alternativeOffered},state.step,state.basket,state.change,state.inventory,state.bagCount]')==pending
  page.evaluate('finish()')
  assert page.evaluate('[state.cash,state.bagCount,state.inventory.carrot]')==[54,4,2]
  page.get_by_role('button',name='Thanks for shopping with us!',exact=True).tap()
  assert page.evaluate('state.customer') is None
  page.get_by_role('button',name='Clubhouse',exact=True).tap()
  assert page.locator('[data-dream="ball"]').count()==1
  # Earn the selected goal through the complete educational market UI.
  page=browser.new_page(viewport={'width':390,'height':664},is_mobile=True,has_touch=True)
  page.goto(f'http://127.0.0.1:{server.server_port}/')
  page.evaluate("()=>{state=Game.initial();state.cash=98;Game.chooseGoal(state,0);state.bagCount=5;state.inventory.carrot=state.display.carrot=4;Game.openMarket(state);Game.newCustomer(state,'Maya');state.customer.want={carrot:1};go('market');}")
  def tap_goal(name):page.get_by_role('button',name=name,exact=True).tap()
  tap_goal('Hi! What can I get for you?');tap_goal('🧺 Fill customer basket')
  tap_goal('Add Carrots');tap_goal('Check basket');page.locator('#total-answer').fill('2')
  tap_goal('⚖️ Check total / collect payment');tap_goal('💵 Count change')
  due=page.evaluate('state.tendered-Game.totalOrder(state)')
  for _ in range(int(due)):tap_goal('$1')
  tap_goal('Give change')
  assert 'Congratulations!' in page.locator('.dialog h2').inner_text()
  assert page.evaluate('[state.cash,state.won,state.bagCount]')==[100,True,4]
  assert not page.evaluate("Game.ownsDream(state,'ball')")
  assert page.evaluate("JSON.parse(localStorage.getItem('mgg10')).dreamPurchases")=={}
  tap_goal('Keep playing');tap_goal('Thanks for shopping with us!')
  page.reload();assert page.evaluate('[state.cash,state.won]')==[100,True]
  assert page.locator('.modal').count()==0
  tap_goal('Dream Shop');tap_goal('Soccer ball');tap_goal('Buy for $100.00')
  assert page.evaluate('[state.cash,state.goal]')==[0,0]
  assert page.evaluate("Game.ownsDream(state,'ball')")
  tap_goal('Choose next savings goal')
  assert page.locator('.next-dream-choice').count()==5
  assert page.get_by_role('button',name='Save for Soccer ball · $100.00',exact=True).count()==0
  tap_goal('Save for Bicycle · $250.00')
  assert page.evaluate('[state.goal,state.cash,state.won]')==[1,0,False]
  assert not page.evaluate("Game.ownsDream(state,'bike')")
  assert page.get_by_role('button',name='Soccer ball',exact=True).count()==0
  tap_goal('My Clubhouse');page.wait_for_timeout(220);tap_goal('Soccer ball · Sports corner')
  assert 'Season 1, Day 1' in page.locator('.dialog').inner_text();tap_goal('Close ✕')
  page.reload();tap_goal('Clubhouse')
  assert page.locator('[data-dream=ball]').count()==1
  assert page.evaluate('[state.cash,state.goal]')==[0,1]
  browser.close()
  print('PASS: Clubhouse artwork/independent rewards, congratulations without auto-purchase, explicit checkout and next-goal selection, exact purchase payments, no duplicates, old/backup/reopened saves, honest purchase dates, all six owned/unowned displays, uninterrupted market checkout and one bag, safe-area/toolbar/reduced-motion touch layouts at eight phone sizes. Native iPhone Safari remains unverified.')
finally:server.shutdown()
