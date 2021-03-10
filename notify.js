"use strict";

const notifyWideReview = require("./notify-wide-review");
const monitor = require("./lib/monitor.js");

function notify(spec) {
  monitor.log("New document: " + spec.uri);

  if (spec.status === "Working Draft" || spec.status === "Candidate Recommendation") {
    if (spec._links["predecessor-version"] === undefined || spec.sotd.indexOf("wide review") !== -1) {
      notifyWideReview(spec);
    } // else ignore
  } else if (spec.status === "Proposed Recommendation"
    || spec.status === "Recommendation") {
    //ignore
  } else {
    notifyWideReview(spec);
  }
}

module.exports = notify;
