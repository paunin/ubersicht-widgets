// GeekToolStyle widget - system info in GeekTool style
// Left side, transparent background, Monaco 12

export const command = "GeekToolStyle.widget/geekinfo.sh";

export const refreshFrequency = 5000;

export const className = `
  position: fixed;
  right: 950px;
  bottom: 130px;
  width: 31ch;
  margin: 0;
  padding: 8px 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.92);
  font-family: Monaco, "Menlo", "Ubuntu Mono", monospace;
  font-size: 14px;
  line-height: 1.35;
  text-shadow: 0 0 4px rgba(0,0,0,0.6);
  white-space: pre;
  overflow: hidden;
  pointer-events: none;
  user-select: none;
  opacity: 0.9;

  .geek-widget .bar-row {
    display: flex;
    align-items: baseline;
    gap: 2px;
  }
  .geek-widget .label {
    min-width: 12ch;
  }
  .geek-widget .line {
    margin: 0;
  }
  .geek-widget .section {
    margin-top: 6px;
  }
  .geek-widget .section-title {
    margin-bottom: 2px;
    opacity: 0.9;
  }
  .geek-widget .proc {
    display: flex;
    align-items: baseline;
    width: 100%;
    min-width: 0;
  }
  .geek-widget .proc-cmd {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
    flex: 1 1 0;
  }
  .geek-widget .proc-val {
    flex: 0 0 auto;
    padding-left: 1ch;
    text-align: right;
  }
`;

function bar(pct, width = 10) {
  if (pct === "N/A" || pct == null) return "▫".repeat(width) + "  N/A";
  const n = Math.min(100, Math.max(0, Number(pct)));
  const filled = Math.round((n / 100) * width);
  const empty = width - filled;
  return "▪".repeat(filled) + "▫".repeat(empty) + `  ${n}%`;
}

function BarRow({ label, value }) {
  return (
    <div className="bar-row">
      <span className="label">{label}</span>
      <span className="bar">{bar(value, 10)}</span>
    </div>
  );
}

function cpuColor(val) {
  const n = parseFloat(val) || 0;
  if (n >= 30) return "#e06c75";
  if (n >= 20) return "#e5c07b";
  if (n >= 10) return "#56b6c2";
  return "rgba(255, 255, 255, 0.92)";
}

function clipProcessName(name, maxChars = 24) {
  const text = String(name || "").trim();
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars - 1)}…`;
}

function Section({ title, children }) {
  return (
    <div className="section">
      {title && <div className="section-title">{title}</div>}
      {children}
    </div>
  );
}

export function render({ output }) {
  if (!output || output.trim() === "") {
    return <div className="geek-widget">—</div>;
  }
  let data;
  try {
    data = JSON.parse(output);
  } catch (e) {
    return <div className="geek-widget">Parse error</div>;
  }

  const { cpu, mem, disk, battery, batteryHealth, loadAvg, uptime, globalIp, localIps, topCpu = [], topMem = [] } = data;

  return (
    <div className="geek-widget">
      <div className="line">-------------------------------</div>
      <div className="line">            System </div>
      <div className="line">-------------------------------</div>
      <BarRow label="CPU Usage     " value={cpu} />
      <BarRow label="Memory Usage  " value={mem} />
      <BarRow label="Disk Usage    " value={disk} />
      <BarRow label="Battery       " value={battery} />
      <BarRow label="Battery hlth  " value={batteryHealth} />
      <br/>
      <div className="line">Load AVG      : {loadAvg || "—"}</div>
      <div className="line">Uptime        : {uptime || "—"}</div>
      <br/>
      <div className="line">Global IP     : {globalIp || "N/A"}</div>
      <div className="line">Local IPs     : {localIps || "N/A"}</div>

      <br/>
      <Section title="">
      <div className="line">-------------------------------</div>
      <div className="line">            Top CPU </div>
      <div className="line">-------------------------------</div>
        {Array.isArray(topCpu) && topCpu.length > 0 ? (
          topCpu.map((p, i) => (
            <div key={i} className="proc" style={{ color: cpuColor(p.cpu) }}>
              <span className="proc-cmd" title={p.cmd || p.name}>{clipProcessName(p.cmd || p.name, 24)}</span>
              <span className="proc-val">{p.cpu}</span>
            </div>
          ))
        ) : (
          <div className="line">—</div>
        )}
      </Section>
      <Section title="">
      <div className="line">-------------------------------</div>
      <div className="line">            Top RAM </div>
      <div className="line">-------------------------------</div>
        {Array.isArray(topMem) && topMem.length > 0 ? (
          topMem.map((p, i) => (
            <div key={i} className="proc">
              <span className="proc-cmd" title={p.cmd || p.name}>{clipProcessName(p.cmd || p.name, 24)}</span>
              <span className="proc-val">{p.rss}</span>
            </div>
          ))
        ) : (
          <div className="line">—</div>
        )}
      </Section>
    </div>
  );
}
