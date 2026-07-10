function getBaseUrl() {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:4000';
  }
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.softbridgelabs.in';
}
import { auth } from './firebase';

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const inferAlertMeta = (type: string) => {
  const normalized = type.toLowerCase();

  if (normalized.includes('premium')) {
    return {
      badge: 'PREMIUM EVENT',
      title: 'Premium Membership Activated',
      summary: 'Your SoftBridge premium privileges are now active across the ecosystem.',
      accentA: '#4f46e5',
      accentB: '#2563eb',
      ctaLabel: 'Open Premium Hub',
      ctaUrl: 'https://account.softbridgelabs.in/premium',
    };
  }

  if (normalized.includes('synchronized') || normalized.includes('profile')) {
    return {
      badge: 'PROFILE UPDATE',
      title: 'Identity Profile Updated',
      summary: 'Your account parameters were updated and synchronized securely.',
      accentA: '#0ea5e9',
      accentB: '#2563eb',
      ctaLabel: 'Review Profile',
      ctaUrl: 'https://account.softbridgelabs.in/profile',
    };
  }

  if (normalized.includes('provisioned') || normalized.includes('register') || normalized.includes('signup')) {
    return {
      badge: 'IDENTITY CREATED',
      title: 'Welcome to SoftBridge Account',
      summary: 'Your account was created successfully and is ready to use.',
      accentA: '#4f46e5',
      accentB: '#0ea5e9',
      ctaLabel: 'Open Dashboard',
      ctaUrl: 'https://account.softbridgelabs.in/dashboard',
    };
  }

  return {
    badge: 'SECURITY ALERT',
    title: 'Account Security Activity',
    summary: 'A new authentication or security event was detected for your account.',
    accentA: '#4f46e5',
    accentB: '#2563eb',
    ctaLabel: 'Review Security Activity',
    ctaUrl: 'https://account.softbridgelabs.in/security',
  };
};

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${getBaseUrl()}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'API Request failed' }));
    throw new Error(error.message || 'API Request failed');
  }

  return response.json();
}

export const softbridgeApi = {
  // Security Alert Template Helper
  getAlertTemplate: (type: string, details: string) => {
    const safeType = escapeHtml(type.replace(/_/g, ' ').toUpperCase());
    const safeDetails = escapeHtml(details).replace(/\n/g, '<br />');
    const meta = inferAlertMeta(type);

    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SoftBridge Account Alert</title>
  </head>
  <body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f9fafb;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="580" align="center" cellspacing="0" cellpadding="0" style="max-width:580px;width:100%;background:#ffffff;border-radius:8px;border:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,0.05);overflow:hidden;margin: 0 auto;">
            <tr>
              <td style="padding:32px 32px 20px 32px;">
                <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#6b7280;">${meta.badge}</p>
                <h1 style="margin:6px 0 0 0;font-size:22px;font-weight:600;line-height:1.35;color:#111827;">${meta.title}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 24px 32px;color:#374151;font-size:15px;line-height:1.6;">
                <p style="margin:0 0 20px 0;">${meta.summary}</p>
                <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#6b7280;">Event Type</p>
                <p style="margin:0 0 20px 0;font-weight:600;color:#111827;">${safeType}</p>
                
                <div style="padding:16px;background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;margin:20px 0;">
                  <p style="margin:0 0 6px 0;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#6b7280;">Details</p>
                  <p style="margin:0;color:#111827;font-size:14px;line-height:1.5;word-break:break-word;">${safeDetails}</p>
                </div>
                
                <table role="presentation" cellspacing="0" cellpadding="0" style="margin-top:24px;">
                  <tr>
                    <td style="background:#4f46e5;border-radius:6px;">
                      <a href="${meta.ctaUrl}" style="display:inline-block;padding:10px 18px;color:#ffffff;background-color:#4f46e5;text-decoration:none;font-size:14px;font-weight:600;border-radius:6px;">${meta.ctaLabel}</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 32px 32px;border-top:1px solid #f3f4f6;color:#9ca3af;font-size:12px;line-height:1.5;">
                SoftBridge Security Team • account.softbridgelabs.in<br/>
                This notification was generated by SoftBridge Account Security. If this activity was not initiated by you, please review your account immediately.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  },
  // 1. User Registration
  register: (data: { email: string; password?: string; name: string }) => 
    apiFetch('/softbridge/register', { method: 'POST', body: JSON.stringify(data) }),

  // 2. User Login
  login: (data: { email: string; password?: string; meta?: string }) => 
    apiFetch('/softbridge/login', { method: 'POST', body: JSON.stringify(data) }),

  // 3. Forgot Password
  forgotPassword: (email: string) => 
    apiFetch('/softbridge/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),

  // 4. Security Alerts
  sendAlert: (data: { email: string; type: string; details: string }) => {
    const looksLikeHtml = /<[a-z][\s\S]*>/i.test(data.details);
    const payload = {
      ...data,
      details: looksLikeHtml ? data.details : softbridgeApi.getAlertTemplate(data.type, data.details),
    };

    return apiFetch('/softbridge/alert-email', { method: 'POST', body: JSON.stringify(payload) });
  },

  // 5. Premium Membership Activation
  activatePremium: (uid: string, durationDays: number) => 
    apiFetch('/softbridge/premium/activate', { method: 'POST', body: JSON.stringify({ uid, durationDays }) }),

  // 6. Public Profile
  getPublicProfile: (uid: string) => 
    apiFetch(`/softbridge/profile/${uid}`, { method: 'GET' }),

  // 7. Account Management (Full Update)
  updateAccountFull: (data: Record<string, unknown>) => 
    apiFetch('/softbridge/account', { method: 'POST', body: JSON.stringify(data) }),

  // 8. Partial Profile Update
  updateAccountPartial: (data: { uid: string; [key: string]: unknown }) => 
    apiFetch('/softbridge/account', { method: 'PATCH', body: JSON.stringify(data) }),

  // 9. Get Account Status
  getAccount: (uid: string, setupHelp: boolean = false) => 
    apiFetch(`/softbridge/account?uid=${uid}${setupHelp ? '&setupHelp=true' : ''}`, { method: 'GET' }),

  // 10. Security & Activity
  getActivity: async (uid: string) => {
    const data = await apiFetch(`/softbridge/activity?uid=${uid}`, { method: 'GET' });
    return data.logs || data;
  },
  addActivity: (data: { uid: string; action: string; ip?: string }) => 
    apiFetch('/softbridge/activity', { method: 'POST', body: JSON.stringify(data) }),

  // 12. Delete Account
  deleteAccount: (uid: string) => 
    apiFetch('/softbridge/account', { method: 'DELETE', body: JSON.stringify({ uid }) }),

  // 13. User Custom Account Deletion Period
  updateUserDeletionPolicy: (data: { uid: string; inactivityDays: number | null }) => 
    apiFetch('/softbridge/account/deletion-policy', { method: 'PATCH', body: JSON.stringify(data) }),

  // 16. Audit Log (Custom Events)
  createAuditLog: (data: { uid: string | null; event: string; source: string; details?: any; ip?: string }) => 
    apiFetch('/softbridge/audit-log', { method: 'POST', body: JSON.stringify(data) }),
  getAuditLogs: (params: { uid?: string; event?: string; limit?: number; offset?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiFetch(`/softbridge/audit-log?${query}`, { method: 'GET' });
  },

  // 17. Email OTP (Post Login)
  sendOTP: (data: { uid: string; email: string; purpose: string }) => 
    apiFetch('/softbridge/email-otp/send', { method: 'POST', body: JSON.stringify(data) }),
  verifyOTP: (data: { email: string; otp: string; purpose: string }) => 
    apiFetch('/softbridge/email-otp/verify', { method: 'POST', body: JSON.stringify(data) }),

  // 18. Sync Login (Firebase Auth -> DB)
  syncLogin: (data: { uid: string; email: string; ip?: string }) => 
    apiFetch('/softbridge/login', { method: 'POST', body: JSON.stringify(data) }),

  // Auth Action Helpers
  confirmPasswordReset: (oobCode: string, newPassword: string) => 
    apiFetch('/auth/confirm-password-reset', { method: 'POST', body: JSON.stringify({ oobCode, newPassword }) }),

  // 19. Authenticator App
  authenticator: {
    add: async (data: { id: string; issuer?: string; name?: string; secret: string; user_uid?: string }) => {
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
      return apiFetch('/authenticator/add', { 
        method: 'POST', 
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data) 
      });
    },
    list: async (params: { user_uid?: string; limit?: number; offset?: number } = {}) => {
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
      const query = new URLSearchParams(params as any).toString();
      return apiFetch(`/authenticator/list${query ? `?${query}` : ''}`, { 
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    },
    delete: async (id: string, user_uid?: string) => {
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
      return apiFetch('/authenticator/delete', { 
        method: 'DELETE', 
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id, user_uid }) 
      });
    },
  },

  // 20. Referral Program
  referral: {
    /** Register a new referral code (4-6 char alphanumeric) */
    saveCode: (code: string) =>
      apiFetch(`/refer/save?code=${encodeURIComponent(code)}`, { method: 'GET' }),

    /** Increment the usage count for an existing referral code */
    recordNew: (code: string) =>
      apiFetch(`/refer/new?code=${encodeURIComponent(code)}`, { method: 'GET' }),

    /** Get total times a code has been used */
    getCount: (code: string) =>
      apiFetch(`/refer/count?code=${encodeURIComponent(code)}`, { method: 'GET' }),

    /** Check if a referral code exists */
    checkCode: (code: string) =>
      apiFetch(`/refer/check?code=${encodeURIComponent(code)}`, { method: 'GET' }),

    /** List all registered referral codes */
    totalCodes: () =>
      apiFetch('/refer/totalcodes', { method: 'GET' }),

    /** Reset usage count for a code back to 0 */
    resetCount: (code: string) =>
      apiFetch(`/refer/reset?code=${encodeURIComponent(code)}`, { method: 'GET' }),

    /** Permanently delete a referral code */
    deleteCode: (code: string) =>
      apiFetch(`/refer/delete?code=${encodeURIComponent(code)}`, { method: 'GET' }),
  },

  // 21. Third-Party App Registrations
  apps: {
    create: (data: { uid: string; name: string; app_type: string; allowed_origins: string[]; redirect_uris: string[] }) =>
      apiFetch('/softbridge/apps', { method: 'POST', body: JSON.stringify(data) }),
    list: (uid: string) =>
      apiFetch(`/softbridge/apps?uid=${uid}`, { method: 'GET' }),
    get: (clientId: string) =>
      apiFetch(`/softbridge/apps/${clientId}`, { method: 'GET' }),
    verify: (clientId: string, clientSecret: string) =>
      apiFetch('/softbridge/apps/verify', { method: 'POST', body: JSON.stringify({ client_id: clientId, client_secret: clientSecret }) }),
    delete: (clientId: string, uid: string) =>
      apiFetch(`/softbridge/apps/${clientId}`, { method: 'DELETE', body: JSON.stringify({ uid }) }),
  },
  
  // 22. Billing
  billing: {
    createOneTimeOrder: (data: { amount: number; currency?: string; receipt?: string }) =>
      apiFetch('/billing/one-time', { method: 'POST', body: JSON.stringify(data) }),
    createSubscription: (data: { planId: string; totalCount?: number; startAt?: number }) =>
      apiFetch('/billing/subscription', { method: 'POST', body: JSON.stringify(data) }),
    fetchSubscription: (id: string) =>
      apiFetch(`/billing/subscription/${id}`, { method: 'GET' }),
    cancelSubscription: (id: string, cancelAtCycleEnd: boolean = false) =>
      apiFetch(`/billing/subscription/${id}/cancel`, { method: 'POST', body: JSON.stringify({ cancelAtCycleEnd }) }),
    pauseSubscription: (id: string) =>
      apiFetch(`/billing/subscription/${id}/pause`, { method: 'POST' }),
    resumeSubscription: (id: string) =>
      apiFetch(`/billing/subscription/${id}/resume`, { method: 'POST' }),
    verifyPayment: (data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
      apiFetch('/billing/verify', { method: 'POST', body: JSON.stringify(data) }),
  }
};

