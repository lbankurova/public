const path = require('path');

module.exports = {
  mode: 'development',
  entry: {
    package: './src/package.ts',
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.js', '.ts'],
    // fallback: {
    //   'os': require.resolve('os-browserify/browser'),
    // },
  },
  devtool: 'inline-source-map',
  externals: {
    'datagrok-api/dg': 'DG',
    'datagrok-api/grok': 'grok',
    'datagrok-api/ui': 'ui',
    'openchemlib/full.js': 'OCL',
    'rxjs': 'rxjs',
    'rxjs/operators': 'rxjs.operators',
  },
  output: {
    filename: '[name].js',
    library: 'peptides',
    libraryTarget: 'var',
    path: path.resolve(__dirname, 'dist'),
  },
};
