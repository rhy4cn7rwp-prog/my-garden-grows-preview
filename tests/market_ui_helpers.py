"""Use the same visible register keys as a player; no native numeric keyboard."""
def enter_total(page, value):
 if page.locator('.total-keypad-dialog').count()==0:
  page.get_by_role('button',name='Calculate total',exact=True).tap()
 page.get_by_role('button',name='Clear',exact=True).tap()
 for digit in str(value):
  page.get_by_role('button',name='Decimal point' if digit=='.' else digit,exact=True).tap()

def solve_lines(page):
 """Submit each generated item subtotal through the visible keypad."""
 while page.get_by_role('button',name='Confirm line',exact=True).count():
  value=page.evaluate('()=>{const id=Game.nextMathLine(state);return (Math.round(Game.marketPrice(state,id)*100)*state.basket[id]/100).toFixed(2)}')
  enter_total(page,value)
  page.get_by_role('button',name='Confirm line',exact=True).tap()
