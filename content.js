console.log("DITTO content script injected on", location.href);

// 1. If we land on a User page, auto-click the “Login” button.
(function clickLoginIfPresent() {
  const btn = document.querySelector('button[title="Login"]');
  if (btn) btn.click();
})();

// 2. Add a red banner when impersonating someone (detect via “switchTo” in URL or by presence of “Login |” in the title).
(function addImpersonationBanner() {
  if (!/006|005/.test(location.pathname)) return;        // crude guard: runs only on record pages
  if (!document.title.includes("Login |")) return;      // not impersonating
  if (document.getElementById("sf-impersonation-banner")) return;

  const div = document.createElement("div");
  div.id = "sf-impersonation-banner";
  div.style.cssText = `
    position:fixed; top:0; left:0; width:100%; z-index:9999;
    background:#d93025; color:#fff; padding:6px; text-align:center; font-size:13px;
  `;

  const who = document.title.split("|")[0].trim();
  div.textContent = `👤 Logged in as ${who} — `;
  const back = document.createElement("a");
  back.href = "javascript:history.back()";
  back.textContent = "Return to admin";
  back.style.color = "#fff";
  div.append(back);

  document.body.style.paddingTop = "30px";   // avoid hiding page header
  document.body.prepend(div);
})();

// 3. Handle search requests from popup.js   (Lightning + Classic, all frames)
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    console.log("[DITTO] Received message", msg);
  if (msg.type !== "SF_SEARCH_USERS") return;

  const term = msg.query.toLowerCase();
  const matches = [];

  // --- Lightning Experience rows ---
  document.querySelectorAll('tr[data-row-key-value]').forEach(row => {
    const a = row.querySelector('a[href*="/lightning/r/User/"]');
    if (a && a.textContent.toLowerCase().includes(term)) {
      matches.push({
        id:   row.getAttribute('data-row-key-value'),
        name: a.textContent.trim(),
        link: a.href
      });
    }
  });

// --- Classic Setup rows ---
document.querySelectorAll("tr.dataRow").forEach((row) => {
  const a = row.querySelector("th a");
  if (!a) return;

  const name = a.textContent.trim();
  if (!name.toLowerCase().includes(term)) return; 

  const link = a.href;
  const idMatch = link.match(/005\w{12,17}/);
  if (!idMatch) return;

  matches.push({
    id:   idMatch[0],
    name,
    link: link.startsWith("javascript:")
            ? `${window.top.location.origin}/lightning/r/User/${idMatch[0]}/view`
            : link
  });
  console.log("[DITTO] Match:", name);
});


  sendResponse(matches);
});
