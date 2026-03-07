# LifeCounter.widget

"Memento Mori" life-in-weeks grid. Visualizes your entire life expectancy as a grid of weekly cells, highlighting weeks already lived.

## Dependencies

None — uses only built-in JavaScript date functions.

## Configuration

Copy the example config and edit it:

```bash
cd LifeCounter.widget
cp config.env.example config.env
```

Available settings in `config.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `LIFE_BIRTH_DATE` | Your birth date in `YYYY-MM-DD` format | `1988-01-01` |
| `LIFE_EXPECTANCY` | Life expectancy in years | `85` |
