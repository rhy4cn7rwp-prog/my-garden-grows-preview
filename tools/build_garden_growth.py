"""Original crop-specific SVG storybook cutaways. No existing art is edited.
Each source is 440x360, stage1..4. Drawn surfaces share soil line y=242.
Run from the repository root to reproduce the forty lightweight illustrations.
"""
from pathlib import Path
from math import sin,cos,pi
OUT=Path(__file__).resolve().parents[1]/'assets/garden-growth';OUT.mkdir(exist_ok=True)
CROPS=['carrot','corn','beans','strawberry','cucumber','potato','onion','tomato','lettuce','radish']
def path(d,fill='url(#leaf)',stroke='#43703a',w=2,extra=''):
 return f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round" {extra}/>'
def ellipse(x,y,rx,ry,fill,stroke='#486c36',extra=''):
 return f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="{fill}" stroke="{stroke}" stroke-width="2" {extra}/>'
def stem(d,w=5):return path(d,'none','#507b39',w)
def leaf(x,y,size=35,angle=0,lobed=False):
 d='M0 0Q-25-8-20-20L-31-28-19-31-20-42-7-40Q-3-61 9-67 21-50 17-38L31-40 27-26 35-19Q20-2 0 0Z' if lobed else 'M0 0Q-39-3-34-41Q-2-50 0 0Z'
 return f'<g transform="translate({x} {y}) rotate({angle}) scale({size/45})">'+path(d)+path('M0 0-20-29','none','#b6d46c',1.6)+'</g>'
def flower(x,y,size=9):
 return '<g>'+''.join(ellipse(round(x+cos(a*pi/3)*size*.65,2),round(y+sin(a*pi/3)*size*.65,2),size*.5,size*.5,'#fff5ce','#d9ba79') for a in range(6))+ellipse(x,y,size*.35,size*.35,'#efbd4e','#b58b38')+'</g>'
def roots(x=220,y=245,amount=1):
 return stem(f'M{x} {y}q-3 22 2 {int(35*amount)}m-1-14-18 10m18-14 17 9',1.6).replace('#507b39','#e9d2a5')
def plant(c,stage):
 ready=stage==4; size=[0,.48,.78,1][stage-1]
 s=''
 if stage==1:
  if c=='potato':s+=ellipse(220,268,25,16,'#c9a273','#8c6947')+ellipse(209,263,2,2,'#8c6947','#8c6947')+stem('M225 255q-3-19 3-26',3)+leaf(228,234,12,35)
  elif c=='strawberry':s+=roots()+stem('M220 249v-17',4)+leaf(220,235,16,-25)+leaf(220,234,16,95)+ellipse(220,246,8,7,'#8f633d','#704426')
  else:
   colors={'corn':'#e9c565','carrot':'#947446','onion':'#67543d','beans':'#dab999','lettuce':'#dbbe86','radish':'#bda47e','tomato':'#d3ad69','cucumber':'#e9d5a0'}
   s+=ellipse(220,264,8 if c!='beans' else 12,4 if c!='corn' else 8,colors[c],'#8d7049')
   s+=roots(220,270,.55)+stem('M220 259q-8-14 0-25',2)+leaf(220,237,10,-20)+leaf(220,237,10,100)
  return s
 if c in ['carrot','radish','onion']:
  rootdepth=18 if stage==2 else 38 if stage==3 else 80
  if c=='carrot':
   s+=path(f'M202 247Q220 239 237 247Q231 {250+rootdepth} 216 {255+rootdepth}Q205 264 202 247Z','url(#carrot)','#9f6029')
   for y in range(260,250+rootdepth,14):s+=path(f'M209 {y}h12','none','#cd7734',2)
   for j in range(7):
    x=220+(j-3)*20*size; y=232-(65+abs(j-3)*5)*size
    s+=stem(f'M220 244Q{x} 217 {x} {y}',3)
    for k in range(3):s+=leaf(x,y+k*18*size,17*size,-55)+leaf(x,y+k*18*size,17*size,105)
  elif c=='radish':
   s+=path(f'M201 248Q239 233 242 264Q235 {267+rootdepth*.4} 220 {268+rootdepth*.4}Q192 274 201 248Z','url(#radish)','#994958')
   s+=path(f'M205 {267+rootdepth*.2}Q215 {278+rootdepth*.3} 220 {268+rootdepth*.4}l-3 18','none','#f8e8ca',6)
   for j in range(5):s+=leaf(220,242,48*size,(j-2)*32,True)
  else:
   r=12 if stage==2 else 21 if stage==3 else 36
   s+=ellipse(220,252+r*.5,r,r*.8,'url(#onion)','#96714d')
   s+=path(f'M220 {252+r*1.3}l-8 17m8-17 4 15m-4-15 14 12','none','#efddad',2)
   for j in range(7):s+=path(f'M{214+j*2} 246Q{200+(j-3)*20*size} {190-80*size} {220+(j-3)*25*size} {220-(65+abs(j-3)*5)*size}Q{220+(j-3)*14*size} 190 {225+j} 246','url(#leaf)','#507c3b',1.3)
  return s
 if c=='corn':
  top=242-170*size;s+=roots()+stem(f'M220 245V{top}',8*size)
  for j in range(5):
   y=235-j*25*size; direction=-1 if j%2 else 1
   s+=path(f'M220 {y}Q{220+direction*32*size} {y-64*size} {220+direction*93*size} {y-28*size}Q{220+direction*48*size} {y-44*size} 220 {y+7}','url(#leaf)','#4a7537',2)
  if ready:
   for x,y,a in [(211,170,-25),(230,203,25)]:
    s+=f'<g transform="translate({x} {y}) rotate({a})">'+ellipse(0,0,11,28,'#efcc65','#a88336')+path('M-12 18Q-28-10-12-33L0 22 14-29Q28 0 10 26Z','url(#leaf)')+'</g>'
   s+=stem(f'M220 {top}v-19m0 6-19-10m19 14 19-12',2).replace('#507b39','#b99549')
  return s
 if c=='lettuce':
  s+=roots()
  for j in range(9):s+=leaf(220,244,65*size,(j-4)*20,True)
  if ready:
   for x,y,r,a in [(201,221,30,-30),(240,222,30,25),(217,216,34,0),(220,215,21,10)]:s+=ellipse(x,y,r,r*.72,'url(#lettuce)','#729349',f'transform="rotate({a} {x} {y})"')
   s+=path('M210 226q-9-29 11-25m1 28q23-14 11-24','none','#c5dc88',3)
  return s
 if c=='strawberry':
  s+=roots()+stem('M220 246q-25-18-47-24m47 24q23-25 47-27',4)
  for j in range(5):
   x=220+(j-2)*29*size;y=239-(22+10*(j%2))*size
   s+=leaf(x,y,32*size,(j-2)*20,True)+leaf(x,y,27*size,90+(j-2)*20,True)
  if ready:
   for x,y in [(177,233),(227,223),(265,236)]:
    s+=path(f'M{x-11} {y}Q{x-22} {y+11} {x} {y+30}Q{x+22} {y+10} {x+10} {y}Z','url(#tomato)','#ab4535')
    s+=path(f'M{x-13} {y+3}l11-8 3 7 12-3-6 9-7-6-8 6Z','#659443')
    s+=''.join(ellipse(x+dx,y+dy,1,1.8,'#f8db82','#f8db82') for dx,dy in [(-5,10),(4,11),(0,19)])
   s+=flower(195,204,7)
  return s
 # Distinct leafy architecture: bean bush, staked tomato/cucumber, potato bush.
 s+=roots()
 top=242-125*size
 if c in ['tomato','cucumber']:
  s+=path('M217 244V82','none','#a88658',6)
  if c=='cucumber':s+=path('M170 243V112M270 243V112M170 151h100m-100 45h100','none','#bf9a62',4)
 s+=stem(f'M220 244Q{205 if c=="cucumber" else 225} 180 220 {top}',5)
 for j in range(6):
  direction=-1 if j%2 else 1;x=220+direction*(40 if c=='beans' else 52)*size;y=230-j*16*size
  s+=stem(f'M220 {y+4}Q{x} {y+2} {x} {y-12}',3)
  if c=='beans':
   s+=leaf(x,y,28*size,-30)+leaf(x,y,28*size,85)+leaf(x,y,23*size,30)
  elif c=='potato':s+=leaf(x,y,35*size,35*direction)+leaf(x,y+3,23*size,110*direction)
  else:s+=leaf(x,y,35*size,35*direction,True)
  if c=='cucumber':s+=path(f'M{x} {y}q{direction*30} -16 {direction*25} -29t{direction*-12} 1','none','#779c49',2)
 if ready:
  if c=='tomato':
   for x,y in [(183,187),(251,198),(219,158),(239,230)]:
    s+=ellipse(x,y,17,16,'url(#tomato)','#a84631')+path(f'M{x-11} {y-14}l9 1 4-6 2 6 9 4-12-1-6 5 2-6Z','#4f7d3a')+ellipse(x-6,y-5,4,2,'#f5a569','#f5a569')
  elif c=='cucumber':
   for x,y,a in [(180,187,15),(255,211,-20),(227,159,20)]:
    s+=f'<g transform="rotate({a} {x} {y})">'+ellipse(x,y,10,27,'url(#cucumber)','#3e713a')+path(f'M{x-3} {y-18}v35','none','#bed37b',2)+'</g>'
   s+=flower(250,146,8)
  elif c=='beans':
   for x,y in [(181,189),(246,211),(233,161),(204,225)]:s+=path(f'M{x} {y}q-18 9-8 34Q{x+14} {y+14} {x} {y}Z','url(#cucumber)','#447f3b')+path(f'M{x} {y+5}q-8 9-7 21','none','#bfdb7e',2)
  elif c=='potato':
   s+=path('M220 260Q205 273 184 286M220 267Q245 277 247 294M220 272v49','none','#e9d2a5',2)
   for x,y,rx in [(184,286,24),(247,294,27),(219,321,22)]:
    s+=ellipse(x,y,rx,rx*.67,'url(#potato)','#8e6a48')+ellipse(x-8,y-3,1.5,1.5,'#926d48','#926d48')
   s+=flower(205,133,7)
 elif c=='potato' and stage==3:
  for x,y in [(204,277),(240,289)]:s+=ellipse(x,y,9,7,'url(#potato)','#8e6a48')
 return s
DEFS='''<defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#f2e6b8"/><stop offset="1" stop-color="#fbf2d6"/></linearGradient><linearGradient id="soil" x2="0" y2="1"><stop stop-color="#ab784d"/><stop offset="1" stop-color="#755039"/></linearGradient><linearGradient id="leaf" x2=".9" y2="1"><stop stop-color="#b4d574"/><stop offset=".5" stop-color="#79ab53"/><stop offset="1" stop-color="#3d773f"/></linearGradient><linearGradient id="lettuce" x2=".8" y2="1"><stop stop-color="#d8e7a0"/><stop offset="1" stop-color="#81b45e"/></linearGradient><linearGradient id="carrot" x2=".8" y2="1"><stop stop-color="#efb55e"/><stop offset="1" stop-color="#d87938"/></linearGradient><linearGradient id="tomato" x2=".8" y2="1"><stop stop-color="#f8a262"/><stop offset="1" stop-color="#d64e3d"/></linearGradient><linearGradient id="radish" x2=".4" y2="1"><stop stop-color="#e47e84"/><stop offset=".7" stop-color="#bf5269"/><stop offset="1" stop-color="#f4dfbd"/></linearGradient><linearGradient id="onion" x2=".8" y2="1"><stop stop-color="#efcf84"/><stop offset="1" stop-color="#ba8c50"/></linearGradient><linearGradient id="potato" x2=".8" y2="1"><stop stop-color="#e0bd8b"/><stop offset="1" stop-color="#b18c5f"/></linearGradient><linearGradient id="cucumber" x2=".8" y2="1"><stop stop-color="#afca64"/><stop offset="1" stop-color="#4d8e43"/></linearGradient><clipPath id="frame"><rect x="5" y="5" width="430" height="350" rx="28"/></clipPath></defs>'''
for crop in CROPS:
 for stage in range(1,5):
  background='''<rect width="440" height="360" fill="url(#sky)"/><circle cx="351" cy="67" r="32" fill="#f3d98c" opacity=".45"/><path d="M0 219Q82 169 163 207T440 199V250H0Z" fill="#c8d298" opacity=".55"/><path d="M0 245Q120 231 220 244T440 245V360H0Z" fill="url(#soil)"/><path d="M0 245Q120 231 220 244T440 245" stroke="#749354" stroke-width="6" fill="none"/><g fill="#ddbb87" opacity=".35"><ellipse cx="66" cy="281" rx="5" ry="3"/><ellipse cx="352" cy="305" rx="7" ry="3"/><ellipse cx="125" cy="326" rx="4" ry="2"/><ellipse cx="301" cy="275" rx="3" ry="2"/></g>'''
  art=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 360" role="img" aria-labelledby="title"><title id="title">{crop} growth stage {stage}, illustrated soil cutaway</title>{DEFS}<g clip-path="url(#frame)">{background}<g transform="translate(220 245) scale({2.4 if stage==1 else 1}) translate(-220 -245)">{plant(crop,stage)}</g></g><rect x="5" y="5" width="430" height="350" rx="28" fill="none" stroke="#ba9565" stroke-width="3"/></svg>'
  (OUT/f'{crop}-{stage}.svg').write_text(art)
print('Created 40 crop-specific stage illustrations.')
