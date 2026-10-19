import { guides, site } from '$lib/utils/site';

export const prerender = true;

export function GET() {
    const text = (description: string, type: string) => ({
        description,
        content: { [type]: { schema: { type: 'string' } } },
    });
    return new Response(JSON.stringify({
        openapi: '3.1.0',
        info: {
            title: 'Cavira Public Documentation API',
            version: '1.0.0',
            description: 'Read-only access to published LongMemory documentation. This is not a hosted LongMemory memory, search, or inference API. LongMemory runs in your own deployment.',
        },
        servers: [{ url: site.origin }],
        externalDocs: { url: `${site.origin}${site.docs}` },
        paths: {
            '/llms.txt': {
                get: { operationId: 'agent_index', summary: 'Get the agent discovery index', responses: { '200': text('Links to published sources and guides.', 'text/plain') } },
            },
            '/llms-full.txt': {
                get: { operationId: 'complete_reference', summary: 'Get all published guides', responses: { '200': text('Complete documentation reference.', 'text/plain') } },
            },
            '/projects/longmemory/docs.md': {
                get: { operationId: 'documentation_index', summary: 'Get the Markdown documentation index', responses: { '200': text('Links to individual Markdown guides.', 'text/markdown') } },
            },
            '/projects/longmemory/docs/{slug}.md': {
                get: {
                    operationId: 'documentation_guide', summary: 'Get a Markdown guide',
                    parameters: [{
                        name: 'slug', in: 'path', required: true,
                        schema: { type: 'string', enum: guides.filter(guide => !guide.item.file).map(guide => guide.slug) },
                    }],
                    responses: { '200': text('Published guide with code examples.', 'text/markdown'), '404': { description: 'Guide not found.' } },
                },
            },
        },
    }), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
