const axios = require("axios");
const { Log } = require("../../../logging_middleware/log");
const { buildAuthHeaders } = require("../middleware/auth.middleware");

const NOTIFICATIONS_URL = "http://20.207.122.201/evaluation-service/notifications";

async function fetchNotificationsFromApi() {
  await Log("backend", "info", "controller", "Calling notifications API");
  const response = await axios.get(NOTIFICATIONS_URL, { headers: buildAuthHeaders() });
  const notifications = Array.isArray(response.data.notifications)
    ? response.data.notifications
    : [];
  await Log("backend", "info", "controller", `Notifications API returned ${notifications.length} records`);
  return notifications;
}

async function getTypeWeight(type) {
  await Log("backend", "debug", "utils", `Calculating weight for type ${type}`);

  if (type === "Placement") {
    return 3;
  }

  if (type === "Result") {
    return 2;
  }

  return 1;
}

async function calculatePriorityScore(notification) {
  await Log("backend", "debug", "utils", `Calculating score for notification ${notification.ID}`);
  const weight = await getTypeWeight(notification.Type);
  const timestampMs = new Date(notification.Timestamp).getTime();
  return (weight * 1000000000000) + timestampMs;
}

async function swap(heap, i, j) {
  await Log("backend", "debug", "utils", `Swapping heap positions ${i} and ${j}`);
  const temp = heap[i];
  heap[i] = heap[j];
  heap[j] = temp;
}

async function bubbleUp(heap, index) {
  await Log("backend", "debug", "utils", "Running bubbleUp on min-heap");

  let currentIndex = index;
  while (currentIndex > 0) {
    const parentIndex = Math.floor((currentIndex - 1) / 2);

    if (heap[parentIndex].score <= heap[currentIndex].score) {
      break;
    }

    await swap(heap, parentIndex, currentIndex);
    currentIndex = parentIndex;
  }
}

async function bubbleDown(heap, index) {
  await Log("backend", "debug", "utils", "Running bubbleDown on min-heap");

  let currentIndex = index;

  while (true) {
    const left = (2 * currentIndex) + 1;
    const right = (2 * currentIndex) + 2;
    let smallest = currentIndex;

    if (left < heap.length && heap[left].score < heap[smallest].score) {
      smallest = left;
    }

    if (right < heap.length && heap[right].score < heap[smallest].score) {
      smallest = right;
    }

    if (smallest === currentIndex) {
      break;
    }

    await swap(heap, currentIndex, smallest);
    currentIndex = smallest;
  }
}

async function heapPush(heap, node) {
  await Log("backend", "debug", "utils", `Pushing notification ${node.notification.ID} into heap`);
  heap.push(node);
  await bubbleUp(heap, heap.length - 1);
}

async function heapReplaceRoot(heap, node) {
  await Log("backend", "debug", "utils", `Replacing heap root with notification ${node.notification.ID}`);
  heap[0] = node;
  await bubbleDown(heap, 0);
}

async function getNotifications(req, res, next) {
  await Log("backend", "info", "controller", "getNotifications handler started");

  try {
    const notifications = await fetchNotificationsFromApi();
    await Log("backend", "info", "controller", "getNotifications handler succeeded");
    res.status(200).json({ notifications });
  } catch (error) {
    await Log("backend", "error", "controller", `getNotifications failed: ${error.message}`);
    next(error);
  }
}

async function getPriorityNotifications(req, res, next) {
  await Log("backend", "info", "controller", "getPriorityNotifications handler started");

  try {
    const requestedN = Number.parseInt(req.query.n, 10);
    const n = Number.isNaN(requestedN) || requestedN <= 0 ? 10 : requestedN;

    await Log("backend", "info", "controller", `Priority notifications requested for top ${n}`);

    const notifications = await fetchNotificationsFromApi();
    const heap = [];

    for (const notification of notifications) {
      const score = await calculatePriorityScore(notification);
      const node = { score, notification };

      if (heap.length < n) {
        await heapPush(heap, node);
      } else if (score > heap[0].score) {
        await heapReplaceRoot(heap, node);
      }
    }

    const prioritized = heap
      .map((item) => item.notification)
      .sort((a, b) => {
        const typeWeight = {
          Placement: 3,
          Result: 2,
          Event: 1,
        };

        const scoreA = (typeWeight[a.Type] || 1) * 1000000000000 + new Date(a.Timestamp).getTime();
        const scoreB = (typeWeight[b.Type] || 1) * 1000000000000 + new Date(b.Timestamp).getTime();

        return scoreB - scoreA;
      });

    await Log(
      "backend",
      "info",
      "controller",
      `getPriorityNotifications handler succeeded with ${prioritized.length} results`,
    );

    res.status(200).json({
      count: prioritized.length,
      notifications: prioritized,
    });
  } catch (error) {
    await Log("backend", "error", "controller", `getPriorityNotifications failed: ${error.message}`);
    next(error);
  }
}

module.exports = {
  getNotifications,
  getPriorityNotifications,
};