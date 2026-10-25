"""Furniture-relative rewards, coherent panning, visible touch targets and real large-item drag."""
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
  for w,h,t,b in [(320,360,0,0),(375,548,20,0),(390,664,47,34),(428,746,47,34),(428,892,47,34),(667,320,0,21)]:
   page=browser.new_page(viewport={'width':w,'height':h},is_mobile=True,has_touch=True,ignore_https_errors=bool(os.environ.get('PREVIEW_URL')))
   page.set_default_timeout(6000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.add_init_script("document.addEventListener('DOMContentLoaded',()=>{document.documentElement.style.setProperty('--viewport-safe-top','"+str(t)+"px');document.documentElement.style.setProperty('--viewport-safe-bottom','"+str(b)+"px');syncGameViewport()})")
   page.goto(os.environ.get('PREVIEW_URL',f'http://127.0.0.1:{server.server_port}/'));page.emulate_media(reduced_motion='reduce')
   page.evaluate("()=>{state=Game.initial();state.cash=2500;for(const d of Game.dreams)Game.purchaseDream(state,d.id);state=Game.recover(JSON.stringify(state));go('clubhouse')}")
   page.wait_for_function("document.querySelector('.clubhouse-world')?.dataset.composited==='true'")
   def tap(label):page.get_by_role('button',name=label,exact=True).tap()
   def farm():return page.evaluate('Object.fromEntries(Object.entries(state).filter(([k])=>k!=="clubhousePositions"))')
   def find(id):
    tap('My treasures');tap('Find '+page.evaluate('id=>Game.dreams.find(d=>d.id===id).name',id))
    page.locator('[data-dream='+id+']').wait_for(state='visible');page.wait_for_timeout(25)
   before=farm();lens=page.evaluate('clubhouseRoom.geometry.focal')
   for id in ['bike','guitar','ball','tablet','camera','puppy']:
    find(id)
    position=page.evaluate('id=>ClubhouseLayout.effective(state.clubhousePositions,id)',id)
    for offset in [-8,0,8]:
     page.evaluate('a=>lookClubhouse(a)',max(-80,min(80,position['angle']+offset)));page.wait_for_timeout(25)
     assert page.evaluate('clubhouseRoom.geometry.focal')==lens
     q=page.locator('[data-dream='+id+']').bounding_box();assert q is not None,(w,h,id,offset)
     assert q['width']>=44 and q['height']>=44
     assert q['x']>=0 and q['x']+q['width']<=w+1 and q['y']>=t-1 and q['y']+q['height']<=h-b+1,(w,h,id,q)
     info=page.evaluate('''id=>{const r=clubhouseRoom,p=ClubhouseLayout.effective(state.clubhousePositions,id),m=ClubhouseLayout.metrics(id,p),a=roomItemPoint(id,p);return {expected:m.width*r.geometry.paintedHeight/724/Math.max(.4,Math.cos((p.angle-r.yaw)*Math.PI/180)),actual:a.visualWidth}}''',id)
     assert abs(info['expected']-info['actual'])<.001
     if w==428 and h==746:page.screenshot(path=f'/tmp/clubhouse-size-{id}-{offset}.png')
    find(id);page.locator('[data-dream='+id+']').tap();assert page.locator('.dialog h2').inner_text()==page.evaluate('id=>Game.dreams.find(d=>d.id===id).name',id);assert page.evaluate('id=>ClubhouseLayout.placementHint(id)',id) in page.locator('.dialog').inner_text();tap('Close ✕')
   # A real press/hold moves the enlarged bicycle horizontally, not the camera.
   find('bike')
   if h>=500 or w==320:
    dest=page.evaluate("ClubhouseLayout.canonical('bike','floor',550,603)")
    old=page.evaluate("ClubhouseLayout.effective(state.clubhousePositions,'bike')")
    page.evaluate('a=>lookClubhouse(a)',(old['angle']+dest['angle'])/2);page.wait_for_timeout(25)
    q=page.locator('[data-dream=bike]').bounding_box();session=page.context.new_cdp_session(page)
    def touch(kind,x=0,y=0):session.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':[] if kind in ['touchEnd','touchCancel'] else [{'x':x,'y':y}]})
    touch('touchStart',q['x']+q['width']/2,q['y']+q['height']/2);page.wait_for_timeout(480)
    assert page.locator('[data-moving]').count()==1
    assert page.locator('.clubhouse-drop-surfaces polygon').evaluate_all("es=>es.length>0 && es.every(e=>e.dataset.surface==='floor')")
    assert 'clear floor' in page.locator('.clubhouse-status').inner_text()
    invalid=page.evaluate("()=>{const r=clubhouseRoom;return {x:(r.usable.left+r.usable.right)/2,y:Math.max(1,r.usable.top-5)}}")
    touch('touchMove',invalid['x'],invalid['y']);page.wait_for_timeout(30)
    assert page.evaluate('clubhouseRoom.drop') is None
    touch('touchEnd');page.wait_for_timeout(40)
    assert page.evaluate("ClubhouseLayout.effective(state.clubhousePositions,'bike')")==old
    assert 'returned to its last spot' in page.locator('.clubhouse-status').inner_text()
    q=page.locator('[data-dream=bike]').bounding_box()
    touch('touchStart',q['x']+q['width']/2,q['y']+q['height']/2);page.wait_for_timeout(480)
    assert page.locator('[data-moving]').count()==1
    target=page.evaluate('''p=>{const r=clubhouseRoom,q=ClubhouseLayout.project(p,r.yaw,r.geometry);return {x:q.x-r.gesture.grabDX,y:q.y-r.gesture.grabDY}}''',dest)
    touch('touchMove',target['x'],target['y']);page.wait_for_timeout(30)
    assert page.evaluate('clubhouseRoom.drop?.surface')=='floor'
    touch('touchEnd');page.wait_for_timeout(40)
    actual=page.evaluate('state.clubhousePositions.bike');assert abs(actual['angle']-dest['angle'])<.1 and abs(actual['y']-dest['y'])<.002
    assert farm()==before
    saved=page.evaluate('state.clubhousePositions');page.reload();tap('Clubhouse');find('bike')
    assert page.evaluate('state.clubhousePositions')==saved;assert farm()==before
   # Shared room-space comparison: a real child bicycle beside the approved ball.
   page.evaluate("()=>{Game.resetClubhouseLayout(state);Game.moveClubhouseItem(state,'ball',ClubhouseLayout.canonical('ball','floor',1125,548));Game.moveClubhouseItem(state,'bike',ClubhouseLayout.canonical('bike','floor',950,540));save();findClubhouseItem('bike');lookClubhouse(-11)}")
   page.wait_for_timeout(40)
   if w==428 and h==746:page.screenshot(path='/tmp/clubhouse-proportions-bike-ball.png')
   snapshot=page.evaluate('state.clubhousePositions');tap('Back to village');tap('Clubhouse');assert page.evaluate('state.clubhousePositions')==snapshot
   assert farm()==before
   assert not errors,errors
   print(f'PASS all six calibrated rewards, 3 viewing angles, fixed lens, accessible targets, bicycle hold/drag and saved room {w}x{h}',flush=True)
   page.close()
  browser.close()
finally:server.shutdown()
