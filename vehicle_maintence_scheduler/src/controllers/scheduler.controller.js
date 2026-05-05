const axios = require("axios");
const { Log } = require("../../../logging_middleware/log");
const { buildAuthHeaders } = require("../middleware/auth.middleware");

const DEPOTS_URL = "http://20.207.122.201/evaluation-service/depots";
const VEHICLES_URL = "http://20.207.122.201/evaluation-service/vehicles";

async function fetchDepotsFromApi() {
  await Log("backend", "info", "controller", "Calling depots API");
  const response = await axios.get(DEPOTS_URL, { headers: buildAuthHeaders() });
  const depots = Array.isArray(response.data.depots) ? response.data.depots : [];
  await Log("backend", "info", "controller", `Depots API returned ${depots.length} records`);
  return depots;
}

async function fetchVehiclesFromApi() {
  await Log("backend", "info", "controller", "Calling vehicles API");
  const response = await axios.get(VEHICLES_URL, { headers: buildAuthHeaders() });
  const vehicles = Array.isArray(response.data.vehicles) ? response.data.vehicles : [];
  await Log("backend", "info", "controller", `Vehicles API returned ${vehicles.length} records`);
  return vehicles;
}

async function runKnapsack(items, capacity) {
  await Log("backend", "info", "utils", `Starting knapsack with ${items.length} items and capacity ${capacity}`);

  const n = items.length;
  const dp = Array.from({ length: n + 1 }, () => Array(capacity + 1).fill(0));

  for (let i = 1; i <= n; i += 1) {
    const duration = items[i - 1].Duration;
    const impact = items[i - 1].Impact;

    for (let w = 0; w <= capacity; w += 1) {
      if (duration <= w) {
        const includeValue = impact + dp[i - 1][w - duration];
        const excludeValue = dp[i - 1][w];
        dp[i][w] = Math.max(includeValue, excludeValue);
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }

  const selectedVehicles = [];
  let w = capacity;

  for (let i = n; i > 0 && w >= 0; i -= 1) {
    if (dp[i][w] !== dp[i - 1][w]) {
      selectedVehicles.push(items[i - 1]);
      w -= items[i - 1].Duration;
    }
  }

  selectedVehicles.reverse();

  const totalDuration = selectedVehicles.reduce((sum, item) => sum + item.Duration, 0);
  const totalImpact = selectedVehicles.reduce((sum, item) => sum + item.Impact, 0);

  await Log(
    "backend",
    "info",
    "utils",
    `Knapsack finished with ${selectedVehicles.length} selected vehicles`,
  );

  return {
    selectedVehicles,
    totalDuration,
    totalImpact,
  };
}

async function getDepots(req, res, next) {
  await Log("backend", "info", "controller", "getDepots handler started");

  try {
    const depots = await fetchDepotsFromApi();
    await Log("backend", "info", "controller", "getDepots handler succeeded");
    res.status(200).json({ depots });
  } catch (error) {
    await Log("backend", "error", "controller", `getDepots failed: ${error.message}`);
    next(error);
  }
}

async function getVehicles(req, res, next) {
  await Log("backend", "info", "controller", "getVehicles handler started");

  try {
    const vehicles = await fetchVehiclesFromApi();
    await Log("backend", "info", "controller", "getVehicles handler succeeded");
    res.status(200).json({ vehicles });
  } catch (error) {
    await Log("backend", "error", "controller", `getVehicles failed: ${error.message}`);
    next(error);
  }
}

async function runSchedule(req, res, next) {
  await Log("backend", "info", "controller", "runSchedule handler started");

  try {
    const depots = await fetchDepotsFromApi();
    const vehicles = await fetchVehiclesFromApi();

    const schedules = [];

    for (const depot of depots) {
      await Log(
        "backend",
        "info",
        "controller",
        `Running optimization for depot ${depot.ID} with hours ${depot.MechanicHours}`,
      );

      const result = await runKnapsack(vehicles, depot.MechanicHours);

      schedules.push({
        depotId: depot.ID,
        mechanicHours: depot.MechanicHours,
        totalDurationUsed: result.totalDuration,
        totalImpact: result.totalImpact,
        selectedVehicles: result.selectedVehicles,
      });
    }

    await Log("backend", "info", "controller", "runSchedule handler succeeded");
    res.status(200).json({ schedules });
  } catch (error) {
    await Log("backend", "error", "controller", `runSchedule failed: ${error.message}`);
    next(error);
  }
}

module.exports = {
  getDepots,
  getVehicles,
  runSchedule,
};