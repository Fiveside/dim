import {VirtualPage, VirtualCollection, IVirtualPageProps} from "./base";
import {DrawSource} from "../lib/drawing";
import * as rx from "rxjs";
import * as CR from "../lib/cr";
import fetch from "node-fetch";


interface ICrunchyrollChapterProps {
  series: CR.Series;
  chapter: CR.Chapter;
  session: CR.Session;
}

class CrunchyrollChapter extends VirtualCollection {

  _series: CR.Series;
  _chapter: CR.Chapter;
  _session: CR.Session;

  constructor(pages: CrunchyrollPage[], props: ICrunchyrollChapterProps) {
    // TODO: Generate chapter name properly.
    let name = CR.navLocale(props.series.locale).name;
    super(pages, name);
    this._session = props.session;
    this._chapter = props.chapter;
    this._series = props.series;
  }
}

interface ICrunchyrollPageProps extends IVirtualPageProps {
  session: CR.Session;
  page: CR.Page;
}

class CrunchyrollPage extends VirtualPage {
  image: Promise<DrawSource>;

  // raw image data (decrypted) fetched from the api.
  // This doesn't get removed until the page is destroyed.
  _imageData: Promise<ArrayBuffer>;

  _session: CR.Session;
  _page: CR.Page;

  constructor(opts: ICrunchyrollPageProps) {
    super(opts);
    this._session = opts.session;
    this._page = opts.page;
  }

  _load(): Promise<string> {
    let imageTranslate = (image: Promise<ArrayBuffer>) => {
      return image.then(x => {
        let data = new Blob([x]);
        return URL.createObjectURL(data);
      });
    };

    if (this._imageData !== null) {
      return imageTranslate(this._imageData);
    }

    let url = CR.getUrl(this._page);
    let image = this._imageData = rx.Observable.fromPromise(fetch(url))
      .concatMap(x => x.blob())
      .concatMap(x => {
        let file = new FileReader();
        // The typescript type for the filereader's load event doesn't
        // have the right property on it.  See here for more information:
        // https://github.com/Microsoft/TypeScript/issues/4163
        let obs: rx.Observable<{target: {result: ArrayBuffer}}> = rx.Observable.fromEvent(file, "load");
        file.readAsArrayBuffer(x);
        return obs;
      })
      .map(e => CR.decryptManga(e.target.result))
      .toPromise();

    return imageTranslate(image);
  }

  _unload(url: string): void {
    URL.revokeObjectURL(url);
  }

  dispose(): void {
    super.dispose();
    this._imageData = null;
  }
}
