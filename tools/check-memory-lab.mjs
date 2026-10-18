import assert from 'node:assert/strict';
import { readFileSync as read, existsSync as exists } from 'node:fs';
import { fileURLToPath as path } from 'node:url';
import { createServer as create_server } from 'vite';

const root = path(new URL('../', import.meta.url));
const server = await create_server({ root, configFile: false, server: { middlewareMode: true }, appType: 'custom' });
try {
    const { compare, analyze, evaluate, parse_messages, normalize_facts, unique_nodes } = await server.ssrLoadModule('/views/utils/memory-lab.ts');
    const original_fetch = globalThis.fetch;
    globalThis.fetch = () => { throw new Error('Comparison attempted a network call.'); };
    try {
        const input = [{ text: "Hi, I'm Priya. I'm the backend lead on the payments team, please ping me on Slack instead of email.", at: 1700000000000 }];
        assert.equal(analyze(input).find(fact => fact.relation === 'name')?.value, 'Priya');
        const results = compare(input);
        const longmemory = results.find(result => result.id === 'longmemory');
        assert.ok(longmemory.context.includes('Slack instead of email'));
        assert.equal(longmemory.metrics.coverage, 100);
        const equivalent = [{ ...analyze([{ text: 'My name is Priya.', at: 1700000000000 }])[0], text: 'user name priya', structured: true }];
        const named = [{ text: 'My name is Priya.', at: 1700000000000 }];
        assert.equal(evaluate(named, equivalent, '[m1] user name priya').metrics.coverage, 100);
        const contact = [{ text: 'Please contact me via Slack instead of email.', at: 1700000000000 }];
        const contact_records = analyze(contact);
        assert.ok(evaluate(contact, contact_records, '[m1] user contact_via Slack').metrics.coverage < 100);
        assert.equal(evaluate(contact, contact_records, '[m1] contact via Slack, not email').metrics.coverage, 100);
        for (const reversed of ['Contact via Slack and email, not SMS.', 'Contact via email rather than Slack.', 'Do not contact me via Slack; use email instead.', 'Do not use Slack instead of email.']) {
            assert.ok(evaluate(contact, contact_records, reversed).metrics.coverage < 100, reversed);
        }
        assert.equal(evaluate(named, equivalent.map(record => ({ ...record, id: 'different-provider' })), '[m1] user name priya').score,
            evaluate(named, equivalent, '[m1] user name priya').score);
        assert.equal(results.length, 5);
        assert.equal(new Set(results.map(result => result.id)).size, 5);
        for (const result of results) {
            assert.ok(Number.isFinite(result.context_tokens));
            assert.ok(result.score >= 0 && result.score <= 100);
            assert.ok(result.metrics.coverage >= 0 && result.metrics.coverage <= 100);
            assert.equal(result.cost_per_thousand, result.context_tokens / 1000);
            assert.ok(result.basis);
            const evaluated = evaluate(input, result.records, result.context);
            assert.equal(evaluated.score, result.score);
        }
        const plugin = compare([{ text: 'I built an experimental plugin for my editor.', at: 1700000000000 }]);
        const greeting = compare([{ text: 'Hello. I built an experimental plugin for my editor.', at: 1700000000000 }]);
        const greeting_longmemory = greeting.find(result => result.id === 'longmemory');
        assert.ok(greeting.some(result => result.score > greeting_longmemory.score));
        assert.notDeepEqual(results.map(result => [result.id, result.score]), plugin.map(result => [result.id, result.score]));
        const graph = plugin.find(result => result.id === 'graphiti');
        assert.equal(graph.score, 0);
        assert.equal(graph.context_tokens, 0);
        assert.ok(compare([{ text: 'Hello.', at: 1700000000000 }]).every(result => result.score === null));
        const updates = ['I prefer dark mode.', 'I now prefer light mode.', 'I prefer dark mode.'].map((text, index) => ({ text, at: 1700000000000 + index }));
        const reverted = compare(updates).find(result => result.id === 'graphiti');
        assert.ok(reverted.context.includes('dark mode'));
        assert.equal(reverted.context.includes('light mode'), false);
        const same_message = compare([{ text: 'I prefer dark mode. I now prefer light mode.', at: 1700000000000 }]).find(result => result.id === 'longmemory');
        assert.equal(same_message.context.includes('dark mode'), false);
        assert.equal(same_message.metrics.freshness, 100);
        const locations = compare(['I am in Paris.', 'I am in London.', 'I am in Rome.'].map((text, index) => ({ text, at: 1700000000000 + index * 1000 })));
        const edges = locations.find(result => result.id === 'graphiti').stored.edges;
        assert.equal(edges[0].invalid_at, edges[1].valid_at);
        assert.equal(edges[1].invalid_at, edges[2].valid_at);
        const facts = analyze(input);
        const forged = [{ ...facts[0], value: 'unmentioned alien spacecraft', text: 'unmentioned alien spacecraft' }];
        assert.equal(evaluate(input, forged, forged[0].text).metrics.grounding, 0);
        assert.throws(() => compare([]));
        assert.throws(() => compare([{ text: 'x'.repeat(12001), at: 0 }]));
        assert.equal(parse_messages([{ role: 'user', content: 'hi' }, { role: 'assistant', content: null }]), 'user: hi\n');
        assert.deepEqual(normalize_facts(['one', { fact: 'two' }, { text: 'three' }, {}]), ['one', 'two', 'three']);
        assert.deepEqual(unique_nodes([{ id: 'a', text: 'first' }, { id: 'a', text: 'later' }]), [{ id: 'a', text: 'first' }]);
    } finally { globalThis.fetch = original_fetch; }
    const { default: icons } = await server.ssrLoadModule('/views/icons/index.js');
    const cognee_logo = icons.get('cognee');
    assert.match(cognee_logo, /<rect\b[^>]*\bwidth="[^"]+"/);
    assert.match(cognee_logo, /<rect\b[^>]*\bheight="[^"]+"/);
    assert.doesNotMatch(cognee_logo.match(/<svg\b[^>]*>/)[0], /\s(?:width|height)=/);
    const page = read(new URL('../views/pages/projects/longmemory/+page.svelte', import.meta.url), 'utf8');
    assert.equal(page.match(/<textarea\b/g)?.length, 1);
    assert.equal(page.includes('/api/memory-compare'), false);
    assert.equal(page.includes('VITE_MEMORY_COMPARE_URL'), false);
    assert.equal(exists(new URL('../server/compare.ts', import.meta.url)), false);
    const original = new URL('../../../src/core/engine/claim_extractor.ts', import.meta.url);
    if (exists(original)) {
        const source = read(original, 'utf8').replaceAll('\r\n', '\n');
        const vendored = read(new URL('../views/utils/longmemory-claims.ts', import.meta.url), 'utf8').replaceAll('\r\n', '\n');
        assert.equal(vendored.trim(), source.slice(source.indexOf('export type ClaimKind')).trim());
    }
    console.log('PASS: five offline paths, source fidelity, prompt-sensitive neutral scoring, provenance, updates, tokenizer costs, limits, one chatbox, and no server route.');
} finally { await server.close(); }