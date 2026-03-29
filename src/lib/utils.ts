export const getBrowserMetadata = async () => {
  const ua = navigator.userAgent;
  let ip = 'Unknown Node';
  try {
    const res = await fetch('https://api.ipify.org?format=json').catch(() => null);
    if (res) {
      const data = await res.json();
      ip = data.ip || 'Unknown Node';
    }
  } catch (e) {}

  let device = 'Desktop Session';
  if (/Mobile|Android|iPhone/i.test(ua)) device = 'Mobile Node';
  if (/Tablet|iPad/i.test(ua)) device = 'Tablet Node';

  return { ip, ua, device };
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
