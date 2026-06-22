import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
  Signal,
  Wifi,
  BatteryFull,
  RefreshCw,
  Play,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  checkBackendHealth,
  type HealthResult,
} from "@/lib/backend-health.functions";
import { ScreensJourney } from "@/components/backend-test/ScreensJourney";

export const Route = createFileRoute("/backend-test")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Backend test — Pulstract" },
      {
        name: "description",
        content:
          "Live, step-by-step walkthrough of the Pulstract dev backend, exercising every GraphQL endpoint with real data.",
      },
    ],
  }),
  component: BackendTestPage,
});

/* ============================================================ */
/* Config                                                       */
/* ============================================================ */

const GQL_URL = "https://dev.api.gateway.pulstract.com/graphql";
const COGNITO_REGION = "eu-central-1";
const COGNITO_CLIENT_ID = "7rqtsmq8sf8mfd2dfacpmqpvg4";
const COGNITO_URL = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`;
const STORAGE_KEY = "pulstract-backend-test-state-v1";

/* ============================================================ */
/* Networking helpers                                           */
/* ============================================================ */

async function cognito<T = any>(target: string, body: unknown): Promise<T> {
  const res = await fetch(COGNITO_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": `AWSCognitoIdentityProviderService.${target}`,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || json.__type || `Cognito ${target} failed`);
  }
  return json as T;
}

async function gql<T = any>(
  query: string,
  variables?: Record<string, unknown>,
  token?: string | null,
): Promise<T> {
  const res = await fetch(GQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors[0].message);
  }
  return json.data as T;
}

/* ============================================================ */
/* Types                                                        */
/* ============================================================ */

type Ctx = {
  email: string;
  name: string;
  accessToken: string | null;
  refreshToken: string | null;
  idToken: string | null;
  me: any | null;
  profile: any | null;
  avatarUpload: any | null;
  smartFilters: any | null;
  gyms: any[];
  gymDetail: any | null;
  classes: any[];
  classDetail: any | null;
  booking: any | null;
  bookingRefetch: any | null;
  paymentIntent: any | null;
  payment: any | null;
  myBookings: any[];
  review: any | null;
  reviews: any[];
  reviewSummary: any | null;
  createdGym: any | null;
  myGym: any | null;
  updatedGym: any | null;
  createdClass: any | null;
  myClasses: any[];
  updatedClass: any | null;
  bookingsByClass: any[];
  coachTip: any | null;
  cancelledClass: boolean | null;
  cancelledBooking: any | null;
};

const EMPTY_CTX: Ctx = {
  email: "",
  name: "",
  accessToken: null,
  refreshToken: null,
  idToken: null,
  me: null,
  profile: null,
  avatarUpload: null,
  smartFilters: null,
  gyms: [],
  gymDetail: null,
  classes: [],
  classDetail: null,
  booking: null,
  bookingRefetch: null,
  paymentIntent: null,
  payment: null,
  myBookings: [],
  review: null,
  reviews: [],
  reviewSummary: null,
  createdGym: null,
  myGym: null,
  updatedGym: null,
  createdClass: null,
  myClasses: [],
  updatedClass: null,
  bookingsByClass: [],
  coachTip: null,
  cancelledClass: null,
  cancelledBooking: null,
};

type StageStatus = "pending" | "running" | "ok" | "error" | "skipped";

type Stage = {
  id: string;
  title: string;
  endpoint: string;
  description: string;
  nextHint: string;
  needsAuth: boolean;
  run: (ctx: Ctx, helpers: StageHelpers) => Promise<Partial<Ctx> | void>;
  render: (ctx: Ctx) => ReactNode;
};

type StageHelpers = {
  log: (msg: string) => void;
};

/* ============================================================ */
/* GraphQL queries                                              */
/* ============================================================ */

const Q_ME = `query Me { me { id email name createdAt } }`;
const Q_GYMS = `query G($f:GymFilter,$p:Pagination){ gyms(filter:$f,pagination:$p){ items{ id name description rating totalRatings address{ street city country postcode lat lng } } nextToken } }`;
const Q_GYM = `query GG($id:ID!){ gym(id:$id){ id name description rating totalRatings address{ street city country postcode lat lng } createdAt } }`;
const Q_CLASSES = `query C($f:ClassFilter,$p:Pagination){ classes(filter:$f,pagination:$p){ items{ id gymId title activityType startAt durationMinutes capacity priceCents status gymName city country } nextToken } }`;
const Q_CLASS = `query CC($id:ID!){ class(id:$id){ id gymId title description activityType startAt durationMinutes capacity priceCents status gymName city country createdAt } }`;
const Q_BOOKING = `query B($id:ID!){ booking(id:$id){ id userId classId gymId scheduledAt status createdAt } }`;
const Q_MY_BOOKINGS = `query MB($f:BookingFilter,$p:Pagination){ bookings(filter:$f,pagination:$p){ items{ id classId gymId scheduledAt status createdAt } nextToken } }`;
const Q_PAYMENT_BY_BOOKING = `query PB($id:ID!){ paymentByBooking(bookingId:$id){ id bookingId amount currency status createdAt } }`;
const Q_REVIEWS = `query R($g:ID!){ reviews(gymId:$g){ id userId rating comment createdAt } }`;
const Q_REVIEW_SUMMARY = `query RS($g:ID!){ reviewSummary(gymId:$g){ gymId summary reviewCount generatedAt } }`;
const Q_PROFILE = `query P($id:ID!){ profile(userId:$id){ userId bio avatarUrl updatedAt } }`;
const Q_SMART = `query SS($q:String!){ smartSearchFilters(query:$q){ activityType city radiusKm minRating } }`;
const Q_MY_GYM = `query MG{ myGym{ id name description address{ street city country postcode } } }`;
const Q_MY_CLASSES = `query MC{ myClasses{ id title activityType startAt durationMinutes capacity priceCents status } }`;
const Q_BOOKINGS_BY_CLASS = `query BBC($id:ID!){ bookingsByClass(classId:$id){ id userId scheduledAt status } }`;
const Q_COACH_TIP = `query CT{ coachTip{ hostId tip generatedAt } }`;

const M_UPDATE_PROFILE = `mutation UP($i:UpdateProfileInput!){ updateProfile(input:$i){ userId bio avatarUrl updatedAt } }`;
const M_AVATAR_URL = `mutation AU($c:String!){ getAvatarUploadUrl(contentType:$c){ uploadUrl key } }`;
const M_CREATE_BOOKING = `mutation CB($i:CreateBookingInput!){ createBooking(input:$i){ id classId gymId scheduledAt status createdAt } }`;
const M_PAYMENT_INTENT = `mutation PI($i:CreatePaymentIntentInput!){ createPaymentIntent(input:$i){ id bookingId amount currency status clientSecret createdAt } }`;
const M_SUBMIT_REVIEW = `mutation SR($i:SubmitReviewInput!){ submitReview(input:$i){ id gymId rating comment createdAt } }`;
const M_CREATE_GYM = `mutation CG($i:CreateGymInput!){ createGym(input:$i){ id name address{ street city country postcode } } }`;
const M_UPDATE_GYM = `mutation UG($id:ID!,$i:UpdateGymInput!){ updateGym(id:$id,input:$i){ id name description address{ city country } } }`;
const M_CREATE_CLASS = `mutation CC($i:CreateClassInput!){ createClass(input:$i){ id title activityType startAt durationMinutes capacity priceCents status } }`;
const M_UPDATE_CLASS = `mutation UC($id:ID!,$i:UpdateClassInput!){ updateClass(id:$id,input:$i){ id title capacity priceCents status } }`;
const M_CANCEL_CLASS = `mutation CnC($id:ID!){ cancelClass(id:$id) }`;
const M_CANCEL_BOOKING = `mutation CnB($id:ID!){ cancelBooking(id:$id){ id status } }`;

/* ============================================================ */
/* Stages                                                       */
/* ============================================================ */

const STAGES: Stage[] = [
  {
    id: "signup",
    title: "Sign up",
    endpoint: "Cognito · SignUp",
    description:
      "Create a fresh Cognito user. The preSignUp trigger auto-confirms the account, and postConfirmation creates a row in the identity DB.",
    nextHint: "Press Next to sign in and receive auth tokens.",
    needsAuth: false,
    run: async (ctx) => {
      const email =
        ctx.email ||
        `lovable+${Date.now().toString(36)}@pulstract.dev`;
      const name = ctx.name || "Lovable Test User";
      try {
        await cognito("SignUp", {
          ClientId: COGNITO_CLIENT_ID,
          Username: email,
          Password: cryptoRandomPassword(),
          UserAttributes: [
            { Name: "email", Value: email },
            { Name: "name", Value: name },
          ],
        });
      } catch (e: any) {
        // Existing user is fine — we'll sign in anyway.
        if (!/UsernameExists/i.test(String(e?.message))) throw e;
      }
      return { email, name };
    },
    render: (ctx) => (
      <ScreenCard title="Welcome to Pulstract" subtitle="Create your account">
        <Row label="Email" value={ctx.email || "(generating…)"} />
        <Row label="Name" value={ctx.name || "Lovable Test User"} />
        <p className="mt-3 text-[11px] text-muted-foreground">
          Account auto-confirmed by preSignUp trigger.
        </p>
      </ScreenCard>
    ),
  },
  {
    id: "signin",
    title: "Sign in",
    endpoint: "Cognito · InitiateAuth (CUSTOM_AUTH)",
    description:
      "Single-call CUSTOM_AUTH flow — OTP disabled in dev. Tokens are returned immediately.",
    nextHint: "Tokens stored. Press Next to load the current user via the gateway.",
    needsAuth: false,
    run: async (ctx) => {
      const res: any = await cognito("InitiateAuth", {
        ClientId: COGNITO_CLIENT_ID,
        AuthFlow: "CUSTOM_AUTH",
        AuthParameters: { USERNAME: ctx.email },
      });
      const r = res.AuthenticationResult;
      if (!r) throw new Error("No AuthenticationResult");
      return {
        accessToken: r.AccessToken,
        refreshToken: r.RefreshToken,
        idToken: r.IdToken,
      };
    },
    render: (ctx) => (
      <ScreenCard title="Signing in" subtitle="CUSTOM_AUTH">
        <Row label="Access token" value={short(ctx.accessToken)} />
        <Row label="Refresh token" value={short(ctx.refreshToken)} />
        <Row label="ID token" value={short(ctx.idToken)} />
      </ScreenCard>
    ),
  },
  {
    id: "me",
    title: "Load current user",
    endpoint: "Query · me",
    description: "First authenticated GraphQL call. Verifies the bearer token works end-to-end.",
    nextHint: "Press Next to update your profile bio.",
    needsAuth: true,
    run: async (ctx) => {
      const data = await gql<{ me: any }>(Q_ME, undefined, ctx.accessToken);
      return { me: data.me };
    },
    render: (ctx) => (
      <ScreenCard title="Your account">
        <Row label="ID" value={ctx.me?.id ?? "—"} />
        <Row label="Email" value={ctx.me?.email ?? "—"} />
        <Row label="Name" value={ctx.me?.name ?? "—"} />
        <Row label="Created" value={ctx.me?.createdAt ?? "—"} />
      </ScreenCard>
    ),
  },
  {
    id: "updateProfile",
    title: "Update profile",
    endpoint: "Mutation · updateProfile",
    description: "Writes a bio to pulstract-profile.",
    nextHint: "Press Next to request a presigned S3 URL for the avatar.",
    needsAuth: true,
    run: async (ctx) => {
      const data = await gql<{ updateProfile: any }>(
        M_UPDATE_PROFILE,
        { i: { bio: `Backend-test run at ${new Date().toISOString()}` } },
        ctx.accessToken,
      );
      return { profile: data.updateProfile };
    },
    render: (ctx) => (
      <ScreenCard title="Profile" subtitle="updateProfile">
        <Row label="Bio" value={ctx.profile?.bio ?? "—"} />
        <Row label="Updated" value={ctx.profile?.updatedAt ?? "—"} />
      </ScreenCard>
    ),
  },
  {
    id: "avatarUrl",
    title: "Get avatar upload URL",
    endpoint: "Mutation · getAvatarUploadUrl + S3 PUT",
    description:
      "Mints a pre-signed S3 PUT URL and uploads a tiny 1x1 PNG to verify the avatar pipeline.",
    nextHint: "Press Next for smart AI search.",
    needsAuth: true,
    run: async (ctx) => {
      const data = await gql<{ getAvatarUploadUrl: any }>(
        M_AVATAR_URL,
        { c: "image/png" },
        ctx.accessToken,
      );
      // 1x1 transparent PNG
      const pngBytes = Uint8Array.from(
        atob(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9ZqQK+8AAAAASUVORK5CYII=",
        ),
        (c) => c.charCodeAt(0),
      );
      const putRes = await fetch(data.getAvatarUploadUrl.uploadUrl, {
        method: "PUT",
        body: pngBytes,
        headers: { "Content-Type": "image/png" },
      });
      if (!putRes.ok) throw new Error(`S3 PUT failed ${putRes.status}`);
      return { avatarUpload: { ...data.getAvatarUploadUrl, uploaded: true } };
    },
    render: (ctx) => (
      <ScreenCard title="Avatar upload" subtitle="getAvatarUploadUrl">
        <Row label="S3 key" value={ctx.avatarUpload?.key ?? "—"} />
        <Row label="Uploaded" value={ctx.avatarUpload?.uploaded ? "1×1 PNG → S3" : "—"} />
        <Row label="URL" value={short(ctx.avatarUpload?.uploadUrl, 40)} />
      </ScreenCard>
    ),
  },
  {
    id: "smart",
    title: "Smart search",
    endpoint: "Query · smartSearchFilters (AI)",
    description: 'Sends a natural-language query to pulstract-ai and gets back structured filters.',
    nextHint: "Press Next to list gyms.",
    needsAuth: true,
    run: async (ctx) => {
      const data = await gql<{ smartSearchFilters: any }>(
        Q_SMART,
        { q: "yoga classes near London at least 4 stars" },
        ctx.accessToken,
      );
      return { smartFilters: data.smartSearchFilters };
    },
    render: (ctx) => (
      <ScreenCard title="Smart search" subtitle="AI-parsed filters">
        <Row label="Query" value="yoga near London ≥4★" />
        <Row label="activityType" value={ctx.smartFilters?.activityType ?? "—"} />
        <Row label="city" value={ctx.smartFilters?.city ?? "—"} />
        <Row label="minRating" value={String(ctx.smartFilters?.minRating ?? "—")} />
        <Row label="radiusKm" value={String(ctx.smartFilters?.radiusKm ?? "—")} />
      </ScreenCard>
    ),
  },
  {
    id: "listGyms",
    title: "List gyms",
    endpoint: "Query · gyms",
    description: "Browses the discovery service for gyms. Filters seeded from the smart-search result (or default).",
    nextHint: "Press Next to load gym detail.",
    needsAuth: true,
    run: async (ctx) => {
      const filter: any = {};
      if (ctx.smartFilters?.city) filter.city = ctx.smartFilters.city;
      if (ctx.smartFilters?.minRating) filter.minRating = ctx.smartFilters.minRating;
      const data = await gql<{ gyms: any }>(
        Q_GYMS,
        { f: Object.keys(filter).length ? filter : null, p: { limit: 10 } },
        ctx.accessToken,
      );
      return { gyms: data.gyms.items };
    },
    render: (ctx) => (
      <ListScreen title="Gyms" empty="No gyms returned.">
        {ctx.gyms.map((g) => (
          <ListRow
            key={g.id}
            title={g.name}
            subtitle={`${g.address?.city ?? "?"} · ${g.rating ?? "—"}★ (${g.totalRatings ?? 0})`}
          />
        ))}
      </ListScreen>
    ),
  },
  {
    id: "gymDetail",
    title: "Gym detail",
    endpoint: "Query · gym",
    description: "Loads the first gym returned above.",
    nextHint: "Press Next to list classes.",
    needsAuth: true,
    run: async (ctx) => {
      if (!ctx.gyms[0]) throw new Error("No gym to load — re-run List gyms.");
      const data = await gql<{ gym: any }>(Q_GYM, { id: ctx.gyms[0].id }, ctx.accessToken);
      return { gymDetail: data.gym };
    },
    render: (ctx) => (
      <ScreenCard title={ctx.gymDetail?.name ?? "Gym"} subtitle={ctx.gymDetail?.address?.city}>
        <Row label="Rating" value={`${ctx.gymDetail?.rating ?? "—"}★`} />
        <Row label="Description" value={ctx.gymDetail?.description ?? "—"} />
        <Row label="Postcode" value={ctx.gymDetail?.address?.postcode ?? "—"} />
      </ScreenCard>
    ),
  },
  {
    id: "listClasses",
    title: "List classes",
    endpoint: "Query · classes",
    description: "Pulls bookable classes. We'll book the first one with available spots.",
    nextHint: "Press Next to load class detail.",
    needsAuth: true,
    run: async (ctx) => {
      const data = await gql<{ classes: any }>(
        Q_CLASSES,
        { f: null, p: { limit: 10 } },
        ctx.accessToken,
      );
      return { classes: data.classes.items };
    },
    render: (ctx) => (
      <ListScreen title="Classes" empty="No classes available.">
        {ctx.classes.map((c) => (
          <ListRow
            key={c.id}
            title={c.title}
            subtitle={`${c.activityType} · ${formatDate(c.startAt)} · £${(c.priceCents / 100).toFixed(2)}`}
          />
        ))}
      </ListScreen>
    ),
  },
  {
    id: "classDetail",
    title: "Class detail",
    endpoint: "Query · class",
    description: "Loads the first class to confirm price and time before booking.",
    nextHint: "Press Next to create a booking.",
    needsAuth: true,
    run: async (ctx) => {
      const c = ctx.classes[0];
      if (!c) throw new Error("No class to load.");
      const data = await gql<{ class: any }>(Q_CLASS, { id: c.id }, ctx.accessToken);
      return { classDetail: data.class };
    },
    render: (ctx) => (
      <ScreenCard title={ctx.classDetail?.title ?? "Class"} subtitle={ctx.classDetail?.gymName}>
        <Row label="When" value={formatDate(ctx.classDetail?.startAt)} />
        <Row label="Duration" value={`${ctx.classDetail?.durationMinutes ?? "—"} min`} />
        <Row label="Capacity" value={String(ctx.classDetail?.capacity ?? "—")} />
        <Row label="Price" value={ctx.classDetail ? `£${(ctx.classDetail.priceCents / 100).toFixed(2)}` : "—"} />
        <Row label="Status" value={ctx.classDetail?.status ?? "—"} />
      </ScreenCard>
    ),
  },
  {
    id: "createBooking",
    title: "Create booking",
    endpoint: "Mutation · createBooking",
    description: "Reserves a seat. Status starts PENDING until payment succeeds.",
    nextHint: "Press Next to refetch the booking.",
    needsAuth: true,
    run: async (ctx) => {
      const data = await gql<{ createBooking: any }>(
        M_CREATE_BOOKING,
        { i: { classId: ctx.classDetail!.id } },
        ctx.accessToken,
      );
      return { booking: data.createBooking };
    },
    render: (ctx) => (
      <ScreenCard title="Booking created" subtitle="PENDING">
        <Row label="ID" value={ctx.booking?.id ?? "—"} />
        <Row label="Scheduled" value={formatDate(ctx.booking?.scheduledAt)} />
        <Row label="Status" value={ctx.booking?.status ?? "—"} />
      </ScreenCard>
    ),
  },
  {
    id: "getBooking",
    title: "Read booking back",
    endpoint: "Query · booking",
    description: "Round-trips the booking ID via the booking service.",
    nextHint: "Press Next to create a Stripe payment intent.",
    needsAuth: true,
    run: async (ctx) => {
      const data = await gql<{ booking: any }>(
        Q_BOOKING,
        { id: ctx.booking!.id },
        ctx.accessToken,
      );
      return { bookingRefetch: data.booking };
    },
    render: (ctx) => (
      <ScreenCard title="Booking" subtitle="server confirms">
        <Row label="ID" value={ctx.bookingRefetch?.id ?? "—"} />
        <Row label="Class" value={ctx.bookingRefetch?.classId ?? "—"} />
        <Row label="Gym" value={ctx.bookingRefetch?.gymId ?? "—"} />
        <Row label="Status" value={ctx.bookingRefetch?.status ?? "—"} />
      </ScreenCard>
    ),
  },
  {
    id: "paymentIntent",
    title: "Create payment intent",
    endpoint: "Mutation · createPaymentIntent",
    description: "Asks pulstract-payment for a Stripe PaymentIntent in test mode.",
    nextHint: "Press Next to read the payment back. (Card confirmation needs a Stripe pk_test, optional.)",
    needsAuth: true,
    run: async (ctx) => {
      const data = await gql<{ createPaymentIntent: any }>(
        M_PAYMENT_INTENT,
        {
          i: {
            bookingId: ctx.booking!.id,
            amount: ctx.classDetail!.priceCents,
            currency: "eur",
          },
        },
        ctx.accessToken,
      );
      return { paymentIntent: data.createPaymentIntent };
    },
    render: (ctx) => (
      <ScreenCard title="Payment intent" subtitle="Stripe (test)">
        <Row label="ID" value={ctx.paymentIntent?.id ?? "—"} />
        <Row label="Amount" value={ctx.paymentIntent ? `${ctx.paymentIntent.amount} ${ctx.paymentIntent.currency}` : "—"} />
        <Row label="Status" value={ctx.paymentIntent?.status ?? "—"} />
        <Row label="clientSecret" value={short(ctx.paymentIntent?.clientSecret, 36)} />
      </ScreenCard>
    ),
  },
  {
    id: "paymentByBooking",
    title: "Payment by booking",
    endpoint: "Query · paymentByBooking",
    description: "Pulls the payment row associated with the booking.",
    nextHint: "Press Next to list your bookings.",
    needsAuth: true,
    run: async (ctx) => {
      const data = await gql<{ paymentByBooking: any }>(
        Q_PAYMENT_BY_BOOKING,
        { id: ctx.booking!.id },
        ctx.accessToken,
      );
      return { payment: data.paymentByBooking };
    },
    render: (ctx) => (
      <ScreenCard title="Payment" subtitle="paymentByBooking">
        <Row label="ID" value={ctx.payment?.id ?? "—"} />
        <Row label="Amount" value={ctx.payment ? `${ctx.payment.amount} ${ctx.payment.currency}` : "—"} />
        <Row label="Status" value={ctx.payment?.status ?? "—"} />
      </ScreenCard>
    ),
  },
  {
    id: "myBookings",
    title: "My bookings",
    endpoint: "Query · bookings",
    description: "Lists every booking on this account.",
    nextHint: "Press Next to submit a review for the gym.",
    needsAuth: true,
    run: async (ctx) => {
      const data = await gql<{ bookings: any }>(
        Q_MY_BOOKINGS,
        { f: null, p: { limit: 20 } },
        ctx.accessToken,
      );
      return { myBookings: data.bookings.items };
    },
    render: (ctx) => (
      <ListScreen title={`Bookings (${ctx.myBookings.length})`} empty="None yet.">
        {ctx.myBookings.slice(0, 8).map((b) => (
          <ListRow
            key={b.id}
            title={b.classId}
            subtitle={`${b.status} · ${formatDate(b.scheduledAt)}`}
          />
        ))}
      </ListScreen>
    ),
  },
  {
    id: "submitReview",
    title: "Submit review",
    endpoint: "Mutation · submitReview",
    description: "Leaves a 5★ review on the gym, which enqueues AI summary regeneration.",
    nextHint: "Press Next to fetch reviews and the AI summary.",
    needsAuth: true,
    run: async (ctx) => {
      const gymId = ctx.booking?.gymId || ctx.gyms[0]?.id;
      if (!gymId) throw new Error("No gym available to review.");
      const data = await gql<{ submitReview: any }>(
        M_SUBMIT_REVIEW,
        { i: { gymId, rating: 5, comment: "End-to-end backend test review." } },
        ctx.accessToken,
      );
      return { review: data.submitReview };
    },
    render: (ctx) => (
      <ScreenCard title="Review submitted" subtitle="5★">
        <Row label="ID" value={ctx.review?.id ?? "—"} />
        <Row label="Gym" value={ctx.review?.gymId ?? "—"} />
        <Row label="Comment" value={ctx.review?.comment ?? "—"} />
      </ScreenCard>
    ),
  },
  {
    id: "reviews",
    title: "Reviews + AI summary",
    endpoint: "Query · reviews + reviewSummary",
    description: "Reads back all reviews on the gym and the AI-generated summary.",
    nextHint: "Press Next to read the profile via the public profile endpoint.",
    needsAuth: true,
    run: async (ctx) => {
      const gymId = ctx.review?.gymId || ctx.gyms[0]?.id;
      const [revs, sum] = await Promise.all([
        gql<{ reviews: any[] }>(Q_REVIEWS, { g: gymId }, ctx.accessToken),
        gql<{ reviewSummary: any }>(Q_REVIEW_SUMMARY, { g: gymId }, ctx.accessToken).catch(() => ({
          reviewSummary: null,
        })),
      ]);
      return { reviews: revs.reviews, reviewSummary: sum.reviewSummary };
    },
    render: (ctx) => (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">AI summary</div>
          <div className="text-[12px] mt-1">{ctx.reviewSummary?.summary ?? "(none yet — AI job pending)"}</div>
        </div>
        <ListScreen title={`Reviews (${ctx.reviews.length})`} empty="No reviews yet." inset>
          {ctx.reviews.slice(0, 6).map((r) => (
            <ListRow key={r.id} title={`${"★".repeat(r.rating)}`} subtitle={r.comment ?? "(no comment)"} />
          ))}
        </ListScreen>
      </div>
    ),
  },
  {
    id: "profile",
    title: "Profile by ID",
    endpoint: "Query · profile",
    description: "Reads your own profile via the public profile endpoint.",
    nextHint: "Now switching to the HOST flow. Press Next to create a gym.",
    needsAuth: true,
    run: async (ctx) => {
      const data = await gql<{ profile: any }>(
        Q_PROFILE,
        { id: ctx.me!.id },
        ctx.accessToken,
      );
      return { profile: data.profile };
    },
    render: (ctx) => (
      <ScreenCard title="Public profile">
        <Row label="User ID" value={ctx.profile?.userId ?? "—"} />
        <Row label="Bio" value={ctx.profile?.bio ?? "—"} />
        <Row label="Avatar key" value={short(ctx.profile?.avatarUrl, 36)} />
      </ScreenCard>
    ),
  },
  {
    id: "createGym",
    title: "Host · create gym",
    endpoint: "Mutation · createGym",
    description: "Promotes this user to a host by registering a gym.",
    nextHint: "Press Next to load myGym.",
    needsAuth: true,
    run: async (ctx) => {
      const data = await gql<{ createGym: any }>(
        M_CREATE_GYM,
        {
          i: {
            name: `Lovable Test Gym ${Date.now().toString(36)}`,
            street: "1 Test Lane",
            city: "London",
            country: "GB",
            postcode: "NW1 6XE",
          },
        },
        ctx.accessToken,
      );
      return { createdGym: data.createGym };
    },
    render: (ctx) => (
      <ScreenCard title={ctx.createdGym?.name ?? "Gym"} subtitle="created">
        <Row label="ID" value={ctx.createdGym?.id ?? "—"} />
        <Row label="City" value={ctx.createdGym?.address?.city ?? "—"} />
      </ScreenCard>
    ),
  },
  {
    id: "myGym",
    title: "Host · myGym",
    endpoint: "Query · myGym",
    description: "Confirms the host record is wired to this account.",
    nextHint: "Press Next to update the gym description.",
    needsAuth: true,
    run: async (ctx) => {
      const data = await gql<{ myGym: any }>(Q_MY_GYM, undefined, ctx.accessToken);
      return { myGym: data.myGym };
    },
    render: (ctx) => (
      <ScreenCard title={ctx.myGym?.name ?? "—"} subtitle="myGym">
        <Row label="ID" value={ctx.myGym?.id ?? "—"} />
        <Row label="Description" value={ctx.myGym?.description ?? "(none)"} />
        <Row label="Address" value={ctx.myGym?.address ? `${ctx.myGym.address.street}, ${ctx.myGym.address.city}` : "—"} />
      </ScreenCard>
    ),
  },
  {
    id: "updateGym",
    title: "Host · update gym",
    endpoint: "Mutation · updateGym",
    description: "Writes a description to the gym.",
    nextHint: "Press Next to create a class.",
    needsAuth: true,
    run: async (ctx) => {
      const data = await gql<{ updateGym: any }>(
        M_UPDATE_GYM,
        {
          id: ctx.myGym!.id,
          i: { description: "Auto-generated by Lovable backend test." },
        },
        ctx.accessToken,
      );
      return { updatedGym: data.updateGym };
    },
    render: (ctx) => (
      <ScreenCard title={ctx.updatedGym?.name ?? "Gym"} subtitle="updated">
        <Row label="Description" value={ctx.updatedGym?.description ?? "—"} />
      </ScreenCard>
    ),
  },
  {
    id: "createClass",
    title: "Host · create class",
    endpoint: "Mutation · createClass",
    description: "Publishes a new bookable class for the gym.",
    nextHint: "Press Next to list myClasses.",
    needsAuth: true,
    run: async (ctx) => {
      const startAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();
      const data = await gql<{ createClass: any }>(
        M_CREATE_CLASS,
        {
          i: {
            title: "Backend Test Flow",
            description: "Generated by backend test page.",
            activityType: "yoga",
            startAt,
            durationMinutes: 60,
            capacity: 12,
            priceCents: 1500,
          },
        },
        ctx.accessToken,
      );
      return { createdClass: data.createClass };
    },
    render: (ctx) => (
      <ScreenCard title={ctx.createdClass?.title ?? "Class"} subtitle="created">
        <Row label="ID" value={ctx.createdClass?.id ?? "—"} />
        <Row label="Start" value={formatDate(ctx.createdClass?.startAt)} />
        <Row label="Capacity" value={String(ctx.createdClass?.capacity ?? "—")} />
        <Row label="Price" value={ctx.createdClass ? `£${(ctx.createdClass.priceCents / 100).toFixed(2)}` : "—"} />
      </ScreenCard>
    ),
  },
  {
    id: "myClasses",
    title: "Host · myClasses",
    endpoint: "Query · myClasses",
    description: "Lists every class on the host's gym.",
    nextHint: "Press Next to update the class.",
    needsAuth: true,
    run: async (ctx) => {
      const data = await gql<{ myClasses: any[] }>(Q_MY_CLASSES, undefined, ctx.accessToken);
      return { myClasses: data.myClasses };
    },
    render: (ctx) => (
      <ListScreen title={`My classes (${ctx.myClasses.length})`} empty="None yet.">
        {ctx.myClasses.slice(0, 8).map((c) => (
          <ListRow
            key={c.id}
            title={c.title}
            subtitle={`${c.activityType} · ${c.status} · £${(c.priceCents / 100).toFixed(2)}`}
          />
        ))}
      </ListScreen>
    ),
  },
  {
    id: "updateClass",
    title: "Host · update class",
    endpoint: "Mutation · updateClass",
    description: "Bumps the class capacity and lowers price.",
    nextHint: "Press Next to list bookings for this class.",
    needsAuth: true,
    run: async (ctx) => {
      const data = await gql<{ updateClass: any }>(
        M_UPDATE_CLASS,
        { id: ctx.createdClass!.id, i: { capacity: 20, priceCents: 1000 } },
        ctx.accessToken,
      );
      return { updatedClass: data.updateClass };
    },
    render: (ctx) => (
      <ScreenCard title={ctx.updatedClass?.title ?? "Class"} subtitle="updated">
        <Row label="Capacity" value={String(ctx.updatedClass?.capacity ?? "—")} />
        <Row label="Price" value={ctx.updatedClass ? `£${(ctx.updatedClass.priceCents / 100).toFixed(2)}` : "—"} />
        <Row label="Status" value={ctx.updatedClass?.status ?? "—"} />
      </ScreenCard>
    ),
  },
  {
    id: "bookingsByClass",
    title: "Host · bookingsByClass",
    endpoint: "Query · bookingsByClass",
    description: "Lists attendees for the class.",
    nextHint: "Press Next for the AI coach tip.",
    needsAuth: true,
    run: async (ctx) => {
      const data = await gql<{ bookingsByClass: any[] }>(
        Q_BOOKINGS_BY_CLASS,
        { id: ctx.createdClass!.id },
        ctx.accessToken,
      );
      return { bookingsByClass: data.bookingsByClass };
    },
    render: (ctx) => (
      <ListScreen title={`Attendees (${ctx.bookingsByClass.length})`} empty="No one booked yet.">
        {ctx.bookingsByClass.map((b) => (
          <ListRow key={b.id} title={b.userId} subtitle={`${b.status} · ${formatDate(b.scheduledAt)}`} />
        ))}
      </ListScreen>
    ),
  },
  {
    id: "coachTip",
    title: "Host · coach tip",
    endpoint: "Query · coachTip (AI)",
    description: "Asks pulstract-ai for a personalised coaching tip.",
    nextHint: "Press Next to cancel the class.",
    needsAuth: true,
    run: async (ctx) => {
      const data = await gql<{ coachTip: any }>(Q_COACH_TIP, undefined, ctx.accessToken);
      return { coachTip: data.coachTip };
    },
    render: (ctx) => (
      <ScreenCard title="AI coach tip">
        <p className="text-[12px] leading-snug">{ctx.coachTip?.tip ?? "(no tip yet)"}</p>
        <Row label="Generated" value={ctx.coachTip?.generatedAt ?? "—"} />
      </ScreenCard>
    ),
  },
  {
    id: "cancelClass",
    title: "Host · cancel class",
    endpoint: "Mutation · cancelClass",
    description: "Marks the just-created class CANCELLED.",
    nextHint: "Press Next to cancel your earlier booking.",
    needsAuth: true,
    run: async (ctx) => {
      const data = await gql<{ cancelClass: boolean }>(
        M_CANCEL_CLASS,
        { id: ctx.createdClass!.id },
        ctx.accessToken,
      );
      return { cancelledClass: data.cancelClass };
    },
    render: (ctx) => (
      <ScreenCard title="Class cancelled">
        <Row label="Result" value={ctx.cancelledClass === true ? "true" : "—"} />
      </ScreenCard>
    ),
  },
  {
    id: "cancelBooking",
    title: "Cancel booking",
    endpoint: "Mutation · cancelBooking",
    description: "Cancels the original user booking. Every documented endpoint has now been exercised.",
    nextHint: "All done — every gateway endpoint has been hit.",
    needsAuth: true,
    run: async (ctx) => {
      const data = await gql<{ cancelBooking: any }>(
        M_CANCEL_BOOKING,
        { id: ctx.booking!.id },
        ctx.accessToken,
      );
      return { cancelledBooking: data.cancelBooking };
    },
    render: (ctx) => (
      <ScreenCard title="Booking cancelled">
        <Row label="ID" value={ctx.cancelledBooking?.id ?? "—"} />
        <Row label="Status" value={ctx.cancelledBooking?.status ?? "—"} />
      </ScreenCard>
    ),
  },
];

/* ============================================================ */
/* Page                                                         */
/* ============================================================ */

function BackendTestPage() {
  const [ctx, setCtx] = useState<Ctx>(EMPTY_CTX);
  const [statuses, setStatuses] = useState<Record<string, StageStatus>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState(false);
  const [health, setHealth] = useState<HealthResult[] | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const runHealth = useServerFn(checkBackendHealth);
  const phoneRef = useRef<HTMLDivElement | null>(null);

  // Restore tokens/email from localStorage so a refresh doesn't nuke a run.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        setCtx((c) => ({ ...c, ...saved }));
      }
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          email: ctx.email,
          name: ctx.name,
          accessToken: ctx.accessToken,
          refreshToken: ctx.refreshToken,
          idToken: ctx.idToken,
        }),
      );
    } catch {}
  }, [ctx.email, ctx.name, ctx.accessToken, ctx.refreshToken, ctx.idToken]);

  const refreshHealth = async () => {
    setHealthLoading(true);
    try {
      const r = await runHealth();
      setHealth(r);
    } finally {
      setHealthLoading(false);
    }
  };
  useEffect(() => {
    refreshHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runStage = async (idx: number) => {
    const stage = STAGES[idx];
    if (!stage || busy) return;
    setBusy(true);
    setStatuses((s) => ({ ...s, [stage.id]: "running" }));
    setErrors((e) => {
      const { [stage.id]: _, ...rest } = e;
      return rest;
    });
    try {
      const patch = (await stage.run(ctx, { log: () => {} })) || {};
      setCtx((c) => ({ ...c, ...patch }));
      setStatuses((s) => ({ ...s, [stage.id]: "ok" }));
    } catch (e: any) {
      setStatuses((s) => ({ ...s, [stage.id]: "error" }));
      setErrors((er) => ({ ...er, [stage.id]: e?.message ?? String(e) }));
    } finally {
      setBusy(false);
    }
  };

  const next = () => {
    if (active < STAGES.length - 1) setActive(active + 1);
  };

  const reset = () => {
    setCtx(EMPTY_CTX);
    setStatuses({});
    setErrors({});
    setActive(0);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const currentStage = STAGES[active];
  const currentStatus = statuses[currentStage.id] ?? "pending";
  const currentError = errors[currentStage.id];

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container mx-auto max-w-6xl px-4 py-10">
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-3">
            Backend test
          </Badge>
          <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight">
            Pulstract live integration walkthrough
          </h1>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Every stage hits the real dev gateway. No dummy data. Run them in
            order — the result of each call feeds the next.
          </p>
        </div>

        <HealthPanel health={health} loading={healthLoading} onRefresh={refreshHealth} />

        <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-8 items-start mt-10">
          {/* Left: stage list */}
          <Card className="p-3 max-h-[760px] overflow-y-auto">
            <div className="px-2 py-1 mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              Stages ({Object.values(statuses).filter((s) => s === "ok").length}/{STAGES.length})
            </div>
            <ol className="space-y-1">
              {STAGES.map((s, i) => {
                const st = statuses[s.id] ?? "pending";
                const isActive = i === active;
                return (
                  <li key={s.id}>
                    <button
                      onClick={() => setActive(i)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-md flex items-center gap-3 text-sm",
                        isActive ? "bg-secondary" : "hover:bg-secondary/60",
                      )}
                    >
                      <StatusDot status={st} />
                      <span className="flex-1">
                        <span className="block text-xs text-muted-foreground tabular-nums">
                          {String(i + 1).padStart(2, "0")} · {s.endpoint}
                        </span>
                        <span className="block font-medium">{s.title}</span>
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </li>
                );
              })}
            </ol>
            <Button variant="ghost" size="sm" className="w-full mt-3" onClick={reset}>
              <RefreshCw className="h-3.5 w-3.5 mr-2" /> Reset run
            </Button>
          </Card>

          {/* Phone */}
          <div ref={phoneRef}>
            <PhoneFrame>
              <PhoneStatusBar />
              <div className="flex-1 overflow-hidden bg-background flex flex-col">
                <div className="px-4 py-3 border-b">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Stage {active + 1} / {STAGES.length}
                  </div>
                  <div className="text-sm font-semibold">{currentStage.title}</div>
                  <div className="text-[10px] text-muted-foreground">{currentStage.endpoint}</div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {currentStage.render(ctx)}
                </div>
                <div className="border-t px-3 py-2 bg-card text-[11px]">
                  <StatusLine status={currentStatus} error={currentError} />
                </div>
              </div>
            </PhoneFrame>
          </div>

          {/* Right: explanation + controls */}
          <Card className="p-5 space-y-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Endpoint
              </div>
              <div className="font-mono text-sm">{currentStage.endpoint}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                What this does
              </div>
              <p className="text-sm leading-relaxed mt-1">{currentStage.description}</p>
            </div>

            {currentStage.id === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs">
                  Email (optional — auto-generated if blank)
                </Label>
                <Input
                  id="email"
                  placeholder="lovable+test@pulstract.dev"
                  value={ctx.email}
                  onChange={(e) => setCtx((c) => ({ ...c, email: e.target.value }))}
                />
                <Label htmlFor="name" className="text-xs">
                  Display name
                </Label>
                <Input
                  id="name"
                  placeholder="Lovable Test User"
                  value={ctx.name}
                  onChange={(e) => setCtx((c) => ({ ...c, name: e.target.value }))}
                />
              </div>
            )}

            {currentError && (
              <div className="rounded-md border border-destructive/40 bg-destructive/5 text-destructive text-xs p-3 whitespace-pre-wrap break-words">
                {currentError}
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <Button
                onClick={() => runStage(active)}
                disabled={busy}
                className="flex-1"
              >
                {busy && currentStatus === "running" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                {currentStatus === "ok" ? "Run again" : "Run stage"}
              </Button>
              <Button
                onClick={next}
                variant="secondary"
                disabled={currentStatus !== "ok" || active >= STAGES.length - 1}
              >
                Next <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            <div className="text-[11px] text-muted-foreground border-t pt-3">
              <span className="font-medium text-foreground">How to enter the next stage: </span>
              {currentStage.nextHint}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ============================================================ */
/* Sub-components                                               */
/* ============================================================ */

function HealthPanel({
  health,
  loading,
  onRefresh,
}: {
  health: HealthResult[] | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  const allOk = health?.every((h) => h.ok);
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold">Service health</h2>
          {health && (
            <Badge variant={allOk ? "default" : "destructive"}>
              {allOk ? "All services healthy" : "Issues detected"}
            </Badge>
          )}
        </div>
        <Button size="sm" variant="ghost" onClick={onRefresh} disabled={loading}>
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5 mr-2" />
          )}
          Refresh
        </Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {(health ?? Array.from({ length: 11 })).map((h: any, i) => (
          <div
            key={h?.name ?? i}
            className={cn(
              "rounded-md border px-3 py-2 text-xs",
              !h && "animate-pulse bg-muted/40",
              h?.ok && "border-emerald-500/40 bg-emerald-500/5",
              h && !h.ok && "border-destructive/40 bg-destructive/5",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold capitalize">{h?.name ?? "…"}</span>
              {h?.ok ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              ) : h ? (
                <XCircle className="h-3.5 w-3.5 text-destructive" />
              ) : null}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {h ? `${h.status ?? "ERR"} · ${h.latencyMs}ms` : ""}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto" style={{ width: 360 }}>
      <div className="relative rounded-[3rem] bg-foreground p-3 shadow-elegant">
        <div className="relative h-[720px] w-[336px] overflow-hidden rounded-[2.4rem] bg-background flex flex-col">
          {children}
          <div className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 h-6 w-28 rounded-full bg-foreground" />
        </div>
      </div>
    </div>
  );
}

function PhoneStatusBar() {
  return (
    <div className="h-10 px-6 pt-3 flex items-center justify-between text-[11px] font-semibold text-foreground bg-background z-10 relative">
      <span>9:41</span>
      <span className="flex items-center gap-1">
        <Signal className="h-3 w-3" />
        <Wifi className="h-3 w-3" />
        <BatteryFull className="h-3.5 w-3.5" />
      </span>
    </div>
  );
}

function StatusDot({ status }: { status: StageStatus }) {
  const map: Record<StageStatus, string> = {
    pending: "bg-muted-foreground/30",
    running: "bg-amber-400 animate-pulse",
    ok: "bg-emerald-500",
    error: "bg-destructive",
    skipped: "bg-muted-foreground/30",
  };
  return <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", map[status])} />;
}

function StatusLine({ status, error }: { status: StageStatus; error?: string }) {
  if (status === "running") return <span className="text-amber-600">Running…</span>;
  if (status === "ok") return <span className="text-emerald-600">✓ Success — review the response in the screen, then press Next.</span>;
  if (status === "error") return <span className="text-destructive">✗ {error}</span>;
  return <span className="text-muted-foreground">Press Run stage to call the endpoint.</span>;
}

function ScreenCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="p-4">
      <div className="text-base font-semibold">{title}</div>
      {subtitle && <div className="text-xs text-muted-foreground mb-3">{subtitle}</div>}
      <div className="space-y-1 mt-2">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between text-[11px] gap-3 py-1 border-b border-border/40 last:border-b-0">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-mono text-right break-all">{value}</span>
    </div>
  );
}

function ListScreen({
  title,
  empty,
  children,
  inset,
}: {
  title: string;
  empty: string;
  children: ReactNode;
  inset?: boolean;
}) {
  const items = Array.isArray(children) ? children : [children];
  const isEmpty = items.filter(Boolean).length === 0;
  return (
    <div className={cn("flex-1 flex flex-col", inset ? "" : "")}>
      <div className="px-4 py-3 text-sm font-semibold border-b">{title}</div>
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="p-4 text-xs text-muted-foreground">{empty}</div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function ListRow({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="px-4 py-3 border-b border-border/40">
      <div className="text-[12px] font-medium truncate">{title}</div>
      <div className="text-[10px] text-muted-foreground truncate">{subtitle}</div>
    </div>
  );
}

/* ============================================================ */
/* Utilities                                                    */
/* ============================================================ */

function short(s?: string | null, n = 24) {
  if (!s) return "—";
  if (s.length <= n) return s;
  return s.slice(0, n) + "…";
}

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function cryptoRandomPassword() {
  // Cognito requires symbols+digits+upper+lower
  const base = (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36)).replace(/-/g, "");
  return `Aa1!${base}`;
}

// Re-export to silence unused-import warnings if any
export const __unused = { Textarea, CheckCircle2 };
