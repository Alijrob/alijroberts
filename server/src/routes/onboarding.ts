import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';
import path from 'path';
import fs from 'fs/promises';
import { config } from '../config.js';

export async function onboardingRoutes(app: FastifyInstance) {
  app.get('/api/onboarding/status', async () => {
    const result = await db.query(`SELECT completed FROM onboarding_state WHERE id = 1`);
    return { completed: result.rows[0]?.completed ?? false };
  });

  app.get('/api/onboarding/state', async () => {
    const state = await db.query(
      `SELECT display_name, space_name, logo_path, brand_logo_path, brand_color_primary, brand_color_secondary, completed FROM onboarding_state WHERE id = 1`
    );
    const phones = await db.query(`SELECT type, number FROM user_phones WHERE is_primary = true LIMIT 1`);
    const emails = await db.query(`SELECT type, email FROM user_emails WHERE is_primary = true LIMIT 1`);
    const addrs = await db.query(`SELECT type, line1, line2, city, state, zip FROM user_addresses WHERE is_primary = true LIMIT 1`);
    return { ...state.rows[0], phone: phones.rows[0], email: emails.rows[0], address: addrs.rows[0] };
  });

  app.post('/api/onboarding/save', async (req, reply) => {
    const parts = req.parts();
    const fields: Record<string, string> = {};
    let logoFilename: string | null = null;

    let brandLogoFilename: string | null = null;

    for await (const part of parts) {
      if (part.type === 'file' && part.fieldname === 'logo') {
        await fs.mkdir(config.uploadDir, { recursive: true });
        const ext = path.extname(part.filename);
        logoFilename = `profile${ext}`;
        await fs.writeFile(path.join(config.uploadDir, logoFilename), await part.toBuffer());
      } else if (part.type === 'file' && part.fieldname === 'brandLogo') {
        await fs.mkdir(config.uploadDir, { recursive: true });
        const ext = path.extname(part.filename);
        brandLogoFilename = `brand-logo${ext}`;
        await fs.writeFile(path.join(config.uploadDir, brandLogoFilename), await part.toBuffer());
      } else if (part.type === 'field') {
        fields[part.fieldname] = part.value as string;
      }
    }

    if (!fields.name?.trim()) return reply.code(400).send({ error: 'Name required' });

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `INSERT INTO onboarding_state (id, display_name, space_name, logo_path, brand_logo_path, brand_color_primary, brand_color_secondary)
         VALUES (1, $1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
           display_name = EXCLUDED.display_name,
           space_name = EXCLUDED.space_name,
           logo_path = COALESCE(EXCLUDED.logo_path, onboarding_state.logo_path),
           brand_logo_path = COALESCE(EXCLUDED.brand_logo_path, onboarding_state.brand_logo_path),
           brand_color_primary = COALESCE(EXCLUDED.brand_color_primary, onboarding_state.brand_color_primary),
           brand_color_secondary = COALESCE(EXCLUDED.brand_color_secondary, onboarding_state.brand_color_secondary),
           updated_at = NOW()`,
        [
          fields.name.trim(),
          fields.spaceName?.trim() || fields.name.trim(),
          logoFilename,
          brandLogoFilename,
          fields.brandColorPrimary || null,
          fields.brandColorSecondary || null,
        ]
      );

      if (fields.phone?.trim()) {
        await client.query(`DELETE FROM user_phones WHERE is_primary = true`);
        await client.query(
          `INSERT INTO user_phones (type, number, is_primary) VALUES ($1, $2, true)`,
          [fields.phoneType || 'cell', fields.phone.trim()]
        );
      }

      if (fields.email?.trim()) {
        await client.query(`DELETE FROM user_emails WHERE is_primary = true`);
        await client.query(
          `INSERT INTO user_emails (type, email, is_primary) VALUES ($1, $2, true)`,
          [fields.emailType || 'personal', fields.email.trim()]
        );
      }

      const isIntl = fields.addrInternational === 'true';
      const hasAddr = isIntl ? fields.addrFreeform?.trim() : fields.addrLine1?.trim();
      if (hasAddr) {
        await client.query(`DELETE FROM user_addresses WHERE is_primary = true`);
        await client.query(
          `INSERT INTO user_addresses (type, line1, line2, city, state, zip, country, is_primary) VALUES ($1,$2,$3,$4,$5,$6,$7,true)`,
          [
            fields.addrType || 'home',
            isIntl ? fields.addrFreeform.trim() : fields.addrLine1.trim(),
            isIntl ? null : (fields.addrLine2 || null),
            isIntl ? null : (fields.addrCity || null),
            isIntl ? null : (fields.addrState || null),
            isIntl ? null : (fields.addrZip || null),
            isIntl ? (fields.addrCountry || null) : null,
          ]
        );
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    return { ok: true };
  });

  app.post('/api/onboarding/complete', async () => {
    await db.query(
      `INSERT INTO onboarding_state (id, completed) VALUES (1, true)
       ON CONFLICT (id) DO UPDATE SET completed = true, updated_at = NOW()`
    );
    return { ok: true };
  });

  app.post('/api/onboarding/reset', async () => {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      await client.query(`UPDATE onboarding_state SET display_name = NULL, space_name = NULL, logo_path = NULL, brand_logo_path = NULL, brand_color_primary = NULL, brand_color_secondary = NULL, completed = false, updated_at = NOW() WHERE id = 1`);
      await client.query(`DELETE FROM user_phones`);
      await client.query(`DELETE FROM user_emails`);
      await client.query(`DELETE FROM user_addresses`);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    return { ok: true };
  });
}
