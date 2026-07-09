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
  type ApiClass,
  type ApiGym,
  type ApiBooking,
  type ApiUser,
  type ApiProfile,
  type ApiReview,
  type ApiPayment,
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
