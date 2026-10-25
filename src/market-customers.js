/* Customer identity and memory only. Prices, orders, scoring and timing stay in Game. */
(function(root){
  "use strict";
  const profiles = [
  {
    "name": "Maya",
    "trait": "gentle garden admirer",
    "tone": "gentle",
    "hello": "How lovely!",
    "bye": "See you in the garden!",
    "legacyPortrait": 2
  },
  {
    "name": "Noah",
    "trait": "upbeat home cook",
    "tone": "upbeat",
    "hello": "Hello, neighbor!",
    "bye": "Happy cooking!",
    "legacyPortrait": 1
  },
  {
    "name": "Ava",
    "trait": "thoughtful storyteller",
    "tone": "thoughtful",
    "hello": "Lovely to see you.",
    "bye": "See you next time!",
    "legacyPortrait": 0
  },
  {
    "name": "Oliver",
    "trait": "curious young explorer",
    "tone": "curious",
    "hello": "What looks tasty?",
    "bye": "See you soon!",
    "legacyPortrait": 3
  },
  {
    "name": "Sophia",
    "trait": "cheerful recipe planner",
    "tone": "upbeat",
    "hello": "Ready to cook!",
    "bye": "Time to get cooking!",
    "portrait": 0
  },
  {
    "name": "Liam",
    "trait": "outdoorsy weekend walker",
    "tone": "outdoors",
    "hello": "A lovely day out!",
    "bye": "Enjoy the sunshine!",
    "portrait": 1
  },
  {
    "name": "Ella",
    "trait": "quiet nature observer",
    "tone": "gentle",
    "hello": "What a nice stand!",
    "bye": "Have a peaceful day!",
    "portrait": 2
  },
  {
    "name": "Leo",
    "trait": "eager picnic helper",
    "tone": "curious",
    "hello": "Picnic time soon!",
    "bye": "Picnic time!",
    "portrait": 3
  },
  {
    "name": "Emma",
    "trait": "practical lunch planner",
    "tone": "practical",
    "hello": "Time to plan lunch!",
    "bye": "Off to make lunch!",
    "portrait": 4
  },
  {
    "name": "Lucas",
    "trait": "friendly soup maker",
    "tone": "gentle",
    "hello": "Something fresh today!",
    "bye": "Time to head home!",
    "portrait": 5
  },
  {
    "name": "Mia",
    "trait": "creative snack inventor",
    "tone": "creative",
    "hello": "Let’s try a recipe!",
    "bye": "Time to try my recipe!",
    "portrait": 6
  },
  {
    "name": "Henry",
    "trait": "patient puzzle lover",
    "tone": "thoughtful",
    "hello": "Shopping is a puzzle!",
    "bye": "Off to my puzzle!",
    "portrait": 7
  },
  {
    "name": "Zoe",
    "trait": "bright flower enthusiast",
    "tone": "upbeat",
    "hello": "Such lovely colors!",
    "bye": "Enjoy these colors!",
    "portrait": 8
  },
  {
    "name": "Amelia",
    "trait": "careful new cook",
    "tone": "practical",
    "hello": "I’m trying a recipe!",
    "bye": "Time to start cooking!",
    "portrait": 9
  },
  {
    "name": "Jack",
    "trait": "relaxed neighborhood walker",
    "tone": "outdoors",
    "hello": "A nice stop today!",
    "bye": "See you on my walk!",
    "portrait": 10
  },
  {
    "name": "Grace",
    "trait": "kind family host",
    "tone": "gentle",
    "hello": "Fresh food to share!",
    "bye": "Time to share these!",
    "portrait": 11
  },
  {
    "name": "Ethan",
    "trait": "enthusiastic kitchen helper",
    "tone": "upbeat",
    "hello": "I’m helping cook!",
    "bye": "Back to the kitchen!",
    "portrait": 12
  },
  {
    "name": "Aria",
    "trait": "playful recipe experimenter",
    "tone": "creative",
    "hello": "Something new today!",
    "bye": "Off to try a recipe!",
    "portrait": 13
  },
  {
    "name": "Ruby",
    "trait": "inquisitive young gardener",
    "tone": "curious",
    "hello": "What grew today?",
    "bye": "Happy gardening!",
    "portrait": 14
  },
  {
    "name": "Mateo",
    "trait": "warm community cook",
    "tone": "gentle",
    "hello": "Good food to share!",
    "bye": "See you next market!",
    "portrait": 15
  },
  {
    "name": "Isabel",
    "trait": "welcoming picnic organizer",
    "tone": "upbeat",
    "hello": "A picnic to plan!",
    "bye": "Off to my picnic!",
    "portrait": 16
  },
  {
    "name": "Ben",
    "trait": "easygoing sandwich maker",
    "tone": "practical",
    "hello": "Lunch ideas today!",
    "bye": "Time for sandwiches!",
    "portrait": 17
  },
  {
    "name": "Nina",
    "trait": "observant budding artist",
    "tone": "creative",
    "hello": "So many colors!",
    "bye": "Have a colorful day!",
    "portrait": 18
  },
  {
    "name": "Theo",
    "trait": "cheerful garden walker",
    "tone": "outdoors",
    "hello": "A fine garden day!",
    "bye": "Enjoy your garden!",
    "portrait": 19
  },
  {
    "name": "Priya",
    "trait": "thoughtful flavor explorer",
    "tone": "thoughtful",
    "hello": "New flavors today!",
    "bye": "Time for new flavors!",
    "portrait": 20
  },
  {
    "name": "Sam",
    "trait": "energetic lunch helper",
    "tone": "upbeat",
    "hello": "Time for lunch!",
    "bye": "Off to help with lunch!",
    "portrait": 21
  },
  {
    "name": "Clara",
    "trait": "gentle book lover",
    "tone": "gentle",
    "hello": "A storybook day!",
    "bye": "Time for my book!",
    "portrait": 22
  },
  {
    "name": "Luis",
    "trait": "curious young taste tester",
    "tone": "curious",
    "hello": "What can I try?",
    "bye": "See you next time!",
    "portrait": 23
  }
];

  const profile = name => profiles.find(p=>p.name===name);
  const day = s => (s.season-1)*20+s.day;
  const integer = n => Number.isSafeInteger(n) && n>=0;
  function emptyHistory(){return {sequence:0,recent:[],people:{}};}
  function recover(raw, cropIds){
    const h=emptyHistory();
    if(!raw || typeof raw!=="object")return h;
    h.sequence=integer(raw.sequence)?raw.sequence:0;
    for(const p of profiles){
      const r=raw.people?.[p.name];if(!r || typeof r!=="object")continue;
      h.people[p.name]={visits:integer(r.visits)?r.visits:0,purchases:integer(r.purchases)?r.purchases:0,
        lastSeen:integer(r.lastSeen)?Math.min(r.lastSeen,h.sequence):0,
        lastDay:integer(r.lastDay)?r.lastDay:0,dayVisits:integer(r.dayVisits)?r.dayVisits:0,
        lastCrop:cropIds.includes(r.lastCrop)?r.lastCrop:null};
    }
    h.recent=Array.isArray(raw.recent)?raw.recent.filter(n=>profile(n)).slice(-8):[];
    return h;
  }
  function history(s){return s.customerHistory ||= emptyHistory();}
  function pick(s){
    const h=history(s), today=day(s);
    const visits=p=>h.people[p.name]?.lastDay===today?h.people[p.name].dayVisits:0;
    const last=p=>h.people[p.name]?.lastSeen || 0;
    const tie=p=>(profiles.indexOf(p)*11+today*7)%profiles.length;
    // Occasionally welcome a familiar regular; never repeat the last eight arrivals.
    if((h.sequence+1)%7===0){
      const regulars=profiles.filter(p=>h.people[p.name]?.purchases>0 && !h.recent.includes(p.name) && visits(p)<2);
      if(regulars.length)return regulars.sort((a,b)=>visits(a)-visits(b)||last(a)-last(b)||tie(a)-tie(b))[0].name;
    }
    return [...profiles].sort((a,b)=>visits(a)-visits(b)||last(a)-last(b)||tie(a)-tie(b))[0].name;
  }
  function arrive(s,name){
    if(!profile(name))return {};
    const h=history(s),today=day(s),old=h.people[name];
    const visits=old?.visits || 0;
    const memory={historyRecorded:true,returning:visits>0,
      rememberVisit:visits>0 && (visits+today)%3===0,
      rememberedCrop:old?.purchases>0?old.lastCrop:null,dialogueVariant:(visits+profiles.findIndex(p=>p.name===name))%3};
    h.sequence++;
    h.people[name]={visits:visits+1,purchases:old?.purchases || 0,lastSeen:h.sequence,
      lastDay:today,dayVisits:old?.lastDay===today?old.dayVisits+1:1,lastCrop:old?.lastCrop || null};
    h.recent=[...h.recent,name].slice(-8);
    return memory;
  }
  function recordSale(s,c){
    if(!profile(c.name))return;
    if(!c.historyRecorded || !history(s).people[c.name])Object.assign(c,arrive(s,c.name));
    const r=history(s).people[c.name];
    r.purchases++;
    r.lastCrop=Object.keys(s.basket).find(id=>s.basket[id]>0) || r.lastCrop;
  }
  const voices={
    gentle:{hello:["Hello, dear!","What a nice stand!","Lovely to see you!"],order:["May I have","I'd like","Could I have"],thanks:["Thank you! Lovely!","Thank you, dear!","Thank you! How kind!"],sold:["Thanks for letting me know!","Another day, then!","I'll visit again!"]},
    upbeat:{hello:["Hi there!","Hello, neighbor!","What a lovely day!"],order:["I'd love","Could I get","I'll take"],thanks:["Thanks! Wonderful!","Thank you! Lovely!","Thanks a bunch!"],sold:["Thanks for the help!","Maybe next time!","I'll try another day!"]},
    thoughtful:{hello:["Hello! How lovely.","Nice to see you!","What a fine stand!"],order:["May I have","I'd like","Could I get"],thanks:["Thank you! Just right!","Thank you! Lovely!","Thanks for your help!"],sold:["Thanks for letting me know!","I'll come back!","Another day, then!"]},
    curious:{hello:["Hi! What grew today?","Hello! Looks tasty!","Hi! What's fresh?"],order:["Can I try","Could I have","I'd like"],thanks:["Thank you! Can't wait!","Thanks! Looks tasty!","Thank you! See you!"] ,sold:["Thanks for checking!","I'll try next time!","Maybe another day!"]},
    outdoors:{hello:["A lovely day out!","Hi! Nice to stop by!","Hello! Looks fresh!"],order:["Could I get","I'd like","May I have"],thanks:["Thanks! Enjoy the day!","Thank you! Lovely!","Thanks! See you soon!"],sold:["I'll stop by again!","Thanks for checking!","Another day, then!"]},
    practical:{hello:["Hello! Ready to cook!","Hi! Time for lunch!","Hello! Looks fresh!"],order:["I'd like","May I have","Could I get"],thanks:["Thank you! Time to cook!","Thanks! Just right!","Thank you! See you!"],sold:["I'll try another day!","Thanks for checking!","Thanks for telling me!"]},
    creative:{hello:["Hello! Lovely colors!","Hi! New ideas today!","Hi! Something fresh!"],order:["Could I try","I'd love","May I have"],thanks:["Thank you! Inspiring!","Thanks! Time to cook!","Thank you! Lovely!"],sold:["I'll try next time!","Thanks for checking!","Another day, then!"]}
  };
  function dialogue(c,step,order,paid,cropName){
    const p=profile(c.name);if(!p)return null;
    const v=Number.isInteger(c.dialogueVariant)?c.dialogueVariant%3:0,voice=voices[p.tone];
    if(step==="pay")return [voice.thanks[v],`Here's ${paid}.`];
    if(step==="thanks"){
      if(c.response==="sale-complete")return [voice.thanks[v],p.bye];
      if(c.response==="wait-left")return [["I have to dash. See you!","I must hurry. Thanks!","See you another day!"][v]];
      if(c.response==="alternative-declined")return [["Thanks! I need what's on my list.","Maybe next time. Thanks!","Thanks! I'll keep looking."][v]];
      if(c.response==="soldout-return")return [["I'll come back another day!","See you next market!","I'll visit again soon!"][v]];
      return [voice.sold[v]];
    }
    let hello=c.response==="alternative-accepted"?["I'll try that instead!","Yes, let's try that!","That sounds lovely!"][v]:
      c.response==="excellent"?["What a lovely welcome!","Thanks for the welcome!",p.hello][v]:
      c.response==="wait-stayed"?"Hello!":v===0?p.hello:(voice.hello[v]===p.hello?"Nice to meet you!":voice.hello[v]);
    if(c.rememberVisit && c.response!=="alternative-accepted"){
      hello=c.rememberedCrop && cropName ? [`Hi again! Loved your ${cropName}!`,`Thanks for the ${cropName}!`,`I enjoyed your ${cropName}!`][v]:
        ["Nice to see you again!","Hi again! What's fresh?","Glad you're here again!"][v];
    }
    return [hello,`${voice.order[v]} ${order}.`];
  }
  const api={profiles,profile,emptyHistory,recover,pick,arrive,recordSale,dialogue};
  if(typeof module!=="undefined" && module.exports)module.exports=api;
  else root.MarketCustomers=api;
})(typeof globalThis!=="undefined"?globalThis:this);
