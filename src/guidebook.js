/* Optional illustrated guide. Page turns never write to farm state or save data. */
const GUIDEBOOK_PAGES = [
  {
    heading: "Choose Your Dream!",
    text: [
      "Choose Little or Growing Gardener in Settings. Both share your farm and rewards! Visit the Dream Shop to pick a savings goal. Buying your dream later puts it in your Clubhouse.",
    ],
    illustration: "dream",
  },
  {
    heading: "Shop for Your Garden!",
    text: [
      "New farms start with $0. Collect free starter planting supplies at Seed & Feed. Help neighbors at the Job Board to earn $1 per job. Each neighbor rests for five minutes after paying you.",
    ],
    illustration: "shopping",
  },
  {
    heading: "Plant, Water, Harvest!",
    text: [
      "Tap a plot, choose a crop, then Plant Plan. Water with the can or Water All. Only End Day advances farming days and grows watered plants. Tap plants for growth pictures. Farming never ends!",
    ],
    illustration: "grow",
  },
  {
    heading: "Harvest and Keep Growing!",
    text: [
      "Pick ripe crops or use Harvest All. Optional weeding every five days gives each planted crop 1 extra item or pound. Little Gardeners pull unwanted weeds; Growing Gardeners find wrong answers.",
    ],
    illustration: "harvest",
  },
  {
    heading: "Help Your Customers!",
    text: [
      "New farmers save $20 for a table, scale, cash register and bags at Market Supplies. Then arrange your harvest. Selling is optional; neighborhood jobs can fund your dreams too!",
    ],
    illustration: "market",
  },
  {
    heading: "Count, Save, Dream!",
    text: [
      "Greet customers and fill their baskets. Little Gardener handles payment for you; Growing Gardener lets you calculate and count change. Save up, buy your dream and find it in your Clubhouse!",
      "Then choose another dream and keep growing!",
    ],
    illustration: "clubhouse",
  },
];
// The book and its small round reading table share the existing room lens.
// Composited through the same lens as the room; never a movable/owned reward.
const CLUBHOUSE_BOOK = {
  x: 1086,
  y: 485,
  width: 124,
  height: 112,
  art: "assets/guidebook/book.svg?v=issue-1-review-1",
  table: {
    x: 1086,
    y: 584,
    width: 170,
    height: 150,
    art: "assets/guidebook/side-table.svg?v=issue-1-review-1",
  },
};
function drawClubhouseGuidebook(ctx) {
  const image = clubhouseRoom.bookImage,
    b = CLUBHOUSE_BOOK;
  const table = clubhouseRoom.bookTableImage,
    t = b.table;
  if (table?.complete && table.naturalWidth)
    ctx.drawImage(table, t.x - t.width / 2, t.y - t.height, t.width, t.height);
  if (image?.complete && image.naturalWidth)
    ctx.drawImage(image, b.x - b.width / 2, b.y - b.height, b.width, b.height);
}
function positionClubhouseGuidebook() {
  const r = clubhouseRoom,
    b = CLUBHOUSE_BOOK,
    button = r.world?.querySelector(".clubhouse-guidebook");
  if (!button || !r.geometry || !r.usable) return;
  const p = { angle: ClubhouseLayout.angleAt(b.x), y: b.y / 724 },
    foot = ClubhouseLayout.project(p, r.yaw, r.geometry),
    scale =
      r.geometry.paintedHeight /
      724 /
      Math.max(0.4, Math.cos(((p.angle - r.yaw) * Math.PI) / 180)),
    left = foot.x - (b.width * scale) / 2,
    top = foot.y - b.height * scale,
    x1 = Math.max(left, r.usable.left),
    x2 = Math.min(left + b.width * scale, r.usable.right),
    y1 = Math.max(top, r.usable.top),
    y2 = Math.min(foot.y, r.usable.bottom),
    width = Math.max(44, x2 - x1),
    height = Math.max(44, y2 - y1);
  button.hidden = x2 - x1 < 18 || y2 - y1 < 18;
  button.style.left =
    ClubhouseLayout.clamp(
      (x1 + x2) / 2 - width / 2,
      r.usable.left,
      r.usable.right - width,
    ) + "px";
  button.style.top =
    ClubhouseLayout.clamp(
      (y1 + y2) / 2 - height / 2,
      r.usable.top,
      r.usable.bottom - height,
    ) + "px";
  button.style.width = width + "px";
  button.style.height = height + "px";
  button.dataset.composited = String(!!r.bookImage?.naturalWidth);
}
function guidebookIllustration(kind) {
  const img = (path, alt) => `<img src="assets/${path}" alt="${alt}"/>`;
  if (kind === "shopping")
    return img(
      "seed-shop/interior.webp",
      "A friendly shopkeeper welcomes you to shelves of gardening supplies.",
    );
  if (kind === "market")
    return img(
      "farmers-market/stall.webp",
      "Your red-and-white market canopy overlooks a cheerful village square.",
    );
  if (kind === "dream")
    return `<div class="guide-dream-shelf" role="img" aria-label="Dream rewards: a soccer ball, bicycle and guitar on warm wooden display shelves.">${["ball", "bike", "guitar"].map((id) => clubhouseRewardArt(id, "guide-reward-" + id)).join("")}</div>`;
  if (kind === "clubhouse")
    return `<div class="guide-home-art">${img("clubhouse/room.webp", "A cozy wooden clubhouse with a window seat, shelves and a treasure chest.")}<div class="guide-earned-ball">${clubhouseRewardArt("ball", "guide-earned")}</div></div>`;
  if (kind === "harvest")
    return `<div class="guide-harvest-art" role="img" aria-label="Fresh carrots, tomatoes and lettuce fill a wicker harvest basket."><div>${["carrot", "tomato", "lettuce"].map(seedProduceArt).join("")}</div><svg viewBox="0 0 320 130" aria-hidden="true"><defs><linearGradient id="basket-wicker" x2="0" y2="1"><stop stop-color="#e6b66e"/><stop offset="1" stop-color="#ac6d36"/></linearGradient></defs><path d="M35 23Q160-19 285 23l-20 94Q160 140 55 117Z" fill="url(#basket-wicker)" stroke="#80512a" stroke-width="5"/><path d="M35 23Q160 55 285 23M43 48q117 32 235 0M48 72q112 29 224 0M52 96q108 28 215 0M78 35l6 86m32-81 2 87m42-83v87m44-91-2 87m40-91-6 87" fill="none" stroke="#87572e" stroke-width="3" opacity=".65"/></svg></div>`;
  return `<svg class="guide-grow-art" viewBox="0 0 440 230" role="img" aria-label="A watering can sprinkles a little garden of young green plants."><defs><linearGradient id="guide-sky" x2="0" y2="1"><stop stop-color="#bfe4e6"/><stop offset="1" stop-color="#fff1bc"/></linearGradient><linearGradient id="guide-soil" x2="0" y2="1"><stop stop-color="#b57c4a"/><stop offset="1" stop-color="#795332"/></linearGradient></defs><path fill="url(#guide-sky)" d="M0 0h440v230H0z"/><circle cx="58" cy="43" r="24" fill="#f5ca65"/><path d="M0 131q80-47 160-12t280-16v127H0" fill="#88b47b"/><path d="m35 156 248-25 108 68-274 29Z" fill="url(#guide-soil)" stroke="#7d5736" stroke-width="4"/><g fill="#609951" stroke="#3d723a" stroke-width="2">${[
    [105, 173],
    [180, 167],
    [256, 161],
    [157, 204],
    [235, 197],
    [315, 188],
  ]
    .map(
      ([x, y]) =>
        `<path d="M${x} ${y}v-20q-20 2-23-14 19-5 24 13 1-19 20-18 2 16-20 20"/>`,
    )
    .join(
      "",
    )}</g><g transform="translate(285 28) rotate(-15)"><ellipse cx="48" cy="75" rx="34" ry="10" fill="#477d80"/><path d="M14 29h68v45q-30 20-68 0Z" fill="#7eada6" stroke="#416e6a" stroke-width="4"/><ellipse cx="48" cy="29" rx="34" ry="9" fill="#a4cac1" stroke="#416e6a" stroke-width="3"/><path d="M82 38q42-25 42 6t-42 13M18 53-17 30l-8 11 40 31" fill="none" stroke="#416e6a" stroke-width="9"/><path d="M15 53-17 30l-8 11 40 31" fill="#7eada6"/><path d="m-23 47-13 18m19-14-7 23m18-18-1 24" stroke="#8cc8d7" stroke-width="4" stroke-linecap="round"/></g><g fill="#fff0bb"><circle cx="28" cy="151" r="5"/><circle cx="407" cy="168" r="5"/><circle cx="400" cy="144" r="4"/></g></svg>`;
}
let guidebookPage = 0;
function guidebookMarkup() {
  const p = GUIDEBOOK_PAGES[guidebookPage];
  return `<header class="guidebook-header"><span>How to Play</span><button class="btn alt" onclick="readGuidePage()" aria-label="Read this page">Read to Me</button><button class="btn alt" onclick="closeGuidebook()" aria-label="Close How to Play">Close ✕</button></header><article class="guidebook-page" aria-live="polite" aria-atomic="true"><div class="guidebook-illustration guide-${p.illustration}">${guidebookIllustration(p.illustration)}</div><h2 id="guidebook-title">${p.heading}</h2><div class="guidebook-text">${p.text.map((t) => `<p>${t.replaceAll("&", "&amp;")}</p>`).join("")}</div></article><nav class="guidebook-pages" aria-label="Guidebook pages"><button class="btn" onclick="turnGuidebook(-1)" ${guidebookPage === 0 ? "disabled" : ""}>← Back</button><output aria-label="Page">${guidebookPage + 1} of ${GUIDEBOOK_PAGES.length}</output><button class="btn" onclick="turnGuidebook(1)" ${guidebookPage === GUIDEBOOK_PAGES.length - 1 ? "disabled" : ""}>Next →</button></nav>`;
}
function openGuidebook() {
  guidebookPage = 0;
  show(guidebookMarkup(), "guidebook");
  if(typeof Narration !== "undefined" && state.narrationEnabled)readGuidePage();
  document
    .querySelector('[aria-label="Close How to Play"]')
    ?.focus({ preventScroll: true });
}
function turnGuidebook(delta) {
  guidebookPage = Math.max(
    0,
    Math.min(GUIDEBOOK_PAGES.length - 1, guidebookPage + delta),
  );
  show(guidebookMarkup(), "guidebook");
  if(typeof Narration !== "undefined" && state.narrationEnabled)readGuidePage();
  // A boundary can disable the focused control. Always leave keyboard users on
  // a working navigation button; page content is announced by the live article.
  const forward = delta >= 0,
    selector = forward ? "last" : "first",
    target = document.querySelector(
      `.guidebook-pages button:${selector}-child`,
    );
  (target?.disabled
    ? document.querySelector(
        `.guidebook-pages button:${forward ? "first" : "last"}-child`,
      )
    : target
  )?.focus({ preventScroll: true });
}
function closeGuidebook() {
  closeDialog();
  document
    .querySelector(".clubhouse-book-shortcut")
    ?.focus({ preventScroll: true });
}
if (typeof document !== "undefined")
  document.addEventListener("keydown", (e) => {
    if (typeof dialogKey === "undefined" || dialogKey !== "guidebook") return;
    if (e.key === "Escape") {
      e.preventDefault();
      closeGuidebook();
    }
    if (e.key === "Tab") {
      const buttons = [
          ...document.querySelectorAll(
            ".guidebook-dialog button:not(:disabled)",
          ),
        ],
        first = buttons[0],
        last = buttons.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
  });
if (typeof module !== "undefined")
  module.exports = { pages: GUIDEBOOK_PAGES, book: CLUBHOUSE_BOOK };

function readGuidePage(){const p=GUIDEBOOK_PAGES[guidebookPage];Narration.speak(p.heading+" "+p.text.join(" "),"guide",true);}
