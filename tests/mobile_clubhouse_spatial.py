"""One-lens camera and room-space reward raster regression, isolated mobile Chromium.
Native iPhone Safari is a separate manual check; no real-player saves are used.
"""
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from PIL import Image
from io import BytesIO
import base64
from threading import Thread
from playwright.sync_api import sync_playwright
root = Path(__file__).resolve().parents[1]
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *args): pass
server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Quiet, directory=str(root)))
Thread(target=server.serve_forever, daemon=True).start()
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
        for width, height in [(320, 480), (375, 548), (428, 746), (428, 892), (844, 390)]:
            page = browser.new_page(viewport={'width': width, 'height': height}, is_mobile=True, has_touch=True)
            errors = []; page.on('pageerror', lambda e: errors.append(str(e)))
            page.goto(f'http://127.0.0.1:{server.server_port}/')
            page.emulate_media(reduced_motion='reduce')
            page.evaluate("()=>{state.cash=1000;Game.purchaseDream(state,'ball');save();go('clubhouse')}")
            page.wait_for_function("document.querySelector('.clubhouse-world')?.dataset.composited==='true'")
            def farm_state():
                return page.evaluate("({...state,clubhousePositions:null,display:Object.fromEntries(Object.entries(state.display).filter(([,n])=>n>0))})")
            farm = farm_state()
            lens = page.evaluate('clubhouseRoom.geometry.focal')
            # Finding/centering/turning may not silently zoom or change source-space sizes.
            for surface, x, y in [('floor', 1023, 606), ('window-seat', 1000, None), ('chest', 1347, None), ('shelf-nook-middle', 1280, None)]:
                page.evaluate("([s,x,y])=>{Game.moveClubhouseItem(state,'ball',ClubhouseLayout.canonical('ball',s,x,y??undefined));save();findClubhouseItem('ball')}", [surface,x,y])
                page.wait_for_function("!!clubhouseRoom.bookImage?.naturalWidth");page.wait_for_timeout(40)
                angle = page.evaluate('ClubhouseLayout.effective(state.clubhousePositions,"ball").angle')
                for offset in [-12, 0, 12]:
                    page.evaluate('a=>lookClubhouse(a)', max(-80,min(80,angle+offset))); page.wait_for_timeout(35)
                    assert page.evaluate('clubhouseRoom.geometry.focal') == lens
                    data = page.evaluate("""()=>{
                      const r=clubhouseRoom,g=r.geometry,p=ClubhouseLayout.effective(state.clubhousePositions,'ball'),m=ClubhouseLayout.metrics('ball',p);
                      // Independent source-space atlas reconstruction, including the painted chest front.
                      const expected=document.createElement('canvas');expected.width=2172;expected.height=724;
                      const e=expected.getContext('2d');e.drawImage(r.image,0,0);drawClubhouseGuidebook(e);
                      const [sx,sy,sw,sh]=CLUBHOUSE_DISPLAYS.ball.bounds.split(' ').map(Number), px=(p.angle+120)/240*2172,py=p.y*724;
                      e.fillStyle=m.shadow.color;e.beginPath();e.ellipse(px,py,m.shadow.rx,m.shadow.ry,0,0,2*Math.PI);e.fill();
                      e.drawImage(r.rewardImage,sx,sy,sw,sh,px-m.width/2,py-m.height+m.tail,m.width,m.height);
                      if(p.surface==='chest')for(const poly of ClubhouseLayout.occluders){e.save();e.beginPath();poly.forEach(([x,y],i)=>i?e.lineTo(x,y):e.moveTo(x,y));e.closePath();e.clip();e.drawImage(r.image,0,0);e.restore()}
                      const a=e.getImageData(0,0,2172,724).data,b=r.scene.getContext('2d').getImageData(0,0,2172,724).data;
                      let diff=0;for(let i=0;i<a.length;i++)diff=Math.max(diff,Math.abs(a[i]-b[i]));
                      // The visible frame must sample that composite, not the bare room with a separately sliding sprite.
                      const check=document.createElement('canvas');check.width=r.canvas.width;check.height=r.canvas.height;
                      const c=check.getContext('2d',{alpha:false});c.setTransform(check.width/g.width,0,0,check.height/g.height,0,0);
                      paintRoomTexture(c,expected,g);
                      const rendered=r.ctx.getImageData(0,0,r.canvas.width,r.canvas.height).data,reference=c.getImageData(0,0,check.width,check.height).data;
                      let frameDiff=0,bad=0;for(let i=0;i<rendered.length;i++){const d=Math.abs(rendered[i]-reference[i]);if(d>frameDiff){frameDiff=d;bad=i}};
                      const before=r.sceneKey,texture=r.scene;
                      return {badPixel:[bad,rendered[bad],reference[bad]],diff,frameDiff,sourceSize:m.width,domHidden:getComputedStyle(document.querySelector('[data-dream=ball] .clubhouse-visual')).visibility==='hidden',key:before};
                    }""")
                    assert data['diff']==0 and data['frameDiff']<=1, (width,height,surface,offset,data)
                    assert data['domHidden'], data
                    # Pixel-correct canvas calculations are insufficient if CSS
                    # places that canvas below/off the visible room (the original bug).
                    rects=page.evaluate("()=>{const r=clubhouseRoom;return {canvas:r.canvas.getBoundingClientRect().toJSON(),world:r.world.getBoundingClientRect().toJSON(),usable:r.usable}}")
                    assert all(abs(rects['canvas'][k]-rects['world'][k])<.01 for k in ['x','y','width','height']),rects
                    screen=Image.open(BytesIO(page.screenshot())).convert('RGB')
                    if width==428 and height==746 and offset==0: screen.save('/tmp/treasure-refined-'+surface+'.png')
                    raster=Image.open(BytesIO(base64.b64decode(page.evaluate("clubhouseRoom.canvas.toDataURL().split(',')[1]")))).convert('RGB')
                    # No controls in the middle strip; its displayed pixels must
                    # be the projected room, not the static HTML fallback picture.
                    top=int(rects['usable']['top'])+12;bottom=int(rects['usable']['bottom'])-12
                    for yy in range(top,bottom,11):
                        for xx in range(8,width-8,11):
                            assert max(abs(a-b) for a,b in zip(screen.getpixel((xx,yy)),raster.getpixel((xx,yy))))<=2,(width,height,surface,offset,xx,yy)
                position = page.evaluate('JSON.stringify(state.clubhousePositions)')
                page.reload();page.get_by_role('button',name='Clubhouse',exact=True).tap()
                page.wait_for_function("document.querySelector('.clubhouse-world')?.dataset.composited==='true'")
                assert page.evaluate('JSON.stringify(state.clubhousePositions)')==position
                assert farm_state()==farm, {k:(farm.get(k),v) for k,v in farm_state().items() if farm.get(k)!=v}
                assert page.evaluate('clubhouseRoom.geometry.focal')==lens
            page.evaluate("()=>{centerClubhouse();lookClubhouse(80)}");page.wait_for_timeout(35)
            assert page.evaluate('clubhouseRoom.yaw')==80
            page.evaluate('lookClubhouse(-80)');page.wait_for_timeout(35)
            assert page.evaluate('clubhouseRoom.yaw')==-80
            assert not errors,errors
            if width==428 and height==746:
                page.evaluate("()=>{Game.moveClubhouseItem(state,'ball',ClubhouseLayout.canonical('ball','chest',1347));findClubhouseItem('ball')}")
                page.wait_for_timeout(50);page.screenshot(path='/tmp/clubhouse-spatial-chest.png')
            page.close();print(f'PASS coherent room + ball/chest/shelf/seat/floor + persistence {width}x{height}',flush=True)
        browser.close()
finally:
    server.shutdown()
