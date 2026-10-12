/* ==========================================================
   CHINMAYA SARASWATI ASHRAM - DEVI TEMPLE
   CONDITIONAL WEEKLY SEVA SPONSOR CARD

   Safe V1 add-on:
   - Existing header, fonts, schedules, flyers and tickers stay unchanged
   - Shows only when active sponsors exist in the current week
   - Displays up to 3 sponsor cards at a time
   - Additional sponsor cards rotate upward in groups of 3
   - Community QR returns automatically when no sponsor card is needed
========================================================== */

(() => {

  const PUBLISHED_SPONSOR_CSV =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFYXQmFp7zwXk60tmqmK0aAdrrGJUaRUoTEGmKryumu7pRR1yfLf_AGGzx5pj7ArNQfslONPb948-j/pub?gid=2026101101&single=true&output=csv";

  const GVIZ_SPONSOR_CSV =
    "https://docs.google.com/spreadsheets/d/1rljGlqs80q6qdqddXd5Rh6BZE7fAEvG3OsHAny81t1s/gviz/tq?tqx=out:csv&gid=2026101101";

  const REFRESH_MS = 5 * 60 * 1000;
  const ROTATE_MS = 7000;
  const ITEMS_PER_PAGE = 3;

  let sponsors = [];
  let pageIndex = 0;
  let rotateTimer = null;
  let animationBusy = false;


  function parseCSV(text) {

    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {

      const char = text[i];
      const next = text[i + 1];

      if (char === '"') {
        if (inQuotes && next === '"') {
          field += '"';
          i++;
        }
        else {
          inQuotes = !inQuotes;
        }
      }
      else if (char === "," && !inQuotes) {
        row.push(field.trim());
        field = "";
      }
      else if ((char === "\n" || char === "\r") && !inQuotes) {

        if (char === "\r" && next === "\n") i++;

        row.push(field.trim());
        field = "";

        if (row.some(value => value !== "")) rows.push(row);
        row = [];
      }
      else {
        field += char;
      }
    }

    if (field || row.length) {
      row.push(field.trim());
      if (row.some(value => value !== "")) rows.push(row);
    }

    return rows;
  }


  function escapeHTML(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }


  function normalizeHeader(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "");
  }


  function parseLocalDate(value) {

    const text = String(value || "").trim();
    if (!text) return null;

    let match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

    if (match) {
      const date = new Date(
        Number(match[3]),
        Number(match[1]) - 1,
        Number(match[2]),
        12, 0, 0, 0
      );
      return Number.isNaN(date.getTime()) ? null : date;
    }

    match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

    if (match) {
      const date = new Date(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3]),
        12, 0, 0, 0
      );
      return Number.isNaN(date.getTime()) ? null : date;
    }

    const parsed = new Date(text);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }


  function getCurrentWeekRange() {

    const now = new Date();

    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0, 0, 0, 0
    );

    start.setDate(start.getDate() - start.getDay());

    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    return { start, end };
  }


  function deityShouldDisplay(value) {

    const deity = String(value || "").trim();
    if (!deity) return false;

    const normalized = deity
      .toUpperCase()
      .replace(/[^A-Z]/g, "");

    return ![
      "ALL",
      "ALLDEITY",
      "ALLDEITIES",
      "ALLGODS"
    ].includes(normalized);
  }


  function formatSponsorDate(date) {
    return date.toLocaleDateString(
      "en-US",
      {
        weekday: "short",
        month: "short",
        day: "numeric"
      }
    );
  }


  function ensureStyles() {

    if (document.getElementById("temple-sponsor-card-styles")) return;

    const style = document.createElement("style");
    style.id = "temple-sponsor-card-styles";

    style.textContent = `
      .sponsor-section {
        flex: 0 0 auto;
        margin-top: auto;
        padding-top: 6px;
        border-top: 1px solid var(--line);
        overflow: hidden;
      }

      .sponsor-section[hidden] {
        display: none !important;
      }

      .sponsor-section .schedule-ornament {
        height: 12px;
      }

      .sponsor-section .schedule-ornament span {
        transform: scale(.82);
        transform-origin: center;
      }

      .sponsor-section .schedule-heading {
        font-family: Georgia, "Times New Roman", serif;
        font-size: clamp(14px, .9vw, 17px);
        line-height: 1;
        white-space: nowrap;
      }

      .sponsor-section .schedule-heading-divider {
        height: 10px;
        margin: 0 0 4px;
      }

      .sponsor-section .schedule-heading-divider::before,
      .sponsor-section .schedule-heading-divider::after {
        top: 4px;
      }

      .sponsor-section .divider-diamond {
        top: 1px;
        width: 6px;
        height: 6px;
      }

      .sponsor-viewport {
        width: 100%;
        overflow: hidden;
        padding: 0 1px 1px;
      }

      .sponsor-list {
        display: grid;
        grid-template-columns: 1fr;
        gap: 4px;
        width: 100%;
        transform: translateY(0);
        opacity: 1;
        transition: transform .48s ease, opacity .42s ease;
        will-change: transform, opacity;
      }

      .sponsor-list.is-leaving {
        transform: translateY(-24px);
        opacity: 0;
      }

      .sponsor-list.is-entering {
        transform: translateY(20px);
        opacity: 0;
        transition: none;
      }

      .sponsor-item {
        min-height: 51px;
        border: 1px solid #ead9b7;
        border-left: 3px solid var(--gold);
        border-radius: 6px;
        padding: 4px 7px 5px;
        background: linear-gradient(90deg, #fffaf0, #fffdf8);
      }

      .sponsor-topline {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 6px;
      }

      .sponsor-type {
        min-width: 0;
        font-family: Georgia, "Times New Roman", serif;
        font-size: clamp(11px, .72vw, 14px);
        line-height: 1.05;
        font-weight: 700;
        color: #65150e;
        text-transform: uppercase;
        overflow-wrap: anywhere;
      }

      .sponsor-date {
        flex: 0 0 auto;
        font-size: clamp(9px, .54vw, 11px);
        line-height: 1;
        font-weight: 700;
        color: #8a6c33;
        white-space: nowrap;
      }

      .sponsor-info-line {
        display: flex;
        align-items: baseline;
        gap: 5px;
        margin-top: 3px;
        min-width: 0;
      }

      .sponsor-deity {
        min-width: 0;
        font-size: clamp(10px, .64vw, 12px);
        line-height: 1.05;
        font-weight: 600;
        color: #25211e;
        overflow-wrap: anywhere;
      }

      .sponsor-deity::after {
        content: "•";
        margin-left: 5px;
        color: var(--gold);
      }

      .sponsor-by {
        flex: 0 0 auto;
        font-size: clamp(8px, .5vw, 10px);
        line-height: 1;
        font-weight: 600;
        color: #887a70;
      }

      .sponsor-name {
        min-width: 0;
        font-size: clamp(10px, .65vw, 13px);
        line-height: 1.08;
        font-weight: 700;
        color: #25211e;
        overflow-wrap: anywhere;
      }

      .sponsor-details {
        margin-top: 2px;
        font-size: clamp(8px, .5vw, 10px);
        line-height: 1.05;
        color: #6d5f55;
        overflow-wrap: anywhere;
      }

      .sponsor-pager {
        display: flex;
        justify-content: center;
        gap: 5px;
        margin-top: 3px;
        min-height: 5px;
      }

      .sponsor-dot {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: #d8c8aa;
      }

      .sponsor-dot.is-active {
        background: var(--gold);
      }

      @media (max-height: 850px) {
        .sponsor-section {
          padding-top: 3px;
        }

        .sponsor-section .schedule-ornament {
          height: 8px;
        }

        .sponsor-section .schedule-heading-divider {
          margin-bottom: 2px;
        }

        .sponsor-list {
          gap: 3px;
        }

        .sponsor-item {
          min-height: 44px;
          padding: 3px 5px 4px;
        }

        .sponsor-info-line {
          margin-top: 2px;
        }
      }
    `;

    document.head.appendChild(style);
  }


  function ensureCard() {

    let card = document.getElementById("weekly-sponsor-section");
    if (card) return card;

    const rail = document.querySelector(".info-rail");
    const community = document.querySelector(".community-section");

    if (!rail || !community) return null;

    card = document.createElement("section");
    card.id = "weekly-sponsor-section";
    card.className = "rail-section sponsor-section";
    card.hidden = true;

    card.innerHTML = `
      <div class="schedule-ornament" aria-hidden="true">
        <span></span>
      </div>

      <div class="schedule-heading">
        THIS WEEK'S SEVA SPONSORS
      </div>

      <div class="schedule-heading-divider">
        <span class="divider-diamond"></span>
      </div>

      <div class="sponsor-viewport">
        <div id="weekly-sponsor-list" class="sponsor-list"></div>
      </div>

      <div id="weekly-sponsor-pager" class="sponsor-pager" aria-hidden="true"></div>
    `;

    rail.insertBefore(card, community);
    return card;
  }


  function sponsorItemHTML(item) {

    const showDeity = deityShouldDisplay(item.deity);

    const deity = showDeity
      ? `<span class="sponsor-deity">${escapeHTML(item.deity)}</span>`
      : "";

    const details = item.details
      ? `<div class="sponsor-details">${escapeHTML(item.details)}</div>`
      : "";

    return `
      <article class="sponsor-item">
        <div class="sponsor-topline">
          <div class="sponsor-type">${escapeHTML(item.sevaType)}</div>
          <div class="sponsor-date">${escapeHTML(formatSponsorDate(item.date))}</div>
        </div>

        <div class="sponsor-info-line">
          ${deity}
          <span class="sponsor-by">Sponsored by</span>
          <span class="sponsor-name">${escapeHTML(item.sponsorName)}</span>
        </div>

        ${details}
      </article>
    `;
  }


  function renderSponsorPage(animate = false) {

    const card = ensureCard();
    const list = document.getElementById("weekly-sponsor-list");
    const pager = document.getElementById("weekly-sponsor-pager");
    const community = document.querySelector(".community-section");

    if (!card || !list || !pager) return;

    if (!sponsors.length) {
      card.hidden = true;
      list.innerHTML = "";
      pager.innerHTML = "";
      if (community) community.hidden = false;
      return;
    }

    card.hidden = false;

    /*
      On sponsor weeks this compact card uses the bottom rail slot.
      This prevents the right column from becoming overcrowded.
      The community card automatically returns when no sponsors exist.
    */
    if (community) community.hidden = true;

    const pageCount = Math.ceil(sponsors.length / ITEMS_PER_PAGE);
    if (pageIndex >= pageCount) pageIndex = 0;

    const start = pageIndex * ITEMS_PER_PAGE;
    const visible = sponsors.slice(start, start + ITEMS_PER_PAGE);

    const applyContent = () => {
      list.innerHTML = visible.map(sponsorItemHTML).join("");

      pager.innerHTML = pageCount > 1
        ? Array.from({ length: pageCount }, (_, index) =>
            `<span class="sponsor-dot${index === pageIndex ? " is-active" : ""}"></span>`
          ).join("")
        : "";
    };

    if (!animate) {
      list.classList.remove("is-leaving", "is-entering");
      applyContent();
      return;
    }

    if (animationBusy) return;
    animationBusy = true;

    list.classList.remove("is-entering");
    list.classList.add("is-leaving");

    setTimeout(() => {

      applyContent();

      list.classList.remove("is-leaving");
      list.classList.add("is-entering");

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          list.style.transition = "transform .48s ease, opacity .42s ease";
          list.classList.remove("is-entering");
        });
      });

      setTimeout(() => {
        list.style.transition = "";
        animationBusy = false;
      }, 520);

    }, 420);
  }


  function restartRotation() {

    if (rotateTimer) {
      clearInterval(rotateTimer);
      rotateTimer = null;
    }

    const pageCount = Math.ceil(sponsors.length / ITEMS_PER_PAGE);
    if (pageCount <= 1) return;

    rotateTimer = setInterval(() => {
      if (animationBusy) return;
      pageIndex = (pageIndex + 1) % pageCount;
      renderSponsorPage(true);
    }, ROTATE_MS);
  }


  async function fetchRows() {

    const urls = [PUBLISHED_SPONSOR_CSV, GVIZ_SPONSOR_CSV];
    let lastError = null;

    for (const url of urls) {

      try {

        const response = await fetch(
          url + (url.includes("?") ? "&" : "?") + "_=" + Date.now(),
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error("Sponsor sheet request failed: " + response.status);
        }

        const text = await response.text();

        if (/^\s*</.test(text)) {
          throw new Error("Sponsor sheet returned HTML instead of CSV.");
        }

        const rows = parseCSV(text);
        if (rows.length) return rows;
      }
      catch (error) {
        lastError = error;
      }
    }

    if (lastError) throw lastError;
    return [];
  }


  async function loadSponsors() {

    try {

      const rows = await fetchRows();

      if (rows.length < 2) {
        sponsors = [];
        pageIndex = 0;
        renderSponsorPage(false);
        restartRotation();
        return;
      }

      const headers = rows[0].map(normalizeHeader);

      const dateIndex = headers.indexOf("date");
      const sevaTypeIndex = headers.indexOf("sevatype");
      const deityIndex = headers.indexOf("deity");
      const sponsorNameIndex = headers.indexOf("sponsorname");
      const detailsIndex = headers.indexOf("details");
      const activeIndex = headers.indexOf("active");
      const orderIndex = headers.indexOf("displayorder");

      if (dateIndex < 0 || sevaTypeIndex < 0 || sponsorNameIndex < 0) {
        throw new Error("Sponsors sheet is missing required columns.");
      }

      const { start, end } = getCurrentWeekRange();
      const loaded = [];

      for (let i = 1; i < rows.length; i++) {

        const row = rows[i];

        const active = activeIndex >= 0
          ? String(row[activeIndex] || "YES").trim().toUpperCase()
          : "YES";

        if (active !== "YES") continue;

        const date = parseLocalDate(row[dateIndex]);
        if (!date || date < start || date >= end) continue;

        const sevaType = String(row[sevaTypeIndex] || "").trim();
        const sponsorName = String(row[sponsorNameIndex] || "").trim();

        if (!sevaType || !sponsorName) continue;

        loaded.push({
          date,
          sevaType,
          deity: deityIndex >= 0 ? String(row[deityIndex] || "").trim() : "",
          sponsorName,
          details: detailsIndex >= 0 ? String(row[detailsIndex] || "").trim() : "",
          order: orderIndex >= 0 ? (parseInt(row[orderIndex], 10) || 999) : 999,
          rowOrder: i
        });
      }

      loaded.sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        if (a.date.getTime() !== b.date.getTime()) return a.date - b.date;
        return a.rowOrder - b.rowOrder;
      });

      sponsors = loaded;
      pageIndex = 0;

      renderSponsorPage(false);
      restartRotation();
    }
    catch (error) {

      console.warn("Sponsors:", error);

      sponsors = [];
      pageIndex = 0;

      renderSponsorPage(false);
      restartRotation();
    }
  }


  function start() {
    ensureStyles();
    ensureCard();
    loadSponsors();
    setInterval(loadSponsors, REFRESH_MS);
  }


  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  }
  else {
    start();
  }

})();
