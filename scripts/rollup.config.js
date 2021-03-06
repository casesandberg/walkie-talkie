import resolve from 'rollup-plugin-node-resolve'
import replace from 'rollup-plugin-replace'
import babel from 'rollup-plugin-babel'
import uglify from 'rollup-plugin-uglify'

export default {
  input: 'src/index.js',
  external: ['react'],
  globals: {
    react: 'React',
  },
  plugins: [
    resolve(),
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    babel({
      exclude: 'node_modules/**',
      plugins: ['external-helpers'],
    }),
    uglify({
      compress: {
        warnings: false,
      },
      output: {
        comments: false,
      },
      sourceMap: false,
    }),
  ],

  exports: 'named',
  output: {
    file: 'dist/react-color.min.js',
    format: 'umd',
    name: 'ReactColor',
  },
}
