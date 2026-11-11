/* Read only visible instructions; never invent answers or start playback on a timer. */
function readCurrentScreen() {
  if (dialogKey === 'guidebook') return readGuidePage();
  const dialog = document.querySelector('.modal .dialog');
  if (dialog) {
    const nodes = [...dialog.querySelectorAll('h2,h3,p,li,dt,dd,.tag,.garden-question')];
    const text = nodes.filter(e => e.getClientRects().length && !e.closest('[aria-hidden="true"]'))
      .map(e => e.innerText).filter(Boolean).join('. ');
    return Narration.speak(text || dialog.innerText, 'guide', true);
  }
  if (view === 'jobs' && state.jobs?.active && !state.jobs.active.ended) return Neighborhood.readInstruction();
  if (view === 'market' && document.querySelector('.market-conversation')) return readMarketDialogue();
  const intros = {
    clubhouse: 'Welcome to your Clubhouse! Swipe to look around. Hold a treasure to move it. Tap the How to Play book for a guide, or Go to Town to explore.',
    town: 'Welcome to the village! Visit My Garden, Seed and Feed, Market Supplies, the Farmers Market, the Dream Shop, or the Job Board. Choose a building to visit.',
    garden: 'This is your garden. Tap an empty plot to choose planting supplies. Water each planted crop daily with the watering can or Water All. Tap ripe crops or use Harvest All Ready Crops. End Day moves to tomorrow. Weeding is optional; it gives each crop planted at the time one extra harvest unit.',
    seeds: 'Welcome to Seed and Feed! Tap planting supplies to learn their prices, growing time, and harvest value. Choose quantities, then review your basket before checking out.',
    supplies: 'Welcome to Market Supplies! Tap supplies to see quantities and prices. Review your basket before buying. Equipment and rentals are also available.',
    dream: 'Welcome to the Dream Shop! Tap a dream item to choose a savings goal. Choosing a goal costs nothing. When you have saved enough, visit here and choose Buy. Your purchased treasure will be waiting in your Clubhouse.',
    market: 'Welcome to your Farmers Market! Arrange your produce and open the market when you are ready. Greet each customer, listen to their order, fill the basket, and check out.',
    jobs: 'Welcome to the Neighborhood Job Board! Choose a job to help a neighbor. Finish for one dollar. Beat an existing personal best for three dollars total.'
  };
  Narration.speak(intros[view] || 'Choose an activity to explore.', 'guide', true);
}

function toggleScreenNarration() {
  if (Narration.busy) Narration.stop();
  else readCurrentScreen();
}
document.addEventListener('narrationvoiceschange', () => {
  const button = document.querySelector('.narration-nav');
  if (button) button.setAttribute('aria-label', Narration.busy ? 'Stop reading' : 'Read this screen');
});
