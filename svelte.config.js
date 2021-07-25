import { mdsvex } from "mdsvex";
import mdsvexConfig from "./mdsvex.config.js";
import preprocess from "svelte-preprocess";
import adapter from '@sveltejs/adapter-netlify';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    "extensions": [".svelte", ...mdsvexConfig.extensions],

    kit: {
        adapter: adapter(), // currently the adapter does not take any options
        // hydrate the <div id="svelte"> element in src/app.html
        target: '#svelte'
    },

    preprocess: [preprocess({
        "postcss": true
    }), mdsvex(mdsvexConfig)]
};

export default config;