import * as React from "react";
import * as ReactDOM from "react-dom";
import Application from "./application";

export default function init() {
  document.addEventListener("DOMContentLoaded", () => {
    ReactDOM.render(
      <Application />,
      document.getElementById("root")
    );
  });
}
