// lightning_inject.js
console.log("DITTO Lightning frame injector running");

function injectIntoClassicFrame() {
  // Salesforce gives each classic Setup iframe a name that starts with "vfFrameId"
  const frame = document.querySelector('iframe[name^="vfFrameId"]');
  if (!frame || !frame.contentDocument) {
    // Retry until the iframe appears
    return setTimeout(injectIntoClassicFrame, 400);
  }

  try {
    // Build a <script> tag containing the classic-table search logic
    const script = frame.contentDocument.createElement("script");
    script.type = "text/javascript";
    script.textContent = `
      console.log("DITTO classic search helper injected:", location.href);

      chrome.runtime.onMessage.addListener((msg, _s, sendResponse) => {
        if (msg.type !== "SF_SEARCH_USERS") return;

        const term = msg.query.toLowerCase();
        const matches = [];

        document.querySelectorAll("tr.dataRow").forEach(row => {
          const a = row.querySelector('th a[href*="/alohaRedirect/005"]');
          if (!a) return;
          const name  = a.textContent.trim();
          const idMatch = a.href.match(/alohaRedirect\\/(005\\w{12,15})/);
          if (!idMatch) return;

          matches.push({ id: idMatch[1], name, link: a.href });
        });

        if (matches.length) sendResponse(matches);
      });
    `;
    frame.contentDocument.documentElement.appendChild(script);
    console.log("DITTO: classic helper injected ✔︎");
  } catch (err) {
    console.error("DITTO iframe injection failed", err);
  }
}

injectIntoClassicFrame();
