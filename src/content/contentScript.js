import { Readability } from "@mozilla/readability";

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "EXTRACT_ARTICLE") {
    try {
      const article = new Readability(document.cloneNode(true)).parse();
      console.log("📄 Extracted article:", article);
      // ✅ FIXED: Ensure sendResponse is returned after Promise resolution
      Promise.resolve().then(() => {
        sendResponse({ title: article.title, content: article.textContent });
      });
    } catch (e) {
      console.error("Error parsing article", e);
      sendResponse({ title: "Error", content: "" });
    }
    return true;
  }
});
