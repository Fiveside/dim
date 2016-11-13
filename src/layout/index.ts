// import * as _ from "lodash";
import * as Fit from "./fit";
import * as Base from "./base";
import {VirtualCollection} from "../vfs";

export * from "./base";
export * from "./fit";

export enum LayoutStyle {
  Fit,
}

interface LayoutConstructor {
  new(type: Base.LayoutPages, direction: Base.Direction): Base.Layout;
}

const LAYOUTS = new Map<LayoutStyle, LayoutConstructor>([
  [LayoutStyle.Fit, Fit.FitLayout],
]);

export function getLayout(style: LayoutStyle): LayoutConstructor {
  return LAYOUTS.get(style);
}

export function getStyleForLayout(layout: Base.Layout): LayoutStyle {
  // TODO: Figure out a better way of doing this so we don't have
  // to repeat the mapping here.
  if (layout instanceof Fit.FitLayout) {
    return LayoutStyle.Fit;
  } else {
    throw new Error("Unknown layout.  Is this a layout?");
  }
}
