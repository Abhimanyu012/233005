# Backend

This is the root workspace containing all modules and services for the evaluation project.

## Project Structure

- `logging_middleware`: Custom module for centralizing external API logs.
- `vehicle_maintence_scheduler`: Express Application for scheduling vehicles (using 0/1 knapsack algorithm).
- `notification_app_be`: Express Application for priority notifications (using min-heap algorithm).

## Workspace Scripts

You can run applications directly from this root directory using the scripts defined in the root `package.json`. Make sure you run `npm install` in the respective folders (or globally if using npm workspaces) and add appropriate `.env` files with your `TOKEN`.

### Start Scripts (Production)
- `npm run scheduler:start` - Starts the Vehicle Maintenance Scheduler.
- `npm run notification:start` - Starts the Notification app.

### Dev Scripts (Hot-Reload)
- `npm run scheduler:dev` - Starts the Vehicle Maintenance Scheduler using Nodemon.
- `npm run notification:dev` - Starts the Notification app using Nodemon.

### Utility Scripts
- `npm run logging:check` - Validates the logging module loading without errors.
