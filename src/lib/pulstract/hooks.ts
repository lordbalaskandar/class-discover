// Mobile data hooks — thin useQuery wrappers over the Pulstract GraphQL gateway.
// Screens call these instead of using mock data.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  gql,
  Q_CLASSES,
  Q_CLASS,
  Q_ME,
  Q_PROFILE,
  Q_GYMS,
  Q_GYM,
  Q_MY_BOOKINGS,
  Q_BOOKING,
  Q_PAYMENT_BY_BOOKING,
  Q_REVIEWS,
  Q_REVIEW_SUMMARY,
  Q_MY_GYM,
  Q_MY_CLASSES,
  Q_BOOKINGS_BY_CLASS,
  Q_COACH_TIP,
  Q_SAVED_CLASSES,
  Q_PAYMENT_METHODS,
  Q_MY_GYM_REVIEWS,
  Q_METRICS_FUNNEL,
  Q_GYM_MEMBERSHIPS,
  M_CREATE_BOOKING,
  M_PAYMENT_INTENT,
  M_UPDATE_PROFILE,
  M_CREATE_CLASS,
  M_UPDATE_CLASS,
  M_CANCEL_CLASS,
  M_CANCEL_BOOKING,
  M_CREATE_GYM,
  M_UPDATE_GYM,
  M_SUBMIT_REVIEW,
  M_TOGGLE_SAVED,
  M_BECOME_HOST,
  M_UPDATE_NOTIF,
  M_INVITE_MEMBER,
  M_UPDATE_MEMBER,
  M_REMOVE_MEMBER,
  M_ADD_PAYMENT_METHOD,
  M_REMOVE_PAYMENT_METHOD,
  M_SET_DEFAULT_PAYMENT_METHOD,
  type ApiClass,
  type ApiGym,
  type ApiBooking,
  type ApiUser,
  type ApiProfile,
  type ApiReview,
  type ApiPayment,
  type ApiPaymentMethod,
  type ApiMetricsFunnel,
  type ApiGymMembership,
} from "./api";
import { usePulstractAuth } from "./auth";

function useToken() {
  const { session } = usePulstractAuth();
  return session?.accessToken ?? null;
}

/* ============================= Queries ============================= */

export function useClasses(limit = 30) {
  const token = useToken();
  return useQuery({
    enabled: !!token,
    queryKey: ["classes", limit],
    queryFn: async () => {
      const d = await gql<{ classes: { items: ApiClass[]; nextToken: string | null } }>(
        Q_CLASSES,
        { f: null, p: { limit } },
        token,
      );
      return d.classes.items ?? [];
    },
  });
}

export function useClass(id: string | null) {
  const token = useToken();
  return useQuery({
    enabled: !!token && !!id,
    queryKey: ["class", id],
    queryFn: async () => {
      const d = await gql<{ class: ApiClass }>(Q_CLASS, { id }, token);
      return d.class;
    },
  });
}

export function useGyms(limit = 30) {
  const token = useToken();
  return useQuery({
    enabled: !!token,
    queryKey: ["gyms", limit],
    queryFn: async () => {
      const d = await gql<{ gyms: { items: ApiGym[]; nextToken: string | null } }>(
        Q_GYMS,
        { f: null, p: { limit } },
        token,
      );
      return d.gyms.items ?? [];
    },
  });
}

export function useGym(id: string | null) {
  const token = useToken();
  return useQuery({
    enabled: !!token && !!id,
    queryKey: ["gym", id],
    queryFn: async () => {
      const d = await gql<{ gym: ApiGym }>(Q_GYM, { id }, token);
      return d.gym;
    },
  });
}

export function useMe() {
  const token = useToken();
  return useQuery({
    enabled: !!token,
    queryKey: ["me"],
    queryFn: async () => {
      const d = await gql<{ me: ApiUser }>(Q_ME, undefined, token);
      return d.me;
    },
  });
}

export function useProfile(userId: string | null) {
  const token = useToken();
  return useQuery({
    enabled: !!token && !!userId,
    queryKey: ["profile", userId],
    queryFn: async () => {
      const d = await gql<{ profile: ApiProfile | null }>(Q_PROFILE, { id: userId }, token);
      return d.profile;
    },
  });
}

export function useMyBookings() {
  const token = useToken();
  return useQuery({
    enabled: !!token,
    queryKey: ["myBookings"],
    queryFn: async () => {
      const d = await gql<{ bookings: { items: ApiBooking[]; nextToken: string | null } }>(
        Q_MY_BOOKINGS,
        { f: null, p: { limit: 50 } },
        token,
      );
      return d.bookings.items ?? [];
    },
  });
}

export function useBooking(id: string | null) {
  const token = useToken();
  return useQuery({
    enabled: !!token && !!id,
    queryKey: ["booking", id],
    queryFn: async () => {
      const d = await gql<{ booking: ApiBooking }>(Q_BOOKING, { id }, token);
      return d.booking;
    },
  });
}

export function usePaymentByBooking(bookingId: string | null) {
  const token = useToken();
  return useQuery({
    enabled: !!token && !!bookingId,
    queryKey: ["paymentByBooking", bookingId],
    queryFn: async () => {
      const d = await gql<{ paymentByBooking: ApiPayment | null }>(
        Q_PAYMENT_BY_BOOKING,
        { id: bookingId },
        token,
      );
      return d.paymentByBooking;
    },
  });
}

export function useReviews(gymId: string | null) {
  const token = useToken();
  return useQuery({
    enabled: !!token && !!gymId,
    queryKey: ["reviews", gymId],
    queryFn: async () => {
      const d = await gql<{ reviews: ApiReview[] }>(Q_REVIEWS, { g: gymId }, token);
      return d.reviews ?? [];
    },
  });
}

export function useReviewSummary(gymId: string | null) {
  const token = useToken();
  return useQuery({
    enabled: !!token && !!gymId,
    queryKey: ["reviewSummary", gymId],
    queryFn: async () => {
      const d = await gql<{ reviewSummary: any }>(Q_REVIEW_SUMMARY, { g: gymId }, token);
      return d.reviewSummary;
    },
  });
}

export function useMyGym() {
  const token = useToken();
  return useQuery({
    enabled: !!token,
    queryKey: ["myGym"],
    queryFn: async () => {
      const d = await gql<{ myGym: ApiGym | null }>(Q_MY_GYM, undefined, token);
      return d.myGym;
    },
  });
}

export function useMyClasses() {
  const token = useToken();
  return useQuery({
    enabled: !!token,
    queryKey: ["myClasses"],
    queryFn: async () => {
      const d = await gql<{ myClasses: ApiClass[] }>(Q_MY_CLASSES, undefined, token);
      return d.myClasses ?? [];
    },
  });
}

export function useBookingsByClass(classId: string | null) {
  const token = useToken();
  return useQuery({
    enabled: !!token && !!classId,
    queryKey: ["bookingsByClass", classId],
    queryFn: async () => {
      const d = await gql<{ bookingsByClass: ApiBooking[] }>(
        Q_BOOKINGS_BY_CLASS,
        { id: classId },
        token,
      );
      return d.bookingsByClass ?? [];
    },
  });
}

export function useCoachTip() {
  const token = useToken();
  return useQuery({
    enabled: !!token,
    queryKey: ["coachTip"],
    queryFn: async () => {
      const d = await gql<{ coachTip: any }>(Q_COACH_TIP, undefined, token);
      return d.coachTip;
    },
  });
}

/* ============================= Mutations ============================= */

export function useCreateBooking() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { classId: string; scheduledAt?: string }) => {
      // Backend `CreateBookingInput` currently accepts only `classId`;
      // scheduledAt is inferred from the class start time on the server.
      const d = await gql<{ createBooking: ApiBooking }>(
        M_CREATE_BOOKING,
        { i: { classId: input.classId } },
        token,
      );
      return d.createBooking;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["myBookings"] }),
  });
}

export function useCreatePaymentIntent() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { bookingId: string; amount: number; currency: string }) => {
      const d = await gql<{ createPaymentIntent: ApiPayment }>(
        M_PAYMENT_INTENT,
        { i: input },
        token,
      );
      return d.createPaymentIntent;
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ["paymentByBooking", vars.bookingId] }),
  });
}

export function useUpdateProfile() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { bio?: string; avatarUrl?: string }) => {
      const d = await gql<{ updateProfile: ApiProfile }>(
        M_UPDATE_PROFILE,
        { i: input },
        token,
      );
      return d.updateProfile;
    },
    onSuccess: (d) => qc.invalidateQueries({ queryKey: ["profile", d.userId] }),
  });
}

export function useCreateClass() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      title: string;
      description?: string;
      activityType: string;
      startAt: string;
      durationMinutes: number;
      capacity: number;
      priceCents: number;
    }) => {
      const d = await gql<{ createClass: ApiClass }>(M_CREATE_CLASS, { i: input }, token);
      return d.createClass;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myClasses"] });
      qc.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}

export function useUpdateClass() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Record<string, unknown> }) => {
      const d = await gql<{ updateClass: ApiClass }>(M_UPDATE_CLASS, { id, i: input }, token);
      return d.updateClass;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["myClasses"] }),
  });
}

export function useCancelClass() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await gql<{ cancelClass: boolean }>(M_CANCEL_CLASS, { id }, token);
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["myClasses"] }),
  });
}

export function useCancelBooking() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const d = await gql<{ cancelBooking: ApiBooking }>(M_CANCEL_BOOKING, { id }, token);
      return d.cancelBooking;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["myBookings"] }),
  });
}

export function useCreateGym() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      description?: string;
      address: { street?: string; city?: string; country?: string; postcode?: string };
    }) => {
      const d = await gql<{ createGym: ApiGym }>(M_CREATE_GYM, { i: input }, token);
      return d.createGym;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myGym"] });
      qc.invalidateQueries({ queryKey: ["gyms"] });
    },
  });
}

export function useUpdateGym() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Record<string, unknown> }) => {
      const d = await gql<{ updateGym: ApiGym }>(M_UPDATE_GYM, { id, i: input }, token);
      return d.updateGym;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["myGym"] }),
  });
}

export function useSubmitReview() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { gymId: string; rating: number; comment?: string }) => {
      const d = await gql<{ submitReview: ApiReview }>(M_SUBMIT_REVIEW, { i: input }, token);
      return d.submitReview;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["reviews", vars.gymId] });
      qc.invalidateQueries({ queryKey: ["reviewSummary", vars.gymId] });
    },
  });
}


/* ============================= New endpoint hooks ============================= */

export function useSavedClasses() {
  const token = useToken();
  return useQuery({
    enabled: !!token,
    queryKey: ["savedClasses"],
    queryFn: async () => {
      const d = await gql<{ savedClasses: ApiClass[] }>(Q_SAVED_CLASSES, undefined, token);
      return d.savedClasses ?? [];
    },
  });
}

export function useToggleSavedClass() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (classId: string) => {
      const d = await gql<{ toggleSavedClass: boolean }>(M_TOGGLE_SAVED, { id: classId }, token);
      return d.toggleSavedClass;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["savedClasses"] }),
  });
}

export function usePaymentMethods() {
  const token = useToken();
  return useQuery({
    enabled: !!token,
    queryKey: ["paymentMethods"],
    queryFn: async () => {
      const d = await gql<{ paymentMethods: ApiPaymentMethod[] }>(Q_PAYMENT_METHODS, undefined, token);
      return d.paymentMethods ?? [];
    },
  });
}

export function useAddPaymentMethod() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (paymentMethodId: string) => {
      const d = await gql<{ addPaymentMethod: ApiPaymentMethod }>(
        M_ADD_PAYMENT_METHOD,
        { p: paymentMethodId },
        token,
      );
      return d.addPaymentMethod;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["paymentMethods"] }),
  });
}

export function useRemovePaymentMethod() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await gql<{ removePaymentMethod: boolean }>(M_REMOVE_PAYMENT_METHOD, { id }, token);
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["paymentMethods"] }),
  });
}

export function useSetDefaultPaymentMethod() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const d = await gql<{ setDefaultPaymentMethod: ApiPaymentMethod }>(
        M_SET_DEFAULT_PAYMENT_METHOD,
        { id },
        token,
      );
      return d.setDefaultPaymentMethod;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["paymentMethods"] }),
  });
}

export function useMyGymReviews() {
  const token = useToken();
  return useQuery({
    enabled: !!token,
    queryKey: ["myGymReviews"],
    queryFn: async () => {
      const d = await gql<{ myGymReviews: ApiReview[] }>(Q_MY_GYM_REVIEWS, undefined, token);
      return d.myGymReviews ?? [];
    },
  });
}

export function useMetricsFunnel(period: string = "month") {
  const token = useToken();
  return useQuery({
    enabled: !!token,
    queryKey: ["metricsFunnel", period],
    queryFn: async () => {
      const d = await gql<{ metricsFunnel: ApiMetricsFunnel }>(Q_METRICS_FUNNEL, { p: period }, token);
      return d.metricsFunnel;
    },
  });
}

export function useGymMemberships(gymId: string | null) {
  const token = useToken();
  return useQuery({
    enabled: !!token && !!gymId,
    queryKey: ["gymMemberships", gymId],
    queryFn: async () => {
      const d = await gql<{ gymMemberships: ApiGymMembership[] }>(
        Q_GYM_MEMBERSHIPS,
        { g: gymId },
        token,
      );
      return d.gymMemberships ?? [];
    },
  });
}

export function useInviteMember() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { gymId: string; email: string; monthlyPriceCents?: number }) => {
      const d = await gql<{ inviteMember: ApiGymMembership }>(
        M_INVITE_MEMBER,
        { g: input.gymId, e: input.email, p: input.monthlyPriceCents },
        token,
      );
      return d.inviteMember;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["gymMemberships", vars.gymId] }),
  });
}

export function useUpdateMember() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      gymId,
      userId,
      input,
    }: {
      gymId: string;
      userId: string;
      input: { monthlyPriceCents?: number; status?: string };
    }) => {
      const d = await gql<{ updateMember: ApiGymMembership | null }>(
        M_UPDATE_MEMBER,
        { g: gymId, u: userId, i: input },
        token,
      );
      return d.updateMember;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gymMemberships"] }),
  });
}

export function useRemoveMember() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ gymId, userId }: { gymId: string; userId: string }) => {
      await gql<{ removeMember: boolean }>(M_REMOVE_MEMBER, { g: gymId, u: userId }, token);
      return userId;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gymMemberships"] }),
  });
}


export function useBecomeHost() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const d = await gql<{ becomeHost: ApiUser }>(M_BECOME_HOST, undefined, token);
      return d.becomeHost;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
  });
}

export function useUpdateNotificationPrefs() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { notificationEmail?: boolean; notificationPush?: boolean }) => {
      const d = await gql<{
        updateNotificationPreferences: { userId: string; notificationEmail: boolean; notificationPush: boolean };
      }>(M_UPDATE_NOTIF, { i: input }, token);
      return d.updateNotificationPreferences;
    },
    onSuccess: (d) => qc.invalidateQueries({ queryKey: ["profile", d.userId] }),
  });
}

/* ============================= Host: payouts / earnings / templates / availability / support ============================= */

import {
  Q_PAYOUTS,
  Q_NEXT_PAYOUT,
  Q_HOST_EARNINGS,
  Q_HOST_PAYOUT_ACCOUNT,
  Q_CLASS_TEMPLATES,
  Q_HOST_AVAILABILITY,
  Q_HOST_SUPPORT_TICKETS,
  Q_TOP_CLASSES,
  Q_ATTENDANCE_STATS,
  Q_HOST_RETENTION,
  M_CREATE_TEMPLATE,
  M_UPDATE_TEMPLATE,
  M_DELETE_TEMPLATE,
  M_SET_HOST_AVAIL,
  M_CREATE_SUPPORT,
  M_RESPOND_REVIEW,
  M_FLAG_REVIEW,
  M_SUBMIT_PAYOUT_PROFILE,
  M_CASH_OUT,
  type ApiPayout,
  type ApiHostEarnings,
  type ApiHostPayoutAccount,
  type ApiClassTemplate,
  type ApiHostAvailability,
  type ApiSupportTicket,
  type ApiTopClass,
  type ApiAttendanceStats,
} from "./api";

export function usePayouts() {
  const token = useToken();
  return useQuery({
    enabled: !!token,
    queryKey: ["payouts"],
    queryFn: async () => {
      const d = await gql<{ payouts: { items: ApiPayout[]; nextToken: string | null } }>(
        Q_PAYOUTS, { p: { limit: 20 } }, token,
      );
      return d.payouts.items ?? [];
    },
  });
}

export function useNextPayout() {
  const token = useToken();
  return useQuery({
    enabled: !!token,
    queryKey: ["nextPayout"],
    queryFn: async () => {
      const d = await gql<{ nextPayout: ApiPayout | null }>(Q_NEXT_PAYOUT, undefined, token);
      return d.nextPayout;
    },
  });
}

export function useHostEarnings(period: string = "week") {
  const token = useToken();
  return useQuery({
    enabled: !!token,
    queryKey: ["hostEarnings", period],
    queryFn: async () => {
      const d = await gql<{ hostEarnings: ApiHostEarnings | null }>(Q_HOST_EARNINGS, { p: period }, token);
      return d.hostEarnings;
    },
  });
}

export function useHostPayoutAccount() {
  const token = useToken();
  return useQuery({
    enabled: !!token,
    queryKey: ["hostPayoutAccount"],
    queryFn: async () => {
      const d = await gql<{ hostPayoutAccount: ApiHostPayoutAccount | null }>(
        Q_HOST_PAYOUT_ACCOUNT, undefined, token,
      );
      return d.hostPayoutAccount;
    },
  });
}

export function useClassTemplates() {
  const token = useToken();
  return useQuery({
    enabled: !!token,
    queryKey: ["classTemplates"],
    queryFn: async () => {
      const d = await gql<{ classTemplates: ApiClassTemplate[] }>(Q_CLASS_TEMPLATES, undefined, token);
      return d.classTemplates ?? [];
    },
  });
}

export function useHostAvailability() {
  const token = useToken();
  return useQuery({
    enabled: !!token,
    queryKey: ["hostAvailability"],
    queryFn: async () => {
      const d = await gql<{ hostAvailability: ApiHostAvailability | null }>(Q_HOST_AVAILABILITY, undefined, token);
      return d.hostAvailability;
    },
  });
}

export function useHostSupportTickets() {
  const token = useToken();
  return useQuery({
    enabled: !!token,
    queryKey: ["hostSupportTickets"],
    queryFn: async () => {
      const d = await gql<{ hostSupportTickets: ApiSupportTicket[] }>(Q_HOST_SUPPORT_TICKETS, undefined, token);
      return d.hostSupportTickets ?? [];
    },
  });
}

export function useTopClasses(period: string = "month") {
  const token = useToken();
  return useQuery({
    enabled: !!token,
    queryKey: ["topClasses", period],
    queryFn: async () => {
      const d = await gql<{ topClasses: ApiTopClass[] }>(Q_TOP_CLASSES, { p: period }, token);
      return d.topClasses ?? [];
    },
  });
}

export function useAttendanceStats(period: string = "week") {
  const token = useToken();
  return useQuery({
    enabled: !!token,
    queryKey: ["attendanceStats", period],
    queryFn: async () => {
      const d = await gql<{ attendanceStats: ApiAttendanceStats | null }>(Q_ATTENDANCE_STATS, { p: period }, token);
      return d.attendanceStats;
    },
  });
}

export function useHostRetention(period: string = "month") {
  const token = useToken();
  return useQuery({
    enabled: !!token,
    queryKey: ["hostRetention", period],
    queryFn: async () => {
      const d = await gql<{ hostRetention: { period: string; ltvCents: number; activeMembers: number; atRiskCount: number; cohorts: { cohort: string; size: number; retained: number[] }[] } | null }>(
        Q_HOST_RETENTION, { p: period }, token,
      );
      return d.hostRetention;
    },
  });
}

export function useCreateTemplate() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string; activityType: string; durationMinutes: number; capacity: number; priceCents: number; description?: string }) => {
      const d = await gql<{ createClassTemplate: ApiClassTemplate }>(M_CREATE_TEMPLATE, { i: input }, token);
      return d.createClassTemplate;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["classTemplates"] }),
  });
}

export function useDeleteTemplate() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await gql(M_DELETE_TEMPLATE, { id }, token);
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["classTemplates"] }),
  });
}

export function useSetHostAvailability() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ApiHostAvailability) => {
      const payload = {
        timezone: input.timezone,
        weekly: input.weekly.map((w) => ({ weekday: w.weekday, startMinutes: w.startMinutes, endMinutes: w.endMinutes })),
        blackouts: input.blackouts.map((b) => ({ date: b.date, reason: b.reason ?? null })),
      };
      const d = await gql<{ setHostAvailability: ApiHostAvailability }>(M_SET_HOST_AVAIL, { i: payload }, token);
      return d.setHostAvailability;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hostAvailability"] }),
  });
}

export function useCreateSupportTicket() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { subject: string; body: string }) => {
      const d = await gql<{ createSupportTicket: ApiSupportTicket }>(M_CREATE_SUPPORT, { s: input.subject, b: input.body }, token);
      return d.createSupportTicket;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hostSupportTickets"] }),
  });
}

export function useRespondToReview() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, response }: { id: string; response: string }) => {
      const d = await gql(M_RESPOND_REVIEW, { id, r: response }, token);
      return d;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["myGymReviews"] }),
  });
}

export function useFlagReview() {
  const token = useToken();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      await gql(M_FLAG_REVIEW, { id, r: reason }, token);
      return id;
    },
  });
}

export function useSubmitPayoutProfile() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      bankToken: string; firstName: string; lastName: string; email: string;
      dob: string; addressLine1: string; city: string; postalCode: string; country: string; tosIp: string;
    }) => {
      const d = await gql<{ submitHostPayoutProfile: ApiHostPayoutAccount }>(M_SUBMIT_PAYOUT_PROFILE, { i: input }, token);
      return d.submitHostPayoutProfile;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hostPayoutAccount"] }),
  });
}

export function useCashOut() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const d = await gql<{ cashOutHost: ApiPayout | null }>(M_CASH_OUT, undefined, token);
      return d.cashOutHost;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payouts"] });
      qc.invalidateQueries({ queryKey: ["nextPayout"] });
      qc.invalidateQueries({ queryKey: ["hostEarnings"] });
    },
  });
}


/* ============================= Helpers ============================= */

/** Cents → "$22" style label (no trailing zeros when whole). */
export function formatPrice(cents: number, currency = "USD"): string {
  const amount = cents / 100;
  const sym = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "";
  if (Number.isInteger(amount)) return `${sym}${amount}`;
  return `${sym}${amount.toFixed(2)}`;
}

export function formatClassDate(iso: string): { date: string; time: string; duration: (min: number) => string } {
  const d = new Date(iso);
  const date = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return { date, time, duration: (m) => `${m} min` };
}
