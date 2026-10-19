import { error } from '@sveltejs/kit';
import { guides } from '$lib/utils/site';

export const prerender = true;
export const entries = () => guides.filter(guide => !guide.item.file).map(guide => ({ slug: guide.slug }));

export function load({ params }: { params: { slug: string } }) {
    const guide = guides.find(guide => !guide.item.file && guide.slug === params.slug);
    if (!guide) error(404, 'Documentation page not found.');
    return { pid: guide.pid };
}