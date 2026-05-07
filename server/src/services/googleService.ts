import { db } from '../db.js';
import { encrypt, decrypt } from '../utils/emailCrypto.js';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_AUTH_URL  = 'https://accounts.google.com/o/oauth2/v2/auth';
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

export function getGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id:     process.env.GOOGLE_CLIENT_ID ?? '',
    redirect_uri:  process.env.GOOGLE_CALENDAR_REDIRECT_URI ?? '',
    response_type: 'code',
    scope:         SCOPES,
    access_type:   'offline',
    prompt:        'consent',
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params}`;
}

export async function exchangeGoogleCode(code: string): Promise<{
  accessToken: string; refreshToken: string; expiresAt: Date; email: string;
}> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID ?? '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      code,
      redirect_uri:  process.env.GOOGLE_CALENDAR_REDIRECT_URI ?? '',
      grant_type:    'authorization_code',
    }),
  });
  const data = await res.json() as any;
  if (data.error) throw new Error(data.error_description ?? data.error);

  let email = '';
  try {
    const infoRes = await fetch(
      `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${data.access_token}`
    );
    const info = await infoRes.json() as any;
    email = info.email ?? '';
  } catch {}

  return {
    accessToken:  data.access_token,
    refreshToken: data.refresh_token,
    expiresAt:    new Date(Date.now() + data.expires_in * 1000),
    email,
  };
}

export async function getValidAccessToken(): Promise<string> {
  const { rows } = await db.query('SELECT * FROM google_tokens LIMIT 1');
  if (!rows[0]) throw new Error('Google not connected');

  const row = rows[0];
  if (new Date(row.token_expires_at).getTime() - Date.now() > 60_000) {
    return decrypt(row.access_token_enc);
  }

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID ?? '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      refresh_token: decrypt(row.refresh_token_enc),
      grant_type:    'refresh_token',
    }),
  });
  const data = await res.json() as any;
  if (data.error) throw new Error(data.error_description ?? data.error);

  const expiresAt = new Date(Date.now() + data.expires_in * 1000);
  await db.query(
    'UPDATE google_tokens SET access_token_enc = $1, token_expires_at = $2, updated_at = NOW() WHERE id = $3',
    [encrypt(data.access_token), expiresAt, row.id]
  );
  return data.access_token;
}

export async function isGoogleConnected(): Promise<{ connected: boolean; email: string | null }> {
  const { rows } = await db.query('SELECT google_email FROM google_tokens LIMIT 1');
  return { connected: rows.length > 0, email: rows[0]?.google_email ?? null };
}
