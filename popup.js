const qInput   = document.getElementById("query");
const results  = document.getElementById("results");

// Listen for typing
qInput.addEventListener("input", () => {
  const query = qInput.value.trim().toLowerCase();
  if (!query) { results.innerHTML = ""; return; }

  // Ask the active tab (Salesforce) to search its Users table
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (!tab) return;

  // NEW: get details for every frame in the tab, then send into each frame
  chrome.webNavigation.getAllFrames({ tabId: tab.id }, (frames) => {
    let totalReplies = 0;
    results.innerHTML = "";  // clear early

    frames.forEach((frame) => {
        console.log("→ Sending search to frame", frame.frameId);

      chrome.tabs.sendMessage(
        tab.id,
        { type: "SF_SEARCH_USERS", query },
        { frameId: frame.frameId },          // <-- target that frame
        (users = []) => {
          if (chrome.runtime.lastError) return; // frame had no script
          if (!users.length) return;            // this frame found nothing

          totalReplies += users.length;
          users.forEach((u) => {
            const li  = document.createElement("li");
            const btn = document.createElement("button");
            btn.textContent = u.name;
            btn.onclick = () => chrome.tabs.update(tab.id, { url: u.link });
            li.append(btn);
            results.append(li);
          });
        }
      );
    });
  });
});
});
