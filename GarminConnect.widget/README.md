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

1. Create Python virtual environment and install dependencies:

```bash
python3 -m venv .venv
.venv/bin/python3 -m pip install --upgrade pip
.venv/bin/python3 -m pip install garminconnect
```

2. Copy the example config:

```bash
cp -n config.env.example config.env
```

The widget auto-activates `.venv` if present — no need to configure a Python path.

You can keep `GARMIN_EMAIL` and `GARMIN_PASSWORD` in `config.env`, or only pass them during `--init`.

## Initialize token files

Recommended (avoid storing password in config file):

```bash
.venv/bin/python3 fetch-garmin.py \
  --init \
  --email "your_email@example.com" \
  --password "your_password"
```

The command output includes `tokenstore` so you can confirm where tokens were saved.

If you prefer environment/config credentials:

```bash
set -a; . ./config.env; set +a
.venv/bin/python3 fetch-garmin.py --init
```

## Run data fetch manually

```bash
source .venv/bin/activate
python3 fetch-garmin.py
```

This prints JSON payload with current 30-day averages and `tokenstore`.

## Notes

- If MFA is required, follow prompts in terminal during `--init`.
- Rotate credentials if they were typed in shared terminal history.
