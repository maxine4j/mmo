const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CheckerPlugin } = require('awesome-typescript-loader');
const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

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
        }),
        new CopyPlugin([
            {
                from: path.join(__dirname, 'src/client/assets'),
                to: path.join(__dirname, 'dist/client/assets'),
            },
        ]),
    ],
    devServer: {
        contentBase: path.join(__dirname, 'dist/client'),
        compress: true,
        port: 9000,
        // writeToDisk: true,
    },
};
