"use strict";
var Email = require('email').Email,
  handlebars = require('handlebars');

var MAILING_LIST, SENDER_EMAIL;

if (process.env.NODE_ENV == 'production') {
  MAILING_LIST = "public-review-announce@w3.org";
  SENDER_EMAIL = "notifier@aries.w3.org";
} else {
  MAILING_LIST = "plh@w3.org";
  SENDER_EMAIL = "plh@w3.org";
}

var subjectTemplate = handlebars.compile("{{ status }}: {{ title }}{{cfwd}}"),
  fromTemplate = handlebars.compile("{{ name }} <{{email}}>"),
  bodyTemplate = handlebars.compile("{{ title }}\n\n{{ href }}{{ feedbackDate }}\n\nAbstract\n\n{{ abstract }}\n\nStatus of the Document\n\n{{ sotd }}");

function notifyWideReview(spec) {
  console.log("[Email] Notification: " + spec.href);
  var status = spec.status;
  if (spec.obsoletes === undefined) {
    status = "FPWD";
  }
  var context = {
    title: spec.title,
    date: spec.date,
    href: spec.href,
    status: status,
    sotd: spec.sotd,
    abstract: spec.abstract,
    feedbackDate: (spec.feedbackDate === undefined) ?
      "" : "\n\nfeedback due by: " + spec.feedbackDate,
    timestamp: Date.now()
  };
  if (spec.sotd.indexOf("wide review") !== -1) {
    context.cfwd = " (Call for Wide Review)";
  } else {
    context.cfwd = "";
  }

  var msg = new Email({
    messageId: context.href,
    to: [MAILING_LIST],
    body: bodyTemplate(context),
    subject: subjectTemplate(context),
    from: "Notifier <" + SENDER_EMAIL + ">",
    path: "/usr/sbin/sendmail"
  });

  msg.send(function (err) {
    if (err !== null) {
      console.log("Failure to send email for " + spec.href);
      console.log(err);
      console.log(err.stack);
    }
  });
}

exports.notifyWideReview = notifyWideReview;
