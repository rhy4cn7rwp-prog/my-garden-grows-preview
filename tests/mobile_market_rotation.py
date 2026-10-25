"""Real welcome buttons, bounded saved rotation, regular purchases, refresh and next day."""
import os
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
from market_ui_helpers import enter_total
root=Path(__file__).resolve().parents[1]
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)));Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':390,'height':664},is_mobile=True,has_touch=True,ignore_https_errors=bool(os.environ.get('PREVIEW_URL')))
  page.set_default_timeout(6000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(os.environ.get('PREVIEW_URL',f'http://127.0.0.1:{server.server_port}/'))
  def tap(label):page.get_by_role('button',name=label,exact=True).tap()
  page.evaluate('''()=>{state=Game.initial();state.owned.scale=state.owned.table=1;state.bagCount=100;for(const c of CROPS)state.inventory[c.id]=state.display[c.id]=100;Game.openMarket(state);go('market')}''')
  seen=[]
  for i in range(40):
   tap('Welcome Next Customer');name=page.evaluate('state.customer.name');assert name not in seen[-8:];seen.append(name)
   assert page.locator('.market-conversation').count()==0
   tap('Hi! What can I get for you?');assert page.locator('.market-tableau > .market-conversation').count()==1
   assert page.locator('.market-controls .market-conversation').count()==0
   if i<3:
    tap('🧺 Fill customer basket')
    for label,n in page.evaluate('Object.entries(state.customer.want).map(([id,n])=>[crop(id).name,n])'):
     for _ in range(n):tap('Add '+label)
    enter_total(page,page.evaluate('Game.totalOrder(state)'));tap('Confirm total');tap('💵 Count change')
    change=round(page.evaluate('state.tendered-Game.totalOrder(state)')*100)
    for cents,label in [(2000,'$20'),(1000,'$10'),(500,'$5'),(100,'$1'),(25,'25¢'),(10,'10¢'),(5,'5¢'),(1,'1¢')]:
     while change>=cents:tap(label);change-=cents
    tap('Give change');tap('Thanks for shopping with us!')
   else:
    tap('Talk about the order');tap("I'm sorry, we're sold out of that today.");tap('Bye!')
  assert len(set(seen))==28
  assert page.evaluate('[state.visitors,state.customersServed,state.bagCount]')==[40,3,97]
  before=page.evaluate('state.customerHistory');assert sum(r['purchases'] for r in before['people'].values())==3
  page.reload();assert page.evaluate('state.customerHistory')==before
  tap('Farmers Market')
  page.evaluate('''()=>{Game.closeMarket(state);Game.endDay(state);for(const c of CROPS)state.display[c.id]=state.inventory[c.id];Game.openMarket(state);go('market')}''')
  tap('Welcome Next Customer');assert page.evaluate('state.customer.name') not in seen[-8:]
  assert page.evaluate('state.customerHistory.sequence')==41
  active=page.evaluate('[state.customer,state.customerHistory,state.cash,state.inventory,state.bagCount]')
  page.reload();assert page.evaluate('[state.customer,state.customerHistory,state.cash,state.inventory,state.bagCount]')==active
  assert page.locator('.market-conversation').count()==0
  assert not errors,errors
  print('PASS 40 welcome-button arrivals, all 28 names, no recent repeats, actual purchases, refresh/next day and pending customer recovery',flush=True)
  browser.close()
finally:server.shutdown()
