// Shared Pulstract backend client: Cognito auth + GraphQL gateway.
// Used by /mobile and /backend-test.

export const GQL_URL = "https://dev.api.gateway.pulstract.com/graphql";
export const COGNITO_REGION = "eu-central-1";
export const COGNITO_CLIENT_ID = "7rqtsmq8sf8mfd2dfacpmqpvg4";
export const COGNITO_URL = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`;

export async function cognito<T = any>(target: string, body: unknown): Promise<T> {
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

export async function gql<T = any>(
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
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data as T;
}

export function cryptoRandomPassword(): string {
  // 24-char password meeting Cognito default policy (upper, lower, digit, symbol).
  const arr = new Uint8Array(18);
  crypto.getRandomValues(arr);
  const base = btoa(String.fromCharCode(...arr)).replace(/[^a-zA-Z0-9]/g, "");
  return `Aa1!${base.slice(0, 20)}`;
}

/* ============================================================ */
/* GraphQL operations                                           */
/* ============================================================ */

export const Q_ME = `query Me { me { id email name createdAt } }`;
export const Q_PROFILE = `query P($id:ID!){ profile(userId:$id){ userId bio avatarUrl updatedAt } }`;
export const Q_GYMS = `query G($f:GymFilter,$p:Pagination){ gyms(filter:$f,pagination:$p){ items{ id name description rating totalRatings address{ street city country postcode lat lng } } nextToken } }`;
export const Q_GYM = `query GG($id:ID!){ gym(id:$id){ id name description rating totalRatings address{ street city country postcode lat lng } createdAt } }`;
export const Q_CLASSES = `query C($f:ClassFilter,$p:Pagination){ classes(filter:$f,pagination:$p){ items{ id gymId title description activityType startAt durationMinutes capacity priceCents status gymName city country } nextToken } }`;
export const Q_CLASS = `query CC($id:ID!){ class(id:$id){ id gymId title description activityType startAt durationMinutes capacity priceCents status gymName city country createdAt } }`;
export const Q_BOOKING = `query B($id:ID!){ booking(id:$id){ id userId classId gymId scheduledAt status createdAt } }`;
export const Q_MY_BOOKINGS = `query MB($f:BookingFilter,$p:Pagination){ bookings(filter:$f,pagination:$p){ items{ id classId gymId scheduledAt status createdAt } nextToken } }`;
export const Q_PAYMENT_BY_BOOKING = `query PB($id:ID!){ paymentByBooking(bookingId:$id){ id bookingId amount currency status createdAt } }`;
export const Q_REVIEWS = `query R($g:ID!){ reviews(gymId:$g){ id userId rating comment createdAt } }`;
export const Q_REVIEW_SUMMARY = `query RS($g:ID!){ reviewSummary(gymId:$g){ gymId summary reviewCount generatedAt } }`;
export const Q_SMART = `query SS($q:String!){ smartSearchFilters(query:$q){ activityType city radiusKm minRating } }`;
export const Q_MY_GYM = `query MG{ myGym{ id name description rating totalRatings address{ street city country postcode } } }`;
export const Q_MY_CLASSES = `query MC{ myClasses{ id title description activityType startAt durationMinutes capacity priceCents status } }`;
export const Q_BOOKINGS_BY_CLASS = `query BBC($id:ID!){ bookingsByClass(classId:$id){ id userId scheduledAt status } }`;
export const Q_COACH_TIP = `query CT{ coachTip{ hostId tip generatedAt } }`;

export const M_CREATE_BOOKING = `mutation CB($i:CreateBookingInput!){ createBooking(input:$i){ id classId gymId scheduledAt status createdAt } }`;
export const M_UPDATE_PROFILE = `mutation UP($i:UpdateProfileInput!){ updateProfile(input:$i){ userId bio avatarUrl updatedAt } }`;
export const M_CREATE_CLASS = `mutation CC($i:CreateClassInput!){ createClass(input:$i){ id title activityType startAt durationMinutes capacity priceCents status } }`;
export const M_UPDATE_CLASS = `mutation UC($id:ID!,$i:UpdateClassInput!){ updateClass(id:$id,input:$i){ id title capacity priceCents status } }`;
export const M_CANCEL_CLASS = `mutation CnC($id:ID!){ cancelClass(id:$id) }`;
export const M_CANCEL_BOOKING = `mutation CnB($id:ID!){ cancelBooking(id:$id){ id status } }`;
export const M_CREATE_GYM = `mutation CG($i:CreateGymInput!){ createGym(input:$i){ id name description address{ street city country postcode } } }`;
export const M_UPDATE_GYM = `mutation UG($id:ID!,$i:UpdateGymInput!){ updateGym(id:$id,input:$i){ id name description address{ street city country postcode } } }`;
export const M_SUBMIT_REVIEW = `mutation SR($i:SubmitReviewInput!){ submitReview(input:$i){ id gymId rating comment createdAt } }`;
export const M_PAYMENT_INTENT = `mutation PI($i:CreatePaymentIntentInput!){ createPaymentIntent(input:$i){ id bookingId amount currency status clientSecret createdAt } }`;

/* ============================================================ */
/* Types (loose — the gateway is source of truth)               */
/* ============================================================ */

export type ApiUser = { id: string; email: string; name: string; createdAt?: string };
export type ApiAddress = { street?: string; city?: string; country?: string; postcode?: string; lat?: number; lng?: number };
export type ApiGym = { id: string; name: string; description?: string | null; rating?: number | null; totalRatings?: number | null; address?: ApiAddress | null };
export type ApiClass = {
  id: string;
  gymId: string;
  title: string;
  description?: string | null;
  activityType: string;
  startAt: string; // ISO
  durationMinutes: number;
  capacity: number;
  priceCents: number;
  status: string;
  gymName?: string | null;
  city?: string | null;
  country?: string | null;
};
export type ApiBooking = { id: string; classId: string; gymId?: string; scheduledAt: string; status: string; createdAt?: string; userId?: string };
export type ApiProfile = { userId: string; bio?: string | null; avatarUrl?: string | null; updatedAt?: string | null };
export type ApiReview = { id: string; userId: string; rating: number; comment?: string | null; createdAt: string };
export type ApiPayment = { id: string; bookingId: string; amount: number; currency: string; status: string; createdAt?: string; clientSecret?: string };
