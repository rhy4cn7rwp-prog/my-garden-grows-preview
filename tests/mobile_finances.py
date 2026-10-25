"""Touch-only recovery/rental regression; PREVIEW_URL optionally tests the hosted preview."""
import os
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(root)))
Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=3)
  page.set_default_timeout(5000)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(os.environ.get('PREVIEW_URL',f'http://127.0.0.1:{server.server_port}/'))
  # Existing v1 farm: no new fields. This context's saves are isolated from real players.
  page.evaluate('''()=>{let old=Game.initial();delete old.standMode;delete old.tableRented;old.cash=0;old.goal=4;old.day=9;old.owned.canopy=1;localStorage.setItem('mgg10',JSON.stringify(old));}''')
  page.reload()
  assert page.evaluate('state.cash')==0
  page.get_by_role('button',name='Job Board',exact=True).tap()
  assert 'Coming soon' in page.locator('.dialog').inner_text()
  assert page.locator('.dialog input').count()==0
  page.get_by_role('button',name='Visit community seed help',exact=True).tap()
  page.get_by_role('button',name='Accept community help',exact=True).tap()
  page.get_by_role('button',name='Go plant carrots',exact=True).tap()
  page.locator('.plot').first.tap()
  page.get_by_role('button',name='🥕 Carrot Seeds (3 available)',exact=True).tap()
  page.get_by_role('button',name='🌱 Plant plan (1)',exact=True).tap()
  for _ in range(3):
   page.get_by_role('button',name='💧 Water all',exact=True).tap()
   page.get_by_role('button',name='☀️ End day',exact=True).tap()
  page.locator('.plot').first.tap()
  page.get_by_role('button',name='🧺 Harvest',exact=True).tap()
  page.get_by_role('button',name='Back to village',exact=True).tap()
  page.get_by_role('button',name='Farmers Market',exact=True).tap()
  page.get_by_role('button',name='Arrange Produce / Open Market',exact=True).tap()
  page.get_by_role('button',name='+',exact=True).tap()
  page.get_by_role('button',name='Rent table · $1 today',exact=True).tap()
  assert 'Pay now:' in page.locator('.dialog').inner_text()
  assert page.evaluate('Game.debtTotal(state)')==0
  page.get_by_role('button',name='Back to market preparation',exact=True).tap()
  page.get_by_role('button',name='Free blanket · $0',exact=True).tap()
  page.get_by_role('button',name='Open market',exact=True).tap()
  page.get_by_role('button',name='Welcome Next Customer',exact=True).tap()
  page.get_by_role('button',name='Hi! What can I get for you?',exact=True).tap()
  # A shopper may want sold-out produce; politely see them off, then serve the next.
  if page.evaluate('Game.missingProduce(state).length'):
   page.get_by_role('button',name='Help with sold-out produce',exact=True).tap()
   page.get_by_role('button',name="I'm sorry, we're sold out of that today.",exact=True).tap()
   page.get_by_role('button',name='Bye!',exact=True).tap()
   page.get_by_role('button',name='Welcome Next Customer',exact=True).tap()
   page.get_by_role('button',name='Hi! What can I get for you?',exact=True).tap()
  page.get_by_role('button',name='🧺 Fill customer basket',exact=True).tap()
  page.locator('.produce-choices button[aria-label^="Add " ]').first.tap()
  page.locator('#total-answer').fill('2')
  page.get_by_role('button',name='⚖️ Check total / collect payment',exact=True).tap()
  page.get_by_role('button',name='💵 Count change',exact=True).tap()
  for _ in range(3):page.get_by_role('button',name='$1',exact=True).tap()
  page.get_by_role('button',name='Give change',exact=True).tap()
  page.get_by_role('button',name='Thank you so much! I hope to see you again!',exact=True).tap()
  assert page.evaluate('state.cash')==2
  page.reload()
  assert page.evaluate('[state.cash,state.goal,state.owned.canopy,state.seeds.carrot]')==[2,4,1,2]
  page.get_by_role('button',name='My Garden',exact=True).tap()
  page.get_by_role('button',name='☀️ End day',exact=True).tap()
  page.get_by_role('button',name='Back to village',exact=True).tap()
  page.get_by_role('button',name='Farmers Market',exact=True).tap()
  page.get_by_role('button',name='Arrange Produce / Open Market',exact=True).tap()
  page.get_by_role('button',name='+',exact=True).tap()
  page.get_by_role('button',name='Rent table · $1 today',exact=True).tap()
  page.get_by_role('button',name='Open market',exact=True).tap()
  assert page.evaluate('state.cash')==1
  page.reload()
  assert page.evaluate('[state.cash,state.tableRented,Game.customerLimit(state)]')==[1,True,6]
  assert not errors,errors
  print('PASS: v1 save migration → Job Board placeholder → free seeds → grow/harvest → reviewed deferred offer without accepting → free blanket sale → saved recovery → paid rental persists; touch-only 390×844')
  browser.close()
finally:server.shutdown()
