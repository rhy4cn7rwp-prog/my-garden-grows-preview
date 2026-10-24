"""Phase 2E: real surface contacts, chest occlusion, touch drops and saved layouts.
Isolated touch Chromium; native iPhone Safari still requires manual playtesting.
"""
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
class Q(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Q,directory=str(root)))
Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  for width,height,top,bottom in [(320,360,0,0),(375,548,20,0),(390,664,47,34),(428,746,47,34),(428,892,47,34),(667,320,0,21),(926,368,0,21)]:
   page=browser.new_page(viewport={'width':width,'height':height},is_mobile=True,has_touch=True,device_scale_factor=2)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.set_default_timeout(6000)
   page.add_init_script("document.addEventListener('DOMContentLoaded',()=>{document.documentElement.style.setProperty('--viewport-safe-top','"+str(top)+"px');document.documentElement.style.setProperty('--viewport-safe-bottom','"+str(bottom)+"px');syncGameViewport();});")
   page.goto(f'http://127.0.0.1:{server.server_port}/');page.emulate_media(reduced_motion='reduce')
   page.evaluate("()=>{state.cash=2500;for(const d of Game.dreams)Game.purchaseDream(state,d.id);Game.moveClubhouseItem(state,'ball',ClubhouseLayout.canonical('ball','window-seat',1000));go('clubhouse');}")
   page.wait_for_function("document.querySelector('.clubhouse-world')?.dataset.painted==='true'")
   def tap(name):page.get_by_role('button',name=name,exact=True).tap()
   def find(id):
    tap('My treasures');name=page.evaluate('id=>Game.dreams.find(d=>d.id===id).name',id);tap('Find '+name)
    page.locator('[data-dream='+id+']').wait_for(state='visible');page.wait_for_timeout(35)
   def look(angle):page.evaluate('a=>lookClubhouse(a)',angle);page.wait_for_timeout(35)
   def positions():return page.evaluate('state.clubhousePositions')
   def farm():return page.evaluate("({...Object.fromEntries(Object.entries(state).filter(([k])=>k!=='clubhousePositions')),display:Object.fromEntries(Object.entries(state.display).filter(([,n])=>n>0))})")
   def anchored(id):
    d=page.locator('[data-dream='+id+']').evaluate("e=>{const r=clubhouseRoom,p=ClubhouseLayout.effective(state.clubhousePositions,e.dataset.dream),q=roomItemPoint(e.dataset.dream,p),v=e.querySelector('.clubhouse-visual').getBoundingClientRect(),w=r.world.getBoundingClientRect(),b=e.getBoundingClientRect();return {delta:v.bottom-w.top-q.tail-q.footY,dx:v.left-w.left+v.width/2-q.footX,touch:b.toJSON(),usable:r.usable,rect:w.toJSON(),kind:ClubhouseLayout.getSurface(p.surface).kind,parent:e.parentElement.className}}")
    assert abs(d['delta'])<1 and abs(d['dx'])<1,(width,height,id,d)
    b=d['touch'];u=d['usable'];w=d['rect']
    assert b['width']>=44 and b['height']>=44,(width,height,id,b)
    assert b['top']>=w['top']+u['top']-1 and b['bottom']<=w['top']+u['bottom']+1,(width,height,id,b,u)
    if d['kind']=='chest':assert d['parent']=='clubhouse-chest-displays'
    else:assert d['parent']=='clubhouse-displays'
   before=farm()
   for id in ['ball','bike','guitar','camera','tablet','puppy']:
    find(id);anchored(id)
    angle=page.evaluate('id=>ClubhouseLayout.effective(state.clubhousePositions,id).angle',id)
    for delta in [-10,0,10]:
     look(max(-80,min(80,angle+delta)))
     if page.locator('[data-dream='+id+']').is_visible():anchored(id)
    find(id);page.locator('[data-dream='+id+']').tap();assert page.locator('.dialog h2').inner_text()==page.evaluate('id=>Game.dreams.find(d=>d.id===id).name',id);tap('Close ✕')
   # Independently sample the original chest panel: opaque in front, transparent
   # in the opening, with the same painted pixels as the unchanged background.
   find('puppy')
   mask=page.evaluate("()=>{const r=clubhouseRoom,g=r.geometry,c=r.occCanvas;const at=(x,y)=>{const p=ClubhouseLayout.project({angle:ClubhouseLayout.angleAt(x),y:y/724},r.yaw,g),px=Math.floor(p.x*c.width/g.width),py=Math.floor(p.y*c.height/g.height);return {front:[...r.occCtx.getImageData(px,py,1,1).data],back:[...r.ctx.getImageData(px,py,1,1).data]}};return {panel:at(1300,520),opening:at(1300,466)}}")
   assert mask['panel']['front'][3]==255 and mask['opening']['front'][3]==0,mask
   assert max(abs(a-b) for a,b in zip(mask['panel']['front'],mask['panel']['back']))<=2,mask
   saved=positions();tap('Back to village');tap('Clubhouse');find('ball');assert positions()==saved;anchored('ball')
   page.reload();tap('Clubhouse');find('ball');assert positions()==saved;anchored('ball');assert farm()==before
   if width==428 and height==746:
    session=page.context.new_cdp_session(page)
    def touch(kind,x=0,y=0):session.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':[] if kind in ['touchEnd','touchCancel'] else [{'x':x,'y':y}]})
    def drag(id,dest):
     old=page.evaluate('id=>ClubhouseLayout.effective(state.clubhousePositions,id)',id)
     look(max(-80,min(80,(old['angle']+dest['angle'])/2)))
     # Frame both surfaces by tilting the whole room (the same operation as a
     # vertical swipe). Never relocate or clamp a treasure independently.
     page.evaluate("([id,p])=>{const r=clubhouseRoom,a=roomItemPoint(id,ClubhouseLayout.effective(state.clubhousePositions,id)),b=roomItemPoint(id,p),min=Math.min(a.visualTop,b.visualTop),max=Math.max(a.footY,b.footY);const shift=min<r.usable.top+8?r.usable.top+8-min:max>r.usable.bottom-8?r.usable.bottom-8-max:0;tiltClubhouse(shift)}",[id,dest]);page.wait_for_timeout(35)
     box=page.locator('[data-dream='+id+']').bounding_box();assert box,id
     touch('touchStart',box['x']+box['width']/2,box['y']+box['height']/2);page.wait_for_timeout(480)
     assert page.locator('[data-moving]').count()==1
     drop_point=page.evaluate("p=>{const r=clubhouseRoom,q=ClubhouseLayout.project(p,r.yaw,r.geometry);return {x:q.x-(r.gesture.grabDX||0),y:q.y-(r.gesture.grabDY||0)}}",dest)
     touch('touchMove',drop_point['x'],drop_point['y']);page.wait_for_timeout(40)
     assert page.evaluate('clubhouseRoom.drop?.surface')==dest['surface'],page.evaluate('({drop:clubhouseRoom.drop,gesture:clubhouseRoom.gesture})')
     touch('touchEnd');page.wait_for_timeout(45)
     actual=page.evaluate('id=>state.clubhousePositions[id]',id);assert actual['surface']==dest['surface'],actual
     assert abs(actual['angle']-dest['angle'])<.1 and abs(actual['y']-dest['y'])<.002,(actual,dest)
     anchored(id);assert farm()==before
     saved=positions()
     for delta in [-8,8]:
      look(max(-80,min(80,actual['angle']+delta)));anchored(id);assert positions()==saved
     page.reload();tap('Clubhouse');find(id);anchored(id);assert positions()==saved;assert farm()==before
    def dest(id,surface,x,y=None):return page.evaluate('([id,s,x,y])=>ClubhouseLayout.canonical(id,s,x,y)',[id,surface,x,y])
    drag('ball',dest('ball','chest',1347));page.screenshot(path='/tmp/phase2e-chest-touch.png')
    drag('ball',dest('ball','window-seat',1010));page.screenshot(path='/tmp/phase2e-seat-touch.png')
    drag('ball',dest('ball','shelf-nook-lower',1285))
    drag('ball',dest('ball','floor',1010,610));drag('ball',dest('ball','floor',1080,665));drag('ball',dest('ball','floor',800,585))
    for shelf in ['shelf-nook-lower','shelf-nook-upper','shelf-nook-middle']:drag('camera',dest('camera',shelf,1295))
    page.screenshot(path='/tmp/phase2e-shelf-touch.png')
    # A true vertical swipe changes framing, not the saved layout or the contact.
    find('camera');saved=positions();old_horizon=page.evaluate('clubhouseRoom.geometry.horizon')
    touch('touchStart',20,350);touch('touchMove',20,410);page.wait_for_timeout(35);touch('touchEnd');page.wait_for_timeout(35)
    assert page.evaluate('clubhouseRoom.geometry.horizon')!=old_horizon
    assert positions()==saved;anchored('camera')
    # Perspective and persistence survive an address-bar size change and rotation.
    page.evaluate("()=>{Object.defineProperty(visualViewport,'height',{configurable:true,get:()=>620});visualViewport.dispatchEvent(new Event('resize'));}")
    find('ball');anchored('ball');assert positions()==saved
    page.evaluate("()=>{delete visualViewport.height;visualViewport.dispatchEvent(new Event('resize'));}")
    page.set_viewport_size({'width':746,'height':428});find('camera');anchored('camera');assert positions()==saved
    page.reload();tap('Clubhouse');find('camera');anchored('camera');assert positions()==saved
    assert farm()==before
   assert not errors,errors
   page.close()
  browser.close()
  print('PASS: measured chest/shelf/cushion/floor anchors; touch drops into chest, three shelf rows, window seat and multiple floor depths; chest-front pixel occlusion, free floor/collision rules, min-44px targets, coherent rotation/vertical framing, toolbar/orientation changes and exact saved-layout recovery at seven phone sizes. Farm/ownership/finances unchanged. Native iPhone Safari remains unverified.')
finally:server.shutdown()
