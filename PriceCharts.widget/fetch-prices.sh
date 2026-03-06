#!/bin/bash
# Fetch asset prices for PriceCharts widget
# No API keys required
#
# Stale-while-revalidate: always serves cache instantly,
# refreshes in background every CACHE_MAX_AGE seconds.
#
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
[ -f "$SCRIPT_DIR/config.env" ] && . "$SCRIPT_DIR/config.env"

if [ ${#PRICE_ASSETS[@]} -eq 0 ]; then
  echo '{"error":"No pairs configured. Define PRICE_ASSETS in config.env"}'
  exit 0
fi
ASSETS=("${PRICE_ASSETS[@]}")
CACHE_MAX_AGE="${PRICE_CACHE_MAX_AGE:-1800}"

CACHE_DIR="/tmp/ubersicht-pricecharts"
CACHE_FILE="$CACHE_DIR/prices.json"
LOCK_FILE="$CACHE_DIR/refresh.lock"

UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"

mkdir -p "$CACHE_DIR"

# --- Check cache age; returns 0 if fresh, 1 if stale/missing ---
cache_is_fresh() {
  [ -f "$CACHE_FILE" ] || return 1
  local now mod age
  now=$(date +%s)
  mod=$(stat -f %m "$CACHE_FILE" 2>/dev/null || echo 0)
  age=$((now - mod))
  [ "$age" -lt "$CACHE_MAX_AGE" ]
}

# --- Unified parser ---
parse_response() {
  local source="$1"
  python3 -c "
import sys, json

MAX_POINTS = 100
source = '$source'
raw = sys.stdin.read()
try:
    d = json.loads(raw)
    if source == 'coingecko':
        prices = [p[1] for p in d.get('prices', [])]
        prices = [round(p, 2) for p in prices]
    else:
        result = d['chart']['result'][0]
        closes = result['indicators']['quote'][0]['close']
        prices = [round(c, 4) for c in closes if c is not None]

    if not prices:
        raise ValueError('empty')

    if len(prices) > MAX_POINTS:
        step = len(prices) / MAX_POINTS
        prices = [prices[int(i * step)] for i in range(MAX_POINTS - 1)] + [prices[-1]]

    cur = prices[-1]
    print(json.dumps(prices))
    print(cur)
except Exception:
    print('[]')
    print(0)
" 2>/dev/null
}

# --- Fetch one asset, output JSON fragment ---
fetch_asset() {
  local label="$1" source="$2" ticker="$3"

  local url
  if [ "$source" = "coingecko" ]; then
    url="https://api.coingecko.com/api/v3/coins/${ticker}/market_chart?vs_currency=usd&days=7"
  else
    url="https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=7d&interval=1h"
  fi

  local raw
  raw=$(curl -sf --max-time 10 -A "$UA" "$url" 2>/dev/null)

  local prices="[]" current=0
  if [ -n "$raw" ]; then
    local parsed
    parsed=$(echo "$raw" | parse_response "$source")
    prices=$(echo "$parsed" | sed -n '1p')
    current=$(echo "$parsed" | sed -n '2p')
    [ -z "$prices" ] && prices="[]"
    [ -z "$current" ] && current=0
  fi

  printf '{"symbol":"%s","current":%s,"prices":%s}' \
    "$label" "$current" "$prices"
}

# --- Fetch all assets and write to cache ---
do_refresh() {
  local tmp="$CACHE_DIR/prices.tmp.$$"
  {
    echo '{"assets":['
    local first=true
    for entry in "${ASSETS[@]}"; do
      IFS='|' read -r label source ticker <<< "$entry"
      [ "$first" = true ] && first=false || echo ","
      fetch_asset "$label" "$source" "$ticker"
    done
    echo ']}'
  } > "$tmp"

  # Only replace cache if we got valid JSON with data
  if python3 -c "
import sys, json
d = json.load(open('$tmp'))
assets = d.get('assets', [])
has_data = any(len(a.get('prices', [])) > 0 for a in assets)
sys.exit(0 if has_data else 1)
" 2>/dev/null; then
    mv "$tmp" "$CACHE_FILE"
  else
    rm -f "$tmp"
  fi

  rm -f "$LOCK_FILE"
}

# --- Main: stale-while-revalidate ---

# If cache is stale (or missing), trigger a refresh
if ! cache_is_fresh; then
  if [ -f "$CACHE_FILE" ]; then
    # Stale: refresh in background, serve stale data now
    if ! [ -f "$LOCK_FILE" ]; then
      touch "$LOCK_FILE"
      do_refresh &
    fi
  else
    # No cache at all: must fetch synchronously
    do_refresh
  fi
fi

# Output cache (or fallback)
if [ -f "$CACHE_FILE" ]; then
  cat "$CACHE_FILE"
else
  echo '{"assets":[]}'
fi
