import { docs_markdown } from '$lib/utils/site';

export const prerender = true;
export function GET() {
    return new Response(docs_markdown(), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
}