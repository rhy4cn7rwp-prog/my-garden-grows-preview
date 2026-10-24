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
  function openMarket(s) {
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
  }
  function closeMarket(s) {
    settleMarket(s);
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
    const stock = crops.filter(
      (c) => (s.display[c.id] || 0) > 0 && canSellCrop(s, c.id),
    );
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
        hasEquipment(s, "scale"),
      "You need a scale for produce sold by the pound.",
    );
    requireRule(
      !orderNeedsBag(s) || bagsRemaining(s) > 0,
      "This loose-produce order needs 1 paper bag. Buy a 10-pack or review daily-use bags. Other produce can still be sold without bags.",
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
    requireRule(
      Object.entries(s.customer.want).every(([id, n]) => s.basket[id] === n) &&
        Object.keys(s.basket).every((id) => s.customer.want[id] !== undefined),
      "Fill exactly the requested basket.",
    );
    requireRule(
      !orderNeedsBag(s) || bagsRemaining(s) > 0,
      "This order needs 1 paper bag before the sale can finish.",
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
    return (
      !!s.customer &&
      Object.keys(s.customer.want).some((id) => get(id)?.unit === "lb")
    );
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
        ([id, n]) => c.want[id] !== undefined && n <= c.want[id],
      )
    )
      return;
    if (
      s.step !== "thanks" &&
      !Object.entries(c.want).every(
        ([id, n]) => n <= (s.inventory[id] || 0) && n <= (s.display[id] || 0),
      )
    )
      return;
    if (
      s.step === "pay" &&
      (!Object.entries(c.want).every(([id, n]) => s.basket[id] === n) ||
        !Number.isFinite(s.tendered) ||
        s.tendered < totalOrder(s) ||
        !Number.isFinite(s.change) ||
        s.change < 0)
    )
      return;
    clean.customer = { name: c.name, want: { ...c.want } };
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
    const sellable = (id) =>
      get(id).unit === "each" || (s.owned.scale && s.bagCount > 0);
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
