import * as React from 'react';
import { MemoryRouter, Route, Link, RouteComponentProps } from 'react-router-dom';
import { Viewer } from "./components/viewer";
import { Navigation, INavigationEntry } from "./components/navigation";


function Index() {
  return <h2>Home!</h2>;
}

function About() {
  return <h2>About!</h2>;
}

function Users() {
  return <h2>IDK lol</h2>;
}

interface IFizzbuzzparams {
  id: string
}

function Fizzbuzz(props: RouteComponentProps<IFizzbuzzparams>) {
  return <h2>Got a thing: {props.match.params.id}</h2>
}

interface IRouteConf {
  route: () => string,
  reverse: (x: any) => string,
  component: React.ComponentClass<any, any> | React.FunctionComponent<any>,
  exact: boolean
}

export const Routes: { [key: string]: IRouteConf } = {
  index: {
    route: () => '/',
    reverse: () => '/',
    component: Viewer,
    exact: true,
  },
  about: {
    route: () => '/about',
    reverse: () => '/about',
    component: About,
    exact: false,
  },
  users: {
    route: () => '/users',
    reverse: () => '/users',
    component: Users,
    exact: false,
  },
  fizzbuzz: {
    route: () => '/fizzbuzz/:id',
    reverse: (x: Number) => `/fizzbuzz/${x}`,
    component: Fizzbuzz,
    exact: false,
  }
}

export class AppRouter extends React.PureComponent {

  private navEntries() {
    return Object.entries(Routes).map(([name, conf]) => {
      return {
        icon: 'home',
        text: name,
        to: conf.reverse(5),
      } as INavigationEntry
    })
  }

  private routeEntries() {
    return Object.entries(Routes).map(([name, conf]) => {
      return <Route
        path={conf.route()}
        exact={conf.exact}
        component={conf.component}
        key={name}
      />
    })
  }

  public render() {
    return (
      <MemoryRouter>
        <Navigation entries={this.navEntries()} />
        {this.routeEntries()}
      </MemoryRouter>
    )
  }
}

