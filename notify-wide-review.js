"use strict";
var Email = require('email').Email,
  handlebars = require('handlebars');

var MAILING_LIST, SENDER_EMAIL;

if (process.env.NODE_ENV == 'production') {
  MAILING_LIST = "public-review-announce@w3.org";
  SENDER_EMAIL = "webreq@w3.org";
} else {
  MAILING_LIST = "plh@w3.org";
  SENDER_EMAIL = "plh@w3.org";
}

var subjectTemplate = handlebars.compile("{{ status }}: {{ title }}"),
  fromTemplate = handlebars.compile("{{ name }} <{{email}}>"),
  bodyTemplate = handlebars.compile("{{ title }}\n\n{{ href }}{{ feedbackDate }}\n\nAbstract\n\n{{ abstract }}\n\nStatus of the Document\n\n{{ sotd }}");

function notifyWideReview(spec) {
  console.log("Notification for wide review: " + spec.href);
  var context = {
    title: spec.title,
    date: spec.date,
    href: spec.href,
    status: spec.status,
    sotd: spec.sotd,
    abstract: spec.abstract,
    feedbackDate: (spec.feedbackDate === undefined) ?
      "" : "\\nnfeedback due by: " + spec.feedbackDate,
    timestamp: Date.now()
  };

  var msg = new Email({
    messageId: context.href,
    to: [MAILING_LIST],
    body: bodyTemplate(context),
    subject: subjectTemplate(context),
    from: "Notifier <" + SENDER_EMAIL + ">"
  });

  msg.send(function (err) {
    console.log("Failure to notify for wide review for " + spec.href);
    console.log(err);
    console.log(err.stack);
  });
}

exports.notifyWideReview = notifyWideReview;
