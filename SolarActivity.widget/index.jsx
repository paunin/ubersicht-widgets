export const command = "python3 SolarActivity.widget/fetch-solar.py";

export const refreshFrequency = 1800000; // 30 min

const WIDTH = 268;
const CHART_W = 258;
const CHART_H = 86;

function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num));
}

function toNum(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function fmt1(value) {
  const n = toNum(value);
  if (n === null) return "—";
  return n.toFixed(1);
}

function dayLabel(isoDay) {
  if (!isoDay || typeof isoDay !== "string") return "";
  const [y, m, d] = isoDay.split("-");
  if (!y || !m || !d) return isoDay;
  return `${m}/${d}`;
}

function TimelineChart({ points, nowIndex, nowValue, statusLabel }) {
  const clean = (points || []).filter((p) => Number.isFinite(p.value));
  const min = 0;
  const max = 10;
  const span = 10;

  const dotX = (idx) => {
    if (clean.length <= 1) return 6;
    return 6 + (idx / (clean.length - 1)) * (CHART_W - 12);
  };
  const dotY = (val) => {
    const clampedVal = clamp(val, min, max);
    const ratio = (clampedVal - min) / span;
    return 6 + (1 - ratio) * (CHART_H - 12);
  };

  const d = clean
    .map((p, i) => `${i === 0 ? "M" : "L"} ${dotX(i).toFixed(2)} ${dotY(p.value).toFixed(2)}`)
    .join(" ");

  const safeNowIndex = clean.length ? Math.max(0, Math.min(nowIndex, clean.length - 1)) : -1;
  const nowX = safeNowIndex >= 0 ? dotX(safeNowIndex) : 0;
  const nowY = safeNowIndex >= 0 ? dotY(clean[safeNowIndex].value) : 0;
  const nowLabel = fmt1(nowValue);
  const nowLabelX = Math.min(CHART_W - 28, nowX + 7);
  const sunX = CHART_W - 12;
  const sunY = 12;

  return (
    <div className="timeline-wrap">
      <svg className="timeline-svg" width={CHART_W} height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
        <text x="8" y="14" textAnchor="start" fontSize="11" fontWeight="400" fill="rgba(255,255,255,0.96)">
          {statusLabel || "Status —"}
        </text>
        <g>
          <circle cx={sunX} cy={sunY} r="3.1" fill="rgba(255,255,255,0.94)" />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
            const a = (i / 8) * Math.PI * 2;
            const x1 = sunX + Math.cos(a) * 4.7;
            const y1 = sunY + Math.sin(a) * 4.7;
            const x2 = sunX + Math.cos(a) * 7.2;
            const y2 = sunY + Math.sin(a) * 7.2;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="rgba(255,255,255,0.86)"
                strokeWidth="0.9"
                strokeLinecap="round"
              />
            );
          })}
        </g>
        <line x1="0" y1={CHART_H - 1} x2={CHART_W} y2={CHART_H - 1} stroke="rgba(255,255,255,0.2)" />
        {clean.length > 1 ? <path d={d} fill="none" stroke="rgba(255,255,255,0.92)" strokeWidth="2" /> : null}
        {safeNowIndex >= 0 ? (
          <g>
            <line x1={nowX} y1="0" x2={nowX} y2={CHART_H} stroke="rgba(255,255,255,0.85)" strokeWidth="0.7" />
            <rect x={Math.max(2, nowLabelX - 4)} y="1" width="26" height="15" rx="3" fill="rgba(0,0,0,0.55)" />
            <text x={nowLabelX} y="12" textAnchor="start" fontSize="11" fontWeight="600" fill="rgba(255,255,255,0.98)">{nowLabel}</text>
            <circle cx={nowX} cy={nowY} r="3.2" fill="rgba(255,255,255,0.98)" />
          </g>
        ) : null}
        {clean.map((p, i) => (
          <circle key={i} cx={dotX(i)} cy={dotY(p.value)} r="1.8" fill="rgba(255,255,255,0.85)" />
        ))}
      </svg>
      <div className="timeline-foot">
        <span>{clean[0] ? clean[0].label : "—"}</span>
        <span>{clean[clean.length - 1] ? clean[clean.length - 1].label : "—"}</span>
      </div>
    </div>
  );
}

export const className = `
  position: fixed;
  right: 940px;
  bottom: 800px;
  width: ${WIDTH}px;
  margin: 0;
  padding: 0;
  background: transparent;
  pointer-events: none;
  user-select: none;
  z-index: 9999;

  .solar-shell {
    padding: 0;
    background: transparent;
    border: none;
    box-shadow: none;
    color: rgba(255, 255, 255, 0.88);
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  }

  .solar-shell.error {
    white-space: pre-wrap;
    line-height: 1.4;
    color: rgba(255, 170, 170, 0.95);
  }

  .timeline-wrap {
    width: ${CHART_W}px;
  }

  .timeline-svg {
    display: block;
    width: 100%;
    height: ${CHART_H}px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 4px;
  }

  .timeline-foot {
    display: flex;
    justify-content: space-between;
    font-size: 8px;
    color: rgba(255, 255, 255, 0.52);
    margin-top: 4px;
    letter-spacing: 0.3px;
  }
`;

export function render({ output }) {
  if (!output || output.trim() === "") {
    return <div className="solar-shell">Loading solar activity...</div>;
  }

  let data;
  try {
    data = JSON.parse(output);
  } catch (e) {
    return <div className="solar-shell error">Failed to parse solar widget output.</div>;
  }

  if (data.status !== "ok") {
    const hint = data.hint ? `\n${data.hint}` : "";
    return (
      <div className="solar-shell error">
        Solar fetch error: {data.message || "Unknown error"}
        {hint}
      </div>
    );
  }

  const current = data && data.current ? data.current : {};
  const currentKp = toNum(current.kp);
  const level = current.level || "Unknown";
  const storm = current.storm_scale || "";
  const statusLabel = storm ? `${level} ${storm}` : level;

  const pastPoints = (Array.isArray(data.past7) ? data.past7 : [])
    .map((p) => ({ label: dayLabel(p.date), value: toNum(p.kp) }))
    .filter((p) => p.value !== null);

  const nextPoints = (Array.isArray(data.next7) ? data.next7 : [])
    .map((p) => ({ label: dayLabel(p.date), value: toNum(p.kp_eq) }))
    .filter((p) => p.value !== null);

  const combined = pastPoints.concat(nextPoints);
  const nowIndex = Math.max(0, pastPoints.length - 1);

  return (
    <div className="solar-shell">
      <TimelineChart points={combined} nowIndex={nowIndex} nowValue={currentKp} statusLabel={statusLabel} />
    </div>
  );
}
