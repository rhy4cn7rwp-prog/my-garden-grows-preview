"""Free device speech UI and touch regressions; deterministic voice mocks, no cloud TTS.
Use MGG_BROWSER=webkit with PLAYWRIGHT_BROWSERS_PATH for WebKit (not native Safari).
"""
import os,re,json
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
mock="""window.__speech=[];window.__cancel=0;window.__voiceListeners=[];window.__voices=[];window.__utterance=null;
window.__setVoices=v=>{window.__voices=v;window.__voiceListeners.forEach(f=>f())};
window.__local=(name,lang='en-US')=>({name,lang,voiceURI:name,localService:true});
Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{getVoices(){return window.__voices},cancel(){window.__cancel++;window.__utterance=null},addEventListener(k,f){if(k==='voiceschanged')window.__voiceListeners.push(f)},speak(u){if(window.__utterance)throw new Error('Overlapping speech');window.__utterance=u;window.__speech.push({text:u.text,rate:u.rate,pitch:u.pitch,lang:u.lang,voice:u.voice?.name})}}});
window.SpeechSynthesisUtterance=class{constructor(text){this.text=text}};
window.__finish=()=>{const u=window.__utterance;window.__utterance=null;u?.onend()};
"""
try:
 with sync_playwright() as p:
  engine=os.environ.get('MGG_BROWSER','chromium')
  browser=p.webkit.launch() if engine=='webkit' else p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  for w,h,top,bottom in [(320,440,20,0),(375,548,20,0),(428,746,47,34),(1024,768,0,0)]:
   page=browser.new_page(viewport={'width':w,'height':h},is_mobile=w<600,has_touch=True,ignore_https_errors=bool(os.environ.get('PREVIEW_URL')))
   page.set_default_timeout(10000)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.add_init_script(mock)
   page.add_init_script("document.addEventListener('DOMContentLoaded',()=>{document.documentElement.style.setProperty('--viewport-safe-top','"+str(top)+"px');document.documentElement.style.setProperty('--viewport-safe-bottom','"+str(bottom)+"px');syncGameViewport()})")
   page.goto(os.environ.get('PREVIEW_URL',f'http://127.0.0.1:{server.server_port}/'))
   def tap(name):page.get_by_role('button',name=name,exact=True).tap()
   def stop():page.evaluate('Narration.stop()')
   def flush():
    page.evaluate('()=>{let n=0;while(window.__utterance&&n++<100)window.__finish()}')
   assert page.evaluate('window.__speech.length')==0
   page.get_by_role('button',name=re.compile("^I'm ready for a challenge!")).tap()
   page.evaluate("go('town')");tap('Settings')
   assert page.locator('#narration-voice option').count()==1
   tap('Test Voice');assert page.evaluate('window.__speech.length')==0
   # Async list arrives; queued user request uses best local English only.
   page.evaluate("__setVoices([__local('Fred'),__local('Samantha'),__local('Ava (Enhanced)'),__local('Daniel','en-GB'),{name:'Remote Natural',voiceURI:'remote',lang:'en-US',localService:false},__local('French Premium','fr-FR')])")
   assert page.evaluate('window.__speech[0].voice')=='Ava (Enhanced)'
   assert page.locator('#narration-voice option').count()==5
   assert 'Remote' not in page.locator('#narration-voice').inner_text()
   # Voice events update the list in place, keeping focus and settings intact.
   stop();page.locator('#narration-voice').select_option('Daniel|en-GB')
   page.locator('#narration-speed').select_option('1.1');tap('Test Voice')
   assert page.evaluate('window.__speech.at(-1).voice')=='Daniel'
   assert page.evaluate('window.__speech.at(-1).rate')==1.1
   assert page.evaluate('window.__speech.at(-1).lang')=='en-GB'
   page.locator('#narration-voice').focus();page.evaluate('__setVoices(__voices)')
   assert page.evaluate("document.activeElement.id")=='narration-voice'
   page.locator('.narration-settings').get_by_role('button',name='Stop reading',exact=True).tap();assert not page.evaluate('Narration.busy')
   # Settings can scroll on a short phone, with all real controls >=44px.
   for selector in ['#narration-voice','#narration-speed','.narration-settings button']:
    for node in page.locator(selector).all():
     node.scroll_into_view_if_needed();box=node.bounding_box();assert box['height']>=44 and box['width']>40,(selector,box)
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   if w==375:page.screenshot(path=f'/tmp/narration-settings-{engine}.png')
   tap('Close ✕');assert not page.evaluate('Narration.busy')
   before=page.evaluate('JSON.stringify(Game.recover(JSON.stringify(state)))')
   page.reload();assert page.evaluate('[state.narrationVoice,state.narrationSpeed]')==['Daniel|en-GB',1.1]
   assert page.evaluate('JSON.stringify(Game.recover(JSON.stringify(state)))')==before
   # Another device cannot resolve selected voice: fallback without erasing preference.
   page.evaluate("__setVoices([__local('Samantha')]);learningSettings()")
   assert 'Saved voice unavailable' in page.locator('#narration-voice').inner_text()
   tap('Test Voice');assert page.evaluate('window.__speech.at(-1).voice')=='Samantha'
   assert 'saved voice is unavailable' in page.locator('[data-narration-status]').inner_text()
   tap('Close ✕')
   # Universal reader reaches every location, preserves layout/money, cancels on navigation.
   cash=page.evaluate('state.cash')
   for view in ['clubhouse','town','garden','seeds','supplies','dream','market','jobs']:
    page.evaluate('v=>go(v)',view)
    node=page.get_by_role('button',name='Read this screen',exact=True);box=node.bounding_box()
    assert box['width']>=44 and box['height']>=44 and box['x']>=0 and box['x']+box['width']<=w,(engine,w,view,box)
    node.tap();assert page.evaluate('Narration.busy')
    assert page.evaluate('window.__speech.at(-1).rate')==1.1
    page.get_by_role('button',name='Stop reading',exact=True).first.tap();assert not page.evaluate('Narration.busy')
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(engine,w,view)
   assert page.evaluate('state.cash')==cash
   # All six guide pages use chosen device voice and cancel the previous page.
   page.evaluate("go('clubhouse');openGuidebook()")
   for i in range(6):
    tap('Read this page');assert page.evaluate('window.__speech.at(-1).voice')=='Samantha'
    if i<5:tap('Next →');assert not page.evaluate('Narration.busy')
   tap('Close How to Play');assert not page.evaluate('Narration.busy')
   # Product instructions and dialog close use the same narrator, no gameplay action.
   page.evaluate("go('seeds');seed('strawberry')")
   tap('Read to Me');flush();assert 'Strawberry Plants' in ' '.join(page.evaluate('window.__speech.map(u=>u.text)'))
   tap('Close ✕');assert not page.evaluate('Narration.busy')
   # Every job in both modes, with original instructions and unchanged reward state.
   for mode in ['little','growing']:
    for id in page.evaluate('NeighborhoodJobs.catalog.map(j=>j.id)'):
     page.evaluate("([mode,id])=>{Narration.stop();NeighborhoodJobs.quit(state);Game.chooseExperience(state,mode);state.jobs.cooldowns={};go('jobs');Neighborhood.start(id)}",[mode,id])
     page.locator('.job-main-actions').get_by_role('button',name='Read to Me',exact=True).tap()
     rate=page.evaluate('window.__speech.at(-1).rate');assert abs(rate-(.99 if mode=='little' else 1.1))<.001
     assert page.evaluate('window.__speech.at(-1).voice')=='Samantha'
     if page.get_by_role('button',name='Pause',exact=True).count():tap('Pause');assert not page.evaluate('Narration.busy')
     else:page.evaluate('Neighborhood.pause()');assert not page.evaluate('Narration.busy')
   # Recorded phonics cancels speech; automatic word feedback never interrupts the clip.
   page.evaluate("Narration.speak('A sentence. Another sentence.','guide',true);Narration.phoneme('s')")
   assert page.evaluate('Narration.busy')
   assert not page.evaluate("Narration.speak('Automatic word','magee')")
   # Background/pause discard queues, and coming back doesn't restart audio.
   page.evaluate("()=>{Narration.speak('Reading. Keep reading.','guide',true);Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))}")
   assert not page.evaluate('Narration.busy')
   count=page.evaluate('window.__speech.length')
   page.evaluate("()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'))}")
   assert page.evaluate('window.__speech.length')==count
   # Unavailable engines do not throw or change the farm.
   page.evaluate("()=>{Object.defineProperty(window,'speechSynthesis',{configurable:true,value:undefined});Narration.speak('Written instructions remain','guide',true)}")
   assert 'unavailable' in page.evaluate('Narration.status')
   assert not errors,errors
   print(f'PASS {engine} {w}x{h}: voices/async/fallback/speed/save, 8 locations, 6 guide pages, 12 jobs x 2 modes, pause/phonics/background',flush=True)
   page.close()
  browser.close()
finally:server.shutdown()
