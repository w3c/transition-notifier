import * as utils from "./lib/utils.js";

export default
function W3C_TR() {
    return utils.fetchW3C("specifications").then(specs => {
        return specs.map(spec => {
            return {
              href: spec._links["latest-version"].href,
              status: spec._links["latest-version"].title
            };
        })
    });
}

