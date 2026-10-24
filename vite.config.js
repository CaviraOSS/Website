import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [sveltekit()],
    server: {
        hmr: { overlay: false },
        host: '0.0.0.0'
    }
});
