// Virtual filesystem
import * as Vinyl from "vinyl";

export class DimVinylFile extends Vinyl {

  constructor(opts: Object) {
    super(opts);
  }

  getSourceUrl(): string {
    return URL.createObjectURL(this.contents);
  }
}
