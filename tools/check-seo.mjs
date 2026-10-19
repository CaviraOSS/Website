import assert from 'node:assert/strict';
import { fileURLToPath as path } from 'node:url';
import { createServer as create_server } from 'vite';

const server = await create_server({ root: path(new URL('../', import.meta.url)), configFile: false, server: { middlewareMode: true }, appType: 'custom' });
try {
    const { site, groups, guides, docs_href, canonical, page_meta, structured_data, serialize_schema, guide_markdown, docs_markdown, llms_index, llms_full, sitemap } = await server.ssrLoadModule('/views/utils/site.ts');
    assert.equal(site.origin, 'https://cavira.app');
    assert.ok(guides.length > 25);
    assert.equal(new Set(guides.map(guide => guide.path)).size, guides.length);
    assert.equal(docs_href('0.2', 'section-0-1'), `${site.docs}/installation#section-0-1`);
    assert.equal(docs_href('0.0'), site.docs);
    assert.equal(canonical(`${site.docs}/installation?tracking=x#heading`), `${site.origin}${site.docs}/installation`);
    for (const guide of guides) {
        const meta = page_meta(guide.path);
        assert.ok(meta.title.includes('LongMemory'));
        assert.ok(meta.description.length > 20);
        assert.equal(meta.path, guide.path);
        const schema = structured_data(meta);
        assert.equal(schema['@context'], 'https://schema.org');
        assert.ok(schema['@graph'].some(node => node.url === canonical(meta.path)));
        assert.equal(JSON.parse(serialize_schema(schema))['@graph'].length, schema['@graph'].length);
        assert.ok(sitemap().includes(canonical(guide.path)));
        if (!guide.item.file) {
            const markdown = guide_markdown(guide);
            assert.ok(markdown.includes(`# ${guide.title}`));
            assert.ok(llms_index().includes(canonical(`${guide.path}.md`)));
            assert.ok(llms_full().includes(markdown));
        }
    }
    assert.equal(serialize_schema({ title: '</script>' }).includes('<'), false);
    assert.ok(docs_markdown().includes('installation.md'));
    const install = guides.find(guide => guide.slug === 'installation');
    assert.ok(guide_markdown(install).includes('npm install longmemory'));
    assert.ok(guide_markdown(install).includes('### JavaScript / TypeScript'));
    assert.equal(groups.reduce((size, group) => size + group.items.length, 0), guides.length);
    console.log(`PASS: metadata, safe structured data, ${guides.length} canonical docs pages, sitemap, and complete Markdown/agent references.`);
} finally { await server.close(); }