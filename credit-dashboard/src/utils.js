export async function getSignedUrl(key, authHeaders = {}, backendUrl = '') {
  if (!key || key === 'undefined') {
    throw new Error('Invalid key');
  }
  const res = await fetch(
    `${backendUrl}/api/files/get-signed-url?key=${encodeURIComponent(key)}`,
    {
      headers: authHeaders,
    }
  );
  if (!res.ok) throw new Error('Failed to get URL');
  const data = await res.json();
  return data.url;
}
