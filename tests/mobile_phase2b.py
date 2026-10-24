"""Exterior-only seasons/activity tests in isolated mobile browser contexts.
No real player storage is touched. Screenshots go to /tmp/phase2b-*.png.
"""
import os
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(root)))
Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  for width,height in [(320,360),(320,440),(375,548),(390,664),(430,740),(667,320)]:
   page=browser.new_page(viewport={'width':width,'height':height},is_mobile=True,has_touch=True,device_scale_factor=2)
   page.set_default_timeout(5000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(os.environ.get('PREVIEW_URL',f'http://127.0.0.1:{server.server_port}/'))
   page.wait_for_function("performance.getEntriesByType('resource').some(e=>e.name.endsWith('/assets/town/life.webp')&&e.responseEnd>0)")
   def tap(name):page.get_by_role('button',name=name,exact=True).tap()
   def snap():return page.evaluate('JSON.stringify(state)')
   def boxes():return page.locator('.town-building').evaluate_all('es=>es.map(e=>({id:e.dataset.location,...e.getBoundingClientRect().toJSON()}))')
   def fit():
    page.wait_for_function("getComputedStyle(document.documentElement).getPropertyValue('--visible-height').trim()===visualViewport.height+'px'")
    area=page.evaluate('({top:visualViewport.offsetTop,bottom:visualViewport.offsetTop+visualViewport.height,width:visualViewport.width})')
    targets=page.locator('.town-game button').evaluate_all('es=>es.map(e=>({name:e.getAttribute("aria-label"),...e.getBoundingClientRect().toJSON()}))')
    for r in targets:
     assert r['width']>=44 and r['height']>=44,(width,height,r)
     assert r['left']>=0 and r['right']<=area['width']+1,r
     assert r['top']>=area['top'] and r['bottom']<=area['bottom']+1,r
    for i,a in enumerate(targets):
     for b in targets[i+1:]:
      assert min(a['right'],b['right'])-max(a['left'],b['left'])<=1 or min(a['bottom'],b['bottom'])-max(a['top'],b['top'])<=1,(a,b)
    for sign in page.locator('.town-sign').all():
     r=sign.bounding_box();assert r['x']>=0 and r['x']+r['width']<=area['width']+1,r
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth && document.documentElement.scrollHeight<=innerHeight+1')
   baseline=None
   for season,key,col,row in [(1,'spring',0,0),(2,'summer',1,0),(3,'autumn',0,1),(4,'winter',1,1),(5,'spring',0,0)]:
    page.evaluate(f'()=>{{state.season={season};render()}}')
    before=snap();fit()
    assert page.locator('.town-world').get_attribute('data-season')==key
    assert page.locator('.village-season-name').inner_text()==key.capitalize()
    image=page.locator('.village-terrain-art image')
    assert float(image.get_attribute('x'))==-col*3 and float(image.get_attribute('y'))==-row*4
    for tree in page.locator('.village-tree-art image').all():
     assert float(tree.get_attribute('x'))==-((season-1)%4)
    if key=='winter':
     assert page.locator('.town-flower,.town-butterfly').count()==0
    else:assert page.locator('.town-flower').count()==8
    if key=='autumn':assert page.locator('.village-leaf').count()==2
    current=boxes()
    if baseline is None:baseline=current
    else:assert current==baseline,(width,height,season,'season moved destinations')
    # Deliberately progress ambient animation clocks without progressing the game.
    for millis in [0,9000,18000,40000,65000]:
     page.evaluate('(time)=>document.getAnimations().forEach(a=>a.currentTime=time)',millis)
     assert snap()==before
     for target in boxes():
      point={'x':target['x']+target['width']/2,'y':target['y']+target['height']/2}
      assert page.evaluate('p=>document.elementFromPoint(p.x,p.y).closest("button")?.dataset.location',point)==target['id'],(key,target)
    if width==390 and season<=4:page.screenshot(path=f'/tmp/phase2b-{key}.png')
   # Unequal vertical positions/sizes provide stagger and depth rather than aligned grid rows.
   tops={round(r['top'],1) for r in baseline};heights={round(r['height'],1) for r in baseline}
   assert len(tops)>=5 and len(heights)>=4,(tops,heights)
   assert page.locator('[data-attachment-slot]').count()==6
   assert page.locator('[data-village-layer="future-decorations"]').inner_html()==''
   assert page.locator('.village-residents button').count()==0
   # Assets are cached and shared across all seasons/objects; original PNG sources are not downloaded.
   resources=page.evaluate("performance.getEntriesByType('resource').filter(e=>e.name.includes('/assets/town/')).map(e=>({name:e.name,bytes:e.encodedBodySize}))")
   for name in ['buildings','seasons','life']:
    assert len([e for e in resources if e['name'].endswith('/'+name+'.webp')])==1,resources
   assert not any('.png' in e['name'] for e in resources),resources
   assert sum(e['bytes'] for e in resources)<2200000,resources
   if width==390:
    # Safari toolbar and safe-area changes cannot hide labels or controls.
    page.evaluate("()=>{document.documentElement.style.setProperty('--viewport-safe-top','47px');document.documentElement.style.setProperty('--viewport-safe-bottom','34px');Object.defineProperty(visualViewport,'offsetTop',{configurable:true,get:()=>12});}")
    for visible in [548,440,400,548]:
     page.evaluate(f"()=>{{Object.defineProperty(visualViewport,'height',{{configurable:true,get:()=>{visible}}});visualViewport.dispatchEvent(new Event('resize'));}}")
     fit()
    page.evaluate("()=>{delete visualViewport.height;delete visualViewport.offsetTop;document.documentElement.style.removeProperty('--viewport-safe-top');document.documentElement.style.removeProperty('--viewport-safe-bottom');visualViewport.dispatchEvent(new Event('resize'));}")
    fit()
   # Follow the actual existing End Day path through winter -> spring; no alternate progression rules.
   page.evaluate("()=>{state=Game.initial();state.season=4;state.day=20;state.cash=23.75;state.goal=3;state.bagCount=7;state.seeds.carrot=5;go('garden')}")
   tap('☀️ End day');tap('Clubhouse')
   assert page.evaluate('[state.season,state.day,state.cash,state.goal,state.bagCount,state.seeds.carrot]')==[5,1,23.75,3,7,5]
   assert page.locator('.town-world').get_attribute('data-season')=='spring'
   page.reload();assert page.evaluate('[state.season,state.day,state.cash,state.goal,state.bagCount,state.seeds.carrot]')==[5,1,23.75,3,7,5]
   assert page.locator('.town-world').get_attribute('data-season')=='spring'
   page.emulate_media(reduced_motion='reduce')
   page.wait_for_function('document.getAnimations().filter(a=>a.playState==="running").length===0')
   assert page.locator('.village-bird-track').evaluate('e=>getComputedStyle(e).display')=='none'
   assert not errors,errors
   page.close()
  browser.close()
  print('PASS: all four visual seasons/repeat/real 20-day rollover, fixed organic destination layout, all touch targets >=44px, no scrolling or overlap at six mobile sizes, safe-area/toolbar changes, decorative animations cannot change state or intercept taps, reduced motion, cached <2.2MB exterior art, six future-decoration slots and unchanged saved progress.')
finally:server.shutdown()
