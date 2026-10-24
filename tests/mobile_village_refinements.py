"""Frameless phone village, Clubhouse identity, and sampled path movement.
The road-color checks read preserved source pixels independently of route geometry.
No real player storage is used. This is touch Chromium, not physical Safari.
"""
import math
import os
import statistics
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
from PIL import Image
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
paint=Image.open(root/'assets/town/source/seasons.png').convert('RGB')
cw,ch=paint.width//2,paint.height//2
server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(root)))
Thread(target=server.serve_forever,daemon=True).start()

def road_color(u,v,season):
 x=int(u/100*cw)+(season%2)*cw;y=int(v/100*ch)+(season//2)*ch
 values=[paint.getpixel((min(paint.width-1,max(0,x+dx)),min(paint.height-1,max(0,y+dy)))) for dx in range(-2,3) for dy in range(-2,3)]
 r,g,b=[statistics.median(p[c] for p in values) for c in range(3)]
 return r>g+4 and g>b+8 and r>145 and b>30,(r,g,b)

# Ignore barely visible (<6% opacity) atlas export noise in empty margins.
alpha_images={
 'assets/town/buildings.webp':Image.open(root/'assets/town/buildings.png').getchannel('A').point([0]*16+[255]*240),
 'assets/town/life.webp':Image.open(root/'assets/town/source/life.png').getchannel('A').point([0]*16+[255]*240),
}
alpha_cache={}
def painted_bounds(meta):
 key=(meta['href'],meta['ix'],meta['iy'],meta['iw'],meta['ih'],meta['vw'],meta['vh'])
 if key not in alpha_cache:
  image=alpha_images[meta['href']]
  x=-meta['ix']/meta['iw']*image.width;y=-meta['iy']/meta['ih']*image.height
  w=meta['vw']/meta['iw']*image.width;h=meta['vh']/meta['ih']*image.height
  bounds=image.crop((x,y,x+w,y+h)).getbbox()
  alpha_cache[key]=(bounds[0]/w*meta['vw'],bounds[1]/h*meta['vh'],bounds[2]/w*meta['vw'],bounds[3]/h*meta['vh'])
 l,t,r,b=alpha_cache[key];m=meta['matrix']
 points=[(m['a']*x+m['c']*y+m['e'],m['b']*x+m['d']*y+m['f']) for x,y in [(l,t),(r,t),(r,b),(l,b)]]
 return {'left':min(p[0] for p in points),'right':max(p[0] for p in points),'top':min(p[1] for p in points),'bottom':max(p[1] for p in points)}
def overlaps(a,b):return min(a['right'],b['right'])-max(a['left'],b['left'])>.5 and min(a['bottom'],b['bottom'])-max(a['top'],b['top'])>.5

try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  for width,height in [(320,360),(320,440),(375,548),(390,664),(430,740),(667,320)]:
   page=browser.new_page(viewport={'width':width,'height':height},is_mobile=True,has_touch=True,device_scale_factor=2)
   page.set_default_timeout(5000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(os.environ.get('PREVIEW_URL',f'http://127.0.0.1:{server.server_port}/'))
   def tap(name):page.get_by_role('button',name=name,exact=True).tap()
   def plans():return page.evaluate('villageWalking.plans.map(p=>({who:p.actor.dataset.villageWalker,route:p.route,size:p.size,standing:p.standing,points:p.points,rect:p.actor.getBoundingClientRect().toJSON()}))')
   for season in range(4):
    page.evaluate(f'()=>{{state.season={season+1};render();}}')
    page.wait_for_function('villageWalking.plans.some(p=>!p.standing)')
    before=page.evaluate('JSON.stringify(state)')
    shell=page.locator('.town-game').evaluate('e=>({rect:e.getBoundingClientRect().toJSON(),border:getComputedStyle(e).borderWidth,radius:getComputedStyle(e).borderRadius,shadow:getComputedStyle(e).boxShadow,viewport:visualViewport.width})')
    assert shell['border']=='0px' and shell['radius']=='0px' and shell['shadow']=='none',shell
    assert abs(shell['rect']['left'])<1 and abs(shell['rect']['right']-shell['viewport'])<1,shell
    geometry=page.evaluate('({world:document.querySelector(".town-world").getBoundingClientRect().toJSON(),terrain:document.querySelector(".village-terrain-art").getBoundingClientRect().toJSON()})')
    assert abs(geometry['terrain']['width']/geometry['terrain']['height']-.75)<.001,geometry
    assert geometry['terrain']['left']<=0 and geometry['terrain']['right']>=width
    assert page.get_by_role('button',name='Clubhouse',exact=True).count()==1
    assert page.get_by_role('button',name='Home',exact=True).count()==0
    assert page.locator('.town-building-art[preserveAspectRatio="none"],.village-person[preserveAspectRatio="none"]').count()==0
    compiled=plans()
    assert page.evaluate('villageWalking.plans.every(p=>getComputedStyle(p.actor).visibility==="visible")')
    for resident in compiled:
     if resident['standing']:
      assert abs(resident['rect']['left']-geometry['world']['left']-resident['points'][0]['x'])<1
      assert abs(resident['rect']['top']-geometry['world']['top']-resident['points'][0]['y'])<1
    for plan in compiled:
     for point in plan['points'][::3]:
      # Shoes stay on the actual painted tan path/cobbles, not green/white scenery.
      for shoe in [-.18,0,.18]:
       u=(point['x']+geometry['world']['left']+shoe*plan['size']-geometry['terrain']['left'])/geometry['terrain']['width']*100
       v=(point['y']+geometry['world']['top']-geometry['terrain']['top'])/geometry['terrain']['height']*100
       ok,rgb=road_color(u,v,season)
       assert ok,(width,height,season,plan['who'],u,v,rgb)
    for index,plan in enumerate(compiled):
     if plan['standing']:continue
     # Sample the displayed contact point across a complete out-and-back walk.
     data=page.evaluate('''index=>{const p=villageWalking.plans[index],a=p.animation,d=a.effect.getTiming().duration;a.pause();const out=[];for(const fraction of [0,.01,.02,.12,.25,.4,.5,.65,.8,.95,1]){a.currentTime=fraction*d;const r=p.actor.getBoundingClientRect(),m=new DOMMatrix(getComputedStyle(p.actor).transform);out.push({fraction,x:r.left,y:r.top,facing:m.a});}return out;}''',index)
     assert math.hypot(data[0]['x']-data[1]['x'],data[0]['y']-data[1]['y'])<.1
     assert data[0]['facing']*data[7]['facing']<0,data
     assert max(math.hypot(a['x']-b['x'],a['y']-b['y']) for a in data for b in data)>8,data
     assert math.hypot(data[0]['x']-data[-1]['x'],data[0]['y']-data[-1]['y'])<.2,data
     for fraction in [0,.15,.3,.45,.6,.75,.9]:
      scene=page.evaluate('''args=>{const p=villageWalking.plans[args.index];p.animation.currentTime=p.animation.effect.getTiming().duration*args.fraction;
       const meta=e=>{const image=e.querySelector('image'),v=e.viewBox.baseVal,m=e.getScreenCTM();return {href:image.getAttribute('href'),ix:Number(image.getAttribute('x')),iy:Number(image.getAttribute('y')),iw:Number(image.getAttribute('width')),ih:Number(image.getAttribute('height')),vw:v.width,vh:v.height,matrix:{a:m.a,b:m.b,c:m.c,d:m.d,e:m.e,f:m.f}}};
       const art=p.actor.querySelector('svg'),m=art.getScreenCTM(),v=art.viewBox.baseVal,r=p.actor.getBoundingClientRect();
       return {actor:meta(art),anchor:{x:m.a*v.width*.5+m.c*v.height*.94+m.e,y:m.b*v.width*.5+m.d*v.height*.94+m.f},foot:{x:r.left,y:r.top},solids:[...document.querySelectorAll('.town-building-art,.village-tree-art,.village-fixture-art')].map(meta),labels:[...document.querySelectorAll('.town-sign,.town-badge')].map(e=>e.getBoundingClientRect().toJSON())};}''',{'index':index,'fraction':fraction})
      assert math.hypot(scene['anchor']['x']-scene['foot']['x'],scene['anchor']['y']-scene['foot']['y'])<1,(width,height,scene['anchor'],scene['foot'])
      body=painted_bounds(scene['actor'])
      for obstacle in scene['solids']:
       assert not overlaps(body,painted_bounds(obstacle)),(width,height,season,plan['who'],body,painted_bounds(obstacle))
      for label in scene['labels']:assert not overlaps(body,label),(width,height,season,plan['who'],body,label)

    assert page.evaluate('JSON.stringify(state)')==before
    if width==390:page.screenshot(path=f'/tmp/village-refined-{season+1}.png')
   if width==390:
    # Visible viewport and safe areas change independently of the layout viewport.
    page.evaluate("()=>{document.documentElement.style.setProperty('--viewport-safe-top','47px');document.documentElement.style.setProperty('--viewport-safe-bottom','34px');Object.defineProperty(visualViewport,'offsetTop',{configurable:true,get:()=>12});}")
    for visible in [548,440,400,548]:
     page.evaluate(f"()=>{{Object.defineProperty(visualViewport,'height',{{configurable:true,get:()=>{visible}}});visualViewport.dispatchEvent(new Event('resize'));}}")
     page.wait_for_function('villageWalking.plans.some(p=>!p.standing)')
     assert page.locator('.hud .nav').first.bounding_box()['y']>=59
    page.evaluate("()=>{delete visualViewport.height;delete visualViewport.offsetTop;document.documentElement.style.removeProperty('--viewport-safe-top');document.documentElement.style.removeProperty('--viewport-safe-bottom');visualViewport.dispatchEvent(new Event('resize'));}")
   if width==667:
    page.evaluate("()=>{document.documentElement.style.setProperty('--village-safe-left','44px');document.documentElement.style.setProperty('--village-safe-right','44px');syncGameViewport();}")
    for sign in page.locator('.town-sign').all():
     r=sign.bounding_box();assert r['x']>=44 and r['x']+r['width']<=width-44,r
    assert page.get_by_role('button',name='Clubhouse',exact=True).bounding_box()['x']+44<=width-44
    page.evaluate("()=>{document.documentElement.style.removeProperty('--village-safe-left');document.documentElement.style.removeProperty('--village-safe-right');syncGameViewport();}")
   # Opening and closing town dialogs preserves gameplay and safe walking routes.
   before_dialog=page.evaluate('JSON.stringify(state)')
   tap('Settings');tap('Close ✕')
   assert page.evaluate('JSON.stringify(state)')==before_dialog
   assert page.evaluate('villageWalking.plans.some(p=>!p.standing)')
   tap('Seed & Feed');assert page.evaluate('villageWalking.animations.length')==0
   tap('Clubhouse');assert page.locator('.town-world').is_visible()
   page.emulate_media(reduced_motion='reduce')
   page.wait_for_function('document.getAnimations().filter(a=>a.playState==="running").length===0')
   assert page.evaluate('villageWalking.plans.length')>=1
   pose=page.locator('[data-village-walker="neighbor"]').bounding_box()
   page.wait_for_timeout(150)
   assert page.locator('[data-village-walker="neighbor"]').bounding_box()==pose
   assert not errors,errors
   page.close()
  browser.close()
  print('PASS: edge-to-edge/proportional village, Clubhouse label/navigation, actual painted-road shoe samples in all four seasons at six mobile sizes, visible sprite/scene collision checks, curved round trips and pauses, safe areas, lifecycle cleanup, no gameplay changes and reduced-motion stillness.')
finally:server.shutdown()
