# SkillSwap

SkillSwap is a peer-to-peer skill exchange platform built with the MERN stack.

## Current Starter

- React/Vite landing page
- Signup and login screens
- Express authentication API
- MongoDB Atlas connection with Mongoose
- JWT-based session storage
- MVC-style project organization
- Skill Portfolio Showcase feature with real CRUD create/list/delete flow

## MVC Structure

Backend:

- `server/src/models` contains Mongoose data models.
- `server/src/controllers` contains request/response logic.
- `server/src/routes` maps HTTP endpoints to controllers.
- `server/src/middleware` contains shared request middleware and error handling.
- `server/src/app.js` configures the Express app.
- `server/src/server.js` only connects MongoDB and starts the server.

Frontend view layer:

- `client/src/pages` contains page-level views.
- `client/src/components` contains reusable UI components.
- `client/src/api` contains API calls to the backend.
- `client/src/App.jsx` controls which view is shown and manages auth state.

## Portfolio Showcase API

- `POST /api/portfolio` creates a portfolio item for the logged-in user.
- `GET /api/portfolio/mine` lists the logged-in user's portfolio items.
- `GET /api/portfolio/public` lists public portfolio items.
- `DELETE /api/portfolio/:id` deletes one of the logged-in user's portfolio items.

## Member 2 Feature Lane

- AI-powered skill matching engine
- Session scheduling and calendar integration
- Skill portfolio and showcase feed
- Trust score and review system

## Run Locally

```bash
npm install
npm run dev
```

The client runs on `http://localhost:5173` and the API runs on `http://localhost:5000`.
