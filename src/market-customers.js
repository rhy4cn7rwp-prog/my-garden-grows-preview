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
    "legacyPortrait": 2,
    "details": [
      "Gardens make me smile.",
      "I love a garden walk."
    ]
  },
  {
    "name": "Noah",
    "trait": "upbeat home cook",
    "tone": "cook",
    "hello": "Hello, neighbor!",
    "bye": "Happy cooking!",
    "legacyPortrait": 1,
    "details": [
      "I love trying recipes!",
      "Fresh food, new ideas!"
    ]
  },
  {
    "name": "Ava",
    "trait": "thoughtful storyteller",
    "tone": "storyteller",
    "hello": "Lovely to see you.",
    "bye": "See you next time!",
    "legacyPortrait": 0,
    "details": [
      "I grew beans as a child.",
      "Markets bring back stories."
    ]
  },
  {
    "name": "Oliver",
    "trait": "curious young explorer",
    "tone": "curious",
    "hello": "What looks tasty?",
    "bye": "See you soon!",
    "legacyPortrait": 3,
    "details": [
      "How is your garden?",
      "I wonder what grew today!"
    ]
  },
  {
    "name": "Sophia",
    "trait": "cheerful recipe planner",
    "tone": "upbeat",
    "hello": "Ready to cook!",
    "bye": "Time to get cooking!",
    "portrait": 0,
    "details": [
      "A new recipe to plan!",
      "Cooking is an adventure!"
    ]
  },
  {
    "name": "Liam",
    "trait": "playful weekend explorer",
    "tone": "playful",
    "hello": "A lovely day out!",
    "bye": "Enjoy the sunshine!",
    "portrait": 1,
    "details": [
      "A tasty little adventure!",
      "A fresh-air snack stop!"
    ]
  },
  {
    "name": "Ella",
    "trait": "shy nature observer",
    "tone": "shy",
    "hello": "What a nice stand!",
    "bye": "Have a peaceful day!",
    "portrait": 2,
    "details": [
      "Such lovely leaves.",
      "I like a quiet garden."
    ]
  },
  {
    "name": "Leo",
    "trait": "eager picnic helper",
    "tone": "curious",
    "hello": "Picnic time soon!",
    "bye": "Picnic time!",
    "portrait": 3,
    "details": [
      "Picnic time is coming!",
      "I am helping with a picnic!"
    ]
  },
  {
    "name": "Emma",
    "trait": "practical lunch planner",
    "tone": "practical",
    "hello": "Time to plan lunch!",
    "bye": "Off to make lunch!",
    "portrait": 4,
    "details": [
      "I have my shopping list.",
      "Time to plan a meal."
    ]
  },
  {
    "name": "Lucas",
    "trait": "friendly soup maker",
    "tone": "storyteller",
    "hello": "Something fresh today!",
    "bye": "Time to head home!",
    "portrait": 5,
    "details": [
      "I once grew a tiny garden.",
      "My first crop was a carrot."
    ]
  },
  {
    "name": "Mia",
    "trait": "creative snack inventor",
    "tone": "creative",
    "hello": "Let’s try a recipe!",
    "bye": "Time to try my recipe!",
    "portrait": 6,
    "details": [
      "A new snack idea today!",
      "Colors give me ideas!"
    ]
  },
  {
    "name": "Henry",
    "trait": "patient puzzle lover",
    "tone": "playful",
    "hello": "Shopping is a puzzle!",
    "bye": "Off to my puzzle!",
    "portrait": 7,
    "details": [
      "A tasty puzzle to solve!",
      "My list is a little puzzle!"
    ]
  },
  {
    "name": "Zoe",
    "trait": "talkative flower enthusiast",
    "tone": "talkative",
    "hello": "Such lovely colors!",
    "bye": "Enjoy these colors!",
    "portrait": 8,
    "details": [
      "The flowers look lovely!",
      "I met a friend on my walk!"
    ]
  },
  {
    "name": "Amelia",
    "trait": "quiet beginner cook",
    "tone": "shy",
    "hello": "I’m trying a recipe!",
    "bye": "Time to start cooking!",
    "portrait": 9,
    "details": [
      "I am learning to cook.",
      "One small recipe today."
    ]
  },
  {
    "name": "Jack",
    "trait": "relaxed neighborhood walker",
    "tone": "outdoors",
    "hello": "A nice stop today!",
    "bye": "See you on my walk!",
    "portrait": 10,
    "details": [
      "A lovely stop on my walk!",
      "Fresh air makes me smile."
    ]
  },
  {
    "name": "Grace",
    "trait": "friendly talkative family host",
    "tone": "talkative",
    "hello": "Fresh food to share!",
    "bye": "Time to share these!",
    "portrait": 11,
    "details": [
      "Fresh food brings us together!",
      "I am planning a shared meal."
    ]
  },
  {
    "name": "Ethan",
    "trait": "shy kitchen helper",
    "tone": "shy",
    "hello": "I’m helping cook!",
    "bye": "Back to the kitchen!",
    "portrait": 12,
    "details": [
      "I am helping cook.",
      "One meal to help with."
    ]
  },
  {
    "name": "Aria",
    "trait": "playful recipe experimenter",
    "tone": "creative",
    "hello": "Something new today!",
    "bye": "Off to try a recipe!",
    "portrait": 13,
    "details": [
      "I like trying new recipes!",
      "A colorful meal idea!"
    ]
  },
  {
    "name": "Ruby",
    "trait": "inquisitive young gardener",
    "tone": "curious",
    "hello": "What grew today?",
    "bye": "Happy gardening!",
    "portrait": 14,
    "details": [
      "What grew the fastest?",
      "I like watching seeds grow!"
    ]
  },
  {
    "name": "Mateo",
    "trait": "warm community cook",
    "tone": "cook",
    "hello": "Good food to share!",
    "bye": "See you next market!",
    "portrait": 15,
    "details": [
      "Time to try a new recipe!",
      "Cooking is my happy place!"
    ]
  },
  {
    "name": "Isabel",
    "trait": "welcoming picnic organizer",
    "tone": "upbeat",
    "hello": "A picnic to plan!",
    "bye": "Off to my picnic!",
    "portrait": 16,
    "details": [
      "I am planning a picnic!",
      "A nice day to share a meal!"
    ]
  },
  {
    "name": "Ben",
    "trait": "easygoing sandwich maker",
    "tone": "practical",
    "hello": "Lunch ideas today!",
    "bye": "Time for sandwiches!",
    "portrait": 17,
    "details": [
      "A few things for lunch.",
      "I brought my shopping list."
    ]
  },
  {
    "name": "Nina",
    "trait": "observant budding artist",
    "tone": "creative",
    "hello": "So many colors!",
    "bye": "Have a colorful day!",
    "portrait": 18,
    "details": [
      "Such pretty colors.",
      "I like drawing gardens."
    ]
  },
  {
    "name": "Theo",
    "trait": "cheerful garden walker",
    "tone": "outdoors",
    "hello": "A fine garden day!",
    "bye": "Enjoy your garden!",
    "portrait": 19,
    "details": [
      "A fine day for a walk!",
      "I saw a bird on my way!"
    ]
  },
  {
    "name": "Priya",
    "trait": "thoughtful flavor explorer",
    "tone": "cook",
    "hello": "New flavors today!",
    "bye": "Time for new flavors!",
    "portrait": 20,
    "details": [
      "I love a new flavor!",
      "A fresh recipe idea today!"
    ]
  },
  {
    "name": "Sam",
    "trait": "funny lunch helper",
    "tone": "playful",
    "hello": "Time for lunch!",
    "bye": "Off to help with lunch!",
    "portrait": 21,
    "details": [
      "A tasty mission today!",
      "Lettuce have a good day!"
    ]
  },
  {
    "name": "Clara",
    "trait": "gentle book-loving storyteller",
    "tone": "storyteller",
    "hello": "A storybook day!",
    "bye": "Time for my book!",
    "portrait": 22,
    "details": [
      "This feels like a storybook.",
      "I read about a tiny garden."
    ]
  },
  {
    "name": "Luis",
    "trait": "curious young taste tester",
    "tone": "curious",
    "hello": "What can I try?",
    "bye": "See you next time!",
    "portrait": 23,
    "details": [
      "What is growing today?",
      "Can plants surprise us?"
    ]
  }
];

  const profile = name => profiles.find(p=>p.name===name);
  function behavior(name) {
    const tone=profile(name)?.tone;
    return tone ? (tone==="practical" ? "hurried" :
      ["gentle","thoughtful","shy","storyteller"].includes(tone) ? "thoughtful" : "curious") : null;
  }
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
  Object.assign(voices, {
    shy:{hello:["Hello.","Hi, please.","Nice to see you."],order:["May I have","Could I get","I'd like"],thanks:["Thank you. Lovely.","Thank you very much.","Thanks. See you soon."],sold:["Thanks for checking.","Another day, then.","I'll visit again."]},
    talkative:{hello:["Hi! A lovely day out!","Hello! I met a friend!","Nice to stop and chat!"],order:["I'd love","May I get","Could I have"],thanks:["Thank you! Lovely chat!","Thanks! Enjoy your day!","Thank you! See you soon!"],sold:["Thanks for checking!","We'll try next time!","Another day to visit!"]},
    playful:{hello:["Hi! A tasty mission!","A fresh-food adventure!","Hello, garden friend!"],order:["Could I try","I'd love","Can I get"],thanks:["Thanks! A tasty success!","Thank you! Great teamwork!","Thanks! See you soon!"],sold:["A new plan, then!","Next time, garden friend!","Thanks for checking!"]},
    cook:{hello:["Hi! Ready to cook!","A new recipe today!","Hello! Fresh ideas!"],order:["I'd love","Could I get","May I have"],thanks:["Thank you! Time to cook!","Thanks! Fresh inspiration!","Thank you! Looks lovely!"],sold:["I'll try another recipe!","Thanks for checking!","I'll cook that another day!"]},
    storyteller:{hello:["Hello! A lovely market!","What a storybook day!","This brings back memories!"],order:["May I have","I'd like","Could I get"],thanks:["Thank you! A lovely visit!","Thanks! See you next time!","Thank you! What a nice day!"],sold:["Another market day, then!","Thanks for checking!","I'll visit another day!"]}
  });
  const greetingReplies={
    gentle:{excellent:["What a lovely welcome!","Thank you! How kind!"],wait:["Hello, dear!","May I shop with you?","A lovely quiet moment."]},
    upbeat:{excellent:["Thanks! What a welcome!","What a cheerful hello!"],wait:["Hi there!","Hello! Ready to shop!","A lovely day to visit!"]},
    thoughtful:{excellent:["Thank you for the welcome!","How thoughtful. Thanks!"],wait:["Hello. May I ask?","Nice to see your stand.","A quiet moment is nice."]},
    curious:{excellent:["Thanks! What's growing?","What a friendly welcome!"],wait:["Hi! What's fresh?","May I ask about plants?","What grew today?"]},
    outdoors:{excellent:["Thanks! A lovely stop!","What a sunny welcome!"],wait:["Hello from my walk!","Hi! A nice stop today!","A fine day to shop!"]},
    practical:{excellent:["Thank you. Ready to shop!","Thanks for your help!"],wait:["Hello. A few things, please.","May I place an order?","Hello. I have my list."]},
    creative:{excellent:["Thanks! Such lovely colors!","A warm welcome! Thanks!"],wait:["Hello! Fresh ideas today!","Hi! A new idea today!","May I try something new?"]},
    shy:{excellent:["Thank you. That's kind.","Oh, thank you."],wait:["Hello. May I ask?","Hi. I'd like to shop.","May I order, please?"]},
    talkative:{excellent:["What a lovely welcome!","Thanks! How is your day?"],wait:["Hello! Lovely weather!","Hi! I just had a nice walk!","Nice to stop and chat!"]},
    playful:{excellent:["Thanks! Hello, garden friend!","A five-star hello! Thanks!"],wait:["Hi! A tasty mission!","A quiet hello from me!","Hello, garden friend!"]},
    cook:{excellent:["Thanks! Fresh inspiration!","What a welcome! Thanks!"],wait:["Hello! A recipe to plan!","May I shop for my meal?","Hi! Fresh ideas today!"]},
    storyteller:{excellent:["What a warm welcome!","How kind! A lovely visit!"],wait:["Hello! This takes me back.","A quiet little market visit.","May I share a little hello?"]}
  };
  function dialogue(c,step,order,paid,cropName){
    const p=profile(c.name);if(!p)return null;
    const v=Number.isInteger(c.dialogueVariant)?c.dialogueVariant%3:0,voice=voices[p.tone];
    if(step==="pay")return [voice.thanks[v],`Here's ${paid}.`];
    if(step==="thanks"){
      if(c.response==="sale-complete")return [voice.thanks[v],p.bye];
      // Keep old in-progress saves that were already leaving readable.
      if(c.response==="wait-left")return ["See you another day!"];
      if(c.response==="alternative-declined")return [["Thanks! I need what's on my list.","Maybe next time. Thanks!","Thanks! I'll keep looking."][v]];
      if(c.response==="soldout-return")return [["I'll come back another day!","See you next market!","I'll visit again soon!"][v]];
      return [voice.sold[v]];
    }
    const replies=greetingReplies[p.tone];
    let hello;
    if(c.response==="alternative-accepted")hello=["I'll try that instead!","Yes, let's try that!","That sounds lovely!"][v];
    else if(c.response==="wait-stayed")hello=replies.wait[v];
    else if(c.response==="excellent")hello=v===2?p.details[0]:replies.excellent[v];
    else hello=v===0?p.hello:v===1?voice.hello[1]:p.details[1];
    if(c.rememberVisit && c.response!=="alternative-accepted"){
      const quiet=p.tone==="shy";
      hello=c.rememberedCrop && cropName ?
        [`${quiet?"":"Hi again! "}Loved your ${cropName}!`,`Thanks for the ${cropName}!`,`I enjoyed your ${cropName}!`][v]:
        (quiet?["Hello again.","Nice to see you again.","Glad you're here."]:["Nice to see you again!","Hi again! What's fresh?","Glad you're here again!"])[v];
    }
    return [hello,`${voice.order[v]} ${order}.`];
  }
  const api={profiles,profile,behavior,emptyHistory,recover,pick,arrive,recordSale,dialogue};
  if(typeof module!=="undefined" && module.exports)module.exports=api;
  else root.MarketCustomers=api;
})(typeof globalThis!=="undefined"?globalThis:this);
