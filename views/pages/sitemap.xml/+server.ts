import { sitemap } from '$lib/utils/site';

export const prerender = true;
export function GET() {
    return new Response(sitemap(), { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}