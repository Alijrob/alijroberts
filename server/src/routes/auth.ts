import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';
import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import nodemailer from 'nodemailer';
import { config } from '../config.js';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${buf.toString('hex')}`;
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const [salt, hashed] = hash.split(':');
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return timingSafeEqual(buf, Buffer.from(hashed, 'hex'));
  } catch {
    return false;
  }
}

function generateToken(): string {
  return randomBytes(32).toString('hex');
}

export async function authRoutes(app: FastifyInstance) {
  // Check whether auth has been set up
  app.get('/api/auth/setup-status', async () => {
    const { rows } = await db.query('SELECT id FROM user_auth LIMIT 1');
    return { exists: rows.length > 0 };
  });

  // Called at end of onboarding to create credentials
  app.post('/api/auth/setup', async (req, reply) => {
    const { username, password } = req.body as { username: string; password: string };
    if (!username?.trim() || !password) return reply.code(400).send({ error: 'Username and password required' });

    const existing = await db.query('SELECT id FROM user_auth LIMIT 1');
    if (existing.rows.length > 0) return reply.code(409).send({ error: 'Auth already configured' });

    const hash = await hashPassword(password);
    const token = generateToken();
    await db.query(
      'INSERT INTO user_auth (username, password_hash, session_token) VALUES ($1, $2, $3)',
      [username.trim().toLowerCase(), hash, token]
    );
    return { token };
  });

  // Login
  app.post('/api/auth/login', async (req, reply) => {
    const { username, password } = req.body as { username: string; password: string };
    if (!username || !password) return reply.code(400).send({ error: 'Credentials required' });

    const { rows } = await db.query('SELECT * FROM user_auth LIMIT 1');
    if (!rows.length) return reply.code(401).send({ error: 'Not configured' });

    const user = rows[0];
    if (user.username !== username.trim().toLowerCase()) return reply.code(401).send({ error: 'Invalid credentials' });

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) return reply.code(401).send({ error: 'Invalid credentials' });

    const token = generateToken();
    await db.query('UPDATE user_auth SET session_token = $1, updated_at = NOW() WHERE id = $2', [token, user.id]);
    return { token, autoLogout: user.auto_logout };
  });

  // Validate session
  app.get('/api/auth/session', async (req, reply) => {
    const token = (req.headers['x-session-token'] as string) || '';
    if (!token) return reply.code(401).send({ valid: false });
    const { rows } = await db.query('SELECT auto_logout FROM user_auth WHERE session_token = $1', [token]);
    if (!rows.length) return reply.code(401).send({ valid: false });
    return { valid: true, autoLogout: rows[0].auto_logout };
  });

  // Logout — clears session token
  app.post('/api/auth/logout', async (req) => {
    const token = (req.headers['x-session-token'] as string) || '';
    if (token) await db.query('UPDATE user_auth SET session_token = NULL, updated_at = NOW() WHERE session_token = $1', [token]);
    return { ok: true };
  });

  // Get auth preferences
  app.get('/api/auth/preferences', async (req, reply) => {
    const token = (req.headers['x-session-token'] as string) || '';
    if (!token) return reply.code(401).send({ error: 'Unauthorized' });
    const { rows } = await db.query('SELECT username, auto_logout FROM user_auth WHERE session_token = $1', [token]);
    if (!rows.length) return reply.code(401).send({ error: 'Unauthorized' });
    return { username: rows[0].username, autoLogout: rows[0].auto_logout };
  });

  // Update auto-logout preference
  app.post('/api/auth/preferences', async (req, reply) => {
    const token = (req.headers['x-session-token'] as string) || '';
    if (!token) return reply.code(401).send({ error: 'Unauthorized' });
    const { autoLogout } = req.body as { autoLogout: boolean };
    const { rowCount } = await db.query(
      'UPDATE user_auth SET auto_logout = $1, updated_at = NOW() WHERE session_token = $2',
      [autoLogout, token]
    );
    if (!rowCount) return reply.code(401).send({ error: 'Unauthorized' });
    return { ok: true };
  });

  // Change password
  app.post('/api/auth/change-password', async (req, reply) => {
    const token = (req.headers['x-session-token'] as string) || '';
    if (!token) return reply.code(401).send({ error: 'Unauthorized' });
    const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
    if (!currentPassword || !newPassword) return reply.code(400).send({ error: 'Both passwords required' });

    const { rows } = await db.query('SELECT * FROM user_auth WHERE session_token = $1', [token]);
    if (!rows.length) return reply.code(401).send({ error: 'Unauthorized' });

    const ok = await verifyPassword(currentPassword, rows[0].password_hash);
    if (!ok) return reply.code(403).send({ error: 'Current password incorrect' });

    const hash = await hashPassword(newPassword);
    await db.query('UPDATE user_auth SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, rows[0].id]);
    return { ok: true };
  });

  // Change username
  app.post('/api/auth/change-username', async (req, reply) => {
    const token = (req.headers['x-session-token'] as string) || '';
    if (!token) return reply.code(401).send({ error: 'Unauthorized' });
    const { newUsername, password } = req.body as { newUsername: string; password: string };
    if (!newUsername?.trim() || !password) return reply.code(400).send({ error: 'Username and password required' });

    const { rows } = await db.query('SELECT * FROM user_auth WHERE session_token = $1', [token]);
    if (!rows.length) return reply.code(401).send({ error: 'Unauthorized' });

    const ok = await verifyPassword(password, rows[0].password_hash);
    if (!ok) return reply.code(403).send({ error: 'Password incorrect' });

    await db.query('UPDATE user_auth SET username = $1, updated_at = NOW() WHERE id = $2', [newUsername.trim().toLowerCase(), rows[0].id]);
    return { ok: true };
  });

  // Forgot password — generate reset token and email link
  app.post('/api/auth/forgot-password', async (req, reply) => {
    if (!config.smtp.user || !config.smtp.pass || !config.ownerEmail) {
      return reply.code(503).send({ error: 'Email not configured on this server.' });
    }

    const resetToken = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const { rows } = await db.query('SELECT id FROM user_auth LIMIT 1');
    if (!rows.length) return reply.code(404).send({ error: 'No account found.' });

    await db.query(
      'UPDATE user_auth SET reset_token = $1, reset_token_expires_at = $2, updated_at = NOW() WHERE id = $3',
      [resetToken, expires, rows[0].id]
    );

    const resetUrl = `${config.appUrl}/operations/raven/?reset_token=${resetToken}`;

    const transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: { user: config.smtp.user, pass: config.smtp.pass },
    });

    await transporter.sendMail({
      from: `"Command Center" <${config.smtp.user}>`,
      to: config.ownerEmail,
      subject: 'Command Center — Password Reset',
      text: `Click the link below to reset your password. This link expires in 1 hour.\n\n${resetUrl}\n\nIf you did not request this, ignore this email.`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:2rem;background:#0d0d0d;color:#fff;border-radius:10px;">
          <h2 style="color:#c9a840;margin-top:0;">Password Reset</h2>
          <p>Click the button below to reset your Command Center password. This link expires in <strong>1 hour</strong>.</p>
          <a href="${resetUrl}" style="display:inline-block;margin:1.5rem 0;padding:0.85rem 2rem;background:linear-gradient(90deg,#5c3d08,#b8860b,#f0d060,#fffacd,#f0d060,#b8860b,#5c3d08);color:#1a0e00;font-weight:800;text-decoration:none;border-radius:8px;letter-spacing:0.06em;text-transform:uppercase;">
            Reset Password
          </a>
          <p style="color:#888;font-size:0.8rem;">If you did not request this, ignore this email.</p>
        </div>
      `,
    });

    return { ok: true };
  });

  // Reset password — validate token and set new password
  app.post('/api/auth/reset-password', async (req, reply) => {
    const { token, newPassword } = req.body as { token: string; newPassword: string };
    if (!token || !newPassword || newPassword.length < 8) {
      return reply.code(400).send({ error: 'Token and new password (min 8 chars) required.' });
    }

    const { rows } = await db.query(
      'SELECT * FROM user_auth WHERE reset_token = $1 AND reset_token_expires_at > NOW()',
      [token]
    );
    if (!rows.length) return reply.code(401).send({ error: 'Reset link is invalid or has expired.' });

    const hash = await hashPassword(newPassword);
    await db.query(
      'UPDATE user_auth SET password_hash = $1, reset_token = NULL, reset_token_expires_at = NULL, session_token = NULL, updated_at = NOW() WHERE id = $2',
      [hash, rows[0].id]
    );

    return { ok: true };
  });
}
