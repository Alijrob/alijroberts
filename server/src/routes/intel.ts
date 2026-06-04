import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';
import { parseTranscript } from '../intel/parser.js';

// Operational Intelligence store + ingestion API. Lives on the raven hub
// (ajr_central) alongside the Prompt Center. Raw transcripts are decomposed by
// the deterministic engine in ../intel/parser.ts into structured, scored
// IntelRecords for forensic review, metrics, and training-data export.

export async function ensureIntelTables() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS intel_sessions (
      id SERIAL PRIMARY KEY,
      label TEXT NOT NULL DEFAULT 'Session',
      source TEXT NOT NULL DEFAULT 'paste',
      raw_transcript TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS intel_records (
      id SERIAL PRIMARY KEY,
      session_id INTEGER NOT NULL REFERENCES intel_sessions(id) ON DELETE CASCADE,
      seq INTEGER NOT NULL DEFAULT 0,
      command_id TEXT NOT NULL DEFAULT '',
      ts TIMESTAMPTZ,
      literal_instruction TEXT NOT NULL DEFAULT '',
      user_intent TEXT NOT NULL DEFAULT '',
      parsed_intent TEXT NOT NULL DEFAULT '',
      agent_interpretation TEXT NOT NULL DEFAULT '',
      actions_taken JSONB NOT NULL DEFAULT '[]',
      tool_usage_count INTEGER NOT NULL DEFAULT 0,
      verification_count INTEGER NOT NULL DEFAULT 0,
      redundant_action_count INTEGER NOT NULL DEFAULT 0,
      execution_time TEXT NOT NULL DEFAULT '',
      context_window_state TEXT NOT NULL DEFAULT '',
      error_type TEXT NOT NULL DEFAULT 'none',
      failure_category TEXT NOT NULL DEFAULT 'none',
      severity_rating TEXT NOT NULL DEFAULT 'none',
      root_cause TEXT NOT NULL DEFAULT '',
      corrective_action TEXT NOT NULL DEFAULT '',
      preferred_alternative_action TEXT NOT NULL DEFAULT '',
      outcome_quality TEXT NOT NULL DEFAULT '',
      user_sentiment TEXT NOT NULL DEFAULT '',
      compliance_score INTEGER NOT NULL DEFAULT 0,
      efficiency_score INTEGER NOT NULL DEFAULT 0,
      overengineering_score INTEGER NOT NULL DEFAULT 0,
      autonomy_score INTEGER NOT NULL DEFAULT 0,
      confidence_score INTEGER NOT NULL DEFAULT 0,
      deviation TEXT NOT NULL DEFAULT '',
      ideal_execution TEXT NOT NULL DEFAULT '',
      categories JSONB NOT NULL DEFAULT '[]',
      flags JSONB NOT NULL DEFAULT '[]',
      raw_chunk TEXT NOT NULL DEFAULT '',
      annotation TEXT NOT NULL DEFAULT '',
      tags JSONB NOT NULL DEFAULT '[]',
      source TEXT NOT NULL DEFAULT 'paste',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    -- carry the ingest source onto each record so correction events (source=wtf)
    -- can be filtered on their own; ADD COLUMN keeps pre-existing tables in sync.
    ALTER TABLE intel_records ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'paste';
    CREATE INDEX IF NOT EXISTS intel_records_session_idx ON intel_records(session_id, seq);
    CREATE INDEX IF NOT EXISTS intel_records_failure_idx ON intel_records(failure_category);
    CREATE INDEX IF NOT EXISTS intel_records_severity_idx ON intel_records(severity_rating);
    CREATE INDEX IF NOT EXISTS intel_records_source_idx ON intel_records(source);
  `);
}

const LIST_COLS = `id, session_id, seq, command_id, parsed_intent, agent_interpretation,
  failure_category, severity_rating, outcome_quality, user_sentiment, error_type,
  tool_usage_count, verification_count, redundant_action_count,
  compliance_score, efficiency_score, overengineering_score, autonomy_score, confidence_score,
  categories, flags, annotation, tags, source, created_at`;

export async function intelRoutes(app: FastifyInstance) {
  await ensureIntelTables();

  // ---- Ingest ----------------------------------------------------------
  app.post('/api/intel/ingest', async (req, reply) => {
    const { label, source, transcript } = req.body as { label?: string; source?: string; transcript?: string };
    if (!transcript?.trim()) return reply.code(400).send({ error: 'transcript required' });

    const { rows: sess } = await db.query(
      'INSERT INTO intel_sessions (label, source, raw_transcript) VALUES ($1, $2, $3) RETURNING *',
      [label?.trim() || 'Untitled session', source?.trim() || 'paste', transcript]
    );
    const session = sess[0];
    const records = parseTranscript(transcript, session.id, session.source);

    for (const r of records) {
      await db.query(
        `INSERT INTO intel_records
         (session_id, seq, command_id, literal_instruction, user_intent, parsed_intent, agent_interpretation,
          actions_taken, tool_usage_count, verification_count, redundant_action_count, execution_time, context_window_state,
          error_type, failure_category, severity_rating, root_cause, corrective_action, preferred_alternative_action,
          outcome_quality, user_sentiment, compliance_score, efficiency_score, overengineering_score, autonomy_score,
          confidence_score, deviation, ideal_execution, categories, flags, raw_chunk, source)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32)`,
        [session.id, r.seq, r.command_id, r.literal_instruction, r.user_intent, r.parsed_intent, r.agent_interpretation,
         JSON.stringify(r.actions_taken), r.tool_usage_count, r.verification_count, r.redundant_action_count, r.execution_time, r.context_window_state,
         r.error_type, r.failure_category, r.severity_rating, r.root_cause, r.corrective_action, r.preferred_alternative_action,
         r.outcome_quality, r.user_sentiment, r.compliance_score, r.efficiency_score, r.overengineering_score, r.autonomy_score,
         r.confidence_score, r.deviation, r.ideal_execution, JSON.stringify(r.categories), JSON.stringify(r.flags), r.raw_chunk, session.source]
      );
    }
    return { session, count: records.length };
  });

  // ---- Sessions --------------------------------------------------------
  app.get('/api/intel/sessions', async () => {
    const { rows } = await db.query(`
      SELECT s.*,
             COUNT(r.id)::int AS record_count,
             COALESCE(ROUND(AVG(r.compliance_score)),0)::int AS avg_compliance,
             COUNT(r.id) FILTER (WHERE r.failure_category <> 'none')::int AS failure_count
      FROM intel_sessions s LEFT JOIN intel_records r ON r.session_id = s.id
      GROUP BY s.id ORDER BY s.created_at DESC`);
    return rows;
  });

  app.delete('/api/intel/sessions/:id', async (req) => {
    const { id } = req.params as { id: string };
    await db.query('DELETE FROM intel_sessions WHERE id = $1', [id]);
    return { ok: true };
  });

  // ---- Records (filterable + searchable) -------------------------------
  app.get('/api/intel/records', async (req) => {
    const q = req.query as Record<string, string | undefined>;
    const where: string[] = [];
    const args: unknown[] = [];
    const p = (val: unknown) => { args.push(val); return `$${args.length}`; };
    if (q.session_id) where.push(`session_id = ${p(Number(q.session_id))}`);
    if (q.failure)    where.push(`failure_category = ${p(q.failure)}`);
    if (q.severity)   where.push(`severity_rating = ${p(q.severity)}`);
    if (q.sentiment)  where.push(`user_sentiment = ${p(q.sentiment)}`);
    if (q.source)     where.push(`source = ${p(q.source)}`);
    if (q.flag)       where.push(`flags @> ${p(JSON.stringify([q.flag]))}::jsonb`);
    if (q.q) {
      const like = p(`%${q.q}%`);
      where.push(`(literal_instruction ILIKE ${like} OR parsed_intent ILIKE ${like} OR raw_chunk ILIKE ${like})`);
    }
    const sql = `SELECT ${LIST_COLS} FROM intel_records
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY session_id DESC, seq ASC LIMIT 500`;
    const { rows } = await db.query(sql, args);
    return rows;
  });

  app.get('/api/intel/records/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { rows } = await db.query('SELECT * FROM intel_records WHERE id = $1', [id]);
    if (!rows[0]) return reply.code(404).send({ error: 'Not found' });
    return rows[0];
  });

  app.put('/api/intel/records/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { annotation, tags } = req.body as { annotation?: string; tags?: string[] };
    const { rows } = await db.query(
      `UPDATE intel_records
       SET annotation = COALESCE($1, annotation),
           tags       = COALESCE($2, tags)
       WHERE id = $3 RETURNING *`,
      [annotation ?? null, tags ? JSON.stringify(tags) : null, id]
    );
    if (!rows[0]) return reply.code(404).send({ error: 'Not found' });
    return rows[0];
  });

  app.delete('/api/intel/records/:id', async (req) => {
    const { id } = req.params as { id: string };
    await db.query('DELETE FROM intel_records WHERE id = $1', [id]);
    return { ok: true };
  });

  // ---- Metrics / dashboards / heatmap / trend --------------------------
  app.get('/api/intel/metrics', async (req) => {
    const { session_id } = req.query as { session_id?: string };
    const filter = session_id ? 'WHERE session_id = $1' : '';
    const args = session_id ? [Number(session_id)] : [];

    const totals = (await db.query(`
      SELECT COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE failure_category <> 'none')::int AS failures,
             COUNT(*) FILTER (WHERE severity_rating IN ('high','critical'))::int AS high_severity,
             COALESCE(ROUND(AVG(compliance_score)),0)::int AS avg_compliance,
             COALESCE(ROUND(AVG(efficiency_score)),0)::int AS avg_efficiency,
             COALESCE(ROUND(AVG(overengineering_score)),0)::int AS avg_overengineering,
             COALESCE(ROUND(AVG(autonomy_score)),0)::int AS avg_autonomy,
             COALESCE(ROUND(AVG(confidence_score)),0)::int AS avg_confidence
      FROM intel_records ${filter}`, args)).rows[0];

    const byFailure  = (await db.query(`SELECT failure_category AS k, COUNT(*)::int AS n FROM intel_records ${filter} GROUP BY failure_category ORDER BY n DESC`, args)).rows;
    const bySeverity = (await db.query(`SELECT severity_rating AS k, COUNT(*)::int AS n FROM intel_records ${filter} GROUP BY severity_rating ORDER BY n DESC`, args)).rows;
    const bySentiment= (await db.query(`SELECT user_sentiment AS k, COUNT(*)::int AS n FROM intel_records ${filter} GROUP BY user_sentiment ORDER BY n DESC`, args)).rows;
    const byOutcome  = (await db.query(`SELECT outcome_quality AS k, COUNT(*)::int AS n FROM intel_records ${filter} GROUP BY outcome_quality ORDER BY n DESC`, args)).rows;
    const byFlag     = (await db.query(`SELECT f AS k, COUNT(*)::int AS n FROM intel_records r, jsonb_array_elements_text(r.flags) f ${session_id ? 'WHERE r.session_id = $1' : ''} GROUP BY f ORDER BY n DESC`, args).catch(() => ({ rows: [] }))).rows;
    const trend      = (await db.query(`SELECT command_id, seq, session_id, compliance_score, efficiency_score, overengineering_score, autonomy_score, confidence_score FROM intel_records ${filter} ORDER BY session_id ASC, seq ASC LIMIT 300`, args)).rows;

    return { totals, byFailure, bySeverity, bySentiment, byOutcome, byFlag, trend };
  });

  // ---- Training-data export (JSONL) ------------------------------------
  app.get('/api/intel/export', async (req, reply) => {
    const { session_id } = req.query as { session_id?: string };
    const filter = session_id ? 'WHERE session_id = $1' : '';
    const args = session_id ? [Number(session_id)] : [];
    const { rows } = await db.query(`SELECT * FROM intel_records ${filter} ORDER BY session_id, seq`, args);
    const jsonl = rows.map(r => JSON.stringify({
      command_id: r.command_id,
      instruction: r.literal_instruction,
      parsed_intent: r.parsed_intent,
      agent_interpretation: r.agent_interpretation,
      actions: r.actions_taken,
      deviation: r.deviation,
      ideal_execution: r.ideal_execution,
      corrective_action: r.corrective_action,
      failure_category: r.failure_category,
      severity: r.severity_rating,
      flags: r.flags,
      scores: {
        compliance: r.compliance_score, efficiency: r.efficiency_score,
        overengineering: r.overengineering_score, autonomy: r.autonomy_score, confidence: r.confidence_score,
      },
    })).join('\n');
    reply.header('Content-Type', 'application/x-ndjson');
    reply.header('Content-Disposition', `attachment; filename="intel-export${session_id ? '-' + session_id : ''}.jsonl"`);
    return jsonl;
  });
}
