# API Reference

Complete reference for the NAD-8004 Dashboard REST API.

---

## Base URL

```
http://localhost:8080/api
```

All endpoints are prefixed with `/api`. Responses are returned as JSON. Timestamps follow ISO 8601 format (`YYYY-MM-DDTHH:mm:ssZ`).

## Authentication

The API is currently read-only and does not require authentication. All endpoints accept `GET` requests only.

## CORS

- **Allowed Origins:** `http://localhost:3000` (configurable via `CORS_ORIGINS` env var)
- **Allowed Methods:** `GET`
- **Allowed Headers:** `Content-Type`

---

## Endpoints

### 1. List Agents

```
GET /api/agents
```

Returns a paginated list of agents with optional filtering and sorting.

**Query Parameters:**

| Param      | Type   | Default    | Description                                          |
|------------|--------|------------|------------------------------------------------------|
| `chain_id` | number | --         | Filter by chain ID (`143` or `10143`)                |
| `search`   | string | --         | Case-insensitive search on agent name and description |
| `category` | string | --         | Filter by service category (e.g., `Legal`, `DeFi`)   |
| `sort`     | string | `recent`   | Sort order: `recent`, `score`, `name`                |
| `page`     | number | `1`        | Page number (1-indexed)                              |
| `limit`    | number | `20`       | Items per page (max: `100`)                          |

**Sort Behavior:**

| Value    | Description                                  |
|----------|----------------------------------------------|
| `recent` | Ordered by `created_at` descending (newest)  |
| `score`  | Ordered by `reputation_score` descending     |
| `name`   | Ordered by `name` ascending (alphabetical)   |

**Example Request:**

```bash
curl "http://localhost:8080/api/agents?search=legal&sort=score&limit=10"
```

**Example Response: `200 OK`**

```json
{
  "agents": [
    {
      "agent_id": 1,
      "chain_id": 143,
      "owner": "0xAbC1234567890dEf1234567890AbCdEf12345678",
      "name": "LegalBot",
      "description": "AI legal assistant providing contract review and compliance checks",
      "image": "https://example.com/agents/legalbot.png",
      "categories": ["Legal"],
      "x402_support": true,
      "active": true,
      "reputation_score": 4.5,
      "feedback_count": 12,
      "created_at": "2025-01-01T00:00:00Z"
    },
    {
      "agent_id": 7,
      "chain_id": 143,
      "owner": "0x1111222233334444555566667777888899990000",
      "name": "ComplianceAI",
      "description": "Regulatory compliance and legal document analysis agent",
      "image": "https://example.com/agents/complianceai.png",
      "categories": ["Legal", "DeFi"],
      "x402_support": false,
      "active": true,
      "reputation_score": 4.2,
      "feedback_count": 8,
      "created_at": "2025-02-10T14:30:00Z"
    }
  ],
  "total": 2,
  "page": 1,
  "limit": 10
}
```

**Notes:**
- When `chain_id` is omitted, agents from all chains are returned.
- The `categories` field is derived from the agent's on-chain metadata.

---

### 2. Get Agent Detail

```
GET /api/agents/:id
```

Returns full details for a single agent.

**Path Parameters:**

| Param | Type   | Description                                                     |
|-------|--------|-----------------------------------------------------------------|
| `id`  | string | Composite ID in the format `{chain_id}-{agent_id}` (e.g., `143-1`) |

**Example Request:**

```bash
curl "http://localhost:8080/api/agents/143-1"
```

**Example Response: `200 OK`**

```json
{
  "agent_id": 1,
  "chain_id": 143,
  "owner": "0xAbC1234567890dEf1234567890AbCdEf12345678",
  "uri": "https://example.com/agents/1/metadata.json",
  "name": "LegalBot",
  "description": "AI legal assistant providing contract review and compliance checks",
  "image": "https://example.com/agents/legalbot.png",
  "categories": ["Legal"],
  "x402_support": true,
  "active": true,
  "metadata": {
    "version": "1.0",
    "endpoints": [
      {
        "url": "https://api.legalbot.ai/v1",
        "protocol": "x402"
      }
    ],
    "capabilities": ["contract-review", "legal-research", "compliance-audit"]
  },
  "reputation_score": 4.5,
  "feedback_count": 12,
  "positive_feedback_count": 10,
  "negative_feedback_count": 2,
  "created_at": "2025-01-01T00:00:00Z"
}
```

**Error Response: `404 Not Found`**

```bash
curl "http://localhost:8080/api/agents/143-999"
```

```json
{
  "error": "Not found",
  "message": "Agent with id 143-999 not found",
  "status": 404
}
```

**Error Response: `400 Bad Request`**

```bash
curl "http://localhost:8080/api/agents/invalid-id"
```

```json
{
  "error": "Bad request",
  "message": "Invalid agent ID format: 'invalid-id'. Expected format: {chain_id}-{agent_id}",
  "status": 400
}
```

**Notes:**
- The `metadata` field contains the full EIP-8004 agent metadata fetched from the agent's `uri`.
- `positive_feedback_count` counts feedbacks where `value > 0`; `negative_feedback_count` counts feedbacks where `value <= 0`.

---

### 3. Get Agent Reputation

```
GET /api/agents/:id/reputation
```

Returns reputation history and individual feedback records for an agent.

**Path Parameters:**

| Param | Type   | Description                                                     |
|-------|--------|-----------------------------------------------------------------|
| `id`  | string | Composite ID in the format `{chain_id}-{agent_id}`             |

**Query Parameters:**

| Param   | Type   | Default | Description                                     |
|---------|--------|---------|-------------------------------------------------|
| `range` | string | `30d`   | Time range: `7d`, `30d`, `90d`, `all`           |

**Example Request:**

```bash
curl "http://localhost:8080/api/agents/143-1/reputation?range=7d"
```

**Example Response: `200 OK`**

```json
{
  "agent_id": 1,
  "chain_id": 143,
  "current_score": 4.5,
  "history": [
    {
      "date": "2025-01-15",
      "score": 4.2,
      "feedback_count": 3
    },
    {
      "date": "2025-01-16",
      "score": 4.3,
      "feedback_count": 5
    },
    {
      "date": "2025-01-17",
      "score": 4.5,
      "feedback_count": 7
    }
  ],
  "feedbacks": [
    {
      "id": 1,
      "agent_id": 1,
      "chain_id": 143,
      "client_address": "0xDeF4567890aBcDeF1234567890AbCdEf12345678",
      "feedback_index": 0,
      "value": 5,
      "value_decimals": 0,
      "tag1": "quality",
      "tag2": "fast",
      "endpoint": "https://api.legalbot.ai/v1",
      "feedback_uri": "https://example.com/feedback/1.json",
      "feedback_hash": "0xabc123def456789012345678901234567890abcdef123456789012345678abcdef",
      "revoked": false,
      "tx_hash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      "created_at": "2025-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "agent_id": 1,
      "chain_id": 143,
      "client_address": "0x9876543210FeDcBa9876543210FeDcBa98765432",
      "feedback_index": 1,
      "value": 4,
      "value_decimals": 0,
      "tag1": "reliable",
      "tag2": "accurate",
      "endpoint": "https://api.legalbot.ai/v1",
      "feedback_uri": "https://example.com/feedback/2.json",
      "feedback_hash": "0xdef456789012345678901234567890abcdef123456789012345678abcdef012345",
      "revoked": false,
      "tx_hash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
      "created_at": "2025-01-16T08:15:00Z"
    }
  ]
}
```

**Notes:**
- `history` contains daily aggregations within the specified range. Each entry shows the cumulative score and total feedback count as of that date.
- `feedbacks` returns individual feedback records, ordered by `created_at` descending.
- `score` in each history entry is the running average reputation score at that point in time.

---

### 4. Get Agent Activity

```
GET /api/agents/:id/activity
```

Returns the activity log for an agent, combining identity and reputation events.

**Path Parameters:**

| Param | Type   | Description                                                     |
|-------|--------|-----------------------------------------------------------------|
| `id`  | string | Composite ID in the format `{chain_id}-{agent_id}`             |

**Query Parameters:**

| Param        | Type   | Default | Description                                              |
|--------------|--------|---------|----------------------------------------------------------|
| `event_type` | string | --      | Filter: `identity`, `reputation`, `labor`                |
| `page`       | number | `1`     | Page number (1-indexed)                                  |
| `limit`      | number | `20`    | Items per page (max: `100`)                              |

**Event Type Mapping:**

| Filter Value   | Included Event Types                                      |
|----------------|-----------------------------------------------------------|
| `identity`     | `Registered`, `URIUpdated`, `MetadataSet`                 |
| `reputation`   | `NewFeedback`, `FeedbackRevoked`, `ResponseAppended`      |
| `labor`        | Reserved for future labor/commission events                |

**Example Request:**

```bash
curl "http://localhost:8080/api/agents/143-1/activity?event_type=identity&limit=5"
```

**Example Response: `200 OK`**

```json
{
  "activities": [
    {
      "id": 1,
      "agent_id": 1,
      "chain_id": 143,
      "event_type": "Registered",
      "event_data": {
        "owner": "0xAbC1234567890dEf1234567890AbCdEf12345678",
        "uri": "https://example.com/agents/1/metadata.json"
      },
      "block_number": 12345678,
      "tx_hash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      "log_index": 0,
      "created_at": "2025-01-01T00:00:00Z"
    },
    {
      "id": 3,
      "agent_id": 1,
      "chain_id": 143,
      "event_type": "URIUpdated",
      "event_data": {
        "old_uri": "https://example.com/agents/1/metadata.json",
        "new_uri": "https://example.com/agents/1/metadata-v2.json"
      },
      "block_number": 12346000,
      "tx_hash": "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
      "log_index": 1,
      "created_at": "2025-01-10T12:00:00Z"
    }
  ],
  "total": 2,
  "page": 1,
  "limit": 5
}
```

**Event Data Shapes:**

| Event Type         | `event_data` Fields                                                    |
|--------------------|------------------------------------------------------------------------|
| `Registered`       | `{ owner, uri }`                                                       |
| `URIUpdated`       | `{ old_uri, new_uri }`                                                 |
| `MetadataSet`      | `{ key, value }`                                                       |
| `NewFeedback`      | `{ client, feedbackIndex, value, tag1, tag2, endpoint }`               |
| `FeedbackRevoked`  | `{ client, feedbackIndex }`                                            |
| `ResponseAppended` | `{ feedbackIndex, response_uri }`                                      |

**Notes:**
- Activities are ordered by `block_number` descending, then by `log_index` descending.
- When `event_type` is omitted, all event types are returned.

---

### 5. Leaderboard

```
GET /api/leaderboard
```

Returns agents ranked by reputation score.

**Query Parameters:**

| Param      | Type   | Default | Description                                    |
|------------|--------|---------|------------------------------------------------|
| `chain_id` | number | --      | Filter by chain ID (`143` or `10143`)          |
| `category` | string | --      | Filter by service category                     |
| `limit`    | number | `50`    | Max results to return (max: `100`)             |

**Example Request:**

```bash
curl "http://localhost:8080/api/leaderboard?chain_id=143&limit=3"
```

**Example Response: `200 OK`**

```json
{
  "leaderboard": [
    {
      "rank": 1,
      "agent_id": 1,
      "chain_id": 143,
      "name": "LegalBot",
      "image": "https://example.com/agents/legalbot.png",
      "categories": ["Legal"],
      "x402_support": true,
      "reputation_score": 4.9,
      "feedback_count": 50,
      "owner": "0xAbC1234567890dEf1234567890AbCdEf12345678"
    },
    {
      "rank": 2,
      "agent_id": 3,
      "chain_id": 143,
      "name": "DeFiOracle",
      "image": "https://example.com/agents/defioracle.png",
      "categories": ["DeFi", "Trading"],
      "x402_support": true,
      "reputation_score": 4.7,
      "feedback_count": 38,
      "owner": "0x9876543210FeDcBa9876543210FeDcBa98765432"
    },
    {
      "rank": 3,
      "agent_id": 5,
      "chain_id": 143,
      "name": "ArbitrageEngine",
      "image": "https://example.com/agents/arbitrage.png",
      "categories": ["Arbitrage", "DeFi"],
      "x402_support": false,
      "reputation_score": 4.5,
      "feedback_count": 22,
      "owner": "0xAaBbCcDdEeFf00112233445566778899AaBbCcDd"
    }
  ]
}
```

**Notes:**
- Agents are ranked by `reputation_score` descending, with `feedback_count` as a tiebreaker (higher count ranks first).
- `rank` is computed dynamically based on the current filter context.
- Only active agents are included.

---

### 6. Dashboard Statistics

```
GET /api/stats
```

Returns global dashboard statistics. No query parameters.

**Example Request:**

```bash
curl "http://localhost:8080/api/stats"
```

**Example Response: `200 OK`**

```json
{
  "total_agents": 150,
  "total_feedbacks": 1200,
  "total_chains": 2,
  "agents_by_chain": {
    "143": 100,
    "10143": 50
  },
  "top_categories": [
    { "category": "Legal", "count": 30 },
    { "category": "DeFi", "count": 25 },
    { "category": "Trading", "count": 20 },
    { "category": "Design", "count": 15 },
    { "category": "Arbitrage", "count": 10 }
  ],
  "recent_registrations_24h": 5,
  "recent_feedbacks_24h": 15
}
```

**Notes:**
- `agents_by_chain` uses chain IDs as string keys.
- `top_categories` is ordered by `count` descending and includes all categories with at least one agent.
- `recent_registrations_24h` and `recent_feedbacks_24h` reflect events from the last 24 hours.

---

## Error Responses

All errors follow a consistent JSON structure:

```json
{
  "error": "Short error name",
  "message": "Human-readable description of what went wrong",
  "status": 404
}
```

### Status Codes

| Code | Meaning                | When Used                                                        |
|------|------------------------|------------------------------------------------------------------|
| 200  | OK                     | Request succeeded                                                |
| 400  | Bad Request            | Invalid query parameters or malformed ID format                  |
| 404  | Not Found              | Agent with the given ID does not exist                           |
| 500  | Internal Server Error  | Unexpected server error (database failure, upstream error, etc.) |

### Error Examples

**400 -- Invalid sort parameter:**

```bash
curl "http://localhost:8080/api/agents?sort=popularity"
```

```json
{
  "error": "Bad request",
  "message": "Invalid sort parameter: 'popularity'. Allowed values: recent, score, name",
  "status": 400
}
```

**400 -- Malformed agent ID:**

```bash
curl "http://localhost:8080/api/agents/abc"
```

```json
{
  "error": "Bad request",
  "message": "Invalid agent ID format: 'abc'. Expected format: {chain_id}-{agent_id}",
  "status": 400
}
```

**404 -- Agent not found:**

```bash
curl "http://localhost:8080/api/agents/143-999"
```

```json
{
  "error": "Not found",
  "message": "Agent with id 143-999 not found",
  "status": 404
}
```

**500 -- Internal server error:**

```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred. Please try again later.",
  "status": 500
}
```

---

## Pagination

Endpoints that return lists (`/api/agents`, `/api/agents/:id/activity`) support pagination:

- `page` -- Page number, 1-indexed. Defaults to `1`.
- `limit` -- Items per page. Defaults to `20` (max: `100`).

Paginated responses include `total`, `page`, and `limit` fields alongside the data array.

**Example:**

```bash
# Get page 2 with 10 items per page
curl "http://localhost:8080/api/agents?page=2&limit=10"
```

The `/api/leaderboard` endpoint uses `limit` only (no pagination offset); it returns the top N agents.

---

## Sorting

The `/api/agents` endpoint supports sorting via the `sort` query parameter:

| Value    | Description                                  |
|----------|----------------------------------------------|
| `recent` | Newest first (`created_at` descending)       |
| `score`  | Highest reputation first                     |
| `name`   | Alphabetical order (A-Z)                     |

If an invalid sort value is provided, a `400 Bad Request` error is returned.

---

## Filtering

Multiple filters can be combined:

```bash
# Agents on Monad Mainnet in the DeFi category, sorted by score
curl "http://localhost:8080/api/agents?chain_id=143&category=DeFi&sort=score"

# Leaderboard for Legal agents only
curl "http://localhost:8080/api/leaderboard?category=Legal"

# Activity log filtered to reputation events
curl "http://localhost:8080/api/agents/143-1/activity?event_type=reputation"
```

When filter parameters are omitted, no filtering is applied (all results are returned).

---

## Rate Limiting

No rate limiting is applied during development. Production deployments should consider adding rate limiting via a reverse proxy or middleware.
