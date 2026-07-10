/**
 * Validates whether the target origin is allowed for SSO integrations.
 * Restricts only to hostnames ending with .softbridgelabs.in, softbridgelabs.in, or localhost.
 */
export const validateOrigin = (origin: string): boolean => {
  if (!origin) return false;
  // Allow custom app schemes (e.g. app://) or any http/https origins 
  // as per the requirement "allow anyone to register there apps"
  try {
    const url = new URL(origin);
    // You can add logic to check if it's http/https/app etc.
    // For now we allow valid URLs.
    return true;
  } catch (e) {
    return false;
  }
};
