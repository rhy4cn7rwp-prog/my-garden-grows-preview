"""Phase 2D: touch panorama/long-press placement on isolated farms.
Chromium emulation is not physical iPhone Safari verification.
"""
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
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
  for width,height,top,bottom in [(320,360,0,0),(375,548,20,0),(390,664,47,34),(428,746,47,34),(428,892,47,34),(667,320,0,21),(926,368,0,21)]:
   page=browser.new_page(viewport={'width':width,'height':height},is_mobile=True,has_touch=True,device_scale_factor=2)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.set_default_timeout(5000)
   page.add_init_script("document.addEventListener('DOMContentLoaded',()=>{document.documentElement.style.setProperty('--viewport-safe-top','"+str(top)+"px');document.documentElement.style.setProperty('--viewport-safe-bottom','"+str(bottom)+"px');syncGameViewport();});")
   page.goto(f'http://127.0.0.1:{server.server_port}/');page.emulate_media(reduced_motion='reduce')
   page.evaluate("()=>{state.cash=2500;for(const d of Game.dreams)Game.purchaseDream(state,d.id);go('clubhouse');}")
   page.wait_for_function("document.querySelector('.clubhouse-world')?.dataset.painted==='true'")
   def tap(name):page.get_by_role('button',name=name,exact=True).tap()
   def look(angle):
    page.evaluate('a=>lookClubhouse(a)',angle)
    page.wait_for_function('a=>Math.abs(clubhouseRoom.yaw-a)<.1',arg=angle)
    page.wait_for_timeout(30)
   def stable():return page.evaluate("({...Object.fromEntries(Object.entries(state).filter(([k])=>k!=='clubhousePositions')),display:Object.fromEntries(Object.entries(state.display).filter(([,n])=>n>0))})")
   def find(id):
    tap('My treasures');assert page.locator('.dialog h2').inner_text()=='My treasures',(width,height,page.locator('.dialog').inner_text(),page.evaluate('clubhouseRoom.gesture'));name=page.evaluate('id=>Game.dreams.find(d=>d.id===id).name',id);tap('Find '+name)
    page.locator('[data-dream='+id+']').wait_for(state='visible');page.wait_for_timeout(30)
   def fit():
    data=page.evaluate("[...document.querySelectorAll('.clubhouse-game button:not([hidden])')].map(e=>({name:e.getAttribute('aria-label')||e.textContent,...e.getBoundingClientRect().toJSON()}))")
    for b in data:
     assert b['width']>=44 and b['height']>=44,(width,height,b)
     assert b['left']>=0 and b['right']<=width+1 and b['top']>=top-1 and b['bottom']<=height-bottom+1,(width,height,b)
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth && document.documentElement.scrollHeight<=innerHeight+1')
   before=stable();look(0);fit()
   # Actual touch swipes, including starting over a purchased reward.
   session=page.context.new_cdp_session(page)
   def touch(kind,x=0,y=0):session.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':[] if kind in ['touchEnd','touchCancel'] else [{'x':x,'y':y}]})
   def swipe(x1,y1,x2,y2):
    touch('touchStart',x1,y1)
    for i in range(1,9):touch('touchMove',x1+(x2-x1)*i/8,y1+(y2-y1)*i/8);page.wait_for_timeout(16)
    touch('touchEnd');page.wait_for_timeout(40)
   for id in ['bike','guitar','ball','camera','tablet','puppy']:
    find(id);fit();page.locator('[data-dream='+id+']').tap()
    assert page.locator('.dialog h2').inner_text()==page.evaluate('id=>Game.dreams.find(d=>d.id===id).name',id)
    tap('Close ✕')
   look(0);ball=page.locator('[data-dream=ball]').bounding_box()
   swipe(ball['x']+ball['width']/2,ball['y']+ball['height']/2,20,ball['y']+ball['height']/2)
   assert page.evaluate('clubhouseRoom.yaw')>0
   assert page.evaluate('state.clubhousePositions')=={}
   assert page.locator('.modal').count()==0
   for yaw in [-80,-60,-40,-20,0,20,40,60,80]:
    look(yaw);fit()
    # No black/transparent page-edge gaps or seams in the continuous painting.
    stats=page.evaluate("()=>{const c=clubhouseRoom.canvas,d=clubhouseRoom.ctx.getImageData(0,0,c.width,c.height).data;let black=0,alpha=0;for(let i=0;i<d.length;i+=400){if(d[i]+d[i+1]+d[i+2]<8)black++;if(d[i+3]!==255)alpha++;}return {black,alpha};}")
    assert stats['alpha']==0 and stats['black']<10,(width,height,yaw,stats)  # The painting contains a few genuinely near-black shadow pixels.
    assert stable()==before
   assert page.get_by_role('button',name='Look right',exact=True).is_disabled()
   swipe(width-30,height*.55,30,height*.55);assert page.evaluate('clubhouseRoom.yaw')==80
   look(-80);assert page.get_by_role('button',name='Look left',exact=True).is_disabled()
   swipe(30,height*.55,width-30,height*.55);assert page.evaluate('clubhouseRoom.yaw')==-80
   # Item info and default restores are reachable even if the item is out of view.
   find('ball');page.locator('[data-dream=ball]').tap();tap('Restore default position')
   assert page.evaluate('state.clubhousePositions')=={}
   if width==428 and height==746:
    for yaw in [-80,0,80]:look(yaw);page.screenshot(path=f'/tmp/phase2d-final-{yaw}.png')
    # Long press then drag into a valid, visible floor spot.
    look(0);box=page.locator('[data-dream=ball]').bounding_box();x=box['x']+box['width']/2;y=box['y']+box['height']/2
    dest=page.evaluate("roomItemPoint('ball',{angle:12,y:.83})")
    touch('touchStart',x,y);page.wait_for_timeout(480)
    assert page.locator('[data-moving]').count()==1
    assert page.locator('.clubhouse-drop-surfaces polygon').count()>0
    touch('touchMove',dest['x'],dest['y']);page.wait_for_timeout(40);touch('touchEnd');page.wait_for_timeout(40)
    placed=page.evaluate('state.clubhousePositions.ball');assert placed and placed['surface']=='floor',placed
    assert abs(placed['angle']-12)<1
    assert stable()==before
    # Dragging onto navigation or a wall cannot change a saved position.
    nav=page.get_by_role('button',name='Back to village',exact=True).bounding_box()
    for invalid in [(width/2,20),(width/2,180),(nav['x']+22,nav['y']+22)]:
     box=page.locator('[data-dream=ball]').bounding_box();touch('touchStart',box['x']+box['width']/2,box['y']+box['height']/2);page.wait_for_timeout(480)
     touch('touchMove',*invalid);page.wait_for_timeout(30);touch('touchEnd');page.wait_for_timeout(30)
     assert page.locator('.game').get_attribute('data-scene')=='clubhouse'
     assert page.evaluate('state.clubhousePositions.ball')==placed
    # Cancellation and a stationary hold do not consume a move or open details.
    box=page.locator('[data-dream=ball]').bounding_box()
    touch('touchStart',box['x']+box['width']/2,box['y']+box['height']/2);page.wait_for_timeout(480);touch('touchCancel');page.wait_for_timeout(30)
    assert page.evaluate('state.clubhousePositions.ball')==placed
    touch('touchStart',box['x']+box['width']/2,box['y']+box['height']/2);page.wait_for_timeout(480);touch('touchEnd');page.wait_for_timeout(30)
    assert page.evaluate('state.clubhousePositions.ball')==placed and page.locator('.modal').count()==0
    tap('Back to village');tap('Clubhouse');find('ball')
    assert page.evaluate('state.clubhousePositions.ball')==placed
    page.reload();tap('Clubhouse');find('ball');assert page.evaluate('state.clubhousePositions.ball')==placed
    assert stable()==before
    # Continuing to hold near an edge turns the same camera while moving.
    look(0);box=page.locator('[data-dream=ball]').bounding_box()
    touch('touchStart',box['x']+box['width']/2,box['y']+box['height']/2);page.wait_for_timeout(480)
    touch('touchMove',12,box['y']+box['height']/2);page.wait_for_timeout(1000)
    assert page.evaluate('clubhouseRoom.yaw')<-10
    touch('touchEnd');page.wait_for_timeout(40)
    assert page.evaluate('state.clubhousePositions.ball.angle')<0
    find('ball');page.locator('[data-dream=ball]').tap();tap('Restore default position')
    assert page.evaluate('state.clubhousePositions')=={}
    # A camera can move to an actual shelf, a bicycle cannot.
    find('camera');box=page.locator('[data-dream=camera]').bounding_box();look(18)
    dest=page.evaluate("roomItemPoint('camera',ClubhouseLayout.canonical('camera','shelf-nook-middle',1294))")
    box=page.locator('[data-dream=camera]').bounding_box();touch('touchStart',box['x']+box['width']/2,box['y']+box['height']/2);page.wait_for_timeout(480)
    touch('touchMove',dest['x'],dest['y']);page.wait_for_timeout(30);touch('touchEnd');page.wait_for_timeout(30)
    assert page.evaluate('state.clubhousePositions.camera.surface')=='shelf-nook-middle'
    tap('My treasures');tap('Restore all item positions');assert page.evaluate('state.clubhousePositions')=={}
    assert stable()==before
    # Button turns animate gently; reduced motion applies immediately.
    page.emulate_media(reduced_motion='no-preference');tap('Look right');page.wait_for_timeout(220)
    assert abs(page.evaluate('clubhouseRoom.yaw')-30)<.1
    page.emulate_media(reduced_motion='reduce');tap('Look straight ahead');page.wait_for_timeout(30)
    assert page.evaluate('clubhouseRoom.animation') is None and page.evaluate('clubhouseRoom.yaw')==0
    # Nothing keeps repainting a still room.
    page.wait_for_timeout(50);assert page.evaluate('clubhouseRoom.frame')==0
   assert not errors,errors
   page.close()
  assert (root/'assets/clubhouse/panorama.webp').stat().st_size<600000
  browser.close()
  print('PASS: ±80-degree fixed-camera touch panorama, continuous painted boundaries, all purchased items findable/tappable, seven safe-area phone layouts, swipe-vs-hold separation, floor/shelf placement, navigation exclusion, canceled/invalid drops, edge turning while dragging, saved/reloaded positions, individual/all restores, unchanged farm/ownership/finances and reduced motion. Native iPhone Safari remains unverified.')
finally:server.shutdown()
