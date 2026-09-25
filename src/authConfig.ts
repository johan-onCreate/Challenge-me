export function getPasswordResetRedirectUrl(origin: string): string {
  const configuredAppUrl = import.meta.env.VITE_APP_URL || origin;
  return `${configuredAppUrl.replace(/\/$/, "")}/reset-password`;
}
