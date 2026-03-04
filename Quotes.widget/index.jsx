export const command = `
  python3 - <<'PY'
import json
import random

with open("Quotes.widget/quotes.json", "r", encoding="utf-8") as f:
    data = json.load(f)

quotes = data.get("quotes") or []
print(json.dumps(random.choice(quotes) if quotes else {}))
PY
`;

export const refreshFrequency = 3600000;

export const className = `
  position: fixed;
  right: 945px;
  bottom: 920px;
  width: 560px;
  margin: 0;
  padding: 0;
  background: transparent;
  pointer-events: none;
  user-select: none;

  .quote-block {
    position: relative;
    padding: 24px 32px 20px 40px;
    border-left: 3px solid rgba(255, 255, 255, 0.35);
  }

  .quote-open, .quote-close {
    font-family: Georgia, "Palatino Linotype", "Book Antiqua", serif;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.20);
    position: absolute;
    pointer-events: none;
    line-height: 1;
  }

  .quote-open {
    font-size: 120px;
    top: -30px;
    left: -18px;
  }

  .quote-close {
    font-size: 50px;
    bottom: -30px;
    right: 0;
  }

  .quote-text {
    font-family: Georgia, "Palatino Linotype", "Book Antiqua", serif;
    font-size: 21px;
    font-weight: 400;
    font-style: italic;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.85);
    text-shadow: 0 1px 10px rgba(0, 0, 0, 0.55), 0 0 30px rgba(0, 0, 0, 0.2);
    position: relative;
    z-index: 1;
    letter-spacing: 0.2px;
  }

  .quote-divider {
    width: 40px;
    height: 1px;
    background: rgba(255, 255, 255, 0.2);
    margin: 18px 0 14px ;
  }

  .quote-author {
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    font-size: 13px;
    font-weight: 400;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.45);
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
  }
`;

export function render({ output }) {
  if (!output || output.trim() === "") {
    return <div />;
  }

  let quote;
  try {
    quote = JSON.parse(output);
  } catch {
    return <div />;
  }

  return (
    <div className="quote-block">
      <span className="quote-open">{"\u201C"}</span>
      <span className="quote-close">{"\u201D"}</span>
      <div className="quote-text">{quote.text}</div>
      {quote.author && (
        <div>
          <div className="quote-divider" />
          <div className="quote-author">{quote.author}</div>
        </div>
      )}
    </div>
  );
}
