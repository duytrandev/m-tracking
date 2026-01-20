# @m-tracking/prettier-config

Shared Prettier configuration for M-Tracking monorepo.

## Usage

### In package.json

```json
{
  "prettier": "@m-tracking/prettier-config"
}
```

### Or create .prettierrc.js

```js
module.exports = {
  ...require('@m-tracking/prettier-config'),
  // Override any settings here if needed
}
```

## Configuration

- **Semi:** No semicolons
- **Quotes:** Single quotes for JS/TS, double for JSX
- **Trailing Commas:** ES5 compatible
- **Tab Width:** 2 spaces
- **Print Width:** 80 characters
- **Line Ending:** LF (Unix style)

## Editor Integration

### VS Code

Install the Prettier extension and add to `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true
}
```

### Other Editors

See [Prettier Editor Integration](https://prettier.io/docs/en/editors.html)
