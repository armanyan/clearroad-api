import path from 'path';
import typescript from 'rollup-plugin-typescript';
import resolve from 'rollup-plugin-node-resolve';
import replace from 'rollup-plugin-replace';
import commonJS from 'rollup-plugin-commonjs';
import builtins from 'rollup-plugin-node-builtins';
import hypothetical from 'rollup-plugin-hypothetical';
import buble from 'rollup-plugin-buble';
import { uglify } from 'rollup-plugin-uglify';
const cloneDeep = require('lodash.clonedeep');

const main = 'src/clearroad.ts';
const typescriptOptions = {
  typescript: require('typescript')
};
const jio = path.resolve(__dirname, 'lib/jio.js');

const cjs = {
  external: [
    'rsvp',
    'rusha',
    'ajv',
    jio
  ],
  input: main,
  output: {
    file: 'dist/commonjs/clearroad.js',
    format: 'cjs'
  },
  plugins: [
    typescript(typescriptOptions),
    builtins(),
    commonJS({
      include: [
        'node_modules/**',
        'lib/**'
      ]
    }),
    replace({
      delimiters: ['',''],
      values: {
        "require('../lib/jio.js');": "var jIO = require('../../lib/jio.js').jIO;"
      }
    })
  ]
};

const node = {
  external: [
    'rsvp',
    'rusha',
    'ajv',
    jio
  ],
  input: main,
  output: {
    file: 'node/index.js',
    format: 'cjs'
  },
  plugins: [
    typescript(typescriptOptions),
    builtins(),
    commonJS({
      include: [
        'node_modules/**',
        'lib/**'
      ]
    }),
    replace({
      delimiters: ['',''],
      values: {
        "require('../lib/jio.js');": "var jIO = require('@nexedi/jio');"
      }
    }),
    buble()
  ]
};

const iife = {
  input: main,
  output: [{
    file: 'dist/iife/clearroad.js',
    format: 'iife',
    name: 'bundle',
    banner: `
(function(jIO) {
`,
    footer: `
  window.ClearRoad = bundle.ClearRoad;
})(jIO);
    `,
    globals: {
      rsvp: 'RSVP',
      rusha: 'Rusha',
      ajv: 'Ajv'
    }
  }],
  plugins: [
    typescript(typescriptOptions),
    hypothetical({
      allowFallthrough: true,
      files: {
        rsvp: `
export default window.RSVP;
        `,
        rusha: `
export default window.Rusha;
        `
      }
    }),
    resolve(),
    commonJS({
      include: 'node_modules/**'
    }),
    replace({
      delimiters: ['',''],
      values: {
        "require('../lib/jio.js');": '',
        "var Ajv = require('ajv');": 'var Ajv = window.Ajv;'
      }
    }),
    buble()
  ]
};

const iifeMinified = cloneDeep(iife);
iifeMinified.output[0].file = 'dist/iife/clearroad.min.js';
iifeMinified.plugins.push(uglify());

export default [
  cjs,
  node,
  iife,
  iifeMinified
];
