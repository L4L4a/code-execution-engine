<div align="center">

<img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Rocket.png" alt="Rocket" width="80" />

# Code Execution Engine

**Sandboxed code execution engine — the same architecture powering LeetCode's "Run Code" button.**

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)

</div>

---

## What is this?

A backend service that safely executes untrusted code submissions inside isolated Docker containers — the same pattern used by LeetCode, HackerRank, and Codeforces.

Each submission runs in a fresh container with no internet access, limited CPU and memory, and a hard timeout. The host machine is completely protected.

---

## Features

- 🐳 **Docker sandboxing** — every submission runs in an isolated container
- 🌐 **Multi-language** — JavaScript (Node.js) and Python 3 supported
- ⏱️ **Execution timeout** — containers killed after configurable time limit
- 🧱 **Resource limits** — CPU and memory capped per container
- 🔒 **No network access** — containers run with `--network none`
- 📊 **Async polling** — submit code, poll for results by job ID
- ⚡ **Execution time tracking** — returns ms elapsed for each run

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript |
| Server | Node.js, Express |
| Sandboxing | Docker |
| Supported Languages | JavaScript (Node 18), Python 3.11 |
| Job Queue | In-memory queue |

---

## Architecture

Each code submission goes through a sandboxed execution pipeline:

```
POST /execute
      │
      ▼
Encode code as base64
      │
      ▼
Spin up Docker container
--network none
--memory 128m
--cpus 0.5
      │
      ▼
Decode + run inside container
      │
   ┌──┴──┐
   │     │
Success Timeout/Error
   │     │
   └──┬──┘
      ▼
Save result by job ID
      │
      ▼
GET /result/:id
```

Code is base64-encoded before being passed to the container to avoid shell escaping issues. Containers are automatically removed after execution with `--rm`.

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check + supported languages |
| POST | `/execute` | Submit code for execution |
| GET | `/result/:id` | Poll for execution result |

**Submit code:**
```bash
curl -X POST http://localhost:3001/execute \
  -H "Content-Type: application/json" \
  -d '{"language": "javascript", "code": "console.log(\"hello world\")"}'
```

**Poll for result:**
```bash
curl http://localhost:3001/result/:id
```

**Example response:**
```json
{
  "id": "abc-123",
  "status": "completed",
  "stdout": "hello world",
  "stderr": "",
  "executionTime": 177,
  "language": "javascript",
  "completedAt": "2026-07-17T19:31:20.201Z"
}
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Docker Desktop running

### Setup

```bash
git clone https://github.com/L4L4a/code-execution-engine.git
cd code-execution-engine
npm install
```

Pull Docker images:
```bash
docker pull node:18-alpine
docker pull python:3.11-alpine
```

Create a `.env` file:
```env
PORT=3001
EXECUTION_TIMEOUT=10
MAX_MEMORY=128m
```

```bash
npm run dev
```

---

<div align="center">

Built by [Elvis Kenneth](https://github.com/L4L4a)

</div>