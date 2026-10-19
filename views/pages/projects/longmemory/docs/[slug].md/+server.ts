import { error } from '@sveltejs/kit';
import { guides, guide_markdown } from '$lib/utils/site';

export const prerender = true;
export const entries = () => guides.filter(guide => !guide.item.file).map(guide => ({ slug: guide.slug }));

export function GET({ params }: { params: { slug: string } }) {
    const guide = guides.find(guide => !guide.item.file && guide.slug === params.slug);
    if (!guide) error(404, 'Documentation page not found.');
    return new Response(guide_markdown(guide), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
}