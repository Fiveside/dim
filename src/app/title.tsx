// Ephemeral component for updating the title of the page.
import * as React from "react";

interface ITitleProps {
  title: string;
}

export default class Title extends React.Component<ITitleProps, {}> {
  updateTitle() {
    document.title = this.props.title;
  }
  componentDidMount() {
    this.updateTitle();
  }
  componentDidUpdate() {
    this.updateTitle();
  }
  render(): JSX.Element {
    return null;
  }
}
