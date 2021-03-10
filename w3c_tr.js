const utils = require("./lib/utils.js");

function getSpecs() {
    return utils.fetchW3C("specifications").then(specs => {
        return specs.map(spec => {
            return {
              href: spec._links["latest-version"].href,
              status: spec._links["latest-version"].title
            };
        })
    });
}

module.exports = getSpecs;

