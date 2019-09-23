import * as React from 'react';
import { Navigation } from "./navigation";

export class Viewer extends React.PureComponent<{}, {}> {
  public render() {
    return (
      <React.Fragment>
        <Navigation />
        <div>Hello from the viewer component</div>
      </React.Fragment>
    );
  }
}
