// Operational Intelligence ingestion engine.
//
// Takes a raw AI-interaction transcript and decomposes it into discrete
// execution units (one user command + the agent's response to it), then
// classifies, scores, and structures each unit into an IntelRecord.
//
// This is a DETERMINISTIC, heuristic engine: no external model calls, no cost,
// fully reproducible. It is intentionally structured so an LLM enrichment pass
// can be layered on later (each detector is isolated). Accuracy scales with how
// well the transcript marks speaker turns; see SPEAKER MARKERS below.

export interface IntelRecord {
  command_id: string;
  seq: number;
  timestamp: string | null;
  // intent lineage
  literal_instruction: string;
  user_intent: string;
  parsed_intent: string;
  agent_interpretation: string;
  // execution
  actions_taken: { type: string; detail: string }[];
  tool_usage_count: number;
  verification_count: number;
  redundant_action_count: number;
  execution_time: string;
  context_window_state: string;
  // failure analysis
  error_type: string;
  failure_category: string;
  severity_rating: string;
  root_cause: string;
  corrective_action: string;
  preferred_alternative_action: string;
  // outcome
  outcome_quality: string;
  user_sentiment: string;
  // scores (0-100; for overengineering, higher = worse)
  compliance_score: number;
  efficiency_score: number;
  overengineering_score: number;
  autonomy_score: number;
  confidence_score: number;
  // forensic separation
  deviation: string;
  ideal_execution: string;
  // tagging
  categories: string[];
  flags: string[];
  raw_chunk: string;
}

interface Block { role: 'user' | 'agent'; text: string; }

const USER_MARKERS = [
  /^\s*(user|human|jay|operator|me|prompt)\s*[:>]/i,
  /^#{1,3}\s*(user|human|prompt|operator)\b/i,
  /^\*\*\s*(user|human|jay|operator)\s*\*\*/i,
  /^\s*\[(user|human|jay)\]/i,
];
const AGENT_MARKERS = [
  /^\s*(assistant|claude|agent|ai|model|gpt|bot)\s*[:>]/i,
  /^#{1,3}\s*(assistant|claude|agent|response|ai)\b/i,
  /^\*\*\s*(assistant|claude|agent)\s*\*\*/i,
  /^\s*\[(assistant|claude|agent|ai)\]/i,
];

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const countMatches = (text: string, re: RegExp) => (text.match(re) || []).length;
const firstSentence = (s: string) => {
  const t = s.trim().replace(/\s+/g, ' ');
  const m = t.match(/^.*?[.!?](\s|$)/);
  return (m ? m[0] : t).trim().slice(0, 220);
};
const stripMarker = (line: string) =>
  line.replace(/^\s*(user|human|jay|operator|me|prompt|assistant|claude|agent|ai|model|gpt|bot)\s*[:>]\s*/i, '')
      .replace(/^#{1,3}\s*\w+\s*/i, '')
      .replace(/^\*\*\s*\w+\s*\*\*\s*:?\s*/i, '');

// ---- detector regexes ------------------------------------------------------
const RE = {
  tool: /\b(bash|shell|read file|read|edit|write|grep|glob|search|curl|ssh|scp|npm |npx |yarn |git |sed |awk |cat |ls |mkdir|rm |psql|docker|pm2|nginx|systemctl|fetch|api call|tool call|invoke|function_call|running|i'?ll run|let me run|let me check|executed?)\b/gi,
  verify: /\b(verif\w+|tested?|testing|confirm\w*|check\w*|nginx -t|assert\w*|\bPASS\b|ensure[ds]?|validate[ds]?|double[- ]check|make sure|sanity|re[- ]?run)\b/gi,
  hedge: /\b(maybe|might|i think|i believe|possibly|perhaps|probably|not sure|could be|it seems|i guess|kind of|sort of)\b/gi,
  asking: /\b(should i|do you want|would you like|shall i|let me know if you|which (option|approach|one|would)|do you prefer|want me to|is that (ok|okay|right)|can you confirm|please confirm)\b/gi,
  overeng: /\b(also (added|built|created|included|wrote|made)|while i (was|am) (in there|at it)|additionally|as a bonus|\bbonus\b|went ahead and|i also (added|built|went)|for good measure|future[- ]proof|just in case|in case you (want|need)|might as well|took the liberty|on top of that|i added a few)\b/gi,
  failure: /\b(error|errors|failed|failure|exception|cannot|can'?t|could ?n'?t|denied|not found|undefined|\bnull\b|traceback|stack ?trace|does not exist|doesn'?t exist|permission denied|timed out|timeout|broke|broken|crash\w*|rejected|refused|no such)\b/gi,
  recovery: /\b(fixed|resolved|now works|works now|passes|passing|succeeded|recovered|back (up|online)|corrected|sorted|all green)\b/gi,
  interrupt: /\b(stop|wait|hold on|hold up|no,|nope|don'?t|do not|that'?s not|thats not|not what i|why did you|undo|revert|cancel|abort|halt)\b/i,
  frustration: /\b(wtf|ugh|seriously|come on|frustrat\w*|annoying|are you kidding|just (do|stop|fix)|i said|i told you|listen|for the (last|nth) time|stop (doing|asking)|read what i)\b/i,
  thanks: /\b(thanks|thank you|perfect|great|nice|awesome|exactly|love it|well done|good (job|work)|that'?s it|ship it)\b/i,
  paralysis: /\b(let me think|on one hand|on the other hand|however|alternatively|i could (either)?|there are (several|multiple) (options|ways|approaches)|it depends|considering whether|weighing)\b/gi,
  ambiguityWords: /\b(this|that|it|them|those|the thing|the file|the one)\b/gi,
};

function detect(userText: string, agentText: string, feedback: string, seq: number, idx: number): IntelRecord {
  const literal = userText.trim();
  const words = literal.split(/\s+/).filter(Boolean);

  // execution metrics
  const actionLines = agentText.split('\n').map(l => l.trim()).filter(Boolean);
  const tool_usage_count = countMatches(agentText, RE.tool) + countMatches(agentText, /```/g) / 2 | 0;
  const verification_count = countMatches(agentText, RE.verify);
  const normalized = actionLines.map(l => l.toLowerCase().replace(/[0-9]+/g, '#').slice(0, 60));
  const seen = new Set<string>();
  let redundant_action_count = 0;
  for (const n of normalized) { if (n.length > 8 && /\b(run|check|verif|test|read|edit|curl|git|npm)\b/.test(n)) { if (seen.has(n)) redundant_action_count++; else seen.add(n); } }

  // signal detectors
  const hedge = countMatches(agentText, RE.hedge);
  const asking = countMatches(agentText, RE.asking);
  const overeng = countMatches(agentText, RE.overeng);
  const failure = countMatches(agentText + ' ' + feedback, RE.failure);
  const recovery = RE.recovery.test(agentText);
  const interruptInFeedback = RE.interrupt.test(feedback);
  const frustration = RE.frustration.test(feedback) || /[A-Z]{4,}/.test(feedback.replace(/\b(API|HTTP|JSON|HTML|CSS|SQL|URL|ZEUS|THOTH|PAGIOS|IBIS|DAS|CRM)\b/g, '')) || (feedback.match(/!/g) || []).length >= 2;
  const correction = interruptInFeedback || /\b(instead|should have|supposed to|that'?s wrong|incorrect|not right|redo|again)\b/i.test(feedback);
  const positive = RE.thanks.test(feedback);
  const paralysis = countMatches(agentText, RE.paralysis);
  const ambiguous = words.length > 0 && words.length <= 6 && countMatches(literal, RE.ambiguityWords) >= 1;
  const verbosity = agentText.length > 1400 && tool_usage_count <= 1;

  // error typing
  let error_type = 'none';
  if (failure > 0) {
    if (/permission denied|denied|refused|rejected/i.test(agentText + feedback)) error_type = 'permission';
    else if (/not found|does ?n'?t exist|no such/i.test(agentText + feedback)) error_type = 'not-found';
    else if (/timed out|timeout/i.test(agentText + feedback)) error_type = 'timeout';
    else if (/traceback|stack ?trace|exception|undefined|null|crash/i.test(agentText + feedback)) error_type = 'runtime';
    else error_type = 'logic';
  }

  // flags
  const flags: string[] = [];
  if (verification_count >= 3 && verification_count > Math.max(1, tool_usage_count)) flags.push('unnecessary_verification_loops');
  if (verification_count >= 5) flags.push('excessive_measurement');
  if (interruptInFeedback) flags.push('interruption_ignorance');
  if (redundant_action_count >= 2) flags.push('process_fixation');
  if (paralysis >= 2 && tool_usage_count <= 1) flags.push('analysis_paralysis');
  if (tool_usage_count >= 8) flags.push('tool_overuse');
  if (correction || frustration) flags.push('failure_to_prioritize_user_intent');
  if (verbosity) flags.push('verbosity_during_execution');
  if (asking >= 1 && words.length >= 4) flags.push('unnecessary_clarification');
  const violation = /\b(i said|i told you|supposed to|you were asked|that'?s not what i|don'?t|do not)\b/i.test(feedback);
  if (violation) flags.push('deviation_from_operating_rules');

  // failure category (dominant)
  let failure_category = 'none';
  if (violation) failure_category = 'instruction-violation';
  else if (interruptInFeedback) failure_category = 'interruption-ignorance';
  else if (overeng > 0) failure_category = 'overengineering';
  else if (error_type !== 'none') failure_category = 'execution-error';
  else if (frustration || correction) failure_category = 'intent-misalignment';
  else if (flags.includes('unnecessary_verification_loops') || flags.includes('excessive_measurement')) failure_category = 'efficiency-violation';

  // severity
  let severity_rating = 'none';
  if (frustration && failure > 0) severity_rating = 'critical';
  else if (frustration || (failure > 0 && correction) || violation) severity_rating = 'high';
  else if (failure > 0 || correction || interruptInFeedback || overeng > 0) severity_rating = 'medium';
  else if (flags.length > 0) severity_rating = 'low';

  // scores
  let compliance = 100;
  if (violation) compliance -= 45;
  if (interruptInFeedback) compliance -= 25;
  if (correction) compliance -= 18;
  if (frustration) compliance -= 12;
  if (overeng > 0) compliance -= 10;
  const compliance_score = clamp(compliance);

  let efficiency = 100;
  efficiency -= Math.min(45, redundant_action_count * 15);
  if (verification_count > tool_usage_count && verification_count >= 3) efficiency -= 15;
  if (verbosity) efficiency -= 15;
  if (paralysis >= 2) efficiency -= 12;
  if (tool_usage_count >= 8) efficiency -= 10;
  const efficiency_score = clamp(efficiency);

  let overengineering = 0;
  overengineering += overeng * 28;
  if (verbosity) overengineering += 18;
  if (words.length <= 6 && tool_usage_count >= 6) overengineering += 25; // big effort for a small ask
  const overengineering_score = clamp(overengineering);

  let autonomy = 100;
  autonomy -= asking * 22;
  if (tool_usage_count === 0 && actionLines.length > 0 && !/\b(answer|explain|summar)/i.test(literal)) autonomy -= 15; // talked, didn't act
  if (interruptInFeedback) autonomy -= 10; // acted past a stop = false autonomy
  const autonomy_score = clamp(autonomy);

  const confidence_score = clamp(92 - hedge * 9 - (ambiguous ? 12 : 0));

  // root cause + corrective guidance
  const ROOT: Record<string, string> = {
    'instruction-violation': 'Agent diverged from an explicit instruction present in the user request.',
    'interruption-ignorance': 'Agent continued executing after the user signaled to stop or redirect.',
    'overengineering': 'Agent expanded scope beyond what was requested.',
    'execution-error': `Tooling/command failure during execution (${error_type}).`,
    'intent-misalignment': 'Agent interpretation did not match the user\'s actual intent.',
    'efficiency-violation': 'Agent spent effort on redundant verification/measurement rather than progress.',
    'none': 'No significant deviation detected.',
  };
  const CORRECTIVE: Record<string, string> = {
    'instruction-violation': 'Re-read the literal instruction, restate its constraints, and execute exactly that scope before anything else.',
    'interruption-ignorance': 'Halt immediately on any stop/redirect signal and re-confirm direction before continuing.',
    'overengineering': 'Deliver only the requested change; surface extra ideas as a one-line note instead of building them.',
    'execution-error': 'Add a verification step matched to the failure mode and fix the root cause before proceeding.',
    'intent-misalignment': 'Restate the parsed intent back to the user in one line and align before executing.',
    'efficiency-violation': 'Collapse to a single targeted check per change; stop re-measuring unchanged state.',
    'none': 'Maintain current approach; behavior aligned with intent.',
  };
  const root_cause = ROOT[failure_category];
  const corrective_action = CORRECTIVE[failure_category];
  const preferred_alternative_action = failure_category === 'none'
    ? 'Same execution path.'
    : `Preferred: ${corrective_action}`;

  // categories present
  const categories: string[] = ['User Commands', 'Final Outcome'];
  if (interruptInFeedback) categories.push('Interrupt Commands');
  if (actionLines.length) categories.push('Agent Actions');
  if (tool_usage_count > 0) categories.push('Tool Calls');
  if (verification_count > 0) categories.push('Verification/Measurement Actions');
  if (tool_usage_count >= 2) categories.push('Execution Chains');
  if (failure > 0) { categories.push('Failure Analysis'); categories.push('Root Cause Analysis'); }
  if (flags.length) categories.push('Behavioral Pattern Analysis');
  if (violation) categories.push('Instruction Violations');
  if (overeng > 0) categories.push('Overengineering Events');
  if (ambiguous) categories.push('Ambiguity Detection');
  if (frustration) categories.push('User Frustration Signals');
  if (efficiency_score < 70) categories.push('Efficiency Violations');
  if (failure > 0 && recovery) categories.push('Recovery Behavior');
  if (failure_category !== 'none') categories.push('Suggested Corrective Behavior');
  if (failure_category !== 'none') categories.push('Rule/Principle Extraction');

  // outcome + sentiment
  const outcome_quality = severity_rating === 'critical' || severity_rating === 'high' ? 'poor'
    : severity_rating === 'medium' ? 'mixed'
    : (failure > 0 && !recovery) ? 'mixed' : 'good';
  const user_sentiment = frustration ? 'frustrated' : correction || interruptInFeedback ? 'negative' : positive ? 'positive' : 'neutral';

  // forensic separation text
  const parsed_intent = firstSentence(literal) || '(no instruction text)';
  const agent_interpretation = firstSentence(agentText) || '(no agent response captured)';
  const deviation = failure_category === 'none'
    ? 'Actual execution aligned with stated intent; no material gap.'
    : `Gap: ${failure_category}. ${root_cause} User signal: ${user_sentiment}.`;
  const ideal_execution = `Given intent "${parsed_intent.slice(0, 120)}", the ideal execution: ${corrective_action}`;

  // context-window state
  let context_window_state = '—';
  if (/\/clear|\bcompact(ed|ing|ion)?\b|context window|summariz(e|ed|ation)|fresh session|resume prompt/i.test(userText + agentText)) context_window_state = 'context-reset/compaction referenced';

  // actions list (typed)
  const actions_taken: { type: string; detail: string }[] = [];
  for (const line of actionLines) {
    const lower = line.toLowerCase();
    if (RE.tool.test(line)) { RE.tool.lastIndex = 0; actions_taken.push({ type: 'tool', detail: line.slice(0, 140) }); }
    else if (RE.verify.test(line)) { RE.verify.lastIndex = 0; actions_taken.push({ type: 'verify', detail: line.slice(0, 140) }); }
    if (actions_taken.length >= 12) break;
  }

  return {
    command_id: `S${String(seq).padStart(2, '0')}-C${String(idx + 1).padStart(3, '0')}`,
    seq: idx,
    timestamp: null,
    literal_instruction: literal,
    user_intent: firstSentence(literal),
    parsed_intent,
    agent_interpretation,
    actions_taken,
    tool_usage_count,
    verification_count,
    redundant_action_count,
    execution_time: actionLines.length ? `${actionLines.length} response lines` : '—',
    context_window_state,
    error_type,
    failure_category,
    severity_rating,
    root_cause,
    corrective_action,
    preferred_alternative_action,
    outcome_quality,
    user_sentiment,
    compliance_score,
    efficiency_score,
    overengineering_score,
    autonomy_score,
    confidence_score,
    deviation,
    ideal_execution,
    categories: Array.from(new Set(categories)),
    flags,
    raw_chunk: (userText + '\n\n' + agentText).slice(0, 8000),
  };
}

// Split a raw transcript into ordered role-tagged blocks.
function blocks(transcript: string): Block[] {
  const lines = transcript.replace(/\r\n/g, '\n').split('\n');
  const out: Block[] = [];
  let role: 'user' | 'agent' | null = null;
  let buf: string[] = [];
  const flush = () => { if (role && buf.join('').trim()) out.push({ role, text: buf.join('\n').trim() }); buf = []; };
  for (const line of lines) {
    const isUser = USER_MARKERS.some(re => re.test(line));
    const isAgent = !isUser && AGENT_MARKERS.some(re => re.test(line));
    if (isUser) { flush(); role = 'user'; buf.push(stripMarker(line)); }
    else if (isAgent) { flush(); role = 'agent'; buf.push(stripMarker(line)); }
    else buf.push(line);
  }
  flush();
  return out;
}

export function parseTranscript(transcript: string, seq = 1): IntelRecord[] {
  const bl = blocks(transcript);

  // No speaker markers detected: store as one unstructured unit so nothing is lost.
  if (bl.length === 0 || bl.every(b => b.role === 'agent')) {
    const rec = detect(transcript.slice(0, 400), transcript, '', seq, 0);
    rec.flags = Array.from(new Set([...rec.flags, 'unstructured_transcript']));
    rec.categories = Array.from(new Set([...rec.categories, 'Ambiguity Detection']));
    rec.parsed_intent = '(unstructured transcript — add "User:" / "Assistant:" markers for full parsing)';
    return [rec];
  }

  // Group into execution units: each user block + following agent block(s),
  // with the NEXT user block passed in as feedback (reaction to this unit).
  const units: { user: string; agent: string; feedback: string }[] = [];
  let cur: { user: string; agent: string } | null = null;
  for (const b of bl) {
    if (b.role === 'user') {
      if (cur) units.push({ ...cur, feedback: '' });
      cur = { user: b.text, agent: '' };
    } else if (cur) {
      cur.agent += (cur.agent ? '\n' : '') + b.text;
    } else {
      cur = { user: '', agent: b.text }; // leading agent text before any user turn
    }
  }
  if (cur) units.push({ ...cur, feedback: '' });
  for (let i = 0; i < units.length - 1; i++) units[i].feedback = units[i + 1].user;

  return units.map((u, i) => detect(u.user, u.agent, u.feedback, seq, i));
}
