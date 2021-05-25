"use strict";

const { notifyWideReview } = require("./notify-wide-review");
const monitor = require("./lib/monitor.js");

const ONEDAY = 60*60*24*1000; // one day in ms

function notify(spec) {
  // first, check that we're not about to notify for something stale
  const specDate = new Date(spec.date);
  const now = new Date();
  if (((now - specDate) / ONEDAY) > 30) {
    // let's skip it
    monitor.warn(`${spec.uri} too old for notification`);
    return;
  }

  if (spec.status === "Working Draft"
     || spec.status === "Candidate Recommendation Draft"
     || spec.status === "Candidate Recommendation Snapshot"
     || spec.status === "Candidate Recommendation"
     || (spec.status === "Recommendation"
         && (spec.proposedAdditions || spec.proposedCorrections))) {
    if (spec.status === "Candidate Recommendation"
        || spec._links["predecessor-version"] === undefined
        || spec.sotd.indexOf("wide review") !== -1) {
      notifyWideReview(spec);
    } else {
      // else ignore
      monitor.log(`${spec.uri} isn't up for wide review`);
    }
  } else if (spec.status === "Proposed Recommendation"
    || spec.status === "Recommendation") {
      monitor.log(`${spec.uri} is too late for wide review`);
  } else {
    notifyWideReview(spec);
  }
}

module.exports = notify;
