export const getBrowserMetadata = async () => {
  const ua = navigator.userAgent;
  let ip = 'Unknown';
  let location = 'Unknown Location';
  let currency = 'INR';
  try {
    const res = await fetch('https://ipapi.co/json/').catch(() => null);
    if (res) {
      const data = await res.json();
      ip = data.ip || 'Unknown';
      location = data.city && data.country_name ? `${data.city}, ${data.country_name}` : 'Unknown Location';
      currency = data.currency || 'INR';
    }
  } catch (e) {}

  let device = 'Desktop Session';
  if (/Mobile|Android|iPhone/i.test(ua)) device = 'Mobile Device';
  if (/Tablet|iPad/i.test(ua)) device = 'Tablet';

  return { ip, ua, device, location, currency };
};

export const formatPrettyDate = (dateStr: string) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

export const parsePrettyDate = (prettyStr: string) => {
  const parts = prettyStr.split('/');
  if (parts.length !== 3) return '';
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
};
