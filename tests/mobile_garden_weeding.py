"""Educational weeding: actual tap/drag, hints, cycles and save-safe bonus activity.
Chromium phone/touch/safe areas; not native Safari hardware verification.
"""
import os
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from pathlib import Path
from playwright.sync_api import sync_playwright
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
root=Path(__file__).resolve().parents[1]
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)));Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  for w,h,top,bottom in [(320,440,20,0),(375,548,20,0),(428,746,47,34)]:
   page=browser.new_page(viewport={'width':w,'height':h},is_mobile=True,has_touch=True,ignore_https_errors=bool(os.environ.get('PREVIEW_URL')))
   page.set_default_timeout(7000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.add_init_script("document.addEventListener('DOMContentLoaded',()=>{document.documentElement.style.setProperty('--viewport-safe-top','"+str(top)+"px');document.documentElement.style.setProperty('--viewport-safe-bottom','"+str(bottom)+"px');syncGameViewport()})")
   page.goto(os.environ.get('PREVIEW_URL',f'http://127.0.0.1:{server.server_port}/'))
   def tap(name):page.get_by_role('button',name=name,exact=True).tap()
   def open_round():tap('Pull weeds');tap("Let's Weed!")
   def answer(i):return page.locator(f'[data-weed-answer="{i}"]')
   def solve():
    while page.evaluate('!!state.weedingLesson.session'):
     i=page.evaluate('GardenLearning.questions(state.weedingLesson.session).findIndex((q,i)=>!q.correct&&!state.weedingLesson.session.removed.includes(i))')
     answer(i).tap()
   def fit():
    assert page.locator('[data-weed-answer]').count()==4
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    for b in page.locator('[data-weed-answer]').all():
     r=b.bounding_box();assert r['width']>=44 and r['height']>=44
    close=page.get_by_role('button',name='Close ✕',exact=True);r=close.bounding_box();assert r['y']>=top-1 and r['y']+r['height']<=h-bottom+1,(w,h,r)
   page.evaluate("()=>{state=Game.initial();state.cash=123.45;state.seeds.carrot=7;state.dreamPurchaseCount=4;state.plots=Array.from({length:25},()=>({id:'carrot',age:3,left:0,quality:100,watered:false}));delete state.weedingLesson;delete state.weedingHarvest;delete state.weedingCredits;save()}")
   page.reload();page.evaluate("go('garden')")
   assert page.get_by_role('button',name='Pull weeds',exact=True).is_disabled()
   assert '4 game days' in page.locator('.garden-weeding-entry').inner_text()
   page.evaluate("()=>{for(let i=0;i<4;i++)Game.endDay(state);render()}")
   assert page.get_by_role('button',name='Pull weeds',exact=True).is_enabled()
   before=page.evaluate('JSON.stringify(state)');tap('Pull weeds');assert page.locator('.dialog h2').inner_text()=='Time to Weed!';tap('Not Now');assert page.evaluate('JSON.stringify(state)')==before
   # Start, close and resume keeps seeded questions exactly.
   open_round();fit();questions=page.evaluate('GardenLearning.questions(state.weedingLesson.session)');assert page.locator('.garden-round-label').inner_text()=='Round 1 of 3'
   tap('Close ✕');open_round();assert page.evaluate('GardenLearning.questions(state.weedingLesson.session)')==questions
   correct=next(i for i,q in enumerate(questions) if q['correct'])
   wrong=next(i for i,q in enumerate(questions) if not q['correct'])
   answer(correct).tap();assert page.locator('.garden-answer-correction').count()==0
   assert page.evaluate('state.weedingLesson.session.mistakes')==1
   answer(correct).tap();assert page.locator('.garden-answer-correction').count()==sum(not q['correct'] for q in questions)
   for e in page.locator('.garden-answer-correction').all():
    assert e.evaluate("e=>getComputedStyle(e).color")=='rgb(155, 31, 36)'
   assert page.evaluate('JSON.stringify([state.cash,state.inventory])')=='[123.45,{}]'
   page.reload();page.evaluate("go('garden')");open_round();assert page.evaluate('state.weedingLesson.session.mistakes')==2
   assert page.evaluate('GardenLearning.questions(state.weedingLesson.session)')==questions
   fit()
   # Drag into basket, including 8 real touch moves; not just a synthetic click.
   session=page.context.new_cdp_session(page)
   def touch(kind,x=0,y=0):session.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':[] if kind in ['touchEnd','touchCancel'] else [{'x':x,'y':y}]})
   def drag(i,valid=True):
    # Center the card and basket in the dialog's reading viewport.
    page.locator('.dialog').evaluate('e=>e.scrollTop=70')
    b=answer(i).bounding_box();target=page.locator('[data-weed-basket]').bounding_box()
    x,y=b['x']+b['width']/2,b['y']+b['height']/2;tx,ty=(target['x']+target['width']/2,target['y']+target['height']/2) if valid else (w-3,top+3)
    assert top<=y<h-bottom and top<=ty<h-bottom,(w,h,b,target)
    touch('touchStart',x,y)
    for k in range(1,9):touch('touchMove',x+(tx-x)*k/8,y+(ty-y)*k/8);page.wait_for_timeout(15)
    touch('touchEnd');page.wait_for_timeout(450)
   snapshot=page.evaluate('JSON.stringify(state.weedingLesson)');drag(wrong,False);assert page.evaluate('JSON.stringify(state.weedingLesson)')==snapshot
   drag(wrong)
   assert page.evaluate('state.weedingLesson.session.round>0||state.weedingLesson.session.removed.length>0')
   if w==428:page.screenshot(path='/tmp/garden-learning-hints.png')
   # Complete first round only; refresh must retain completed rounds, and no early bonus.
   while page.evaluate('state.weedingLesson.session.round')==0:
    i=page.evaluate('GardenLearning.questions(state.weedingLesson.session).findIndex((q,i)=>!q.correct&&!state.weedingLesson.session.removed.includes(i))');answer(i).tap()
   assert page.evaluate('state.weedingLesson.session.mistakes')==0
   assert page.locator('.garden-answer-correction').count()==0
   assert page.evaluate('state.plots.every(p=>!p.weedingBonus)')
   page.reload();page.evaluate("go('garden')");open_round();assert page.locator('.garden-round-label').inner_text()=='Round 2 of 3'
   solve();assert page.locator('.dialog h2').inner_text()=='Wonderful Weeding!'
   assert page.locator('.dialog button').all_text_contents()==['Back to the Garden.']
   assert page.evaluate('state.plots.every(p=>p.weedingBonus)')
   tap('Back to the Garden.');assert page.get_by_role('button',name='Pull weeds',exact=True).is_disabled()
   assert 'bonus' in page.locator('.garden-bonus-status').inner_text().lower()
   assert page.locator('.modal').count()==0
   # Individual picking never consumes another plant's bonus; reload and End Day preserve it.
   page.evaluate('harvest(0)');assert page.evaluate('state.inventory.carrot')==3
   page.reload();page.evaluate("go('garden')");assert page.evaluate('state.plots.filter(p=>p?.weedingBonus).length')==24
   tap('End Day');assert page.locator('.modal').count()==0
   assert page.evaluate('state.plots.filter(p=>p?.weedingBonus).length')==24
   tap('Harvest All Ready Crops');assert page.evaluate('state.inventory.carrot')==75
   assert page.evaluate('state.weedingHarvest') is None
   page.reload();page.evaluate("go('garden')");assert page.evaluate('state.inventory.carrot')==75
   assert page.evaluate('[state.cash,state.seeds.carrot]')==[123.45,7]
   assert page.get_by_role('button',name='Pull weeds',exact=True).is_disabled()
   # Next window alternates to spelling. Two hints retain original wrong spellings.
   page.evaluate("()=>{state.day=10;state.plots=Array.from({length:25},()=>({id:'carrot',age:3,left:0,quality:100,watered:false}));render()}")
   open_round();assert page.locator('.dialog h2').inner_text()=='Spelling Weeding';fit()
   q=page.evaluate('GardenLearning.questions(state.weedingLesson.session)');i=next(i for i,v in enumerate(q) if v['correct'])
   answer(i).tap();answer(i).tap();assert page.locator('.garden-answer-correction').count()>0
   if w==428:page.screenshot(path='/tmp/garden-learning-spelling.png')
   tap('Close ✕');assert page.evaluate('state.weedingLesson.session.mistakes')==2
   page.emulate_media(reduced_motion='reduce');open_round();assert page.locator('.garden-weed-patch').evaluate("e=>getComputedStyle(e).animationName")=='none'
   # Advanced decimal text and corrections wrap inside each card, not offscreen.
   page.evaluate("()=>{popup='';state.dreamPurchaseCount=10;state.day=15;state.weedingLesson.nextType='math';state.weedingLesson.session=null;let seed=1;do{state.weedingLesson.session=null;Game.startWeeding(state,seed++);}while(seed<80&&!GardenLearning.questions(state.weedingLesson.session).some(q=>q.original.includes('.')));renderGardenWeeding()}")
   q=page.evaluate('GardenLearning.questions(state.weedingLesson.session)');i=next(i for i,v in enumerate(q) if v['correct']);answer(i).tap();answer(i).tap();fit()
   for e in page.locator('.garden-answer-label,.garden-answer-correction').all():assert e.evaluate('e=>e.scrollWidth<=e.clientWidth+1')
   assert not errors,errors
   print(f'PASS cycles, confirmation/cancel/resume, 4 choices/3 rounds, actual touch drag, two-mistake hints, partial/complete saves, fair bonus and spelling {w}x{h}',flush=True)
   page.close()
  browser.close()
finally:server.shutdown()
