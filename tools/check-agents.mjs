import assert from 'node:assert/strict';
import { existsSync as exists, readFileSync as read } from 'node:fs';
import { fileURLToPath as path } from 'node:url';
import { createServer as create_server } from 'vite';

const root = new URL('../', import.meta.url);
assert.ok(exists(new URL('views/pages/.well-known/api-catalog/+server.ts', root)), 'The public API catalog route must exist.');
const server = await create_server({
    root: path(root), configFile: false, resolve: { alias: { $lib: path(new URL('views', root)) } },
    server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom',
});
try {
    const catalog = await server.ssrLoadModule('/views/pages/.well-known/api-catalog/+server.ts');
    const response = catalog.GET();
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /^application\/linkset\+json\b/);
    const { linkset } = await response.json();
    assert.equal(linkset.length, 1);
    assert.equal(linkset[0].anchor, 'https://cavira.app/projects/longmemory/docs');
    assert.equal(linkset[0]['service-desc'][0].href, 'https://cavira.app/openapi.json');
    assert.equal(linkset[0]['service-doc'][0].href, 'https://cavira.app/projects/longmemory/docs');
    assert.equal(linkset[0].status, undefined, 'Do not advertise a nonexistent health endpoint.');

    const schema = await server.ssrLoadModule('/views/pages/openapi.json/+server.ts');
    const spec = await schema.GET().json();
    assert.equal(spec.openapi, '3.1.0');
    assert.equal(spec.servers[0].url, 'https://cavira.app');
    assert.ok(spec.paths['/projects/longmemory/docs.md'].get.responses['200'].content['text/markdown']);
    const slug = spec.paths['/projects/longmemory/docs/{slug}.md'].get.parameters[0];
    assert.equal(slug.required, true);
    assert.ok(slug.schema.enum.includes('installation'));
    for (const endpoint of Object.values(spec.paths)) assert.deepEqual(Object.keys(endpoint), ['get']);

    const { prefers_markdown } = await server.ssrLoadModule('/server/worker.ts');
    for (const [accept, expected] of [
        [null, false], ['*/*', false], ['text/html', false], ['text/markdown', true],
        ['text/markdown; charset=utf-8', true], ['TEXT/MARKDOWN', true],
        ['text/html, text/markdown', true], ['text/html;q=1, text/markdown;q=0.5', false],
        ['text/markdown;q=0', false], ['text/markdown;q=0, */*;q=1', false],
        ['text/*;q=1, text/html;q=0.5, text/markdown;q=0.8', true],
        ['text/markdown;q=bogus', false], ['text/markdown;q=1.5', false],
        ['text/markdown;q=0.5, */*;q=1', false],
    ]) assert.equal(prefers_markdown(accept), expected, `Accept: ${accept}`);

    const { markdown } = await import('./build-agent-markdown.mjs');
    const text = markdown('<html><body><h1>Hello agents</h1><p>Keep <strong>these words</strong>.</p><a href="/docs">Docs</a><pre><code class="language-js">const x = 1;</code></pre><script>secret_layout()</script><style>.layout{}</style><svg><text>decoration</text></svg></body></html>');
    assert.match(text, /# Hello agents/);
    assert.match(text, /Keep \*\*these words\*\*\./);
    assert.match(text, /\[Docs\]\(https:\/\/cavira.app\/docs\)/);
    assert.match(text, /```js\nconst x = 1;\n```/);
    assert.doesNotMatch(text, /secret_layout|decoration|\.layout/);
    const layout = markdown('<html><head><title>Page metadata</title></head><body><aside>Navigation clutter</aside><div class="pointer-events-none"><h1>Loading animation</h1></div><p class="flex flex-wrap"><span>We are</span><span>building tools.</span></p><a href="/docs" class="grid"><span>2026</span><span>Docs</span></a><a class="grid"><span>2025</span><span>Other</span></a><a href="/"><span>Home</span><span class="absolute">Home</span></a></body></html>');
    assert.match(layout, /We are building tools\./);
    assert.match(layout, /\[2026 Docs\]\(https:\/\/cavira.app\/docs\)\n\n2025 Other/);
    assert.match(layout, /\[Home\]/);
    assert.doesNotMatch(layout, /Navigation clutter|Page metadata|Loading animation|HomeHome/);
    console.log('PASS: catalog, real documentation OpenAPI, Accept quality preferences, and Markdown conversion.');
} finally { await server.close(); }

const base = process.argv[2];
if (base) {
    const get = (route, accept, method = 'GET', headers = {}) => fetch(new URL(route, base), {
        method, redirect: 'manual', headers: { ...(accept ? { Accept: accept } : {}), ...headers },
    });
    const catalog = await get('/.well-known/api-catalog');
    assert.equal(catalog.status, 200);
    assert.match(catalog.headers.get('content-type'), /^application\/linkset\+json\b/);
    for (const entry of (await catalog.json()).linkset) {
        for (const rel of ['service-desc', 'service-doc']) {
            const response = await get(new URL(entry[rel][0].href).pathname);
            assert.equal(response.status, 200);
        }
    }
    for (const route of ['/', '/projects/longmemory', '/projects/longmemory/docs', '/projects/longmemory/docs/installation']) {
        const html = await get(route, 'text/html');
        assert.equal(html.status, 200);
        assert.match(html.headers.get('content-type'), /^text\/html\b/);
        assert.match(html.headers.get('vary'), /(?:^|,\s*)Accept(?:,|$)/i);
        const etag = html.headers.get('etag');
        if (etag) {
            const cached = await get(route, 'text/html', 'GET', { 'If-None-Match': etag });
            assert.equal(cached.status, 304);
            assert.match(cached.headers.get('vary'), /Accept/i, 'Conditional HTML responses must preserve cache negotiation.');
        }
        const body = await html.text();
        if (route === '/') {
            assert.equal(body, read(new URL('build/index.html', root), 'utf8'), 'Browser HTML must remain byte-for-byte unchanged.');
            for (const rel of ['api-catalog', 'service-desc', 'service-doc', 'describedby']) {
                assert.ok(html.headers.get('link')?.includes(`rel="${rel}"`), `Missing Link relation: ${rel}`);
            }
        }
        const md = await get(route, 'text/markdown');
        assert.equal(md.status, 200);
        assert.match(md.headers.get('content-type'), /^text\/markdown\b/);
        assert.match(md.headers.get('vary'), /Accept/i);
        const text = await md.text();
        assert.ok(text.length > 100);
        assert.doesNotMatch(text, /<script|<!doctype|<style|<svg/i);
        if (route === '/') {
            assert.match(text, /Building tools to push humanity toward the next/);
            assert.match(text, /We’re devoted to building open, reliable tools/);
        }
        if (route.endsWith('installation')) assert.match(text, /npm install longmemory/);
        const head = await get(route, 'text/markdown', 'HEAD');
        assert.equal(head.status, 200);
        assert.equal(head.headers.get('content-type'), md.headers.get('content-type'));
        assert.equal(await head.text(), '');
        const conditional = await get(route, 'text/markdown', 'GET', { 'If-None-Match': html.headers.get('etag') ?? '"html"' });
        assert.equal(conditional.status, 200, 'An HTML validator must not suppress the Markdown representation.');
        const preferred = await get(route, 'text/html;q=1, text/markdown;q=0.1');
        assert.match(preferred.headers.get('content-type'), /^text\/html\b/);
    }
    for (const route of ['/not-a-page', '/projects/longmemory/docs/not-a-guide']) {
        assert.equal((await get(route, 'text/markdown')).status, 404);
    }
    const spec = await get('/openapi.json', 'text/markdown');
    assert.match(spec.headers.get('content-type'), /^application\/json\b/);
    const document = await spec.json();
    for (const [route, endpoint] of Object.entries(document.paths)) {
        const slugs = endpoint.get.parameters?.find(parameter => parameter.name === 'slug')?.schema.enum;
        for (const path of slugs ? slugs.map(slug => route.replace('{slug}', slug)) : [route]) {
            const response = await get(path);
            assert.equal(response.status, 200, `Advertised endpoint must exist: ${path}`);
            const types = Object.keys(endpoint.get.responses['200'].content);
            assert.ok(types.some(type => response.headers.get('content-type')?.startsWith(type)));
        }
        if (slugs) {
            for (const slug of slugs) {
                const response = await get(`/projects/longmemory/docs/${slug}`, 'text/markdown');
                assert.equal(response.status, 200, `Negotiated guide must exist: ${slug}`);
                assert.match(response.headers.get('content-type'), /^text\/markdown\b/);
                assert.ok((await response.text()).length > 100);
            }
        }
    }
    const asset = await get('/assets/logo.png', 'text/markdown');
    assert.match(asset.headers.get('content-type'), /^image\/png\b/);
    const redirect = await get('/index.html', 'text/markdown');
    assert.ok([301, 307, 308].includes(redirect.status));
    console.log('PASS: deployed asset routing, Link headers, unchanged HTML, Markdown/HEAD/cache negotiation, redirects, assets, and 404s.');
}
