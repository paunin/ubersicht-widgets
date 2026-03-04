# GarminConnect.widget

Garmin Connect widget for Übersicht that displays:

- Heart rate average (30 days)
- Resting heart rate average (30 days)
- Stress average (30 days)
- HRV average (30 days)

It uses local OAuth token files stored in:

- `GarminConnect.widget/.tokens/oauth1_token.json`
- `GarminConnect.widget/.tokens/oauth2_token.json`

`GarminConnect.widget/.tokens/` is git-ignored.

## Installation

Run everything below from inside the widget directory:

```bash
cd GarminConnect.widget
```

1. Create Python virtual environment:

```bash
python3 -m venv ".venv"
```

1. Install dependency into the venv:

```bash
".venv/bin/python3" -m pip install --upgrade pip
".venv/bin/python3" -m pip install garminconnect
```

1. Configure python path in `config.env`:

```bash
cp -n config.env.example config.env
```

Set `GARMIN_PYTHON` to an absolute path so it works regardless of current working directory:

```bash
GARMIN_PYTHON=/absolute/path/to/widgets/GarminConnect.widget/.venv/bin/python3
```

You can keep `GARMIN_EMAIL` and `GARMIN_PASSWORD` in `config.env`, or only pass them during `--init`.

## Initialize token files

Recommended (avoid storing password in config file):

```bash
".venv/bin/python3" "fetch-garmin.py" \
  --init \
  --email "your_email@example.com" \
  --password "your_password"
```

The command output includes `tokenstore` so you can confirm where tokens were saved.

If you prefer environment/config credentials:

```bash
set -a; . "./config.env"; set +a
"$GARMIN_PYTHON" "./fetch-garmin.py" --init
```

## Run data fetch manually

```bash
set -a; . "./config.env"; set +a
"$GARMIN_PYTHON" "./fetch-garmin.py"
```

This prints JSON payload with current 30-day averages and `tokenstore`.

## Notes

- If MFA is required, follow prompts in terminal during `--init`.
- Rotate credentials if they were typed in shared terminal history.
