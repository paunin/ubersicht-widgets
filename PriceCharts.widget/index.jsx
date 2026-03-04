// PriceCharts widget - live asset price sparkline charts
// BTC/USD, SP500/USD, GOLD/USD

export const command = "PriceCharts.widget/fetch-prices.sh";

export const refreshFrequency = 60000; // 1 min poll; data revalidates every 30 min via cache

export const className = `
  position: fixed;
  right: 1280px;
  bottom: 120px;
  width: 225px;
  margin: 0;
  padding: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.76);
  font-family: Monaco, "Menlo", "Ubuntu Mono", monospace;
  font-size: 12px;
  line-height: 1.3;
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.6);
  pointer-events: none;
  user-select: none;

  .chart-card {
    margin-bottom: 8px;
  }
  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 0 2px;
    opacity: 0.5;
    background: rgba(0, 0, 0, 0.45);
  }
  .chart-symbol {
    font-size: 11px;
    opacity: 0.7;
  }
  .chart-price {
    font-size: 13px;
    font-weight: bold;
  }
  .chart-change {
    font-size: 11px;
  }
  .chart-change.up { color: #4caf50; }
  .chart-change.down { color: #ef5350; }
  .chart-svg {
    display: block;
    background: rgba(0, 0, 0, 0.15);
  }
  .chart-range {
    display: flex;
    justify-content: space-between;
    padding: 1px 2px 0;
    font-size: 9px;
    opacity: 0.45;
    background: rgba(0, 0, 0, 0.25);
  }
  .no-data {
    height: 95px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.4;
    background: rgba(0, 0, 0, 0.25);
    border-radius: 4px;
  }
`;

function formatPrice(val, symbol) {
  if (val >= 10000) return val.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (val >= 100) return val.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return val.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function PriceChart({ symbol, current, change, prices, width = 225, height = 95 }) {
  if (!prices || prices.length < 2) {
    return (
      <div className="chart-card">
        <div className="chart-header">
          <span className="chart-symbol">{symbol}</span>
        </div>
        <div className="no-data">No data</div>
      </div>
    );
  }

  const isUp = prices[prices.length - 1] >= prices[0];
  const color = isUp ? "#4caf50" : "#ef5350";
  const pctChange = ((prices[prices.length - 1] - prices[0]) / prices[0] * 100);
  const gradId = "grad-" + symbol.replace(/[^a-zA-Z0-9]/g, "");

  let min = prices[0], max = prices[0];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i] < min) min = prices[i];
    if (prices[i] > max) max = prices[i];
  }
  const range = max - min || 1;

  const pad = { top: 6, bottom: 6, left: 0, right: 0 };
  const cw = width - pad.left - pad.right;
  const ch = height - pad.top - pad.bottom;

  // Generate SVG polyline points
  const pts = prices.map((p, i) => {
    const x = pad.left + (i / (prices.length - 1)) * cw;
    const y = pad.top + ch - ((p - min) / range) * ch;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const pointsStr = pts.join(" ");

  // Area path: line + close to bottom
  const firstX = pad.left;
  const lastX = pad.left + cw;
  const bottomY = pad.top + ch;
  const areaD = `M ${pts.map(p => p).join(" L ")} L ${lastX.toFixed(1)},${bottomY} L ${firstX},${bottomY} Z`;

  return (
    <div className="chart-card">
      <div className="chart-header">
        <span className="chart-symbol">{symbol}</span>
        <span>
          <span className="chart-price">${formatPrice(current, symbol)}</span>
          {" "}
          <span className={"chart-change " + (isUp ? "up" : "down")}>
            {isUp ? "+" : ""}{pctChange.toFixed(2)}%
          </span>
        </span>
      </div>
      <svg className="chart-svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0.03" />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#${gradId})`} />
        <polyline
          points={pointsStr}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <div className="chart-range">
        <span>{formatPrice(min, symbol)}</span>
        <span>7d</span>
        <span>{formatPrice(max, symbol)}</span>
      </div>
    </div>
  );
}

export function render({ output }) {
  if (!output || output.trim() === "") {
    return <div>Loading...</div>;
  }

  let data;
  try {
    data = JSON.parse(output);
  } catch (e) {
    return <div style={{ opacity: 0.5 }}>Parse error</div>;
  }

  if (!data.assets || !Array.isArray(data.assets)) {
    return <div style={{ opacity: 0.5 }}>No data</div>;
  }

  return (
    <div>
      {data.assets.map((asset) => {
        try {
          return (
            <PriceChart
              key={asset.symbol}
              symbol={asset.symbol}
              current={asset.current}
              change={asset.change}
              prices={asset.prices}
              width={225}
              height={95}
            />
          );
        } catch (e) {
          return <div key={asset.symbol} className="chart-card" style={{opacity:0.4}}>{asset.symbol}: render error</div>;
        }
      })}
    </div>
  );
}
