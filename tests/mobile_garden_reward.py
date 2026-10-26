"""Per-plot reward migration and staggered touch harvesting across seven farming days."""
import os
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
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
   page.evaluate("""()=>{state=Game.initial();state.cash=500;Game.purchaseDream(state,'ball');state.cash=123.45;state.season=1;state.day=20;state.seeds.carrot=7;state.bagCount=5;state.owned.scale=1;state.inventory.carrot=7;state.inventory.tomato=2;state.plots[0]={id:'carrot',age:3,left:0,quality:100,watered:false,weedingBonus:true};state.plots[1]={id:'corn',age:0,left:0,quality:100,watered:false,weedingBonus:true};state.plots[2]={id:'beans',age:3,left:2,quality:100,watered:false,weedingBonus:true};state.weedingHarvest={day:19,remaining:[0,2]};state.weedingCredits={beans:4,corn:3};state.weedingLesson.invitedCycle=4;save()}""")
   preserved=page.evaluate('[state.cash,state.dreamPurchases,state.clubhousePositions,state.bagCount,state.owned,state.weedingCredits]')
   page.reload();page.evaluate("go('garden')")
   assert page.evaluate('state.weedingHarvest') is None
   assert page.evaluate('state.plots.filter(p=>p?.weedingBonus).length')==3
   assert '3 planted crops' in page.locator('.garden-bonus-status').inner_text()
   assert page.get_by_role('button',name='Finish bonus harvest',exact=True).count()==0
   page.evaluate('plot(0)');assert 'Harvest 3 each' in page.locator('.dialog').inner_text();tap('🧺 Harvest')
   assert page.evaluate('state.inventory.carrot')==10
   assert page.evaluate('state.plots[1].weedingBonus&&state.plots[2].weedingBonus')
   # A fresh planting after the old reward receives no inherited flag.
   page.evaluate("()=>{Game.plan(state,0,'carrot');plantPlanned()}")
   assert page.evaluate('state.plots[0].weedingBonus') is None
   page.evaluate('plot(2)');assert 'Harvest 2 lb' in page.locator('.dialog').inner_text();tap('🧺 Harvest')
   assert page.evaluate('state.inventory.beans')==2
   assert page.evaluate('state.plots[2].weedingBonus') is None
   for day in range(7):
    tap('Water All');tap('End Day');assert page.locator('.modal').count()==0
    assert page.evaluate('state.plots[1].weedingBonus') is True
    if day==2:
     page.evaluate('plot(2)');assert 'Harvest 1 lb' in page.locator('.dialog').inner_text();tap('🧺 Harvest');assert page.evaluate('state.inventory.beans')==3
    page.reload();assert page.evaluate('view')=='clubhouse';page.evaluate("go('garden')")
    assert page.evaluate('state.plots[1].weedingBonus') is True
   assert page.evaluate('Game.farmDay(state)')==27
   assert page.evaluate('state.weedingLesson.invitedCycle')==4
   assert page.get_by_role('button',name='Pull weeds',exact=True).is_disabled()
   tap('Harvest All Ready Crops');assert page.evaluate('state.inventory.corn')==3
   assert page.evaluate('state.inventory.carrot')==12
   assert page.evaluate('state.inventory.beans')==4
   assert page.locator('.garden-bonus-status').count()==0
   quantities=page.evaluate('state.inventory');tap('Harvest All Ready Crops');assert page.evaluate('state.inventory')==quantities
   assert page.evaluate('[state.cash,state.dreamPurchases,state.clubhousePositions,state.bagCount,state.owned,state.weedingCredits]')==preserved
   page.reload();page.evaluate("go('garden')");assert page.evaluate('state.inventory')==quantities
   assert page.evaluate('state.plots.some(p=>p?.weedingBonus)') is False
   assert not errors,errors
   print(f'PASS legacy migration, +1 item/pound, new planting excluded, seven days/season/reloads, repeat crop, bulk and no duplicate {w}x{h}',flush=True)
   page.close()
  browser.close()
finally:server.shutdown()
