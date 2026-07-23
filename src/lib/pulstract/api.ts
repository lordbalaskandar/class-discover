// Shared Pulstract backend client: Cognito auth + GraphQL gateway.
// Used by /mobile and /backend-test.

export const GQL_URL = "https://dev.api.gateway.pulstract.com/graphql";
export const COGNITO_REGION = "eu-central-1";
export const COGNITO_CLIENT_ID = "79sv9id14uivekvkdju89qg5tf";
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

export const Q_ME = `query Me { me { id email name isHost createdAt } }`;
export const Q_PROFILE = `query P($id:ID!){ profile(userId:$id){ userId bio avatarUrl displayName notificationEmail notificationPush updatedAt } }`;
export const Q_GYMS = `query G($f:GymFilter,$p:Pagination){ gyms(filter:$f,pagination:$p){ items{ id name description rating totalRatings amenities capacity monthlyPriceCents address{ street city country postcode lat lng } } nextToken } }`;
export const Q_GYM = `query GG($id:ID!){ gym(id:$id){ id name description rating totalRatings amenities capacity monthlyPriceCents address{ street city country postcode lat lng } createdAt } }`;
export const Q_CLASSES = `query C($f:ClassFilter,$p:Pagination){ classes(filter:$f,pagination:$p){ items{ id gymId title description activityType startAt durationMinutes capacity priceCents status gymName city country } nextToken } }`;
export const Q_CLASS = `query CC($id:ID!){ class(id:$id){ id gymId title description activityType startAt durationMinutes capacity priceCents status gymName city country createdAt } }`;
export const Q_BOOKING = `query B($id:ID!){ booking(id:$id){ id userId classId gymId scheduledAt status createdAt } }`;
export const Q_MY_BOOKINGS = `query MB($f:BookingFilter,$p:Pagination){ bookings(filter:$f,pagination:$p){ items{ id classId gymId scheduledAt status createdAt } nextToken } }`;
export const Q_PAYMENT_BY_BOOKING = `query PB($id:ID!){ paymentByBooking(bookingId:$id){ id bookingId amount currency status createdAt } }`;
export const Q_REVIEWS = `query R($g:ID!){ reviews(gymId:$g){ id userId userName userAvatarUrl rating comment createdAt response respondedAt flagged } }`;
export const Q_REVIEW_SUMMARY = `query RS($g:ID!){ reviewSummary(gymId:$g){ gymId summary reviewCount generatedAt } }`;
export const Q_SMART = `query SS($q:String!){ smartSearchFilters(query:$q){ activityType city radiusKm minRating } }`;
export const Q_MY_GYM = `query MG{ myGym{ id name description rating totalRatings amenities capacity monthlyPriceCents address{ street city country postcode } } }`;
export const Q_MY_CLASSES = `query MC{ myClasses{ id title description activityType startAt durationMinutes capacity priceCents status } }`;
export const Q_BOOKINGS_BY_CLASS = `query BBC($id:ID!){ bookingsByClass(classId:$id){ id userId scheduledAt status attendeeName } }`;
export const Q_COACH_TIP = `query CT{ coachTip{ hostId tip generatedAt } }`;
export const Q_SAVED_CLASSES = `query SC{ savedClasses{ id gymId title activityType startAt durationMinutes capacity priceCents status gymName city } }`;
export const Q_PAYMENT_METHODS = `query PM{ paymentMethods{ id brand last4 expMonth expYear isDefault } }`;
export const Q_MY_GYM_REVIEWS = `query MGR{ myGymReviews{ id userId userName userAvatarUrl gymId rating comment createdAt response respondedAt flagged } }`;
export const Q_METRICS_FUNNEL = `query MF($p:String){ metricsFunnel(period:$p){ gymId period views bookings conversions } }`;
export const Q_GYM_MEMBERSHIPS = `query GM($g:ID!){ gymMemberships(gymId:$g){ id gymId userId email status monthlyPriceCents joinedAt } }`;

export const M_CREATE_BOOKING = `mutation CB($i:CreateBookingInput!){ createBooking(input:$i){ id classId gymId scheduledAt status createdAt } }`;
export const M_UPDATE_PROFILE = `mutation UP($i:UpdateProfileInput!){ updateProfile(input:$i){ userId bio avatarUrl updatedAt } }`;
export const M_CREATE_CLASS = `mutation CC($i:CreateClassInput!){ createClass(input:$i){ id title activityType startAt durationMinutes capacity priceCents status } }`;
export const M_UPDATE_CLASS = `mutation UC($id:ID!,$i:UpdateClassInput!){ updateClass(id:$id,input:$i){ id title capacity priceCents status } }`;
export const M_CANCEL_CLASS = `mutation CnC($id:ID!){ cancelClass(id:$id) }`;
export const M_CANCEL_BOOKING = `mutation CnB($id:ID!){ cancelBooking(id:$id){ id status } }`;
export const M_CREATE_GYM = `mutation CG($i:CreateGymInput!){ createGym(input:$i){ id name description address{ street city country postcode } } }`;
export const M_UPDATE_GYM = `mutation UG($id:ID!,$i:UpdateGymInput!){ updateGym(id:$id,input:$i){ id name description amenities capacity monthlyPriceCents address{ street city country postcode } } }`;
export const M_SUBMIT_REVIEW = `mutation SR($i:SubmitReviewInput!){ submitReview(input:$i){ id gymId rating comment createdAt } }`;
export const M_PAYMENT_INTENT = `mutation PI($i:CreatePaymentIntentInput!){ createPaymentIntent(input:$i){ id bookingId amount currency status clientSecret createdAt } }`;
export const M_TOGGLE_SAVED = `mutation TS($id:ID!){ toggleSavedClass(classId:$id) }`;
export const M_BECOME_HOST = `mutation BH{ becomeHost{ id email name isHost createdAt } }`;
export const M_UPDATE_NOTIF = `mutation UN($i:UpdateNotificationPreferencesInput!){ updateNotificationPreferences(input:$i){ userId notificationEmail notificationPush } }`;
export const M_INVITE_MEMBER = `mutation IM($g:ID!,$e:String!,$p:Int){ inviteMember(gymId:$g,email:$e,monthlyPriceCents:$p){ id gymId userId email status monthlyPriceCents joinedAt } }`;
export const M_UPDATE_MEMBER = `mutation UM($g:ID!,$u:ID!,$i:UpdateMemberInput!){ updateMember(gymId:$g,userId:$u,input:$i){ id gymId userId email status monthlyPriceCents joinedAt } }`;
export const M_REMOVE_MEMBER = `mutation RM($g:ID!,$u:ID!){ removeMember(gymId:$g,userId:$u) }`;
export const M_ADD_PAYMENT_METHOD = `mutation APM($p:String!){ addPaymentMethod(paymentMethodId:$p){ id brand last4 expMonth expYear isDefault } }`;
export const M_REMOVE_PAYMENT_METHOD = `mutation RPM($id:String!){ removePaymentMethod(id:$id) }`;
export const M_SET_DEFAULT_PAYMENT_METHOD = `mutation SDPM($id:String!){ setDefaultPaymentMethod(id:$id){ id brand last4 isDefault } }`;

/* Host operations — payouts, templates, availability, reviews, support */
export const Q_PAYOUTS = `query PO($p:Pagination){ payouts(pagination:$p){ items{ id amountCents currency status arrivalDate createdAt failureMessage } nextToken } }`;
export const Q_NEXT_PAYOUT = `query NP{ nextPayout{ id amountCents currency status arrivalDate createdAt failureMessage } }`;
export const Q_HOST_EARNINGS = `query HE($p:String!){ hostEarnings(period:$p){ period grossCents netCents platformFeeCents refundedCents bookingCount series{ date grossCents netCents bookings } } }`;
export const Q_HOST_PAYOUT_ACCOUNT = `query HPA{ hostPayoutAccount{ status payoutsEnabled requirementsDue bankLast4 availableCents pendingCents currency } }`;
export const Q_CLASS_TEMPLATES = `query CT{ classTemplates{ id gymId title description activityType durationMinutes capacity priceCents createdAt updatedAt } }`;
export const Q_HOST_AVAILABILITY = `query HA{ hostAvailability{ timezone weekly{ weekday startMinutes endMinutes } blackouts{ date reason } } }`;
export const Q_HOST_SUPPORT_TICKETS = `query HST{ hostSupportTickets{ id subject body status createdAt } }`;
export const Q_TOP_CLASSES = `query TC($p:String!){ topClasses(period:$p){ classId title bookings revenueCents } }`;
export const Q_ATTENDANCE_STATS = `query AS($p:String!){ attendanceStats(period:$p){ period scheduled attended noShows cancellations } }`;
export const Q_HOST_RETENTION = `query HR($p:String!){ hostRetention(period:$p){ period ltvCents activeMembers atRiskCount cohorts{ cohort size retained } } }`;

export const M_CREATE_TEMPLATE = `mutation CTP($i:CreateClassTemplateInput!){ createClassTemplate(input:$i){ id title activityType durationMinutes capacity priceCents } }`;
export const M_UPDATE_TEMPLATE = `mutation UTP($id:ID!,$i:CreateClassTemplateInput!){ updateClassTemplate(id:$id,input:$i){ id title } }`;
export const M_DELETE_TEMPLATE = `mutation DTP($id:ID!){ deleteClassTemplate(id:$id) }`;
export const M_SET_HOST_AVAIL = `mutation SHA($i:SetHostAvailabilityInput!){ setHostAvailability(input:$i){ timezone weekly{ weekday startMinutes endMinutes } blackouts{ date reason } } }`;
export const M_CREATE_SUPPORT = `mutation CS($s:String!,$b:String!){ createSupportTicket(subject:$s, body:$b){ id subject body status createdAt } }`;
export const M_RESPOND_REVIEW = `mutation RR($id:ID!,$r:String!){ respondToReview(reviewId:$id, response:$r){ id response respondedAt } }`;
export const M_FLAG_REVIEW = `mutation FR($id:ID!,$r:String!){ flagReview(reviewId:$id, reason:$r) }`;
export const M_SUBMIT_PAYOUT_PROFILE = `mutation SPP($i:HostPayoutProfileInput!){ submitHostPayoutProfile(input:$i){ status payoutsEnabled bankLast4 availableCents pendingCents currency } }`;
export const M_CASH_OUT = `mutation CO{ cashOutHost{ id amountCents currency status arrivalDate createdAt } }`;

export type ApiPayout = { id: string; amountCents: number; currency: string; status: string; arrivalDate?: string | null; createdAt: string; failureMessage?: string | null };
export type ApiHostEarnings = { period: string; grossCents: number; netCents: number; platformFeeCents: number; refundedCents: number; bookingCount: number; series: { date: string; grossCents: number; netCents: number; bookings: number }[] };
export type ApiHostPayoutAccount = { status: string; payoutsEnabled: boolean; requirementsDue: string[]; bankLast4?: string | null; availableCents: number; pendingCents: number; currency: string };
export type ApiClassTemplate = { id: string; gymId: string; title: string; description?: string | null; activityType: string; durationMinutes: number; capacity: number; priceCents: number; createdAt: string; updatedAt: string };
export type ApiHostAvailability = { timezone: string; weekly: { weekday: number; startMinutes: number; endMinutes: number }[]; blackouts: { date: string; reason?: string | null }[] };
export type ApiSupportTicket = { id: string; subject: string; body: string; status: string; createdAt: string };
export type ApiTopClass = { classId: string; title: string; bookings: number; revenueCents: number };
export type ApiAttendanceStats = { period: string; scheduled: number; attended: number; noShows: number; cancellations: number };

/* ============================================================ */
/* Types (loose — the gateway is source of truth)               */
/* ============================================================ */

export type ApiUser = { id: string; email: string; name: string; isHost?: boolean; createdAt?: string };
export type ApiAddress = { street?: string; city?: string; country?: string; postcode?: string; lat?: number; lng?: number };
export type ApiGym = {
  id: string;
  name: string;
  description?: string | null;
  rating?: number | null;
  totalRatings?: number | null;
  amenities?: string[] | null;
  capacity?: number | null;
  monthlyPriceCents?: number | null;
  address?: ApiAddress | null;
};
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
export type ApiBooking = { id: string; classId: string; gymId?: string; scheduledAt: string; status: string; createdAt?: string; userId?: string; attendeeName?: string | null };
export type ApiProfile = {
  userId: string;
  bio?: string | null;
  avatarUrl?: string | null;
  displayName?: string | null;
  notificationEmail?: boolean;
  notificationPush?: boolean;
  updatedAt?: string | null;
};
export type ApiReview = { id: string; userId: string; gymId?: string; rating: number; comment?: string | null; createdAt: string };
export type ApiPayment = { id: string; bookingId: string; amount: number; currency: string; status: string; createdAt?: string; clientSecret?: string };
export type ApiPaymentMethod = { id: string; brand: string; last4: string; expMonth: number; expYear: number; isDefault: boolean };
export type ApiMetricsFunnel = { gymId: string; period: string; views: number; bookings: number; conversions: number };
export type ApiGymMembership = { id: string; gymId: string; userId?: string | null; email: string; status: string; monthlyPriceCents?: number | null; joinedAt: string };
