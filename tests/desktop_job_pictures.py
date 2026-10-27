"""Mouse controls use clicks rather than the touch-release path."""
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
class Q(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
s=ThreadingHTTPServer(('127.0.0.1',0),partial(Q,directory=str(Path(__file__).resolve().parents[1])));Thread(target=s.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1024,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(f'http://127.0.0.1:{s.server_port}/')
  for id in ['hidden','sliding']:
   page.evaluate("id=>{Neighborhood.stop();state=Game.newGame();Game.chooseExperience(state,'growing');Neighborhood.start(id)}",id);page.locator('[data-picture-begin]').click()
   if id=='hidden':
    xy=page.evaluate("()=>{const a=state.jobs.active,o=JobGallery.hidden[a.data.scene].objects[a.data.targets[0]],r=document.querySelector('.seek-canvas').getBoundingClientRect();return [r.x+(o.x+o.w/2)*r.width,r.y+(o.y+o.h/2)*r.height]}");page.mouse.click(*xy);assert page.evaluate('state.jobs.active.score')==1
    page.get_by_role('button',name='Zoom in',exact=True).click();r=page.locator('[data-picture-world]').bounding_box();page.mouse.move(r['x']+r['width']/2,r['y']+r['height']/2);page.mouse.down();page.mouse.move(r['x']+r['width']/2+25,r['y']+r['height']/2+25,steps=6);page.mouse.up();assert page.evaluate('state.jobs.active.score')==1
   else:
    cell=page.evaluate('state.jobs.active.data.solution[0]');page.locator(f'[data-picture-tile="{cell}"]').click();assert page.evaluate('state.jobs.active.data.moves')==1
    page.get_by_role('button',name='Restart',exact=True).click();assert page.evaluate('state.jobs.active.data.moves')==0
   page.get_by_role('button',name='Leaderboard',exact=True).last.click();assert page.locator('.job-play.is-paused').count()==1
   print('PASS desktop mouse',id,flush=True)
  assert not errors,errors;b.close()
finally:s.shutdown()
