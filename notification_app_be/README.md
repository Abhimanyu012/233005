# Notification App Backend

This folder uses a simple layout.

Structure:
- `src/routes` for API routes
- `src/controllers` for request handling and priority logic
- `src/middleware` for auth and error handling

What this API does:
- Keep the markdown design notes for stages 1 to 5
- Expose the priority inbox API for stage 6
- Fetch notifications from the test server
- Use the logging middleware in every function

Endpoints:
- `GET /notifications`
- `GET /notifications/priority?n=10`

Run:
1. Add `TOKEN` in `.env`
2. `npm install`
3. `npm run dev`
