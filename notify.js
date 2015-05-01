"use strict";
var email = require('email').Email,
    handlebars = require('handlebars');

var MAILING_LIST,
    SENDER_EMAIL = "plh@w3.org";

if (process.env.NODE_ENV == 'production') {
    MAILING_LIST = "null@noreply.w3.org";
} else {
    MAILING_LIST = "plh@w3.org";
}

var subjectTemplate = handlebars.compile("{{ status }}: {{ title }}"),
    fromTemplate = handlebars.compile("{{ name }} <{{email}}>"),
    bodyTemplate = handlebars.compile("{{ title }}\n\n{{ href }}\n\n{{ date }}\n\n{{ sotd }}");

function notifySpec(spec) {
  console.log("Notification: " + spec.href);
  var context = {
    title: spec.title,
    date: spec.date,
    href: spec.href,
    status: spec.status,
    sotd: spec.sotd,
    timestamp: Date.now()
  };

  // var cmd =
  //   global.SENDMAIL + ' SUCCESS ' + global.MAILING_LIST +
  //     ' ' + report.metadata.get('thisVersion');

  // exec(cmd, function (err, stdout, stderr) {
  //   if (err) console.error(stderr);
  // });
  var msg = new email({
      messageId: context.href,
      to: [MAILING_LIST],
      body: bodyTemplate(context),
      subject: subjectTemplate(context),
      from: "Notifier <" + SENDER_EMAIL + ">"
    });

  msg.send(function (err) {
    console.log(err);
  });
}

exports.notifySpec = notifySpec;
