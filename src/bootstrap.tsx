import * as React from "react";
import * as ReactDOM from "react-dom";

class Application extends React.Component<{}, {}> {
  render() {
    return (
      <div>
        <h1>Hello World</h1>
        <div>We are using node {process.versions.node}</div>
        <div>Chrome {process.versions.chrome}</div>
        <div>and Electron {process.versions.electron}</div>
      </div>
    );
  }
}

export default function init() {
  document.addEventListener("DOMContentLoaded", () => {
    ReactDOM.render(
      <Application />,
      document.getElementById("root")
    );
  });
}
