export const command = "echo";
export const refreshFrequency = 10000;

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];
const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DOW = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function pad2(n) { return String(n).padStart(2, "0"); }

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfWeek(year, month) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

function MonthGrid({ year, month, todayYear, todayMonth, todayDay }) {
  const days = daysInMonth(year, month);
  const offset = firstDayOfWeek(year, month);
  const isCurrentMonth = year === todayYear && month === todayMonth;
  const rows = [];
  let week = new Array(offset).fill(null);

  for (let d = 1; d <= days; d++) {
    week.push(d);
    if (week.length === 7) {
      rows.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    rows.push(week);
  }

  return (
    <div className="month-block">
      <div className="month-title">{SHORT_MONTHS[month]}</div>
      <div className="dow-row">
        {DOW.map((d, i) => <span key={i} className="dow">{d}</span>)}
      </div>
      {rows.map((row, ri) => (
        <div key={ri} className="week-row">
          {row.map((d, ci) => {
            if (d === null) return <span key={ci} className="day empty">{" "}</span>;
            const isToday = isCurrentMonth && d === todayDay;
            const cls = "day" + (isToday ? " today" : "");
            return <span key={ci} className={cls}>{String(d).padStart(2)}</span>;
          })}
        </div>
      ))}
    </div>
  );
}

export const className = `
  position: fixed;
  right: 70px;
  bottom: 120px;
  width: auto;
  margin: 0;
  padding: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.88);
  font-family: Futura-Medium, Futura, sans-serif;
  text-shadow: 0 0 6px rgba(0, 0, 0, 0.6);
  pointer-events: none;
  user-select: none;

  .clock {
    font-family: Futura-Medium, Futura, sans-serif;
    font-size: 300px;
    font-weight: 500;
    letter-spacing: -4px;
    text-align: right;
    line-height: 1;
    color: rgba(255, 255, 255, 0.95);
  }

  .date-line {
    font-family: Futura-Medium, Futura, sans-serif;
    font-size: 80px;
    text-align: right;
    margin-top: -30px;
    margin-bottom: 20px;
    padding-bottom: 40px;
    color: rgba(255, 255, 255, 0.95);
  }

  .calendars {
    display: flex;
    gap: 32px;
    margin-top: 28px;
    justify-content: flex-end;
  }

  .month-block {
    font-family: "SF Mono", "Menlo", "Monaco", monospace;
    font-size: 22px;
    font-weight: 400;
    line-height: 1.5;
    white-space: pre;
  }

  .month-title {
    font-family: "SF Mono", "Menlo", "Monaco", monospace;
    text-align: center;
    font-size: 17px;
    font-weight: 400;
    margin-bottom: 4px;
    color: rgba(255, 255, 255, 0.85);
  }

  .dow-row {
    display: flex;
    gap: 0;
    color: rgba(255, 255, 255, 0.65);
  }

  .dow {
    width: 2.6ch;
    text-align: right;
  }

  .week-row {
    display: flex;
    gap: 0;
  }

  .day {
    width: 2.6ch;
    text-align: right;
    color: rgba(255, 255, 255, 0.85);
  }

  .day.empty {
    visibility: hidden;
  }

  .day.today {
    color:rgb(138, 226, 255);
    font-weight: 700;
  }
`;

export function render() {
  const now = new Date();
  const hh = pad2(now.getHours());
  const mm = pad2(now.getMinutes());
  const dayName = DAYS[now.getDay()];
  const monthName = MONTHS[now.getMonth()];
  const dd = now.getDate();
  const todayYear = now.getFullYear();
  const todayMonth = now.getMonth();

  const prevMonth = todayMonth === 0 ? 11 : todayMonth - 1;
  const prevYear = todayMonth === 0 ? todayYear - 1 : todayYear;
  const nextMonth = todayMonth === 11 ? 0 : todayMonth + 1;
  const nextYear = todayMonth === 11 ? todayYear + 1 : todayYear;

  return (
    <div>
      <div className="clock">{hh}:{mm}</div>
      <div className="date-line">{dayName}, {monthName} {dd}</div>
      <div className="calendars">
        <MonthGrid year={prevYear} month={prevMonth} todayYear={todayYear} todayMonth={todayMonth} todayDay={dd} />
        <MonthGrid year={todayYear} month={todayMonth} todayYear={todayYear} todayMonth={todayMonth} todayDay={dd} />
        <MonthGrid year={nextYear} month={nextMonth} todayYear={todayYear} todayMonth={todayMonth} todayDay={dd} />
      </div>
    </div>
  );
}
