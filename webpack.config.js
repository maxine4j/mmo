const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CheckerPlugin } = require('awesome-typescript-loader');


module.exports = {
    entry: './src/client/index.ts',
    devtool: 'inline-source-map',
    mode: 'development',
    module: {
        rules: [
        {
            test: /\.tsx?$/,
            use: 'awesome-typescript-loader?configFileName=./tsconfig.client.json',
            exclude: /node_modules/,
        },
        ],
    },
    resolve: {
        extensions: [ '.tsx', '.ts', '.js' ],
    },
    output: {
        filename: './client/bundle.js'
    },
    externals: [
        "fs",
        "uws"
    ],
    plugins: [
        new CheckerPlugin(),
        new HtmlWebpackPlugin({
            hash: true,
            title: 'MMO',
            template: './src/client/index.html',
            filename: './client/index.html'
        })
   ]
};