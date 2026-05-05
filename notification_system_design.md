# Notification System Design

## Stage 1

### Goal
Build clear REST APIs for student notifications (Placement, Result, Event).

### Common Headers
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

### 1) Get all notifications for one student
- Method: `GET`
- URL: `/notifications?studentId=1042&page=1&limit=20`
- Request body: none
- Response:

```json
{
	"page": 1,
	"limit": 20,
	"total": 125,
	"notifications": [
		{
			"id": "uuid-1",
			"studentId": 1042,
			"type": "Placement",
			"message": "Interview scheduled",
			"isRead": false,
			"createdAt": "2026-05-01T09:40:00.000Z"
		}
	]
}
```

### 2) Get top priority notifications
- Method: `GET`
- URL: `/notifications/priority?studentId=1042&n=10`
- Request body: none
- Response:

```json
{
	"count": 10,
	"notifications": []
}
```

### 3) Mark one notification as read
- Method: `PATCH`
- URL: `/notifications/:id/read`
- Request body:

```json
{
	"studentId": 1042
}
```

- Response:

```json
{
	"message": "Notification marked as read"
}
```

### 4) Mark all notifications as read
- Method: `PATCH`
- URL: `/notifications/read-all`
- Request body:

```json
{
	"studentId": 1042
}
```

- Response:

```json
{
	"message": "All notifications marked as read"
}
```

### Real-time mechanism choice
I would use **WebSocket**.

Why:
- One long-lived connection per user.
- Good for instant push updates.
- Better for continuous events compared to polling.
- Less repeated request overhead when many users are online.

## Stage 2

### DB choice
I would use **SQL (PostgreSQL)**.

Why:
- We need strong filtering, sorting, and joins.
- Read/unread state updates should be reliable.
- SQL indexes are very useful for this use case.

### Schema

#### students
- `id BIGINT PRIMARY KEY`
- `name VARCHAR(120)`
- `email VARCHAR(200) UNIQUE`
- `created_at TIMESTAMP`

#### notifications
- `id UUID PRIMARY KEY`
- `notification_type VARCHAR(20)`
- `message TEXT`
- `created_at TIMESTAMP`

#### student_notifications
- `id BIGSERIAL PRIMARY KEY`
- `student_id BIGINT NOT NULL`
- `notification_id UUID NOT NULL`
- `is_read BOOLEAN DEFAULT FALSE`
- `read_at TIMESTAMP NULL`
- `created_at TIMESTAMP`

Indexes:
- `(student_id, is_read, created_at DESC)`
- `(notification_id)`
- `(created_at)`

### What breaks at 50k students and 5M notifications
- Full table scans become slow.
- Large OFFSET pagination becomes slow.
- Repeated same reads can overload DB.

### Fixes
- Add proper composite indexes.
- Use cursor-based pagination instead of large OFFSET.
- Add cache for hot read paths.
- Partition old records by month if data keeps growing.

### Queries for Stage 1 APIs

Get notifications:

```sql
SELECT sn.id,
			 sn.student_id,
			 n.notification_type,
			 n.message,
			 sn.is_read,
			 sn.created_at
FROM student_notifications sn
JOIN notifications n ON n.id = sn.notification_id
WHERE sn.student_id = $1
ORDER BY sn.created_at DESC
LIMIT $2 OFFSET $3;
```

Get priority notifications:

```sql
SELECT sn.id,
			 sn.student_id,
			 n.notification_type,
			 n.message,
			 sn.created_at,
			 (CASE n.notification_type
					WHEN 'Placement' THEN 3
					WHEN 'Result' THEN 2
					ELSE 1
				END) * 1000000000000
			 + EXTRACT(EPOCH FROM sn.created_at) * 1000 AS priority_score
FROM student_notifications sn
JOIN notifications n ON n.id = sn.notification_id
WHERE sn.student_id = $1
ORDER BY priority_score DESC
LIMIT $2;
```

Mark one as read:

```sql
UPDATE student_notifications
SET is_read = TRUE,
		read_at = NOW()
WHERE id = $1
	AND student_id = $2;
```

Mark all as read:

```sql
UPDATE student_notifications
SET is_read = TRUE,
		read_at = NOW()
WHERE student_id = $1
	AND is_read = FALSE;
```

## Stage 3

Slow query:

```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt DESC;
```

### 1) Is it correct?
Not fully. Usually notification text and student read-state are separated.
If schema is split, this query should run on student-notification mapping table.

### 2) Why slow at scale?
- `SELECT *` reads unnecessary columns.
- Missing composite index causes scans and sort work.
- Sorting many rows without index on sort order is expensive.

### 3) What to change?

```sql
SELECT id, student_id, notification_id, is_read, created_at
FROM student_notifications
WHERE student_id = 1042
	AND is_read = FALSE
ORDER BY created_at DESC
LIMIT 50;
```

Create index:

```sql
CREATE INDEX idx_student_read_created
ON student_notifications (student_id, is_read, created_at DESC);
```

Likely impact:
- Query time can drop from seconds to milliseconds for common cases.

### 4) Index every column?
Bad idea.

Why:
- Too many indexes slow INSERT and UPDATE.
- More disk and memory usage.
- Planner may still not use useless indexes.

Only index columns used in real filters, joins, and sorts.

### 5) Students who got Placement in last 7 days

```sql
SELECT DISTINCT sn.student_id
FROM student_notifications sn
JOIN notifications n ON n.id = sn.notification_id
WHERE n.notification_type = 'Placement'
	AND sn.created_at >= NOW() - INTERVAL '7 days';
```

## Stage 4

Problem: DB is hit on every page load.

### Suggested solution
Use a combination:
- Redis cache for latest notifications per student.
- WebSocket push for new notifications.
- Cursor pagination for older data.

### Tradeoffs
- Cache pros: very fast reads, less DB load.
- Cache cons: invalidation complexity.
- WebSocket pros: real-time UX, fewer polling requests.
- WebSocket cons: more connection management on server.
- Cursor pagination pros: stable performance.
- Cursor pagination cons: slightly more complex frontend logic.

## Stage 5

Broken pseudocode issues:
- Fully sequential, very slow for 50k users.
- If email fails midway, process state becomes inconsistent.
- No retry queue.
- No idempotency key, may send duplicates on rerun.

### Should DB save and email be same transaction?
No. External email provider cannot be part of DB transaction.

Better pattern:
- Save in-app notification first in DB.
- Create outbox job rows in same DB transaction.
- Worker sends emails asynchronously from queue.
- Retry failures with backoff and dead-letter queue.

### Revised pseudocode

```text
function notify_all(student_ids, message):
	batch_id = create_batch_id()

	begin_transaction()
		for student_id in student_ids:
			save_in_app_notification(student_id, message, batch_id)
			save_outbox_job(student_id, message, batch_id, status='pending')
	commit_transaction()

	enqueue_outbox_jobs(batch_id)

worker process_email_job(job):
	if already_sent(job.idempotency_key):
		mark_done(job)
		return

	result = send_email(job.student_id, job.message)

	if result.success:
		mark_done(job)
	else:
		retry_with_backoff(job)
		if retries_exhausted(job):
			move_to_dead_letter(job)
```

## Stage 6

Priority inbox in code uses:

### 1) Priority score
- Placement weight = 3
- Result weight = 2
- Event weight = 1
- Final score:

```text
score = (weight * 1000000000000) + timestamp_ms
```

This gives strong type priority while still preferring newer items inside same type.

### 2) Why min-heap for top N
- Keep a min-heap of size `N`.
- For each new notification:
	- push if heap size < N
	- else compare with heap root (smallest in top N)
	- replace root only if new score is higher
- Complexity: `O(M log N)` for `M` notifications, better than sorting everything when `N` is small.

### 3) Handling incoming notifications
- For each new notification event, compute score.
- Apply same heap rule to update top N incrementally.
- This avoids reprocessing all old notifications each time.
