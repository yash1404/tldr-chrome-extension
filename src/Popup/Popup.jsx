// src/popup/Popup.jsx
import React, { useState, useEffect } from "react";
import { summarizeWithHuggingFace } from "../utils/Summarize";
import "./Popup.css";

const Popup = () => {
  const [summary, setSummary] = useState("");
  const [savedSummaries, setSavedSummaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summaryTitle, setSummaryTitle] = useState("");

  const handleSummarize = () => {
    setLoading(true);
    chrome?.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { type: "EXTRACT_ARTICLE" },
        async (response) => {
          if (chrome.runtime.lastError || !response?.content) {
            setSummary("Failed to extract article.");
            setLoading(false);
            return;
          }

          try {
            const finalSummary = await summarizeWithHuggingFace(
              response?.content
            );
            setSummaryTitle(response?.title);
            setSummary(finalSummary);

            // Save to storage (next step)
            chrome.storage.local.set({
              [`summary-${response.title}`]: {
                title: response.title,
                summary: finalSummary,
                date: new Date().toISOString(),
                url: tabs[0].url,
              },
            });
          } catch (err) {
            setSummary("Error getting summary.");
          }

          setLoading(false);
        }
      );
    });
  };

  const deleteSummary = (title) => {
    chrome.storage.local.remove(`summary-${title}`, () => {
      setSavedSummaries((prev) => prev.filter((item) => item.title !== title));
    });
  };

  useEffect(() => {
    chrome?.storage?.local.get(null, (items) => {
      const summaries = Object.values(items)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3);
      setSavedSummaries(summaries);
    });
  }, []);

  const handleCopy = async () => {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary);
      alert("✅ Summary copied to clipboard!");
    } catch (err) {
      alert("❌ Failed to copy summary.");
    }
  };

  const handleDownload = () => {
    console.log("clicked download");
    if (!summary) return;

    const title = summaryTitle || "summary";
    const blob = new Blob([summary], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^\w\s]/gi, "").slice(0, 30)}.txt`;
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="popup-container">
        <h2 className="title">🧠 TL;DR Summarizer</h2>

        <button onClick={handleSummarize} disabled={loading} className="button">
          {loading ? "Summarizing..." : "Summarize This Page"}
        </button>

        {summary && (
          <>
            <div className="summary-box">
              <ul style={{ paddingLeft: "18px", margin: 0 }}>
                {summary
                  .split(/(?<=[.?!])\s+(?=[A-Z])/g) // Split by sentence boundary
                  .map((point, idx) =>
                    point.trim() ? <li key={idx}>{point.trim()}</li> : null
                  )}
              </ul>
            </div>
            <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
              <button className="button" onClick={handleCopy}>
                📋 Copy
              </button>
              <button className="button" onClick={handleDownload}>
                📄 Download
              </button>
            </div>
          </>
        )}

        {savedSummaries.length > 0 && (
          <div className="saved-section">
            <h4 className="title" style={{ fontSize: "15px" }}>
              📚 Recent Summaries
            </h4>
            {savedSummaries.map((item, index) => (
              <div key={index} className="saved-summary">
                <a href={item.url} target="_blank" rel="noopener noreferrer">
                  {item.title}
                </a>
                <p>{item.summary}</p>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "5px",
                  }}
                >
                  <small>{new Date(item.date).toLocaleString()}</small>
                  <button
                    className="delete-btn"
                    onClick={() => deleteSummary(item.title)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Popup;
