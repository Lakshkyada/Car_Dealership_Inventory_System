# Car Dealership Inventory System

A full-stack application for managing a car dealership's vehicle inventory, with owner-based listings, search/filtering, purchasing, and restocking.

## Project Structure

```
Car_Dealership_Inventory_System/
├── server/   Express + MongoDB (Mongoose) REST API
└── client/   React + Vite frontend
```

See [`server/README.md`](./server/README.md) and [`client/README.md`](./client/README.md) for setup instructions specific to each part.

## Quick Start

1. **Backend** (from `server/`):

   ```sh
   npm install
   npm run dev
   ```

   Configure `server/.env` (see `server/.env.example`) with `MONGODB_URI`, `JWT_SECRET`, `PORT`, and `CLIENT_URL`.

2. **Frontend** (from `client/`):

   ```sh
   npm install
   npm run dev
   ```

   Configure `client/.env` (see `client/.env.example`) with `VITE_API_BASE_URL` pointing at the backend (e.g. `http://localhost:5000/api`).

3. Open the frontend dev server URL printed in the terminal (typically `http://localhost:5173`).

## Core Concepts

- **Authentication** — JWT-based; tokens are issued on login/register and persisted client-side.
- **Owner-based authorization** — any authenticated user can create a vehicle listing. Only the creator (owner) of a vehicle can edit, delete, or restock it; anyone else can only purchase it.
- **Vehicle inventory** — supports search/filtering by make, model, category, and price range.

## Tech Stack

| Layer    | Stack                                                             |
| -------- | ------------------------------------------------------------------ |
| Backend  | Node.js, Express, MongoDB, Mongoose, JWT, bcrypt, Jest + Supertest |
| Frontend | React 19, Vite, React Router DOM, Axios, Tailwind CSS              |
