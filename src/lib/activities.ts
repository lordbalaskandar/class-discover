export const ACTIVITIES = [
  "Pilates",
  "Yoga",
  "Boxing",
  "Pickleball",
  "Tennis",
  "HIIT",
  "Spin",
  "Barre",
  "Dance",
  "Rock Climbing",
  "Swimming",
  "Other",
] as const;

export type Activity = (typeof ACTIVITIES)[number];
