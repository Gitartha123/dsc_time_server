## Purpose

This file guides AI coding agents to be immediately productive in the dsc_time_server repository.

## Big picture

- Service type: small Express.js microservice that provides time-signing and license-protected endpoints.
- Main entry: `server.js` which loads `src/app.js` and `src/config/db.js`.
- HTTP surface: routes under `/api/*` defined in `src/routes/*` (auth, time, sign).

## Key components & data flow

- Routing: `src/app.js` wires routes. Example: `app.use("/api/time", require("./routes/time.routes"))`.
- Controllers: each route calls a controller in `src/controllers/*`. Controllers export async functions (e.g. `getServerTime` in `src/controllers/time.controller.js`).
- Auth flow: `src/middlewares/auth.js` expects the JWT token in `Authorization` header (raw token string). It verifies via `process.env.JWT_SECRET`, loads the `Token` doc (`src/models/Token.js`), attaches `req.tokenDoc` for downstream controllers (see `sign.controller.js`).
- Time signing: `src/controllers/time.controller.js` HMACs the JSON payload using `process.env.TIME_SIGN_SECRET` (sha256), returning `{server_time, epoch, signature}`.
- Persistence: MongoDB via `src/config/db.js`; model is `tokens` in `src/models/Token.js` with fields like `maxSigns`, `usedSigns`, `validTill`, `active`.

## Environment & secrets

- Primary env file: `.env` / `env` used for local runs. Required vars: `PORT`, `MONGO_URI`, `JWT_SECRET`, `TIME_SIGN_SECRET`.
- Note: `TIME_SIGN_SECRET` is used to HMAC time payloads (see `src/controllers/time.controller.js`). Do not expose this value publicly.

## Developer workflows

- Run locally: `npm run dev` (uses `nodemon server.js`). Production: `npm start`.
- DB: code connects to Mongo at `mongodb://127.0.0.1:27017/dsc` in `src/config/db.js`. Ensure Mongo is running for integration.

## Project-specific conventions

- Token & auth conventions:
  - `generateAuthToken` (in `src/controllers/auth.controller.js`) finds an existing `Token` DB record (by `name`, `email`, `machineHash`) and returns a short-lived JWT (12h). The DB record is the source-of-truth for license validity.
  - The `auth` middleware validates the JWT and then re-checks the Token document to enforce revocation/expiry.
  - `sign.controller.registerSign` expects `req.tokenDoc` (set by middleware) and increments `usedSigns`—signing is rate/usage-limited by `maxSigns`.
- Route/middleware pattern: routes wire middleware then controllers: `router.get('/', auth, controller.getServerTime)`.
- Error responses: controllers/middleware return small JSON `{ msg: "..." }` and appropriate HTTP status codes; follow existing style.

## Integration & extension points

- To add a new protected route: 1) add `src/routes/<name>.routes.js`, 2) create `src/controllers/<name>.controller.js`, 3) if protection needed add `auth` middleware.
- If you need a new secret for signatures, add to env and reference via `process.env` at the call site.

## Quick examples (copyable)

- Time endpoint: `GET /api/time` (requires Authorization header containing JWT). Uses `TIME_SIGN_SECRET` for HMAC.
- Create an auth token (manual DB record required): controller expects a `Token` record. Inspect `src/models/Token.js` for required fields.

## Notes & gotchas

- `Authorization` header expected is the raw JWT string (not `Bearer <token>`). Follow the existing middleware's check.
- There is currently no HTTP endpoint to create `Token` docs; tokens are expected to be seeded or created externally.
- Keep `JWT_SECRET` and `TIME_SIGN_SECRET` in secure storage; changing them invalidates existing tokens/signatures.

## When in doubt

- Look at `src/controllers/auth.controller.js`, `src/middlewares/auth.js`, and `src/controllers/time.controller.js` for canonical patterns.
- Ask the repo owner whether token creation should be added as an API or seeded via admin tooling.

---
If you'd like, I can adjust wording, add examples with file links, or create a small README showing how to seed a `Token` record.
