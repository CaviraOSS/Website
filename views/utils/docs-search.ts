import { stemmer } from 'stemmer';

type section = { heading?: string; paragraphs?: Array<string | { data?: string }>; subitems?: section[] };
type group = { label: string; items: Array<{ text: string; file?: string; data?: section[] }> };
export type docs_hit = { id: string; pid: string; anchor: string | null; group: string; title: string; heading: string; text: string; excerpt: string; score: number };
type document = { frequencies: ReadonlyMap<string, number>; length: number };

const stopwords = new Set(['a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'can', 'could', 'did', 'do', 'does', 'for', 'from', 'had', 'has', 'have', 'how', 'i', 'in', 'is', 'it', 'me', 'my', 'of', 'on', 'or', 'should', 'that', 'the', 'to', 'was', 'were', 'what', 'when', 'where', 'which', 'who', 'why', 'will', 'with', 'would', 'you', 'your']);
const doubled_consonant = /([bdfgmnprt])\1$/;
const length_prior_saturation = 8;

function undouble(stem: string): string {
    return doubled_consonant.test(stem) ? stem.slice(0, -1) : stem;
}

export function normalize_recall_token(value: string): string {
    if (!/^[a-z]+$/.test(value) || value.length <= 3 || stopwords.has(value)) return value;
    if (value.endsWith('ies')) return `${value.slice(0, -3)}y`;
    if (value.length > 5 && value.endsWith('ing')) return undouble(value.slice(0, -3));
    if (value.length > 4 && value.endsWith('ed')) return undouble(value.slice(0, -2));
    if (value.length > 4 && value.endsWith('ly')) return value.slice(0, -2);
    if (value.endsWith('s') && !/(?:ss|us|is)$/.test(value)) return normalize_recall_token(value.slice(0, -1));
    if (value.endsWith('e') && stemmer(`${value}d`) === stemmer(value)) return value.slice(0, -1);
    return value;
}

const recall_tokens = (text: string): string[] => (text.normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}_]+/gu) ?? [])
    .map(normalize_recall_token).filter(token => !stopwords.has(token));

export function bm25_weighted(query_weights: ReadonlyMap<string, number>, docs: readonly document[], k1 = 1.5, b = 0.75): Float64Array {
    const scores = new Float64Array(docs.length);
    if (docs.length === 0 || query_weights.size === 0) return scores;
    const query_terms = [...query_weights.keys()];
    const frequencies = new Map(query_terms.map(term => [term, 0]));
    let total_length = 0;
    for (const doc of docs) {
        total_length += doc.length;
        for (const term of query_terms) if (doc.frequencies.has(term)) frequencies.set(term, (frequencies.get(term) ?? 0) + 1);
    }
    const average_length = total_length / docs.length || 1;
    const document_count = docs.length;
    let maximum = 0;
    for (let index = 0; index < docs.length; index++) {
        const doc = docs[index];
        let score = 0;
        for (const term of query_terms) {
            const document_frequency = frequencies.get(term) ?? 0;
            if (document_frequency === 0) continue;
            const inverse_frequency = Math.log(1 + (document_count - document_frequency + 0.5) / (document_frequency + 0.5));
            const frequency = doc.frequencies.get(term) ?? 0;
            if (frequency === 0) continue;
            score += (query_weights.get(term) ?? 0) * inverse_frequency * ((frequency * (k1 + 1)) / (frequency + k1 * (1 - b + b * (doc.length / average_length))));
        }
        scores[index] = score * (doc.length / (doc.length + length_prior_saturation));
        if (scores[index] > maximum) maximum = scores[index];
    }
    if (maximum > 0) for (let index = 0; index < scores.length; index++) scores[index] /= maximum;
    return scores;
}

function passage(text: string, terms: ReadonlySet<string>): string {
    const flattened = text.replace(/\s+/g, ' ').trim();
    const match = [...flattened.matchAll(/[\p{L}\p{N}_]+/gu)].find(word => terms.has(normalize_recall_token(word[0].toLowerCase())));
    const start = Math.max(0, (match?.index ?? 0) - 48);
    const end = Math.min(flattened.length, start + 174);
    return `${start ? '...' : ''}${flattened.slice(start, end)}${end < flattened.length ? '...' : ''}`;
}

export function create_docs_search(groups: group[]) {
    const entries: Omit<docs_hit, 'score' | 'excerpt'>[] = [];
    for (const [group_index, group] of groups.entries()) {
        for (const [item_index, item] of group.items.entries()) {
            const pid = `${group_index}.${item_index}`;
            const add = (heading: string, paragraphs: section['paragraphs'], anchor: string | null) => {
                const text = (paragraphs ?? []).map(block => typeof block === 'string' ? block : block.data ?? '').join('\n');
                entries.push({ id: `${pid}:${anchor ?? 'page'}`, pid, anchor, group: group.label, title: item.text, heading, text });
            };
            if (!item.data?.length) add(item.text, [], null);
            for (const [section_index, section] of (item.data ?? []).entries()) {
                add(section.heading ?? item.text, section.paragraphs, `section-${section_index}`);
                for (const [sub_index, subitem] of (section.subitems ?? []).entries()) {
                    add(subitem.heading ?? section.heading ?? item.text, subitem.paragraphs, `section-${section_index}-${sub_index}`);
                }
            }
        }
    }
    const docs = entries.map(entry => {
        const terms = recall_tokens(`${entry.group} ${entry.title} ${entry.heading} ${entry.heading} ${entry.text}`);
        const frequencies = new Map<string, number>();
        for (const term of terms) frequencies.set(term, (frequencies.get(term) ?? 0) + 1);
        return { frequencies, length: terms.length };
    });
    return {
        size: entries.length,
        recall(query: string, limit = 12): docs_hit[] {
            const bounded_limit = Number.isFinite(limit) ? Math.max(0, Math.min(30, Math.floor(limit))) : 12;
            if (bounded_limit === 0) return [];
            const text = query.trim().slice(0, 300);
            const terms = recall_tokens(text);
            if (!text) return entries.slice(0, bounded_limit).map(entry => ({ ...entry, score: 0, excerpt: passage(entry.text, new Set()) }));
            if (!terms.length) return [];
            const query_weights = new Map<string, number>();
            for (const term of terms) query_weights.set(term, (query_weights.get(term) ?? 0) + 1);
            const scores = bm25_weighted(query_weights, docs);
            return entries.map((entry, index) => ({ ...entry, score: scores[index], excerpt: passage(entry.text, new Set(terms)), order: index }))
                .filter(entry => entry.score > 0)
                .sort((left, right) => right.score - left.score || left.order - right.order)
                .slice(0, bounded_limit);
        },
    };
}