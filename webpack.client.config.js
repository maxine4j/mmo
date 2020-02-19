const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CheckerPlugin } = require('awesome-typescript-loader');
const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');
const WorkboxPlugin = require('workbox-webpack-plugin');
const WebpackPwaManifest = require('webpack-pwa-manifest');

module.exports = {
    entry: './src/client/index.ts',
    devtool: 'inline-source-map',
    mode: 'development',
    module: {
        rules: [
            {
                test: /\.ts$/,
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
                test: /\.(png|jpe?g|gif|obj|mtl|dae|gltf|bin|glb|fbx|cur)$/i,
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
        path: `${__dirname}/dist/client/`,
        filename: 'bundle.js',
    },
    externals: [
        'uws',
    ],
    plugins: [
        new CheckerPlugin(),
        new HtmlWebpackPlugin({
            hash: true,
            title: 'MMO',
            template: './src/client/index.html',
            filename: 'index.html',
            favicon: './src/client/favicon.ico',
        }),
        new CopyPlugin([
            {
                from: path.join(__dirname, 'src/client/assets'),
                to: path.join(__dirname, 'dist/client/assets'),
            },
        ]),
        new WorkboxPlugin.GenerateSW({
            // these options encourage the ServiceWorkers to get in there fast
            // and not allow any straggling "old" SWs to hang around
            clientsClaim: true,
            skipWaiting: true,
            maximumFileSizeToCacheInBytes: 100 * 1024 * 1024,
        }),
        new WebpackPwaManifest({
            name: 'MMO',
            short_name: 'MMO',
            description: 'Simple click to move browser MMO',
            background_color: '#000000',
            crossorigin: 'use-credentials', // can be null, use-credentials or anonymous
            orientation: 'landscape',
            display: 'fullscreen',
            filename: 'manifest.json',
            icons: [
                {
                    src: path.resolve('src/client/assets/icon512.png'),
                    sizes: [96, 128, 192, 256, 384, 512], // multiple sizes
                },
            ],
        })],
    devServer: {
        contentBase: path.join(__dirname, 'dist/client'),
        compress: true,
        port: 9000,
        writeToDisk: true,
    },
};
