"""Focused Job Board polish checks using touch at three iPhone usable sizes."""
import os
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
class Q(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Q,directory=str(Path(__file__).resolve().parents[1])));Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  for w,h in [(320,440),(375,548),(428,746)]:
   page=b.new_page(viewport={'width':w,'height':h},is_mobile=True,has_touch=True,ignore_https_errors=bool(os.environ.get('PREVIEW_URL')));errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(os.environ.get('PREVIEW_URL',f'http://127.0.0.1:{server.server_port}/'))
   def start(id,mode):page.evaluate("([id,mode])=>{Neighborhood.stop();closeDialog();state=Game.newGame();state.cash=83.25;Game.chooseExperience(state,mode);Neighborhood.start(id)}",[id,mode])
   def tap(name):page.get_by_role('button',name=name,exact=True).tap()
   for mode in ['little','growing']:
    start('tomatoes',mode);assert page.evaluate('state.jobs.active.data.target')==20
    assert page.locator('.row-tomato small').count()==0
    assert page.locator('.row-tomato.unripe').count()==20
    page.screenshot(path=f'/tmp/polish-tomatoes-{mode}-{w}.png')
    print('PASS tomato labels absent; red/green and twenty-harvest data',mode,w,flush=True)
    start('hidden',mode);page.locator('[data-picture-begin]').tap()
    assert page.evaluate("()=>{const a=state.jobs.active,s=JobGallery.hidden[a.data.scene];return [...document.querySelectorAll('.seek-checklist button')].every((b,n)=>{const o=s.objects[a.data.targets[n]],image=b.querySelector('img');return b.getAttribute('aria-label').startsWith(o.name)&&image.getAttribute('src')===JobClues.file(o)})}")
    page.evaluate('()=>{window.spoken=[];Narration.speak=(text)=>window.spoken.push(text)}');page.locator('.seek-checklist button').first.tap();assert page.evaluate('window.spoken.length')==1,page.evaluate('window.spoken')
    for el in page.locator('.seek-checklist button').all():assert el.bounding_box()['width']>=44 and el.bounding_box()['height']>=44
    page.screenshot(path=f'/tmp/polish-hidden-{mode}-{w}.png')
    print('PASS real-object picture clues, names/audio and touch targets',mode,w,flush=True)
    start('sliding',mode);page.locator('[data-picture-begin]').tap();assert page.locator('.picture-tile').count()==(5 if mode=='little' else 8)
    assert page.evaluate('state.jobs.active.data.rows')==3
    first=page.evaluate('state.jobs.active.data.solution[0]');page.locator(f'[data-picture-tile="{first}"]').tap();tap('Restart');assert page.evaluate('state.jobs.active.data.moves')==0
    tap('Hint');assert page.locator('.hint-tile').count()==1
    for cell in page.evaluate('state.jobs.active.data.solution'):
     if page.evaluate('state.jobs.active.ended'):break
     page.locator(f'[data-picture-tile="{cell}"]').tap();page.wait_for_timeout(160)
    assert page.evaluate('state.jobs.active.won');tap('Collect $1');page.wait_for_function('state.cash===84.25');page.evaluate('Neighborhood.collect()');assert page.evaluate('state.cash')==84.25
    page.reload();assert page.evaluate('state.cash')==84.25
    print('PASS gentle sliding grid, hints, restart, legal completion and saved reward',mode,w,flush=True)
    start('tidy',mode)
    route,flower=page.evaluate("()=>{const d=state.jobs.active.data,f=d.cells.findIndex(c=>c.obstacle==='flower'),queue=[0],paths=new Map([[0,[]]]);for(const i of queue){if(Math.abs(i%d.width-f%d.width)+Math.abs(Math.floor(i/d.width)-Math.floor(f/d.width))===1)return [paths.get(i),f];for(const n of JobLawn.neighbors(d,i))if(!paths.has(n)){paths.set(n,[...paths.get(i),n]);queue.push(n)}}}")
    for cell in route:
     cur=page.evaluate('state.jobs.active.data.mower');direction='right' if cell==cur+1 else 'left' if cell==cur-1 else 'down' if cell>cur else 'up';tap('Mow '+direction)
    el=page.locator(f'[data-lawn-cell="{flower}"]');el.scroll_into_view_if_needed();r=el.bounding_box();page.touchscreen.tap(r['x']+r['width']/2,r['y']+r['height']/2)
    if page.evaluate("state.jobs.active.data.stage==='flowerPause'"):
     assert page.get_by_text('You mowed my flowers!',exact=True).is_visible();tap('Try Again')
    assert page.evaluate('state.jobs.active.data.resets')==1
    assert page.evaluate('state.jobs.active.data.mower')==0
    assert page.evaluate('state.cash')==83.25
    assert page.evaluate('state.jobs.active.data.stage')=='mow'
    page.evaluate('Neighborhood.stop();save()');saved=page.evaluate('state.jobs.active');page.reload();assert page.evaluate('state.jobs.active')==saved
    print('PASS touch flower collision resets mowing once; wallet and save intact',mode,w,flush=True)
   assert not errors,errors
   page.close()
  b.close()
finally:server.shutdown()
