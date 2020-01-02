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
            {
                test: /\.scss$/,
                use: ['style-loader', 'css-loader', 'sass-loader']
            },
            {
                test: /\.ttf$/,
                loader: 'url-loader',
                query: {
                    outputPath: './client/fonts/',
                    name: '[name].[ext]'
                }
            }
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.scss'],
    },
    output: {
        filename: './client/bundle.js',
    },
    externals: [
        'fs',
        'uws',
    ],
    plugins: [
        new CheckerPlugin(),
        new HtmlWebpackPlugin({
            hash: true,
            title: 'MMO',
            template: './src/client/index.html',
            filename: './client/index.html',
        }),
    ],
};
