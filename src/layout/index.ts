import * as _ from "lodash";
import * as Fit from "./fit";
import * as Base from "./base";

export * from "./base";
export * from "./fit";

let layouts: {[name: string]: Base.LayoutConstructor} = {
  "single-page-fit": Fit.SinglePageFitLayout,
  "dual-page-fit": Fit.DualPageFitLayout,
  "smart-dual-page-fit": Fit.SmartDualPageFitLayout,
};

export function getLayoutByName(name: string): Base.LayoutConstructor {
  let ctor = layouts[name];
  if (ctor == null) {
    throw new TypeError(`Invalid layout name: ${name}`);
  }
  return ctor;
}
