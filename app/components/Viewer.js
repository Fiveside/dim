// @flow
import React, { Component } from 'react';
import styles from './Viewer.css';
import Canvas from "./Canvas";

export default class Viewer extends Component {
  render() {
    return (
      <div>
        <div className={styles.viewport}>
          <Canvas />
          <div className={styles.bottomMenu}>asdfasdfa</div>
        </div>
      </div>
    );
  }
}
