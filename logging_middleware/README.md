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

## Running Checks

You can verify the module loads correctly by running:
```bash
npm run check
```

## Error Handling / Validation

If required fields are missing in the request, the evaluation server will return a 400 response with the validation errors, as shown below:

![Postman Validation Error Response](Screenshot%20from%202026-05-05%2015-23-02.png)
