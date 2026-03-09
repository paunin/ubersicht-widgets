#!/usr/bin/env python3
import json
import os
import urllib.request
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any, Optional

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CACHE_FILE = os.path.join(SCRIPT_DIR, ".solar-cache.json")
CACHE_MAX_AGE_SECONDS = 86400  # 24 h

KP_FORECAST_URL = "https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json"
FORECAST_45D_URL = "https://services.swpc.noaa.gov/json/45-day-forecast.json"


def out(payload: dict[str, Any]) -> None:
    print(json.dumps(payload, ensure_ascii=False))


def fetch_json(url: str, timeout: int = 20) -> Any:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Ubersicht-SolarActivity/1.0",
            "Accept": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=timeout) as res:
        return json.loads(res.read().decode("utf-8"))


def parse_time_tag(value: str) -> Optional[datetime]:
    try:
        # NOAA Kp product uses "YYYY-MM-DD HH:MM:SS" in UTC.
        return datetime.strptime(value, "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
    except Exception:
        return None


def to_float(value: Any) -> Optional[float]:
    try:
        if isinstance(value, bool):
            return None
        return float(value)
    except Exception:
        return None


def parse_kp_rows(raw: Any) -> list[dict[str, Any]]:
    if not isinstance(raw, list) or len(raw) < 2:
        return []

    headers = raw[0]
    if not isinstance(headers, list):
        return []

    rows: list[dict[str, Any]] = []
    for row in raw[1:]:
        if not isinstance(row, list) or len(row) != len(headers):
            continue
        item = dict(zip(headers, row))
        t = parse_time_tag(str(item.get("time_tag", "")))
        kp = to_float(item.get("kp"))
        observed = str(item.get("observed", "")).strip().lower()
        if t is None or kp is None:
            continue
        rows.append({"time": t, "kp": kp, "observed": observed})

    rows.sort(key=lambda x: x["time"])
    return rows


def pick_current_kp(rows: list[dict[str, Any]]) -> Optional[float]:
    if not rows:
        return None
    non_predicted = [r for r in rows if r["observed"] in {"observed", "estimated"}]
    if non_predicted:
        return float(non_predicted[-1]["kp"])
    return float(rows[-1]["kp"])


def daily_kp_history(rows: list[dict[str, Any]], days: int = 7) -> list[dict[str, Any]]:
    by_day: dict[str, list[float]] = defaultdict(list)
    for r in rows:
        if r["observed"] not in {"observed", "estimated"}:
            continue
        d = r["time"].date().isoformat()
        by_day[d].append(float(r["kp"]))

    if not by_day:
        return []

    all_days = sorted(by_day.keys())
    tail_days = all_days[-days:]
    out_rows: list[dict[str, Any]] = []
    for day in tail_days:
        vals = by_day.get(day, [])
        if not vals:
            continue
        out_rows.append({"date": day, "kp": round(sum(vals) / len(vals), 2)})
    return out_rows


def ap_to_kp_equivalent(ap: float) -> float:
    # Approximate NOAA-style Ap -> Kp conversion via anchor points.
    # Anchor pairs are (Kp, Ap).
    anchors = [
        (0.0, 0.0),
        (1.0, 4.0),
        (2.0, 7.0),
        (3.0, 15.0),
        (4.0, 27.0),
        (5.0, 48.0),
        (6.0, 80.0),
        (7.0, 140.0),
        (8.0, 240.0),
        (9.0, 400.0),
    ]
    ap = max(0.0, ap)

    for idx in range(len(anchors) - 1):
        kp_a, ap_a = anchors[idx]
        kp_b, ap_b = anchors[idx + 1]
        if ap_a <= ap <= ap_b:
            if ap_b == ap_a:
                return kp_a
            ratio = (ap - ap_a) / (ap_b - ap_a)
            return kp_a + ratio * (kp_b - kp_a)
    return 9.0


def forecast_next_7_days(raw_45d: Any) -> list[dict[str, Any]]:
    if not isinstance(raw_45d, dict):
        return []
    data = raw_45d.get("data")
    if not isinstance(data, list):
        return []

    today = datetime.now(timezone.utc).date()
    ap_by_day: dict[str, float] = {}
    for item in data:
        if not isinstance(item, dict):
            continue
        if str(item.get("metric")) != "ap":
            continue
        t = str(item.get("time", ""))
        day = t[:10]
        ap = to_float(item.get("value"))
        if len(day) != 10 or ap is None:
            continue
        if day > today.isoformat():
            ap_by_day[day] = ap

    days = sorted(ap_by_day.keys())[:7]
    out_rows: list[dict[str, Any]] = []
    for day in days:
        ap = ap_by_day[day]
        kp_eq = ap_to_kp_equivalent(ap)
        out_rows.append(
            {
                "date": day,
                "ap": round(ap, 2),
                "kp_eq": round(kp_eq, 2),
            }
        )
    return out_rows


def kp_level(kp: float) -> tuple[str, str]:
    if kp < 2:
        return "Quiet", "G0"
    if kp < 4:
        return "Unsettled", "G0"
    if kp < 5:
        return "Active", "G0"
    if kp < 6:
        return "Minor Storm", "G1"
    if kp < 7:
        return "Moderate Storm", "G2"
    if kp < 8:
        return "Strong Storm", "G3"
    if kp < 9:
        return "Severe Storm", "G4"
    return "Extreme Storm", "G5"


def kp_to_score_0_10(kp: float) -> float:
    # Kp is typically 0..9, but requested display score is 0..10.
    return max(0.0, min(10.0, (kp / 9.0) * 10.0))


def save_cache(payload: dict[str, Any]) -> None:
    try:
        with open(CACHE_FILE, "w") as f:
            json.dump(payload, f)
    except OSError:
        pass


def load_cache() -> Optional[dict[str, Any]]:
    try:
        age = datetime.now().timestamp() - os.path.getmtime(CACHE_FILE)
        if age > CACHE_MAX_AGE_SECONDS:
            return None
        with open(CACHE_FILE) as f:
            data = json.load(f)
        if isinstance(data, dict) and data.get("status") == "ok":
            data["stale"] = True
            return data
    except (OSError, json.JSONDecodeError):
        pass
    return None


def main() -> None:
    try:
        kp_raw = fetch_json(KP_FORECAST_URL)
        forecast_raw = fetch_json(FORECAST_45D_URL)

        kp_rows = parse_kp_rows(kp_raw)
        if not kp_rows:
            raise RuntimeError("No usable Kp rows found from NOAA product")

        current_kp = pick_current_kp(kp_rows)
        if current_kp is None:
            raise RuntimeError("Unable to determine current Kp value")

        past7 = daily_kp_history(kp_rows, 7)
        next7 = forecast_next_7_days(forecast_raw)

        level, storm_scale = kp_level(current_kp)
        score = kp_to_score_0_10(current_kp)

        payload = {
            "status": "ok",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "current": {
                "kp": round(current_kp, 2),
                "score_0_10": round(score, 2),
                "level": level,
                "storm_scale": storm_scale,
            },
            "past7": past7,
            "next7": next7,
            "meta": {
                "source": "NOAA SWPC",
                "forecast_method": "ap_to_kp_equivalent",
                "endpoints": [KP_FORECAST_URL, FORECAST_45D_URL],
            },
        }
        save_cache(payload)
        out(payload)
    except Exception:
        cached = load_cache()
        if cached:
            out(cached)
        else:
            out({"status": "hidden"})


if __name__ == "__main__":
    main()
