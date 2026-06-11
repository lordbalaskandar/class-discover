# Pulsatract — Mobile Preview Functional Spec

A 1:1 catalog of every screen, action, and data shape in the mobile preview (`/mobile`). Use this to brief Claude on what the web app must implement. Source of truth: `src/routes/mobile.tsx` (~5,400 LOC) + `src/features/app/mock-data.ts` + `src/components/mobile/HostsMap.tsx`.

The app has **two flows**: User (member) and Host. Each flow has its own bottom-tab nav and screen stack.

---

## 1. User flow

Navigation: bottom tabs = Sessions (browse), Hosts, Map, Bookings, Profile.

`Screen` union (15 screens):
`browse | hosts | map | host | gym | class | booking | payment | confirmation | bookings | profile | saved | pPayment | pNotifications | pBecomeHost | pHelp | pMyGym | filters`

### 1.1 `browse` — Sessions feed
- Search bar (free text over title/host/activity/location).
- Activity chips filter (Yoga, BJJ, Running, HIIT, Climbing, Strength, Boxing, Mobility, …).
- "When" filter: any / today / weekend.
- Listing-type filter: all / class / trainer.
- Sort: soonest | price-asc | rating-desc.
- Card list of `ClassItem` with image, badges, title, host, location, date/time, duration, price, rating, spots left.
- Heart toggle → persists to `localStorage` key `pulsatract.saved.classes`.
- Tap card → `class` screen. Tap host name → `host` screen.

### 1.2 `hosts` — Directory
- Search + activity chips + distance slider (mi) + price/hr range + type filter (person/gym).
- Sort: nearest | rating | price.
- Cards show name, type badge, activities, location, distance, rating/reviews, $/hr.
- Tap → `host` or `gym` based on `type`.

### 1.3 `map` — Hosts map
- Google Maps (uses `GOOGLE_MAPS_BROWSER_KEY`) centered on SF.
- Markers per host; tap marker → bottom card → open host/gym.
- Same filter set as `hosts`.

### 1.4 `host` — Host (person) profile
- Cover, avatar, name, rating, reviews, bio, activities, location, $/hr.
- Tabs: Upcoming sessions | Reviews | About.
- "Book a session" CTA → `class` (their featured class).
- Message host (UI only).

### 1.5 `gym` — Gym profile
- Cover, name, tagline, address, amenities chips, hours, monthly price.
- Class schedule list (tap → `class`).
- Coach roster, member count, gallery.

### 1.6 `class` — Class detail
- Hero image, activity/listing badges, title, host link, location, date/time, duration, capacity, price.
- Description, what to bring, cancellation policy.
- For `scheduled` classes: fixed date, spots-left counter.
- For `on_request` (trainer) classes: date-picker, message field.
- Heart save, share.
- CTA → `booking`.

### 1.7 `booking` — Step 1 of checkout
- Review session summary.
- Adjust number of spots (1..available).
- Optional note to host.
- Persists draft to `localStorage`.
- Continue → `payment`.

### 1.8 `payment` — Step 2
- Payment method selector: Card / Apple Pay / Google Pay.
- Mock card UI (Visa •••• 4242).
- Price breakdown: `mockPriceForClass(classId) × spots + SERVICE_FEE ($2.50)`.
- Pay → simulated 1.2s delay → insert row into `bookings` table → `confirmation`.

### 1.9 `confirmation` — Step 3
- Success state, generated booking code (e.g. `DRV-AB12CD`).
- Next steps, calendar add (UI only).
- "View my bookings" → `bookings`. "Browse more" → `browse`.

### 1.10 `bookings` — My bookings
- Tabs: Upcoming | Past | Cancelled.
- Reads from `bookings` table for current user.
- Per-row: class card + status badge + actions (Reschedule, Cancel, Leave review).
- Empty states per tab.

### 1.11 `saved` — Saved classes
- Grid of classes whose id is in `loadSavedIds()` (localStorage).
- Unsave inline.

### 1.12 `profile` — Member profile
- Avatar, display name, email, edit-profile button (display_name, bio, avatar_url, city → `profiles` table).
- Quick links: Bookings, Saved, Become a host.
- Sections: `pPayment`, `pNotifications`, `pBecomeHost`, `pHelp`, `pMyGym`.
- Sign out.

### 1.13 `pPayment` — Payment methods
- List of saved cards (mock). Add card, set default, remove.

### 1.14 `pNotifications` — Notification preferences
- Toggles: Booking confirmations, Reminders 24h before, Host messages, Promos, Weekly digest.

### 1.15 `pBecomeHost` — Onboarding to host
- Multi-step intake: activity, experience, location, bio, photo, payout setup.
- Submit → grants `host` role in `user_roles` (action TBD; mobile is UI-only).

### 1.16 `pHelp` — Help & support
- FAQ accordion, contact form, link to terms/privacy.

### 1.17 `pMyGym` — Member's gym
- Shows the gym the user is a member of (if any), membership tier, attendance history, "View gym" link.

### 1.18 `filters` — Filters sheet
- Modal sheet variant of the filter UI shared across browse/hosts/map.

---

## 2. Host flow

Navigation: bottom tabs = Home (dashboard), Create, Earnings, Profile.

`HostScreenId` union (16 screens):
`dashboard | create | manage | earnings | metrics | hostProfile | hpTemplates | hpPayouts | hpAvailability | hpReviews | hpSupport | hpGym | hpGymCreate | hpGymMembers | hpGymCoach | hpGymEdit`

### 2.1 `dashboard` — Host home
- KPI cards: Today's revenue, Upcoming attendees, Avg rating, Capacity fill %.
- Today's classes list with booked/capacity progress.
- Recent activity feed.
- Quick actions: Create class, View earnings, View metrics.

### 2.2 `create` — New class
- Form fields: title, activity (enum from `ACTIVITIES`), description, location, start_at, duration_min, capacity, price, listing_type (`class | trainer`), booking_type (`scheduled | on_request`), image_url.
- Save as template option.
- Publish → insert into `classes` table → `dashboard`.

### 2.3 `manage` — Manage a class
- Edit fields above.
- Attendee list (`HOST_ATTENDEES`): name, initials, note.
- Message all attendees, cancel class, duplicate, view metrics.

### 2.4 `earnings`
- Lifetime/30-day/7-day totals.
- Payout schedule, next payout amount/date.
- Earnings by class table.
- Export CSV (UI only).

### 2.5 `metrics`
- Revenue chart, bookings chart, capacity fill, retention cohort table, funnel (views → save → book → attend).
- Filters: date range, activity, class.

### 2.6 `hostProfile`
- Public profile editor: display name, bio, avatar, city, activities, $/hr.
- Sub-sections rows: Templates, Payouts, Availability, Reviews, Support, Gym.

### 2.7 `hpTemplates` — Class templates
- CRUD of reusable class definitions to seed `create`.

### 2.8 `hpPayouts`
- Bank/Stripe payout account (mock), payout history table, edit account.

### 2.9 `hpAvailability`
- Weekly recurring availability grid, blackout dates, time-zone.

### 2.10 `hpReviews`
- Aggregate rating, list of reviews with reply UI.

### 2.11 `hpSupport`
- Contact host support, doc links.

### 2.12 `hpGym` — Gym admin landing
- Shows `GymInfo` (`DEFAULT_GYM`). If `created=false` → CTA `hpGymCreate`. Else → tiles for Members, Edit, Coach view.

### 2.13 `hpGymCreate`
- Form: name, tagline, address, capacity, monthlyPrice, amenities multi-select.

### 2.14 `hpGymEdit`
- Same form as create, prefilled.

### 2.15 `hpGymMembers`
- Table of `GymMember`: name, email, plan (Monthly/Annual/Day pass), role (Owner/Coach/Member), joined, status (Active/Pending/Paused).
- Invite member, change plan, change role, pause/reactivate, remove.

### 2.16 `hpGymCoach`
- Coach-only roster view, class assignments, attendance tracking per member.

---

## 3. Data shapes (mock today, target schema)

```ts
type HostItem = {
  id; name; type: "person"|"gym";
  activities: string[]; location; distance; rating; reviews;
  pricePerHour; classId; image; bio; lat; lng;
};

type ClassItem = {
  id; title; host; hostType: "person"|"gym"; activity;
  location; date; time; duration; price; rating; reviews;
  spots; capacity; image;
};

type HostClass = { id; title; activity; date; time; duration; price; booked; capacity; image };

type GymInfo = { created; name; tagline; address; capacity; monthlyPrice; amenities: string[] };

type GymMember = { id; name; initials; email; plan; role; joined; status };
```

Activities enum (`src/lib/activities.ts`):
`Pilates, Yoga, Boxing, Pickleball, Tennis, HIIT, Spin, Barre, Dance, Rock Climbing, Swimming, Other`.

---

## 4. Existing Supabase tables (already in project)

| Table | Cols | Purpose |
|---|---|---|
| `profiles` | 9 | display_name, bio, avatar_url, city, … |
| `classes` | 15 | listings (class + trainer); booking_type `scheduled|on_request` |
| `bookings` | 8 | user bookings; `preferred_at` for on_request |
| `event_signups` | 4 | special-event RSVPs |
| `special_events` | 11 | one-off events |
| `user_roles` | 4 | role grants (`user`, `host`, `admin`) via `has_role()` |

Auth: Supabase Auth + Google OAuth via Lovable broker. Members have no role row; hosts have `host` in `user_roles`.

---

## 5. Not yet in the database (mock only)

Need new tables/columns when promoted off mocks:
- `classes.price_cents` (currently faked by `mockPriceForClass()`).
- `saved_classes (user_id, class_id)` (currently `localStorage`).
- `gyms`, `gym_members`, `gym_amenities`.
- `host_templates`, `host_availability`, `payout_accounts`, `payouts`.
- `reviews (class_id, user_id, rating, body, reply)`.
- `notifications_preferences (user_id, …)`.
- `payment_methods (user_id, brand, last4, default)`.

---

## 6. Server endpoints needed (TanStack `createServerFn` unless noted)

### Auth-scoped (`requireSupabaseAuth`)
- `getMyBookings({status?})` — list w/ joined class.
- `createBooking({classId, spots, note, preferredAt?})` — insert + capacity check.
- `cancelBooking({bookingId})`.
- `toggleSaved({classId})` / `listSaved()`.
- `updateProfile({display_name, bio, avatar_url, city})`.
- `updateNotificationPrefs(prefs)`.
- `addPaymentMethod(...)` / `listPaymentMethods()` / `removePaymentMethod(id)`.
- `becomeHost(intakePayload)` — grants `host` role.

### Host-scoped (`requireSupabaseAuth` + `has_role('host')`)
- `hostDashboardSummary()` — KPIs + today's classes + recent activity.
- `createClass(payload)` / `updateClass(id,payload)` / `cancelClass(id)` / `duplicateClass(id)`.
- `listHostClasses({range})`.
- `listAttendees({classId})`.
- `messageAttendees({classId, body})`.
- `getEarnings({range})`, `getPayouts()`, `updatePayoutAccount(...)`.
- `getMetrics({range, activity?, classId?})` — revenue, bookings, capacity, cohort retention, funnel.
- `listTemplates()` / `upsertTemplate(...)` / `deleteTemplate(id)`.
- `getAvailability()` / `updateAvailability(...)`.
- `listReviews()` / `replyToReview({id, body})`.
- Gym admin: `getGym()`, `createGym(...)`, `updateGym(...)`, `listMembers()`, `inviteMember(...)`, `updateMember(...)`, `removeMember(...)`.

### Public/discovery (anonymous-readable via `supabaseAdmin` with safe projection)
- `searchClasses({q,activity,when,type,sort})`.
- `searchHosts({q,activity,type,distance,maxPrice,sort,lat?,lng?})`.
- `getClassDetail({classId})` (already exists as `getClassAvailability`).
- `getHostProfile({hostId})`, `getGymPublic({gymId})`.

### Public HTTP routes (`src/routes/api/public/*`)
- `POST /api/public/webhooks/stripe` — payout/payment webhook (HMAC-verified) when real Stripe is wired.

---

## 7. Out of scope on the mobile preview
- Real Stripe charges (payment screen is simulated).
- Real chat/messaging — message buttons are UI placeholders.
- Push notifications.
- Calendar provider sync.

---

End of spec.
