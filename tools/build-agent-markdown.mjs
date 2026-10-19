import { readdir, readFile as read, mkdir, writeFile as write } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath as path } from 'node:url';
import turndown from 'turndown';

export function markdown(html, url = 'https://cavira.app/') {
    const converter = new turndown({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
    const layout = node => /(?:^|\s)(?:flex|grid|block)(?:\s|$)/.test(node.getAttribute('class') ?? '');
    const decoration = node => {
        const classes = (node.getAttribute('class') ?? '').split(/\s+/);
        return node.getAttribute('aria-hidden') === 'true' || node.hasAttribute('hidden')
            || classes.includes('pointer-events-none')
            || (classes.includes('absolute') && node.previousElementSibling?.textContent.trim() === node.textContent.trim());
    };
    converter.remove(['head', 'title', 'script', 'style', 'svg', 'canvas', 'dialog', 'noscript', 'button', 'aside', 'nav']);
    // CSS layout gaps separate words even when the HTML has no whitespace.
    converter.addRule('layout_words', {
        filter: node => node.nodeName === 'SPAN' && layout(node.parentNode),
        replacement: content => `${content} `,
    });
    converter.addRule('absolute_links', {
        filter: 'a',
        replacement: (content, node) => {
            if (!content.trim()) return '';
            const href = node.getAttribute('href');
            const link = href ? `[${content.trim()}](${new URL(href, url).href})` : content.trim();
            return layout(node) ? `\n\n${link}\n\n` : link;
        },
    });
    // Run decoration removal before other custom rules, including animated link copies.
    converter.addRule('hidden_content', { filter: decoration, replacement: () => '' });
    return `${converter.turndown(html).trim()}\n`;
}

export async function build_markdown(directory) {
    const files = await readdir(directory, { recursive: true, withFileTypes: true });
    let count = 0;
    for (const file of files) {
        if (!file.isFile() || !file.name.endsWith('.html') || file.name === '404.html') continue;
        const source = join(file.parentPath, file.name);
        const name = relative(directory, source);
        const route = name.split(sep).join('/').replace(/(?:index)?\.html$/, '');
        const published = join(directory, name.replace(/\.html$/, '.md'));
        const text = name.startsWith(`projects${sep}longmemory${sep}docs`)
            ? await read(published, 'utf8')
            : markdown(await read(source, 'utf8'), `https://cavira.app/${route}`);
        if (text.trim().length === 0) throw new Error(`Empty Markdown representation: ${name}`);
        const target = join(directory, '_agent-markdown', name.replace(/\.html$/, '.md'));
        await mkdir(dirname(target), { recursive: true });
        await write(target, text);
        count++;
    }
    if (count === 0) throw new Error('No prerendered HTML pages found for Markdown generation.');
    console.log(`Generated ${count} Markdown page representations without changing HTML.`);
}

if (process.argv[1] && resolve(process.argv[1]) === path(import.meta.url)) {
    await build_markdown(path(new URL('../build', import.meta.url)));
}
