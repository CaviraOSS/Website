import { canonical, site } from '$lib/utils/site';

export const prerender = true;

export function GET() {
    return new Response(JSON.stringify({
        linkset: [{
            anchor: canonical(site.docs),
            'service-desc': [{ href: canonical('/openapi.json'), type: 'application/json' }],
            'service-doc': [{ href: canonical(site.docs), type: 'text/html' }],
        }],
    }), { headers: { 'Content-Type': 'application/linkset+json' } });
}
