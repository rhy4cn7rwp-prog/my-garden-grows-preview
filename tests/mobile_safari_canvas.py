"""Safari viewport/canvas model: large page area with smaller moving visual viewport.
This is Chromium simulation; native iPhone Safari chrome is not represented.
Screenshots and source-pixel checks verify page-owned exposed areas, not Safari UI.
"""
import io
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
from PIL import Image
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(root)))
Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  for width,layout,top,bottom,heights in [(320,568,20,0,[448,508,548]),(375,667,20,0,[547,607,647]),(390,844,47,34,[664,744,797]),(428,926,47,34,[746,846,892]),(430,932,59,34,[752,852,898]),(667,375,0,21,[275,315,354]),(926,428,0,21,[308,368,407])]:
   page=browser.new_page(viewport={'width':width,'height':layout},is_mobile=True,has_touch=True,device_scale_factor=1)
   page.set_default_timeout(5000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(f'http://127.0.0.1:{server.server_port}/')
   page.evaluate(f"()=>{{document.documentElement.style.setProperty('--viewport-safe-top','{top}px');document.documentElement.style.setProperty('--viewport-safe-bottom','{bottom}px');}}")
   if width==926:
    page.evaluate("()=>{document.documentElement.style.setProperty('--village-safe-left','47px');document.documentElement.style.setProperty('--village-safe-right','47px');}")
   for season,name in [(1,'spring'),(2,'summer'),(3,'autumn'),(4,'winter')]:
    page.evaluate(f'()=>{{state.season={season};render()}}')
    state=page.evaluate('JSON.stringify(state)')
    expected_tint=page.evaluate(f'VILLAGE_BROWSER_SKY.{name}')
    for visible in heights+[heights[0]]:
     offset=12 if visible+12<=layout else 0
     page.evaluate(f"()=>{{Object.defineProperty(visualViewport,'height',{{configurable:true,get:()=>{visible}}});Object.defineProperty(visualViewport,'offsetTop',{{configurable:true,get:()=>{offset}}});visualViewport.dispatchEvent(new Event('resize'));}}")
     data=page.evaluate('''()=>{const r=document.documentElement,s=getComputedStyle(r),v=visualViewport;return {canvas:r.dataset.villageCanvas,body:getComputedStyle(document.body).backgroundColor,image:s.backgroundImage,size:s.backgroundSize.split(' ').map(parseFloat),position:s.backgroundPosition.split(' ').map(parseFloat),large:parseFloat(getComputedStyle(r,'::before').height),tint:document.querySelector('meta[name="theme-color"]').content,vheight:v.height,vtop:v.offsetTop,buttons:[...document.querySelectorAll('.town-game button')].map(e=>({name:e.getAttribute('aria-label'),...e.getBoundingClientRect().toJSON()})),hud:document.querySelector('.hud .nav').getBoundingClientRect().toJSON(),savings:document.querySelector('.town-goal').getBoundingClientRect().toJSON()};}''')
     assert data['canvas']==name and data['body']=='rgba(0, 0, 0, 0)',data
     assert page.locator('.town-game').evaluate('e=>getComputedStyle(e).backgroundColor')=='rgba(0, 0, 0, 0)'
     assert 'seasons.webp' in data['image'] and data['tint']==expected_tint,data
     assert data['large']==layout,data
     frame_width,frame_height=data['size'][0]/2,data['size'][1]/2
     assert frame_width>width+1 and frame_height>layout+1
     assert abs(frame_width/frame_height-.75)<.001,data
     column=1 if season in [2,4] else 0;row=1 if season>=3 else 0
     assert abs(data['position'][0]-((width-frame_width)/2-column*frame_width))<.1,data
     assert abs(data['position'][1]-((layout-frame_height)/2-row*frame_height))<.1,data
     assert data['hud']['top']>=offset+top,data
     if width==926:assert data['hud']['left']>=47,data
     assert data['savings']['bottom']<=offset+visible-bottom+1,data
     for b in data['buttons']:
      assert b['width']>=44 and b['height']>=44,b
      assert b['top']>=offset and b['bottom']<=offset+visible+1,(width,layout,visible,b)
      assert b['left']>=0 and b['right']<=width+1,b
     assert page.evaluate('JSON.stringify(state)')==state
     assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    # Inspect exposed page strips above/below the game: they must contain art,
    # not the former flat green body color. The native Safari toolbar is absent.
    pixels=Image.open(io.BytesIO(page.screenshot())).convert('RGB')
    for start,end in [(0,10),(heights[0]+12,layout)]:
     if end-start<8:continue
     colors=[pixels.getpixel((x,y)) for y in range(start,end,3) for x in range(0,width,5)]
     assert len(set(colors))>25,(width,layout,name,start,end)
     assert sum(c in [(212,228,182),(214,237,188),(181,206,147)] for c in colors)<len(colors)*.05
    if width==390 and season==1:page.screenshot(path='/tmp/safari-page-canvas-expanded.png')
   # Restoring from Safari's page cache refreshes measurements/tint without touching saves.
   page.evaluate("document.querySelector('meta[name=\"theme-color\"]').content='#000000'")
   page.evaluate("dispatchEvent(new Event('pageshow'))")
   assert page.locator('meta[name="theme-color"]').get_attribute('content')==expected_tint
   page.get_by_role('button',name='Seed & Feed',exact=True).tap()
   assert page.evaluate('document.documentElement.hasAttribute("data-village-canvas")') is False
   page.get_by_role('button',name='Back to village',exact=True).tap()
   assert page.evaluate('document.documentElement.dataset.villageCanvas')=='winter'
   page.reload();assert page.evaluate('state.season')==4
   assert page.evaluate('document.documentElement.dataset.villageCanvas')=='winter'
   assert not errors,errors
   page.close()
  browser.close()
  print('PASS: seasonal document painting covers page-owned top/bottom strips; proportional atlas frames, Safari large-vs-visible viewport and toolbar changes, safe-area controls, matching theme tint, page-cache restore, navigation and saved state at seven mobile layouts including iPhone 12 Pro Max portrait/landscape dimensions. Native iPhone Safari remains unverified.')
finally:server.shutdown()
