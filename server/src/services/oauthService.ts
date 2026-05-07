import { db } from '../db.js';
import { encrypt, decrypt } from '../utils/emailCrypto.js';

const OUTLOOK_TOKEN_URL = 'https://login.microsoftonline.com/consumers/oauth2/v2.0/token';

export function getOutlookAuthUrl(state: string): string {
  const clientId    = process.env.OUTLOOK_CLIENT_ID ?? '';
  const redirectUri = process.env.OUTLOOK_REDIRECT_URI ?? '';
  const params = new URLSearchParams({
    client_id:     clientId,
    response_type: 'code',
    redirect_uri:  redirectUri,
    scope:         'https://outlook.office.com/IMAP.AccessAsUser.All https://outlook.office.com/SMTP.Send offline_access',
    response_mode: 'query',
    state,
  });
  return `https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize?${params}`;
}

export async function exchangeOutlookCode(code: string): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
  const clientId     = process.env.OUTLOOK_CLIENT_ID ?? '';
  const clientSecret = process.env.OUTLOOK_CLIENT_SECRET ?? '';
  const redirectUri  = process.env.OUTLOOK_REDIRECT_URI ?? '';

  const res = await fetch(OUTLOOK_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     clientId,
      client_secret: clientSecret,
      code,
      redirect_uri:  redirectUri,
      grant_type:    'authorization_code',
    }),
  });

  const data = await res.json() as any;
  if (data.error) throw new Error(data.error_description ?? data.error);

  return {
    accessToken:  data.access_token,
    refreshToken: data.refresh_token,
    expiresAt:    new Date(Date.now() + data.expires_in * 1000),
  };
}

export async function refreshOutlookToken(accountId: number): Promise<string> {
  const { rows } = await db.query(
    'SELECT oauth_refresh_token_enc, oauth_access_token_enc, oauth_token_expires_at FROM email_accounts WHERE id = $1',
    [accountId]
  );
  if (!rows[0]) throw new Error('Account not found');

  const { oauth_refresh_token_enc, oauth_access_token_enc, oauth_token_expires_at } = rows[0];

  if (!oauth_refresh_token_enc) {
    throw new Error('Outlook not authorized — click the Auth button to connect');
  }

  // Return cached token if still valid (with 60s buffer)
  if (oauth_access_token_enc && oauth_token_expires_at) {
    const expiresAt = new Date(oauth_token_expires_at);
    if (expiresAt.getTime() - Date.now() > 60_000) {
      return decrypt(oauth_access_token_enc);
    }
  }

  const clientId     = process.env.OUTLOOK_CLIENT_ID ?? '';
  const clientSecret = process.env.OUTLOOK_CLIENT_SECRET ?? '';
  const refreshToken = decrypt(oauth_refresh_token_enc);

  const res = await fetch(OUTLOOK_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type:    'refresh_token',
    }),
  });

  const data = await res.json() as any;
  if (data.error) throw new Error(data.error_description ?? data.error);

  const expiresAt = new Date(Date.now() + data.expires_in * 1000);
  await db.query(
    `UPDATE email_accounts
     SET oauth_access_token_enc = $1, oauth_token_expires_at = $2
     WHERE id = $3`,
    [encrypt(data.access_token), expiresAt, accountId]
  );

  return data.access_token;
}
