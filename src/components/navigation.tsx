import * as React from 'react';
import { Navbar, Classes, Alignment, Button, IButtonProps, IconName } from "@blueprintjs/core"
import { Link, withRouter, RouteComponentProps } from 'react-router-dom';
import { History } from 'history';
import { omit } from 'lodash';
import { boundMethod } from 'autobind-decorator';


type LinkButtonProps = RouteComponentProps & IButtonProps & {
  onClick?: React.MouseEventHandler,
  to: string,
};

class RawLinkButton extends React.PureComponent<LinkButtonProps> {

  @boundMethod
  private onClick(e: React.MouseEvent) {
    if (this.props.onClick) {
      this.props.onClick(e);
    }
    this.props.history.push(this.props.to);
  }

  private propFilter() {
    let keys = ['history', 'location', 'match', 'staticContext', 'to', 'onClick'];
    return omit(this.props, keys);
  }

  public render() {
    return (
      <Button {...this.propFilter()} onClick={this.onClick} />
    )
  }
}

const LinkButton = withRouter(RawLinkButton);

export interface INavigationEntry {
  icon?: IconName,
  text: string,
  to: string,
}

interface INavigationProps {
  entries: Array<INavigationEntry>
  selected_to?: string
}

class RawNavigation extends React.PureComponent<INavigationProps & RouteComponentProps> {

  private linkButtons() {
    return this.props.entries.map(e => {
      let selected = e.to === this.props.selected_to;
      return <LinkButton
        className={Classes.MINIMAL}
        icon={e.icon}
        text={e.text}
        to={e.to}
        key={e.to}
        active={selected}
      />
    })
  }

  public render() {
    console.log("location: ", this.props.location.pathname);
    console.log("path: ", this.props.match.path);
    return (
      <Navbar className={Classes.DARK}>
        <Navbar.Group align={Alignment.LEFT}>
          <Navbar.Heading>Dim Navbar heading</Navbar.Heading>
          <Navbar.Divider />
          {/* <LinkButton className={Classes.MINIMAL} icon="home" text="home" to="/home" /> */}
          {this.linkButtons()}
        </Navbar.Group>
      </Navbar>
    )
  }
}

export const Navigation = withRouter(RawNavigation);
