const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CheckerPlugin } = require('awesome-typescript-loader');
const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = {
    entry: './src/editor/index.ts',
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
                use: ['style-loader', 'css-loader', 'sass-loader'],
            },
            {
                test: /\.glsl$/,
                loader: 'ts-shader-loader',
            },
            {
                test: /\.(png|jpe?g|gif|obj|mtl|dae|gltf|bin|glb|fbx)$/i,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            outputPath: './assets',
                            name: '[name].[ext]',
                        },
                    },
                ],
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.scss'],
    },
    output: {
        path: `${__dirname}/dist/editor/`,
        filename: 'bundle.js',
    },
    externals: [
        'uws',
    ],
    plugins: [
        new CheckerPlugin(),
        new HtmlWebpackPlugin({
            hash: true,
            title: 'MMO Editor',
            template: './src/editor/index.html',
            filename: 'index.html',
        }),
        new CopyPlugin([
            {
                from: path.join(__dirname, 'src/client/assets'),
                to: path.join(__dirname, 'dist/editor/assets'),
            },
        ]),
        new CopyPlugin([
            {
                from: path.join(__dirname, 'src/editor/assets'),
                to: path.join(__dirname, 'dist/editor/assets'),
            },
        ]),
    ],
    devServer: {
        contentBase: path.join(__dirname, 'dist/editor'),
        compress: true,
        port: 9000,
        // writeToDisk: true,
    },
};
