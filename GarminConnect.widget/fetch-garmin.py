#!/usr/bin/env python3
import argparse
import json
import os
import statistics
import subprocess
import sys
import time
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Iterable, Optional


def out(payload: dict[str, Any]) -> None:
    print(json.dumps(payload, ensure_ascii=False))


def metric_mean(values: list[Optional[float]]) -> Optional[float]:
    nums = [v for v in values if isinstance(v, (int, float))]
    if not nums:
        return None
    return float(statistics.fmean(nums))


def to_float(value: Any) -> Optional[float]:
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    return None


def walk_numbers(data: Any) -> Iterable[tuple[str, float]]:
    if isinstance(data, dict):
        for k, v in data.items():
            if isinstance(v, (dict, list)):
                yield from walk_numbers(v)
            else:
                num = to_float(v)
                if num is not None:
                    yield str(k).lower(), num
    elif isinstance(data, list):
        for item in data:
            yield from walk_numbers(item)


def first_plausible(
    payload: Any,
    key_hints: tuple[str, ...],
    min_v: float,
    max_v: float,
) -> Optional[float]:
    for key, num in walk_numbers(payload):
        if any(h in key for h in key_hints) and min_v <= num <= max_v:
            return num
    return None


def call_first(client: Any, names: list[str], *args: Any) -> Any:
    for name in names:
        fn = getattr(client, name, None)
        if callable(fn):
            try:
                return fn(*args)
            except Exception:
                continue
    return None


def extract_daily_avg_hr(heart_rates: Any) -> Optional[float]:
    if not isinstance(heart_rates, dict):
        return None
    values = heart_rates.get("heartRateValues")
    if not isinstance(values, list):
        return None

    bpm_values: list[float] = []
    for item in values:
        if not isinstance(item, list) or len(item) < 2:
            continue
        bpm = to_float(item[1])
        if bpm is None:
            continue
        # Filter out obvious invalid values from sparse samples.
        if 25 <= bpm <= 220:
            bpm_values.append(bpm)

    if not bpm_values:
        return None
    return float(statistics.fmean(bpm_values))


def extract_hrv_baseline(hrv_data: Any) -> tuple[Optional[float], Optional[float]]:
    if not isinstance(hrv_data, dict):
        return None, None
    summary = hrv_data.get("hrvSummary")
    if not isinstance(summary, dict):
        return None, None
    baseline = summary.get("baseline")
    if not isinstance(baseline, dict):
        return None, None

    low = to_float(baseline.get("balancedLow"))
    high = to_float(baseline.get("balancedUpper"))
    if low is None or high is None:
        return None, None
    return low, high


def extract_hrv_summary_series(hrv_data: Any) -> tuple[Optional[float], Optional[float]]:
    if not isinstance(hrv_data, dict):
        return None, None
    summary = hrv_data.get("hrvSummary")
    if isinstance(summary, dict):
        last_night_avg = to_float(summary.get("lastNightAvg"))
        weekly_avg = to_float(summary.get("weeklyAvg"))
        if last_night_avg is not None and not (1 <= last_night_avg <= 250):
            last_night_avg = None
        if weekly_avg is not None and not (1 <= weekly_avg <= 250):
            weekly_avg = None
        return last_night_avg, weekly_avg

    return None, None


def extract_hrv_status(hrv_data: Any) -> Optional[str]:
    if not isinstance(hrv_data, dict):
        return None
    summary = hrv_data.get("hrvSummary")
    if not isinstance(summary, dict):
        return None
    status = summary.get("status")
    if isinstance(status, str) and status.strip():
        return status.strip()
    return None


def extract_sleep_score(sleep_data: Any) -> Optional[float]:
    if not isinstance(sleep_data, dict):
        return None

    dto = sleep_data.get("dailySleepDTO")
    if isinstance(dto, dict):
        scores = dto.get("sleepScores")
        if isinstance(scores, dict):
            overall = scores.get("overall")
            if isinstance(overall, dict):
                value = to_float(overall.get("value"))
                if value is not None and 0 <= value <= 100:
                    return value

    # Fallbacks for alternative payload shapes.
    return first_plausible(
        sleep_data,
        ("sleepscore", "sleep_score", "overallscore", "overall"),
        0,
        100,
    )


def extract_sleep_duration_hours(sleep_data: Any) -> Optional[float]:
    if not isinstance(sleep_data, dict):
        return None

    dto = sleep_data.get("dailySleepDTO")
    if isinstance(dto, dict):
        sec = to_float(dto.get("sleepTimeSeconds"))
        if sec is not None and 600 <= sec <= 24 * 3600:
            return sec / 3600.0

        mins = to_float(dto.get("sleepTimeMinutes"))
        if mins is not None and 10 <= mins <= 24 * 60:
            return mins / 60.0

        hrs = to_float(dto.get("sleepTimeHours"))
        if hrs is not None and 0.1 <= hrs <= 24:
            return hrs

    # Fallback for alternative payload shapes.
    sec_guess = first_plausible(
        sleep_data,
        ("sleeptimeseconds", "sleepseconds", "durationseconds"),
        600,
        24 * 3600,
    )
    if sec_guess is not None:
        return sec_guess / 3600.0

    min_guess = first_plausible(
        sleep_data,
        ("sleeptimeminutes", "sleepminutes", "durationminutes"),
        10,
        24 * 60,
    )
    if min_guess is not None:
        return min_guess / 60.0

    hour_guess = first_plausible(
        sleep_data,
        ("sleepdurationhours", "sleephours", "durationhours"),
        0.1,
        24,
    )
    if hour_guess is not None:
        return hour_guess

    return None


def extract_body_battery_high_low(body_battery_data: Any) -> tuple[Optional[float], Optional[float]]:
    if not isinstance(body_battery_data, list) or not body_battery_data:
        return None, None
    first = body_battery_data[0]
    if not isinstance(first, dict):
        return None, None
    values = first.get("bodyBatteryValuesArray")
    if not isinstance(values, list):
        return None, None

    levels: list[float] = []
    for item in values:
        if not isinstance(item, list) or len(item) < 2:
            continue
        level = to_float(item[1])
        if level is None:
            continue
        if 0 <= level <= 100:
            levels.append(level)
    if not levels:
        return None, None
    return max(levels), min(levels)


def extract_steps_and_goal(stats_data: Any) -> tuple[Optional[float], Optional[float]]:
    if not isinstance(stats_data, dict):
        return None, None

    steps = first_plausible(
        stats_data,
        ("totalsteps", "steps"),
        0,
        150000,
    )
    goal = first_plausible(
        stats_data,
        ("stepsgoal", "stepgoal", "dailygoal"),
        1000,
        150000,
    )

    return steps, goal


def extract_active_calories(stats_data: Any) -> Optional[float]:
    if not isinstance(stats_data, dict):
        return None
    return first_plausible(
        stats_data,
        (
            "activekilocalories",
            "activecalories",
            "activekilocalorie",
            "activecalorie",
            "activekcals",
            "activekcal",
        ),
        0,
        10000,
    )


def build_sleep_stages_timeline(sleep_data: Any) -> Optional[dict[str, Any]]:
    if not isinstance(sleep_data, dict):
        return None
    dto = sleep_data.get("dailySleepDTO")
    levels = sleep_data.get("sleepLevels")
    if not isinstance(dto, dict) or not isinstance(levels, list) or not levels:
        return None

    def parse_dt(raw: Any) -> Optional[datetime]:
        # Garmin may return timestamps as ISO strings or epoch ms.
        if isinstance(raw, (int, float)):
            ts = float(raw)
            if ts > 1e12:  # epoch milliseconds
                ts /= 1000.0
            try:
                return datetime.fromtimestamp(ts)
            except (OverflowError, OSError, ValueError):
                return None
        if isinstance(raw, str) and raw:
            cleaned = raw.replace("Z", "")
            try:
                return datetime.fromisoformat(cleaned)
            except ValueError:
                return None
        return None

    def parse_gmt_to_system_local(raw: Any) -> Optional[datetime]:
        # Convert GMT/UTC timestamps to the computer's current local timezone.
        if isinstance(raw, (int, float)):
            ts = float(raw)
            if ts > 1e12:
                ts /= 1000.0
            try:
                return datetime.fromtimestamp(ts, tz=timezone.utc).astimezone()
            except (OverflowError, OSError, ValueError):
                return None
        if isinstance(raw, str) and raw:
            cleaned = raw.replace("Z", "")
            try:
                dt = datetime.fromisoformat(cleaned)
            except ValueError:
                return None
            return dt.replace(tzinfo=timezone.utc).astimezone()
        return None

    stage_map = {0: "deep", 1: "light", 2: "rem", 3: "awake"}
    parsed: list[tuple[datetime, datetime, str]] = []
    for item in levels:
        if not isinstance(item, dict):
            continue
        start = parse_dt(item.get("startGMT"))
        end = parse_dt(item.get("endGMT"))
        level = to_float(item.get("activityLevel"))
        if start is None or end is None or level is None or end <= start:
            continue
        stage = stage_map.get(int(level))
        if not stage:
            continue
        parsed.append((start, end, stage))

    if not parsed:
        return None

    parsed.sort(key=lambda x: x[0])
    base_start = parsed[0][0]
    end_dt = max(x[1] for x in parsed)
    total_minutes = max(1, int((end_dt - base_start).total_seconds() // 60))

    segments = []
    for start, end, stage in parsed:
        start_min = max(0, int((start - base_start).total_seconds() // 60))
        end_min = max(start_min + 1, int((end - base_start).total_seconds() // 60))
        segments.append({"start": start_min, "end": end_min, "stage": stage})

    # Prefer GMT fields and convert to system timezone to avoid double-offset from Garmin's local epoch fields.
    start_local = parse_gmt_to_system_local(dto.get("sleepStartTimestampGMT")) or parse_dt(dto.get("sleepStartTimestampLocal"))
    end_local = parse_gmt_to_system_local(dto.get("sleepEndTimestampGMT")) or parse_dt(dto.get("sleepEndTimestampLocal"))

    return {
        "date": dto.get("calendarDate"),
        "start_local": start_local.strftime("%H:%M") if start_local else None,
        "end_local": end_local.strftime("%H:%M") if end_local else None,
        "total_minutes": total_minutes,
        "segments": segments,
    }


def extract_sleep_heart_rate_points(sleep_data: Any, heart_rates: Any) -> list[dict[str, int]]:
    if not isinstance(sleep_data, dict) or not isinstance(heart_rates, dict):
        return []

    dto = sleep_data.get("dailySleepDTO")
    values = heart_rates.get("heartRateValues")
    if not isinstance(dto, dict) or not isinstance(values, list):
        return []

    def to_epoch_seconds(raw: Any) -> Optional[float]:
        if isinstance(raw, (int, float)):
            ts = float(raw)
            if ts > 1e12:
                ts /= 1000.0
            return ts if ts > 0 else None
        if isinstance(raw, str) and raw:
            cleaned = raw.replace("Z", "")
            try:
                dt = datetime.fromisoformat(cleaned)
            except ValueError:
                return None
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt.timestamp()
        return None

    start_ts = to_epoch_seconds(dto.get("sleepStartTimestampGMT"))
    end_ts = to_epoch_seconds(dto.get("sleepEndTimestampGMT"))
    if start_ts is None or end_ts is None or end_ts <= start_ts:
        return []

    by_minute: dict[int, int] = {}
    for item in values:
        if not isinstance(item, list) or len(item) < 2:
            continue
        ts = to_epoch_seconds(item[0])
        bpm = to_float(item[1])
        if ts is None or bpm is None:
            continue
        if not (25 <= bpm <= 220):
            continue
        if ts < start_ts or ts > end_ts:
            continue
        minute = int((ts - start_ts) // 60)
        by_minute[minute] = int(round(bpm))

    points = [{"minute": m, "bpm": by_minute[m]} for m in sorted(by_minute.keys())]
    return points


def parse_int_env(name: str, default: int, min_value: int = 0) -> int:
    raw = os.getenv(name)
    if raw is None:
        return default
    try:
        parsed = int(raw.strip())
    except (TypeError, ValueError):
        return default
    return max(min_value, parsed)


def load_cache(cache_file: Path) -> Optional[dict[str, Any]]:
    try:
        raw = cache_file.read_text(encoding="utf-8")
        parsed = json.loads(raw)
    except (OSError, json.JSONDecodeError):
        return None
    if not isinstance(parsed, dict):
        return None
    payload = parsed.get("payload")
    fetched_at = parsed.get("fetched_at")
    if not isinstance(payload, dict) or not isinstance(fetched_at, (int, float)):
        return None
    return {"payload": payload, "fetched_at": float(fetched_at)}


def save_cache(cache_file: Path, payload: dict[str, Any], fetched_at: float) -> None:
    cache_file.parent.mkdir(parents=True, exist_ok=True)
    tmp = cache_file.with_suffix(f"{cache_file.suffix}.tmp")
    envelope = {"fetched_at": float(fetched_at), "payload": payload}
    tmp.write_text(json.dumps(envelope, ensure_ascii=False), encoding="utf-8")
    tmp.replace(cache_file)


def try_acquire_lock(lock_file: Path, stale_after_seconds: int = 900) -> bool:
    now = time.time()
    try:
        fd = os.open(str(lock_file), os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
        os.write(fd, str(int(now)).encode("ascii"))
        os.close(fd)
        return True
    except FileExistsError:
        try:
            st = lock_file.stat()
            if now - st.st_mtime > stale_after_seconds:
                lock_file.unlink(missing_ok=True)
                return try_acquire_lock(lock_file, stale_after_seconds=stale_after_seconds)
        except OSError:
            pass
        return False
    except OSError:
        return False


def release_lock(lock_file: Path) -> None:
    try:
        lock_file.unlink(missing_ok=True)
    except OSError:
        pass


def spawn_background_revalidate(script_path: Path, lock_file: Path) -> None:
    if not try_acquire_lock(lock_file):
        return
    try:
        subprocess.Popen(
            [
                sys.executable,
                str(script_path),
                "--revalidate-cache",
                "--revalidate-lock-file",
                str(lock_file),
            ],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            cwd=str(script_path.parent),
            start_new_session=True,
        )
    except Exception:
        release_lock(lock_file)


def with_cache_meta(
    payload: dict[str, Any],
    *,
    fetched_at: float,
    ttl_seconds: int,
    source: str,
) -> dict[str, Any]:
    now = time.time()
    age_seconds = max(0, int(now - fetched_at))
    out_payload = dict(payload)
    out_payload["cache"] = {
        "fetched_at_epoch": float(fetched_at),
        "fetched_at_local": datetime.fromtimestamp(fetched_at).astimezone().strftime("%Y-%m-%d %H:%M"),
        "ttl_seconds": int(ttl_seconds),
        "age_seconds": age_seconds,
        "is_fresh": age_seconds <= ttl_seconds,
        "source": source,
    }
    return out_payload


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Fetch Garmin 30-day health metrics for Ubersicht")
    p.add_argument("--init", action="store_true", help="Run interactive login once to create/refresh local tokens")
    p.add_argument("--email", help="Garmin email (overrides GARMIN_EMAIL)")
    p.add_argument("--password", help="Garmin password (overrides GARMIN_PASSWORD)")
    p.add_argument(
        "--tokenstore",
        help="Directory where oauth token files are stored (overrides GARMIN_TOKENSTORE)",
    )
    p.add_argument("--revalidate-cache", action="store_true", help=argparse.SUPPRESS)
    p.add_argument("--revalidate-lock-file", help=argparse.SUPPRESS)
    return p.parse_args()


def fetch_live_payload(args: argparse.Namespace, widget_dir: Path) -> dict[str, Any]:
    tokenstore_dir = Path(
        args.tokenstore
        or os.getenv("GARMIN_TOKENSTORE")
        or str(widget_dir / ".tokens")
    ).expanduser()
    tokenstore_dir.mkdir(parents=True, exist_ok=True)
    try:
        os.chmod(tokenstore_dir, 0o700)
    except OSError:
        pass

    email = (args.email or os.getenv("GARMIN_EMAIL", "")).strip()
    password = (args.password or os.getenv("GARMIN_PASSWORD", "")).strip()

    try:
        from garminconnect import Garmin
    except Exception as exc:
        return {
            "status": "error",
            "message": f"Python dependency not installed: {exc}",
            "hint": "Run: python3 -m pip install garminconnect",
        }

    token_files_exist = (
        (tokenstore_dir / "oauth1_token.json").exists()
        and (tokenstore_dir / "oauth2_token.json").exists()
    )
    has_credentials = bool(email and password)

    if not token_files_exist and not has_credentials:
        return {
            "status": "error",
            "message": "No token files found and missing Garmin credentials.",
            "hint": (
                "Use --init --email <email> --password <password> "
                "or set GARMIN_EMAIL/GARMIN_PASSWORD in config.env."
            ),
            "tokenstore": str(tokenstore_dir),
        }

    try:
        client = Garmin(email, password)
        if token_files_exist:
            client.login(tokenstore=str(tokenstore_dir))
        else:
            client.login()
        if getattr(client, "garth", None) is not None:
            client.garth.dump(str(tokenstore_dir))
    except Exception as exc:
        return {
            "status": "error",
            "message": f"Garmin login failed: {exc}",
            "hint": (
                "Run once in terminal: "
                "python3 GarminConnect.widget/fetch-garmin.py --init "
                "--email <email> --password <password>"
            ),
            "tokenstore": str(tokenstore_dir),
        }

    if args.init:
        return {
            "status": "ok",
            "message": "Token setup successful.",
            "tokenstore": str(tokenstore_dir),
            "hint": (
                "Token files created: oauth1_token.json and oauth2_token.json "
                f"in {tokenstore_dir}"
            ),
        }

    today = date.today()
    start = today - timedelta(days=29)

    hr_avg_series: list[Optional[float]] = []
    avg_high_hr_series: list[Optional[float]] = []
    resting_hr_series: list[Optional[float]] = []
    stress_series: list[Optional[float]] = []
    hrv_night_avg_series: list[Optional[float]] = []
    hrv_weekly_avg_series: list[Optional[float]] = []
    hrv_baseline_low_series: list[Optional[float]] = []
    hrv_baseline_high_series: list[Optional[float]] = []
    hrv_status_series: list[Optional[str]] = []
    sleep_score_series: list[Optional[float]] = []
    sleep_duration_hours_series: list[Optional[float]] = []
    body_battery_high_series: list[Optional[float]] = []
    body_battery_low_series: list[Optional[float]] = []
    steps_series: list[Optional[float]] = []
    steps_goal_series: list[Optional[float]] = []
    active_calories_series: list[Optional[float]] = []
    latest_sleep_stages: Optional[dict[str, Any]] = None

    for i in range(30):
        day = start + timedelta(days=i)
        day_str = day.isoformat()

        stats = call_first(client, ["get_stats", "get_user_summary"], day_str) or {}
        heart_rates = call_first(client, ["get_heart_rates", "get_heart_rate"], day_str) or {}
        stress_data = call_first(client, ["get_stress_data", "get_stress"], day_str) or {}
        hrv_data = call_first(client, ["get_hrv_data", "get_hrv", "get_hrv_summary"], day_str) or {}
        sleep_data = call_first(client, ["get_sleep_data", "get_daily_sleep", "get_sleep_score"], day_str) or {}
        body_battery_data = call_first(client, ["get_body_battery"], day_str) or {}

        hr_avg = extract_daily_avg_hr(heart_rates)
        if hr_avg is None:
            # Fallback when time-series data is unavailable.
            min_avg = first_plausible(stats, ("minavgheart",), 25, 220)
            max_avg = first_plausible(stats, ("maxavgheart",), 25, 220)
            if min_avg is not None and max_avg is not None:
                hr_avg = (min_avg + max_avg) / 2.0

        avg_high_hr = first_plausible(
            stats,
            ("maxavgheart", "averageheartmax", "avg_high_hr"),
            25,
            220,
        )
        if avg_high_hr is None:
            avg_high_hr = first_plausible(
                heart_rates,
                ("maxavgheart", "averageheartmax", "avg_high_hr"),
                25,
                220,
            )

        resting_hr = first_plausible(
            stats,
            ("restingheart", "resting_hr"),
            25,
            130,
        )
        if resting_hr is None:
            resting_hr = first_plausible(
                heart_rates,
                ("restingheart", "resting_hr"),
                25,
                130,
            )

        stress = first_plausible(
            stress_data,
            ("avgstresslevel",),
            0,
            100,
        )
        if stress is None:
            stress = first_plausible(
                stats,
                ("averagestresslevel",),
                0,
                100,
            )

        hrv_night_avg, hrv_weekly_avg = extract_hrv_summary_series(hrv_data)
        if hrv_night_avg is None:
            hrv_night_avg = first_plausible(stats, ("hrv", "rmssd"), 1, 250)
        if hrv_weekly_avg is None:
            hrv_weekly_avg = hrv_night_avg
        hrv_baseline_low, hrv_baseline_high = extract_hrv_baseline(hrv_data)
        hrv_status = extract_hrv_status(hrv_data)

        sleep_score = extract_sleep_score(sleep_data)
        if sleep_score is None:
            sleep_score = first_plausible(
                stats,
                ("sleepscore", "sleep_score"),
                0,
                100,
            )
        sleep_duration_hours = extract_sleep_duration_hours(sleep_data)
        body_battery_high, body_battery_low = extract_body_battery_high_low(body_battery_data)
        steps, steps_goal = extract_steps_and_goal(stats)
        active_calories = extract_active_calories(stats)
        sleep_stages = build_sleep_stages_timeline(sleep_data)
        if sleep_stages is not None:
            sleep_hr_points = extract_sleep_heart_rate_points(sleep_data, heart_rates)
            if sleep_hr_points:
                sleep_stages["heart_rate_points"] = sleep_hr_points
            latest_sleep_stages = sleep_stages
            if sleep_duration_hours is None:
                total_minutes = to_float(sleep_stages.get("total_minutes"))
                if total_minutes is not None and total_minutes > 0:
                    sleep_duration_hours = total_minutes / 60.0

        hr_avg_series.append(hr_avg)
        avg_high_hr_series.append(avg_high_hr)
        resting_hr_series.append(resting_hr)
        stress_series.append(stress)
        hrv_night_avg_series.append(hrv_night_avg)
        hrv_weekly_avg_series.append(hrv_weekly_avg)
        hrv_baseline_low_series.append(hrv_baseline_low)
        hrv_baseline_high_series.append(hrv_baseline_high)
        hrv_status_series.append(hrv_status)
        sleep_score_series.append(sleep_score)
        sleep_duration_hours_series.append(sleep_duration_hours)
        body_battery_high_series.append(body_battery_high)
        body_battery_low_series.append(body_battery_low)
        steps_series.append(steps)
        steps_goal_series.append(steps_goal)
        active_calories_series.append(active_calories)

    return {
        "status": "ok",
        "from": start.isoformat(),
        "to": today.isoformat(),
        "hr_avg_30d": metric_mean(hr_avg_series),
        "avg_high_hr_30d": metric_mean(avg_high_hr_series),
        "resting_hr_avg_30d": metric_mean(resting_hr_series),
        "stress_avg_30d": metric_mean(stress_series),
        "hrv_night_avg_30d": metric_mean(hrv_night_avg_series),
        "hrv_weekly_avg_30d": metric_mean(hrv_weekly_avg_series),
        "sleep_score_avg_30d": metric_mean(sleep_score_series),
        "sleep_duration_hours_avg_30d": metric_mean(sleep_duration_hours_series),
        "body_battery_high_30d": metric_mean(body_battery_high_series),
        "body_battery_low_30d": metric_mean(body_battery_low_series),
        "steps_avg_30d": metric_mean(steps_series),
        "active_calories_avg_30d": metric_mean(active_calories_series),
        "tokenstore": str(tokenstore_dir),
        "latest_sleep_stages": latest_sleep_stages,
        "series": {
            "hr_avg": hr_avg_series,
            "avg_high_hr": avg_high_hr_series,
            "resting_hr": resting_hr_series,
            "stress": stress_series,
            "hrv_night_avg": hrv_night_avg_series,
            "hrv_weekly_avg": hrv_weekly_avg_series,
            "hrv_baseline_low": hrv_baseline_low_series,
            "hrv_baseline_high": hrv_baseline_high_series,
            "hrv_status": hrv_status_series,
            "sleep_score": sleep_score_series,
            "sleep_duration_hours": sleep_duration_hours_series,
            "body_battery_high": body_battery_high_series,
            "body_battery_low": body_battery_low_series,
            "steps": steps_series,
            "steps_goal": steps_goal_series,
            "active_calories": active_calories_series,
        },
    }


def main() -> None:
    args = parse_args()
    widget_dir = Path(__file__).resolve().parent

    cache_file = Path(
        os.getenv("GARMIN_CACHE_FILE", str(widget_dir / ".cache" / "latest.json"))
    ).expanduser()
    cache_ttl_seconds = parse_int_env("GARMIN_CACHE_TTL_SECONDS", 3600, min_value=60)
    lock_file = cache_file.with_suffix(f"{cache_file.suffix}.revalidate.lock")

    should_use_cache = not args.init and not args.revalidate_cache
    if should_use_cache:
        cached = load_cache(cache_file)
        if cached is not None:
            age = time.time() - cached["fetched_at"]
            if age <= cache_ttl_seconds:
                out(
                    with_cache_meta(
                        cached["payload"],
                        fetched_at=cached["fetched_at"],
                        ttl_seconds=cache_ttl_seconds,
                        source="cache",
                    )
                )
                return
            spawn_background_revalidate(Path(__file__).resolve(), lock_file)
            out(
                with_cache_meta(
                    cached["payload"],
                    fetched_at=cached["fetched_at"],
                    ttl_seconds=cache_ttl_seconds,
                    source="cache",
                )
            )
            return

    fetched_at_live = time.time()
    try:
        payload = fetch_live_payload(args, widget_dir)
    finally:
        if args.revalidate_cache and args.revalidate_lock_file:
            release_lock(Path(args.revalidate_lock_file).expanduser())

    if payload.get("status") == "ok" and not args.init:
        try:
            save_cache(cache_file, payload, fetched_at=fetched_at_live)
        except OSError:
            pass

    if args.revalidate_cache:
        return

    if payload.get("status") == "ok":
        out(
            with_cache_meta(
                payload,
                fetched_at=fetched_at_live,
                ttl_seconds=cache_ttl_seconds,
                source="live",
            )
        )
        return
    out(payload)


if __name__ == "__main__":
    main()
