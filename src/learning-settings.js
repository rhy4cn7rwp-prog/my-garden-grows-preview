function chooseExperienceScreen() {
  show(
    `<h2>A garden for you!</h2><p>Choose how you like to play. Both earn the same rewards. You can change this any time in Play &amp; Sound Settings.</p><div class="learning-choices"><button class="btn" onclick="selectExperience('little')">I'm still learning to read!<small>Little Gardener · pictures, counting and helping</small></button><button class="btn" onclick="selectExperience('growing')">I'm ready for a challenge!<small>Growing Gardener · words, numbers and money</small></button></div>`,
    "experience-choice",
  );
}
function selectExperience(mode) {
  Game.chooseExperience(state, mode);
  save();
  closeDialog();
}
function learningSettingsMarkup() {
  return `<h2>Play &amp; Sound Settings</h2><p>Progress stays with you. An unfinished job or lesson keeps its current puzzle when you switch; new activities use your choice.</p><div class="learning-choices"><button class="btn" aria-pressed="${state.learningExperience === "little"}" onclick="setLearningPreference('little')">I'm still learning to read! · Little Gardener</button><button class="btn" aria-pressed="${state.learningExperience === "growing"}" onclick="setLearningPreference('growing')">I'm ready for a challenge! · Growing Gardener</button></div><div class="learning-settings"><label><input type="checkbox" ${state.narrationEnabled ? "checked" : ""} onchange="setAudioPreference('narrationEnabled',this.checked)"/>Character narration</label><label><input type="checkbox" ${state.effectsEnabled ? "checked" : ""} onchange="setAudioPreference('effectsEnabled',this.checked)"/>Sound effects</label></div><button class="btn alt" onclick="Narration.speak('Choose the gardening experience you enjoy. Both earn the same rewards. You can turn voices and sound effects on or off separately.','guide',true)">Read to Me</button><p>${typeof Narration !== "undefined" ? Narration.status : ""}</p><button class="btn alt" onclick="reset()">Start a new farm</button>`;
}
function learningSettings() {
  show(learningSettingsMarkup(), "learning-settings");
}
function setLearningPreference(mode) {
  Game.chooseExperience(state, mode);
  save();
  learningSettings();
}
function setAudioPreference(key, value) {
  if (!["narrationEnabled", "effectsEnabled"].includes(key)) return;
  state[key] = !!value;
  Narration.stop();
  save();
}
function claimStarterPack() {
  act(() => {
    Game.claimStarter(state);
    show(
      `<h2>Welcome to Seed &amp; Feed!</h2><p>These are your free starter planting supplies: 3 Carrot Seeds, 2 Green Bean Seeds, and 2 Lettuce Seeds. They are yours once, to help your garden begin.</p><button class="btn" onclick="go('garden')">Go plant!</button>`,
    );
    Narration.speak(
      "Welcome, gardener! Here are your free starter planting supplies. Let us get growing!",
      "shop",
    );
  });
}
function marketSetupDialog() {
  const cost = Game.marketSetupTotal(state);
  show(
    `<h2>Your first market stand</h2><p>A table displays your harvest ($8), a scale weighs it ($5), a cash register keeps payments ($4), and 10 paper bags carry purchases ($3). Keep your equipment for future market days.</p><p>Only missing pieces are charged. Total: ${money(cost)}. You have ${money(state.cash)}.</p><button class="btn" onclick="buyMarketSetup()" ${cost <= 0 || state.cash < cost ? "disabled" : ""}>Buy missing setup for ${money(cost)}</button><button class="btn alt" onclick="go('jobs')">Earn $1 helping neighbors</button>`,
  );
}
function buyMarketSetup() {
  act(() => {
    const paid = Game.purchaseMarketSetup(state);
    show(
      `<h2>Your stand is ready!</h2><p>You paid ${money(paid)}. Your balance is ${money(state.cash)}.</p><button class="btn" onclick="go('market')">Visit Farmers Market</button>`,
    );
  });
}
function littleMarketCheckout() {
  act(() => {
    Game.autoPayLittle(state);
    popup = "";
    dialogKey = null;
    state.notice = "Order bagged and payment collected!";
    render();
  });
}
