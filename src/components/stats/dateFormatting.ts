const SWEDISH_MONTHS = [
  "jan",
  "feb",
  "mars",
  "apr",
  "maj",
  "jun",
  "jul",
  "aug",
  "sep",
  "okt",
  "nov",
  "dec",
];

export const formatShortDate = (dateKey: string) => {
  const [, month, day] = dateKey.split("-").map(Number);
  return `${day} ${SWEDISH_MONTHS[month - 1] ?? ""}`;
};
