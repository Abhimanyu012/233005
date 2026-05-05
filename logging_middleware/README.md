# Logging Middleware

This module sends logs to the external logging API.

## Usage

```js
const { Log } = require("./log");

async function run() {
	await Log("backend", "info", "controller", "Fetched data successfully");
}
```

Required env variable:
- `TOKEN`
