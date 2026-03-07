export const command = "cd GarminConnect.widget && set -a; [ -f ./config.env ] && . ./config.env; set +a; [ -f .venv/bin/activate ] && . .venv/bin/activate; python3 fetch-garmin.py";

export const refreshFrequency = 1800000; // 30 min

const WIDTH = 340;
const CHART_H = 84;
const AXIS_W = 38;
const CHART_W = WIDTH - 16 - AXIS_W + 2;
const STAGES_H = 143;
const STAGES_W = CHART_W;

export const className = `
  position: fixed;
  right: 1580px;
  bottom: 120px;
  width: ${WIDTH}px;
  margin: 0;
  padding: 0;
  background: transparent;
  pointer-events: none;
  user-select: none;

  .garmin-shell {
    border-radius: 11px;
    padding: 10px 12px;
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.10);
    box-shadow: 0 8px 18px rgba(0, 0, 0, 0.24);
    color: rgba(255, 255, 255, 0.88);
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  }

  .title {
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.3px;
    margin-bottom: 8px;
    color: rgba(255, 255, 255, 0.9);
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
  }

  .title-main {
    flex: 0 0 auto;
  }

  .title-date {
    margin-left: auto;
    font-size: 10px;
    font-weight: 400;
    letter-spacing: 0.2px;
    color: rgba(255, 255, 255, 0.58);
    text-align: right;
    white-space: nowrap;
  }

  .title-with-icon {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .title-icon {
    width: 12px;
    height: 12px;
    display: inline-block;
    flex-shrink: 0;
    opacity: 0.9;
  }

  .title .title-icon {
    width: 13px;
    height: 13px;
  }

  .range {
    font-size: 10px;
    letter-spacing: 0.4px;
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: 10px;
  }

  .charts {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .chart-card {
    padding: 7px 8px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .chart-card.hrv-card .chart-plot {
    gap: 0;
  }

  .chart-card.hrv-card .y-axis {
    width: 24px;
    margin-left: -2px;
  }

  .chart-card.tight-axis .chart-plot {
    gap: 0;
  }

  .chart-card.tight-axis .y-axis {
    width: 24px;
    margin-left: -1px;
  }

  .chart-card.sleep-score-tight .chart-plot.dual {
    gap: 0;
  }

  .chart-card.sleep-score-tight .y-axis {
    width: 24px;
    margin-left: -1px;
  }

  .chart-card.sleep-score-tight .y-axis.left {
    width: 26px;
    margin-left: 0;
  }

  .chart-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 5px;
  }

  .chart-title {
    font-size: 10px;
    letter-spacing: 0.4px;
    color: rgba(255, 255, 255, 0.65);
  }

  .chart-values {
    text-align: right;
  }

  .chart-value {
    font-size: 13px;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.9);
    line-height: 1.15;
  }

  .chart-value.subtle {
    color: rgba(255, 255, 255, 0.62);
  }

  .chart-value-inline {
    font-size: 13px;
    font-weight: 400;
    line-height: 1.15;
    white-space: nowrap;
  }

  .chart-value-sep {
    color: rgba(255, 255, 255, 0.45);
    padding: 0 3px;
  }

  .chart-plot {
    display: flex;
    align-items: stretch;
    gap: 4px;
  }

  .chart-plot.dual {
    gap: 3px;
  }

  .chart-svg {
    display: block;
    width: ${CHART_W}px;
    height: ${CHART_H}px;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 4px;
  }

  .y-axis {
    width: ${AXIS_W}px;
    height: ${CHART_H}px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-end;
    font-size: 9px;
    color: rgba(255, 255, 255, 0.6);
    line-height: 1;
  }

  .y-axis.left {
    width: 26px;
    align-items: flex-start;
    text-align: left;
    font-size: 8px;
  }

  .y-axis.bb {
    justify-content: space-between;
  }

  .legend {
    margin-top: 5px;
    display: flex;
    gap: 10px;
    font-size: 9px;
    color: rgba(255, 255, 255, 0.6);
    letter-spacing: 0.3px;
  }

  .legend-line {
    display: inline-block;
    width: 10px;
    height: 2px;
    vertical-align: middle;
    margin-right: 4px;
    border-radius: 2px;
  }

  .error {
    font-size: 11px;
    color: rgba(255, 163, 163, 0.95);
    line-height: 1.4;
    white-space: pre-wrap;
  }

  .sleep-stages-foot {
    margin-top: 4px;
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: rgba(255, 255, 255, 0.62);
  }

  .sleep-stages-legend {
    flex-wrap: wrap;
    gap: 6px 10px;
  }
`;

function fmtNum(val) {
  if (typeof val !== "number" || Number.isNaN(val)) return "—";
  return Math.round(val).toString();
}

function fmtTick(val, unit) {
  if (typeof val !== "number" || Number.isNaN(val)) return "n/a";
  const abs = Math.abs(val);
  const decimals = unit === "h" ? 1 : abs < 10 ? 1 : 0;
  return `${val.toFixed(decimals)}${unit === "ms" || unit === "bpm" ? "" : ""}`;
}

function latestValue(series) {
  if (!Array.isArray(series)) return null;
  for (let i = series.length - 1; i >= 0; i--) {
    const v = series[i];
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return null;
}

function parseYmdLocal(ymd) {
  if (typeof ymd !== "string") return null;
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  return new Date(year, month - 1, day);
}

function ymdLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function latestNumericIndex(series) {
  if (!Array.isArray(series)) return -1;
  for (let i = series.length - 1; i >= 0; i--) {
    const v = series[i];
    if (typeof v === "number" && Number.isFinite(v)) return i;
  }
  return -1;
}

function latestNumericIndexAcross(seriesList) {
  if (!Array.isArray(seriesList)) return -1;
  return seriesList.reduce((maxIdx, s) => Math.max(maxIdx, latestNumericIndex(s)), -1);
}

function isLatestSeriesPointToday(series, fromYmd) {
  const idx = latestNumericIndex(series);
  if (idx < 0) return false;
  const from = parseYmdLocal(fromYmd);
  if (!from) return false;
  from.setDate(from.getDate() + idx);
  return ymdLocal(from) === ymdLocal(new Date());
}

function isLatestSeriesPointTodayAcross(seriesList, fromYmd) {
  const idx = latestNumericIndexAcross(seriesList);
  if (idx < 0) return false;
  const from = parseYmdLocal(fromYmd);
  if (!from) return false;
  from.setDate(from.getDate() + idx);
  return ymdLocal(from) === ymdLocal(new Date());
}

function isYmdToday(ymd) {
  const date = parseYmdLocal(ymd);
  if (!date) return false;
  return ymdLocal(date) === ymdLocal(new Date());
}

function latestString(series) {
  if (!Array.isArray(series)) return null;
  for (let i = series.length - 1; i >= 0; i--) {
    const v = series[i];
    if (typeof v === "string" && v.trim() !== "") return v.trim();
  }
  return null;
}

function formatHrvStatus(raw) {
  if (!raw) return null;
  const normalized = raw.toLowerCase();
  if (normalized.includes("balanced")) return "Balanced";
  if (normalized.includes("unbalanced")) return "Unbalanced";
  if (normalized.includes("low")) return "Low";
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

function TitleWithIcon({ icon, children }) {
  return (
    <span className="title-with-icon">
      <span className="title-icon">{icon}</span>
      <span>{children}</span>
    </span>
  );
}

function MonoSvg({ children, viewBox = "0 0 24 24" }) {
  return (
    <svg viewBox={viewBox} width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

function IconWatch() {
  return (
    <MonoSvg>
      <rect x="7.5" y="7.5" width="9" height="9" rx="2.2" />
      <line x1="10.5" y1="2.8" x2="13.5" y2="2.8" />
      <line x1="10.5" y1="21.2" x2="13.5" y2="21.2" />
    </MonoSvg>
  );
}

function IconHrv({ filled = false }) {
  return (
    <MonoSvg>
      {filled ? (
        <g>
          <path
            d="M12 20s-7-4.8-7-10a4 4 0 0 1 7-2.4A4 4 0 0 1 19 10c0 5.2-7 10-7 10z"
            fill="currentColor"
            stroke="none"
          />
          <path
            d="M6.7 12.6h2.3l1.3-2.4 2 4.2 1.5-3h2.5"
            fill="none"
            stroke="rgba(12,12,12,0.75)"
            strokeWidth="1.35"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      ) : (
        <g>
          <path d="M12 20s-7-4.8-7-10a4 4 0 0 1 7-2.4A4 4 0 0 1 19 10c0 5.2-7 10-7 10z" />
          <path d="M6.7 12.6h2.3l1.3-2.4 2 4.2 1.5-3h2.5" />
        </g>
      )}
    </MonoSvg>
  );
}

function IconSleep({ filled = false }) {
  return (
    <MonoSvg>
      <path
        d="M15.8 4.2a8 8 0 1 0 4 14.7A8.8 8.8 0 0 1 15.8 4.2z"
        fill={filled ? "currentColor" : "none"}
        stroke={filled ? "none" : "currentColor"}
      />
    </MonoSvg>
  );
}

function IconStages({ filled = false }) {
  return (
    <MonoSvg>
      {filled ? (
        <g fill="currentColor" stroke="none">
          <rect x="4" y="12" width="6" height="4" />
          <rect x="10" y="9" width="4" height="3" />
          <rect x="14" y="6" width="6" height="3" />
        </g>
      ) : (
        <g>
          <path d="M4 16h6v-4h4v-3h6" />
          <line x1="4" y1="16" x2="4" y2="12" />
          <line x1="10" y1="12" x2="10" y2="9" />
          <line x1="14" y1="9" x2="14" y2="6" />
          <line x1="20" y1="9" x2="20" y2="5" />
        </g>
      )}
    </MonoSvg>
  );
}

function IconHeart({ filled = false }) {
  return (
    <MonoSvg>
      <path
        d="M12 20s-7-4.8-7-10a4 4 0 0 1 7-2.4A4 4 0 0 1 19 10c0 5.2-7 10-7 10z"
        fill={filled ? "currentColor" : "none"}
        stroke={filled ? "none" : "currentColor"}
      />
    </MonoSvg>
  );
}

function IconStress({ filled = false }) {
  return (
    <MonoSvg>
      <path
        d="M13 2 5 14h6l-1 8 8-12h-6z"
        fill={filled ? "currentColor" : "none"}
        stroke={filled ? "none" : "currentColor"}
      />
    </MonoSvg>
  );
}

function IconBattery({ filled = false }) {
  return (
    <MonoSvg>
      <rect x="3" y="7" width="17" height="10" rx="2" />
      <line x1="21" y1="10" x2="21" y2="14" />
      {filled ? <rect x="6" y="9.5" width="10" height="5" fill="currentColor" stroke="none" /> : <line x1="6" y1="12" x2="16" y2="12" />}
    </MonoSvg>
  );
}

function IconSteps({ filled = false }) {
  return (
    <MonoSvg>
      <path d="M8.6 6.2c0-1 .8-1.8 1.8-1.8S12.2 5.2 12.2 6.2 11.4 8 10.4 8 8.6 7.2 8.6 6.2z" fill={filled ? "currentColor" : "none"} />
      <path d="M6.7 12.6c0-1.3 1-2.3 2.3-2.3h.8c1.2 0 2.3 1 2.3 2.3V21H6.7z" fill={filled ? "currentColor" : "none"} />
      <path d="M13 11.8h1.8c1.4 0 2.5 1.1 2.5 2.5V21H13z" fill={filled ? "currentColor" : "none"} />
    </MonoSvg>
  );
}

function IconCalories({ filled = false }) {
  return (
    <MonoSvg>
      <path d="M13.5 3.5c.9 1.5.7 3.2-.6 4.7-1.1 1.2-1.7 2.2-1.7 3.5 0 1.7 1.3 2.9 3 2.9 2.5 0 4.3-2.1 4.3-4.9 0-2.3-1-4.5-3-6.2z" fill={filled ? "currentColor" : "none"} />
      <path d="M9.4 9.6c-2.1 1.5-3.2 3.6-3.2 5.8 0 3.2 2.5 5.5 5.8 5.5 2.2 0 4.3-1.1 5.4-2.9" fill={filled ? "currentColor" : "none"} />
    </MonoSvg>
  );
}

function numericOrNull(v) {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function minMaxAcross(seriesList) {
  const values = [];
  for (const s of seriesList) {
    for (const v of s) {
      if (typeof v === "number") values.push(v);
    }
  }
  if (!values.length) return { min: 0, max: 1 };
  let min = values[0];
  let max = values[0];
  for (let i = 1; i < values.length; i++) {
    if (values[i] < min) min = values[i];
    if (values[i] > max) max = values[i];
  }
  if (min === max) return { min: min - 1, max: max + 1 };
  return { min, max };
}

function toPath(values, min, max, width, height, pad) {
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const range = max - min || 1;
  const n = values.length || 1;
  let d = "";

  for (let i = 0; i < n; i++) {
    const val = values[i];
    if (val == null) continue;
    const x = pad.left + (i / Math.max(1, n - 1)) * innerW;
    const y = pad.top + innerH - ((val - min) / range) * innerH;
    const prev = i > 0 ? values[i - 1] : null;
    d += prev == null ? `M ${x.toFixed(1)} ${y.toFixed(1)} ` : `L ${x.toFixed(1)} ${y.toFixed(1)} `;
  }
  return d.trim();
}

function toY(val, min, max, height, pad) {
  const innerH = height - pad.top - pad.bottom;
  const range = max - min || 1;
  return pad.top + innerH - ((val - min) / range) * innerH;
}

function baselineSegments(lowSeries, highSeries, min, max, width, height, pad) {
  const low = Array.isArray(lowSeries) ? lowSeries.map(numericOrNull) : [];
  const high = Array.isArray(highSeries) ? highSeries.map(numericOrNull) : [];
  const n = Math.max(low.length, high.length);
  const innerW = width - pad.left - pad.right;

  const segments = [];
  let start = -1;
  for (let i = 0; i < n; i++) {
    const valid = low[i] != null && high[i] != null;
    if (valid && start < 0) start = i;
    if ((!valid || i === n - 1) && start >= 0) {
      const end = valid && i === n - 1 ? i : i - 1;
      if (end >= start) segments.push([start, end]);
      start = -1;
    }
  }

  return segments.map(([startIdx, endIdx], segIdx) => {
    const upper = [];
    const lower = [];
    for (let i = startIdx; i <= endIdx; i++) {
      const x = pad.left + (i / Math.max(1, n - 1)) * innerW;
      upper.push(`${x.toFixed(1)},${toY(high[i], min, max, height, pad).toFixed(1)}`);
      lower.push(`${x.toFixed(1)},${toY(low[i], min, max, height, pad).toFixed(1)}`);
    }
    return { key: segIdx, points: `${upper.join(" ")} ${lower.reverse().join(" ")}` };
  });
}

function ChartCard({
  cardClassName,
  plotPad,
  title,
  value,
  valueSecondary,
  unit,
  valueLabel,
  valueSecondaryLabel,
  valuesWithSlash,
  seriesList,
  baselineLowSeries,
  baselineHighSeries,
  lineColors,
  legend,
}) {
  const width = CHART_W;
  const pad = {
    top: plotPad?.top ?? 6,
    bottom: plotPad?.bottom ?? 6,
    left: plotPad?.left ?? 4,
    right: plotPad?.right ?? 4,
  };
  const normalized = seriesList.map((s) => (Array.isArray(s) ? s.map(numericOrNull) : []));
  const baselineLow = Array.isArray(baselineLowSeries) ? baselineLowSeries.map(numericOrNull) : [];
  const baselineHigh = Array.isArray(baselineHighSeries) ? baselineHighSeries.map(numericOrNull) : [];
  const { min, max } = minMaxAcross([...normalized, baselineLow, baselineHigh]);
  const mid = (min + max) / 2;
  const baselinePolys = baselineSegments(baselineLow, baselineHigh, min, max, width, CHART_H, pad);

  return (
    <div className={`chart-card${cardClassName ? ` ${cardClassName}` : ""}`}>
      <div className="chart-header">
        <div className="chart-title">{title}</div>
        <div className="chart-values">
          {valuesWithSlash && valueSecondary != null ? (
            <div className="chart-value-inline">
              <span style={{ color: lineColors?.[0] || "rgba(255,255,255,0.95)" }}>
                {fmtNum(value)}
              </span>
              <span className="chart-value-sep">/</span>
              <span style={{ color: lineColors?.[1] || "rgba(255,255,255,0.62)" }}>
                {fmtNum(valueSecondary)}
              </span>
              {unit ? ` ${unit}` : ""}
            </div>
          ) : valuesWithSlash ? (
            <div className="chart-value">
              {fmtNum(value)} {unit}
            </div>
          ) : (
            <div className="chart-value">
              {valueLabel ? `${valueLabel} ` : ""}{fmtNum(value)} {unit}
            </div>
          )}
          {!valuesWithSlash && valueSecondary != null && (
            <div className="chart-value subtle">
              {valueSecondaryLabel ? `${valueSecondaryLabel} ` : ""}{fmtNum(valueSecondary)} {unit}
            </div>
          )}
        </div>
      </div>
      <div className="chart-plot">
        <svg className="chart-svg" width={width} height={CHART_H} viewBox={`0 0 ${width} ${CHART_H}`}>
          <line x1="0" y1={CHART_H - 1} x2={width} y2={CHART_H - 1} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <line x1="0" y1={CHART_H / 2} x2={width} y2={CHART_H / 2} stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="2 3" />
          <line x1="0" y1="1" x2={width} y2="1" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          {baselinePolys.map((poly) => (
            <polygon key={poly.key} points={poly.points} fill="rgba(255,255,255,0.12)" />
          ))}
          {normalized.map((series, idx) => {
            const d = toPath(series, min, max, width, CHART_H, pad);
            if (!d) return null;
            return (
              <path
                key={idx}
                d={d}
                fill="none"
                stroke={lineColors[idx] || "rgba(255,255,255,0.9)"}
                strokeWidth={idx === 0 ? "1.8" : "1.4"}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}
        </svg>
        <div className="y-axis">
          <span>{fmtTick(max, unit)}</span>
          <span>{fmtTick(mid, unit)}</span>
          <span>{fmtTick(min, unit)}</span>
        </div>
      </div>
      {legend && legend.length > 0 && (
        <div className="legend">
          {legend.map((item, idx) => (
            <span key={idx}>
              <span className="legend-line" style={{ background: item.color }} />
              {item.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function DualAxisChartCard({
  cardClassName,
  title,
  rightValue,
  rightUnit,
  leftValue,
  leftUnit,
  rightSeries,
  leftSeries,
  rightLabel,
  leftLabel,
  leftBarGoal,
}) {
  const width = CHART_W;
  const pad = { top: 6, bottom: 6, left: 4, right: 4 };
  const right = Array.isArray(rightSeries) ? rightSeries.map(numericOrNull) : [];
  const left = Array.isArray(leftSeries) ? leftSeries.map(numericOrNull) : [];
  const rightRange = minMaxAcross([right]);
  const leftMaxRaw = Math.max(0, ...left.filter((v) => v != null));
  const leftMaxHours = Math.max(1, Math.ceil(leftMaxRaw));
  const leftRange = { min: 0, max: leftMaxHours };
  const desiredLeftTickCount = 5;
  const leftHourStep = Math.max(1, Math.ceil(leftMaxHours / Math.max(1, desiredLeftTickCount - 1)));
  const leftTicks = [];
  for (let t = 0; t <= leftMaxHours; t += leftHourStep) {
    leftTicks.push(t);
  }
  if (leftTicks[leftTicks.length - 1] !== leftMaxHours) {
    leftTicks.push(leftMaxHours);
  }
  const rightMid = (rightRange.min + rightRange.max) / 2;
  const innerW = width - pad.left - pad.right;
  const barSlotW = innerW / Math.max(1, left.length);
  const barW = Math.max(2, Math.min(7.5, barSlotW * 0.72));

  return (
    <div className={`chart-card${cardClassName ? ` ${cardClassName}` : ""}`}>
      <div className="chart-header">
        <div className="chart-title">{title}</div>
        <div className="chart-values">
          <div className="chart-value-inline">
            {typeof rightValue === "number" && Number.isFinite(rightValue) && (
              <span style={{ color: "rgba(255,255,255,0.7)" }}>
                {fmtNum(rightValue)}{rightUnit ? ` ${rightUnit}` : ""}
              </span>
            )}
            {typeof rightValue === "number" && Number.isFinite(rightValue) &&
              typeof leftValue === "number" && Number.isFinite(leftValue) && (
                <span className="chart-value-sep">/</span>
            )}
            {typeof leftValue === "number" && Number.isFinite(leftValue) && (
              <span style={{ color: "rgba(255,255,255,0.4)" }}>
                {fmtNum(leftValue)}{leftUnit ? ` ${leftUnit}` : ""}
              </span>
            )}
            {!(typeof rightValue === "number" && Number.isFinite(rightValue)) &&
              !(typeof leftValue === "number" && Number.isFinite(leftValue)) && (
                <span style={{ color: "rgba(255,255,255,0.5)" }}>—</span>
            )}
          </div>
        </div>
      </div>
      <div className="chart-plot dual">
        <div className="y-axis left">
          {leftTicks.slice().reverse().map((tick) => (
            <span key={tick}>{tick}h</span>
          ))}
        </div>
        <svg className="chart-svg" style={{ width: `${width}px` }} width={width} height={CHART_H} viewBox={`0 0 ${width} ${CHART_H}`}>
          <line x1="0" y1={CHART_H - 1} x2={width} y2={CHART_H - 1} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <line x1="0" y1={CHART_H / 2} x2={width} y2={CHART_H / 2} stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="2 3" />
          <line x1="0" y1="1" x2={width} y2="1" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          {Array.from({ length: left.length }).map((_, i) => {
            const val = left[i];
            if (val == null) return null;
            const reachedGoal = typeof leftBarGoal === "number" && Number.isFinite(leftBarGoal) && val >= leftBarGoal;
            const xCenter = pad.left + (i + 0.5) * barSlotW;
            const yTop = toY(val, leftRange.min, leftRange.max, CHART_H, pad);
            const h = Math.max(1, CHART_H - pad.bottom - yTop);
            return (
              <g key={i}>
                <rect
                  x={(xCenter - barW / 2).toFixed(1)}
                  y={yTop.toFixed(1)}
                  width={barW.toFixed(1)}
                  height={h.toFixed(1)}
                  rx="1.2"
                  ry="1.2"
                  fill={reachedGoal ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.26)"}
                  stroke={reachedGoal ? "rgba(255,255,255,0.38)" : "none"}
                  strokeWidth={reachedGoal ? "0.45" : "0"}
                />
              </g>
            );
          })}
          <path
            d={toPath(right, rightRange.min, rightRange.max, width, CHART_H, pad)}
            fill="none"
            stroke="rgba(255,255,255,0.95)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="y-axis">
          <span>{fmtTick(rightRange.max, rightUnit)}</span>
          <span>{fmtTick(rightMid, rightUnit)}</span>
          <span>{fmtTick(rightRange.min, rightUnit)}</span>
        </div>
      </div>
    </div>
  );
}

function BodyBatteryChart({ highSeries, lowSeries, cardClassName, iconFilled }) {
  const width = CHART_W;
  const pad = { top: 6, bottom: 6, left: 6, right: 6 };
  const highs = Array.isArray(highSeries) ? highSeries.map(numericOrNull) : [];
  const lows = Array.isArray(lowSeries) ? lowSeries.map(numericOrNull) : [];
  const n = Math.max(highs.length, lows.length);
  const max = 100;
  const min = 0;
  const innerW = width - pad.left - pad.right;
  const latestHigh = latestValue(highs);
  const latestLow = latestValue(lows);

  return (
    <div className={`chart-card${cardClassName ? ` ${cardClassName}` : ""}`}>
      <div className="chart-header">
        <div className="chart-title">
          <TitleWithIcon icon={<IconBattery filled={iconFilled} />}>Body Battery · Daily High / Daily Low</TitleWithIcon>
        </div>
        <div className="chart-values">
          <div className="chart-value-inline">
            <span style={{ color: "rgba(255,255,255,0.95)" }}>{fmtNum(latestHigh)}</span>
            <span className="chart-value-sep">/</span>
            <span style={{ color: "rgba(255,255,255,0.9)" }}>{fmtNum(latestLow)}</span>
          </div>
        </div>
      </div>
      <div className="chart-plot">
        <svg className="chart-svg" width={width} height={CHART_H} viewBox={`0 0 ${width} ${CHART_H}`}>
          {[0, 25, 50, 75, 100].map((t) => {
            const y = toY(t, min, max, CHART_H, pad);
            return (
              <line
                key={t}
                x1="0"
                y1={y}
                x2={width}
                y2={y}
                stroke={t === 0 ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.06)"}
                strokeWidth="1"
              />
            );
          })}
          {Array.from({ length: n }).map((_, i) => {
            const hi = highs[i];
            const lo = lows[i];
            if (hi == null || lo == null) return null;
            const x = pad.left + (i / Math.max(1, n - 1)) * innerW;
            const yHi = toY(hi, min, max, CHART_H, pad);
            const yLo = toY(lo, min, max, CHART_H, pad);
            return (
              <g key={i}>
                <line x1={x} y1={yHi} x2={x} y2={yLo} stroke="rgba(255,255,255,0.28)" strokeWidth="1.2" />
                <circle cx={x} cy={yHi} r="2.7" fill="rgba(255,255,255,0.95)" />
                <rect x={(x - 2.4).toFixed(1)} y={(yLo - 2.4).toFixed(1)} width="4.8" height="4.8" fill="rgba(255,255,255,0.9)" />
              </g>
            );
          })}
        </svg>
        <div className="y-axis bb">
          <span>100</span>
          <span>75</span>
          <span>50</span>
          <span>25</span>
          <span>0</span>
        </div>
      </div>
    </div>
  );
}

function StepsChart({ stepsSeries, goalSeries, cardClassName, iconFilled }) {
  const width = CHART_W;
  const pad = { top: 6, bottom: 6, left: 6, right: 6 };
  const steps = Array.isArray(stepsSeries) ? stepsSeries.map(numericOrNull) : [];
  const goals = Array.isArray(goalSeries) ? goalSeries.map(numericOrNull) : [];
  const n = Math.max(steps.length, goals.length);
  if (!n) return null;

  const availableGoals = goals.filter((v) => v != null);
  const fallbackGoal = availableGoals.length ? availableGoals[availableGoals.length - 1] : null;
  const maxStep = Math.max(0, ...steps.filter((v) => v != null));
  const maxGoal = Math.max(0, ...availableGoals);
  const max = Math.max(1000, maxStep, maxGoal);
  const min = 0;
  const stepGuide = 5000;
  const guideMax = Math.ceil(max / stepGuide) * stepGuide;
  const innerW = width - pad.left - pad.right;
  const slotW = innerW / Math.max(1, n);
  const barW = Math.max(2, Math.min(7.5, slotW * 0.72));
  const latestSteps = latestValue(steps);
  const latestGoal = latestValue(goals) ?? fallbackGoal;
  const latestReached = latestSteps != null && latestGoal != null && latestSteps >= latestGoal;
  const goalY = latestGoal != null ? toY(latestGoal, min, guideMax, CHART_H, pad) : null;
  const fmtK = (v) => {
    if (typeof v !== "number" || !Number.isFinite(v)) return "n/a";
    const inK = v / 1000;
    return `${inK >= 10 ? inK.toFixed(0) : inK.toFixed(1)}k`;
  };

  return (
    <div className={`chart-card${cardClassName ? ` ${cardClassName}` : ""}`}>
      <div className="chart-header">
        <div className="chart-title">
          <TitleWithIcon icon={<IconSteps filled={iconFilled} />}>Steps · Daily</TitleWithIcon>
        </div>
        <div className="chart-values">
          <div className="chart-value-inline">
            <span style={{ color: latestReached ? "rgba(255,255,255,0.98)" : "rgba(255,255,255,0.88)", fontWeight: latestReached ? 600 : 400 }}>
              {fmtNum(latestSteps)}
            </span>
            <span className="chart-value-sep">/</span>
            <span style={{ color: "rgba(255,255,255,0.62)" }}>{fmtNum(latestGoal)}</span>
          </div>
        </div>
      </div>
      <div className="chart-plot">
        <svg className="chart-svg" width={width} height={CHART_H} viewBox={`0 0 ${width} ${CHART_H}`}>
          {Array.from({ length: Math.max(1, guideMax / stepGuide) + 1 }).map((_, idx) => {
            const val = idx * stepGuide;
            const y = toY(val, min, guideMax, CHART_H, pad);
            return (
              <line
                key={val}
                x1="0"
                y1={y}
                x2={width}
                y2={y}
                stroke={val === 0 ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.05)"}
                strokeWidth={val === 0 ? "1" : "0.45"}
              />
            );
          })}
          {goalY != null && (
            <line
              x1={pad.left}
              y1={goalY}
              x2={width - pad.right}
              y2={goalY}
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          )}
          {Array.from({ length: n }).map((_, i) => {
            const stepVal = steps[i];
            if (stepVal == null) return null;
            const goalVal = goals[i] ?? fallbackGoal;
            const reached = goalVal != null && stepVal >= goalVal;
            const xCenter = pad.left + (i + 0.5) * slotW;
            const yTop = toY(stepVal, min, guideMax, CHART_H, pad);
            const h = Math.max(1.5, CHART_H - pad.bottom - yTop);
            return (
              <rect
                key={i}
                x={(xCenter - barW / 2).toFixed(1)}
                y={yTop.toFixed(1)}
                width={barW.toFixed(1)}
                height={h.toFixed(1)}
                rx={reached ? "1.8" : "1.2"}
                ry={reached ? "1.8" : "1.2"}
                fill={reached ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.26)"}
                stroke={reached ? "rgba(255,255,255,0.38)" : "none"}
                strokeWidth={reached ? "0.45" : "0"}
              />
            );
          })}
        </svg>
        <div className="y-axis">
          <span>{fmtK(guideMax)}</span>
          <span>{fmtK(guideMax / 2)}</span>
          <span>0</span>
        </div>
      </div>
    </div>
  );
}

function ActiveCaloriesChart({ activeCaloriesSeries, iconFilled }) {
  const width = CHART_W;
  const pad = { top: 6, bottom: 6, left: 6, right: 6 };
  const goalCalories = 500;
  const calories = Array.isArray(activeCaloriesSeries) ? activeCaloriesSeries.map(numericOrNull) : [];
  const n = calories.length;
  if (!n) return null;

  const maxVal = Math.max(0, ...calories.filter((v) => v != null));
  const guideStep = maxVal > 1200 ? 500 : maxVal > 600 ? 250 : 100;
  const guideMax = Math.max(guideStep, Math.ceil(maxVal / guideStep) * guideStep);
  const innerW = width - pad.left - pad.right;
  const slotW = innerW / Math.max(1, n);
  const barW = Math.max(2, Math.min(7.5, slotW * 0.72));
  const latestCalories = latestValue(calories);
  const avgCalories = calories.filter((v) => v != null).reduce((sum, v) => sum + v, 0) / Math.max(1, calories.filter((v) => v != null).length);
  const fmtKcal = (v) => `${Math.round(v)}kcal`;

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div className="chart-title">
          <TitleWithIcon icon={<IconCalories filled={iconFilled} />}>Active Calories · Latest / Daily Avg</TitleWithIcon>
        </div>
        <div className="chart-values">
          <div className="chart-value-inline">
            <span style={{ color: "rgba(255,255,255,0.9)" }}>{fmtNum(latestCalories)}</span>
            <span className="chart-value-sep">/</span>
            <span style={{ color: "rgba(255,255,255,0.55)" }}>{fmtNum(avgCalories)}</span>
            <span style={{ color: "rgba(255,255,255,0.55)" }}> kcal</span>
          </div>
        </div>
      </div>
      <div className="chart-plot">
        <svg className="chart-svg" width={width} height={CHART_H} viewBox={`0 0 ${width} ${CHART_H}`}>
          {Array.from({ length: Math.max(1, Math.round(guideMax / guideStep)) + 1 }).map((_, idx) => {
            const val = idx * guideStep;
            const y = toY(val, 0, guideMax, CHART_H, pad);
            return (
              <line
                key={val}
                x1="0"
                y1={y}
                x2={width}
                y2={y}
                stroke={val === 0 ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.05)"}
                strokeWidth={val === 0 ? "1" : "0.45"}
              />
            );
          })}
          {goalCalories > 0 && goalCalories <= guideMax && (
            <line
              x1={pad.left}
              y1={toY(goalCalories, 0, guideMax, CHART_H, pad)}
              x2={width - pad.right}
              y2={toY(goalCalories, 0, guideMax, CHART_H, pad)}
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          )}
          {Array.from({ length: n }).map((_, i) => {
            const v = calories[i];
            if (v == null) return null;
            const reachedGoal = v >= goalCalories;
            const xCenter = pad.left + (i + 0.5) * slotW;
            const yTop = toY(v, 0, guideMax, CHART_H, pad);
            const h = Math.max(1.5, CHART_H - pad.bottom - yTop);
            return (
              <rect
                key={i}
                x={(xCenter - barW / 2).toFixed(1)}
                y={yTop.toFixed(1)}
                width={barW.toFixed(1)}
                height={h.toFixed(1)}
                rx={reachedGoal ? "1.8" : "1.2"}
                ry={reachedGoal ? "1.8" : "1.2"}
                fill={reachedGoal ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.26)"}
                stroke={reachedGoal ? "rgba(255,255,255,0.38)" : "none"}
                strokeWidth={reachedGoal ? "0.45" : "0"}
              />
            );
          })}
        </svg>
        <div className="y-axis">
          <span>{fmtKcal(guideMax)}</span>
          <span>{fmtKcal(guideMax / 2)}</span>
          <span>0</span>
        </div>
      </div>
    </div>
  );
}

function SleepStagesChart({ stages, sleepScore, iconFilled }) {
  if (!stages || !Array.isArray(stages.segments) || stages.segments.length === 0) {
    return null;
  }

  const width = STAGES_W;
  const height = STAGES_H;
  const leftPad = 8;
  const rightPad = 20;
  const topPad = 6;
  const bottomPad = 18;
  const plotW = width - leftPad - rightPad;
  const plotH = height - topPad - bottomPad;
  const hrPlotH = 23;
  const panelGap = 0;
  const stagesTop = topPad + hrPlotH + panelGap;
  const stagesPlotH = Math.max(24, plotH - hrPlotH - panelGap);
  const rowH = stagesPlotH / 4;
  const total = Math.max(1, stages.total_minutes || 1);

  const stageLevel = { deep: 1, light: 2, rem: 3, awake: 4 };
  const stageTone = "rgba(255,255,255,0.6)";
  const connectorTone = "rgba(255,255,255,0.4)";
  const stageColor = {
    deep: stageTone,
    light: stageTone,
    rem: stageTone,
    awake: stageTone,
  };
  const bandH = Math.max(6, rowH * 0.74);
  const linkW = 1.7;
  const rightAxisX = width - 8;
  const durationHours = typeof stages.total_minutes === "number" && Number.isFinite(stages.total_minutes)
    ? stages.total_minutes / 60
    : null;
  const durationLabel = durationHours != null
    ? `${durationHours >= 10 ? durationHours.toFixed(0) : durationHours.toFixed(1)}h`
    : null;
  const hrPoints = Array.isArray(stages.heart_rate_points)
    ? stages.heart_rate_points
        .map((p) => ({
          minute: typeof p?.minute === "number" && Number.isFinite(p.minute) ? p.minute : null,
          bpm: typeof p?.bpm === "number" && Number.isFinite(p.bpm) ? p.bpm : null,
        }))
        .filter((p) => p.minute != null && p.bpm != null)
    : [];
  const hrValues = hrPoints.map((p) => p.bpm);
  const hasHr = hrValues.length > 1;
  const hrAvg = hrValues.length ? hrValues.reduce((sum, v) => sum + v, 0) / hrValues.length : null;
  let hrMin = 0;
  let hrMax = 1;
  if (hrValues.length) {
    hrMin = Math.min(...hrValues);
    hrMax = Math.max(...hrValues);
    if (hrMin === hrMax) {
      hrMin -= 1;
      hrMax += 1;
    }
    const pad = Math.max(1, (hrMax - hrMin) * 0.08);
    hrMin = Math.max(20, hrMin - pad);
    hrMax = Math.min(220, hrMax + pad);
  }
  const hrY = (bpm) => topPad + hrPlotH - ((bpm - hrMin) / Math.max(1, hrMax - hrMin)) * hrPlotH;
  const hrPath = hasHr
    ? hrPoints
        .map((p, idx) => {
          const x = leftPad + (p.minute / total) * plotW;
          const y = hrY(p.bpm);
          return `${idx === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
        })
        .join(" ")
    : "";

  const yCenterForLevel = (level) => stagesTop + (4 - level) * rowH + rowH / 2;
  const parseHm = (hm) => {
    if (typeof hm !== "string") return null;
    const m = hm.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    const h = Number(m[1]);
    const mins = Number(m[2]);
    if (!Number.isInteger(h) || !Number.isInteger(mins) || h < 0 || h > 23 || mins < 0 || mins > 59) return null;
    return h * 60 + mins;
  };
  const fmtHourLabel = (totalMins) => {
    const normalized = ((Math.round(totalMins) % (24 * 60)) + 24 * 60) % (24 * 60);
    const h24 = Math.floor(normalized / 60);
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    const suffix = h24 < 12 ? "am" : "pm";
    return `${h12}${suffix}`;
  };
  const startMinOfDay = parseHm(stages.start_local);
  const startMinute = startMinOfDay != null ? startMinOfDay : 0;
  const endMinute = startMinute + total;
  const majorTickOffsets = [];
  if (startMinOfDay != null) {
    const firstHourMark = Math.ceil(startMinute / 60) * 60;
    for (let t = firstHourMark; t <= endMinute; t += 60) {
      majorTickOffsets.push(t - startMinute);
    }
  } else {
    for (let t = 0; t <= total; t += 60) {
      majorTickOffsets.push(t);
    }
  }
  if (!majorTickOffsets.length) {
    majorTickOffsets.push(0);
  }
  const majorTickSet = new Set(majorTickOffsets.map((v) => Math.round(v)));
  const minorTickOffsets = [];
  for (let t = 0; t <= total; t += 15) {
    if (!majorTickSet.has(Math.round(t))) minorTickOffsets.push(t);
  }

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div className="chart-title">
          <TitleWithIcon icon={<IconStages filled={iconFilled} />}>
            Sleep Stages
            {(stages.start_local || stages.end_local)
              ? ` · ${durationLabel || "—"}`
              : (stages.date ? ` · ${stages.date}` : "")}
          </TitleWithIcon>
        </div>
        <div className="chart-values">
          <div className="chart-value">{fmtNum(sleepScore)}</div>
        </div>
      </div>
      <svg className="chart-svg" style={{ width: `${width}px`, height: `${height}px` }} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {hasHr && (
          <g>
            <line
              x1={leftPad}
              y1={topPad}
              x2={width - rightPad}
              y2={topPad}
              stroke="rgba(255,255,255,0.14)"
              strokeWidth="1"
            />
            <line
              x1={leftPad}
              y1={topPad + hrPlotH / 2}
              x2={width - rightPad}
              y2={topPad + hrPlotH / 2}
              stroke="rgba(255,255,255,0.10)"
              strokeWidth="1"
              strokeDasharray="2 3"
            />
            <line
              x1={leftPad}
              y1={topPad + hrPlotH}
              x2={width - rightPad}
              y2={topPad + hrPlotH}
              stroke="rgba(255,255,255,0.16)"
              strokeWidth="1"
            />
            {hrAvg != null && (
              <line
                x1={leftPad}
                y1={hrY(hrAvg)}
                x2={width - rightPad}
                y2={hrY(hrAvg)}
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="0.45"
              />
            )}
            {hrAvg != null && (
              <text x={width - 2} y={hrY(hrAvg)} textAnchor="end" fontSize="8" fill="rgba(255,255,255,0.62)">
                {Math.round(hrAvg)}
              </text>
            )}
          </g>
        )}
        {[0, 1, 2, 3].map((idx) => {
          const y = stagesTop + idx * rowH;
          return (
            <g key={idx}>
              <line x1={leftPad} y1={y} x2={width - rightPad} y2={y} stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
            </g>
          );
        })}
        {[
          { label: "Awk.", level: 4 },
          { label: "REM", level: 3 },
          { label: "Core", level: 2 },
          { label: "Deep", level: 1 },
        ].map((row) => (
          <text
            key={row.label}
            x={rightAxisX}
            y={yCenterForLevel(row.level)}
            textAnchor="middle"
            fontSize="8"
            letterSpacing="0.3"
            fill="rgba(255,255,255,0.66)"
            transform={`rotate(-90 ${rightAxisX} ${yCenterForLevel(row.level)})`}
          >
            {row.label}
          </text>
        ))}
        {stages.segments.slice(0, -1).map((seg, idx) => {
          const next = stages.segments[idx + 1];
          const level = stageLevel[seg.stage];
          const nextLevel = stageLevel[next.stage];
          if (!level || !nextLevel) return null;
          const x = leftPad + (seg.end / total) * plotW - linkW / 2;
          const y1 = yCenterForLevel(level);
          const y2 = yCenterForLevel(nextLevel);
          const y = Math.min(y1, y2) - bandH / 2;
          const h = Math.max(bandH, Math.abs(y2 - y1) + bandH);
          return (
            <rect
              key={`link-${idx}`}
              x={x}
              y={y}
              width={linkW}
              height={h}
              rx="0"
              ry="0"
              fill={connectorTone}
            />
          );
        })}
        {stages.segments.map((seg, idx) => {
          const level = stageLevel[seg.stage];
          if (!level) return null;
          const x = leftPad + (seg.start / total) * plotW;
          const x2 = leftPad + (seg.end / total) * plotW;
          const w = Math.max(2, x2 - x);
          const yCenter = yCenterForLevel(level);
          const y = yCenter - bandH / 2;
          return (
            <rect
              key={idx}
              x={x}
              y={y}
              width={w}
              height={bandH}
              rx="0"
              ry="0"
              fill={stageColor[seg.stage]}
            />
          );
        })}
        <line
          x1={leftPad}
          y1={stagesTop + stagesPlotH}
          x2={width - rightPad}
          y2={stagesTop + stagesPlotH}
          stroke="rgba(255,255,255,0.22)"
          strokeWidth="1"
        />
        {hasHr && (
          <path
            d={hrPath}
            fill="none"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        <line
          x1={leftPad}
          y1={height - bottomPad}
          x2={width - rightPad}
          y2={height - bottomPad}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="1"
        />
        {minorTickOffsets.map((offset, idx) => {
          const x = leftPad + (offset / total) * plotW;
          return (
            <line
              key={`time-minor-${idx}`}
              x1={x}
              y1={height - bottomPad}
              x2={x}
              y2={height - bottomPad + 2}
              stroke="rgba(255,255,255,0.22)"
              strokeWidth="1"
            />
          );
        })}
        {majorTickOffsets.map((offset, idx) => {
          const x = leftPad + (offset / total) * plotW;
          const labelMinute = startMinute + offset;
          return (
            <g key={`time-major-${idx}`}>
              <line
                x1={x}
                y1={height - bottomPad}
                x2={x}
                y2={height - bottomPad + 4}
                stroke="rgba(255,255,255,0.45)"
                strokeWidth="1"
              />
              <text
                x={x}
                y={height - 2}
                textAnchor="middle"
                fontSize="8"
                letterSpacing="0.2"
                fill="rgba(255,255,255,0.58)"
              >
                {fmtHourLabel(labelMinute)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function render({ output }) {
  if (!output || output.trim() === "") {
    return <div className="garmin-shell">Loading Garmin data...</div>;
  }

  let data;
  try {
    data = JSON.parse(output);
  } catch (e) {
    return <div className="garmin-shell error">Failed to parse Garmin widget output.</div>;
  }

  if (data.status !== "ok") {
    const hint = data.hint ? `\n${data.hint}` : "";
    return (
      <div className="garmin-shell error">
        Garmin fetch error: {data.message || "Unknown error"}
        {hint}
      </div>
    );
  }

  const hrvStatus = formatHrvStatus(latestString(data.series?.hrv_status));
  const hrvTitleText = hrvStatus
    ? `HRV · ${hrvStatus} · Weekly Avg / Night Avg`
    : "HRV · Weekly Avg / Night Avg";
  const sleepStagesDate = data.latest_sleep_stages?.date;
  const fromDate = typeof data.from === "string" ? data.from : null;
  const fetchedAtLabel = typeof data.cache?.fetched_at_local === "string" ? data.cache.fetched_at_local : null;
  const cacheStateSuffix = data.cache?.is_fresh === false ? " · stale" : "";
  let sleepStagesScore = latestValue(data.series?.sleep_score);
  if (sleepStagesDate && fromDate && Array.isArray(data.series?.sleep_score)) {
    const fromTs = Date.parse(`${fromDate}T00:00:00`);
    const stageTs = Date.parse(`${sleepStagesDate}T00:00:00`);
    if (Number.isFinite(fromTs) && Number.isFinite(stageTs)) {
      const dayIdx = Math.round((stageTs - fromTs) / (24 * 60 * 60 * 1000));
      if (dayIdx >= 0 && dayIdx < data.series.sleep_score.length) {
        const exactScore = data.series.sleep_score[dayIdx];
        if (typeof exactScore === "number" && Number.isFinite(exactScore)) {
          sleepStagesScore = exactScore;
        }
      }
    }
  }
  const hrvIconFilled = isLatestSeriesPointTodayAcross(
    [data.series?.hrv_weekly_avg, data.series?.hrv_night_avg],
    fromDate
  );
  const sleepScoreIconFilled = isLatestSeriesPointTodayAcross(
    [data.series?.sleep_score, data.series?.sleep_duration_hours],
    fromDate
  );
  const sleepStagesIconFilled = isYmdToday(sleepStagesDate);
  const heartRateIconFilled = isLatestSeriesPointTodayAcross(
    [data.series?.avg_high_hr, data.series?.resting_hr],
    fromDate
  );
  const stressIconFilled = isLatestSeriesPointToday(data.series?.stress, fromDate);
  const bodyBatteryIconFilled = isLatestSeriesPointTodayAcross(
    [data.series?.body_battery_high, data.series?.body_battery_low],
    fromDate
  );
  const stepsIconFilled = isLatestSeriesPointToday(data.series?.steps, fromDate);
  const activeCaloriesIconFilled = isLatestSeriesPointToday(data.series?.active_calories, fromDate);

  return (
    <div className="garmin-shell">
      <div className="title">
        <span className="title-main">Garmin · Last 30 Days</span>
        {fetchedAtLabel && (
          <span className="title-date">
            {fetchedAtLabel}{cacheStateSuffix}
          </span>
        )}
      </div>
      
 
      <div className="charts">
        <ChartCard
          cardClassName="hrv-card"
          plotPad={{ top: 6, bottom: 6, left: 4, right: 0 }}
          title={<TitleWithIcon icon={<IconHrv filled={hrvIconFilled} />}>{hrvTitleText}</TitleWithIcon>}
          value={latestValue(data.series?.hrv_weekly_avg)}
          valueSecondary={latestValue(data.series?.hrv_night_avg)}
          unit="ms"
          valuesWithSlash={true}
          seriesList={[data.series?.hrv_weekly_avg || [], data.series?.hrv_night_avg || []]}
          lineColors={["rgba(255,255,255,0.9)", "rgba(255,255,255,0.55)"]}
          baselineLowSeries={data.series?.hrv_baseline_low || []}
          baselineHighSeries={data.series?.hrv_baseline_high || []}
          legend={[
            { label: "Baseline range", color: "rgba(255,255,255,0.45)" },
          ]}
        />
        <DualAxisChartCard
          cardClassName="sleep-score-tight"
          title={<TitleWithIcon icon={<IconSleep filled={sleepScoreIconFilled} />}>Sleep Score</TitleWithIcon>}
          rightValue={latestValue(data.series?.sleep_score)}
          rightUnit=""
          leftValue={latestValue(data.series?.sleep_duration_hours)}
          leftUnit="h"
          rightSeries={data.series?.sleep_score || []}
          leftSeries={data.series?.sleep_duration_hours || []}
          rightLabel="Sleep Score"
          leftLabel="Duration"
          leftBarGoal={8}
        />
        <SleepStagesChart
          stages={data.latest_sleep_stages}
          sleepScore={sleepStagesScore}
          iconFilled={sleepStagesIconFilled}
        />
        <ChartCard
          title={<TitleWithIcon icon={<IconHeart filled={heartRateIconFilled} />}>Heart Rate · Avg High / Resting</TitleWithIcon>}
          cardClassName="tight-axis"
          value={latestValue(data.series?.avg_high_hr)}
          valueSecondary={latestValue(data.series?.resting_hr)}
          unit="bpm"
          valuesWithSlash={true}
          seriesList={[data.series?.avg_high_hr || [], data.series?.resting_hr || []]}
          lineColors={["rgba(255,255,255,0.96)", "rgba(255,255,255,0.55)"]}
        />
        <ChartCard
          title={<TitleWithIcon icon={<IconStress filled={stressIconFilled} />}>Stress · Daily Avg</TitleWithIcon>}
          cardClassName="tight-axis"
          value={latestValue(data.series?.stress)}
          unit=""
          seriesList={[data.series?.stress || []]}
          lineColors={["rgba(255,255,255,0.9)"]}
        />
        <BodyBatteryChart
          cardClassName="tight-axis"
          highSeries={data.series?.body_battery_high || []}
          lowSeries={data.series?.body_battery_low || []}
          iconFilled={bodyBatteryIconFilled}
        />
        <StepsChart
          cardClassName="tight-axis"
          stepsSeries={data.series?.steps || []}
          goalSeries={data.series?.steps_goal || []}
          iconFilled={stepsIconFilled}
        />
        <ActiveCaloriesChart
          activeCaloriesSeries={data.series?.active_calories || []}
          iconFilled={activeCaloriesIconFilled}
        />
      </div>
    </div>
  );
}
