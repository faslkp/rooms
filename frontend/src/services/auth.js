export function getUserIdFromToken(token) {
  try {
    const payload = token.split('.')[1];
    const padded = payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '=');
    const json = atob(padded);
    const data = JSON.parse(json);
    return data.user_id || data.user || data.sub || null;
  } catch {
    return null;
  }
}

