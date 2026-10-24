/* The report reads a paid-cash ledger; rendering never deducts money. */
function reportMoney(value) {
  return value < 0 ? "−" + money(-value) : money(value);
}
function accountingMarkup(report) {
  const sum = (predicate) =>
    report.expenses.filter(predicate).reduce((n, e) => n + e.cents, 0) / 100;
  const expense = (value) => (value ? "−" + money(value) : money(0));
  const row = (label, value) =>
    `<tr><th scope="row">${label}</th><td>${expense(value)}</td></tr>`;
  const upfront = (category) =>
    sum((e) => e.timing === "upfront" && e.category === category);
  const closing = sum((e) => e.timing === "closing");
  const names = {
    table: "Table",
    scale: "Scale",
    bags: "Daily-use bags",
    legacy: "Earlier equipment payments",
  };
  const details = Object.entries(names)
    .map(([id, name]) => {
      const amount = sum((e) => e.timing === "closing" && e.category === id);
      return amount ? name + ": " + money(amount) : "";
    })
    .filter(Boolean)
    .join(" · ");
  return `<section class="accounting-report" aria-label="Market-day accounting report">
    <p class="report-day">Season ${report.season} · Day ${report.day}</p>
    <table><caption>Market cash in and out</caption><tbody>
      <tr class="sales-row"><th scope="row">Total produce sales</th><td>${money(report.sales)}</td></tr>
      <tr><th scope="row">Customers served</th><td>${report.customers}${report.legacy ? " since update" : ""}</td></tr>
      <tr class="report-section"><th colspan="2">Already paid from cash</th></tr>
      ${row("Upfront table rental", upfront("table"))}
      ${row("Upfront scale rental", upfront("scale"))}
      ${row("Bag purchases / daily-use bag fees", upfront("bagPurchase") + upfront("bags"))}
      ${row("Other market expenses", upfront("equipment") + upfront("legacy"))}
      ${row(
        "Equipment charges paid manually",
        sum((e) => e.timing === "manual"),
      )}
      <tr class="report-section"><th colspan="2">Deducted when closing</th></tr>
      ${row("Deferred equipment payments", closing)}
      ${details ? `<tr><td colspan="2" class="report-detail">${details} (included in the line above)</td></tr>` : ""}
      <tr class="net-row"><th scope="row">${report.legacy ? "Recorded net market earnings" : "Today’s net market earnings"}</th><td>${reportMoney(report.net)}</td></tr>
    </tbody></table>
    <p class="report-carry">Unpaid balance carried forward: <strong>${money(report.carry)}</strong><br><small>Still owed; not deducted as a payment above.</small></p>
    <p>${report.legacy ? `The recorded market transactions show net earnings of ${reportMoney(report.net)}. Earlier unrecorded purchases may change the full day’s total.` : report.net >= 0 ? `You earned ${money(report.net)} after the market payments shown above. Well done helping your neighbors!` : `You spent ${money(-report.net)} more on market supplies and payments than you earned today. Supplies left over can help on another day.`}</p>
    ${report.legacy ? '<p class="small">Earlier customer counts and some purchases were not recorded before this update. This report includes known fees and transactions recorded since updating.</p>' : ""}
    <p class="small">This is today’s market cash report, not total farm profit. Seed costs are not included. Each payment is subtracted once; carried debt is not subtracted again.</p>
  </section>`;
}
function showMarketReport(previous = false) {
  const report = previous
    ? state.lastMarketReport
    : Game.accountingReport(state);
  if (report)
    show(
      `<h2>Market-day report</h2>${accountingMarkup(report)}`,
      "market-report",
    );
}
