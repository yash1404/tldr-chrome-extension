const HF_TOKEN = import.meta.env.VITE_HF_API_KEY;
export const summarizeWithHuggingFace = async (text) => {
  const safeText = text.slice(0, 4000);
  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/facebook/bart-large-cnn",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${HF_TOKEN}`,
        },
        body: JSON.stringify({ inputs: safeText }),
      }
    );

    const result = await response.json();

    if (Array.isArray(result) && result[0]?.summary_text) {
      return result[0].summary_text;
    } else if (result?.error) {
      return `Summary failed: ${result.error}`;
    } else {
      return "Summary failed.";
    }
  } catch (err) {
    console.error(" HuggingFace summarizer error:", err);
    return "HuggingFace request failed.";
  }
};
