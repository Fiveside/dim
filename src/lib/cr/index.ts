import fetch from "node-fetch";
import * as rx from "rxjs";

// Many of the interfaces in this file are incomplete, more data is returned
// but its discarded.

// Currently running with the assumption that all locale objects have an enUS
// locale.

type EncryptedURL = string;
type URL = string;
type StringifiedNumber = string;

type ICrunchyrollReadingDirection = "left_to_right" | "right_to_left";
const CrunchyrollReadingDirection = {
  LTR: "left_to_right",
  RTL: "right_to_left",
};

export interface Session {
  deviceType: string;
  sessionId: string;
  countryCode: string;
  apiVersion: string;
  deviceId: string;
}

const API_DOMAIN = "api-manga.crunchyroll.com";
const DEVICE_TYPE_IPHONE = "com.crunchyroll.manga.iphone";
const ACCESS_TOKEN_IPHONE = "Ge9rurkgXzzmzZQ";
const API_VERSION = "1.0";

// Shitty random string function.
function randomString(len: number): string {
  let text: Array<string> = [];
  let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < len; i++ )
    text.push(possible.charAt(Math.floor(Math.random() * possible.length)));

  return text.join("");
}

function createDeviceId() {
  return "DimManga" + randomString(12);
}

function encodeParams(params: {[key: string]: string}) {
  let parts: string[] = [];
  for (let k of Object.keys(params)) {
    let key = encodeURIComponent(k);
    let val = encodeURIComponent(params[k]);
    parts.push(`${key}=${val}`);
  }
  let joined = parts.join("&");
  if (joined.length > 0) {
    joined = "?" + joined;
  }
  return joined;
}

interface ApiResponse<T> {
  data: T;
  error: boolean;
  code: string;
}

interface SessionResponse {
  session_id: string;
  country_code: string;
  user: string | null;
  auth: string | null;
}
// {
//   "data": {
//     "session_id": "xvxtkpyw5ijhr2pisnst02ggvu2rp4a2",
//     "country_code": "US",
//     "ip": "216.168.65.4",
//     "device_type": "com.crunchyroll.manga.android",
//     "device_id": "00000000-0000-0000-0000-000000000000",
//     "user": null,
//     "auth": null,
//     "expires": null,
//     "version": null,
//     "ops": [],
//     "connectivity_type": "unknown",
//     "debug": {
//       "init_app": 0.029106140136719,
//       "parsed_url": 8.6069107055664e-5,
//       "auth_an_client": 4.5061111450195e-5,
//       "locale": 0.00078201293945312,
//       "selector_fields": 9.5367431640625e-7,
//       "translations": 0.0032670497894287,
//       "pre_view": 0.00016307830810547,
//       "require_once": 6.6995620727539e-5,
//       "session_put": 9.5367431640625e-7,
//       "get_session": 3.0994415283203e-6,
//       "connectivity_type": 0.00092983245849609,
//       "ops": 0.0034568309783936
//     }
//   },
//   "error": false,
//   "code": "ok"
// }


// Maps to api call cr_start_session
export function createSession(): rx.Observable<Session> {
  let endpoint = "cr_start_session";
  const udid = createDeviceId();
  let payload = {
    api_ver: API_VERSION,
    device_type: DEVICE_TYPE_IPHONE,
    access_token: ACCESS_TOKEN_IPHONE,
    device_id: udid,
  };

  let url = `http://${API_DOMAIN}/${endpoint}` + encodeParams(payload);
  return rx.Observable.fromPromise(fetch(url, {
    method: "POST",
  }))
  .concatMap(x => x.json())
  .map((x: ApiResponse<SessionResponse>) => (<Session>{
    apiVersion: API_VERSION,
    countryCode: x.data.country_code,
    deviceId: udid,
    deviceType: DEVICE_TYPE_IPHONE,
    sessionId: x.data.session_id,
  }));
}

function commonParams(session: Session) {
  return {
    api_ver: session.apiVersion,
    device_type: session.deviceType,
    session_id: session.sessionId,
    country_code: session.countryCode,
  };
}

// Currently running with the idea that all locales have at least an enUS
// locale on them.
interface Locale<T> {
  enUS: T;
  [lname: string]: T;
}

interface SeriesLocale {
}
export interface Series {
  series_id: string;
  locale: Locale<{
    description: string;
    full_image_url: URL;
    landscape_image_url: URL;
    name: string;
    thumb_url: URL;
  }>;
  paid_content: boolean;
}

function listSeries(session: Session): rx.Observable<Array<Series>> {
  let endpoint = "list_series";
  let payload = Object.assign({}, commonParams(session));

  let url = `http://${API_DOMAIN}/${endpoint}` + encodeParams(payload);

  return rx.Observable.fromPromise(fetch(url, {
    method: "GET",
  }))
  .concatMap((x): Promise<Series[]> => x.json());
}

export interface Chapter {
  locale: Locale<{
    description: string;
    name: string;
  }>;
  reading_direction: ICrunchyrollReadingDirection,
  series_id: string;
  volume_id: string;
  volume_number: string;
}

function listChapters(session: Session, seriesId: string): rx.Observable<Chapter[]> {
  let endpoint = "list_chapters";
  let payload = Object.assign({series_id: seriesId}, commonParams(session));
  let url = `http://${API_DOMAIN}/${endpoint}` + encodeParams(payload);

  return rx.Observable.fromPromise(fetch(url, {
    method: "GET",
  }))
  .concatMap((x): Promise<{series: Series, chapters: Chapter[]}> => x.json())
  .map(x => x.chapters);
}

export interface Volume {
  volume_id: string;
  amazon_url: string;
  display_number: string;
  encrypted_image_url: EncryptedURL;
  locale: Locale<{
    name: string;
    description: string;
  }>;
  thumb_url: URL;
  read_direction: ICrunchyrollReadingDirection;
}

export interface Page {
  chapter_id: string;
  page_id: string;
  page_number: StringifiedNumber; // stringified integer.
  number: StringifiedNumber; // No idea wtf this is
  is_spread: boolean;
  image_url: EncryptedURL;  // not sure if this is the url we want
  thumb_url: URL;
  locale: Locale<{
    composed_image_height: StringifiedNumber;
    composed_image_width: StringifiedNumber;
    mobile_image_height: StringifiedNumber;
    mobile_image_width: StringifiedNumber;
    image_url: EncryptedURL;
    thumb_url: URL;
    encrypted_composed_image_url: EncryptedURL;
    encrypted_mobile_image_url: EncryptedURL;
  }>;

  // Panel geometry for each page.
  panels: Array<{
    number: StringifiedNumber;
    page_id: string;
    panel_id: string;
    polygon: Array<[number, number]>; // Points in the polygon Unsure what units.
  }>;
}


interface GetChapterResult {
  chapter: Chapter;
  pages: Array<Page>;
  volume: Volume;
  track_result: {
    success: string;
  };
}

// Api function list_chapter (individual chapter)
function getChapter(session: Session, chapterId: string): rx.Observable<GetChapterResult> {
  let endpoint = "list_chapter";
  let payload = Object.assign({chapter_id: chapterId}, commonParams(session));
  let url = `http://${API_DOMAIN}/${endpoint}` + encodeParams(payload);

  return rx.Observable.fromPromise(fetch(url, {
    method: "GET",
  }))
  .concatMap((x): Promise<GetChapterResult> => x.json());
}


export function getUrl(page: Page, locale: string = ""): EncryptedURL {
  if (page.locale[locale] != null) {
    return page.locale[locale].image_url;
  }
  return page.image_url;
}

export function getThumb(page: Page, locale: string = ""): URL {
  if (page.locale[locale] != null) {
    return page.locale[locale].thumb_url;
  }
  return page.thumb_url;
}

// Crunchyroll encrypts select images (usually those without a file extension)
// by xoring every byte by 66 (ascii capital B)
export function decryptManga(encrypted: ArrayBuffer): ArrayBuffer {
  let enc = new Uint8Array(encrypted);
  let dec = new Uint8Array(encrypted.byteLength);

  for (let i = enc.length - 1; i >= 0; --i) {
    dec[i] = enc[i] ^ 66;
  }
  return dec.buffer;
}

export function navLocale<T>(locale: Locale<T>): T {
  // Attempts to fetch the current user's language and navigate the locale based
  // on that.  If that fails, then it defaults to enUS since that seems to exist
  // on all objects.
  let currentLocale = navigator.language.replace(/-/, "");
  if (locale[currentLocale] != null) {
    return locale[currentLocale];
  }
  return locale.enUS;
}
