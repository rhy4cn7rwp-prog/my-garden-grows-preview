const {test} = require('node:test'), A = require('node:assert/strict'), vm = require('node:vm'), fs = require('node:fs'), G = require('../src/game.js');
const local = (name,lang='en-US',extra={}) => ({name,voiceURI:name,lang,localService:true,...extra});
function setup(list=[local('Fred'),local('Samantha'),local('Ava (Enhanced)')],state={},legacy=false) {
  let voices=list;
  const spoken=[],stops=[],events={},docEvents={},windowEvents={},audios=[];
  const document={hidden:false,addEventListener(k,fn){(docEvents[k] ||= []).push(fn)},dispatchEvent(e){for(const fn of docEvents[e.type]||[])fn(e)}};
  const synth={getVoices:()=>voices,addEventListener(k,fn){events[k]=fn},cancel(){stops.push(true)},speak(u){spoken.push(u)}};
  if(legacy){delete synth.addEventListener;synth.onvoiceschanged=()=>stops.push('prior-voice-listener');}
  const ctx=vm.createContext({state:{narrationEnabled:false,learningExperience:'growing',narrationSpeed:1,narrationVoice:'',...state},document,
    window:{speechSynthesis:synth,addEventListener(k,fn){windowEvents[k]=fn}},Event:class{constructor(type){this.type=type}},
    SpeechSynthesisUtterance:class{constructor(text){this.text=text}}, Audio:class{constructor(path){this.path=path;audios.push(this)}play(){return Promise.resolve()}pause(){this.paused=true}}});
  vm.runInContext(fs.readFileSync('src/narration.js','utf8'),ctx);
  return {run:s=>vm.runInContext(s,ctx),spoken,stops,events,docEvents,document,windowEvents,audios,synth,
    load(list){voices=list;(events.voiceschanged || synth.onvoiceschanged)?.()},finish(){spoken.at(-1).onend()}};
}
test('free local English voice ranking prefers installed enhanced voices; excludes remote/non-English, respects explicit choice',()=>{
  const t=setup([local('Fred'),local('Samantha'),local('Ava (Enhanced)'),local('Cloud Natural','en-US',{localService:false}),local('French Premium','fr-FR')]);
  A.equal(t.run('Narration.voices().length'),3);
  t.run("Narration.speak('Hello','guide',true)");A.equal(t.spoken.at(-1).voice.name,'Ava (Enhanced)');
  t.run("state.narrationVoice='Samantha|en-US';Narration.speak('Hello','guide',true)");A.equal(t.spoken.at(-1).voice.name,'Samantha');
  t.load([local('Daniel','en-GB')]);t.run("Narration.speak('Welcome','guide',true)");
  A.equal(t.spoken.at(-1).lang,'en-GB');A.match(t.run('Narration.status'),/saved voice is unavailable/);
  A.equal(t.run('state.narrationVoice'),'Samantha|en-US'); // Keep preference for original device.
});
test('delayed voices only resume current request; leaving/pause cancels pending; remote-only never dispatched',()=>{
  const t=setup([]);A.equal(t.run("Narration.speak('Requested reading','guide',true)"),false);
  A.equal(t.spoken.length,0);t.load([local('Samantha')]);A.equal(t.spoken[0].text,'Requested reading');
  t.load([]);t.run("Narration.speak('Stale','guide',true);Narration.stop()");t.load([local('Samantha')]);A.equal(t.spoken.length,1);
  const remote=setup([local('Online Natural','en-US',{localService:false})]);remote.run("Narration.speak('No cloud','guide',true)");A.equal(remote.spoken.length,0);
});
test('mode pacing and manual speed stay conversational, with subtle character pitch and no progress changes',()=>{
  const t=setup(undefined,{learningExperience:'little'});
  t.run("Narration.speak('Little','magee',true)");A.equal(t.spoken.at(-1).rate,0.9);A.equal(t.spoken.at(-1).pitch,1.02);
  t.run("state.learningExperience='growing';Narration.speak('Growing','jones',true)");A.equal(t.spoken.at(-1).rate,1);A.equal(t.spoken.at(-1).pitch,0.98);
  t.run("state.narrationSpeed=1.2;Narration.speak('Faster','guide',true)");A.equal(t.spoken.at(-1).rate,1.2);
});
test('narration queues short natural sentences; replacement, phonics, hidden and pagehide cannot overlap or restart canceled chunks',()=>{
  const t=setup(undefined,{narrationEnabled:true});
  t.run("Narration.speak('First sentence. Second sentence!','guide',true)");A.equal(t.spoken.length,1);A.equal(t.spoken[0].text,'First sentence.');
  t.finish();A.equal(t.spoken[1].text,'Second sentence!');
  const old=t.spoken.at(-1);A.equal(t.run("Narration.speak('Automatic interruption')"),false);
  t.run("Narration.phoneme('b')");A.equal(t.audios[0].path,'assets/neighborhood/phonics/b.wav');old.onend();A.equal(t.spoken.length,2);
  t.run("Narration.speak('New request','guide',true)");A.equal(t.audios[0].paused,true);
  t.document.hidden=true;t.document.dispatchEvent({type:'visibilitychange'});A.equal(t.run('Narration.busy'),false);
  A.equal(t.run("Narration.speak('Hidden','guide',true)"),false);
  t.document.hidden=false;A.equal(t.spoken.length,3);t.windowEvents.pagehide();A.equal(t.run('Narration.busy'),false);
});
test('money, multiplication, friendly error fallback, and safe voice labels never modify math or inject markup',()=>{
  const t=setup([local('Ava <Enhanced> "voice"')]);
  A.equal(t.run("Narration.normalize('2 × $3.25 = ?')"),'2 times 3 dollars and 25 cents equals what?');
  A.match(t.run('Narration.options()'),/&lt;Enhanced&gt; &quot;voice&quot;/);
  t.run("Narration.speak('Test','guide',true)");t.spoken.at(-1).onerror({error:'not-allowed'});A.equal(t.run('Narration.busy'),false);A.match(t.run('Narration.status'),/try again/);
});
test('existing farm balances, plots, treasures, active jobs and records survive narration defaults and custom preference save recovery',()=>{
  const fixture=JSON.parse(fs.readFileSync('tests/fixtures/pre-final-jobs.json','utf8'));
  // Fixture farms also cover old rules and scores; ordinary JSON saves keep keys.
  const farms=Array.isArray(fixture)?fixture:Object.values(fixture);
  let checked=0;
  for(const entry of farms){
    const farm=entry.state||entry.save||entry;
    if(!farm.plots)continue;
    const old=G.recover(JSON.stringify(farm));
    const changed=G.recover(JSON.stringify({...old,narrationVoice:'Samantha|en-US',narrationSpeed:1.1}));
    for(const key of ['cash','plots','seeds','inventory','dreamOwned','clubhouseItems','jobs']) A.deepEqual(changed[key],old[key]);
    A.equal(changed.narrationVoice,'Samantha|en-US');A.equal(changed.narrationSpeed,1.1);checked++;
  }
  A.ok(checked>0);
  const s=G.initial();s.cash=78.25;delete s.narrationVoice;delete s.narrationSpeed;
  const old=G.recover(JSON.stringify(s));A.equal(old.cash,78.25);A.equal(old.narrationVoice,'');A.equal(old.narrationSpeed,1);
  A.equal(G.recover(JSON.stringify({...s,narrationSpeed:-100,narrationVoice:42})).narrationSpeed,0.8);
});

test('legacy Safari voiceschanged property preserves its prior listener and resumes a requested local voice',()=>{
  const t=setup([],{},true);
  t.run("Narration.speak('Still requested','guide',true)");
  t.load([local('Samantha')]);
  A.equal(t.spoken[0].text,'Still requested');
  A.ok(t.stops.includes('prior-voice-listener'));
});
