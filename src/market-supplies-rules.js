/* Additive shop inventory. Farm/market rules remain in Game; cents at checkout. */
(function (root) {
  const catalog = {
    bags5: {
      name: "5 paper produce bags",
      product: "bags",
      count: 5,
      cents: 100,
      type: "consumable",
    },
    bags20: {
      name: "20 paper produce bags",
      product: "bags",
      count: 20,
      cents: 300,
      type: "consumable",
    },
    boxes5: {
      name: "5 cardboard produce boxes",
      product: "boxes",
      count: 5,
      cents: 300,
      type: "consumable",
    },
    tags10: {
      name: "10 price tags",
      product: "priceTags",
      count: 10,
      cents: 100,
      type: "consumable",
    },
    sign: {
      name: "Market sign",
      product: "marketSigns",
      count: 1,
      cents: 800,
      type: "reusable",
    },
    basket: {
      name: "Produce basket",
      product: "produceBaskets",
      count: 1,
      cents: 500,
      type: "reusable",
    },
  };
  const qty = (n) => Number.isSafeInteger(n) && n >= 0 && n <= 1e6;
  const emptyStock = () => ({
    consumables: { boxes: 0, priceTags: 0 },
    reusable: { marketSigns: 0, produceBaskets: 0 },
  });
  function recover(s) {
    const stock = emptyStock(),
      cart = {};
    for (const group of Object.keys(stock))
      for (const id of Object.keys(stock[group])) {
        const n = s.marketSupplyStock?.[group]?.[id];
        if (qty(n)) stock[group][id] = n;
      }
    if (
      s.marketSupplyCart &&
      typeof s.marketSupplyCart === "object" &&
      !Array.isArray(s.marketSupplyCart)
    )
      for (const id of Object.keys(catalog)) {
        const n = s.marketSupplyCart[id];
        if (qty(n) && n <= 100 && n > 0) cart[id] = n;
      }
    return { marketSupplyStock: stock, marketSupplyCart: cart };
  }
  function total(s) {
    let sum = 0;
    if (
      !s.marketSupplyCart ||
      typeof s.marketSupplyCart !== "object" ||
      Array.isArray(s.marketSupplyCart)
    )
      throw Error("Choose supplies for your basket.");
    for (const [id, n] of Object.entries(s.marketSupplyCart)) {
      if (!Object.hasOwn(catalog, id) || !qty(n) || n > 100)
        throw Error("Choose a quantity from 0 to 100.");
      sum += catalog[id].cents * n;
    }
    return sum / 100;
  }
  function purchase(s, record) {
    const cost = total(s),
      paid = Math.round(cost * 100);
    if (!paid) throw Error("Your supply basket is empty.");
    if (paid > Math.round(s.cash * 100))
      throw Error("Not enough money. Remove an item and try again.");
    const next = recover(s).marketSupplyStock,
      bought = [];
    let bags = s.bagCount;
    for (const [id, n] of Object.entries(s.marketSupplyCart))
      if (n) {
        const p = catalog[id],
          count = p.count * n;
        if (p.product === "bags") bags += count;
        else {
          const group = p.type === "consumable" ? "consumables" : "reusable";
          next[group][p.product] += count;
          if (!qty(next[group][p.product]))
            throw Error("You already have plenty of this supply.");
        }
        bought.push({ id, name: p.name, packs: n, count, cents: p.cents * n });
      }
    if (!qty(bags)) throw Error("You already have plenty of bags.");
    // All validation precedes the first mutation. Old owned.bags pack counters
    // stay untouched: bagCount is the single authoritative purchased bag stock.
    s.cash = (Math.round(s.cash * 100) - paid) / 100;
    s.bagCount = bags;
    s.marketSupplyStock = next;
    s.marketSupplyCart = {};
    for (const p of bought)
      record(
        s,
        catalog[p.id].product === "bags" ? "bagPurchase" : "marketSupplies",
        p.cents,
        "upfront",
      );
    return { total: cost, bought };
  }
  function inventory(s) {
    const v = recover(s).marketSupplyStock;
    return {
      consumables: { bags: s.bagCount, ...v.consumables },
      reusable: { ...v.reusable },
    };
  }
  const api = { catalog, emptyStock, recover, total, purchase, inventory };
  if (typeof module !== "undefined") module.exports = api;
  root.MarketSupplyRules = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
