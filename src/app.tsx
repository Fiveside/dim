import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Viewer } from './components/viewer';
import * as Router from "./router";

// CSS imports
import "normalize.css"
import "@blueprintjs/core/lib/css/blueprint.css";

// ReactDOM.render(
//   <Viewer />,
//   document.getElementById('root')
// );

ReactDOM.render(
  <Router.AppRouter />,
  document.getElementById('root')
);
