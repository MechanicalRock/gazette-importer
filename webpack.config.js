const AwsSamPlugin = require("aws-sam-webpack-plugin");
const awsSamPlugin = new AwsSamPlugin();

module.exports = {
  entry: awsSamPlugin.entry(),
  output: {
    filename: "[name]/app.js",
    libraryTarget: "commonjs2",
    path: __dirname + "/.aws-sam/build/"
  },
  devtool: false,
  resolve: {
    extensions: [".ts", ".js"]
  },
  target: "node",
  externals: [],//process.env.NODE_ENV === "development" ? [] : ["aws-sdk"],
  mode: process.env.NODE_ENV || "production",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "babel-loader"
      }
    ]
  },
  plugins: [
    awsSamPlugin
  ]
}
