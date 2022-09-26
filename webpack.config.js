// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');

module.exports = (env, argv) => {
    const config = {
        entry: {
            banner: './src/banner.tsx',
            Hub: './src/hub.tsx'
        },
        devtool: argv.mode === 'development' ? 'source-map' : false,
        output: {
            filename: "[name]/[name].js",
            path: path.join(__dirname, 'dist'),
            publicPath: "/dist/"
        },
        resolve: {
            extensions: [".ts", ".tsx", ".js"],
            alias: {
                "azure-devops-extension-sdk": path.resolve("node_modules/azure-devops-extension-sdk"),
                "src": path.resolve(__dirname, "src"),
                "wcf-config": path.resolve(__dirname, './src/Common/Configuration/Configuration.' + argv.mode),
            },
        },
        stats: {
            warnings: false
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    loader: "ts-loader"
                },
                {
                    test: /\.scss$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        "css-loader",
                        "azure-devops-ui/buildScripts/css-variables-loader",
                        "sass-loader",
                    ]
                },
                {
                    test: /\.css$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        "css-loader",
                    ],
                },
                {
                    test: /\.woff$/,
                    use: [{
                        loader: 'base64-inline-loader'
                    }]
                },
                {
                    test: /\.html$/,
                    loader: "file-loader"
                }
            ]
        },
        plugins: [
            new CopyWebpackPlugin([
                { from: "**/*.html", context: "src/" },
            ]),
            new MiniCssExtractPlugin({
                filename: "[name]/[name].css",
            }),
        ]
    }

    if (argv.mode === 'production') {
        config.plugins.push(new OptimizeCSSAssetsPlugin({
            cssProcessorOptions: {
                safe: true,
            }
        }))
    }

    return config;
};
