import catalog from '../../static/test.json';

type section = { heading?: string; paragraphs?: Array<string | { data?: string; lang?: string }>; subitems?: section[] };
type group = { label: string; items: Array<{ text: string; file?: string; data?: section[] }> };
export type metadata = { title: string; description: string; path: string; article?: boolean; markdown?: string };

export const site = {
    origin: 'https://cavira.app',
    name: 'Cavira',
    repository: 'https://github.com/CaviraOSS/LongMemory',
    product: '/projects/longmemory',
    docs: '/projects/longmemory/docs',
    description: 'Cavira builds open-source tools for intelligent systems. Explore LongMemory, documentation, and projects from Cavira OSS and Cavira Labs.',
    product_description: 'LongMemory is an open-source, self-hosted memory engine for AI agents, with temporal recall, immutable records, governance, and SQLite persistence.',
};

export const groups = catalog as group[];
const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const description = (text: string) => {
    const clean = text.replace(/\s+/g, ' ').trim();
    return clean.length <= 158 ? clean : clean.slice(0, 158).replace(/\s+\S*$/, '');
};

export const guides = groups.flatMap((group, group_index) => group.items.map((item, item_index) => {
    const slug = slugify(item.text);
    const first = item.data?.flatMap(section => section.paragraphs ?? []).find(block => typeof block === 'string');
    const path = item.file ? site.docs : `${site.docs}/${slug}`;
    return {
        pid: `${group_index}.${item_index}`, slug, path, title: item.text, group: group.label, item,
        description: first ? description(first as string) : `${item.text}: ${site.product_description}`
    };
}));

export function guide_for_pid(pid: string) {
    return guides.find(guide => guide.pid === pid) ?? guides[0];
}

export function docs_href(pid: string, anchor: string | null = null): string {
    return `${guide_for_pid(pid).path}${anchor ? `#${encodeURIComponent(anchor)}` : ''}`;
}

export function canonical(path: string): string {
    return new URL(path.split(/[?#]/)[0].replace(/\/$/, '') || '/', site.origin).href;
}

export function page_meta(path: string): metadata {
    const clean = path.replace(/\/$/, '') || '/';
    const guide = guides.find(guide => guide.path === clean);
    if (guide) return {
        title: guide.item.file ? 'LongMemory Documentation | Cavira' : `${guide.title} | LongMemory Docs | Cavira`,
        description: guide.item.file ? 'LongMemory documentation covering installation, temporal recall, SQLite storage, governance, connectors, and AI agent integrations.' : guide.description, path: guide.path, article: !guide.item.file,
        markdown: guide.item.file ? `${site.docs}.md` : `${guide.path}.md`
    };
    if (clean === site.product) return { title: 'LongMemory | Memory Engine for AI Agents | Cavira', description: site.product_description, path: clean };
    return { title: 'Cavira | Open-Source Tools for Intelligent Systems', description: site.description, path: '/' };
}

export function structured_data(meta: metadata) {
    const url = canonical(meta.path);
    const organization = `${site.origin}/#organization`;
    const website = `${site.origin}/#website`;
    const software = `${canonical(site.product)}#software`;
    const graph: Record<string, unknown>[] = [
        {
            '@type': 'Organization', '@id': organization, name: site.name, url: site.origin,
            logo: `${site.origin}/assets/logo.png`, sameAs: ['https://github.com/CaviraOSS']
        },
        {
            '@type': 'WebSite', '@id': website, name: site.name, url: site.origin, description: site.description,
            publisher: { '@id': organization }, inLanguage: 'en'
        },
        {
            '@type': meta.article ? 'TechArticle' : meta.path === site.docs ? 'CollectionPage' : 'WebPage',
            '@id': `${url}#page`, url, name: meta.title, headline: meta.title, description: meta.description,
            isPartOf: { '@id': website }, publisher: { '@id': organization }, inLanguage: 'en',
            ...(meta.path.startsWith(site.product) ? { about: { '@id': software } } : {})
        },
    ];
    if (meta.path.startsWith(site.product)) graph.push({
        '@type': 'SoftwareSourceCode', '@id': software,
        name: 'LongMemory', url: canonical(site.product), description: site.product_description,
        codeRepository: site.repository, programmingLanguage: 'TypeScript', runtimePlatform: 'Node.js',
        license: 'https://www.apache.org/licenses/LICENSE-2.0', author: { '@id': organization }
    });
    if (meta.path !== '/') {
        const breadcrumbs = [{ name: 'Cavira', url: site.origin }, { name: 'LongMemory', url: canonical(site.product) }];
        if (meta.path.startsWith(site.docs)) breadcrumbs.push({ name: 'Documentation', url: canonical(site.docs) });
        if (meta.article) breadcrumbs.push({ name: guides.find(guide => guide.path === meta.path)?.title ?? 'Guide', url });
        graph.push({
            '@type': 'BreadcrumbList', itemListElement: breadcrumbs.map((item, index) => ({
                '@type': 'ListItem', position: index + 1, name: item.name, item: item.url,
            }))
        });
    }
    return { '@context': 'https://schema.org', '@graph': graph };
}

export function serialize_schema(value: unknown): string {
    return JSON.stringify(value).replace(/</g, '\\u003c');
}

function markdown_sections(sections: section[], depth = 2): string {
    return sections.map(section => {
        const blocks = (section.paragraphs ?? []).map(block => {
            if (typeof block === 'string') return block;
            const code = block.data ?? '';
            const runs = code.match(/`+/g) ?? [];
            const fence = '`'.repeat(Math.max(3, ...runs.map(run => run.length + 1)));
            return `${fence}${(block.lang ?? '').replace(/[^a-z0-9_+-]/gi, '')}\n${code}\n${fence}`;
        });
        return [`${'#'.repeat(Math.min(depth, 6))} ${section.heading ?? 'Details'}`, ...blocks,
        markdown_sections(section.subitems ?? [], depth + 1)].filter(Boolean).join('\n\n');
    }).join('\n\n');
}

export function guide_markdown(guide: typeof guides[number]): string {
    return `# ${guide.title}\n\nSource: ${canonical(guide.path)}\n\n${guide.description}\n\n${markdown_sections(guide.item.data ?? [])}\n\nRepository: ${site.repository}\n`;
}

export function docs_markdown(): string {
    return `# LongMemory Documentation\n\n${site.product_description}\n\n${guides.filter(guide => !guide.item.file).map(guide =>
        `- [${guide.title}](${canonical(`${guide.path}.md`)}): ${guide.description}`).join('\n')}\n\nHTML documentation: ${canonical(site.docs)}\n`;
}

export function llms_index(): string {
    return `# Cavira\n\n> Open-source tools for intelligent systems. LongMemory is Cavira's self-hosted memory engine for AI agents.\n\n## Primary Sources\n\n- [Cavira](${site.origin}/): Organization and project overview.\n- [LongMemory](${canonical(site.product)}): Product overview and installation entry point.\n- [Documentation index](${canonical(`${site.docs}.md`)}): Plain Markdown links to every guide.\n- [Complete reference](${site.origin}/llms-full.txt): All published guides in one text document.\n- [Source repository](${site.repository}): Implementation and Apache-2.0 license.\n\n## Documentation\n\n${guides.filter(guide => !guide.item.file).map(guide => `- [${guide.title}](${canonical(`${guide.path}.md`)}): ${guide.description}`).join('\n')}\n\n## Interpretation\n\nThe website's memory comparison is a browser-only architecture lab, not a live provider benchmark. Its scores are heuristics, not independent evidence of product superiority. Documentation search reuses local lexical recall; it is not a hosted model or full engine service. Confirm current capabilities and deployment requirements in the documentation and source repository.\n`;
}

export function llms_full(): string {
    return `# Cavira and LongMemory\n\n${site.description}\n\n${site.product_description}\n\nOfficial website: ${site.origin}\nSource repository: ${site.repository}\nLicense: Apache-2.0\n\n${guides.filter(guide => !guide.item.file).map(guide_markdown).join('\n---\n\n')}\n## Website Lab Limitations\n\nThe memory lab runs bounded local architecture models, not complete third-party engines. Scores are heuristic. No hosted provider output or independently measured superiority is implied.\n`;
}

export function sitemap(): string {
    const urls = ['/', site.product, ...guides.map(guide => guide.path)];
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...new Set(urls)].map(path => `<url><loc>${canonical(path).replace(/&/g, '&amp;').replace(/</g, '&lt;')}</loc></url>`).join('\n')}\n</urlset>\n`;
}