import * as Keypress from "keypress";
import {autobind} from "core-decorators";
import * as React from "react";
import * as _ from "lodash";

const KEYBINDS: {[key: string]: string} = {
  "viewport.next_page": "right",
  "viewport.previous_page": "left",
};

interface KeyboardEventHandler {(e?: KeyboardEvent): any; }
interface KeyboardActivators {[name: string]: KeyboardEventHandler; }

// This is the object that keypress expects to recieve on batch
interface KeypressInitializer {
  keys: string;
  on_keydown?: KeyboardEventHandler;
  on_keyup?: KeyboardEventHandler;
  on_release?: KeyboardEventHandler;
  this?: any;
  prevent_default?: boolean;
  prevent_repeat?: boolean;
  is_unordered?: boolean;
  is_counting?: boolean;
  is_exclusive?: boolean;
  is_sequence?: boolean;
  is_solitary?: boolean;
}

class HotkeyManager {
  keypress = new Keypress.keypress.Listener(window);

  // Maps keybinds to the initializer.
  activated: {[key: string]: KeypressInitializer} = {};

  // Maps a context to all the keybinds for that context (for unbinds.)
  contexts: {[key: string]: Array<string>} = {};

  activate(context: string, activators: KeyboardActivators) {
    let names = Object.keys(activators);
    let initializers: {[key: string]: KeypressInitializer} = {};
    for (let name of names) {
      let fullName = `${context}.${name}`;
      if (KEYBINDS[fullName] == null) {
        throw new TypeError(`Cannot register keybinding ${name}, no matching sequence exists.`)
      }

      let callback = activators[name];
      let initializer: KeypressInitializer = {
        keys: KEYBINDS[fullName],
        on_keyup: callback,
        is_sequence: true,
        is_unordered: false,
      };

      if (this.activated[fullName] != null) {
        console.warn(`Registering keybinding for event that is already bound: ${fullName}`);
      }
      initializers[fullName] = initializer;
    }

    this.keypress.register_many(_.values(initializers));
    _.assign(this.activated, initializers);
    this.contexts[context] = Object.keys(initializers);
  }

  deactivate(context: string) {
    let initializers = this.contexts[context].map(
      (name) => this.activated[name]
    );

    this.keypress.unregister_many(initializers);

    for (let name of this.contexts[context]) {
      delete this.activated[name];
    }
    delete this.contexts[context];
  }
}

export var KeybindManager = new HotkeyManager();