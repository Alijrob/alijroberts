#!/usr/bin/env node
// Operational Intelligence — /wtf auto-ingest Stop hook.
//
// Claude Code fires Stop hooks when the agent finishes a turn, passing a JSON
// payload on stdin that includes `transcript_path` (the session .jsonl). This
// hook reads the transcript, and if the agent's final message is a /wtf
// post-mortem (the five-section output from the wtf skill), it POSTs that text
// to the Intel console's ingest endpoint with source="wtf". The endpoint
// already parses, classifies, scores, and stores it, so the correction event
// lands in the console with no other change.
//
// It is idempotent: the last-ingested assistant message UUID is recorded in a
// state file, so the same /wtf turn is never POSTed twice. It never blocks the
// agent — any error exits 0 silently.
//
// Override the target with INTEL_INGEST_URL (defaults to the live raven hub).

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import https from 'node:https';

const INGEST_URL = process.env.INTEL_INGEST_URL || 'https://raven.alijroberts.com/api/intel/ingest';
const STATE_FILE = path.join(os.homedir(), '.claude', 'intel-wtf-state.json');

// The five canonical /wtf section headers (see the wtf skill). Require >= 3 to
// treat a message as a genuine /wtf output and avoid false positives.
const WTF_MARKERS = [
  /your\s+last\s+command/i,
  /what\s+i\s+did/i,
  /why\s+it'?s?\s+wrong/i,
  /whose\s+fault/i,
  /what\s+you\s+should'?ve\s+said/i,
];

const done = () => process.exit(0); // Stop hooks must not block; always exit clean.

function readStdin() {
  try { return fs.readFileSync(0, 'utf8'); } catch { return ''; }
}

function textFromContent(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .filter(b => b && (b.type === 'text' || typeof b.text === 'string'))
      .map(b => b.text || '')
      .join('\n');
  }
  return '';
}

// Return { uuid, text } of the final assistant message in the transcript, or null.
function lastAssistantMessage(transcriptPath) {
  let raw;
  try { raw = fs.readFileSync(transcriptPath, 'utf8'); } catch { return null; }
  const lines = raw.split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (!line) continue;
    let obj;
    try { obj = JSON.parse(line); } catch { continue; }
    const role = obj.message?.role || obj.role || obj.type;
    if (role !== 'assistant') continue;
    const text = textFromContent(obj.message?.content ?? obj.content);
    if (!text.trim()) continue;            // skip pure tool-use turns
    return { uuid: obj.uuid || obj.message?.id || String(i), text };
  }
  return null;
}

function isWtfOutput(text) {
  return WTF_MARKERS.filter(re => re.test(text)).length >= 3;
}

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch { return {}; }
}
function saveState(state) {
  try {
    fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(state));
  } catch { /* best effort */ }
}

function postIngest(body, onDone) {
  let url;
  try { url = new URL(INGEST_URL); } catch { return onDone(false); }
  const payload = JSON.stringify(body);
  const lib = url.protocol === 'http:' ? http : https;
  const req = lib.request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
    timeout: 6000,
  }, res => {
    res.resume();
    onDone(res.statusCode >= 200 && res.statusCode < 300);
  });
  req.on('error', () => onDone(false));
  req.on('timeout', () => { req.destroy(); onDone(false); });
  req.write(payload);
  req.end();
}

function shortLabel(text) {
  // First non-empty line under "Your last command", trimmed for a readable label.
  const m = text.match(/your\s+last\s+command[^\n]*\n+([^\n]+)/i);
  const seed = (m ? m[1] : 'correction event').replace(/[*_`>#"']/g, '').trim();
  const stamp = new Date().toISOString().slice(0, 10);
  return `WTF ${stamp}: ${seed}`.slice(0, 90);
}

function main() {
  const input = readStdin();
  let hook = {};
  try { hook = JSON.parse(input); } catch { /* no payload */ }
  const transcriptPath = hook.transcript_path;
  if (!transcriptPath) return done();

  const last = lastAssistantMessage(transcriptPath);
  if (!last || !isWtfOutput(last.text)) return done();

  const state = loadState();
  if (state.lastUuid === last.uuid) return done(); // already ingested this /wtf turn

  postIngest({ label: shortLabel(last.text), source: 'wtf', transcript: last.text }, ok => {
    if (ok) saveState({ lastUuid: last.uuid, at: new Date().toISOString() });
    done();
  });
}

main();
