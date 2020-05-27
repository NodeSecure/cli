"use strict";

// Require Node.js Dependencies
const { join } = require("path");
const { readdirSync } = require("fs");

// Require Third-party Dependencies
const CopyWebpackPlugin = require("copy-webpack-plugin");
const ExtractTextPlugin = require("extract-text-webpack-plugin");

// CONSTANTS
const kPublicDir = join(__dirname, "public");
const kDistDir = join(__dirname, "dist");
const kCssDir = join(__dirname, "public", "css");

module.exports = {
    entry: {
        "main.min.css": readdirSync(kCssDir).map((name) => join(kCssDir, name)),
        "main.js": [
            join(kPublicDir, "js", "master.js")
        ]
    },
    output: {
        filename: "[name]",
        path: kDistDir
    },
    mode: "production",
    devtool: "sourcemap",
    optimization: {
        usedExports: true
    },
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: ExtractTextPlugin.extract({
                    fallback: "style-loader",
                    use: "css-loader"
                })
            },
            {
                test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
                use: [
                    {
                        loader: "file-loader",
                        options: {
                            name: "[name].[ext]",
                            outputPath: "fonts/"
                        }
                    }
                ]
            }
        ]
    },
    plugins: [
        new ExtractTextPlugin("main.min.css"),
        new CopyWebpackPlugin({
            patterns: [
                { from: join(kPublicDir, "img"), to: join(kDistDir, "img") },
                { from: join(kPublicDir, "favicon.ico"), to: join(kDistDir, "favicon.ico") }
            ]
        })
    ]
};
