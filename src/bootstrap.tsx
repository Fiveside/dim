/// <reference path="react.d.ts" />
/// <reference path="react-jsx.d.ts" />

import React, {Component} from "react";
import {render} from "react-dom";

class Application extends Component<{}, {}> {
  render() {
    return (
      <div>
        <h1>Hello World</h1>
        <div>We are using node {process.versions.node}</div>
      </div>
    )
  }
}

render(
  <Application />,
  document.getElementById("root")
);
