import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [sveltekit()],
    server: {
        hmr: { overlay: false },
        host: '127.0.0.1'
    }
});
