"""New-player economy, experience switches, optional audio and both market paths."""
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
  for w,h,top,bottom in [(320,440,20,0),(375,548,20,0),(428,746,47,34)]:
   page=browser.new_page(viewport={'width':w,'height':h},is_mobile=True,has_touch=True,ignore_https_errors=bool(os.environ.get('PREVIEW_URL')));page.set_default_timeout(8000)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.add_init_script("""window.__spoken=[];window.__cancels=0;window.__audio=[];Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{cancel(){window.__cancels++},speak(u){window.__spoken.push(u.text)},getVoices(){return []}}});window.SpeechSynthesisUtterance=class{constructor(text){this.text=text}};const RealAudio=window.Audio;window.Audio=class extends RealAudio{constructor(path){super(path);this.addEventListener('loadedmetadata',()=>window.__audio.push({path,duration:this.duration}));}};""")
   page.add_init_script("document.addEventListener('DOMContentLoaded',()=>{document.documentElement.style.setProperty('--viewport-safe-top','"+str(top)+"px');document.documentElement.style.setProperty('--viewport-safe-bottom','"+str(bottom)+"px');syncGameViewport()})")
   page.goto(os.environ.get('PREVIEW_URL',f'http://127.0.0.1:{server.server_port}/'))
   def tap(name):page.get_by_role('button',name=name,exact=True).tap()
   assert page.evaluate('state.cash')==0;assert page.evaluate('window.__spoken.length')==0
   page.get_by_role('button',name=re.compile("^I'm still learning to read!")).tap()
   page.evaluate("go('seeds')");tap('Free starter assortment');assert page.evaluate('state.seeds')=={'carrot':3,'beans':2,'lettuce':2};assert page.evaluate('state.cash')==0
   tap('Go plant!');page.reload();assert page.evaluate('state.experienceChosen')
   page.evaluate("go('seeds')");assert page.get_by_role('button',name='Free starter assortment',exact=True).count()==0
   page.evaluate("go('jobs')");page.locator('[data-job-card="labels"]').tap()
   assert page.evaluate('window.__spoken.length')==0
   tap('Hear the word');assert page.evaluate('window.__spoken.length')==1
   letter=page.evaluate('state.jobs.active.data.words[0][0]');page.get_by_role('button',name=f'Hear {letter} sound',exact=True).tap()
   page.wait_for_function('window.__audio.length>0');assert page.evaluate('window.__audio[0].duration')>0
   durations=page.evaluate("async()=>{const c=new AudioContext(),out=[];for(const l of 'sunpotmdig'){const r=await fetch('assets/neighborhood/phonics/'+l+'.wav'),b=await c.decodeAudioData(await r.arrayBuffer());out.push(b.duration);}await c.close();return out}");assert all(d>0 for d in durations)
   page.locator('[data-job-drag="letter"]').first.tap();tap('Pause');puzzle=page.evaluate('state.jobs.active')
   tap('Clubhouse');page.evaluate("go('town')");tap('Settings')
   tap("I'm ready for a challenge! · Growing Gardener");assert page.evaluate('state.learningExperience')=='growing';assert page.evaluate('state.jobs.active')==puzzle
   page.get_by_label('Character narration',exact=True).check();assert page.evaluate('state.narrationEnabled') is True
   assert page.evaluate('state.effectsEnabled') is False
   page.get_by_label('Sound effects',exact=True).check();assert page.evaluate('state.effectsEnabled') is True
   tap('Close ✕');page.reload();assert page.evaluate('[state.learningExperience,state.narrationEnabled,state.effectsEnabled]')==['growing',True,True]
   page.evaluate("go('jobs')");assert page.evaluate('state.jobs.active.mode')=='little';assert page.evaluate('state.jobs.active.data.slots')==puzzle['data']['slots']
   tap('Play / Resume');page.wait_for_timeout(150);tap('Pause');elapsed=page.evaluate('state.jobs.active.elapsed')
   page.evaluate("()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))}");page.wait_for_timeout(150);assert page.evaluate('state.jobs.active.elapsed')==elapsed
   page.evaluate("()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'))}")
   assert page.get_by_role('button',name='Play / Resume',exact=True).count()==1
   # Unavailable voices never block a written activity.
   page.evaluate("()=>{Object.defineProperty(window,'speechSynthesis',{configurable:true,value:undefined});Narration.speak('Still readable','guide',true)}");assert 'unavailable' in page.evaluate('Narration.status')
   # Earn entirely through jobs, not a wallet grant. Every claim stays $1.
   page.evaluate("()=>{NeighborhoodJobs.quit(state);state.jobs.cooldowns={};for(let i=0;i<20;i++){const now=Date.now()+i*300001;NeighborhoodJobs.start(state,'flowers',now,i+1);while(!state.jobs.active.ended){const item=state.jobs.active.data.items.findIndex(v=>!v.done);NeighborhoodJobs.action(state,{type:'chore',item});}NeighborhoodJobs.claim(state,now);}save();go('supplies')}")
   assert page.evaluate('state.cash')==20
   tap('Equipment & rentals');page.get_by_role('button',name=re.compile('^Starter equipment')).tap()
   assert '$20.00' in page.locator('.dialog').inner_text();tap('Buy missing setup for $20.00');assert page.evaluate('state.cash')==0
   assert page.evaluate('[state.owned.table,state.owned.scale,state.cashRegister,state.bagCount]')==[1,1,True,10]
   tap('Visit Farmers Market');page.evaluate("()=>{state.inventory.carrot=state.display.carrot=10;Game.chooseExperience(state,'little');render()}")
   tap('Arrange Produce / Open Market');tap('Open market');tap('Welcome Next Customer');tap('Hi! What can I get for you?');tap('🧺 Fill customer basket')
   wants=page.evaluate('state.customer.want');assert len(wants)==1
   for id,n in wants.items():
    name=page.evaluate('id=>crop(id).name',id)
    for _ in range(n):tap('Add '+name)
   assert page.get_by_role('button',name='Calculate total',exact=True).count()==0
   total=page.evaluate('Game.totalOrder(state)');tap('Bag order & collect payment');assert page.evaluate('state.cash')==total
   assert page.evaluate('state.bagCount')==9 and page.evaluate('state.step')=='thanks'
   # Save/recover the paid-but-not-yet-farewelled customer with no second payment.
   page.reload();tap('Resume Market');assert page.evaluate('state.step')=='thanks';assert page.evaluate('state.cash')==total
   tap('Thanks for shopping with us!')
   page.evaluate("()=>{Game.chooseExperience(state,'growing');render()}");tap('Welcome Next Customer');tap('Hi! What can I get for you?');tap('🧺 Fill customer basket')
   assert page.get_by_role('button',name='Calculate total',exact=True).count()==1
   assert page.evaluate('state.cash')==total
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   # Little Gardener receives one visual nature round even after many dreams.
   page.evaluate("()=>{Game.chooseExperience(state,'little');state.dreamPurchaseCount=20;state.day=4;state.marketOpen=false;state.customer=null;state.plots[0]={id:'carrot',age:0,left:0,quality:100,watered:false};go('garden')}")
   tap('End Day');tap('Water All and End Day');page.wait_for_function("dialogKey==='garden-weeding-confirm'");tap("Let's Weed!")
   assert page.evaluate('state.weedingLesson.session.type')=='nature'
   assert page.locator('.garden-round-label').inner_text()=='Round 1 of 1'
   assert not any(re.search(r'[0-9=×]',x) for x in page.locator('.garden-answer-label').all_text_contents())
   while page.evaluate('!!state.weedingLesson.session'):
    i=page.evaluate('GardenLearning.questions(state.weedingLesson.session).findIndex((q,i)=>!q.correct&&!state.weedingLesson.session.removed.includes(i))');page.locator(f'[data-weed-answer="{i}"]').tap()
   tap('Back to the Garden.');assert page.evaluate('state.plots[0].weedingBonus') is True
   # Card cooldowns expire live and quietly without a popup or narration.
   page.evaluate("()=>{NeighborhoodJobs.quit(state);go('jobs');state.jobs.cooldowns.words=Date.now()+1000;render()}")
   before=page.evaluate('window.__spoken.length');page.locator('[data-job-card="words"]').wait_for();assert page.locator('[data-job-card="words"]').is_disabled()
   page.wait_for_function("!document.querySelector('[data-job-card=words]').disabled")
   assert page.locator('.modal').count()==0;assert page.evaluate('window.__spoken.length')==before
   assert not errors,errors
   print(f'PASS $0/new-only seeds, modes/job recovery, audio prefs/TTS fallback/phoneme decode, 20 job earnings, $20 kit and both market paths {w}x{h}',flush=True)
   page.close()
  browser.close()
finally:server.shutdown()
