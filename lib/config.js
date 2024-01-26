/* eslint-env node */

"use strict";

const path = require('path');
const config = require("../config.json");

// Handles the configuration settings of the application
//
// Use checkOptions to ensure your required settings are there:
//   if (!config.checkOptions("interval")) process.exit(1);
// Merge together:
// * environment variables
// * $PROJECT_ROOT/config.json



// environment variables

config.env = process.env["NODE_ENV"] || config.env || "development";
config.port = process.env["PORT"] || config.port || 8080;
config.host = process.env["HOST"] || config.host || "localhost";
config.basedir = process.env["NODE_BASEDIR"] || config.basedir || path.resolve(__dirname, "..");

// DEBUG mode

config.debug = (config.env === "development") || config.debug || false;

// auth tokens and keys

config.gh_token = undefined;

// app specifics

config.loop_interval = config.loop_interval || 60;

// dump the configuration into the server console log

console.log("".padStart(80, '-'));
console.log("Configuration:");
for (const [key, value] of Object.entries(config)) {
  const normalized_key = key.toLowerCase();
  let normalized_value = value;
  if ((key.indexOf("key") != -1 || key.indexOf("token") != -1)
      && value !== undefined) {
    normalized_value = "<value-hidden>";
  }
  console.log(`${key.padStart(20, ' ')} = ${value}`);
}
console.log("".padStart(80, '-'));

// options is an array of String
config.checkOptions = function (...options) {
  let correct = true;
  options.forEach(option => {
    if (config[option] === undefined) {
      console.error(`config.${option} is missing.`);
      correct = false;
    }
  });
  return correct;
}

module.exports = config;
