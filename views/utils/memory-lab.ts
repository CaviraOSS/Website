import nlp from 'compromise';
import { encode } from 'gpt-tokenizer/model/gpt-4o';
import { extract_claims, render_claim, claims_conflict } from './longmemory-claims';

export type message = { text: string; at: number };
export type fact = {
    id: string; text: string; quote: string; source: number;
    subject: string; relation: string; value: string; key: string | null;
    structured: boolean; active: boolean;
};
type pipeline = { id: string; name: string; logo: string; basis: string; source: string; records: fact[]; context: string; stored: unknown };

export const weights = { coverage: 0.35, grounding: 0.15, freshness: 0.20, structure: 0.20, uniqueness: 0.10 };
const stopwords = new Set('i im am is are was were a an the my me we our you your user users hi hello hey please actually now also really generally for to on at in of and or but it this that as be by from with instead than'.split(' '));
const norm = (text: string) => text.normalize('NFKC').toLocaleLowerCase('en').replace(/[\p{P}\p{S}]+/gu, ' ').replace(/\s+/g, ' ').trim();
const words = (text: string) => new Set(norm(text).split(' ').filter(word => word && !stopwords.has(word)));
const tokens = (text: string) => encode(text).length;
const mean = (values: number[]) => values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;
const round = (value: number) => Math.round(100 * Math.max(0, Math.min(1, value)));

export function analyze(messages: message[]): fact[] {
    const facts: fact[] = [];
    for (const [source, message] of messages.entries()) {
        const sentences: string[] = nlp(message.text).sentences().out('array');
        for (const sentence of sentences) {
            const clauses = sentence.split(/[,;]\s*(?=(?:please\s+)?(?:ping|contact|reach|message)\s+me\b|(?:and\s+)?i\b)/i);
            for (const clause of clauses) {
                const quote = clause.trim();
                const text = quote.replace(/^(?:hi|hello|hey)[,\s]+/i, '').replace(/[.!?]+$/, '').trim();
                if (!words(text).size) continue;
                const contact = text.match(/^(?:please\s+)?(?:ping|contact|reach|message)\s+me\s+(?:on|via|by)\s+(.+?)(?:\s+(?:instead of|rather than)\s+.+)?$/i);
                const name = text.match(/^(?:[Mm]y\s+name\s+is|[Ii](?:\s+am|['\u2019]m))\s+([\p{Lu}][\p{L}'-]+(?:\s+[\p{Lu}][\p{L}'-]+){0,3})$/u);
                const pref = text.match(/^(?:actually[,\s]+)?(?:i\s+(?:now\s+)?(?:prefer|like|love|dislike|hate)|(?:please\s+)?(?:switch|change)\s+me\s+to)\s+(.+)$/i);
                const role = text.match(/^i(?:\s+am|['\u2019]m)\s+((?:a\s+|an\s+|the\s+)?(?:[\p{L}-]+\s+){0,4}(?:lead|engineer|developer|designer|manager|researcher|teacher|doctor|nurse|student|director)\b.*)$/iu);
                const place = text.match(/^i\s+(?:live|work|am)\s+(?:in|at)\s+(.+)$/i);
                const relation = contact ? 'contact_via' : name ? 'name' : pref ? 'prefers' : role ? 'role' : place ? 'located_in' : '';
                const value = (contact ?? name ?? pref ?? role ?? place)?.[1] ?? text;
                const domain = pref ? /\b(mode|theme)\b/i.exec(value)?.[1]?.toLowerCase() : null;
                const key = relation ? `user:${relation}${pref ? `:${domain ?? norm(value)}` : ''}` : null;
                facts.push({ id: `m${source + 1}f${facts.length + 1}`, text, quote, source, subject: 'user', relation, value, key, structured: Boolean(relation), active: true });
            }
        }
    }
    return facts;
}

function deduplicate(records: fact[]): fact[] {
    const last = new Map(records.map(record => [norm(record.text), record.id]));
    return records.filter(record => last.get(norm(record.text)) === record.id);
}

function latest(records: fact[]): fact[] {
    const current = new Map<string, fact>();
    return records.map(record => {
        if (record.key) current.set(record.key, record);
        return { ...record };
    }).map(record => ({ ...record, active: !record.key || current.get(record.key)?.id === record.id }));
}

export function parse_messages(messages: Array<{ role: string; content?: string | null }>): string {
    return messages.filter(message => message.content != null && ['system', 'user', 'assistant'].includes(message.role))
        .map(message => `${message.role}: ${message.content}\n`).join('');
}

export function normalize_facts(values: unknown[]): string[] {
    return values.flatMap(value => {
        if (typeof value === 'string') return value ? [value] : [];
        if (value && typeof value === 'object') {
            const record = value as Record<string, unknown>;
            const text = record.fact || record.text;
            return typeof text === 'string' && text ? [text] : [];
        }
        return value == null ? [] : [String(value)];
    });
}

export function unique_nodes<node extends { id: string }>(nodes: node[]): node[] {
    const seen = new Set<string>();
    return nodes.filter(node => {
        if (seen.has(node.id)) return false;
        seen.add(node.id);
        return true;
    });
}

function longmemory(messages: message[], reference: fact[]): pipeline {
    const extracted = messages.flatMap((message, source) => extract_claims(message.text).map((value, index) => ({ value, source, id: `node-${source + 1}-claim-${index + 1}` })));
    const records = extracted.map(({ value, source, id }, order): fact => {
        const match = reference.find(fact => fact.source === source && (norm(fact.text) === norm(value.statement) || norm(value.statement).includes(norm(fact.text))));
        const superseded = extracted.slice(order + 1).some(other => value.kind === 'preference' && claims_conflict(value, other.value));
        return {
            id, text: value.statement.trim() || render_claim(value), quote: value.statement, source, subject: value.subject, relation: value.predicate, value: value.object,
            key: match?.key ?? null, structured: value.kind === 'fact' || value.kind === 'preference', active: !superseded
        };
    });
    return {
        id: 'longmemory', name: 'LongMemory', logo: 'Longmemory', basis: 'Actual claim extractor + local write model',
        source: 'https://github.com/CaviraOSS/LongMemory', records,
        context: records.filter(record => record.active).map(record => `[m${record.source + 1}] ${record.text}`).join('\n'),
        stored: messages.map((message, source) => ({ raw: message.text, observed_at: message.at, claims: extracted.filter(item => item.source === source).map(item => item.value) })),
    };
}

function mem0(messages: message[], reference: fact[]): pipeline {
    const records = deduplicate(reference).map(record => ({ ...record, structured: false }));
    const memories = normalize_facts(records.map(record => ({ fact: record.text })));
    return {
        id: 'mem0', name: 'Mem0', logo: 'mem0', basis: 'Utility ports + additive-extraction model',
        source: 'https://github.com/mem0ai/mem0/blob/main/mem0/memory/utils.py', records,
        context: memories.map((text, index) => `[m${records[index].source + 1}] ${text}`).join('\n'),
        stored: { input: parse_messages(messages.map(message => ({ role: 'user', content: message.text }))), memory: records.map(record => ({ id: record.id, text: record.text, event: 'ADD', linked_memory_ids: records.filter(prior => prior.key && prior.key === record.key && prior.source < record.source).map(prior => prior.id) })) },
    };
}

function graphiti(reference: fact[], messages: message[]): pipeline {
    const records = latest(deduplicate(reference)).filter(record => record.structured && norm(record.subject) !== norm(record.value));
    const edges = records.map((record, index) => {
        const replacement = records.slice(index + 1).find(other => other.key === record.key);
        return {
            source_entity_name: record.subject, target_entity_name: record.value, relation_type: record.relation.toUpperCase(), fact: record.text,
            valid_at: new Date(messages[record.source].at).toISOString(), invalid_at: replacement ? new Date(messages[replacement.source].at).toISOString() : null
        };
    });
    return {
        id: 'graphiti', name: 'Zep / Graphiti', logo: 'zep', basis: 'Edge-schema port + temporal-graph model',
        source: 'https://github.com/getzep/graphiti/blob/main/graphiti_core/prompts/extract_edges.py', records,
        context: records.filter(record => record.active).map(record => `[m${record.source + 1}] ${record.subject} --${record.relation}--> ${record.value}`).join('\n'), stored: { edges }
    };
}

function cognee(messages: message[], reference: fact[]): pipeline {
    const nodes = unique_nodes(reference.map(record => ({ id: norm(record.value), label: record.value })));
    const chunks = messages.flatMap((message, source) => {
        const sentences: string[] = nlp(message.text).sentences().out('array');
        const groups: string[] = [];
        for (const sentence of sentences) {
            const previous = groups.at(-1);
            if (previous && tokens(`${previous} ${sentence}`) <= 256) groups[groups.length - 1] += ` ${sentence}`;
            else groups.push(sentence);
        }
        return groups.map((text, index) => ({ id: `m${source + 1}-chunk-${index + 1}`, source, text }));
    });
    const records = reference.map(record => ({ ...record, structured: false }));
    return {
        id: 'cognee', name: 'Cognee', logo: 'cognee', basis: 'Node-dedup port + chunk-graph model',
        source: 'https://github.com/topoteretes/cognee/blob/main/cognee/tasks/graph/extract_graph_from_data.py', records,
        context: chunks.map(chunk => `[m${chunk.source + 1}] ${chunk.text}`).join('\n'), stored: { chunks, nodes, edges: reference.filter(record => record.structured).map(record => ({ source: `m${record.source + 1}`, relationship: record.relation, target: norm(record.value) })) }
    };
}

function supermemory(messages: message[], reference: fact[]): pipeline {
    const records = latest(deduplicate(reference)).map(record => ({ ...record, structured: false }));
    const profile = records.filter(record => record.active);
    return {
        id: 'supermemory', name: 'Supermemory', logo: 'supermemory', basis: 'Documentation model; engine source is private',
        source: 'https://supermemory.ai/docs/self-hosting/overview', records,
        context: profile.map(record => `[m${record.source + 1}] ${record.text}`).join('\n'),
        stored: { chunks: messages.map((message, source) => ({ id: `m${source + 1}`, content: message.text })), profile: profile.map(record => ({ text: record.text, source: record.source + 1 })) }
    };
}

export function evaluate(messages: message[], records: fact[], context: string, reference = analyze(messages)) {
    const current = latest(deduplicate(reference)).filter(record => record.active);
    const active = records.filter(record => record.active);
    const context_words = words(context.replace(/\[m\d+\]/g, ''));
    const coverage = mean(current.map(record => {
        const required = words(record.key ? record.value : record.text);
        const value_coverage = mean([...required].map(word => Number(context_words.has(word))));
        const excluded = record.text.match(/\b(?:instead of|rather than)\s+(.+)$/i)?.[1];
        if (!excluded) return value_coverage;
        const exclusion_words = words(excluded);
        const positive = norm(record.value);
        const negative = norm(excluded);
        const controls = '(?:(?:use|using|contact|me|via|on|by|ping|message|choose|prefer)\\s+){0,5}';
        const negation = '(?:not|never|avoid|no|don t)\\s+';
        const positive_negated = new RegExp(`\\b${negation}${controls}${positive}\\b`);
        const negative_negated = new RegExp(`\\b${negation}${controls}${negative}\\b`);
        const directional = new RegExp(`\\b${positive}\\s+(?:instead of|rather than)\\s+${negative}\\b`);
        const restricted = context.split('\n').some(line => {
            const line_words = words(line);
            const normalized = norm(line);
            return [...required].every(word => line_words.has(word))
                && [...exclusion_words].every(word => line_words.has(word))
                && !positive_negated.test(normalized)
                && (directional.test(normalized) || negative_negated.test(normalized));
        });
        return mean([value_coverage, Number(restricted)]);
    }));
    const grounding = mean(active.map(record => {
        const supported = words(record.quote);
        return Number(Boolean(messages[record.source]?.text.includes(record.quote)) && [...words(record.value)].every(word => supported.has(word)));
    }));
    const comparisons = active.filter(record => record.key && current.some(expected => expected.key === record.key));
    const freshness = comparisons.length ? mean(comparisons.map(record => Number(current.some(expected => expected.key === record.key && norm(expected.value) === norm(record.value))))) : null;
    const structure = mean(active.map(record => Number(record.structured && Boolean(record.subject) && Boolean(record.relation) && Boolean(record.value))));
    const uniqueness = active.length ? new Set(active.map(record => norm(record.text))).size / active.length : 0;
    const metrics = { coverage: round(coverage), grounding: round(grounding), freshness: freshness === null ? null : round(freshness), structure: round(structure), uniqueness: round(uniqueness) };
    const included = Object.entries(weights).filter(([key]) => metrics[key as keyof typeof metrics] !== null);
    const readiness = current.length ? Math.round(included.reduce((total, [key, weight]) => total + (metrics[key as keyof typeof metrics] ?? 0) * weight, 0) / included.reduce((total, [, weight]) => total + weight, 0)) : null;
    const context_tokens = tokens(context);
    const input_tokens = tokens(messages.map(message => message.text).join('\n'));
    const efficiency = context_tokens ? Math.min(1, tokens(current.map(record => record.text).join('\n')) / context_tokens) * coverage : 0;
    return {
        metrics, readiness, context_tokens, input_tokens, efficiency: round(efficiency),
        score: readiness === null ? null : Math.round(readiness * 0.8 + round(efficiency) * 0.2),
        cost_per_thousand: context_tokens / 1000,
        active_records: active.length, historical_records: records.length - active.length
    };
}

export function compare(messages: message[]) {
    if (!messages.length || messages.length > 20 || messages.some(message => !message.text.trim() || !Number.isFinite(message.at)) || messages.reduce((size, message) => size + message.text.length, 0) > 12000) throw new Error('Use up to 20 messages and 12,000 characters per conversation.');
    const reference = analyze(messages);
    const builders = [() => cognee(messages, reference), () => longmemory(messages, reference), () => mem0(messages, reference), () => supermemory(messages, reference), () => graphiti(reference, messages)];
    return builders.map(build => {
        const started = performance.now();
        const result = build();
        return { ...result, ...evaluate(messages, result.records, result.context, reference), stored_tokens: tokens(JSON.stringify(result.stored)), local_ms: Math.round((performance.now() - started) * 10) / 10 };
    }).sort((left, right) => (right.score ?? -1) - (left.score ?? -1) || left.name.localeCompare(right.name));
}