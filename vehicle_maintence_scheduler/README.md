# Vehicle Maintenance Scheduler

This folder uses a simple layout.

Structure:
- `src/routes` for API routes
- `src/controllers` for request handling and knapsack logic
- `src/middleware` for auth header setup

What this API does:
- Fetch depots and vehicles from the test server
- Run the knapsack logic for each depot
- Expose REST endpoints for Postman testing
- Use the logging middleware in every function

Endpoints:
- `GET /scheduler/depots`
- `GET /scheduler/vehicles`
- `GET /scheduler/run`

Run:
1. Add `TOKEN` in `.env`
2. `npm install`
3. Start the server:
   - For development (with hot-reload): `npm run dev`
   - For production: `npm start`

## Output Example

![Scheduler Endpoint Output](./Screenshot%20from%202026-05-05%2015-30-12.png)
