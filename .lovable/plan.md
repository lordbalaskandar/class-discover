
## Scope

`src/routes/mobile.tsx` is ~5,400 lines and contains the full product surface (saved classes, my gym, gym creation/members/edit, host coach view, retention analytics, etc.) as a single in-memory screen router. The web app today only has `/`, `/browse`, `/host`, `/host/new`, `/bookings`, `/profile/$userId`, `/classes/$classId`, `/events/$eventId`, `/auth`.

Doing a true 1:1 port screen-by-screen as new desktop pages would mean duplicating thousands of lines and double-maintaining every flow forever. The cleaner 1:1 approach is to **extract the screen components out of `mobile.tsx` into a shared module, then mount them in real web routes** with a desktop chrome (sidebar + topbar) instead of a phone frame.

## Plan

### 1. Extract shared screens
- Create `src/features/app/` and move every `*Screen` component currently inline in `mobile.tsx` into focused files (`user/`, `host/`, `gym/`, `analytics/`).
- Keep the existing `mobile.tsx` working by re-importing from the new modules — no behavior change for the mobile preview.
- Lift shared types (`Screen`, `HostScreenId`, mock data) into `src/features/app/state.ts`.

### 2. New web routes (1:1 with mobile)
User side:
- `/saved` — Saved classes
- `/my-gym` — Member My Gym view

Host side (all under `/host/…`, gated by host role):
- `/host/analytics` — Retention/analytics dashboard
- `/host/gym` — My gym overview
- `/host/gym/new` — Create gym
- `/host/gym/edit` — Edit gym
- `/host/gym/members` — Members management
- `/host/gym/coach` — Coach view

Each route renders the extracted screen component inside a new `<AppShell>` (desktop sidebar nav + topbar) so the web app gets proper URLs, deep-linking, and SEO `head()` per route, while reusing 100% of the mobile UI logic.

### 3. Navigation
- Add a "Saved" and "My gym" entry to the user dropdown in `SiteHeader`.
- Extend `/host` dashboard with cards/links to Analytics, My gym, Members, Coach view.

### 4. Seed two test accounts + sample data
Via a one-off server function using the service-role client:
- `member@dryvon.test` / `Test1234!` — regular user, joined a sample gym, has saved classes + a confirmed booking.
- `host@dryvon.test` / `Test1234!` — has `host` role, owns "Iron Forge" gym with 2 members, 3 classes, and 1 incoming booking.

Returned to you in chat after seeding; you can sign in at `/auth`.

Note: gyms/members aren't real tables yet — they live in mobile.tsx mock state. For now the seed will create real `classes` + `bookings` + `profiles` + `user_roles` rows so the booking/host flows are testable, and the gym/member data continues to come from the in-memory mock (same as mobile). Promoting gyms to real tables can be a follow-up.

## Technical notes

- `AppShell` is a thin wrapper (sidebar + `<Outlet />`) used by all new authenticated app routes; non-authenticated marketing routes (`/`, `/browse`) keep `SiteHeader`.
- Host-only routes live under `src/routes/_authenticated/host/…` and rely on the integration-managed auth gate; role check happens in the page component (toast + redirect on missing host role) since `user_roles` isn't in router context.
- The seed runs once via `createServerFn` with `supabaseAdmin` (admin import done inside the handler per import-graph rules). Re-running is idempotent (upsert on email).
- Mobile.tsx stays as a working preview but becomes a thin composition of the extracted screens.

## Out of scope (call out)

- Promoting gym/member mock data to real DB tables.
- Reskinning extracted screens for wide desktop layouts — they'll render at a sensible max-width inside `AppShell`. A later pass can add desktop-optimized layouts per screen.
