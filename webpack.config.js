const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CheckerPlugin } = require('awesome-typescript-loader');
const path = require('path');

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
    ],
    devServer: {
        contentBase: path.join(__dirname, 'dist/client'),
        compress: true,
        port: 9000,
    },
};
