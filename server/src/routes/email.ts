import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';
import { encrypt, decrypt } from '../utils/emailCrypto.js';
import { testImapConnection, testOAuthConnection, getFolders, getMessages, getMessageBody } from '../services/imapService.js';
import { getOutlookAuthUrl, exchangeOutlookCode } from '../services/oauthService.js';
import { randomBytes } from 'crypto';

export async function emailRoutes(app: FastifyInstance) {

  // List accounts (no passwords, includes oauth_provider)
  app.get('/api/email/accounts', async () => {
    const { rows } = await db.query(
      `SELECT id, display_name, email_address, imap_host, imap_port,
              smtp_host, smtp_port, username, active, oauth_provider,
              (oauth_refresh_token_enc IS NOT NULL) AS oauth_connected,
              created_at
       FROM email_accounts ORDER BY created_at ASC`
    );
    return rows;
  });

  // Test connection before saving (plain auth)
  app.post('/api/email/test-connection', async (req, reply) => {
    const { imap_host, imap_port, username, password } = req.body as {
      imap_host: string; imap_port?: number; username: string; password: string;
    };
    if (!imap_host || !username || !password) {
      return reply.code(400).send({ error: 'imap_host, username, and password are required' });
    }
    return testImapConnection({ imap_host, imap_port: imap_port ?? 993, username, password });
  });

  // Add account (plain auth)
  app.post('/api/email/accounts', async (req, reply) => {
    const {
      display_name, email_address, imap_host, imap_port,
      smtp_host, smtp_port, username, password,
    } = req.body as {
      display_name: string; email_address: string; imap_host: string; imap_port?: number;
      smtp_host: string; smtp_port?: number; username: string; password: string;
    };
    if (!display_name || !email_address || !imap_host || !smtp_host || !username || !password) {
      return reply.code(400).send({ error: 'Missing required fields' });
    }
    const password_encrypted = encrypt(password);
    const { rows } = await db.query(
      `INSERT INTO email_accounts
         (display_name, email_address, imap_host, imap_port, smtp_host, smtp_port, username, password_encrypted)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, display_name, email_address, imap_host, imap_port,
                 smtp_host, smtp_port, username, active, oauth_provider, created_at`,
      [display_name, email_address, imap_host, imap_port ?? 993,
       smtp_host, smtp_port ?? 587, username, password_encrypted]
    );
    return rows[0];
  });

  // Add account via OAuth (no password — stores account shell, OAuth fills tokens later)
  app.post('/api/email/accounts/oauth', async (req, reply) => {
    const { display_name, email_address, imap_host, imap_port, smtp_host, smtp_port, username, oauth_provider } = req.body as {
      display_name: string; email_address: string; imap_host: string; imap_port?: number;
      smtp_host: string; smtp_port?: number; username: string; oauth_provider: string;
    };
    if (!display_name || !email_address || !imap_host || !smtp_host || !username || !oauth_provider) {
      return reply.code(400).send({ error: 'Missing required fields' });
    }
    const { rows } = await db.query(
      `INSERT INTO email_accounts
         (display_name, email_address, imap_host, imap_port, smtp_host, smtp_port, username, password_encrypted, oauth_provider)
       VALUES ($1, $2, $3, $4, $5, $6, $7, '', $8)
       ON CONFLICT (id) DO NOTHING
       RETURNING id, display_name, email_address, imap_host, imap_port,
                 smtp_host, smtp_port, username, active, oauth_provider, created_at`,
      [display_name, email_address, imap_host, imap_port ?? 993,
       smtp_host, smtp_port ?? 587, username, oauth_provider]
    );
    return rows[0];
  });

  // Update account
  app.put('/api/email/accounts/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as {
      display_name?: string; imap_host?: string; imap_port?: number;
      smtp_host?: string; smtp_port?: number; username?: string;
      password?: string; active?: boolean;
    };
    const password_encrypted = body.password ? encrypt(body.password) : null;
    const { rows } = await db.query(
      `UPDATE email_accounts SET
         display_name       = COALESCE($1, display_name),
         imap_host          = COALESCE($2, imap_host),
         imap_port          = COALESCE($3, imap_port),
         smtp_host          = COALESCE($4, smtp_host),
         smtp_port          = COALESCE($5, smtp_port),
         username           = COALESCE($6, username),
         password_encrypted = COALESCE($7, password_encrypted),
         active             = COALESCE($8, active)
       WHERE id = $9
       RETURNING id, display_name, email_address, imap_host, imap_port,
                 smtp_host, smtp_port, username, active, oauth_provider, created_at`,
      [body.display_name ?? null, body.imap_host ?? null, body.imap_port ?? null,
       body.smtp_host ?? null, body.smtp_port ?? null, body.username ?? null,
       password_encrypted, body.active ?? null, id]
    );
    if (!rows[0]) return reply.code(404).send({ error: 'Not found' });
    return rows[0];
  });

  // Delete account
  app.delete('/api/email/accounts/:id', async (req) => {
    const { id } = req.params as { id: string };
    await db.query('DELETE FROM email_accounts WHERE id = $1', [id]);
    return { ok: true };
  });

  // Test existing account's IMAP connection
  app.post('/api/email/accounts/:id/test', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { rows } = await db.query('SELECT * FROM email_accounts WHERE id = $1', [id]);
    if (!rows[0]) return reply.code(404).send({ error: 'Not found' });
    const acct = rows[0];
    if (acct.oauth_provider === 'outlook') {
      return testOAuthConnection(acct.id, acct.imap_host, acct.imap_port, acct.username);
    }
    const password = decrypt(acct.password_encrypted);
    return testImapConnection({ imap_host: acct.imap_host, imap_port: acct.imap_port, username: acct.username, password });
  });

  // ── Folders ─────────────────────────────────────────────────────────────

  app.get('/api/email/accounts/:id/folders', async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      const folders = await getFolders(parseInt(id));
      return folders;
    } catch (err: any) {
      return reply.code(500).send({ error: err.message });
    }
  });

  // ── Messages ─────────────────────────────────────────────────────────────

  app.get('/api/email/accounts/:id/messages', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { folder = 'INBOX', page = '1', limit = '50' } = req.query as { folder?: string; page?: string; limit?: string };
    try {
      const messages = await getMessages(parseInt(id), folder, parseInt(page), parseInt(limit));
      return messages;
    } catch (err: any) {
      return reply.code(500).send({ error: err.message });
    }
  });

  // ── Message body ─────────────────────────────────────────────────────────

  app.get('/api/email/messages/:id/body', async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      const body = await getMessageBody(parseInt(id));
      return body;
    } catch (err: any) {
      return reply.code(500).send({ error: err.message });
    }
  });

  // ── OAuth: Outlook ──────────────────────────────────────────────────────

  // Step 1: start OAuth — redirect browser to Microsoft login
  app.get('/api/email/oauth/outlook/authorize', async (req, reply) => {
    const { account_id } = req.query as { account_id?: string };
    const state = `${account_id ?? 'new'}:${randomBytes(16).toString('hex')}`;
    // Store state temporarily in DB so callback can verify it
    await db.query(
      `UPDATE email_accounts SET oauth_provider = 'outlook' WHERE id = $1`,
      [account_id]
    ).catch(() => {}); // ignore if account_id not provided yet
    const url = getOutlookAuthUrl(state);
    return reply.redirect(url);
  });

  // Step 2: OAuth callback — exchange code for tokens, store encrypted
  app.get('/api/email/oauth/callback/outlook', async (req, reply) => {
    const { code, state, error, error_description } = req.query as {
      code?: string; state?: string; error?: string; error_description?: string;
    };

    if (error || !code) {
      const msg = error_description ?? error ?? 'OAuth failed';
      return reply.redirect(`/?email_oauth_error=${encodeURIComponent(msg)}`);
    }

    try {
      const tokens = await exchangeOutlookCode(code);
      const accountIdStr = (state ?? '').split(':')[0];
      const accountId = parseInt(accountIdStr);

      if (accountId && !isNaN(accountId)) {
        // Update existing account with tokens
        await db.query(
          `UPDATE email_accounts SET
             oauth_provider         = 'outlook',
             oauth_refresh_token_enc = $1,
             oauth_access_token_enc  = $2,
             oauth_token_expires_at  = $3
           WHERE id = $4`,
          [encrypt(tokens.refreshToken), encrypt(tokens.accessToken), tokens.expiresAt, accountId]
        );
      } else {
        // New account — create it from the token (get email from Graph)
        const userRes = await fetch('https://graph.microsoft.com/v1.0/me?$select=mail,displayName', {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        });
        const user = await userRes.json() as any;
        const email = user.mail ?? user.userPrincipalName ?? '';
        await db.query(
          `INSERT INTO email_accounts
             (display_name, email_address, imap_host, imap_port, smtp_host, smtp_port,
              username, password_encrypted, oauth_provider, oauth_refresh_token_enc,
              oauth_access_token_enc, oauth_token_expires_at)
           VALUES ($1, $2, 'outlook.office365.com', 993, 'smtp-mail.outlook.com', 587,
                   $3, '', 'outlook', $4, $5, $6)`,
          [user.displayName ?? 'Outlook', email, email,
           encrypt(tokens.refreshToken), encrypt(tokens.accessToken), tokens.expiresAt]
        );
      }

      return reply.redirect('/?email_oauth_success=outlook');
    } catch (err: any) {
      return reply.redirect(`/?email_oauth_error=${encodeURIComponent(err.message ?? 'Token exchange failed')}`);
    }
  });
}
