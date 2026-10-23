/* Game rules have no DOM or storage dependencies. Money calculations use integer cents at transaction boundaries. */
(function (root) {
  "use strict";
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
  const get = (id) => crops.find((c) => c.id === id);
  const cents = (n) => Math.round(n * 100);
  const quantity = (n) => Number.isSafeInteger(n) && n >= 0;
  function requireRule(ok, message) {
    if (!ok) throw Error(message);
  }
  function initial() {
    return {
      version: 1,
      cash: 50,
      day: 1,
      season: 1,
      goal: 1,
      seeds: {},
      plots: Array(25).fill(null),
      inventory: {},
      plan: {},
      display: {},
      cart: {},
      supcart: {},
      owned: { table: 0, canopy: 0, bags: 0, scale: 0 },
      hour: 9,
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
      // Additive migration: retain v1 farms, money, equipment and this day's rental.
      clean.standMode = ["blanket", "rental", "owned"].includes(s.standMode)
        ? s.standMode
        : s.owned.table
          ? "owned"
          : "blanket";
      clean.tableRented = s.tableRented === true;
      if (clean.standMode === "owned" && !clean.owned.table)
        clean.standMode = "blanket";
      for (const id of ids)
        clean.display[id] = Math.min(
          clean.display[id] || 0,
          clean.inventory[id] || 0,
        );
      return clean;
    } catch {
      return backup ? recover(backup) : initial();
    }
  }
  function chooseGoal(s, index) {
    requireRule(quantity(index) && index < 6, "Choose a valid goal.");
    s.goal = index;
    s.won = false;
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
          !n || (!s.owned[id] && n === 1),
          "You only need one of each supply.",
        );
    s.cash = (cents(s.cash) - cents(total)) / 100;
    for (const [id, n] of Object.entries(obj)) {
      if (kind === "supplies") s.owned[id] = n || s.owned[id];
      else if (id === "bundle")
        for (const [crop, q] of Object.entries(bundle))
          s.seeds[crop] = (s.seeds[crop] || 0) + q * n;
      else s.seeds[id] = (s.seeds[id] || 0) + n;
    }
    if (kind === "supplies" && obj.table) s.standMode = "owned";
    s[kind === "seeds" ? "cart" : "supcart"] = {};
    return total;
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
    requireRule(
      (s.seeds[id] || 0) > Object.values(s.plan).filter((x) => x === id).length,
      "No unreserved seeds left.",
    );
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
  function water(s) {
    for (const p of s.plots) if (p) p.watered = true;
  }
  function endDay(s) {
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
    s.visitors = 0;
    s.sales = 0;
    s.customer = null;
    s.basket = {};
    s.change = 0;
    s.step = "greet";
    s.marketOpen = false;
    s.marketPlayed = false;
    s.tableRented = false;
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
  function openMarket(s) {
    requireRule(
      !s.marketPlayed && !s.marketOpen,
      "Your market has already opened today. End the farming day before opening again.",
    );
    requireRule(
      Object.values(s.display).some((n) => n > 0),
      "Place harvested produce on your stand first.",
    );
    if (s.standMode === "rental" && !s.tableRented) {
      requireRule(
        cents(s.cash) >= 100,
        "A table rental costs $1 today. Choose the free blanket instead.",
      );
      s.cash = (cents(s.cash) - 100) / 100;
      s.tableRented = true;
    }
    s.marketOpen = true;
    s.marketPlayed = true;
    s.hour = 9;
  }
  function closeMarket(s) {
    s.marketOpen = false;
    s.hour = 13;
    s.customer = null;
    s.basket = {};
    s.step = "greet";
  }
  function newCustomer(s, name) {
    requireRule(s.marketOpen && s.hour < 13, "The market is closed.");
    requireRule(!s.customer, "Finish serving this customer first.");
    requireRule(
      s.visitors < customerLimit(s),
      `Your ${hasMarketTable(s) ? "table" : "blanket"} has welcomed all ${customerLimit(s)} customers for today. Close the market and return tomorrow.`,
    );
    const stock = crops.filter((c) => (s.display[c.id] || 0) > 0);
    requireRule(stock.length, "Your display is sold out.");
    const a = stock[s.visitors % stock.length],
      want = { [a.id]: Math.min(s.display[a.id], (s.visitors % 2) + 1) };
    if (stock.length > 1 && s.visitors % 2)
      want[stock[(s.visitors + 1) % stock.length].id] = 1;
    s.customer = { name, want };
    s.visitors++;
    s.basket = {};
    s.change = 0;
    s.step = "greet";
  }
  function greet(s) {
    requireRule(s.customer && s.step === "greet", "Welcome a customer first.");
    s.step = "choose";
  }
  function totalOrder(s) {
    return (
      Object.entries(s.basket).reduce(
        (t, [id, n]) => t + cents(get(id).price) * n,
        0,
      ) / 100
    );
  }
  function ring(s, answer) {
    requireRule(s.customer && s.step === "choose", "Prepare an order first.");
    requireRule(
      Object.entries(s.customer.want).every(
        ([id, n]) =>
          s.basket[id] === n &&
          n <= (s.display[id] || 0) &&
          n <= (s.inventory[id] || 0),
      ),
      "Fill the requested basket.",
    );
    requireRule(
      Object.keys(s.basket).every((id) => s.customer.want[id] !== undefined),
      "Only include requested produce.",
    );
    requireRule(
      !Object.keys(s.basket).some((id) => get(id).unit === "lb") ||
        s.owned.scale,
      "You need a scale for produce sold by the pound.",
    );
    const total = totalOrder(s);
    requireRule(
      Number.isFinite(answer) && cents(answer) === cents(total),
      "Try multiplying each quantity by its price, then add the amounts.",
    );
    s.tendered =
      [5, 10, 20, 50, 100].find((n) => n >= total) ||
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
    s.cash = (cents(s.cash) + cents(total)) / 100;
    s.sales = (cents(s.sales) + cents(total)) / 100;
    s.step = "thanks";
    return total;
  }
  function hasMarketTable(s) {
    return s.standMode === "owned"
      ? !!s.owned.table
      : s.standMode === "rental" && s.tableRented;
  }
  function customerLimit(s) {
    return hasMarketTable(s) ? 6 : 3;
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
  function advanceCustomer(s) {
    requireRule(
      s.customer && s.step === "thanks",
      "Finish helping your customer first.",
    );
    s.hour = Math.min(13, s.hour + 0.5);
    s.customer = null;
    s.basket = {};
    s.change = 0;
  }
  function canReceiveSeedHelp(s) {
    if (cents(s.cash) >= 100) return false;
    const sellable = (id) => s.owned.scale || get(id).unit === "each";
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
    s.seeds.carrot = (s.seeds.carrot || 0) + 3;
    return "Your neighbors shared 3 carrot seeds. Plant, water and harvest them, then sell from a free blanket. No repayment is needed.";
  }
  const api = {
    hasMarketTable,
    customerLimit,
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
    ring,
    finish,
  };
  if (typeof module !== "undefined") module.exports = api;
  root.Game = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
