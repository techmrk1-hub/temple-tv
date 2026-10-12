/* ==========================================================
   CHINMAYA SARASWATI ASHRAM - DEVI TEMPLE
   V1 SCHEDULE ROTATOR ADD-ON

   Safe add-on:
   - Shows maximum 3 Today rows at a time
   - Shows maximum 3 Tomorrow rows at a time
   - If more than 3 rows exist, rotates upward automatically
   - Keeps the Community / QR section visible
   - Does not change existing fonts, schedule data, or main logic
========================================================== */

(() => {

  const MAX_VISIBLE_ROWS = 3;
  const ROTATE_MS = 6500;
  const ANIMATION_MS = 420;

  const states = [];


  function ensureStyles() {

    if (document.getElementById("temple-schedule-rotator-styles")) return;

    const style = document.createElement("style");
    style.id = "temple-schedule-rotator-styles";

    style.textContent = `
      #today-schedule-list,
      #tomorrow-schedule-list {
        transition:
          transform ${ANIMATION_MS}ms ease,
          opacity ${ANIMATION_MS}ms ease;
        will-change: transform, opacity;
      }

      #today-schedule-list.schedule-rotation-enabled > .schedule-item,
      #tomorrow-schedule-list.schedule-rotation-enabled > .tomorrow-schedule-item {
        display: none;
      }

      #today-schedule-list.schedule-rotation-enabled > .schedule-item.schedule-row-visible,
      #tomorrow-schedule-list.schedule-rotation-enabled > .tomorrow-schedule-item.schedule-row-visible {
        display: grid;
      }

      .schedule-rotate-up {
        transform: translateY(-18px);
        opacity: 0;
      }

      .schedule-rotate-enter {
        transform: translateY(18px);
        opacity: 0;
        transition: none !important;
      }

      .community-section[hidden] {
        display: block !important;
      }
    `;

    document.head.appendChild(style);
  }


  function getItems(state) {
    return Array.from(
      state.element.querySelectorAll(`:scope > ${state.itemSelector}`)
    );
  }


  function getWindowCount(itemCount) {
    return itemCount > MAX_VISIBLE_ROWS
      ? itemCount - MAX_VISIBLE_ROWS + 1
      : 1;
  }


  function applyWindow(state) {

    const items = getItems(state);

    if (items.length <= MAX_VISIBLE_ROWS) {
      state.element.classList.remove("schedule-rotation-enabled");
      items.forEach(item => item.classList.remove("schedule-row-visible"));
      return;
    }

    state.element.classList.add("schedule-rotation-enabled");

    const maxStart = items.length - MAX_VISIBLE_ROWS;
    if (state.startIndex > maxStart) state.startIndex = 0;

    items.forEach((item, index) => {
      const visible =
        index >= state.startIndex &&
        index < state.startIndex + MAX_VISIBLE_ROWS;

      item.classList.toggle("schedule-row-visible", visible);
    });
  }


  function stopTimer(state) {
    if (state.timer) {
      clearInterval(state.timer);
      state.timer = null;
    }
  }


  function rotateUp(state) {

    if (state.busy) return;

    const items = getItems(state);
    if (items.length <= MAX_VISIBLE_ROWS) return;

    state.busy = true;

    state.element.classList.remove("schedule-rotate-enter");
    state.element.classList.add("schedule-rotate-up");

    setTimeout(() => {

      const currentItems = getItems(state);
      const windowCount = getWindowCount(currentItems.length);

      state.startIndex =
        (state.startIndex + 1) % windowCount;

      applyWindow(state);

      state.element.classList.remove("schedule-rotate-up");
      state.element.classList.add("schedule-rotate-enter");

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          state.element.classList.remove("schedule-rotate-enter");
          state.busy = false;
        });
      });

    }, ANIMATION_MS);
  }


  function restart(state) {

    stopTimer(state);

    state.startIndex = 0;
    state.busy = false;

    state.element.classList.remove(
      "schedule-rotate-up",
      "schedule-rotate-enter"
    );

    applyWindow(state);

    if (getItems(state).length > MAX_VISIBLE_ROWS) {
      state.timer = setInterval(
        () => rotateUp(state),
        ROTATE_MS
      );
    }
  }


  function setupList(elementId, itemSelector) {

    const element = document.getElementById(elementId);
    if (!element) return;

    const state = {
      element,
      itemSelector,
      startIndex: 0,
      timer: null,
      busy: false,
      refreshTimer: null
    };

    states.push(state);
    restart(state);

    const observer = new MutationObserver(() => {

      /*
        Main V1 code refreshes Today/Tomorrow with innerHTML.
        Wait for that update to finish, then re-apply the 3-row window.
      */
      if (state.refreshTimer) clearTimeout(state.refreshTimer);

      state.refreshTimer = setTimeout(
        () => restart(state),
        60
      );
    });

    observer.observe(element, {
      childList: true
    });
  }


  function keepCommunityVisible() {

    const community = document.querySelector(".community-section");
    if (!community) return;

    const reveal = () => {
      if (community.hidden) community.hidden = false;
      if (community.hasAttribute("hidden")) {
        community.removeAttribute("hidden");
      }
    };

    reveal();

    const observer = new MutationObserver(reveal);

    observer.observe(community, {
      attributes: true,
      attributeFilter: ["hidden"]
    });
  }


  function start() {
    ensureStyles();

    setupList(
      "today-schedule-list",
      ".schedule-item"
    );

    setupList(
      "tomorrow-schedule-list",
      ".tomorrow-schedule-item"
    );

    keepCommunityVisible();
  }


  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      start,
      { once: true }
    );
  }
  else {
    start();
  }

})();
