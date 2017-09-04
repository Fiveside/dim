/* eslint flowtype-errors/show-errors: 0 */
import React from 'react';
import { Switch, Route, Redirect } from 'react-router';
import App from './containers/App';
import Viewer from './containers/Viewer';

export default () => (
  <App>
    <Switch>
      {/* <Redirect to="/viewer" path="/" /> */}
      <Route exact path="/" render={() => <Redirect to="/viewer" />} />
      <Route path="/viewer" component={Viewer} />
    </Switch>
  </App>
);
