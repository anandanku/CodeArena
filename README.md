# CodeArena

A real-time competitive coding platform built to simulate the core experience of a coding contest: authenticated users join timed rooms, solve curated DSA problems, execute code through an external compiler service, and compete on a live Redis-backed leaderboard.

## Why CodeArena

CodeArena focuses on the engineering behind competitive coding systems rather than only the problem-solving UI. It combines authentication, room lifecycle management, database-backed problem data, external code execution, Redis state, scoring, and live leaderboards in a single full-stack application.

## Core Features

- Google OAuth authentication with persistent sessions.
- Difficulty-based contest rooms with unique 6-character room codes.
- Timed contests with configurable waiting periods and difficulty-based durations.
- Curated DSA problems with constraints, examples, starter snippets, and test cases.
- C++ code execution through an external compiler API with execution status, time, memory, and error reporting.
- Live scoring using Redis sorted sets with automatic leaderboard expiration.
- MongoDB persistence for users and problem data.
- Redis-backed contest state with TTL-based expiration.
- Modular Express backend with dedicated authentication, room, problem, submission, leaderboard, and health-check routes.

## Architecture

```text
Browser
  |
  v
Express API
  |-------- Google OAuth / Sessions --------> MongoDB
  |
  |-------- Users / Problems ---------------> MongoDB
  |
  |-------- Rooms / Leaderboards ------------> Redis
  |
  `-------- Code Submission ----------------> Compiler API
                                                   |
                                                   v
                                            Execution Result
                                                   |
                                                   v
                                         Score + Live Leaderboard
```

## Tech Stack

**Backend:** Node.js, Express.js, Passport.js  
**Frontend:** HTML, CSS, JavaScript, Monaco Editor  
**Database:** MongoDB, Mongoose  
**Caching & State:** Redis  
**Authentication:** Google OAuth 2.0, Express Session  
**Code Execution:** Online Compiler API

## Contest Flow

1. Authenticate with Google and create or join a contest room.
2. Generate a difficulty-based problem set and store room state in Redis with TTL.
3. Retrieve problems and solve them in the browser-based coding environment.
4. Submit code to the compiler API and receive execution results.
5. Update the participant score based on submission correctness and difficulty.
6. Maintain the live leaderboard with Redis sorted sets until the room expires.

## Project Structure

```text
CodeArena/
├── backend/
│   ├── auth.js              # Google OAuth and sessions
│   ├── createroom.js        # Contest room creation and lifecycle
│   ├── joinroom.js          # Contest participation
│   ├── problems.js          # Problem retrieval
│   ├── problemschema.js     # Problem model
│   ├── submitions.js        # Code execution and submissions
│   ├── leaderboard.js       # Scoring and leaderboard updates
│   ├── liveleaderboard.js   # Live leaderboard API
│   ├── redisconnection.js   # Redis client
│   ├── userschema.js        # User model
│   └── index.js             # Express entry point
└── frontend/
    ├── public/              # Authentication UI
    └── private/             # Contest and authenticated UI
```

## Getting Started

### Prerequisites

- Node.js
- MongoDB / MongoDB Atlas
- Redis
- Google OAuth credentials
- Online Compiler API key

### Install

```bash
git clone https://github.com/anandanku/CodeArena.git
cd CodeArena/backend
npm install
```

Configure the required environment variables for MongoDB, Redis, Google OAuth, sessions, and the compiler API, then run:

```bash
npm start
```

## Engineering Highlights

Authentication, REST API design, MongoDB schema modeling, Redis data structures and TTLs, external API integration, contest-state management, scoring logic, and modular backend architecture are implemented as first-class system components.

## Status

Actively developed, with scope for broader language support, richer contest analytics, stronger submission validation, and expanded real-time features.

## Author

Ayush Anand | NIT Raipur
