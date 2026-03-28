const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.softbridgelabs.in';

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
    return `<div style="font-family: 'Outfit', sans-serif; background: #fafafa; padding: 40px; border-radius: 24px; border: 1px solid #e2e8f0;">
      <h2 style="color: #0f172a; margin-bottom: 20px;">Security Alert: ${type.toUpperCase().replace('_', ' ')}</h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.6;">A security event was detected on your SoftBridge Identity node. This is a critical notification for your protection.</p>
      <div style="background: #ffffff; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0; margin: 30px 0;">
        <p style="color: #64748b; font-size: 14px; margin-bottom: 8px;">EVENT DETAILS:</p>
        <p style="color: #0f172a; font-weight: 700; font-size: 18px;">${details}</p>
      </div>
      <p style="color: #94a3b8; font-size: 14px;">If this wasn't you, please rotate your Access Keys immediately in the Security Hub.</p>
    </div>`;
  },
  // 1. User Registration
  register: (data: { email: string; password?: string; name: string }) => 
    apiFetch('/softbridge/register', { method: 'POST', body: JSON.stringify(data) }),

  // 2. User Login
  login: (data: { email: string; password?: string }) => 
    apiFetch('/softbridge/login', { method: 'POST', body: JSON.stringify(data) }),

  // 3. Forgot Password
  forgotPassword: (email: string) => 
    apiFetch('/softbridge/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),

  // 4. Security Alerts
  sendAlert: (data: { email: string; type: string; details: string }) => 
    apiFetch('/softbridge/alert-email', { method: 'POST', body: JSON.stringify(data) }),

  // 5. Premium Membership Activation
  activatePremium: (uid: string, durationDays: number) => 
    apiFetch('/softbridge/premium/activate', { method: 'POST', body: JSON.stringify({ uid, durationDays }) }),

  // 6. Public Profile
  getPublicProfile: (uid: string) => 
    apiFetch(`/softbridge/profile/${uid}`, { method: 'GET' }),

  // 7. Account Management (Full Update)
  updateAccountFull: (data: any) => 
    apiFetch('/softbridge/account', { method: 'POST', body: JSON.stringify(data) }),

  // 8. Partial Profile Update
  updateAccountPartial: (data: { uid: string; [key: string]: any }) => 
    apiFetch('/softbridge/account', { method: 'PATCH', body: JSON.stringify(data) }),

  // 9. Get Account Status
  getAccount: (uid: string, setupHelp: boolean = false) => 
    apiFetch(`/softbridge/account?uid=${uid}${setupHelp ? '&setupHelp=true' : ''}`, { method: 'GET' }),

  // 10. Security & Activity
  getActivity: async (uid: string) => {
    const data = await apiFetch(`/softbridge/activity?uid=${uid}`, { method: 'GET' });
    return data.logs || data;
  },

  // 12. Delete Account
  deleteAccount: (uid: string) => 
    apiFetch('/softbridge/account', { method: 'DELETE', body: JSON.stringify({ uid }) }),

  // Auth Action Helpers
  confirmPasswordReset: (oobCode: string, newPassword: string) => 
    apiFetch('/auth/confirm-password-reset', { method: 'POST', body: JSON.stringify({ oobCode, newPassword }) }),
};
