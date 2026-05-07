import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { db } from '../db.js';
import { decrypt } from '../utils/emailCrypto.js';
import { refreshOutlookToken } from './oauthService.js';

interface AccountRow {
  id: number;
  imap_host: string;
  imap_port: number;
  username: string;
  password_encrypted: string;
  oauth_provider: string | null;
}

async function makeClient(account: AccountRow): Promise<ImapFlow> {
  let auth: { user: string; pass?: string; accessToken?: string };
  if (account.oauth_provider === 'outlook') {
    auth = { user: account.username, accessToken: await refreshOutlookToken(account.id) };
  } else {
    auth = { user: account.username, pass: decrypt(account.password_encrypted) };
  }
  return new ImapFlow({
    host: account.imap_host,
    port: account.imap_port,
    secure: true,
    auth,
    logger: false,
  });
}

async function getAccount(accountId: number): Promise<AccountRow> {
  const { rows } = await db.query('SELECT * FROM email_accounts WHERE id = $1', [accountId]);
  if (!rows[0]) throw new Error('Account not found');
  return rows[0];
}

// ── Connection test ───────────────────────────────────────────────────────────

export async function testImapConnection(cfg: { imap_host: string; imap_port: number; username: string; password: string }): Promise<{ ok: boolean; error?: string }> {
  const client = new ImapFlow({ host: cfg.imap_host, port: cfg.imap_port, secure: true, auth: { user: cfg.username, pass: cfg.password }, logger: false });
  try {
    await client.connect();
    await client.logout();
    return { ok: true };
  } catch (err: any) {
    const detail = [err.message, err.code, err.responseText, err.serverResponseCode].filter(Boolean).join(' | ') || 'Connection failed';
    return { ok: false, error: detail };
  }
}

export async function testOAuthConnection(accountId: number, imapHost: string, imapPort: number, username: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const accessToken = await refreshOutlookToken(accountId);
    const client = new ImapFlow({ host: imapHost, port: imapPort, secure: true, auth: { user: username, accessToken }, logger: false });
    await client.connect();
    await client.logout();
    return { ok: true };
  } catch (err: any) {
    const detail = [err.message, err.code, err.responseText, err.serverResponseCode].filter(Boolean).join(' | ') || 'Connection failed';
    return { ok: false, error: detail };
  }
}

// ── Folders ───────────────────────────────────────────────────────────────────

export async function getFolders(accountId: number) {
  const account = await getAccount(accountId);
  const client  = await makeClient(account);
  await client.connect();
  try {
    const mailboxes = await client.list();
    for (const mb of mailboxes) {
      // Get unread count for inbox-like folders
      let unseen = 0;
      try {
        const status = await client.status(mb.path, { unseen: true });
        unseen = status.unseen ?? 0;
      } catch { /* some folders don't support STATUS */ }

      await db.query(
        `INSERT INTO email_folders (account_id, name, path, delimiter, flags, unseen_count, synced_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (account_id, path) DO UPDATE SET
           name = $2, delimiter = $4, flags = $5, unseen_count = $6, synced_at = NOW()`,
        [accountId, mb.name, mb.path, mb.delimiter ?? '/', mb.flags ? Array.from(mb.flags) : [], unseen]
      );
    }
  } finally {
    await client.logout().catch(() => {});
  }

  const { rows } = await db.query(
    `SELECT * FROM email_folders WHERE account_id = $1
     ORDER BY
       CASE WHEN LOWER(path) IN ('inbox','inbox') THEN 0
            WHEN LOWER(path) LIKE '%sent%' THEN 1
            WHEN LOWER(path) LIKE '%draft%' THEN 2
            WHEN LOWER(path) LIKE '%trash%' OR LOWER(path) LIKE '%deleted%' THEN 10
            WHEN LOWER(path) LIKE '%spam%' OR LOWER(path) LIKE '%junk%' THEN 11
            ELSE 5 END, name ASC`,
    [accountId]
  );
  return rows;
}

// ── Messages ──────────────────────────────────────────────────────────────────

export async function getMessages(accountId: number, folderPath: string, page = 1, limit = 50) {
  const account = await getAccount(accountId);

  // Get or create folder record
  let { rows: folderRows } = await db.query(
    'SELECT id FROM email_folders WHERE account_id = $1 AND path = $2',
    [accountId, folderPath]
  );
  if (!folderRows[0]) {
    const ins = await db.query(
      `INSERT INTO email_folders (account_id, name, path, delimiter, synced_at)
       VALUES ($1, $2, $3, '/', NOW()) RETURNING id`,
      [accountId, folderPath, folderPath]
    );
    folderRows = ins.rows;
  }
  const folderId = folderRows[0].id;

  const client = await makeClient(account);
  await client.connect();
  try {
    const lock = await client.getMailboxLock(folderPath);
    try {
      const status = await client.status(folderPath, { messages: true });
      const total  = status.messages ?? 0;
      if (total === 0) return [];

      const fetchLimit = Math.min(limit, total);
      const start = Math.max(1, total - fetchLimit + 1);
      const range = `${start}:${total}`;

      for await (const msg of client.fetch(range, { uid: true, envelope: true, flags: true })) {
        const env     = msg.envelope;
        const from    = env?.from?.[0];
        const snippet = ''; // will be filled on body fetch
        const isRead    = msg.flags?.has('\\Seen') ?? false;
        const isStarred = msg.flags?.has('\\Flagged') ?? false;

        await db.query(
          `INSERT INTO email_messages
             (account_id, folder_id, uid, message_id, from_name, from_address,
              to_addresses, cc_addresses, subject, snippet, date_sent, is_read, is_starred, flags)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
           ON CONFLICT (account_id, folder_id, uid) DO UPDATE SET
             is_read = $12, is_starred = $13, flags = $14`,
          [
            accountId, folderId, msg.uid,
            env?.messageId ?? null,
            from?.name ?? null,
            from?.address ?? null,
            JSON.stringify((env?.to ?? []).map((a: any) => ({ name: a.name, address: a.address }))),
            JSON.stringify((env?.cc ?? []).map((a: any) => ({ name: a.name, address: a.address }))),
            env?.subject ?? '(no subject)',
            snippet,
            env?.date ?? null,
            isRead, isStarred,
            msg.flags ? Array.from(msg.flags) : [],
          ]
        );
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => {});
  }

  const offset = (page - 1) * limit;
  const { rows } = await db.query(
    `SELECT id, uid, from_name, from_address, to_addresses, subject, snippet,
            date_sent, is_read, is_starred, has_attachments, flags
     FROM email_messages
     WHERE account_id = $1 AND folder_id = $2 AND NOT is_deleted
     ORDER BY date_sent DESC NULLS LAST, uid DESC
     LIMIT $3 OFFSET $4`,
    [accountId, folderId, limit, offset]
  );
  return rows;
}

// ── Message body ──────────────────────────────────────────────────────────────

export async function getMessageBody(messageId: number) {
  // Check cache
  const { rows } = await db.query(
    'SELECT body_html, body_text, account_id, folder_id, uid FROM email_messages WHERE id = $1',
    [messageId]
  );
  if (!rows[0]) throw new Error('Message not found');
  const row = rows[0];

  if (row.body_html || row.body_text) {
    return { html: row.body_html, text: row.body_text };
  }

  // Fetch from IMAP
  const account  = await getAccount(row.account_id);
  const { rows: folderRows } = await db.query('SELECT path FROM email_folders WHERE id = $1', [row.folder_id]);
  const folderPath = folderRows[0]?.path ?? 'INBOX';

  const client = await makeClient(account);
  await client.connect();
  try {
    const lock = await client.getMailboxLock(folderPath);
    try {
      const { content } = await client.download(String(row.uid), undefined, { uid: true });
      const chunks: Buffer[] = [];
      for await (const chunk of content) chunks.push(chunk as Buffer);
      const raw = Buffer.concat(chunks);

      const parsed = await simpleParser(raw);
      const html   = parsed.html || null;
      const text   = parsed.text || null;
      const snippet = (parsed.text ?? '').slice(0, 200).replace(/\s+/g, ' ').trim();

      await db.query(
        'UPDATE email_messages SET body_html = $1, body_text = $2, snippet = $3 WHERE id = $4',
        [html, text, snippet, messageId]
      );

      return { html, text };
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => {});
  }
}
