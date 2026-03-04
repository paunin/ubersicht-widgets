export const command = "[ -f LifeCounter.widget/config.env ] && . LifeCounter.widget/config.env; echo '{\"birth\":\"'\"${LIFE_BIRTH_DATE:-1988-01-01}\"'\",\"expectancy\":'\"${LIFE_EXPECTANCY:-85}\"'}'";

export const refreshFrequency = 3600000;

const WEEKS = 52;
const CELL = 6;
const GAP = 1;
const STEP = CELL + GAP;
const GRID_W = WEEKS * STEP - GAP;
const LABEL_W = 26;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_PER_WEEK = 7;

function weeksElapsed(birthStr) {
  const [y, m, d] = birthStr.split("-").map(Number);
  if (!y || !m || !d) return 0;

  const birthUtc = Date.UTC(y, m - 1, d);
  const now = new Date();
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  if (todayUtc < birthUtc) return 0;

  let fullYears = now.getFullYear() - y;
  const anniversaryThisYearUtc = Date.UTC(now.getFullYear(), m - 1, d);
  if (todayUtc < anniversaryThisYearUtc) fullYears -= 1;
  fullYears = Math.max(0, fullYears);

  const currentLifeYearStartUtc = Date.UTC(y + fullYears, m - 1, d);
  const daysInCurrentLifeYear = Math.max(0, Math.floor((todayUtc - currentLifeYearStartUtc) / MS_PER_DAY));
  const weeksInCurrentLifeYear = Math.min(WEEKS - 1, Math.floor(daysInCurrentLifeYear / DAYS_PER_WEEK));

  return fullYears * WEEKS + weeksInCurrentLifeYear;
}

export const className = `
  position: fixed;
  right: 2100px;
  bottom: 120px;
  width: ${LABEL_W + GRID_W}px;
  margin: 0;
  padding: 0;
  background: transparent;
  pointer-events: none;
  user-select: none;

  .life-title {
    font-family: "Cinzel", "Trajan Pro", "Palatino Linotype", "Book Antiqua", Palatino, "Times New Roman", serif;
    font-size: 20px;
    font-weight: 600;
    font-variant: small-caps;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.72);
    text-shadow:
      0 1px 2px rgba(0, 0, 0, 0.75),
      0 0 10px rgba(255, 255, 255, 0.12);
    width: ${GRID_W}px;
    margin-left: ${LABEL_W}px;
    text-align: center;
    margin-bottom: 20px;
    line-height: 1;
  }

  .life-pct {
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    font-size: 30px;
    font-weight: 200;
    letter-spacing: -1px;
    color: rgba(255, 255, 255, 0.75);
    text-shadow: 0 1px 10px rgba(0, 0, 0, 0.5);
    width: ${GRID_W}px;
    margin-left: ${LABEL_W}px;
    text-align: center;
    margin-bottom: 12px;
    line-height: 1;
  }

  .life-pct .pct-symbol {
    font-size: 20px;
    font-weight: 300;
    opacity: 0.5;
  }

  .life-grid-area {
    display: flex;
    flex-direction: column;
    gap: ${GAP}px;
  }

  .year-row {
    display: flex;
    align-items: center;
    height: ${CELL}px;
  }

  .year-label {
    width: ${LABEL_W}px;
    flex-shrink: 0;
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    font-size: 8px;
    line-height: 1;
    text-align: right;
    padding-right: 5px;
    color: transparent;
  }

  .year-label.five-year {
    color: rgba(255, 255, 255, 0.50);
    font-weight: 400;
  }

  .year-label.decade {
    color: rgba(255, 255, 255, 0.50);
    font-weight: 600;
    font-size: 9px;
  }

  .week-cells {
    display: flex;
    gap: ${GAP}px;
    width: ${GRID_W}px;
  }

  .wk {
    width: ${CELL}px;
    height: ${CELL}px;
    flex-shrink: 0;
  }

  .wk.lived {
    background: rgba(255, 255, 255, 0.30);
  }

  .wk.current {
    background: rgba(138, 226, 255, 0.35);
    box-shadow: 0 0 4px rgba(138, 226, 255, 0.35);
  }

  .wk.remaining {
    background: rgba(255, 255, 255, 0.09);
  }

  .decade-row .wk.remaining {
    background: rgba(255, 255, 255, 0.12);
  }

  .five-year-row .wk.remaining {
    background: rgba(255, 255, 255, 0.1);
  }

  .life-footer {
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    font-size: 10px;
    font-weight: 300;
    letter-spacing: 0.5px;
    color: rgba(255, 255, 255, 0.35);
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
    margin-top: 8px;
    text-align: center;
  }
`;

export function render({ output }) {
  if (!output || output.trim() === "") return <div />;

  let config;
  try { config = JSON.parse(output); } catch { return <div />; }

  const { birth, expectancy } = config;
  const totalWeeks = expectancy * WEEKS;
  const lived = weeksElapsed(birth);
  const clamped = Math.max(0, Math.min(lived, totalWeeks));
  const pct = ((clamped / totalWeeks) * 100).toFixed(1);

  const rows = [];
  for (let age = expectancy - 1; age >= 0; age--) {
    const isDecade = age % 10 === 0;
    const isFive = age % 5 === 0;

    const cells = [];
    for (let w = 0; w < WEEKS; w++) {
      const idx = age * WEEKS + w;
      let cls = "wk ";
      if (idx < clamped) cls += "lived";
      else if (idx === clamped) cls += "current";
      else cls += "remaining";
      cells.push(<div key={w} className={cls} />);
    }

    const labelCls = "year-label" + (isDecade ? " decade" : isFive ? " five-year" : "");
    const rowCls = "year-row" + (isDecade ? " decade-row" : isFive ? " five-year-row" : "");

    rows.push(
      <div key={age} className={rowCls}>
        <div className={labelCls}>{isFive ? age : ""}</div>
        <div className="week-cells">{cells}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="life-title">- Memento Mori -</div>
      <div className="life-pct">
        {pct}<span className="pct-symbol">%</span>
      </div>
      <div className="life-grid-area">
        {rows}
      </div>
      <div className="life-footer">
        {birth} · {expectancy} years · {clamped.toLocaleString()} weeks lived · {Math.max(0, totalWeeks - clamped).toLocaleString()} remaining
      </div>
    </div>
  );
}
