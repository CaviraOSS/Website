import { llms_full } from '$lib/utils/site';

export const prerender = true;
export function GET() {
    return new Response(llms_full(), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}