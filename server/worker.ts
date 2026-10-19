type environment = { assets: { fetch: (request: Request) => Promise<Response> } };

export function prefers_markdown(accept: string | null): boolean {
    const ranges = (accept ?? '').toLowerCase().split(',').map(part => {
        const [type, ...params] = part.trim().split(';').map(value => value.trim());
        const value = params.find(param => /^q\s*=/.test(param))?.split('=')[1].trim();
        const quality = value === undefined ? 1 : /^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/.test(value) ? Number(value) : 0;
        return { type, quality };
    });
    const markdown = Math.max(0, ...ranges.filter(range => range.type === 'text/markdown').map(range => range.quality));
    const html = ['text/html', 'text/*', '*/*'].map(type => ranges.filter(range => range.type === type))
        .find(matches => matches.length);
    return markdown > 0 && markdown >= Math.max(0, ...(html ?? []).map(range => range.quality));
}

export default {
    async fetch(request: Request, env: environment): Promise<Response> {
        const negotiate = ['GET', 'HEAD'].includes(request.method) && prefers_markdown(request.headers.get('Accept'));
        const original = new Request(request);
        if (negotiate) {
            for (const name of ['If-None-Match', 'If-Modified-Since', 'If-Match', 'If-Unmodified-Since', 'Range', 'If-Range']) {
                original.headers.delete(name);
            }
        }
        let response = await env.assets.fetch(original);
        const html = response.headers.get('Content-Type')?.startsWith('text/html');
        if (!html) return response;
        const headers = new Headers(response.headers);
        const vary = headers.get('Vary');
        if (!vary?.split(',').some(value => ['accept', '*'].includes(value.trim().toLowerCase()))) {
            headers.set('Vary', vary ? `${vary}, Accept` : 'Accept');
        }
        if (negotiate && response.status === 200) {
            const url = new URL(request.url);
            url.pathname = `/_agent-markdown${url.pathname === '/' ? '/index' : url.pathname.replace(/\/$/, '')}.md`;
            url.search = '';
            const asset = await env.assets.fetch(new Request(url, { method: request.method }));
            if (asset.status !== 200) {
                console.error(`Missing Markdown representation for ${new URL(request.url).pathname}: ${asset.status}`);
                return new Response('Markdown representation unavailable.', { status: 502, headers: { 'Content-Type': 'text/plain; charset=utf-8', Vary: 'Accept' } });
            }
            for (const name of ['Content-Length', 'Content-Encoding', 'Content-Range', 'ETag', 'Last-Modified', 'Accept-Ranges']) {
                headers.delete(name);
            }
            headers.set('Content-Type', 'text/markdown; charset=utf-8');
            response = asset;
        }
        return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    },
};
