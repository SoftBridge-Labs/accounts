const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.softbridgelabs.in';

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
      summary: 'Your identity node was created successfully and is ready to use.',
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
  const url = `${BASE_URL}${endpoint}`;
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
    const safeDetails = escapeHtml(details);
    const meta = inferAlertMeta(type);

    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SoftBridge Account Alert</title>
  </head>
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:28px 14px;background:linear-gradient(145deg,#eef2ff 0%,#f8fafc 38%,#e0f2fe 100%);">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #e2e8f0;border-radius:24px;overflow:hidden;box-shadow:0 24px 60px rgba(2,6,23,0.10);">
            <tr>
              <td style="background:linear-gradient(130deg,${meta.accentA} 0%,${meta.accentB} 100%);padding:26px 30px;">
                <div style="display:inline-block;padding:7px 12px;border-radius:999px;background:rgba(255,255,255,0.18);color:#ffffff;font-size:11px;font-weight:800;letter-spacing:0.11em;">${meta.badge}</div>
                <h1 style="margin:14px 0 8px 0;font-size:28px;line-height:1.2;letter-spacing:-0.03em;color:#ffffff;">${meta.title}</h1>
                <p style="margin:0;color:rgba(255,255,255,0.88);font-size:14px;line-height:1.6;">${meta.summary}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 30px 8px 30px;">
                <p style="margin:0 0 12px 0;color:#64748b;font-size:12px;font-weight:700;letter-spacing:0.1em;">EVENT TYPE</p>
                <p style="margin:0 0 20px 0;color:#0f172a;font-size:15px;font-weight:800;">${safeType}</p>
                <div style="padding:18px 18px;border-radius:16px;background:#f8fafc;border:1px solid #e2e8f0;">
                  <p style="margin:0 0 8px 0;color:#64748b;font-size:12px;font-weight:700;letter-spacing:0.08em;">DETAILS</p>
                  <p style="margin:0;color:#1e293b;font-size:15px;line-height:1.7;">${safeDetails}</p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 30px 8px 30px;">
                <a href="${meta.ctaUrl}" style="display:inline-block;text-decoration:none;background:#0f172a;color:#ffffff;padding:12px 18px;border-radius:12px;font-size:13px;font-weight:700;letter-spacing:0.03em;">${meta.ctaLabel}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 30px 28px 30px;">
                <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.7;">This notification was generated by SoftBridge Account Security. If this activity was not initiated by you, please review your account immediately.</p>
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
};
