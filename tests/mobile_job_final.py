"""Final Job Board touch checks at iPhone-sized usable viewports."""
import os
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
from pathlib import Path
from playwright.sync_api import sync_playwright
class Q(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Q,directory=str(Path(__file__).resolve().parents[1])));Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  for w,h in [(320,440),(375,548),(428,746)]:
   page=b.new_page(viewport={'width':w,'height':h},is_mobile=True,has_touch=True,ignore_https_errors=bool(os.environ.get('PREVIEW_URL')));errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(os.environ.get('PREVIEW_URL',f'http://127.0.0.1:{server.server_port}/'))
   def start(id,mode):page.evaluate("([id,mode])=>{Neighborhood.stop();closeDialog();state=Game.newGame();state.cash=76.35;Game.chooseExperience(state,mode);Neighborhood.start(id)}",[id,mode])
   def tap(name):page.get_by_role('button',name=name,exact=True).tap()
   for mode in ['little','growing']:
    start('words',mode);assert page.locator('.job-word-list li').count()==8
    paths=page.evaluate('Object.values(state.jobs.active.data.paths)')
    for path in paths:
     page.locator(f'[data-letter="{path[0]}"]').tap();page.locator(f'[data-letter="{path[-1]}"]').tap()
    assert page.evaluate('state.jobs.active.won');tap('Collect $1');page.wait_for_function('state.cash===77.35');print('PASS eight selectable words, marks, completion reward',mode,w,flush=True)
    start('hidden',mode);page.locator('[data-picture-begin]').tap();assert page.locator('.isolated-job-clue').count()==page.evaluate('state.jobs.active.data.targets.length');assert page.locator('.seek-checklist svg').count()==0
    assert page.evaluate("()=>[...document.querySelectorAll('.isolated-job-clue')].every(i=>i.complete&&i.naturalWidth&&i.getAttribute('src').startsWith('assets/job-clues/'))")
    print('PASS clean isolated object clues',mode,w,flush=True)
    start('tidy',mode);buttons={n:page.get_by_role('button',name='Mow '+n,exact=True).bounding_box() for n in ['up','left','down','right']};assert buttons['up']['y']<buttons['down']['y'];assert abs(buttons['up']['x']-buttons['down']['x'])<1;assert abs(buttons['left']['y']-buttons['right']['y'])<1
    assert max(r['y']+r['height'] for r in buttons.values())<=page.locator('.job-main-actions').bounding_box()['y']+1
    route,flower=page.evaluate("()=>{const d=state.jobs.active.data,f=d.cells.findIndex(c=>c.obstacle==='flower'),q=[0],paths=new Map([[0,[]]]);for(const i of q){if(Math.abs(i%d.width-f%d.width)+Math.abs(Math.floor(i/d.width)-Math.floor(f/d.width))===1)return [paths.get(i),f];for(const j of JobLawn.neighbors(d,i))if(!paths.has(j)){paths.set(j,[...paths.get(i),j]);q.push(j)}}}")
    for cell in route:
     cur=page.evaluate('state.jobs.active.data.mower');tap('Mow '+('right' if cell==cur+1 else 'left' if cell==cur-1 else 'down' if cell>cur else 'up'))
    el=page.locator(f'[data-lawn-cell="{flower}"]');r=el.bounding_box();page.touchscreen.tap(r['x']+r['width']/2,r['y']+r['height']/2)
    assert page.evaluate('state.jobs.active.data.stage')=='flowerPause';assert page.evaluate('state.jobs.active.data.mower')==flower;assert page.get_by_text('You mowed my flowers!',exact=True).is_visible()
    elapsed=page.evaluate('state.jobs.active.elapsed');page.wait_for_timeout(200);assert page.evaluate('state.jobs.active.elapsed')==elapsed
    page.screenshot(path=f'/tmp/final-homeowner-{mode}-{w}.png');page.reload();page.evaluate("go('jobs')");assert page.evaluate('state.jobs.active.data.stage')=='flowerPause';tap('Try Again');assert page.evaluate('state.jobs.active.data.stage')=='mow';assert page.evaluate('state.jobs.active.data.mower')==0;assert page.evaluate('state.cash')==76.35
    print('PASS D-pad, stopped flower collision, homeowner, pause, reload and Try Again',mode,w,flush=True)
    start('catch',mode);assert page.evaluate('state.jobs.active.data.tosses.length')>(26 if mode=='little' else 40)
    page.evaluate("()=>{Neighborhood.stop();NeighborhoodJobs.tick(state,44000-state.jobs.active.elapsed);render();JobScenes.paint(state.jobs.active,null,null)}");assert page.locator('[data-flying-carrot]').count()>0
    print('PASS accelerating variable carrot rendering',mode,w,flush=True)
   # Every longest label stays on one row, with distinct tray/answer controls.
   for word in page.evaluate('JobVocabulary.all.filter(w=>w.length>=9)'):
    start('labels','growing');page.evaluate("word=>{const a=state.jobs.active;a.wordPlan=[word,...JobVocabulary.all.filter(w=>w!==word).slice(0,2)];state.jobs=NeighborhoodJobs.recover(state.jobs);render()}",word)
    for selector in ['.free-letter-slots button','.free-letter-tray button']:
     rects=[el.bounding_box() for el in page.locator(selector).all()];assert max(r['y'] for r in rects)-min(r['y'] for r in rects)<1,(w,word,selector,rects);assert min(r['width'] for r in rects)>=22;assert all(r['x']>=0 and r['x']+r['width']<=w+1 for r in rects)
    page.locator('.free-letter-tray').scroll_into_view_if_needed();page.screenshot(path=f'/tmp/final-label-{word}-{w}.png')
   print('PASS longest scrambled words never split',w,flush=True)
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');assert not errors,errors;page.close()
  b.close()
finally:server.shutdown()
