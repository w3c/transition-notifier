"use strict";

var notifyWideReview = require("./notify-wide-review").notifyWideReview;

function notify(spec) {
  console.log("New document: " + spec.href);

  if (spec.status === "WD") {
    if (spec.obsoletes === undefined
      || spec.sotd.indexOf("wide review") !== -1) {
      notifyWideReview(spec);
    } // else ignore
  } else if (spec.status === "PR"
    || spec.status === "REC") {
    //ignore
  } else {
    notifyWideReview(spec);
  }
}

exports.notify = notify;
