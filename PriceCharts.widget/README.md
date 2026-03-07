# PriceCharts.widget

Asset price sparkline charts for crypto, stocks, and commodities. Data is fetched from CoinGecko and Yahoo Finance (no API keys required).

## Dependencies

- `python3` — for parsing API responses
- `curl` — for fetching price data

Both ship with macOS (python3 via Xcode Command Line Tools or Homebrew).

## Configuration

Copy the example config and edit it:

```bash
cd PriceCharts.widget
cp config.env.example config.env
```

Define which assets to track in the `PRICE_ASSETS` array. Each entry uses the format `"Label|source|ticker"`:

- **source**: `coingecko` or `yahoo`
- **ticker**: CoinGecko coin ID or Yahoo Finance symbol (URL-encoded)

Example:

```bash
PRICE_ASSETS=(
  "BTC/USD|coingecko|bitcoin"
  "SP500/USD|yahoo|%5EGSPC"
  "GOLD/USD|yahoo|GC%3DF"
)
PRICE_CACHE_MAX_AGE=1800
```

If no `PRICE_ASSETS` are defined, the widget displays a configuration prompt instead of charts.
