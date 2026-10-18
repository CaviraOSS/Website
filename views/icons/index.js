import yeah from './00.js';

const iconModules = import.meta.glob('./*.svg', {
    query: '?raw',
    import: 'default',
    eager: true
});

function all() {
    return [
        ...new Set([
            ...Object.keys(iconModules).map(path => path.slice(2, -4)),
            ...Object.keys(yeah)
        ])
    ].sort();
}

const svgCache = new Map();

function get(icon, classes = "") {
    let baseSvg = svgCache.get(icon);

    if (!baseSvg) {
        const rawSvg = yeah[icon] || iconModules[`./${icon}.svg`];
        if (!rawSvg) {
            console.warn(`Icon "${icon}" not found.`);
            return "";
        }
        baseSvg = rawSvg.replace(/<svg\b[^>]*>/i, tag => tag.replace(/\s(width|height)="[^"]*"/g, '')).replace(/\s(fill|stroke)="#[^"]+"/g, ' $1="currentColor"');
        svgCache.set(icon, baseSvg);
    }

    if (classes) {
        return baseSvg.replace('<svg', `<svg class="${classes}"`);
    }

    return baseSvg;
}

export default { get, all };