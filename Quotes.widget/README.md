# Quotes.widget

Displays a random quote from a bundled JSON file, refreshing every hour.

## Dependencies

- `python3` — for selecting a random quote from the JSON file

## Configuration

No configuration needed. Quotes are read from the bundled `quotes.json` file.

To customize quotes, edit `quotes.json` directly. The expected format:

```json
{
  "quotes": [
    { "text": "Quote text here.", "author": "Author Name" }
  ]
}
```
