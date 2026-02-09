# API Contract

Base URL: `/api`

All endpoints return JSON. Timestamps follow ISO 8601 format (`YYYY-MM-DDTHH:mm:ssZ`).

---

## 1. GET /api/agents

List all agents with optional filters and pagination.

**Query Parameters:**

| Param    | Type   | Default    | Required | Description                                      |
|----------|--------|------------|----------|--------------------------------------------------|
| chain_id | number | -          | No       | Filter by chain ID (143 or 10143)                |
| search   | string | -          | No       | Full-text search by agent name or description    |
| category | string | -          | No       | Filter by service category (e.g., "Legal", "DeFi") |
| sort     | string | `"recent"` | No       | Sort order: `"recent"`, `"score"`, `"name"`      |
| page     | number | 1          | No       | Page number (1-indexed)                          |
| limit    | number | 20         | No       | Items per page (max: 100)                        |

**Response: `200 OK`**

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
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

**Sort Behavior:**
- `recent` -- Ordered by `created_at` descending (newest first)
- `score` -- Ordered by `reputation_score` descending (highest first)
- `name` -- Ordered by `name` ascending (alphabetical)

**Notes:**
- `search` performs a case-insensitive match against the `name` and `description` fields.
- When `chain_id` is omitted, agents from all chains are returned.
- The `categories` field on each agent is derived from the agent's metadata.

---

## 2. GET /api/agents/:id

Get full detail for a single agent.

**Path Parameters:**

| Param | Type   | Description                                       |
|-------|--------|---------------------------------------------------|
| id    | string | Composite ID in the format `{chain_id}-{agent_id}` (e.g., `"143-1"`) |

**Response: `200 OK`**

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

**Error: `404 Not Found`**

```json
{
  "error": "Not found",
  "message": "Agent with id 143-999 not found",
  "status": 404
}
```

**Notes:**
- The `metadata` field contains the full EIP-8004 agent metadata fetched from the agent's `uri`.
- `positive_feedback_count` and `negative_feedback_count` are computed from feedbacks where `value > 0` and `value <= 0` respectively.

---

## 3. GET /api/agents/:id/reputation

Get reputation history and feedback list for an agent.

**Path Parameters:**

| Param | Type   | Description                                       |
|-------|--------|---------------------------------------------------|
| id    | string | Composite ID in the format `{chain_id}-{agent_id}` |

**Query Parameters:**

| Param | Type   | Default  | Required | Description                              |
|-------|--------|----------|----------|------------------------------------------|
| range | string | `"30d"`  | No       | Time range: `"7d"`, `"30d"`, `"90d"`, `"all"` |

**Response: `200 OK`**

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
      "feedback_hash": "0xabc123...",
      "revoked": false,
      "tx_hash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      "created_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

**Notes:**
- `history` is an array of daily aggregations within the specified range. Each entry contains the cumulative score and total feedback count as of that date.
- `feedbacks` returns the individual feedback records within the specified range, ordered by `created_at` descending.
- `score` in each history entry represents the running average reputation score at that point in time.

---

## 4. GET /api/agents/:id/activity

Get the activity log for an agent, combining identity and reputation events.

**Path Parameters:**

| Param | Type   | Description                                       |
|-------|--------|---------------------------------------------------|
| id    | string | Composite ID in the format `{chain_id}-{agent_id}` |

**Query Parameters:**

| Param      | Type   | Default | Required | Description                                        |
|------------|--------|---------|----------|----------------------------------------------------|
| event_type | string | -       | No       | Filter by category: `"identity"`, `"reputation"`, `"labor"` |
| page       | number | 1       | No       | Page number (1-indexed)                            |
| limit      | number | 20      | No       | Items per page (max: 100)                          |

**Response: `200 OK`**

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
      "id": 5,
      "agent_id": 1,
      "chain_id": 143,
      "event_type": "NewFeedback",
      "event_data": {
        "client": "0xDeF4567890aBcDeF1234567890AbCdEf12345678",
        "feedbackIndex": 0,
        "value": 5,
        "tag1": "quality",
        "tag2": "fast"
      },
      "block_number": 12345700,
      "tx_hash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
      "log_index": 2,
      "created_at": "2025-01-15T10:30:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20
}
```

**Event Type Mapping:**

| Filter Value   | Included Event Types                            |
|----------------|--------------------------------------------------|
| `identity`     | `Registered`, `URIUpdated`, `MetadataSet`        |
| `reputation`   | `NewFeedback`, `FeedbackRevoked`, `ResponseAppended` |
| `labor`        | Reserved for future labor/commission events       |

**Event Data Shapes by Event Type:**

| Event Type         | `event_data` Fields                                                        |
|--------------------|-----------------------------------------------------------------------------|
| `Registered`       | `{ owner, uri }`                                                           |
| `URIUpdated`       | `{ old_uri, new_uri }`                                                     |
| `MetadataSet`      | `{ key, value }`                                                           |
| `NewFeedback`      | `{ client, feedbackIndex, value, tag1, tag2, endpoint }`                   |
| `FeedbackRevoked`  | `{ client, feedbackIndex }`                                                |
| `ResponseAppended` | `{ feedbackIndex, response_uri }`                                          |

**Notes:**
- Activities are ordered by `block_number` descending (most recent first), then by `log_index` descending.
- The `event_data` field is a JSONB column whose shape varies by `event_type` as documented above.
- When `event_type` is omitted, all event types are returned.

---

## 5. GET /api/leaderboard

Get agents ranked by reputation score.

**Query Parameters:**

| Param    | Type   | Default | Required | Description                        |
|----------|--------|---------|----------|------------------------------------|
| chain_id | number | -       | No       | Filter by chain ID (143 or 10143)  |
| category | string | -       | No       | Filter by service category         |
| limit    | number | 50      | No       | Max results to return (max: 100)   |

**Response: `200 OK`**

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
    }
  ]
}
```

**Notes:**
- Agents are ranked by `reputation_score` descending, with `feedback_count` as a tiebreaker (higher count ranks higher).
- `rank` is computed dynamically based on the current filter context (chain/category).
- Only `active` agents are included in the leaderboard.

---

## 6. GET /api/stats

Get global dashboard statistics.

**Query Parameters:** None.

**Response: `200 OK`**

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
- `agents_by_chain` keys are chain IDs as strings.
- `top_categories` is ordered by `count` descending and includes all categories with at least one agent.
- `recent_registrations_24h` and `recent_feedbacks_24h` count events from the last 24 hours relative to the server's current time.

---

## Error Response Format

All error responses follow a consistent structure:

```json
{
  "error": "Short error name",
  "message": "Human-readable description of what went wrong",
  "status": 404
}
```

**Status Codes:**

| Code | Meaning              | When Used                                                  |
|------|----------------------|------------------------------------------------------------|
| 200  | OK                   | Request succeeded                                          |
| 400  | Bad Request          | Invalid query parameters, malformed ID format              |
| 404  | Not Found            | Agent with given ID does not exist                         |
| 500  | Internal Server Error| Unexpected server error (DB failure, upstream error, etc.) |

**Common Error Examples:**

```json
// 400 Bad Request -- invalid sort parameter
{
  "error": "Bad request",
  "message": "Invalid sort parameter: 'popularity'. Allowed values: recent, score, name",
  "status": 400
}

// 400 Bad Request -- malformed agent ID
{
  "error": "Bad request",
  "message": "Invalid agent ID format: 'abc'. Expected format: {chain_id}-{agent_id}",
  "status": 400
}

// 404 Not Found
{
  "error": "Not found",
  "message": "Agent with id 143-999 not found",
  "status": 404
}

// 500 Internal Server Error
{
  "error": "Internal server error",
  "message": "An unexpected error occurred. Please try again later.",
  "status": 500
}
```

---

## CORS Configuration

The API server includes CORS headers to allow requests from the frontend development server:

- **Allowed Origins:** `http://localhost:3000` (development), configurable via `CORS_ORIGINS` environment variable
- **Allowed Methods:** `GET`
- **Allowed Headers:** `Content-Type`

---

## Rate Limiting

No rate limiting is applied during development. Production deployments should consider adding rate limiting via reverse proxy or middleware.
