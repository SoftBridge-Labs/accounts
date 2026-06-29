/**
 * Validates whether the target origin is allowed for SSO integrations.
 * Restricts only to hostnames ending with .softbridgelabs.in, softbridgelabs.in, or localhost.
 */
export const validateOrigin = (origin: string): boolean => {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    const hostname = url.hostname;
    return hostname === 'localhost' || hostname === 'softbridgelabs.in' || hostname.endsWith('.softbridgelabs.in');
  } catch (e) {
    return false;
  }
};
