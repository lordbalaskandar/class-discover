## Goal

Every mobile screen becomes a real web URL inside a desktop chrome (sidebar + topbar `AppShell`), with a proper desktop layout per screen — not a centered phone column. Mobile preview at `/mobile` stays as-is.

This is ~30 screens and is too large for a single turn. Below is the full route map and a 4-phase delivery so you can review after each phase.

## Route map (1:1 with mobile)

User
- `/` — Home (existing)
- `/browse` — Browse (existing, already desktop)
- `/hosts` — Hosts directory (new)
- `/hosts/map` — Map view (new)
- `/hosts/$hostId` — Host profile (refactor of existing profile)
- `/gyms/$gymId` — Gym page (new)
- `/classes/$classId` — Class detail (existing)
- `/classes/$classId/book` — Booking flow (new)
- `/classes/$classId/pay` — Payment (new)
- `/classes/$classId/confirmation` — Confirmation (new)
- `/bookings` — My bookings (existing, redesign)
- `/saved` — Saved classes (new)
- `/profile` — Profile (new desktop layout)
- `/profile/payment` · `/profile/notifications` · `/profile/become-host` · `/profile/help` · `/profile/my-gym`

Host (all under `_authenticated/host/…`, role-gated)
- `/host` — Dashboard (existing, redesign)
- `/host/new` — Create listing (existing)
- `/host/manage/$classId` — Manage listing
- `/host/earnings` · `/host/payouts` · `/host/availability` · `/host/templates` · `/host/reviews` · `/host/support` · `/host/profile`
- `/host/analytics` — Metrics & retention
- `/host/gym` · `/host/gym/new` · `/host/gym/edit` · `/host/gym/members` · `/host/gym/coach`

## Desktop chrome

New `src/components/AppShell.tsx`:
- Left sidebar (collapsible, shadcn `Sidebar`) with grouped nav: Discover, My activity, Host, Account.
- Topbar: search, notifications, profile menu.
- Content area: route-specific `max-width` + multi-column layouts.
- Used by all new app routes; marketing (`/`, `/browse`) keeps `SiteHeader`.

## Phased delivery

**Phase 1 — Foundation + User core (this turn)**
- Build `AppShell` + sidebar nav.
- Ship desktop redesigns for: `/saved`, `/profile` (+ 5 sub), `/bookings` (redesign), `/hosts`, `/hosts/map`.
- Wire sidebar links + remove deep-link entries to `/mobile` from `SiteHeader` for these.

**Phase 2 — Booking flow + Gym/host pages**
- `/classes/$classId/book` → `/pay` → `/confirmation` as a 3-step desktop flow with sticky summary sidebar.
- `/gyms/$gymId`, `/hosts/$hostId` desktop layouts.

**Phase 3 — Host operations**
- `/host` dashboard redesign (KPI grid + recent activity + quick actions).
- `/host/manage/$classId`, `/host/earnings`, `/host/payouts`, `/host/availability`, `/host/templates`, `/host/reviews`, `/host/support`, `/host/profile`.

**Phase 4 — Host analytics + Gym admin**
- `/host/analytics` — full retention dashboard (charts, cohort table, funnel).
- `/host/gym/*` — gym CRUD + members table + coach view, all in proper desktop tables/forms.

## Technical notes

- Reuse extracted screen components where the mobile logic is correct; rebuild layout/markup for desktop (data tables, multi-column, sticky sidebars). Mobile screens in `mobile.tsx` are left untouched.
- Host-only routes live under `src/routes/_authenticated/host/…` with role check in the page component (toast + redirect on missing host role).
- Data: keep current Supabase tables (`classes`, `bookings`, `profiles`, `user_roles`); gym/member data stays in mock until promoted to real tables (out of scope here).
- Each route defines its own `head()` (title + description).
- Test accounts from prior turn remain: `member@pulsatract.test` and `host@pulsatract.test` (password `Pulsatract-Demo-7K2x!`).

## Out of scope

- Promoting gyms/members/saved/notifications mock state to real tables.
- Real Stripe payments (payment screen stays UI-only).
- Mobile responsive polish of the new desktop layouts beyond "doesn't break under 768px".

## What I'll do next

Start Phase 1 now. After it's working in preview I'll pause for your review before Phase 2.
