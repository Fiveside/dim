import * as React from 'react';
import { MemoryRouter, Route, Link } from 'react-router-dom';
import { Viewer } from "./components/viewer";

function Index() {
  return <h2>Home!</h2>;
}

function About() {
  return <h2>About!</h2>;
}

function Users() {
  return <h2>IDK lol</h2>;
}

export const Routes = {
  index: {
    route: () => '/',
    component: Viewer,
    exact: true,
  },
  about: {
    route: () => '/about',
    component: About,
    exact: false,
  },
  users: {
    route: () => '/users',
    component: Users,
    exact: false,
  }
}

export function AppRouter() {
  return (
    <MemoryRouter>
      <div>
        <nav>
          <ul>
            <li>
              <Link to={Routes.index.route()}>Home</Link>
            </li>
            <li>
              <Link to={Routes.about.route()}>About</Link>
            </li>
            <li>
              <Link to={Routes.users.route()}>Users</Link>
            </li>
          </ul>
        </nav>

        {Object.entries(Routes).map(([name, e]) => (
          <Route
            path={e.route()}
            exact={e.exact}
            component={e.component}
            key={name}
          />
        ))}
        {/* <Route path="/" exact componet={Index} />
        <Route path="/about" component={About} />
        <Route path="/users" component={Users} /> */}
      </div>
    </MemoryRouter>
  )
}
