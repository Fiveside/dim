
// Acts as a shim to allow for non-react jsx compilation.
const snabbdom = require("snabbdom-jsx");
const JSX = {createElement: snabbdom.html};
export default JSX;
