# Car Dealership Inventory System — Frontend

The frontend client for the Car Dealership Inventory System, built with React 19, Vite, React Router DOM, Axios, and Tailwind CSS.

## Tech Stack

- **React 19** — functional components + hooks
- **Vite** — build tool and dev server
- **React Router DOM** — client-side routing and route guards
- **Axios** — HTTP client for the backend API
- **Tailwind CSS** — utility-first styling
- **Context API** — used only for authentication state

## Getting Started

1. Install dependencies:

   ```sh
   npm install
   ```

2. Copy `.env.example` to `.env` and set the backend API base URL:

   ```sh
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

3. Start the dev server:

   ```sh
   npm run dev
   ```

4. Build for production:

   ```sh
   npm run build
   ```

5. Lint the project:

   ```sh
   npm run lint
   ```

> The backend server (in `../server`) must be running for auth and vehicle data to load. See the server's README for setup instructions.

## Folder Structure

```
src/
├── api/          Axios instance + API request functions (auth, vehicles)
├── assets/       Static assets
├── components/   Reusable UI building blocks (Button, VehicleCard, Toast, modals, etc.)
├── context/      AuthContext (authentication state, persisted in localStorage)
├── layouts/      Page layout shells (MainLayout: navbar + footer)
├── pages/        Route-level pages (Home, Login, Register, NotFound, vehicles/*)
├── routes/       Route configuration and guards (ProtectedRoute, GuestRoute)
├── utils/        Pure helper functions (validators, formatting, button styles)
├── App.jsx       Root component (providers + router)
└── main.jsx      Application entry point
```

## Key Features

- **Authentication** — register/login backed by JWT, persisted in `localStorage`, restored automatically on page refresh.
- **Protected routes** — unauthenticated users are redirected to `/login`; authenticated users are redirected away from `/login`/`/register`.
- **Vehicle inventory** — browse, search/filter (make, model, category, price range), and purchase vehicles.
- **Owner-based vehicle management** — any authenticated user can list a vehicle for sale; only the vehicle's owner sees Edit/Delete/Restock actions for it, everyone else sees the Purchase action.
- **UX niceties** — toast notifications, loading spinners, confirmation dialogs before destructive actions, empty/error states with retry.

## Notes

- No external state management library is used (no Redux) — all state is local component state or the `AuthContext`.
- Route paths map to backend resources 1:1; see `src/api/` for the exact endpoints called.
