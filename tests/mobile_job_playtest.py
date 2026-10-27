"""Focused touch and visual-state checks for Phase 9 playtest refinements.
Uses Chromium touch at Safari-sized viewports; does not claim native Safari.
"""
import os,re
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
  for w,h in [(320,440),(375,548),(428,746)]:
   page=browser.new_page(viewport={'width':w,'height':h},is_mobile=True,has_touch=True,ignore_https_errors=bool(os.environ.get('PREVIEW_URL')));page.set_default_timeout(8000)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(os.environ.get('PREVIEW_URL',f'http://127.0.0.1:{server.server_port}/'))
   page.get_by_role('button',name=re.compile("^I'm still learning to read!")).tap()
   # Touch pointerup must select even if Safari never synthesizes a click.
   def pointer_up(el):
    el.dispatch_event('pointerdown',{'pointerId':77,'pointerType':'touch','isPrimary':False,'clientX':20,'clientY':20})
    el.dispatch_event('pointerup',{'pointerId':77,'pointerType':'touch','isPrimary':True,'clientX':20,'clientY':20})
   page.evaluate("()=>{state.cash=500;Game.purchaseDream(state,'ball');state.cash=37.25;state.seeds.carrot=8;state.inventory.carrot=7;state.jobs.cooldowns.words=Date.now()+120000;save();learningSettings()}")
   before=page.evaluate('JSON.stringify({cash:state.cash,seeds:state.seeds,plots:state.plots,owned:state.dreamPurchases,positions:state.clubhousePositions,inventory:state.inventory,equipment:state.owned,jobs:state.jobs})')
   for mode in ['growing','little','growing']:
    pointer_up(page.locator(f'[data-learning-choice="{mode}"]'))
    assert page.evaluate('state.learningExperience')==mode
    assert page.locator(f'[data-learning-choice="{mode}"]').get_attribute('aria-pressed')=='true'
    assert ('Growing' if mode=='growing' else 'Little') in page.locator('.learning-current').inner_text()
    assert page.evaluate('JSON.stringify({cash:state.cash,seeds:state.seeds,plots:state.plots,owned:state.dreamPurchases,positions:state.clubhousePositions,inventory:state.inventory,equipment:state.owned,jobs:state.jobs})')==before
   page.get_by_role('button',name='Close ✕',exact=True).tap();page.reload();assert page.evaluate('state.learningExperience')=='growing'
   assert page.evaluate('state.cash')==37.25
   def start(job,mode='growing'):
    page.evaluate("([job,mode])=>{Neighborhood.stop();closeDialog();Game.chooseExperience(state,mode);state.jobs=NeighborhoodJobs.empty();go('jobs');const random=Math.random;Math.random=()=>2/0xffffffff;try{Neighborhood.start(job)}finally{Math.random=random}}",[job,mode])
   def visual_stacks():
    assert page.evaluate("()=>{const d=state.jobs.active.data;return [...document.querySelectorAll('.job-stack')].every((el,i)=>JSON.stringify([...el.querySelectorAll('[data-stack-unit]')].map(x=>x.dataset.stackUnit))===JSON.stringify(d.crates[i].slice().reverse())&&el.querySelector('[data-stack-top]')?.dataset.stackUnit===d.crates[i].at(-1))}")
   start('stacks');initial=page.evaluate('state.jobs.active.data.crates');moves=page.evaluate('state.jobs.active.data.solution')
   for n,(a,b) in enumerate(moves[:5]):
    visual_stacks();pointer_up(page.locator('.job-stack').nth(a));assert page.locator('.job-stack').nth(a).get_attribute('aria-pressed')=='true'
    top=page.locator('.job-stack').nth(a).locator('[data-stack-top]');assert page.evaluate('(el)=>getComputedStyle(el).outlineStyle',top.element_handle())=='solid'
    pointer_up(page.locator('.job-stack').nth(b));visual_stacks()
    if page.evaluate('state.jobs.active.ended'):break
   page.get_by_role('button',name='Restart',exact=True).tap();assert page.evaluate('state.jobs.active.data.crates')==initial
   # An invalid full destination must not silently move a hidden item.
   a,b=page.evaluate("()=>{const d=state.jobs.active.data;for(let i=0;i<d.crates.length;i++)for(let j=0;j<d.crates.length;j++)if(i!==j&&d.crates[i].length&&d.crates[j].length===d.cap)return[i,j]}")
   page.locator('.job-stack').nth(a).tap();page.locator('.job-stack').nth(b).tap();assert page.evaluate('state.jobs.active.data.crates')==initial
   assert page.locator('.job-stack').nth(a).get_attribute('aria-pressed')=='true'
   page.locator('.job-stack').nth(a).tap() # deselect
   # Real touch drag moves the top item; Undo restores exact visual order.
   session=page.context.new_cdp_session(page)
   def touch(kind,x=0,y=0):session.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':[] if kind=='touchEnd' else [{'x':x,'y':y}]})
   def drag(source,target):
    source.scroll_into_view_if_needed();a=source.bounding_box();b=target.bounding_box();dy=(a['y']+a['height']/2+b['y']+b['height']/2)/2-(h+80)/2
    page.locator('#app').evaluate('(el,dy)=>el.scrollTop+=dy',dy);a=source.bounding_box();b=target.bounding_box();x,y=a['x']+a['width']/2,a['y']+a['height']/2;tx,ty=b['x']+b['width']/2,b['y']+b['height']/2
    touch('touchStart',x,y)
    for k in range(1,10):touch('touchMove',x+(tx-x)*k/9,y+(ty-y)*k/9);page.wait_for_timeout(12)
    touch('touchEnd');page.wait_for_timeout(100)
   a,b=moves[0];drag(page.locator('.job-stack').nth(a),page.locator('.job-stack').nth(b));assert page.evaluate('state.jobs.active.data.crates')!=initial;visual_stacks()
   page.get_by_role('button',name='Undo',exact=True).tap();assert page.evaluate('state.jobs.active.data.crates')==initial;visual_stacks()
   print(f'PASS touch-only mode changes/save preservation and top-only Stack Sort taps/drag/invalid/Undo/Restart {w}x{h}',flush=True)
   # Conveyor lanes move independently; tap alternative and saved queue positions.
   start('packing','little');assert page.locator('.job-lane').count()==3
   page.evaluate("()=>{NeighborhoodJobs.tick(state,1800);Neighborhood.pause()}")
   top=page.locator('[data-pack-item="0"]').evaluate('(el)=>parseFloat(el.style.top)');assert 14<top<72
   page.get_by_role('button',name='Play / Resume',exact=True).tap()
   item=page.locator('[data-pack-item="0"]');kind=page.evaluate('state.jobs.active.data.items[0]');item.tap(force=True);assert 'selected' in item.get_attribute('class'),page.locator('.job-feedback').inner_text();page.locator(f'[data-job-drop="{kind}"]').tap()
   assert page.evaluate('NeighborhoodJobs.packingFronts(state.jobs.active)')==[3,1,2]
   assert page.evaluate('NeighborhoodJobs.packingProgress(state.jobs.active,0)')<.2
   assert page.evaluate('NeighborhoodJobs.packingProgress(state.jobs.active,1)')>.2
   page.evaluate('Neighborhood.stop();save()');saved=page.evaluate('state.jobs.active');page.reload();assert page.evaluate('state.jobs.active')==saved
   # Horizontal row progression, healthy/unripe choices and effects in the world.
   for job,desired in [('weeds','weed'),('tomatoes','ripe')]:
    start(job,'little');row=page.locator('[data-job-row]');assert row.evaluate('(e)=>e.scrollWidth>e.clientWidth*2')
    bad=page.evaluate('(wanted)=>state.jobs.active.data.items.findIndex(x=>x.kind!==wanted)',desired)
    page.locator(f'.job-row-pick[data-item="{bad}"]').tap();assert page.evaluate('state.jobs.active.score')==0
    assert ('healthy plant' if job=='weeds' else 'still green') in page.locator('.job-feedback').inner_text()
    i=page.evaluate('(wanted)=>state.jobs.active.data.items.findIndex(x=>x.kind===wanted)',desired)
    source=page.locator(f'.job-row-pick[data-item="{i}"]');source.scroll_into_view_if_needed();before_scroll=row.evaluate('(e)=>e.scrollLeft');source.tap();assert page.evaluate('state.jobs.active.score')==1
    page.wait_for_timeout(400);assert abs(row.evaluate('(e)=>e.scrollLeft')-before_scroll)<2
    assert page.locator('.job-row-station').count()>=4;assert page.locator('.job-crop-stalk svg').count()>=4
    page.screenshot(path=f'/tmp/playtest-refined-{job}-{w}.png')
    state_before=page.evaluate('state.jobs.active');page.evaluate('Neighborhood.stop();save()');page.reload();assert page.evaluate('state.jobs.active.data')==state_before['data'];page.evaluate("go('jobs')");assert row.evaluate('(e)=>e.scrollLeft')>=0
   # Exactly 36 plots, comfortable hit areas, distinct dry/wet flower illustrations.
   start('flowers','little');assert page.locator('.job-flower-grid').locator(':scope > *').count()==36
   assert page.locator('.job-flower-bed').count()==9
   for el in page.locator('.job-flower-bed').all():
    r=el.bounding_box();assert r['width']>=44 and r['height']>=44,(w,r)
   page.locator('[data-job-drag="water"]').tap();first=page.locator('.job-flower-bed').first;first.tap();assert page.evaluate('state.jobs.active.score')==1
   assert page.locator('.job-flower-bed.blooming').count()==1
   assert page.locator('.job-flower-bed.blooming svg>g:last-child').count()==1
   # Caught carrot removed at the opening, misses never appear as caught.
   start('catch','little');page.evaluate("()=>{Neighborhood.stop();const a=state.jobs.active,c=NeighborhoodJobs.carrot(a,0),at=NeighborhoodJobs.catchTime(a,c);NeighborhoodJobs.action(state,{type:'basket',x:NeighborhoodJobs.carrotPose(a,c,at).x});NeighborhoodJobs.tick(state,at);render();JobScenes.paint(a,null,null)}")
   assert page.locator('[data-flying-carrot="0"]').count()==0;assert page.locator('.job-catching-basket.caught').count()==1;assert page.locator('.job-catch-glow>b').inner_text()=='+1'
   assert page.locator('.job-jones .jones-body').count()==1
   page.screenshot(path=f'/tmp/playtest-refined-catch-{w}.png')
   # Match effects award points in-place and leave a stable playable board.
   start('match','little');a,b=page.evaluate('NeighborhoodJobs.moves(state.jobs.active.data.grid)[0]');page.locator(f'[data-match-cell="{a}"]').tap();page.locator(f'[data-match-cell="{b}"]').tap()
   assert page.locator('.job-match-burst').count()==1,(page.evaluate('state.jobs.active.score'),page.locator('.job-pop').count(),page.locator('.job-feedback').inner_text());assert page.locator('.job-pop').count()>=4
   page.wait_for_timeout(1300);assert page.locator('.job-match-burst').count()==0;assert page.evaluate('NeighborhoodJobs.matches(state.jobs.active.data.grid).length')==0
   page.emulate_media(reduced_motion='reduce');start('catch','little');assert page.locator('.jones-body').evaluate('(e)=>getComputedStyle(e).animationName')=='none'
   start('packing','little');assert page.locator('.job-belt-surface').first.evaluate('(e)=>getComputedStyle(e).animationName')=='none'
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   assert not errors,errors
   print(f'PASS three queues, row worlds, 36 beds, opening collision, match effects, reduced motion and reload {w}x{h}',flush=True)
   page.close()
  browser.close()
finally:server.shutdown()
