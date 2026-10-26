"""Once-per-cycle End Day invitation, dialog choices and safe phone/reload behavior."""
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)));Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  for w,h,top,bottom in [(320,440,20,0),(375,548,20,0),(428,746,47,34)]:
   page=browser.new_page(viewport={'width':w,'height':h},is_mobile=True,has_touch=True);page.set_default_timeout(7000)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.add_init_script("document.addEventListener('DOMContentLoaded',()=>{document.documentElement.style.setProperty('--viewport-safe-top','"+str(top)+"px');document.documentElement.style.setProperty('--viewport-safe-bottom','"+str(bottom)+"px');syncGameViewport()})")
   page.goto(f'http://127.0.0.1:{server.server_port}/')
   def tap(name):page.get_by_role('button',name=name,exact=True).tap()
   def setup(day):page.evaluate("day=>{state=Game.initial();state.cash=123.45;state.season=Math.floor((day-1)/20)+1;state.day=(day-1)%20+1;state.plots[0]={id:'carrot',age:3,left:0,quality:100,watered:false};go('garden')}",day)
   def invitation():
    page.wait_for_function("dialogKey==='garden-weeding-confirm'")
    assert page.locator('.dialog h2').inner_text()=='Time to Weed!'
    assert page.locator('.dialog button').all_text_contents()==["Let's Weed!",'Not Now']
    for b in page.locator('.dialog button').all():
     b.scroll_into_view_if_needed();r=b.bounding_box();assert r['width']>=44 and r['height']>=44 and r['y']>=top and r['y']+r['height']<=h-bottom+1,(w,h,r)
   def absent():page.wait_for_timeout(150);assert page.locator('.modal').count()==0
   setup(4);tap('End Day');invitation();assert 'Day 5' in page.locator('.calendar').inner_text()
   assert page.evaluate('JSON.parse(localStorage.mgg10).weedingLesson.invitedCycle')==1
   before=page.evaluate('[state.cash,state.plots,state.inventory,state.weedingLesson.completedCycle,state.weedingCredits]')
   tap('Not Now');absent();assert page.evaluate('Game.weedingAvailable(state)')
   assert page.evaluate('[state.cash,state.plots,state.inventory,state.weedingLesson.completedCycle,state.weedingCredits]')==before
   page.evaluate("()=>{go('town');go('garden');scheduleGardenWeedingInvitation(4)}");absent()
   page.reload();assert page.evaluate('view')=='clubhouse';page.evaluate("go('garden')");absent()
   assert page.evaluate('state.weedingLesson.invitedCycle')==1
   tap('Pull weeds');invitation();tap("Let's Weed!");assert page.locator('[data-weed-answer]').count()==4
   progress=page.evaluate('state.weedingLesson');tap('Close ✕');page.reload();page.evaluate("go('garden')");absent();assert page.evaluate('state.weedingLesson')==progress
   tap('End Day');absent();assert 'Day 6' in page.locator('.calendar').inner_text()
   for day,new in [(19,20),(24,25)]:
    setup(day);tap('End Day');invitation();assert f'Day {new}' in page.locator('.calendar').inner_text();assert page.evaluate('state.weedingLesson.invitedCycle')==new//5;tap('Not Now');page.reload();page.evaluate("go('garden')");absent()
   setup(20);tap('End Day');absent();assert 'Season 2 · Day 21'==page.locator('.calendar').inner_text()
   setup(29);page.evaluate('state.plots[0].weedingBonus=true');tap('End Day');absent();assert page.evaluate('state.plots[0].weedingBonus')
   assert page.evaluate('state.weedingLesson.invitedCycle')==0
   # A user opening a crop, navigating away or starting a drag before the new
   # day's paint must cancel the queued prompt, not replace their activity.
   setup(4);page.evaluate('()=>{advanceGardenDay();plot(0)}');page.wait_for_timeout(150);assert page.evaluate('dialogKey')=='garden-crop';assert page.evaluate('state.weedingLesson.invitedCycle')==0;tap('Close ✕');absent()
   setup(4);page.evaluate('()=>{advanceGardenDay();water()}');absent();assert page.evaluate('state.weedingLesson.invitedCycle')==0
   setup(4);page.evaluate("()=>{advanceGardenDay();go('town')}");absent();page.evaluate("go('garden')");absent()
   setup(4);page.evaluate('()=>{advanceGardenDay();gardenUI.drag={}}');absent();assert page.evaluate('state.weedingLesson.invitedCycle')==0;page.evaluate('gardenUI.drag=null')
   setup(4);page.evaluate("()=>{advanceGardenDay();Object.defineProperty(document,'hidden',{configurable:true,value:true})}");absent();assert page.evaluate('state.weedingLesson.invitedCycle')==0
   page.evaluate("Object.defineProperty(document,'hidden',{configurable:true,value:false})")
   if w==428:
    setup(9);tap('End Day');invitation();page.screenshot(path='/tmp/garden-weeding-invitation-iphone.png')
   assert not errors,errors
   print(f'PASS automatic boundary invite, two choices, dismissal/manual start, saved once-only marker, season transitions, pending bonus and noninterruption {w}x{h}',flush=True)
   page.close()
  browser.close()
finally:server.shutdown()
