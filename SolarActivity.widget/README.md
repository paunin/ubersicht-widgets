# SolarActivity.widget

Übersicht widget for Earth-impact solar activity based on NOAA SWPC data.

## What it shows

- Current planetary Kp index
- Activity level and storm class (G0-G5)
- Previous 7 days (daily Kp average)
- Next 7 days forecast (NOAA Ap converted to Kp-equivalent)
- Canvas-drawn sun icon that changes style with score (0-10)

## Data sources

- `https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json`
- `https://services.swpc.noaa.gov/json/45-day-forecast.json`

## Setup

1. Copy example config:
   - `cp SolarActivity.widget/config.env.example SolarActivity.widget/config.env`
2. Ensure Python 3 is available (`python3` by default).
3. Reload widgets in Übersicht.

## Notes

- The forecast panel uses `Ap -> Kp` approximation from NOAA-style anchor points.
- This widget has no API keys and does not store tokens.
