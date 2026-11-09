/* ==========================================================
   CHINMAYA SARASWATI ASHRAM - DEVI TEMPLE
   REMOTE TV REFRESH WATCHER

   Watches SignageSettings -> ForceRefreshToken.
   When the token changes after page load, the TV reloads itself.
========================================================== */

(() => {
  const SETTINGS_CSV =
    "https://docs.google.com/spreadsheets/d/1rljGlqs80q6qdqddXd5Rh6BZE7fAEvG3OsHAny81t1s/gviz/tq?tqx=out:csv&gid=2026091302";

  const POLL_MS = 5000;

  let lastToken = null;
  let reloading = false;

  function parseCSV(text) {
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const next = text[i + 1];

      if (ch === '"') {
        if (inQuotes && next === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        row.push(field.trim());
        field = "";
      } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
        if (ch === "\r" && next === "\n") i++;
        row.push(field.trim());
        field = "";
        if (row.some(v => v !== "")) rows.push(row);
        row = [];
      } else {
        field += ch;
      }
    }

    if (field || row.length) {
      row.push(field.trim());
      if (row.some(v => v !== "")) rows.push(row);
    }

    return rows;
  }

  async function readRefreshToken() {
    const response = await fetch(
      SETTINGS_CSV + "&_=" + Date.now(),
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error("Remote refresh settings request failed: " + response.status);
    }

    const rows = parseCSV(await response.text());

    for (const row of rows) {
      const key = String(row[0] || "").trim();
      if (key === "ForceRefreshToken") {
        return String(row[1] || "").trim();
      }
    }

    return "";
  }

  async function checkForRemoteRefresh() {
    if (reloading) return;

    try {
      const token = await readRefreshToken();

      if (lastToken === null) {
        lastToken = token;
        return;
      }

      if (token && token !== lastToken) {
        reloading = true;
        window.location.reload();
      }
    } catch (error) {
      console.warn("Remote TV refresh:", error);
    }
  }

  checkForRemoteRefresh();
  setInterval(checkForRemoteRefresh, POLL_MS);
})();
