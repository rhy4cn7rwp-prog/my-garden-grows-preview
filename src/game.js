/* Game rules have no DOM or storage dependencies. Money calculations use integer cents at transaction boundaries. */
(function (root) {
  "use strict";
  const roomLayout =
    typeof module !== "undefined"
      ? require("./clubhouse-layout.js")
      : root.ClubhouseLayout;
  const supplyShop =
    typeof module !== "undefined"
      ? require("./market-supplies-rules.js")
      : root.MarketSupplyRules;
  const crops = [
    {
      id: "carrot",
      name: "Carrots",
      seed: 1,
      price: 2,
      unit: "each",
      days: 3,
      yield: 2,
      repeat: 0,
      icon: "🥕",
    },
    {
      id: "corn",
      name: "Corn",
      seed: 2,
      price: 3,
      unit: "each",
      days: 5,
      yield: 2,
      repeat: 0,
      icon: "🌽",
    },
    {
      id: "beans",
      name: "Green beans",
      seed: 2,
      price: 4,
      unit: "lb",
      days: 3,
      yield: 1,
      repeat: 2,
      icon: "🫛",
    },
    {
      id: "strawberry",
      name: "Strawberries",
      seed: 3,
      price: 6,
      unit: "lb",
      days: 4,
      yield: 1,
      repeat: 2,
      icon: "🍓",
    },
    {
      id: "cucumber",
      name: "Cucumbers",
      seed: 2,
      price: 3,
      unit: "each",
      days: 4,
      yield: 2,
      repeat: 2,
      icon: "🥒",
    },
    {
      id: "potato",
      name: "Potatoes",
      seed: 2,
      price: 3,
      unit: "lb",
      days: 5,
      yield: 2,
      repeat: 0,
      icon: "🥔",
    },
    {
      id: "onion",
      name: "Onions",
      seed: 1,
      price: 2,
      unit: "each",
      days: 4,
      yield: 2,
      repeat: 0,
      icon: "🧅",
    },
    {
      id: "tomato",
      name: "Tomatoes",
      seed: 2,
      price: 3,
      unit: "each",
      days: 4,
      yield: 3,
      repeat: 2,
      icon: "🍅",
    },
    {
      id: "lettuce",
      name: "Lettuce",
      seed: 1.5,
      price: 3,
      unit: "each",
      days: 3,
      yield: 2,
      repeat: 0,
      icon: "🥬",
    },
    {
      id: "radish",
      name: "Radishes",
      seed: 1.5,
      price: 2,
      unit: "each",
      days: 2,
      yield: 4,
      repeat: 0,
      icon: "🌱",
    },
  ];
  const bundle = { carrot: 3, onion: 2, beans: 2, strawberry: 1 };
  const supplies = { table: 8, canopy: 10, bags: 3, scale: 5 };
  // One catalogue for both checkout rules and the illustrated Dream Shop.
  const dreams = [
    { id: "ball", name: "Soccer ball", price: 100 },
    { id: "bike", name: "Bicycle", price: 250 },
    { id: "tablet", name: "Tablet", price: 300 },
    { id: "guitar", name: "Guitar", price: 350 },
    { id: "camera", name: "Camera", price: 400 },
    { id: "puppy", name: "Puppy fund", price: 500 },
  ];
  const rentalPrices = {
    table: { upfront: 1, deferred: 3 },
    scale: { upfront: 1, deferred: 2 },
    bags: { upfront: 0.5, deferred: 1 },
  };
  const debtCap = 6;
  const get = (id) => crops.find((c) => c.id === id);
  const cents = (n) => Math.round(n * 100);
  const quantity = (n) => Number.isSafeInteger(n) && n >= 0;
  function requireRule(ok, message) {
    if (!ok) throw Error(message);
  }
  function initial() {
    return {
      version: 1,
      marketSupplyStock: supplyShop
        ? supplyShop.emptyStock()
        : {
            consumables: { boxes: 0, priceTags: 0 },
            reusable: { marketSigns: 0, produceBaskets: 0 },
          },
      marketSupplyCart: {},
      cash: 50,
      day: 1,
      season: 1,
      goal: 1,
      dreamPurchaseCount: 0,
      dreamPurchases: {},
      clubhousePositions: {},
      clubhouseLayoutVersion: 2,
      seeds: {},
      plots: Array(25).fill(null),
      inventory: {},
      plan: {},
      display: {},
      cart: {},
      supcart: {},
      owned: { table: 0, canopy: 0, bags: 0, scale: 0 },
      hour: 9,
      marketElapsedMs: 0,
      marketStartedAt: null,
      marketClosedAt: null,
      visitors: 0,
      sales: 0,
      customer: null,
      step: "greet",
      basket: {},
      change: 0,
      won: false,
      marketOpen: false,
      marketPlayed: false,
      weather: "sunny",
      notice: "",
      standMode: "blanket",
      tableRented: false,
      rentals: {},
      equipmentDebt: [],
      marketSettled: false,
      marketChargesPaid: 0,
      rentalUpfrontPaid: 0,
      bagCount: 0,
      rentalBagsRemaining: 0,
      customersServed: 0,
      marketExpenses: [],
      legacyAccounting: false,
      lastMarketReport: null,
    };
  }
  function dictionary(value, ids) {
    return (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.entries(value).every(
        ([id, n]) => ids.includes(id) && quantity(n) && n <= 100000,
      )
    );
  }
  function recover(raw, backup = null) {
    try {
      const s = JSON.parse(raw),
        ids = crops.map((c) => c.id);
      requireRule(s && s.version === 1, "Unknown or missing save version.");
      requireRule(
        Number.isFinite(s.cash) && s.cash >= 0 && s.cash <= 1e8,
        "cash",
      );
      requireRule(
        quantity(s.goal) &&
          s.goal < 6 &&
          Number.isInteger(s.day) &&
          s.day >= 1 &&
          s.day <= 20 &&
          Number.isInteger(s.season) &&
          s.season >= 1,
        "calendar/goal",
      );
      for (const field of [
        "seeds",
        "inventory",
        "display",
        "cart",
        "plan",
        "supcart",
      ]) {
        if (field === "plan") continue;
        requireRule(
          dictionary(
            s[field],
            field === "supcart"
              ? Object.keys(supplies)
              : field === "cart"
                ? [...ids, "bundle"]
                : ids,
          ),
          field,
        );
      }
      requireRule(
        s.owned && Object.keys(supplies).every((id) => quantity(s.owned[id])),
        "supplies",
      );
      requireRule(
        Array.isArray(s.plots) &&
          s.plots.length === 25 &&
          s.plots.every(
            (p) =>
              p === null ||
              (get(p.id) &&
                quantity(p.age) &&
                quantity(p.left) &&
                p.left <= get(p.id).repeat &&
                typeof p.watered === "boolean" &&
                Number.isFinite(p.quality) &&
                p.quality >= 30 &&
                p.quality <= 100),
          ),
        "plots",
      );
      // Resume safely between customers; pending money is never committed during recovery.
      const clean = {
        ...initial(),
        ...s,
        customer: null,
        basket: {},
        change: 0,
        step: "greet",
        plan: {},
        notice: "",
      };
      // Optional reward records migrate independently: an unknown/malformed
      // record must never reset an otherwise valid farm. A goal or `won` flag
      // is not evidence of a purchase. Never invent historical dates.
      clean.dreamPurchases = {};
      if (
        s.dreamPurchases &&
        typeof s.dreamPurchases === "object" &&
        !Array.isArray(s.dreamPurchases)
      ) {
        for (const item of dreams) {
          const record = s.dreamPurchases[item.id];
          if (!record || typeof record !== "object" || Array.isArray(record))
            continue;
          const dated =
            Number.isSafeInteger(record.season) &&
            record.season >= 1 &&
            Number.isSafeInteger(record.day) &&
            record.day >= 1 &&
            record.day <= 20;
          if (!dated && record.price !== item.price && record.owned !== true)
            continue;
          clean.dreamPurchases[item.id] = {
            owned: true,
            season: dated ? record.season : null,
            day: dated ? record.day : null,
            price:
              Number.isFinite(record.price) && record.price >= 0
                ? record.price
                : null,
          };
        }
      }
      clean.dreamPurchaseCount = Math.max(Object.keys(clean.dreamPurchases).length,
        quantity(s.dreamPurchaseCount) ? s.dreamPurchaseCount : 0);
      // A failed optional room-script download must never reset a valid farm.
      clean.clubhousePositions = roomLayout
        ? roomLayout.recoverPositions(
            s.clubhousePositions,
            clean.dreamPurchases,
            s.clubhouseLayoutVersion ?? 1,
          )
        : s.clubhousePositions &&
            typeof s.clubhousePositions === "object" &&
            !Array.isArray(s.clubhousePositions)
          ? s.clubhousePositions
          : {};
      clean.clubhouseLayoutVersion = roomLayout
        ? 2
        : s.clubhouseLayoutVersion || 1;
      requireRule(
        typeof s.marketOpen === "boolean" &&
          typeof s.marketPlayed === "boolean" &&
          Number.isFinite(s.hour) &&
          s.hour >= 9 &&
          s.hour <= 13 &&
          quantity(s.visitors) &&
          Number.isFinite(s.sales) &&
          s.sales >= 0,
        "market",
      );
      // Preserve valid seed reservations without charging or duplicating seeds.
      for (const [index, id] of Object.entries(s.plan || {})) {
        if (
          /^(0|[1-9][0-9]?)$/.test(index) &&
          +index < 25 &&
          !clean.plots[index] &&
          get(id) &&
          availableSeeds(clean, id) > 0
        )
          clean.plan[index] = id;
      }
      // Additive migration: retain v1 farms, money, equipment and this day's rental.
      clean.standMode = ["blanket", "rental", "owned"].includes(s.standMode)
        ? s.standMode
        : s.owned.table
          ? "owned"
          : "blanket";
      clean.tableRented = s.tableRented === true;
      if (clean.standMode === "owned" && !clean.owned.table)
        clean.standMode = "blanket";
      clean.rentals = s.rentals || {};
      clean.equipmentDebt = s.equipmentDebt || [];
      requireRule(
        clean.rentals &&
          typeof clean.rentals === "object" &&
          !Array.isArray(clean.rentals) &&
          Object.entries(clean.rentals).every(
            ([id, r]) =>
              rentalPrices[id] &&
              r &&
              ["upfront", "deferred", "legacy"].includes(r.payment),
          ),
        "rentals",
      );
      requireRule(
        Array.isArray(clean.equipmentDebt) &&
          clean.equipmentDebt.length <= 3 &&
          clean.equipmentDebt.every(
            (d) =>
              d &&
              rentalPrices[d.id] &&
              Number.isInteger(d.cents) &&
              d.cents > 0 &&
              d.cents <= 600 &&
              typeof d.day === "string",
          ) &&
          clean.equipmentDebt.reduce((n, d) => n + d.cents, 0) <=
            cents(debtCap),
        "rental charges",
      );
      if (clean.tableRented && !clean.rentals.table)
        clean.rentals.table = { payment: "legacy" };
      clean.marketSettled = s.marketSettled === true;
      clean.marketChargesPaid =
        Number.isFinite(s.marketChargesPaid) && s.marketChargesPaid >= 0
          ? s.marketChargesPaid
          : 0;
      clean.rentalUpfrontPaid =
        Number.isFinite(s.rentalUpfrontPaid) && s.rentalUpfrontPaid >= 0
          ? s.rentalUpfrontPaid
          : s.tableRented
            ? 1
            : 0;
      // Migrate former bag packs/daily access once, without charging or resetting farms.
      clean.bagCount =
        s.bagCount === undefined ? s.owned.bags * 10 : s.bagCount;
      clean.rentalBagsRemaining =
        s.rentalBagsRemaining === undefined
          ? clean.rentals.bags
            ? 10
            : 0
          : s.rentalBagsRemaining;
      requireRule(
        quantity(clean.bagCount) &&
          quantity(clean.rentalBagsRemaining) &&
          clean.rentalBagsRemaining <= 10,
        "bag inventory",
      );
      clean.customersServed = quantity(s.customersServed)
        ? s.customersServed
        : 0;
      clean.legacyAccounting =
        s.legacyAccounting === true || s.marketExpenses === undefined;
      clean.marketExpenses =
        s.marketExpenses === undefined
          ? migrateExpenses(clean)
          : s.marketExpenses;
      requireRule(
        Array.isArray(clean.marketExpenses) &&
          clean.marketExpenses.every(
            (e) =>
              e &&
              [
                "table",
                "scale",
                "bags",
                "bagPurchase",
                "equipment",
                "marketSupplies",
                "legacy",
              ].includes(e.category) &&
              ["upfront", "manual", "closing"].includes(e.timing) &&
              quantity(e.cents),
          ),
        "market expenses",
      );
      clean.lastMarketReport = validReport(s.lastMarketReport)
        ? s.lastMarketReport
        : null;
      for (const id of ids)
        clean.display[id] = Math.min(
          clean.display[id] || 0,
          clean.inventory[id] || 0,
        );
      restoreCustomer(clean, s, ids);
      if (supplyShop) Object.assign(clean, supplyShop.recover(s));
      clean.marketStartedAt = validMarketStamp(s.marketStartedAt)
        ? s.marketStartedAt
        : null;
      clean.marketClosedAt =
        validMarketStamp(s.marketClosedAt) &&
        clean.marketStartedAt !== null &&
        s.marketClosedAt >= clean.marketStartedAt
          ? s.marketClosedAt
          : null;
      // New saves store active play only. Legacy saves retain their last recorded
      // clock reading, without charging for time spent away before this update.
      clean.marketElapsedMs = Number.isFinite(s.marketElapsedMs) && s.marketElapsedMs >= 0
        ? Math.min(marketDurationMs, s.marketElapsedMs)
        : Math.max(0, Math.min(marketDurationMs,
            !clean.marketOpen && clean.marketClosedAt !== null
              ? clean.marketClosedAt - clean.marketStartedAt
              : (clean.hour - 9) * 60 * marketMinuteMs));
      ensureMarketStart(clean);
      return clean;
    } catch {
      return backup ? recover(backup) : initial();
    }
  }
  function chooseGoal(s, index) {
    requireRule(quantity(index) && index < 6, "Choose a valid goal.");
    requireRule(
      !ownsDream(s, dreams[index].id),
      "That dream is already in your clubhouse. Choose another one!",
    );
    s.goal = index;
    s.won = false;
  }
  function ownsDream(s, id) {
    return (
      dreams.some((d) => d.id === id) &&
      Object.prototype.hasOwnProperty.call(s.dreamPurchases || {}, id)
    );
  }
  function acknowledgeGoal(s) {
    const item = dreams[s.goal];
    if (s.won || ownsDream(s, item.id) || cents(savings(s)) < cents(item.price))
      return null;
    // Reaching a goal only acknowledges the achievement. Checkout is separate.
    s.won = true;
    return item;
  }
  function purchaseDream(s, id) {
    const item = dreams.find((d) => d.id === id);
    requireRule(item, "Choose an item from the Dream Shop.");
    requireRule(!ownsDream(s, id), "This dream is already in your clubhouse!");
    requireRule(
      cents(savings(s)) >= cents(item.price),
      "Keep saving! You need enough money for this dream after outstanding equipment payments.",
    );
    // Validate everything before committing; repeat taps cannot double-charge.
    s.dreamPurchaseCount = dreamPurchaseCount(s) + 1;
    s.cash = (cents(s.cash) - cents(item.price)) / 100;
    s.dreamPurchases = {
      ...(s.dreamPurchases || {}),
      [id]: { owned: true, season: s.season, day: s.day, price: item.price },
    };
    if (dreams[s.goal].id === id) s.won = true;
    return item.price;
  }
  function moveClubhouseItem(s, id, position) {
    requireRule(
      roomLayout,
      "Room controls are still loading. Please refresh and try again.",
    );
    requireRule(
      ownsDream(s, id),
      "Only your purchased treasures can be moved.",
    );
    requireRule(
      roomLayout.valid(id, position),
      "Try the floor or a suitable display surface.",
    );
    requireRule(
      !roomLayout.blockers(id, position, s.clubhousePositions, s.dreamPurchases)
        .length,
      "Give each treasure a little space. Try another spot.",
    );
    s.clubhousePositions = {
      ...s.clubhousePositions,
      [id]: { surface: position.surface, angle: position.angle, y: position.y },
    };
  }
  function resetClubhouseItem(s, id) {
    requireRule(
      roomLayout,
      "Room controls are still loading. Please refresh and try again.",
    );
    requireRule(ownsDream(s, id), "Choose one of your purchased treasures.");
    const positions = { ...s.clubhousePositions },
      reset = [id];
    delete positions[id];
    // If someone moved a treasure into this home spot, return that blocker
    // home too. At most six entries can clear; default spots are disjoint.
    for (let i = 0; i < reset.length; i++)
      for (const blocker of roomLayout.blockers(
        reset[i],
        roomLayout.defaults[reset[i]],
        positions,
        s.dreamPurchases,
      ))
        if (!reset.includes(blocker)) {
          delete positions[blocker];
          reset.push(blocker);
        }
    s.clubhousePositions = positions;
    return reset;
  }
  function resetClubhouseLayout(s) {
    s.clubhousePositions = {};
  }
  function cartTotal(s, kind) {
    const obj = kind === "seeds" ? s.cart : s.supcart;
    return (
      Object.entries(obj).reduce((sum, [id, n]) => {
        requireRule(
          quantity(n) && n <= 100,
          "Choose a quantity from 0 to 100.",
        );
        const price =
          kind === "seeds"
            ? id === "bundle"
              ? 11
              : get(id)?.seed
            : supplies[id];
        requireRule(price !== undefined, "Unknown item.");
        return sum + cents(price) * n;
      }, 0) / 100
    );
  }
  function purchase(s, kind) {
    requireRule(["seeds", "supplies"].includes(kind), "Unknown shop.");
    const total = cartTotal(s, kind);
    requireRule(total > 0, "Your basket is empty.");
    requireRule(
      cents(total) <= cents(s.cash),
      "Not enough money. Remove an item and try again.",
    );
    const obj = kind === "seeds" ? s.cart : s.supcart;
    if (kind === "supplies")
      for (const [id, n] of Object.entries(obj))
        requireRule(
          !n || id === "bags" || (!s.owned[id] && n === 1),
          "You only need one of each supply.",
        );
    s.cash = (cents(s.cash) - cents(total)) / 100;
    for (const [id, n] of Object.entries(obj)) {
      if (kind === "supplies") {
        if (id === "bags") {
          s.bagCount += 10 * n;
          s.owned.bags += n;
        } else s.owned[id] = n || s.owned[id];
        if (n)
          recordExpense(
            s,
            id === "bags" ? "bagPurchase" : "equipment",
            cents(supplies[id]) * n,
            "upfront",
          );
      } else if (id === "bundle")
        for (const [crop, q] of Object.entries(bundle))
          s.seeds[crop] = (s.seeds[crop] || 0) + q * n;
      else s.seeds[id] = (s.seeds[id] || 0) + n;
    }
    if (kind === "supplies" && obj.table && !s.marketPlayed)
      s.standMode = "owned";
    s[kind === "seeds" ? "cart" : "supcart"] = {};
    return total;
  }
  function purchaseMarketSupplies(s) {
    requireRule(
      !!supplyShop,
      "Supply shop could not load. Refresh and try again.",
    );
    return supplyShop.purchase(s, recordExpense);
  }
  function plan(s, i, id) {
    requireRule(
      quantity(i) && i < 25 && !s.plots[i] && get(id),
      "Choose an empty plot.",
    );
    if (s.plan[i]) {
      delete s.plan[i];
      return;
    }
    requireRule(availableSeeds(s, id) > 0, "No unreserved seeds left.");
    s.plan[i] = id;
  }
  function plantPlan(s) {
    const entries = Object.entries(s.plan);
    requireRule(entries.length, "Plan a planting first.");
    const needed = {};
    for (const [i, id] of entries) {
      requireRule(
        quantity(+i) && +i < 25 && !s.plots[i] && get(id),
        "Invalid planting plan.",
      );
      needed[id] = (needed[id] || 0) + 1;
    }
    for (const [id, n] of Object.entries(needed))
      requireRule((s.seeds[id] || 0) >= n, "Not enough seeds.");
    for (const [i, id] of entries) {
      s.plots[i] = {
        id,
        age: 0,
        left: get(id).repeat,
        quality: 100,
        watered: true,
      };
      s.seeds[id]--;
    }
    s.plan = {};
  }
  function availableSeeds(s, id) {
    return Math.max(
      0,
      (s.seeds[id] || 0) - Object.values(s.plan).filter((x) => x === id).length,
    );
  }
  function cancelPlan(s, index) {
    delete s.plan[index];
  }
  function cancelAllPlans(s) {
    s.plan = {};
  }
  function harvestAll(s) {
    const harvested = {};
    let plots = 0;
    s.plots.forEach((p, i) => {
      if (!p || p.age < get(p.id).days) return;
      const id = p.id,
        before = s.inventory[id] || 0;
      harvest(s, i);
      harvested[id] = (harvested[id] || 0) + (s.inventory[id] - before);
      plots++;
    });
    return { harvested, plots };
  }
  function canSellCrop(s, id) {
    return get(id) && (get(id).unit !== "lb" || hasEquipment(s, "scale"));
  }
  function addAllToDisplay(s) {
    requireRule(
      !s.customer,
      "Finish helping your customer before changing the stand.",
    );
    const added = {},
      skipped = {};
    for (const c of crops) {
      const count = s.inventory[c.id] || 0;
      s.display[c.id] = Math.min(s.display[c.id] || 0, count);
      if (!count) continue;
      if (!canSellCrop(s, c.id)) {
        skipped[c.id] = count;
        s.display[c.id] = 0;
        continue;
      }
      const n = count - s.display[c.id];
      if (n > 0) added[c.id] = n;
      s.display[c.id] = count;
    }
    return { added, skipped };
  }
  function water(s) {
    for (const p of s.plots) if (p) p.watered = true;
  }
  function endDay(s) {
    settleMarket(s);
    if (s.marketPlayed || s.marketExpenses.length)
      s.lastMarketReport = accountingReport(s);
    s.day++;
    if (s.day > 20) {
      s.day = 1;
      s.season++;
    }
    s.weather = s.day % 7 === 0 ? "hot" : "sunny";
    for (const p of s.plots) {
      if (!p || p.age >= get(p.id).days) continue;
      if (p.watered) p.age++;
      else
        p.quality = Math.max(30, p.quality - (s.weather === "hot" ? 25 : 12));
      p.watered = false;
    }
    s.hour = 9;
    s.marketElapsedMs = 0;
    marketActiveAnchors.delete(s);
    s.marketStartedAt = null;
    s.marketClosedAt = null;
    s.visitors = 0;
    s.sales = 0;
    s.customer = null;
    s.basket = {};
    s.change = 0;
    s.step = "greet";
    s.marketOpen = false;
    s.marketPlayed = false;
    s.tableRented = false;
    s.rentals = {};
    s.marketSettled = false;
    s.marketChargesPaid = 0;
    s.rentalUpfrontPaid = 0;
    s.rentalBagsRemaining = 0;
    s.customersServed = 0;
    s.marketExpenses = [];
    s.legacyAccounting = false;
    s.standMode = s.owned.table ? "owned" : "blanket";
  }
  function harvest(s, i) {
    const p = s.plots[i];
    requireRule(p && p.age >= get(p.id).days, "This crop is still growing.");
    const c = get(p.id),
      n = p.quality < 60 ? Math.max(1, c.yield - 1) : c.yield;
    s.inventory[c.id] = (s.inventory[c.id] || 0) + n;
    const again = p.left > 0;
    if (again) {
      p.left--;
      p.age = 0;
      p.watered = false;
    } else s.plots[i] = null;
    return `Harvested ${n} ${c.unit} of ${c.name}. ${again ? "This plant will grow another harvest." : "This plot is free to replant."}`;
  }
  const marketMinuteMs = 5000,
    marketDurationMs = 240 * marketMinuteMs;
  function validMarketStamp(value) {
    return Number.isSafeInteger(value) && value >= 0;
  }
  function ensureMarketStart(s, now = Date.now()) {
    // Older saves only recorded a game hour. Convert their remaining time once;
    // a valid saved timestamp is never replaced by recovery or navigation.
    if (s.marketOpen && !validMarketStamp(s.marketStartedAt)) {
      s.marketStartedAt = Math.round(
        now - Math.max(0, Math.min(4, s.hour - 9)) * 60 * marketMinuteMs,
      );
      s.marketClosedAt = null;
    }
  }
  // Runtime anchors are deliberately not serialized: reopening starts paused.
  const marketActiveAnchors = new WeakMap();
  function marketTime(s, now = Date.now()) {
    const anchor = marketActiveAnchors.get(s);
    const elapsed = Math.min(marketDurationMs, Math.max(0, s.marketElapsedMs || 0) +
      (s.marketOpen && anchor !== undefined ? Math.max(0, now - anchor) : 0));
    const minutes = 540 + elapsed / marketMinuteMs;
    return { minutes, wholeMinutes: Math.floor(minutes),
      expired: elapsed >= marketDurationMs, elapsedMs: elapsed };
  }
  function pauseMarketClock(s, now = Date.now()) {
    s.marketElapsedMs = marketTime(s, now).elapsedMs;
    marketActiveAnchors.delete(s);
    if (s.marketOpen) s.hour = marketTime(s, now).wholeMinutes / 60;
  }
  function resumeMarketClock(s, now = Date.now()) {
    if (s.marketOpen && !marketActiveAnchors.has(s)) marketActiveAnchors.set(s, now);
  }
  function checkpointMarketClock(s, now = Date.now()) {
    const running = marketActiveAnchors.has(s);
    pauseMarketClock(s, now);
    if (running) resumeMarketClock(s, now);
  }
  function syncMarketClock(s, now = Date.now()) {
    if (!s.marketOpen) return false;
    ensureMarketStart(s, now);
    checkpointMarketClock(s, now);
    const time = marketTime(s, now);
    s.hour = time.wholeMinutes / 60;
    if (time.expired && !s.customer) {
      closeMarket(s, now);
      return true;
    }
    return false;
  }
  function openMarket(s, now = Date.now()) {
    requireRule(
      !s.marketPlayed && !s.marketOpen,
      "Your market has already opened today. End the farming day before opening again.",
    );
    requireRule(
      crops.some((c) => (s.display[c.id] || 0) > 0 && canSellCrop(s, c.id)),
      "Place harvested produce on your stand first.",
    );
    if (s.standMode === "rental" && !s.tableRented) {
      requireRule(
        cents(s.cash) >= 100,
        "A table rental costs $1 today. Choose the free blanket or agree to the $3 pay-after-market option.",
      );
      rentEquipment(s, "table", "upfront");
    }
    for (const c of crops) if (!canSellCrop(s, c.id)) s.display[c.id] = 0;
    s.marketOpen = true;
    s.marketPlayed = true;
    s.hour = 9;
    s.marketElapsedMs = 0;
    s.marketStartedAt = now;
    resumeMarketClock(s, now);
    s.marketClosedAt = null;
  }
  function closeMarket(s, now = Date.now()) {
    ensureMarketStart(s, now);
    if (s.marketOpen) {
      pauseMarketClock(s, now);
      s.marketClosedAt = s.marketStartedAt + s.marketElapsedMs;
    }
    settleMarket(s);
    s.marketOpen = false;
    s.hour = 13;
    s.customer = null;
    s.basket = {};
    s.step = "greet";
  }
  function dreamPurchaseCount(s) {
    return Math.max(quantity(s.dreamPurchaseCount) ? s.dreamPurchaseCount : 0,
      dreams.filter(d => ownsDream(s, d.id)).length);
  }
  function mathLevel(s) { return Math.min(5, Math.floor(dreamPurchaseCount(s) / 2)); }
  function orderDifficulty(s) {
    const level = mathLevel(s);
    // Every third shopper is an easier review; milestones never remove practice.
    return s.visitors % 3 === 2 ? Math.max(0, level - 1) : level;
  }
  function priceForLevel(id, level, visit) {
    const fraction = level === 0 ? 0 : level === 1
      ? [25, 50][visit % 2] : [0, 25, 50, 75][visit % 4];
    return (cents(get(id).price) + fraction) / 100;
  }
  function marketPrice(s, id) {
    if (!get(id)) return 0;
    return s.customer?.prices?.[id] ?? priceForLevel(id, orderDifficulty(s), s.visitors);
  }
  function newCustomer(s, name, now = Date.now()) {
    syncMarketClock(s, now);
    requireRule(
      s.marketOpen && !marketTime(s, now).expired,
      "The market is closed.",
    );
    requireRule(!s.customer, "Finish serving this customer first.");
    const stock = crops.filter((c) => marketStock(s, c.id) > 0);
    requireRule(stock.length, "Your display is sold out.");
    const level = orderDifficulty(s), prices = Object.fromEntries(
      crops.map(c => [c.id, priceForLevel(c.id, level, s.visitors)]));
    const a = stock[s.visitors % stock.length], want = {};
    const products = Math.min(stock.length, level >= 3 ? 3 : level >= 2 ? 2 + s.visitors % 2 : 1 + s.visitors % 2);
    const maxQuantity = [2, 2, 3, 4, 5, 8][level];
    const budget = [20, 20, 20, 20, 50, 90][level];
    let subtotal = 0;
    for (let i = 0; i < products; i++) {
      const item = stock[(s.visitors + i) % stock.length];
      const n = Math.min(marketStock(s, item.id),
        1 + (s.visitors + i) % maxQuantity,
        Math.floor((cents(budget) - subtotal) / cents(prices[item.id])));
      if (n > 0) { want[item.id] = n; subtotal += n * cents(prices[item.id]); }
    }
    // Some shoppers come looking for a crop we do not stock today.
    const unavailable = crops.filter((c) => !marketStock(s, c.id));
    if ((s.day + s.visitors) % 4 === 0 && unavailable.length) {
      const requested = unavailable[(s.day + s.visitors) % unavailable.length];
      delete want[a.id];
      want[requested.id] = 1;
    }
    s.customer = {
      name,
      want,
      prices,
      mathLevel: level,
      personality: ["curious", "thoughtful", "hurried"][
        (s.day + s.visitors) % 3
      ],
      satisfaction: 50,
      decision: (s.day * 19 + s.visitors * 37 + s.season * 11) % 100,
      response: "arrival",
    };
    s.visitors++;
    s.notice = "";
    s.basket = {};
    s.change = 0;
    s.step = "greet";
  }
  function marketStock(s, id) {
    return get(id) && canSellCrop(s, id)
      ? Math.min(s.inventory[id] || 0, s.display[id] || 0)
      : 0;
  }
  function missingProduce(s) {
    if (!s.customer) return [];
    return Object.entries(s.customer.want)
      .filter(([id, n]) => marketStock(s, id) < n)
      .map(([id]) => id);
  }
  function alternativeChoices(s) {
    const missing = missingProduce(s)[0];
    if (!missing || s.customer.alternativeOffered) return [];
    // Recommendations use sellable stock and fit this customer’s difficulty budget.
    const available = crops.filter(
      (c) =>
        marketStock(s, c.id) > 0 &&
        !s.customer.want[c.id] &&
        cents(marketPrice(s,c.id)) <= cents([20,20,20,20,50,90][s.customer.mathLevel ?? 0]) -
          Object.entries(s.customer.want).filter(([id])=>!missingProduce(s).includes(id))
            .reduce((n,[id,q])=>n+cents(marketPrice(s,id))*q,0),
    );
    const preferred = available.filter(c => (c.id === "strawberry") === (missing === "strawberry"));
    return preferred.length ? preferred : available;
  }
  function satisfaction(s, amount) {
    s.customer.satisfaction = Math.max(
      0,
      Math.min(100, (s.customer.satisfaction ?? 50) + amount),
    );
  }
  function greet(s, choice = "good") {
    requireRule(s.customer && s.step === "greet", "Welcome a customer first.");
    requireRule(
      ["excellent", "good", "wait"].includes(choice),
      "Choose a greeting.",
    );
    const c = s.customer;
    c.greeting = choice;
    satisfaction(s, choice === "excellent" ? 20 : choice === "good" ? 10 : -5);
    const leaves = choice === "wait" && c.personality === "hurried";
    c.response = leaves
      ? "wait-left"
      : choice === "wait"
        ? "wait-stayed"
        : choice;
    s.step = leaves ? "thanks" : "choose";
  }
  function suggestAlternative(s, id) {
    requireRule(
      s.customer && s.step === "choose",
      "Listen to the customer's order first.",
    );
    const missing = missingProduce(s)[0];
    requireRule(
      alternativeChoices(s).some((c) => c.id === id),
      "Choose an available alternative from your stand.",
    );
    const c = s.customer;
    c.alternativeOffered = true;
    const chance =
      ({ curious: 70, thoughtful: 40, hurried: 25 }[c.personality] ?? 45) +
      (c.greeting === "excellent" ? 15 : c.greeting === "good" ? 5 : 0);
    const accepted = (c.decision ?? 50) < chance;
    if (accepted) {
      const otherCost = Object.entries(c.want).filter(([key])=>!missingProduce(s).includes(key))
        .reduce((n,[key,q])=>n+cents(marketPrice(s,key))*q,0);
      const quantity = Math.min(c.want[missing], marketStock(s, id),
        Math.floor((cents([20,20,20,20,50,90][c.mathLevel ?? 0])-otherCost)/cents(marketPrice(s,id))));
      delete c.want[missing];
      c.want[id] = quantity;
      // Start a fresh basket for the customer's newly agreed order. No stock is consumed.
      s.basket = {};
      c.response = "alternative-accepted";
      satisfaction(s, 5);
    } else {
      c.response = "alternative-declined";
      s.basket = {};
      s.step = "thanks";
    }
    return accepted;
  }
  function offerSomethingElse(s) {
    requireRule(s.customer && s.step === "choose", "Listen to the customer's order first.");
    const choices = alternativeChoices(s);
    if (!choices.length) { declineOrder(s, "sorry"); return false; }
    // The customer chooses from actual stock, using their established preference.
    const choice = choices[(s.customer.decision ?? 50) % choices.length];
    const accepted = suggestAlternative(s, choice.id);
    if (accepted && missingProduce(s).length) {
      // One conversation resolves all unavailable lines; never leave an impossible order.
      for (const id of missingProduce(s)) delete s.customer.want[id];
    }
    return accepted;
  }
  function declineOrder(s, choice = "sorry") {
    requireRule(
      s.customer && s.step === "choose",
      "Listen to the customer's order first.",
    );
    requireRule(
      ["sorry", "return"].includes(choice),
      "Choose a helpful response.",
    );
    s.customer.response =
      choice === "return" ? "soldout-return" : "soldout-sorry";
    satisfaction(s, choice === "return" ? 3 : 1);
    s.basket = {};
    s.step = "thanks";
  }
  function customerResponse(s) {
    const responses = {
      arrival: "Hello!",
      excellent: "What a lovely welcome! Thank you for helping me today.",
      good: "Hi! Thank you. I'd like to buy some produce.",
      "wait-stayed": "Hello! May I ask about your vegetables?",
      "wait-left":
        "I need to hurry today, so I'll try another stand. Maybe next time!",
      "alternative-accepted":
        "Yes, I'd like to try that instead! Thank you for the suggestion.",
      "alternative-declined":
        "Thank you for offering. I need the produce on my list today, so I'll try elsewhere.",
      "soldout-sorry":
        "Thanks for letting me know. I'll look at another stand today.",
      "soldout-return":
        "Thank you! I'll come back another day to see what you've grown.",
      "sale-complete": "Thank you for helping me with my shopping!",
    };
    return (
      responses[s.customer?.response] ||
      (s.step === "thanks" ? responses["sale-complete"] : "Hello!")
    );
  }
  function totalOrder(s) {
    return (
      Object.entries(s.basket).reduce(
        (t, [id, n]) => t + cents(marketPrice(s, id)) * n,
        0,
      ) / 100
    );
  }
  function checkBasket(s) {
    requireRule(s.customer && s.step === "choose", "Prepare an order first.");
    requireRule(
      Object.entries(s.customer.want).every(
        ([id, n]) =>
          s.basket[id] === n &&
          n <= (s.display[id] || 0) &&
          n <= (s.inventory[id] || 0),
      ),
      "Check the quantities against the order. You can adjust your basket and try again!",
    );
    requireRule(
      Object.keys(s.basket).every((id) => s.customer.want[id] !== undefined),
      "One of these vegetables is not on the order. Remove it and try again!",
    );
  }
  function ring(s, answer) {
    checkBasket(s);
    requireRule(
      !Object.keys(s.basket).some((id) => get(id).unit === "lb") ||
        hasEquipment(s, "scale"),
      "You need a scale for produce sold by the pound.",
    );
    const total = totalOrder(s);
    requireRule(
      Number.isFinite(answer) && cents(answer) === cents(total),
      "Try multiplying each quantity by its price, then add the amounts.",
    );
    s.tendered =
      (s.customer.mathLevel === undefined ? [5, 10, 20, 50, 100] :
        s.customer.mathLevel >= 5 ? [20, 50, 100] :
        s.customer.mathLevel >= 4 ? [20, 50] : [5, 10, 20]).find((n) => n >= total) ||
      Math.ceil(total / 100) * 100;
    s.step = "pay";
    s.change = 0;
  }
  function finish(s) {
    requireRule(
      s.step === "pay" && s.customer,
      "This sale has already finished.",
    );
    requireRule(
      cents(s.change) === cents(s.tendered - totalOrder(s)),
      "Count back the exact change.",
    );
    requireRule(
      Object.entries(s.customer.want).every(([id, n]) => s.basket[id] === n) &&
        Object.keys(s.basket).every((id) => s.customer.want[id] !== undefined),
      "Fill exactly the requested basket.",
    );
    requireRule(
      !orderNeedsBag(s) || bagsRemaining(s) > 0,
      "Every purchase needs 1 paper bag before the sale can finish.",
    );
    const total = totalOrder(s);
    for (const [id, n] of Object.entries(s.basket)) {
      requireRule(
        n <= (s.inventory[id] || 0) && n <= (s.display[id] || 0),
        "Not enough produce.",
      );
    }
    for (const [id, n] of Object.entries(s.basket)) {
      s.inventory[id] -= n;
      s.display[id] -= n;
    }
    if (orderNeedsBag(s)) {
      if (s.rentalBagsRemaining > 0) s.rentalBagsRemaining--;
      else s.bagCount--;
    }
    s.customer.response = "sale-complete";
    satisfaction(s, 5);
    s.customersServed++;
    s.cash = (cents(s.cash) + cents(total)) / 100;
    s.sales = (cents(s.sales) + cents(total)) / 100;
    s.step = "thanks";
    return total;
  }
  function bagsRemaining(s) {
    return s.bagCount + s.rentalBagsRemaining;
  }
  function orderNeedsBag(s) {
    return !!s.customer;
  }
  function buyBagPacks(s, n = 1) {
    requireRule(quantity(n) && n > 0 && n <= 100, "Choose 1 to 100 bag packs.");
    const price = cents(supplies.bags) * n;
    requireRule(
      cents(s.cash) >= price,
      "A 10-pack costs $3. You can review daily-use bags if cash is low.",
    );
    s.cash = (cents(s.cash) - price) / 100;
    s.bagCount += 10 * n;
    s.owned.bags += n;
    recordExpense(s, "bagPurchase", price, "upfront");
    return price / 100;
  }
  function recordExpense(s, category, amount, timing) {
    if (amount > 0) s.marketExpenses.push({ category, cents: amount, timing });
  }
  function migrateExpenses(s) {
    const rows = [];
    let remaining = cents(s.rentalUpfrontPaid);
    for (const [id, r] of Object.entries(s.rentals))
      if (r.payment === "upfront" || r.payment === "legacy") {
        const paid = Math.min(remaining, cents(rentalPrices[id].upfront));
        if (paid > 0)
          rows.push({ category: id, cents: paid, timing: "upfront" });
        remaining -= paid;
      }
    if (remaining > 0)
      rows.push({ category: "legacy", cents: remaining, timing: "upfront" });
    if (s.marketChargesPaid > 0)
      rows.push({
        category: "legacy",
        cents: cents(s.marketChargesPaid),
        timing: "closing",
      });
    return rows;
  }
  function accountingReport(s) {
    const expenses = s.marketExpenses.map((e) => ({ ...e }));
    const paid = expenses.reduce((n, e) => n + e.cents, 0);
    return {
      day: s.day,
      season: s.season,
      sales: s.sales,
      customers: s.customersServed,
      expenses,
      paid: paid / 100,
      net: (cents(s.sales) - paid) / 100,
      carry: debtTotal(s),
      legacy: s.legacyAccounting,
    };
  }
  function validReport(r) {
    return (
      r &&
      quantity(r.day) &&
      quantity(r.season) &&
      Number.isFinite(r.sales) &&
      quantity(r.customers) &&
      Array.isArray(r.expenses) &&
      r.expenses.every(
        (e) =>
          e &&
          [
            "table",
            "scale",
            "bags",
            "bagPurchase",
            "equipment",
            "marketSupplies",
            "legacy",
          ].includes(e.category) &&
          ["upfront", "manual", "closing"].includes(e.timing) &&
          quantity(e.cents),
      ) &&
      Number.isFinite(r.paid) &&
      Number.isFinite(r.net) &&
      Number.isFinite(r.carry)
    );
  }
  function restoreCustomer(clean, s, ids) {
    const c = s.customer;
    if (
      !s.marketOpen ||
      !c ||
      typeof c.name !== "string" ||
      !/^[A-Za-z][A-Za-z '-]{0,59}$/.test(c.name) ||
      !dictionary(c.want, ids) ||
      !Object.keys(c.want).length ||
      !Object.values(c.want).every((n) => n > 0 && n <= 100) ||
      !["greet", "choose", "pay", "thanks"].includes(s.step) ||
      !dictionary(s.basket, ids) ||
      !Object.entries(s.basket).every(
        ([id, n]) =>
          s.step === "thanks" ||
          (n <= (s.inventory[id] || 0) && n <= (s.display[id] || 0)),
      )
    )
      return;
    if (
      s.step === "pay" &&
      !Object.entries(c.want).every(
        ([id, n]) => n <= (s.inventory[id] || 0) && n <= (s.display[id] || 0),
      )
    )
      return;
    const savedPrices = Object.fromEntries(crops.map(item => [item.id,
      Number.isFinite(c.prices?.[item.id]) && c.prices[item.id] >= item.price &&
        c.prices[item.id] <= item.price + .75 && Number.isInteger(c.prices[item.id] * 100)
        ? c.prices[item.id] : item.price]));
    const savedTotal = Object.entries(s.basket).reduce((n,[id,q]) => n+cents(savedPrices[id])*q,0)/100;
    if (
      s.step === "pay" &&
      (!Object.entries(c.want).every(([id, n]) => s.basket[id] === n) ||
        !Object.keys(s.basket).every((id) => c.want[id] !== undefined) ||
        !Number.isFinite(s.tendered) ||
        s.tendered < savedTotal ||
        !Number.isFinite(s.change) ||
        s.change < 0)
    )
      return;
    clean.customer = {
      name: c.name,
      want: { ...c.want },
      prices: savedPrices,
      mathLevel: quantity(c.mathLevel) && c.mathLevel <= 5 ? c.mathLevel : undefined,
      personality: ["curious", "thoughtful", "hurried"].includes(c.personality)
        ? c.personality
        : "thoughtful",
      satisfaction:
        Number.isInteger(c.satisfaction) &&
        c.satisfaction >= 0 &&
        c.satisfaction <= 100
          ? c.satisfaction
          : 50,
      decision:
        Number.isInteger(c.decision) && c.decision >= 0 && c.decision < 100
          ? c.decision
          : 50,
      greeting: ["excellent", "good", "wait"].includes(c.greeting)
        ? c.greeting
        : null,
      response: [
        "arrival",
        "excellent",
        "good",
        "wait-stayed",
        "wait-left",
        "alternative-accepted",
        "alternative-declined",
        "soldout-sorry",
        "soldout-return",
        "sale-complete",
      ].includes(c.response)
        ? c.response
        : s.step === "thanks"
          ? "sale-complete"
          : s.step === "greet"
            ? "arrival"
            : "good",
      alternativeOffered: c.alternativeOffered === true,
    };
    clean.basket = { ...s.basket };
    clean.step = s.step;
    clean.change = Number.isFinite(s.change) && s.change >= 0 ? s.change : 0;
  }
  function savings(s) {
    return Math.max(0, (cents(s.cash) - cents(debtTotal(s))) / 100);
  }
  function farmingDay(s) {
    return `${s.season}:${s.day}`;
  }
  function debtTotal(s) {
    return (s.equipmentDebt || []).reduce((n, d) => n + d.cents, 0) / 100;
  }
  function deferredAllowed(s, id) {
    return (
      !!rentalPrices[id] &&
      cents(s.cash) < cents(rentalPrices[id].upfront) &&
      !(s.equipmentDebt || []).some((d) => d.day !== farmingDay(s)) &&
      cents(debtTotal(s)) + cents(rentalPrices[id].deferred) <= cents(debtCap)
    );
  }
  function rentEquipment(s, id, payment) {
    requireRule(
      rentalPrices[id] && ["upfront", "deferred"].includes(payment),
      "Choose a valid rental and payment option.",
    );
    requireRule(
      (id === "bags" ? bagsRemaining(s) === 0 : !s.owned[id]) &&
        !s.rentals[id] &&
        !(id === "table" && s.tableRented),
      "You already have this equipment today.",
    );
    requireRule(
      !s.marketPlayed || s.marketOpen,
      "Rent before the market closes.",
    );
    requireRule(
      id !== "table" || (!s.marketOpen && !s.marketPlayed),
      "Choose your table before opening the market.",
    );
    const price = rentalPrices[id][payment];
    if (payment === "upfront") {
      requireRule(
        cents(s.cash) >= cents(price),
        "You do not have enough money for the upfront rental.",
      );
      s.cash = (cents(s.cash) - cents(price)) / 100;
      s.rentalUpfrontPaid = (cents(s.rentalUpfrontPaid) + cents(price)) / 100;
      recordExpense(s, id, cents(price), "upfront");
    } else {
      requireRule(
        deferredAllowed(s, id),
        "Pay outstanding charges from an earlier day before borrowing again. Upfront rentals and free blanket selling are still available; unpaid charges cannot exceed $6.",
      );
      s.equipmentDebt.push({ id, cents: cents(price), day: farmingDay(s) });
    }
    s.rentals[id] = { payment };
    if (id === "bags") s.rentalBagsRemaining = 10;
    if (id === "table") {
      s.tableRented = true;
      s.standMode = "rental";
    }
    return price;
  }
  function applyDebtPayment(s, amountInCents, timing) {
    let left = Math.min(amountInCents, cents(debtTotal(s)));
    const paid = left;
    for (const charge of s.equipmentDebt) {
      const amount = Math.min(left, charge.cents);
      if (amount) recordExpense(s, charge.id, amount, timing);
      charge.cents -= amount;
      left -= amount;
    }
    s.equipmentDebt = s.equipmentDebt.filter((d) => d.cents > 0);
    s.cash = (cents(s.cash) - paid) / 100;
    return paid / 100;
  }
  function payOutstanding(s) {
    return applyDebtPayment(
      s,
      Math.min(cents(s.cash), cents(debtTotal(s))),
      "manual",
    );
  }
  function settleMarket(s) {
    if (s.marketSettled || !s.marketPlayed) return 0;
    const paid = applyDebtPayment(
      s,
      Math.min(cents(s.cash), cents(s.sales)),
      "closing",
    );
    s.marketChargesPaid = (cents(s.marketChargesPaid) + cents(paid)) / 100;
    s.marketSettled = true;
    return paid;
  }
  function hasEquipment(s, id) {
    if (id === "bags") return bagsRemaining(s) > 0;
    return (
      !!s.owned[id] || !!s.rentals?.[id] || (id === "table" && s.tableRented)
    );
  }
  function hasMarketTable(s) {
    return s.standMode === "owned"
      ? !!s.owned.table
      : s.standMode === "rental" && s.tableRented;
  }
  function customerLimit() {
    return Infinity;
  }
  function chooseStand(s, mode) {
    requireRule(
      !s.marketPlayed && !s.marketOpen,
      "Choose your stand before opening the market.",
    );
    requireRule(
      ["blanket", "rental", "owned"].includes(mode),
      "Choose a valid stand.",
    );
    requireRule(
      mode !== "owned" || s.owned.table,
      "You do not own a table yet.",
    );
    s.standMode = mode;
  }
  function advanceCustomer(s, farewell = "good", now = Date.now()) {
    requireRule(
      s.customer && s.step === "thanks",
      "Finish helping your customer first.",
    );
    requireRule(
      ["excellent", "good", "brief"].includes(farewell),
      "Choose a farewell.",
    );
    satisfaction(s, farewell === "excellent" ? 3 : farewell === "good" ? 2 : 0);
    s.notice =
      farewell === "excellent"
        ? "Your customer smiles: ‘Thank you! I hope to visit again!’"
        : farewell === "good"
          ? "Your customer says: ‘Thanks! Have a good day!’"
          : "Your customer waves goodbye.";
    s.customer = null;
    s.basket = {};
    s.change = 0;
    syncMarketClock(s, now);
  }
  function canReceiveSeedHelp(s) {
    if (cents(s.cash) >= 100) return false;
    if (bagsRemaining(s) === 0) return true;
    const sellable = (id) => get(id).unit === "each" || s.owned.scale;
    return (
      !crops.some(
        (c) =>
          sellable(c.id) &&
          ((s.seeds[c.id] || 0) > 0 || (s.inventory[c.id] || 0) > 0),
      ) && !s.plots.some((p) => p && sellable(p.id))
    );
  }
  function receiveSeedHelp(s) {
    requireRule(
      canReceiveSeedHelp(s),
      "You already have a way to keep growing: use your seeds, water your plants, or sell your harvest.",
    );
    const needsSeeds =
      !crops.some(
        (c) =>
          (c.unit === "each" || s.owned.scale) &&
          ((s.seeds[c.id] || 0) > 0 || (s.inventory[c.id] || 0) > 0),
      ) &&
      !s.plots.some((p) => p && (get(p.id).unit === "each" || s.owned.scale));
    if (needsSeeds) s.seeds.carrot = (s.seeds.carrot || 0) + 3;
    const donatedBags = bagsRemaining(s) === 0 ? 3 : 0;
    s.bagCount += donatedBags;
    return `Your neighbors shared ${[needsSeeds ? "3 carrot seeds" : "", donatedBags ? "3 paper bags" : ""].filter(Boolean).join(" and ")}. Grow and sell from a free blanket. No repayment is needed.`;
  }
  const api = {
    moveClubhouseItem,
    resetClubhouseItem,
    resetClubhouseLayout,
    dreams,
    dreamPurchaseCount,
    mathLevel,
    marketPrice,
    offerSomethingElse,
    ownsDream,
    acknowledgeGoal,
    purchaseDream,
    marketStock,
    missingProduce,
    alternativeChoices,
    suggestAlternative,
    declineOrder,
    customerResponse,
    bagsRemaining,
    orderNeedsBag,
    buyBagPacks,
    accountingReport,
    savings,
    rentalPrices,
    debtCap,
    debtTotal,
    deferredAllowed,
    rentEquipment,
    payOutstanding,
    settleMarket,
    hasEquipment,
    availableSeeds,
    cancelPlan,
    cancelAllPlans,
    harvestAll,
    canSellCrop,
    addAllToDisplay,
    hasMarketTable,
    customerLimit,
    marketTime,
    pauseMarketClock,
    resumeMarketClock,
    checkpointMarketClock,
    syncMarketClock,
    chooseStand,
    advanceCustomer,
    canReceiveSeedHelp,
    receiveSeedHelp,
    crops,
    bundle,
    supplies,
    initial,
    recover,
    chooseGoal,
    cartTotal,
    purchase,
    purchaseMarketSupplies,
    plan,
    plantPlan,
    water,
    endDay,
    harvest,
    openMarket,
    closeMarket,
    newCustomer,
    greet,
    totalOrder,
    checkBasket,
    ring,
    finish,
  };
  if (typeof module !== "undefined") module.exports = api;
  root.Game = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
