import { llms_index } from '$lib/utils/site';

export const prerender = true;
export function GET() {
    return new Response(llms_index(), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}