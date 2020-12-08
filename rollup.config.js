import { nodeResolve } from '@rollup/plugin-node-resolve';

export default [{
        input: 'index.js',
        output: {
            file: 'demo/halftone.js',
            format: 'es',
            name: 'Halftone'
        },
        plugins: [nodeResolve()]
    },
    {
        input: 'index.js',
        output: {
            file: 'halftone.js',
            format: 'iife',
            name: 'Halftone'
        },
        plugins: [nodeResolve()]
    },

];
