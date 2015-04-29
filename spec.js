var whacko = require("whacko");
var io = require("./io-promise");

function norm (str) {
    if (!str) return "";
    str = "" + str;
    return str.replace(/^\s+/, "")
              .replace(/\s+$/, "")
              .replace(/\s+/g, " ");
}

function getSotDSection(doc) {
    var $startH2, $endH2
    ,   $ = doc
    ,   $div = $("<div></div>");
    $("h2").each(function () {
        var $h2 = $(this);
        if ($startH2) {
            $endH2 = $h2;
            return false;
        }
        if (/^Status [Oo]f [Tt]his [Dd]ocument$/.test(norm($h2.text())))
          $startH2 = $h2;
    });
    if (!$startH2 || !$endH2) {
      return $div;
    }
    var started = false;
    $startH2.parent().children().each(function () {
        if ($startH2[0] === this) {
            started = true;
            return;
        }
        if (!started) return;
        if ($endH2[0] === this) return false;
        $div.append($(this).clone());
    });
    var output = "";
    $div.children().each(function () {
      output += "\n\n" + norm($(this).text().normalize());
    });
    return output.substring(2);
}

function loadSpec(href) {
  return ;
}

var exporter = {};

exporter.Spec = function (s) {
  this.href = s.href;
  this.status = s.status;
  this.title = "";
  var self = this;
  this.getSotd = function () {
    return io.fetch(this.href)
    .then(function (res) {
      return res.text().then(function (data) {
        return whacko.load(data);
      });
    }).then(function (doc) {
      this.title = doc("title").text();
      return getSotDSection(doc);
    });
  };
};

// var foo = new exporter.Spec({status: "PR", href: "http://www.w3.org/TR/2015/PR-webmessaging-20150407/"});
// foo.getSotd().then(function (text) {
//   console.log(text);
// });

module.exports = exporter;
