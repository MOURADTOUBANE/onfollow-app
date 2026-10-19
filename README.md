# JobTracker dashboard (Next.js)

Next.js 15 (App Router) + React 19 + TypeScript. **No Bootstrap and no UI library**: the design system is plain
CSS in `src/styles/` (violet + white, rounded shapes, flat colours, no gradients, custom icon set and illustrations).

```bash
npm install
npm run dev        # http://localhost:3000
```

Log in with an account from the Laravel API (`POST /api/register` or `POST /api/login`).

---

## Where do the API calls go?

**Everything that talks to the backend lives in `src/lib/api/`.** Components never call `fetch` themselves.

### 1. Point the frontend at Laravel

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

The app always calls Laravel. Set `NEXT_PUBLIC_API_URL` to your API base (no trailing slash).

### 2. File map

| File | What to do there |
|---|---|
| `src/lib/api/config.ts` | API base URL. |
| `src/lib/api/http.ts` | The fetch wrapper. **Auth strategy lives here** (Bearer token by default, Sanctum cookie alternative explained in the comment). Also maps Laravel error JSON to `ApiError`. |
| `src/lib/api/mappers.ts` | **The only file that knows your JSON shape.** If a field is named differently in your API Resources, change it here. |
| `src/lib/api/auth.ts` | `register`, `login`, `me`, `logout`, `resendVerification`. |
| `src/lib/api/applications.ts` | `list`, `get` (with events), `create`, `update`, `remove`, `setStatus`. |
| `src/lib/api/followups.ts` | `list`, `create`, `update` (complete / cancel / reschedule). |
| `src/lib/types.ts` | The TypeScript shapes the UI works with (after the mappers). |
| `src/lib/status.ts` | `TRANS`: client-side copy of your status transition map. |
| `src/lib/validation.ts` | `RULES`: client-side copy of `StoreApplicationRequest` / `UpdateApplicationRequest`. |

### 3. Endpoints the UI expects (adjust in `src/lib/api/*`)

| UI action | Call | Notes |
|---|---|---|
| Register | `POST /register` | 422 `{ errors: { email: [...] } }` is shown under the fields. |
| Login | `POST /login` | 200 `{ token, user }`, 401 wrong credentials, **403 `{ error: "email_not_verified" }`** shows the "check your inbox" state. |
| Restore session | `GET /me` | Called on every full page load. 401 = logged out. |
| Logout | `POST /logout` | |
| Resend verification | `POST /email/verification-notification` | |
| List / filters / pagination | `GET /applications?status&source&search&applied_from&applied_to&limit&offset` | Answer needs `meta.total/limit/offset`. |
| Detail + timeline | `GET /applications/{id}` | Must include the `events` array. |
| Create / edit | `POST /applications`, `PATCH /applications/{id}` | Fields: company, title, canonical_url, source, applied_at, location, salary_text, notes. |
| Delete | `DELETE /applications/{id}` | The confirmation dialog is UI only. |
| Change status | `POST /applications/{id}/status` `{ status }` | **409** on an illegal transition: the UI rolls the move back and shows an error toast. |
| All follow-ups | `GET /actions` | Feeds the follow-up center, due badges and the red nav badge. |
| Add follow-up | `POST /applications/{id}/actions` `{ title, due_at }` | |
| Complete / cancel / reschedule | `PATCH /actions/{id}` `{ status: 'done' }` / `{ status: 'cancelled' }` / `{ due_at }` | |

### 4. Who calls what

`DataProvider` (`src/components/providers/DataProvider.tsx`) loads all applications and follow-ups once after login
and keeps them in a shared cache used by the Overview, Board, List and Follow-up center. Mutations go through the
API first, then update the cache. The status move is **optimistic** and rolls back on error.

`ApplicationDetail` additionally calls `GET /applications/{id}` to load the timeline.

> The initial load asks for `limit=500` applications in one call. If one user can have more, add pagination
> there (a comment marks the spot).

### 5. Two things to check on the backend side

- **CORS**: allow your Next.js origin (and the `Authorization` header) in Laravel's `config/cors.php`.
- **Verification link**: make the emailed link redirect to `<frontend>/verified` after Laravel validated it.

---

## Project structure

```
src/
  app/                         routes (App Router)
    login, register, verify, verified, welcome, oops
    (app)/                     signed-in area, shared layout with the rounded shell
      overview, board, list, followups, applications/[id]
  components/
    features/                  one folder per screen (Board, List, Detail, Follow-ups, Overview, Auth)
    layout/                    Dock (top pills), Rail (left icons), shells
    modals/useAppActions.tsx   create/edit form, delete confirm, add follow-up, reschedule
    providers/                 Auth, Data, Theme, Toast, Pop (menus), Modal, route guards
    graphics/                  custom icon set + illustrations (SVG)
    ui/                        atoms, form fields, empty states
  lib/
    api/                       backend calls (Laravel)
  styles/                      tokens (light + dark), base, views, shell
```

## Design rules (kept from the brief)

- One violet (`#6D28D9`), white/off-white surfaces, **no gradients**, soft shadows only.
- One radius scale (8 / 12 / 20 / 24 / 34) and one icon language; each status keeps the same icon + colour everywhere.
- Motion is part of the identity (spring toasts, staggered lists, card FLIP between columns, confetti on Offer) and
  every animation respects `prefers-reduced-motion`.
- Status is never colour-only (icon + text), focus rings are visible and animated, layout works down to mobile.
