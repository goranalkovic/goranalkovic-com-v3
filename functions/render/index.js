var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[Object.keys(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[Object.keys(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};

// node_modules/@sveltejs/kit/dist/install-fetch.js
function dataUriToBuffer(uri) {
  if (!/^data:/i.test(uri)) {
    throw new TypeError('`uri` does not appear to be a Data URI (must begin with "data:")');
  }
  uri = uri.replace(/\r?\n/g, "");
  const firstComma = uri.indexOf(",");
  if (firstComma === -1 || firstComma <= 4) {
    throw new TypeError("malformed data: URI");
  }
  const meta = uri.substring(5, firstComma).split(";");
  let charset = "";
  let base64 = false;
  const type = meta[0] || "text/plain";
  let typeFull = type;
  for (let i = 1; i < meta.length; i++) {
    if (meta[i] === "base64") {
      base64 = true;
    } else {
      typeFull += `;${meta[i]}`;
      if (meta[i].indexOf("charset=") === 0) {
        charset = meta[i].substring(8);
      }
    }
  }
  if (!meta[0] && !charset.length) {
    typeFull += ";charset=US-ASCII";
    charset = "US-ASCII";
  }
  const encoding = base64 ? "base64" : "ascii";
  const data = unescape(uri.substring(firstComma + 1));
  const buffer = Buffer.from(data, encoding);
  buffer.type = type;
  buffer.typeFull = typeFull;
  buffer.charset = charset;
  return buffer;
}
async function* read(parts) {
  for (const part of parts) {
    if ("stream" in part) {
      yield* part.stream();
    } else {
      yield part;
    }
  }
}
function isFormData(object) {
  return typeof object === "object" && typeof object.append === "function" && typeof object.set === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.delete === "function" && typeof object.keys === "function" && typeof object.values === "function" && typeof object.entries === "function" && typeof object.constructor === "function" && object[NAME] === "FormData";
}
function getHeader(boundary, name, field) {
  let header = "";
  header += `${dashes}${boundary}${carriage}`;
  header += `Content-Disposition: form-data; name="${name}"`;
  if (isBlob(field)) {
    header += `; filename="${field.name}"${carriage}`;
    header += `Content-Type: ${field.type || "application/octet-stream"}`;
  }
  return `${header}${carriage.repeat(2)}`;
}
async function* formDataIterator(form, boundary) {
  for (const [name, value] of form) {
    yield getHeader(boundary, name, value);
    if (isBlob(value)) {
      yield* value.stream();
    } else {
      yield value;
    }
    yield carriage;
  }
  yield getFooter(boundary);
}
function getFormDataLength(form, boundary) {
  let length = 0;
  for (const [name, value] of form) {
    length += Buffer.byteLength(getHeader(boundary, name, value));
    if (isBlob(value)) {
      length += value.size;
    } else {
      length += Buffer.byteLength(String(value));
    }
    length += carriageLength;
  }
  length += Buffer.byteLength(getFooter(boundary));
  return length;
}
async function consumeBody(data) {
  if (data[INTERNALS$2].disturbed) {
    throw new TypeError(`body used already for: ${data.url}`);
  }
  data[INTERNALS$2].disturbed = true;
  if (data[INTERNALS$2].error) {
    throw data[INTERNALS$2].error;
  }
  let { body } = data;
  if (body === null) {
    return Buffer.alloc(0);
  }
  if (isBlob(body)) {
    body = body.stream();
  }
  if (Buffer.isBuffer(body)) {
    return body;
  }
  if (!(body instanceof import_stream.default)) {
    return Buffer.alloc(0);
  }
  const accum = [];
  let accumBytes = 0;
  try {
    for await (const chunk of body) {
      if (data.size > 0 && accumBytes + chunk.length > data.size) {
        const err = new FetchError(`content size at ${data.url} over limit: ${data.size}`, "max-size");
        body.destroy(err);
        throw err;
      }
      accumBytes += chunk.length;
      accum.push(chunk);
    }
  } catch (error3) {
    if (error3 instanceof FetchBaseError) {
      throw error3;
    } else {
      throw new FetchError(`Invalid response body while trying to fetch ${data.url}: ${error3.message}`, "system", error3);
    }
  }
  if (body.readableEnded === true || body._readableState.ended === true) {
    try {
      if (accum.every((c) => typeof c === "string")) {
        return Buffer.from(accum.join(""));
      }
      return Buffer.concat(accum, accumBytes);
    } catch (error3) {
      throw new FetchError(`Could not create Buffer from response body for ${data.url}: ${error3.message}`, "system", error3);
    }
  } else {
    throw new FetchError(`Premature close of server response while trying to fetch ${data.url}`);
  }
}
function fromRawHeaders(headers = []) {
  return new Headers(headers.reduce((result, value, index2, array) => {
    if (index2 % 2 === 0) {
      result.push(array.slice(index2, index2 + 2));
    }
    return result;
  }, []).filter(([name, value]) => {
    try {
      validateHeaderName(name);
      validateHeaderValue(name, String(value));
      return true;
    } catch {
      return false;
    }
  }));
}
async function fetch(url, options_) {
  return new Promise((resolve2, reject) => {
    const request = new Request(url, options_);
    const options2 = getNodeRequestOptions(request);
    if (!supportedSchemas.has(options2.protocol)) {
      throw new TypeError(`node-fetch cannot load ${url}. URL scheme "${options2.protocol.replace(/:$/, "")}" is not supported.`);
    }
    if (options2.protocol === "data:") {
      const data = src(request.url);
      const response2 = new Response(data, { headers: { "Content-Type": data.typeFull } });
      resolve2(response2);
      return;
    }
    const send = (options2.protocol === "https:" ? import_https.default : import_http.default).request;
    const { signal } = request;
    let response = null;
    const abort = () => {
      const error3 = new AbortError("The operation was aborted.");
      reject(error3);
      if (request.body && request.body instanceof import_stream.default.Readable) {
        request.body.destroy(error3);
      }
      if (!response || !response.body) {
        return;
      }
      response.body.emit("error", error3);
    };
    if (signal && signal.aborted) {
      abort();
      return;
    }
    const abortAndFinalize = () => {
      abort();
      finalize();
    };
    const request_ = send(options2);
    if (signal) {
      signal.addEventListener("abort", abortAndFinalize);
    }
    const finalize = () => {
      request_.abort();
      if (signal) {
        signal.removeEventListener("abort", abortAndFinalize);
      }
    };
    request_.on("error", (err) => {
      reject(new FetchError(`request to ${request.url} failed, reason: ${err.message}`, "system", err));
      finalize();
    });
    request_.on("response", (response_) => {
      request_.setTimeout(0);
      const headers = fromRawHeaders(response_.rawHeaders);
      if (isRedirect(response_.statusCode)) {
        const location = headers.get("Location");
        const locationURL = location === null ? null : new URL(location, request.url);
        switch (request.redirect) {
          case "error":
            reject(new FetchError(`uri requested responds with a redirect, redirect mode is set to error: ${request.url}`, "no-redirect"));
            finalize();
            return;
          case "manual":
            if (locationURL !== null) {
              try {
                headers.set("Location", locationURL);
              } catch (error3) {
                reject(error3);
              }
            }
            break;
          case "follow": {
            if (locationURL === null) {
              break;
            }
            if (request.counter >= request.follow) {
              reject(new FetchError(`maximum redirect reached at: ${request.url}`, "max-redirect"));
              finalize();
              return;
            }
            const requestOptions = {
              headers: new Headers(request.headers),
              follow: request.follow,
              counter: request.counter + 1,
              agent: request.agent,
              compress: request.compress,
              method: request.method,
              body: request.body,
              signal: request.signal,
              size: request.size
            };
            if (response_.statusCode !== 303 && request.body && options_.body instanceof import_stream.default.Readable) {
              reject(new FetchError("Cannot follow redirect with body being a readable stream", "unsupported-redirect"));
              finalize();
              return;
            }
            if (response_.statusCode === 303 || (response_.statusCode === 301 || response_.statusCode === 302) && request.method === "POST") {
              requestOptions.method = "GET";
              requestOptions.body = void 0;
              requestOptions.headers.delete("content-length");
            }
            resolve2(fetch(new Request(locationURL, requestOptions)));
            finalize();
            return;
          }
        }
      }
      response_.once("end", () => {
        if (signal) {
          signal.removeEventListener("abort", abortAndFinalize);
        }
      });
      let body = (0, import_stream.pipeline)(response_, new import_stream.PassThrough(), (error3) => {
        reject(error3);
      });
      if (process.version < "v12.10") {
        response_.on("aborted", abortAndFinalize);
      }
      const responseOptions = {
        url: request.url,
        status: response_.statusCode,
        statusText: response_.statusMessage,
        headers,
        size: request.size,
        counter: request.counter,
        highWaterMark: request.highWaterMark
      };
      const codings = headers.get("Content-Encoding");
      if (!request.compress || request.method === "HEAD" || codings === null || response_.statusCode === 204 || response_.statusCode === 304) {
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      const zlibOptions = {
        flush: import_zlib.default.Z_SYNC_FLUSH,
        finishFlush: import_zlib.default.Z_SYNC_FLUSH
      };
      if (codings === "gzip" || codings === "x-gzip") {
        body = (0, import_stream.pipeline)(body, import_zlib.default.createGunzip(zlibOptions), (error3) => {
          reject(error3);
        });
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      if (codings === "deflate" || codings === "x-deflate") {
        const raw = (0, import_stream.pipeline)(response_, new import_stream.PassThrough(), (error3) => {
          reject(error3);
        });
        raw.once("data", (chunk) => {
          if ((chunk[0] & 15) === 8) {
            body = (0, import_stream.pipeline)(body, import_zlib.default.createInflate(), (error3) => {
              reject(error3);
            });
          } else {
            body = (0, import_stream.pipeline)(body, import_zlib.default.createInflateRaw(), (error3) => {
              reject(error3);
            });
          }
          response = new Response(body, responseOptions);
          resolve2(response);
        });
        return;
      }
      if (codings === "br") {
        body = (0, import_stream.pipeline)(body, import_zlib.default.createBrotliDecompress(), (error3) => {
          reject(error3);
        });
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      response = new Response(body, responseOptions);
      resolve2(response);
    });
    writeToStream(request_, request);
  });
}
var import_http, import_https, import_zlib, import_stream, import_util, import_crypto, import_url, src, Readable, wm, Blob, fetchBlob, FetchBaseError, FetchError, NAME, isURLSearchParameters, isBlob, isAbortSignal, carriage, dashes, carriageLength, getFooter, getBoundary, INTERNALS$2, Body, clone, extractContentType, getTotalBytes, writeToStream, validateHeaderName, validateHeaderValue, Headers, redirectStatus, isRedirect, INTERNALS$1, Response, getSearch, INTERNALS, isRequest, Request, getNodeRequestOptions, AbortError, supportedSchemas;
var init_install_fetch = __esm({
  "node_modules/@sveltejs/kit/dist/install-fetch.js"() {
    init_shims();
    import_http = __toModule(require("http"));
    import_https = __toModule(require("https"));
    import_zlib = __toModule(require("zlib"));
    import_stream = __toModule(require("stream"));
    import_util = __toModule(require("util"));
    import_crypto = __toModule(require("crypto"));
    import_url = __toModule(require("url"));
    src = dataUriToBuffer;
    ({ Readable } = import_stream.default);
    wm = new WeakMap();
    Blob = class {
      constructor(blobParts = [], options2 = {}) {
        let size = 0;
        const parts = blobParts.map((element) => {
          let buffer;
          if (element instanceof Buffer) {
            buffer = element;
          } else if (ArrayBuffer.isView(element)) {
            buffer = Buffer.from(element.buffer, element.byteOffset, element.byteLength);
          } else if (element instanceof ArrayBuffer) {
            buffer = Buffer.from(element);
          } else if (element instanceof Blob) {
            buffer = element;
          } else {
            buffer = Buffer.from(typeof element === "string" ? element : String(element));
          }
          size += buffer.length || buffer.size || 0;
          return buffer;
        });
        const type = options2.type === void 0 ? "" : String(options2.type).toLowerCase();
        wm.set(this, {
          type: /[^\u0020-\u007E]/.test(type) ? "" : type,
          size,
          parts
        });
      }
      get size() {
        return wm.get(this).size;
      }
      get type() {
        return wm.get(this).type;
      }
      async text() {
        return Buffer.from(await this.arrayBuffer()).toString();
      }
      async arrayBuffer() {
        const data = new Uint8Array(this.size);
        let offset = 0;
        for await (const chunk of this.stream()) {
          data.set(chunk, offset);
          offset += chunk.length;
        }
        return data.buffer;
      }
      stream() {
        return Readable.from(read(wm.get(this).parts));
      }
      slice(start = 0, end = this.size, type = "") {
        const { size } = this;
        let relativeStart = start < 0 ? Math.max(size + start, 0) : Math.min(start, size);
        let relativeEnd = end < 0 ? Math.max(size + end, 0) : Math.min(end, size);
        const span = Math.max(relativeEnd - relativeStart, 0);
        const parts = wm.get(this).parts.values();
        const blobParts = [];
        let added = 0;
        for (const part of parts) {
          const size2 = ArrayBuffer.isView(part) ? part.byteLength : part.size;
          if (relativeStart && size2 <= relativeStart) {
            relativeStart -= size2;
            relativeEnd -= size2;
          } else {
            const chunk = part.slice(relativeStart, Math.min(size2, relativeEnd));
            blobParts.push(chunk);
            added += ArrayBuffer.isView(chunk) ? chunk.byteLength : chunk.size;
            relativeStart = 0;
            if (added >= span) {
              break;
            }
          }
        }
        const blob = new Blob([], { type: String(type).toLowerCase() });
        Object.assign(wm.get(blob), { size: span, parts: blobParts });
        return blob;
      }
      get [Symbol.toStringTag]() {
        return "Blob";
      }
      static [Symbol.hasInstance](object) {
        return object && typeof object === "object" && typeof object.stream === "function" && object.stream.length === 0 && typeof object.constructor === "function" && /^(Blob|File)$/.test(object[Symbol.toStringTag]);
      }
    };
    Object.defineProperties(Blob.prototype, {
      size: { enumerable: true },
      type: { enumerable: true },
      slice: { enumerable: true }
    });
    fetchBlob = Blob;
    FetchBaseError = class extends Error {
      constructor(message, type) {
        super(message);
        Error.captureStackTrace(this, this.constructor);
        this.type = type;
      }
      get name() {
        return this.constructor.name;
      }
      get [Symbol.toStringTag]() {
        return this.constructor.name;
      }
    };
    FetchError = class extends FetchBaseError {
      constructor(message, type, systemError) {
        super(message, type);
        if (systemError) {
          this.code = this.errno = systemError.code;
          this.erroredSysCall = systemError.syscall;
        }
      }
    };
    NAME = Symbol.toStringTag;
    isURLSearchParameters = (object) => {
      return typeof object === "object" && typeof object.append === "function" && typeof object.delete === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.has === "function" && typeof object.set === "function" && typeof object.sort === "function" && object[NAME] === "URLSearchParams";
    };
    isBlob = (object) => {
      return typeof object === "object" && typeof object.arrayBuffer === "function" && typeof object.type === "string" && typeof object.stream === "function" && typeof object.constructor === "function" && /^(Blob|File)$/.test(object[NAME]);
    };
    isAbortSignal = (object) => {
      return typeof object === "object" && object[NAME] === "AbortSignal";
    };
    carriage = "\r\n";
    dashes = "-".repeat(2);
    carriageLength = Buffer.byteLength(carriage);
    getFooter = (boundary) => `${dashes}${boundary}${dashes}${carriage.repeat(2)}`;
    getBoundary = () => (0, import_crypto.randomBytes)(8).toString("hex");
    INTERNALS$2 = Symbol("Body internals");
    Body = class {
      constructor(body, {
        size = 0
      } = {}) {
        let boundary = null;
        if (body === null) {
          body = null;
        } else if (isURLSearchParameters(body)) {
          body = Buffer.from(body.toString());
        } else if (isBlob(body))
          ;
        else if (Buffer.isBuffer(body))
          ;
        else if (import_util.types.isAnyArrayBuffer(body)) {
          body = Buffer.from(body);
        } else if (ArrayBuffer.isView(body)) {
          body = Buffer.from(body.buffer, body.byteOffset, body.byteLength);
        } else if (body instanceof import_stream.default)
          ;
        else if (isFormData(body)) {
          boundary = `NodeFetchFormDataBoundary${getBoundary()}`;
          body = import_stream.default.Readable.from(formDataIterator(body, boundary));
        } else {
          body = Buffer.from(String(body));
        }
        this[INTERNALS$2] = {
          body,
          boundary,
          disturbed: false,
          error: null
        };
        this.size = size;
        if (body instanceof import_stream.default) {
          body.on("error", (err) => {
            const error3 = err instanceof FetchBaseError ? err : new FetchError(`Invalid response body while trying to fetch ${this.url}: ${err.message}`, "system", err);
            this[INTERNALS$2].error = error3;
          });
        }
      }
      get body() {
        return this[INTERNALS$2].body;
      }
      get bodyUsed() {
        return this[INTERNALS$2].disturbed;
      }
      async arrayBuffer() {
        const { buffer, byteOffset, byteLength } = await consumeBody(this);
        return buffer.slice(byteOffset, byteOffset + byteLength);
      }
      async blob() {
        const ct = this.headers && this.headers.get("content-type") || this[INTERNALS$2].body && this[INTERNALS$2].body.type || "";
        const buf = await this.buffer();
        return new fetchBlob([buf], {
          type: ct
        });
      }
      async json() {
        const buffer = await consumeBody(this);
        return JSON.parse(buffer.toString());
      }
      async text() {
        const buffer = await consumeBody(this);
        return buffer.toString();
      }
      buffer() {
        return consumeBody(this);
      }
    };
    Object.defineProperties(Body.prototype, {
      body: { enumerable: true },
      bodyUsed: { enumerable: true },
      arrayBuffer: { enumerable: true },
      blob: { enumerable: true },
      json: { enumerable: true },
      text: { enumerable: true }
    });
    clone = (instance, highWaterMark) => {
      let p1;
      let p2;
      let { body } = instance;
      if (instance.bodyUsed) {
        throw new Error("cannot clone body after it is used");
      }
      if (body instanceof import_stream.default && typeof body.getBoundary !== "function") {
        p1 = new import_stream.PassThrough({ highWaterMark });
        p2 = new import_stream.PassThrough({ highWaterMark });
        body.pipe(p1);
        body.pipe(p2);
        instance[INTERNALS$2].body = p1;
        body = p2;
      }
      return body;
    };
    extractContentType = (body, request) => {
      if (body === null) {
        return null;
      }
      if (typeof body === "string") {
        return "text/plain;charset=UTF-8";
      }
      if (isURLSearchParameters(body)) {
        return "application/x-www-form-urlencoded;charset=UTF-8";
      }
      if (isBlob(body)) {
        return body.type || null;
      }
      if (Buffer.isBuffer(body) || import_util.types.isAnyArrayBuffer(body) || ArrayBuffer.isView(body)) {
        return null;
      }
      if (body && typeof body.getBoundary === "function") {
        return `multipart/form-data;boundary=${body.getBoundary()}`;
      }
      if (isFormData(body)) {
        return `multipart/form-data; boundary=${request[INTERNALS$2].boundary}`;
      }
      if (body instanceof import_stream.default) {
        return null;
      }
      return "text/plain;charset=UTF-8";
    };
    getTotalBytes = (request) => {
      const { body } = request;
      if (body === null) {
        return 0;
      }
      if (isBlob(body)) {
        return body.size;
      }
      if (Buffer.isBuffer(body)) {
        return body.length;
      }
      if (body && typeof body.getLengthSync === "function") {
        return body.hasKnownLength && body.hasKnownLength() ? body.getLengthSync() : null;
      }
      if (isFormData(body)) {
        return getFormDataLength(request[INTERNALS$2].boundary);
      }
      return null;
    };
    writeToStream = (dest, { body }) => {
      if (body === null) {
        dest.end();
      } else if (isBlob(body)) {
        body.stream().pipe(dest);
      } else if (Buffer.isBuffer(body)) {
        dest.write(body);
        dest.end();
      } else {
        body.pipe(dest);
      }
    };
    validateHeaderName = typeof import_http.default.validateHeaderName === "function" ? import_http.default.validateHeaderName : (name) => {
      if (!/^[\^`\-\w!#$%&'*+.|~]+$/.test(name)) {
        const err = new TypeError(`Header name must be a valid HTTP token [${name}]`);
        Object.defineProperty(err, "code", { value: "ERR_INVALID_HTTP_TOKEN" });
        throw err;
      }
    };
    validateHeaderValue = typeof import_http.default.validateHeaderValue === "function" ? import_http.default.validateHeaderValue : (name, value) => {
      if (/[^\t\u0020-\u007E\u0080-\u00FF]/.test(value)) {
        const err = new TypeError(`Invalid character in header content ["${name}"]`);
        Object.defineProperty(err, "code", { value: "ERR_INVALID_CHAR" });
        throw err;
      }
    };
    Headers = class extends URLSearchParams {
      constructor(init2) {
        let result = [];
        if (init2 instanceof Headers) {
          const raw = init2.raw();
          for (const [name, values] of Object.entries(raw)) {
            result.push(...values.map((value) => [name, value]));
          }
        } else if (init2 == null)
          ;
        else if (typeof init2 === "object" && !import_util.types.isBoxedPrimitive(init2)) {
          const method = init2[Symbol.iterator];
          if (method == null) {
            result.push(...Object.entries(init2));
          } else {
            if (typeof method !== "function") {
              throw new TypeError("Header pairs must be iterable");
            }
            result = [...init2].map((pair) => {
              if (typeof pair !== "object" || import_util.types.isBoxedPrimitive(pair)) {
                throw new TypeError("Each header pair must be an iterable object");
              }
              return [...pair];
            }).map((pair) => {
              if (pair.length !== 2) {
                throw new TypeError("Each header pair must be a name/value tuple");
              }
              return [...pair];
            });
          }
        } else {
          throw new TypeError("Failed to construct 'Headers': The provided value is not of type '(sequence<sequence<ByteString>> or record<ByteString, ByteString>)");
        }
        result = result.length > 0 ? result.map(([name, value]) => {
          validateHeaderName(name);
          validateHeaderValue(name, String(value));
          return [String(name).toLowerCase(), String(value)];
        }) : void 0;
        super(result);
        return new Proxy(this, {
          get(target, p, receiver) {
            switch (p) {
              case "append":
              case "set":
                return (name, value) => {
                  validateHeaderName(name);
                  validateHeaderValue(name, String(value));
                  return URLSearchParams.prototype[p].call(receiver, String(name).toLowerCase(), String(value));
                };
              case "delete":
              case "has":
              case "getAll":
                return (name) => {
                  validateHeaderName(name);
                  return URLSearchParams.prototype[p].call(receiver, String(name).toLowerCase());
                };
              case "keys":
                return () => {
                  target.sort();
                  return new Set(URLSearchParams.prototype.keys.call(target)).keys();
                };
              default:
                return Reflect.get(target, p, receiver);
            }
          }
        });
      }
      get [Symbol.toStringTag]() {
        return this.constructor.name;
      }
      toString() {
        return Object.prototype.toString.call(this);
      }
      get(name) {
        const values = this.getAll(name);
        if (values.length === 0) {
          return null;
        }
        let value = values.join(", ");
        if (/^content-encoding$/i.test(name)) {
          value = value.toLowerCase();
        }
        return value;
      }
      forEach(callback) {
        for (const name of this.keys()) {
          callback(this.get(name), name);
        }
      }
      *values() {
        for (const name of this.keys()) {
          yield this.get(name);
        }
      }
      *entries() {
        for (const name of this.keys()) {
          yield [name, this.get(name)];
        }
      }
      [Symbol.iterator]() {
        return this.entries();
      }
      raw() {
        return [...this.keys()].reduce((result, key) => {
          result[key] = this.getAll(key);
          return result;
        }, {});
      }
      [Symbol.for("nodejs.util.inspect.custom")]() {
        return [...this.keys()].reduce((result, key) => {
          const values = this.getAll(key);
          if (key === "host") {
            result[key] = values[0];
          } else {
            result[key] = values.length > 1 ? values : values[0];
          }
          return result;
        }, {});
      }
    };
    Object.defineProperties(Headers.prototype, ["get", "entries", "forEach", "values"].reduce((result, property) => {
      result[property] = { enumerable: true };
      return result;
    }, {}));
    redirectStatus = new Set([301, 302, 303, 307, 308]);
    isRedirect = (code) => {
      return redirectStatus.has(code);
    };
    INTERNALS$1 = Symbol("Response internals");
    Response = class extends Body {
      constructor(body = null, options2 = {}) {
        super(body, options2);
        const status = options2.status || 200;
        const headers = new Headers(options2.headers);
        if (body !== null && !headers.has("Content-Type")) {
          const contentType = extractContentType(body);
          if (contentType) {
            headers.append("Content-Type", contentType);
          }
        }
        this[INTERNALS$1] = {
          url: options2.url,
          status,
          statusText: options2.statusText || "",
          headers,
          counter: options2.counter,
          highWaterMark: options2.highWaterMark
        };
      }
      get url() {
        return this[INTERNALS$1].url || "";
      }
      get status() {
        return this[INTERNALS$1].status;
      }
      get ok() {
        return this[INTERNALS$1].status >= 200 && this[INTERNALS$1].status < 300;
      }
      get redirected() {
        return this[INTERNALS$1].counter > 0;
      }
      get statusText() {
        return this[INTERNALS$1].statusText;
      }
      get headers() {
        return this[INTERNALS$1].headers;
      }
      get highWaterMark() {
        return this[INTERNALS$1].highWaterMark;
      }
      clone() {
        return new Response(clone(this, this.highWaterMark), {
          url: this.url,
          status: this.status,
          statusText: this.statusText,
          headers: this.headers,
          ok: this.ok,
          redirected: this.redirected,
          size: this.size
        });
      }
      static redirect(url, status = 302) {
        if (!isRedirect(status)) {
          throw new RangeError('Failed to execute "redirect" on "response": Invalid status code');
        }
        return new Response(null, {
          headers: {
            location: new URL(url).toString()
          },
          status
        });
      }
      get [Symbol.toStringTag]() {
        return "Response";
      }
    };
    Object.defineProperties(Response.prototype, {
      url: { enumerable: true },
      status: { enumerable: true },
      ok: { enumerable: true },
      redirected: { enumerable: true },
      statusText: { enumerable: true },
      headers: { enumerable: true },
      clone: { enumerable: true }
    });
    getSearch = (parsedURL) => {
      if (parsedURL.search) {
        return parsedURL.search;
      }
      const lastOffset = parsedURL.href.length - 1;
      const hash2 = parsedURL.hash || (parsedURL.href[lastOffset] === "#" ? "#" : "");
      return parsedURL.href[lastOffset - hash2.length] === "?" ? "?" : "";
    };
    INTERNALS = Symbol("Request internals");
    isRequest = (object) => {
      return typeof object === "object" && typeof object[INTERNALS] === "object";
    };
    Request = class extends Body {
      constructor(input, init2 = {}) {
        let parsedURL;
        if (isRequest(input)) {
          parsedURL = new URL(input.url);
        } else {
          parsedURL = new URL(input);
          input = {};
        }
        let method = init2.method || input.method || "GET";
        method = method.toUpperCase();
        if ((init2.body != null || isRequest(input)) && input.body !== null && (method === "GET" || method === "HEAD")) {
          throw new TypeError("Request with GET/HEAD method cannot have body");
        }
        const inputBody = init2.body ? init2.body : isRequest(input) && input.body !== null ? clone(input) : null;
        super(inputBody, {
          size: init2.size || input.size || 0
        });
        const headers = new Headers(init2.headers || input.headers || {});
        if (inputBody !== null && !headers.has("Content-Type")) {
          const contentType = extractContentType(inputBody, this);
          if (contentType) {
            headers.append("Content-Type", contentType);
          }
        }
        let signal = isRequest(input) ? input.signal : null;
        if ("signal" in init2) {
          signal = init2.signal;
        }
        if (signal !== null && !isAbortSignal(signal)) {
          throw new TypeError("Expected signal to be an instanceof AbortSignal");
        }
        this[INTERNALS] = {
          method,
          redirect: init2.redirect || input.redirect || "follow",
          headers,
          parsedURL,
          signal
        };
        this.follow = init2.follow === void 0 ? input.follow === void 0 ? 20 : input.follow : init2.follow;
        this.compress = init2.compress === void 0 ? input.compress === void 0 ? true : input.compress : init2.compress;
        this.counter = init2.counter || input.counter || 0;
        this.agent = init2.agent || input.agent;
        this.highWaterMark = init2.highWaterMark || input.highWaterMark || 16384;
        this.insecureHTTPParser = init2.insecureHTTPParser || input.insecureHTTPParser || false;
      }
      get method() {
        return this[INTERNALS].method;
      }
      get url() {
        return (0, import_url.format)(this[INTERNALS].parsedURL);
      }
      get headers() {
        return this[INTERNALS].headers;
      }
      get redirect() {
        return this[INTERNALS].redirect;
      }
      get signal() {
        return this[INTERNALS].signal;
      }
      clone() {
        return new Request(this);
      }
      get [Symbol.toStringTag]() {
        return "Request";
      }
    };
    Object.defineProperties(Request.prototype, {
      method: { enumerable: true },
      url: { enumerable: true },
      headers: { enumerable: true },
      redirect: { enumerable: true },
      clone: { enumerable: true },
      signal: { enumerable: true }
    });
    getNodeRequestOptions = (request) => {
      const { parsedURL } = request[INTERNALS];
      const headers = new Headers(request[INTERNALS].headers);
      if (!headers.has("Accept")) {
        headers.set("Accept", "*/*");
      }
      let contentLengthValue = null;
      if (request.body === null && /^(post|put)$/i.test(request.method)) {
        contentLengthValue = "0";
      }
      if (request.body !== null) {
        const totalBytes = getTotalBytes(request);
        if (typeof totalBytes === "number" && !Number.isNaN(totalBytes)) {
          contentLengthValue = String(totalBytes);
        }
      }
      if (contentLengthValue) {
        headers.set("Content-Length", contentLengthValue);
      }
      if (!headers.has("User-Agent")) {
        headers.set("User-Agent", "node-fetch");
      }
      if (request.compress && !headers.has("Accept-Encoding")) {
        headers.set("Accept-Encoding", "gzip,deflate,br");
      }
      let { agent } = request;
      if (typeof agent === "function") {
        agent = agent(parsedURL);
      }
      if (!headers.has("Connection") && !agent) {
        headers.set("Connection", "close");
      }
      const search = getSearch(parsedURL);
      const requestOptions = {
        path: parsedURL.pathname + search,
        pathname: parsedURL.pathname,
        hostname: parsedURL.hostname,
        protocol: parsedURL.protocol,
        port: parsedURL.port,
        hash: parsedURL.hash,
        search: parsedURL.search,
        query: parsedURL.query,
        href: parsedURL.href,
        method: request.method,
        headers: headers[Symbol.for("nodejs.util.inspect.custom")](),
        insecureHTTPParser: request.insecureHTTPParser,
        agent
      };
      return requestOptions;
    };
    AbortError = class extends FetchBaseError {
      constructor(message, type = "aborted") {
        super(message, type);
      }
    };
    supportedSchemas = new Set(["data:", "http:", "https:"]);
  }
});

// node_modules/@sveltejs/adapter-netlify/files/shims.js
var init_shims = __esm({
  "node_modules/@sveltejs/adapter-netlify/files/shims.js"() {
    init_install_fetch();
  }
});

// node_modules/cookie/index.js
var require_cookie = __commonJS({
  "node_modules/cookie/index.js"(exports) {
    init_shims();
    "use strict";
    exports.parse = parse;
    exports.serialize = serialize;
    var decode = decodeURIComponent;
    var encode = encodeURIComponent;
    var pairSplitRegExp = /; */;
    var fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;
    function parse(str, options2) {
      if (typeof str !== "string") {
        throw new TypeError("argument str must be a string");
      }
      var obj = {};
      var opt = options2 || {};
      var pairs = str.split(pairSplitRegExp);
      var dec = opt.decode || decode;
      for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i];
        var eq_idx = pair.indexOf("=");
        if (eq_idx < 0) {
          continue;
        }
        var key = pair.substr(0, eq_idx).trim();
        var val = pair.substr(++eq_idx, pair.length).trim();
        if (val[0] == '"') {
          val = val.slice(1, -1);
        }
        if (obj[key] == void 0) {
          obj[key] = tryDecode(val, dec);
        }
      }
      return obj;
    }
    function serialize(name, val, options2) {
      var opt = options2 || {};
      var enc = opt.encode || encode;
      if (typeof enc !== "function") {
        throw new TypeError("option encode is invalid");
      }
      if (!fieldContentRegExp.test(name)) {
        throw new TypeError("argument name is invalid");
      }
      var value = enc(val);
      if (value && !fieldContentRegExp.test(value)) {
        throw new TypeError("argument val is invalid");
      }
      var str = name + "=" + value;
      if (opt.maxAge != null) {
        var maxAge = opt.maxAge - 0;
        if (isNaN(maxAge) || !isFinite(maxAge)) {
          throw new TypeError("option maxAge is invalid");
        }
        str += "; Max-Age=" + Math.floor(maxAge);
      }
      if (opt.domain) {
        if (!fieldContentRegExp.test(opt.domain)) {
          throw new TypeError("option domain is invalid");
        }
        str += "; Domain=" + opt.domain;
      }
      if (opt.path) {
        if (!fieldContentRegExp.test(opt.path)) {
          throw new TypeError("option path is invalid");
        }
        str += "; Path=" + opt.path;
      }
      if (opt.expires) {
        if (typeof opt.expires.toUTCString !== "function") {
          throw new TypeError("option expires is invalid");
        }
        str += "; Expires=" + opt.expires.toUTCString();
      }
      if (opt.httpOnly) {
        str += "; HttpOnly";
      }
      if (opt.secure) {
        str += "; Secure";
      }
      if (opt.sameSite) {
        var sameSite = typeof opt.sameSite === "string" ? opt.sameSite.toLowerCase() : opt.sameSite;
        switch (sameSite) {
          case true:
            str += "; SameSite=Strict";
            break;
          case "lax":
            str += "; SameSite=Lax";
            break;
          case "strict":
            str += "; SameSite=Strict";
            break;
          case "none":
            str += "; SameSite=None";
            break;
          default:
            throw new TypeError("option sameSite is invalid");
        }
      }
      return str;
    }
    function tryDecode(str, decode2) {
      try {
        return decode2(str);
      } catch (e) {
        return str;
      }
    }
  }
});

// node_modules/svelte/internal/index.js
var require_internal = __commonJS({
  "node_modules/svelte/internal/index.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function noop3() {
    }
    var identity = (x) => x;
    function assign(tar, src2) {
      for (const k in src2)
        tar[k] = src2[k];
      return tar;
    }
    function is_promise(value) {
      return value && typeof value === "object" && typeof value.then === "function";
    }
    function add_location(element2, file, line, column, char) {
      element2.__svelte_meta = {
        loc: { file, line, column, char }
      };
    }
    function run2(fn) {
      return fn();
    }
    function blank_object2() {
      return Object.create(null);
    }
    function run_all2(fns) {
      fns.forEach(run2);
    }
    function is_function(thing) {
      return typeof thing === "function";
    }
    function safe_not_equal3(a, b) {
      return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
    }
    var src_url_equal_anchor;
    function src_url_equal(element_src, url) {
      if (!src_url_equal_anchor) {
        src_url_equal_anchor = document.createElement("a");
      }
      src_url_equal_anchor.href = url;
      return element_src === src_url_equal_anchor.href;
    }
    function not_equal(a, b) {
      return a != a ? b == b : a !== b;
    }
    function is_empty(obj) {
      return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
      if (store != null && typeof store.subscribe !== "function") {
        throw new Error(`'${name}' is not a store with a 'subscribe' method`);
      }
    }
    function subscribe2(store, ...callbacks) {
      if (store == null) {
        return noop3;
      }
      const unsub = store.subscribe(...callbacks);
      return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
      let value;
      subscribe2(store, (_) => value = _)();
      return value;
    }
    function component_subscribe(component, store, callback) {
      component.$$.on_destroy.push(subscribe2(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
      if (definition) {
        const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
        return definition[0](slot_ctx);
      }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
      return definition[1] && fn ? assign($$scope.ctx.slice(), definition[1](fn(ctx))) : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
      if (definition[2] && fn) {
        const lets = definition[2](fn(dirty));
        if ($$scope.dirty === void 0) {
          return lets;
        }
        if (typeof lets === "object") {
          const merged = [];
          const len = Math.max($$scope.dirty.length, lets.length);
          for (let i = 0; i < len; i += 1) {
            merged[i] = $$scope.dirty[i] | lets[i];
          }
          return merged;
        }
        return $$scope.dirty | lets;
      }
      return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
      const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
      if (slot_changes) {
        const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
        slot.p(slot_context, slot_changes);
      }
    }
    function update_slot_spread(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_spread_changes_fn, get_slot_context_fn) {
      const slot_changes = get_slot_spread_changes_fn(dirty) | get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
      if (slot_changes) {
        const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
        slot.p(slot_context, slot_changes);
      }
    }
    function exclude_internal_props(props) {
      const result = {};
      for (const k in props)
        if (k[0] !== "$")
          result[k] = props[k];
      return result;
    }
    function compute_rest_props(props, keys) {
      const rest = {};
      keys = new Set(keys);
      for (const k in props)
        if (!keys.has(k) && k[0] !== "$")
          rest[k] = props[k];
      return rest;
    }
    function compute_slots(slots) {
      const result = {};
      for (const key in slots) {
        result[key] = true;
      }
      return result;
    }
    function once(fn) {
      let ran = false;
      return function(...args) {
        if (ran)
          return;
        ran = true;
        fn.call(this, ...args);
      };
    }
    function null_to_empty(value) {
      return value == null ? "" : value;
    }
    function set_store_value(store, ret, value = ret) {
      store.set(value);
      return ret;
    }
    var has_prop = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);
    function action_destroyer(action_result) {
      return action_result && is_function(action_result.destroy) ? action_result.destroy : noop3;
    }
    var is_client = typeof window !== "undefined";
    exports.now = is_client ? () => window.performance.now() : () => Date.now();
    exports.raf = is_client ? (cb) => requestAnimationFrame(cb) : noop3;
    function set_now(fn) {
      exports.now = fn;
    }
    function set_raf(fn) {
      exports.raf = fn;
    }
    var tasks = new Set();
    function run_tasks(now) {
      tasks.forEach((task) => {
        if (!task.c(now)) {
          tasks.delete(task);
          task.f();
        }
      });
      if (tasks.size !== 0)
        exports.raf(run_tasks);
    }
    function clear_loops() {
      tasks.clear();
    }
    function loop(callback) {
      let task;
      if (tasks.size === 0)
        exports.raf(run_tasks);
      return {
        promise: new Promise((fulfill) => {
          tasks.add(task = { c: callback, f: fulfill });
        }),
        abort() {
          tasks.delete(task);
        }
      };
    }
    var is_hydrating = false;
    function start_hydrating() {
      is_hydrating = true;
    }
    function end_hydrating() {
      is_hydrating = false;
    }
    function upper_bound(low, high, key, value) {
      while (low < high) {
        const mid = low + (high - low >> 1);
        if (key(mid) <= value) {
          low = mid + 1;
        } else {
          high = mid;
        }
      }
      return low;
    }
    function init_hydrate(target) {
      if (target.hydrate_init)
        return;
      target.hydrate_init = true;
      let children2 = target.childNodes;
      if (target.nodeName === "HEAD") {
        const myChildren = [];
        for (let i = 0; i < children2.length; i++) {
          const node = children2[i];
          if (node.claim_order !== void 0) {
            myChildren.push(node);
          }
        }
        children2 = myChildren;
      }
      const m = new Int32Array(children2.length + 1);
      const p = new Int32Array(children2.length);
      m[0] = -1;
      let longest = 0;
      for (let i = 0; i < children2.length; i++) {
        const current = children2[i].claim_order;
        const seqLen = (longest > 0 && children2[m[longest]].claim_order <= current ? longest + 1 : upper_bound(1, longest, (idx) => children2[m[idx]].claim_order, current)) - 1;
        p[i] = m[seqLen] + 1;
        const newLen = seqLen + 1;
        m[newLen] = i;
        longest = Math.max(newLen, longest);
      }
      const lis = [];
      const toMove = [];
      let last = children2.length - 1;
      for (let cur = m[longest] + 1; cur != 0; cur = p[cur - 1]) {
        lis.push(children2[cur - 1]);
        for (; last >= cur; last--) {
          toMove.push(children2[last]);
        }
        last--;
      }
      for (; last >= 0; last--) {
        toMove.push(children2[last]);
      }
      lis.reverse();
      toMove.sort((a, b) => a.claim_order - b.claim_order);
      for (let i = 0, j = 0; i < toMove.length; i++) {
        while (j < lis.length && toMove[i].claim_order >= lis[j].claim_order) {
          j++;
        }
        const anchor = j < lis.length ? lis[j] : null;
        target.insertBefore(toMove[i], anchor);
      }
    }
    function append(target, node) {
      target.appendChild(node);
    }
    function append_styles(target, style_sheet_id, styles) {
      var _a;
      const append_styles_to = get_root_for_styles(target);
      if (!((_a = append_styles_to) === null || _a === void 0 ? void 0 : _a.getElementById(style_sheet_id))) {
        const style = element("style");
        style.id = style_sheet_id;
        style.textContent = styles;
        append_stylesheet(append_styles_to, style);
      }
    }
    function get_root_for_node(node) {
      if (!node)
        return document;
      return node.getRootNode ? node.getRootNode() : node.ownerDocument;
    }
    function get_root_for_styles(node) {
      const root = get_root_for_node(node);
      return root.host ? root : root;
    }
    function append_empty_stylesheet(node) {
      const style_element = element("style");
      append_stylesheet(get_root_for_styles(node), style_element);
      return style_element;
    }
    function append_stylesheet(node, style) {
      append(node.head || node, style);
    }
    function append_hydration(target, node) {
      if (is_hydrating) {
        init_hydrate(target);
        if (target.actual_end_child === void 0 || target.actual_end_child !== null && target.actual_end_child.parentElement !== target) {
          target.actual_end_child = target.firstChild;
        }
        while (target.actual_end_child !== null && target.actual_end_child.claim_order === void 0) {
          target.actual_end_child = target.actual_end_child.nextSibling;
        }
        if (node !== target.actual_end_child) {
          if (node.claim_order !== void 0 || node.parentNode !== target) {
            target.insertBefore(node, target.actual_end_child);
          }
        } else {
          target.actual_end_child = node.nextSibling;
        }
      } else if (node.parentNode !== target) {
        target.appendChild(node);
      }
    }
    function insert(target, node, anchor) {
      target.insertBefore(node, anchor || null);
    }
    function insert_hydration(target, node, anchor) {
      if (is_hydrating && !anchor) {
        append_hydration(target, node);
      } else if (node.parentNode !== target || node.nextSibling != anchor) {
        target.insertBefore(node, anchor || null);
      }
    }
    function detach(node) {
      node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
      for (let i = 0; i < iterations.length; i += 1) {
        if (iterations[i])
          iterations[i].d(detaching);
      }
    }
    function element(name) {
      return document.createElement(name);
    }
    function element_is(name, is) {
      return document.createElement(name, { is });
    }
    function object_without_properties(obj, exclude) {
      const target = {};
      for (const k in obj) {
        if (has_prop(obj, k) && exclude.indexOf(k) === -1) {
          target[k] = obj[k];
        }
      }
      return target;
    }
    function svg_element(name) {
      return document.createElementNS("http://www.w3.org/2000/svg", name);
    }
    function text(data) {
      return document.createTextNode(data);
    }
    function space() {
      return text(" ");
    }
    function empty2() {
      return text("");
    }
    function listen(node, event, handler2, options2) {
      node.addEventListener(event, handler2, options2);
      return () => node.removeEventListener(event, handler2, options2);
    }
    function prevent_default(fn) {
      return function(event) {
        event.preventDefault();
        return fn.call(this, event);
      };
    }
    function stop_propagation(fn) {
      return function(event) {
        event.stopPropagation();
        return fn.call(this, event);
      };
    }
    function self(fn) {
      return function(event) {
        if (event.target === this)
          fn.call(this, event);
      };
    }
    function trusted(fn) {
      return function(event) {
        if (event.isTrusted)
          fn.call(this, event);
      };
    }
    function attr(node, attribute, value) {
      if (value == null)
        node.removeAttribute(attribute);
      else if (node.getAttribute(attribute) !== value)
        node.setAttribute(attribute, value);
    }
    function set_attributes(node, attributes) {
      const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
      for (const key in attributes) {
        if (attributes[key] == null) {
          node.removeAttribute(key);
        } else if (key === "style") {
          node.style.cssText = attributes[key];
        } else if (key === "__value") {
          node.value = node[key] = attributes[key];
        } else if (descriptors[key] && descriptors[key].set) {
          node[key] = attributes[key];
        } else {
          attr(node, key, attributes[key]);
        }
      }
    }
    function set_svg_attributes(node, attributes) {
      for (const key in attributes) {
        attr(node, key, attributes[key]);
      }
    }
    function set_custom_element_data(node, prop, value) {
      if (prop in node) {
        node[prop] = typeof node[prop] === "boolean" && value === "" ? true : value;
      } else {
        attr(node, prop, value);
      }
    }
    function xlink_attr(node, attribute, value) {
      node.setAttributeNS("http://www.w3.org/1999/xlink", attribute, value);
    }
    function get_binding_group_value(group, __value, checked) {
      const value = new Set();
      for (let i = 0; i < group.length; i += 1) {
        if (group[i].checked)
          value.add(group[i].__value);
      }
      if (!checked) {
        value.delete(__value);
      }
      return Array.from(value);
    }
    function to_number(value) {
      return value === "" ? null : +value;
    }
    function time_ranges_to_array(ranges) {
      const array = [];
      for (let i = 0; i < ranges.length; i += 1) {
        array.push({ start: ranges.start(i), end: ranges.end(i) });
      }
      return array;
    }
    function children(element2) {
      return Array.from(element2.childNodes);
    }
    function init_claim_info(nodes) {
      if (nodes.claim_info === void 0) {
        nodes.claim_info = { last_index: 0, total_claimed: 0 };
      }
    }
    function claim_node(nodes, predicate, processNode, createNode, dontUpdateLastIndex = false) {
      init_claim_info(nodes);
      const resultNode = (() => {
        for (let i = nodes.claim_info.last_index; i < nodes.length; i++) {
          const node = nodes[i];
          if (predicate(node)) {
            const replacement = processNode(node);
            if (replacement === void 0) {
              nodes.splice(i, 1);
            } else {
              nodes[i] = replacement;
            }
            if (!dontUpdateLastIndex) {
              nodes.claim_info.last_index = i;
            }
            return node;
          }
        }
        for (let i = nodes.claim_info.last_index - 1; i >= 0; i--) {
          const node = nodes[i];
          if (predicate(node)) {
            const replacement = processNode(node);
            if (replacement === void 0) {
              nodes.splice(i, 1);
            } else {
              nodes[i] = replacement;
            }
            if (!dontUpdateLastIndex) {
              nodes.claim_info.last_index = i;
            } else if (replacement === void 0) {
              nodes.claim_info.last_index--;
            }
            return node;
          }
        }
        return createNode();
      })();
      resultNode.claim_order = nodes.claim_info.total_claimed;
      nodes.claim_info.total_claimed += 1;
      return resultNode;
    }
    function claim_element(nodes, name, attributes, svg) {
      return claim_node(nodes, (node) => node.nodeName === name, (node) => {
        const remove = [];
        for (let j = 0; j < node.attributes.length; j++) {
          const attribute = node.attributes[j];
          if (!attributes[attribute.name]) {
            remove.push(attribute.name);
          }
        }
        remove.forEach((v) => node.removeAttribute(v));
        return void 0;
      }, () => svg ? svg_element(name) : element(name));
    }
    function claim_text(nodes, data) {
      return claim_node(nodes, (node) => node.nodeType === 3, (node) => {
        const dataStr = "" + data;
        if (node.data.startsWith(dataStr)) {
          if (node.data.length !== dataStr.length) {
            return node.splitText(dataStr.length);
          }
        } else {
          node.data = dataStr;
        }
      }, () => text(data), true);
    }
    function claim_space(nodes) {
      return claim_text(nodes, " ");
    }
    function find_comment(nodes, text2, start) {
      for (let i = start; i < nodes.length; i += 1) {
        const node = nodes[i];
        if (node.nodeType === 8 && node.textContent.trim() === text2) {
          return i;
        }
      }
      return nodes.length;
    }
    function claim_html_tag(nodes) {
      const start_index = find_comment(nodes, "HTML_TAG_START", 0);
      const end_index = find_comment(nodes, "HTML_TAG_END", start_index);
      if (start_index === end_index) {
        return new HtmlTagHydration();
      }
      init_claim_info(nodes);
      const html_tag_nodes = nodes.splice(start_index, end_index + 1);
      detach(html_tag_nodes[0]);
      detach(html_tag_nodes[html_tag_nodes.length - 1]);
      const claimed_nodes = html_tag_nodes.slice(1, html_tag_nodes.length - 1);
      for (const n of claimed_nodes) {
        n.claim_order = nodes.claim_info.total_claimed;
        nodes.claim_info.total_claimed += 1;
      }
      return new HtmlTagHydration(claimed_nodes);
    }
    function set_data(text2, data) {
      data = "" + data;
      if (text2.wholeText !== data)
        text2.data = data;
    }
    function set_input_value(input, value) {
      input.value = value == null ? "" : value;
    }
    function set_input_type(input, type) {
      try {
        input.type = type;
      } catch (e) {
      }
    }
    function set_style(node, key, value, important) {
      node.style.setProperty(key, value, important ? "important" : "");
    }
    function select_option(select, value) {
      for (let i = 0; i < select.options.length; i += 1) {
        const option = select.options[i];
        if (option.__value === value) {
          option.selected = true;
          return;
        }
      }
    }
    function select_options(select, value) {
      for (let i = 0; i < select.options.length; i += 1) {
        const option = select.options[i];
        option.selected = ~value.indexOf(option.__value);
      }
    }
    function select_value(select) {
      const selected_option = select.querySelector(":checked") || select.options[0];
      return selected_option && selected_option.__value;
    }
    function select_multiple_value(select) {
      return [].map.call(select.querySelectorAll(":checked"), (option) => option.__value);
    }
    var crossorigin;
    function is_crossorigin() {
      if (crossorigin === void 0) {
        crossorigin = false;
        try {
          if (typeof window !== "undefined" && window.parent) {
            void window.parent.document;
          }
        } catch (error3) {
          crossorigin = true;
        }
      }
      return crossorigin;
    }
    function add_resize_listener(node, fn) {
      const computed_style = getComputedStyle(node);
      if (computed_style.position === "static") {
        node.style.position = "relative";
      }
      const iframe = element("iframe");
      iframe.setAttribute("style", "display: block; position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: hidden; border: 0; opacity: 0; pointer-events: none; z-index: -1;");
      iframe.setAttribute("aria-hidden", "true");
      iframe.tabIndex = -1;
      const crossorigin2 = is_crossorigin();
      let unsubscribe;
      if (crossorigin2) {
        iframe.src = "data:text/html,<script>onresize=function(){parent.postMessage(0,'*')}<\/script>";
        unsubscribe = listen(window, "message", (event) => {
          if (event.source === iframe.contentWindow)
            fn();
        });
      } else {
        iframe.src = "about:blank";
        iframe.onload = () => {
          unsubscribe = listen(iframe.contentWindow, "resize", fn);
        };
      }
      append(node, iframe);
      return () => {
        if (crossorigin2) {
          unsubscribe();
        } else if (unsubscribe && iframe.contentWindow) {
          unsubscribe();
        }
        detach(iframe);
      };
    }
    function toggle_class(element2, name, toggle) {
      element2.classList[toggle ? "add" : "remove"](name);
    }
    function custom_event(type, detail, bubbles = false) {
      const e = document.createEvent("CustomEvent");
      e.initCustomEvent(type, bubbles, false, detail);
      return e;
    }
    function query_selector_all(selector, parent = document.body) {
      return Array.from(parent.querySelectorAll(selector));
    }
    var HtmlTag = class {
      constructor() {
        this.e = this.n = null;
      }
      c(html) {
        this.h(html);
      }
      m(html, target, anchor = null) {
        if (!this.e) {
          this.e = element(target.nodeName);
          this.t = target;
          this.c(html);
        }
        this.i(anchor);
      }
      h(html) {
        this.e.innerHTML = html;
        this.n = Array.from(this.e.childNodes);
      }
      i(anchor) {
        for (let i = 0; i < this.n.length; i += 1) {
          insert(this.t, this.n[i], anchor);
        }
      }
      p(html) {
        this.d();
        this.h(html);
        this.i(this.a);
      }
      d() {
        this.n.forEach(detach);
      }
    };
    var HtmlTagHydration = class extends HtmlTag {
      constructor(claimed_nodes) {
        super();
        this.e = this.n = null;
        this.l = claimed_nodes;
      }
      c(html) {
        if (this.l) {
          this.n = this.l;
        } else {
          super.c(html);
        }
      }
      i(anchor) {
        for (let i = 0; i < this.n.length; i += 1) {
          insert_hydration(this.t, this.n[i], anchor);
        }
      }
    };
    function attribute_to_object(attributes) {
      const result = {};
      for (const attribute of attributes) {
        result[attribute.name] = attribute.value;
      }
      return result;
    }
    function get_custom_elements_slots(element2) {
      const result = {};
      element2.childNodes.forEach((node) => {
        result[node.slot || "default"] = true;
      });
      return result;
    }
    var active_docs = new Set();
    var active = 0;
    function hash2(str) {
      let hash3 = 5381;
      let i = str.length;
      while (i--)
        hash3 = (hash3 << 5) - hash3 ^ str.charCodeAt(i);
      return hash3 >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
      const step = 16.666 / duration;
      let keyframes = "{\n";
      for (let p = 0; p <= 1; p += step) {
        const t = a + (b - a) * ease(p);
        keyframes += p * 100 + `%{${fn(t, 1 - t)}}
`;
      }
      const rule = keyframes + `100% {${fn(b, 1 - b)}}
}`;
      const name = `__svelte_${hash2(rule)}_${uid}`;
      const doc = get_root_for_node(node);
      active_docs.add(doc);
      const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = append_empty_stylesheet(node).sheet);
      const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
      if (!current_rules[name]) {
        current_rules[name] = true;
        stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
      }
      const animation = node.style.animation || "";
      node.style.animation = `${animation ? `${animation}, ` : ""}${name} ${duration}ms linear ${delay}ms 1 both`;
      active += 1;
      return name;
    }
    function delete_rule(node, name) {
      const previous = (node.style.animation || "").split(", ");
      const next = previous.filter(name ? (anim) => anim.indexOf(name) < 0 : (anim) => anim.indexOf("__svelte") === -1);
      const deleted = previous.length - next.length;
      if (deleted) {
        node.style.animation = next.join(", ");
        active -= deleted;
        if (!active)
          clear_rules();
      }
    }
    function clear_rules() {
      exports.raf(() => {
        if (active)
          return;
        active_docs.forEach((doc) => {
          const stylesheet = doc.__svelte_stylesheet;
          let i = stylesheet.cssRules.length;
          while (i--)
            stylesheet.deleteRule(i);
          doc.__svelte_rules = {};
        });
        active_docs.clear();
      });
    }
    function create_animation(node, from, fn, params) {
      if (!from)
        return noop3;
      const to = node.getBoundingClientRect();
      if (from.left === to.left && from.right === to.right && from.top === to.top && from.bottom === to.bottom)
        return noop3;
      const {
        delay = 0,
        duration = 300,
        easing = identity,
        start: start_time = exports.now() + delay,
        end = start_time + duration,
        tick: tick2 = noop3,
        css: css2
      } = fn(node, { from, to }, params);
      let running = true;
      let started = false;
      let name;
      function start() {
        if (css2) {
          name = create_rule(node, 0, 1, duration, delay, easing, css2);
        }
        if (!delay) {
          started = true;
        }
      }
      function stop() {
        if (css2)
          delete_rule(node, name);
        running = false;
      }
      loop((now) => {
        if (!started && now >= start_time) {
          started = true;
        }
        if (started && now >= end) {
          tick2(1, 0);
          stop();
        }
        if (!running) {
          return false;
        }
        if (started) {
          const p = now - start_time;
          const t = 0 + 1 * easing(p / duration);
          tick2(t, 1 - t);
        }
        return true;
      });
      start();
      tick2(0, 1);
      return stop;
    }
    function fix_position(node) {
      const style = getComputedStyle(node);
      if (style.position !== "absolute" && style.position !== "fixed") {
        const { width, height } = style;
        const a = node.getBoundingClientRect();
        node.style.position = "absolute";
        node.style.width = width;
        node.style.height = height;
        add_transform(node, a);
      }
    }
    function add_transform(node, a) {
      const b = node.getBoundingClientRect();
      if (a.left !== b.left || a.top !== b.top) {
        const style = getComputedStyle(node);
        const transform = style.transform === "none" ? "" : style.transform;
        node.style.transform = `${transform} translate(${a.left - b.left}px, ${a.top - b.top}px)`;
      }
    }
    function set_current_component2(component) {
      exports.current_component = component;
    }
    function get_current_component2() {
      if (!exports.current_component)
        throw new Error("Function called outside component initialization");
      return exports.current_component;
    }
    function beforeUpdate(fn) {
      get_current_component2().$$.before_update.push(fn);
    }
    function onMount(fn) {
      get_current_component2().$$.on_mount.push(fn);
    }
    function afterUpdate2(fn) {
      get_current_component2().$$.after_update.push(fn);
    }
    function onDestroy(fn) {
      get_current_component2().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
      const component = get_current_component2();
      return (type, detail) => {
        const callbacks = component.$$.callbacks[type];
        if (callbacks) {
          const event = custom_event(type, detail);
          callbacks.slice().forEach((fn) => {
            fn.call(component, event);
          });
        }
      };
    }
    function setContext2(key, context) {
      get_current_component2().$$.context.set(key, context);
    }
    function getContext2(key) {
      return get_current_component2().$$.context.get(key);
    }
    function getAllContexts() {
      return get_current_component2().$$.context;
    }
    function hasContext(key) {
      return get_current_component2().$$.context.has(key);
    }
    function bubble(component, event) {
      const callbacks = component.$$.callbacks[event.type];
      if (callbacks) {
        callbacks.slice().forEach((fn) => fn.call(this, event));
      }
    }
    var dirty_components = [];
    var intros = { enabled: false };
    var binding_callbacks = [];
    var render_callbacks = [];
    var flush_callbacks = [];
    var resolved_promise = Promise.resolve();
    var update_scheduled = false;
    function schedule_update() {
      if (!update_scheduled) {
        update_scheduled = true;
        resolved_promise.then(flush);
      }
    }
    function tick() {
      schedule_update();
      return resolved_promise;
    }
    function add_render_callback(fn) {
      render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
      flush_callbacks.push(fn);
    }
    var flushing = false;
    var seen_callbacks = new Set();
    function flush() {
      if (flushing)
        return;
      flushing = true;
      do {
        for (let i = 0; i < dirty_components.length; i += 1) {
          const component = dirty_components[i];
          set_current_component2(component);
          update(component.$$);
        }
        set_current_component2(null);
        dirty_components.length = 0;
        while (binding_callbacks.length)
          binding_callbacks.pop()();
        for (let i = 0; i < render_callbacks.length; i += 1) {
          const callback = render_callbacks[i];
          if (!seen_callbacks.has(callback)) {
            seen_callbacks.add(callback);
            callback();
          }
        }
        render_callbacks.length = 0;
      } while (dirty_components.length);
      while (flush_callbacks.length) {
        flush_callbacks.pop()();
      }
      update_scheduled = false;
      flushing = false;
      seen_callbacks.clear();
    }
    function update($$) {
      if ($$.fragment !== null) {
        $$.update();
        run_all2($$.before_update);
        const dirty = $$.dirty;
        $$.dirty = [-1];
        $$.fragment && $$.fragment.p($$.ctx, dirty);
        $$.after_update.forEach(add_render_callback);
      }
    }
    var promise;
    function wait() {
      if (!promise) {
        promise = Promise.resolve();
        promise.then(() => {
          promise = null;
        });
      }
      return promise;
    }
    function dispatch(node, direction, kind) {
      node.dispatchEvent(custom_event(`${direction ? "intro" : "outro"}${kind}`));
    }
    var outroing = new Set();
    var outros;
    function group_outros() {
      outros = {
        r: 0,
        c: [],
        p: outros
      };
    }
    function check_outros() {
      if (!outros.r) {
        run_all2(outros.c);
      }
      outros = outros.p;
    }
    function transition_in(block, local) {
      if (block && block.i) {
        outroing.delete(block);
        block.i(local);
      }
    }
    function transition_out(block, local, detach2, callback) {
      if (block && block.o) {
        if (outroing.has(block))
          return;
        outroing.add(block);
        outros.c.push(() => {
          outroing.delete(block);
          if (callback) {
            if (detach2)
              block.d(1);
            callback();
          }
        });
        block.o(local);
      }
    }
    var null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
      let config = fn(node, params);
      let running = false;
      let animation_name;
      let task;
      let uid = 0;
      function cleanup() {
        if (animation_name)
          delete_rule(node, animation_name);
      }
      function go() {
        const { delay = 0, duration = 300, easing = identity, tick: tick2 = noop3, css: css2 } = config || null_transition;
        if (css2)
          animation_name = create_rule(node, 0, 1, duration, delay, easing, css2, uid++);
        tick2(0, 1);
        const start_time = exports.now() + delay;
        const end_time = start_time + duration;
        if (task)
          task.abort();
        running = true;
        add_render_callback(() => dispatch(node, true, "start"));
        task = loop((now) => {
          if (running) {
            if (now >= end_time) {
              tick2(1, 0);
              dispatch(node, true, "end");
              cleanup();
              return running = false;
            }
            if (now >= start_time) {
              const t = easing((now - start_time) / duration);
              tick2(t, 1 - t);
            }
          }
          return running;
        });
      }
      let started = false;
      return {
        start() {
          if (started)
            return;
          started = true;
          delete_rule(node);
          if (is_function(config)) {
            config = config();
            wait().then(go);
          } else {
            go();
          }
        },
        invalidate() {
          started = false;
        },
        end() {
          if (running) {
            cleanup();
            running = false;
          }
        }
      };
    }
    function create_out_transition(node, fn, params) {
      let config = fn(node, params);
      let running = true;
      let animation_name;
      const group = outros;
      group.r += 1;
      function go() {
        const { delay = 0, duration = 300, easing = identity, tick: tick2 = noop3, css: css2 } = config || null_transition;
        if (css2)
          animation_name = create_rule(node, 1, 0, duration, delay, easing, css2);
        const start_time = exports.now() + delay;
        const end_time = start_time + duration;
        add_render_callback(() => dispatch(node, false, "start"));
        loop((now) => {
          if (running) {
            if (now >= end_time) {
              tick2(0, 1);
              dispatch(node, false, "end");
              if (!--group.r) {
                run_all2(group.c);
              }
              return false;
            }
            if (now >= start_time) {
              const t = easing((now - start_time) / duration);
              tick2(1 - t, t);
            }
          }
          return running;
        });
      }
      if (is_function(config)) {
        wait().then(() => {
          config = config();
          go();
        });
      } else {
        go();
      }
      return {
        end(reset) {
          if (reset && config.tick) {
            config.tick(1, 0);
          }
          if (running) {
            if (animation_name)
              delete_rule(node, animation_name);
            running = false;
          }
        }
      };
    }
    function create_bidirectional_transition(node, fn, params, intro) {
      let config = fn(node, params);
      let t = intro ? 0 : 1;
      let running_program = null;
      let pending_program = null;
      let animation_name = null;
      function clear_animation() {
        if (animation_name)
          delete_rule(node, animation_name);
      }
      function init3(program, duration) {
        const d = program.b - t;
        duration *= Math.abs(d);
        return {
          a: t,
          b: program.b,
          d,
          duration,
          start: program.start,
          end: program.start + duration,
          group: program.group
        };
      }
      function go(b) {
        const { delay = 0, duration = 300, easing = identity, tick: tick2 = noop3, css: css2 } = config || null_transition;
        const program = {
          start: exports.now() + delay,
          b
        };
        if (!b) {
          program.group = outros;
          outros.r += 1;
        }
        if (running_program || pending_program) {
          pending_program = program;
        } else {
          if (css2) {
            clear_animation();
            animation_name = create_rule(node, t, b, duration, delay, easing, css2);
          }
          if (b)
            tick2(0, 1);
          running_program = init3(program, duration);
          add_render_callback(() => dispatch(node, b, "start"));
          loop((now) => {
            if (pending_program && now > pending_program.start) {
              running_program = init3(pending_program, duration);
              pending_program = null;
              dispatch(node, running_program.b, "start");
              if (css2) {
                clear_animation();
                animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
              }
            }
            if (running_program) {
              if (now >= running_program.end) {
                tick2(t = running_program.b, 1 - t);
                dispatch(node, running_program.b, "end");
                if (!pending_program) {
                  if (running_program.b) {
                    clear_animation();
                  } else {
                    if (!--running_program.group.r)
                      run_all2(running_program.group.c);
                  }
                }
                running_program = null;
              } else if (now >= running_program.start) {
                const p = now - running_program.start;
                t = running_program.a + running_program.d * easing(p / running_program.duration);
                tick2(t, 1 - t);
              }
            }
            return !!(running_program || pending_program);
          });
        }
      }
      return {
        run(b) {
          if (is_function(config)) {
            wait().then(() => {
              config = config();
              go(b);
            });
          } else {
            go(b);
          }
        },
        end() {
          clear_animation();
          running_program = pending_program = null;
        }
      };
    }
    function handle_promise(promise2, info) {
      const token = info.token = {};
      function update2(type, index2, key, value) {
        if (info.token !== token)
          return;
        info.resolved = value;
        let child_ctx = info.ctx;
        if (key !== void 0) {
          child_ctx = child_ctx.slice();
          child_ctx[key] = value;
        }
        const block = type && (info.current = type)(child_ctx);
        let needs_flush = false;
        if (info.block) {
          if (info.blocks) {
            info.blocks.forEach((block2, i) => {
              if (i !== index2 && block2) {
                group_outros();
                transition_out(block2, 1, 1, () => {
                  if (info.blocks[i] === block2) {
                    info.blocks[i] = null;
                  }
                });
                check_outros();
              }
            });
          } else {
            info.block.d(1);
          }
          block.c();
          transition_in(block, 1);
          block.m(info.mount(), info.anchor);
          needs_flush = true;
        }
        info.block = block;
        if (info.blocks)
          info.blocks[index2] = block;
        if (needs_flush) {
          flush();
        }
      }
      if (is_promise(promise2)) {
        const current_component2 = get_current_component2();
        promise2.then((value) => {
          set_current_component2(current_component2);
          update2(info.then, 1, info.value, value);
          set_current_component2(null);
        }, (error3) => {
          set_current_component2(current_component2);
          update2(info.catch, 2, info.error, error3);
          set_current_component2(null);
          if (!info.hasCatch) {
            throw error3;
          }
        });
        if (info.current !== info.pending) {
          update2(info.pending, 0);
          return true;
        }
      } else {
        if (info.current !== info.then) {
          update2(info.then, 1, info.value, promise2);
          return true;
        }
        info.resolved = promise2;
      }
    }
    function update_await_block_branch(info, ctx, dirty) {
      const child_ctx = ctx.slice();
      const { resolved } = info;
      if (info.current === info.then) {
        child_ctx[info.value] = resolved;
      }
      if (info.current === info.catch) {
        child_ctx[info.error] = resolved;
      }
      info.block.p(child_ctx, dirty);
    }
    var globals = typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : global;
    function destroy_block(block, lookup) {
      block.d(1);
      lookup.delete(block.key);
    }
    function outro_and_destroy_block(block, lookup) {
      transition_out(block, 1, 1, () => {
        lookup.delete(block.key);
      });
    }
    function fix_and_destroy_block(block, lookup) {
      block.f();
      destroy_block(block, lookup);
    }
    function fix_and_outro_and_destroy_block(block, lookup) {
      block.f();
      outro_and_destroy_block(block, lookup);
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
      let o = old_blocks.length;
      let n = list.length;
      let i = o;
      const old_indexes = {};
      while (i--)
        old_indexes[old_blocks[i].key] = i;
      const new_blocks = [];
      const new_lookup = new Map();
      const deltas = new Map();
      i = n;
      while (i--) {
        const child_ctx = get_context(ctx, list, i);
        const key = get_key(child_ctx);
        let block = lookup.get(key);
        if (!block) {
          block = create_each_block(key, child_ctx);
          block.c();
        } else if (dynamic) {
          block.p(child_ctx, dirty);
        }
        new_lookup.set(key, new_blocks[i] = block);
        if (key in old_indexes)
          deltas.set(key, Math.abs(i - old_indexes[key]));
      }
      const will_move = new Set();
      const did_move = new Set();
      function insert2(block) {
        transition_in(block, 1);
        block.m(node, next);
        lookup.set(block.key, block);
        next = block.first;
        n--;
      }
      while (o && n) {
        const new_block = new_blocks[n - 1];
        const old_block = old_blocks[o - 1];
        const new_key = new_block.key;
        const old_key = old_block.key;
        if (new_block === old_block) {
          next = new_block.first;
          o--;
          n--;
        } else if (!new_lookup.has(old_key)) {
          destroy(old_block, lookup);
          o--;
        } else if (!lookup.has(new_key) || will_move.has(new_key)) {
          insert2(new_block);
        } else if (did_move.has(old_key)) {
          o--;
        } else if (deltas.get(new_key) > deltas.get(old_key)) {
          did_move.add(new_key);
          insert2(new_block);
        } else {
          will_move.add(old_key);
          o--;
        }
      }
      while (o--) {
        const old_block = old_blocks[o];
        if (!new_lookup.has(old_block.key))
          destroy(old_block, lookup);
      }
      while (n)
        insert2(new_blocks[n - 1]);
      return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
      const keys = new Set();
      for (let i = 0; i < list.length; i++) {
        const key = get_key(get_context(ctx, list, i));
        if (keys.has(key)) {
          throw new Error("Cannot have duplicate keys in a keyed each");
        }
        keys.add(key);
      }
    }
    function get_spread_update(levels, updates) {
      const update2 = {};
      const to_null_out = {};
      const accounted_for = { $$scope: 1 };
      let i = levels.length;
      while (i--) {
        const o = levels[i];
        const n = updates[i];
        if (n) {
          for (const key in o) {
            if (!(key in n))
              to_null_out[key] = 1;
          }
          for (const key in n) {
            if (!accounted_for[key]) {
              update2[key] = n[key];
              accounted_for[key] = 1;
            }
          }
          levels[i] = n;
        } else {
          for (const key in o) {
            accounted_for[key] = 1;
          }
        }
      }
      for (const key in to_null_out) {
        if (!(key in update2))
          update2[key] = void 0;
      }
      return update2;
    }
    function get_spread_object(spread_props) {
      return typeof spread_props === "object" && spread_props !== null ? spread_props : {};
    }
    var boolean_attributes = new Set([
      "allowfullscreen",
      "allowpaymentrequest",
      "async",
      "autofocus",
      "autoplay",
      "checked",
      "controls",
      "default",
      "defer",
      "disabled",
      "formnovalidate",
      "hidden",
      "ismap",
      "loop",
      "multiple",
      "muted",
      "nomodule",
      "novalidate",
      "open",
      "playsinline",
      "readonly",
      "required",
      "reversed",
      "selected"
    ]);
    var invalid_attribute_name_character = /[\s'">/=\u{FDD0}-\u{FDEF}\u{FFFE}\u{FFFF}\u{1FFFE}\u{1FFFF}\u{2FFFE}\u{2FFFF}\u{3FFFE}\u{3FFFF}\u{4FFFE}\u{4FFFF}\u{5FFFE}\u{5FFFF}\u{6FFFE}\u{6FFFF}\u{7FFFE}\u{7FFFF}\u{8FFFE}\u{8FFFF}\u{9FFFE}\u{9FFFF}\u{AFFFE}\u{AFFFF}\u{BFFFE}\u{BFFFF}\u{CFFFE}\u{CFFFF}\u{DFFFE}\u{DFFFF}\u{EFFFE}\u{EFFFF}\u{FFFFE}\u{FFFFF}\u{10FFFE}\u{10FFFF}]/u;
    function spread(args, classes_to_add) {
      const attributes = Object.assign({}, ...args);
      if (classes_to_add) {
        if (attributes.class == null) {
          attributes.class = classes_to_add;
        } else {
          attributes.class += " " + classes_to_add;
        }
      }
      let str = "";
      Object.keys(attributes).forEach((name) => {
        if (invalid_attribute_name_character.test(name))
          return;
        const value = attributes[name];
        if (value === true)
          str += " " + name;
        else if (boolean_attributes.has(name.toLowerCase())) {
          if (value)
            str += " " + name;
        } else if (value != null) {
          str += ` ${name}="${value}"`;
        }
      });
      return str;
    }
    var escaped3 = {
      '"': "&quot;",
      "'": "&#39;",
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;"
    };
    function escape3(html) {
      return String(html).replace(/["'&<>]/g, (match) => escaped3[match]);
    }
    function escape_attribute_value(value) {
      return typeof value === "string" ? escape3(value) : value;
    }
    function escape_object(obj) {
      const result = {};
      for (const key in obj) {
        result[key] = escape_attribute_value(obj[key]);
      }
      return result;
    }
    function each(items, fn) {
      let str = "";
      for (let i = 0; i < items.length; i += 1) {
        str += fn(items[i], i);
      }
      return str;
    }
    var missing_component2 = {
      $$render: () => ""
    };
    function validate_component2(component, name) {
      if (!component || !component.$$render) {
        if (name === "svelte:component")
          name += " this={...}";
        throw new Error(`<${name}> is not a valid SSR component. You may need to review your build config to ensure that dependencies are compiled, rather than imported as pre-compiled modules`);
      }
      return component;
    }
    function debug(file, line, column, values) {
      console.log(`{@debug} ${file ? file + " " : ""}(${line}:${column})`);
      console.log(values);
      return "";
    }
    var on_destroy2;
    function create_ssr_component2(fn) {
      function $$render(result, props, bindings, slots, context) {
        const parent_component = exports.current_component;
        const $$ = {
          on_destroy: on_destroy2,
          context: new Map(parent_component ? parent_component.$$.context : context || []),
          on_mount: [],
          before_update: [],
          after_update: [],
          callbacks: blank_object2()
        };
        set_current_component2({ $$ });
        const html = fn(result, props, bindings, slots);
        set_current_component2(parent_component);
        return html;
      }
      return {
        render: (props = {}, { $$slots = {}, context = new Map() } = {}) => {
          on_destroy2 = [];
          const result = { title: "", head: "", css: new Set() };
          const html = $$render(result, props, {}, $$slots, context);
          run_all2(on_destroy2);
          return {
            html,
            css: {
              code: Array.from(result.css).map((css2) => css2.code).join("\n"),
              map: null
            },
            head: result.title + result.head
          };
        },
        $$render
      };
    }
    function add_attribute2(name, value, boolean) {
      if (value == null || boolean && !value)
        return "";
      return ` ${name}${value === true ? "" : `=${typeof value === "string" ? JSON.stringify(escape3(value)) : `"${value}"`}`}`;
    }
    function add_classes(classes) {
      return classes ? ` class="${classes}"` : "";
    }
    function bind(component, name, callback) {
      const index2 = component.$$.props[name];
      if (index2 !== void 0) {
        component.$$.bound[index2] = callback;
        callback(component.$$.ctx[index2]);
      }
    }
    function create_component(block) {
      block && block.c();
    }
    function claim_component(block, parent_nodes) {
      block && block.l(parent_nodes);
    }
    function mount_component(component, target, anchor, customElement) {
      const { fragment, on_mount, on_destroy: on_destroy3, after_update } = component.$$;
      fragment && fragment.m(target, anchor);
      if (!customElement) {
        add_render_callback(() => {
          const new_on_destroy = on_mount.map(run2).filter(is_function);
          if (on_destroy3) {
            on_destroy3.push(...new_on_destroy);
          } else {
            run_all2(new_on_destroy);
          }
          component.$$.on_mount = [];
        });
      }
      after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
      const $$ = component.$$;
      if ($$.fragment !== null) {
        run_all2($$.on_destroy);
        $$.fragment && $$.fragment.d(detaching);
        $$.on_destroy = $$.fragment = null;
        $$.ctx = [];
      }
    }
    function make_dirty(component, i) {
      if (component.$$.dirty[0] === -1) {
        dirty_components.push(component);
        schedule_update();
        component.$$.dirty.fill(0);
      }
      component.$$.dirty[i / 31 | 0] |= 1 << i % 31;
    }
    function init2(component, options2, instance, create_fragment, not_equal2, props, append_styles2, dirty = [-1]) {
      const parent_component = exports.current_component;
      set_current_component2(component);
      const $$ = component.$$ = {
        fragment: null,
        ctx: null,
        props,
        update: noop3,
        not_equal: not_equal2,
        bound: blank_object2(),
        on_mount: [],
        on_destroy: [],
        on_disconnect: [],
        before_update: [],
        after_update: [],
        context: new Map(parent_component ? parent_component.$$.context : options2.context || []),
        callbacks: blank_object2(),
        dirty,
        skip_bound: false,
        root: options2.target || parent_component.$$.root
      };
      append_styles2 && append_styles2($$.root);
      let ready = false;
      $$.ctx = instance ? instance(component, options2.props || {}, (i, ret, ...rest) => {
        const value = rest.length ? rest[0] : ret;
        if ($$.ctx && not_equal2($$.ctx[i], $$.ctx[i] = value)) {
          if (!$$.skip_bound && $$.bound[i])
            $$.bound[i](value);
          if (ready)
            make_dirty(component, i);
        }
        return ret;
      }) : [];
      $$.update();
      ready = true;
      run_all2($$.before_update);
      $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
      if (options2.target) {
        if (options2.hydrate) {
          start_hydrating();
          const nodes = children(options2.target);
          $$.fragment && $$.fragment.l(nodes);
          nodes.forEach(detach);
        } else {
          $$.fragment && $$.fragment.c();
        }
        if (options2.intro)
          transition_in(component.$$.fragment);
        mount_component(component, options2.target, options2.anchor, options2.customElement);
        end_hydrating();
        flush();
      }
      set_current_component2(parent_component);
    }
    if (typeof HTMLElement === "function") {
      exports.SvelteElement = class extends HTMLElement {
        constructor() {
          super();
          this.attachShadow({ mode: "open" });
        }
        connectedCallback() {
          const { on_mount } = this.$$;
          this.$$.on_disconnect = on_mount.map(run2).filter(is_function);
          for (const key in this.$$.slotted) {
            this.appendChild(this.$$.slotted[key]);
          }
        }
        attributeChangedCallback(attr2, _oldValue, newValue) {
          this[attr2] = newValue;
        }
        disconnectedCallback() {
          run_all2(this.$$.on_disconnect);
        }
        $destroy() {
          destroy_component(this, 1);
          this.$destroy = noop3;
        }
        $on(type, callback) {
          const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
          callbacks.push(callback);
          return () => {
            const index2 = callbacks.indexOf(callback);
            if (index2 !== -1)
              callbacks.splice(index2, 1);
          };
        }
        $set($$props) {
          if (this.$$set && !is_empty($$props)) {
            this.$$.skip_bound = true;
            this.$$set($$props);
            this.$$.skip_bound = false;
          }
        }
      };
    }
    var SvelteComponent = class {
      $destroy() {
        destroy_component(this, 1);
        this.$destroy = noop3;
      }
      $on(type, callback) {
        const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
        callbacks.push(callback);
        return () => {
          const index2 = callbacks.indexOf(callback);
          if (index2 !== -1)
            callbacks.splice(index2, 1);
        };
      }
      $set($$props) {
        if (this.$$set && !is_empty($$props)) {
          this.$$.skip_bound = true;
          this.$$set($$props);
          this.$$.skip_bound = false;
        }
      }
    };
    function dispatch_dev(type, detail) {
      document.dispatchEvent(custom_event(type, Object.assign({ version: "3.40.2" }, detail), true));
    }
    function append_dev(target, node) {
      dispatch_dev("SvelteDOMInsert", { target, node });
      append(target, node);
    }
    function append_hydration_dev(target, node) {
      dispatch_dev("SvelteDOMInsert", { target, node });
      append_hydration(target, node);
    }
    function insert_dev(target, node, anchor) {
      dispatch_dev("SvelteDOMInsert", { target, node, anchor });
      insert(target, node, anchor);
    }
    function insert_hydration_dev(target, node, anchor) {
      dispatch_dev("SvelteDOMInsert", { target, node, anchor });
      insert_hydration(target, node, anchor);
    }
    function detach_dev(node) {
      dispatch_dev("SvelteDOMRemove", { node });
      detach(node);
    }
    function detach_between_dev(before, after) {
      while (before.nextSibling && before.nextSibling !== after) {
        detach_dev(before.nextSibling);
      }
    }
    function detach_before_dev(after) {
      while (after.previousSibling) {
        detach_dev(after.previousSibling);
      }
    }
    function detach_after_dev(before) {
      while (before.nextSibling) {
        detach_dev(before.nextSibling);
      }
    }
    function listen_dev(node, event, handler2, options2, has_prevent_default, has_stop_propagation) {
      const modifiers = options2 === true ? ["capture"] : options2 ? Array.from(Object.keys(options2)) : [];
      if (has_prevent_default)
        modifiers.push("preventDefault");
      if (has_stop_propagation)
        modifiers.push("stopPropagation");
      dispatch_dev("SvelteDOMAddEventListener", { node, event, handler: handler2, modifiers });
      const dispose = listen(node, event, handler2, options2);
      return () => {
        dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler: handler2, modifiers });
        dispose();
      };
    }
    function attr_dev(node, attribute, value) {
      attr(node, attribute, value);
      if (value == null)
        dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
      else
        dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
      node[property] = value;
      dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function dataset_dev(node, property, value) {
      node.dataset[property] = value;
      dispatch_dev("SvelteDOMSetDataset", { node, property, value });
    }
    function set_data_dev(text2, data) {
      data = "" + data;
      if (text2.wholeText === data)
        return;
      dispatch_dev("SvelteDOMSetData", { node: text2, data });
      text2.data = data;
    }
    function validate_each_argument(arg) {
      if (typeof arg !== "string" && !(arg && typeof arg === "object" && "length" in arg)) {
        let msg = "{#each} only iterates over array-like objects.";
        if (typeof Symbol === "function" && arg && Symbol.iterator in arg) {
          msg += " You can use a spread to convert this iterable into an array.";
        }
        throw new Error(msg);
      }
    }
    function validate_slots(name, slot, keys) {
      for (const slot_key of Object.keys(slot)) {
        if (!~keys.indexOf(slot_key)) {
          console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
        }
      }
    }
    var SvelteComponentDev = class extends SvelteComponent {
      constructor(options2) {
        if (!options2 || !options2.target && !options2.$$inline) {
          throw new Error("'target' is a required option");
        }
        super();
      }
      $destroy() {
        super.$destroy();
        this.$destroy = () => {
          console.warn("Component was already destroyed");
        };
      }
      $capture_state() {
      }
      $inject_state() {
      }
    };
    var SvelteComponentTyped = class extends SvelteComponentDev {
      constructor(options2) {
        super(options2);
      }
    };
    function loop_guard(timeout) {
      const start = Date.now();
      return () => {
        if (Date.now() - start > timeout) {
          throw new Error("Infinite loop detected");
        }
      };
    }
    exports.HtmlTag = HtmlTag;
    exports.HtmlTagHydration = HtmlTagHydration;
    exports.SvelteComponent = SvelteComponent;
    exports.SvelteComponentDev = SvelteComponentDev;
    exports.SvelteComponentTyped = SvelteComponentTyped;
    exports.action_destroyer = action_destroyer;
    exports.add_attribute = add_attribute2;
    exports.add_classes = add_classes;
    exports.add_flush_callback = add_flush_callback;
    exports.add_location = add_location;
    exports.add_render_callback = add_render_callback;
    exports.add_resize_listener = add_resize_listener;
    exports.add_transform = add_transform;
    exports.afterUpdate = afterUpdate2;
    exports.append = append;
    exports.append_dev = append_dev;
    exports.append_empty_stylesheet = append_empty_stylesheet;
    exports.append_hydration = append_hydration;
    exports.append_hydration_dev = append_hydration_dev;
    exports.append_styles = append_styles;
    exports.assign = assign;
    exports.attr = attr;
    exports.attr_dev = attr_dev;
    exports.attribute_to_object = attribute_to_object;
    exports.beforeUpdate = beforeUpdate;
    exports.bind = bind;
    exports.binding_callbacks = binding_callbacks;
    exports.blank_object = blank_object2;
    exports.bubble = bubble;
    exports.check_outros = check_outros;
    exports.children = children;
    exports.claim_component = claim_component;
    exports.claim_element = claim_element;
    exports.claim_html_tag = claim_html_tag;
    exports.claim_space = claim_space;
    exports.claim_text = claim_text;
    exports.clear_loops = clear_loops;
    exports.component_subscribe = component_subscribe;
    exports.compute_rest_props = compute_rest_props;
    exports.compute_slots = compute_slots;
    exports.createEventDispatcher = createEventDispatcher;
    exports.create_animation = create_animation;
    exports.create_bidirectional_transition = create_bidirectional_transition;
    exports.create_component = create_component;
    exports.create_in_transition = create_in_transition;
    exports.create_out_transition = create_out_transition;
    exports.create_slot = create_slot;
    exports.create_ssr_component = create_ssr_component2;
    exports.custom_event = custom_event;
    exports.dataset_dev = dataset_dev;
    exports.debug = debug;
    exports.destroy_block = destroy_block;
    exports.destroy_component = destroy_component;
    exports.destroy_each = destroy_each;
    exports.detach = detach;
    exports.detach_after_dev = detach_after_dev;
    exports.detach_before_dev = detach_before_dev;
    exports.detach_between_dev = detach_between_dev;
    exports.detach_dev = detach_dev;
    exports.dirty_components = dirty_components;
    exports.dispatch_dev = dispatch_dev;
    exports.each = each;
    exports.element = element;
    exports.element_is = element_is;
    exports.empty = empty2;
    exports.end_hydrating = end_hydrating;
    exports.escape = escape3;
    exports.escape_attribute_value = escape_attribute_value;
    exports.escape_object = escape_object;
    exports.escaped = escaped3;
    exports.exclude_internal_props = exclude_internal_props;
    exports.fix_and_destroy_block = fix_and_destroy_block;
    exports.fix_and_outro_and_destroy_block = fix_and_outro_and_destroy_block;
    exports.fix_position = fix_position;
    exports.flush = flush;
    exports.getAllContexts = getAllContexts;
    exports.getContext = getContext2;
    exports.get_binding_group_value = get_binding_group_value;
    exports.get_current_component = get_current_component2;
    exports.get_custom_elements_slots = get_custom_elements_slots;
    exports.get_root_for_node = get_root_for_node;
    exports.get_slot_changes = get_slot_changes;
    exports.get_spread_object = get_spread_object;
    exports.get_spread_update = get_spread_update;
    exports.get_store_value = get_store_value;
    exports.globals = globals;
    exports.group_outros = group_outros;
    exports.handle_promise = handle_promise;
    exports.hasContext = hasContext;
    exports.has_prop = has_prop;
    exports.identity = identity;
    exports.init = init2;
    exports.insert = insert;
    exports.insert_dev = insert_dev;
    exports.insert_hydration = insert_hydration;
    exports.insert_hydration_dev = insert_hydration_dev;
    exports.intros = intros;
    exports.invalid_attribute_name_character = invalid_attribute_name_character;
    exports.is_client = is_client;
    exports.is_crossorigin = is_crossorigin;
    exports.is_empty = is_empty;
    exports.is_function = is_function;
    exports.is_promise = is_promise;
    exports.listen = listen;
    exports.listen_dev = listen_dev;
    exports.loop = loop;
    exports.loop_guard = loop_guard;
    exports.missing_component = missing_component2;
    exports.mount_component = mount_component;
    exports.noop = noop3;
    exports.not_equal = not_equal;
    exports.null_to_empty = null_to_empty;
    exports.object_without_properties = object_without_properties;
    exports.onDestroy = onDestroy;
    exports.onMount = onMount;
    exports.once = once;
    exports.outro_and_destroy_block = outro_and_destroy_block;
    exports.prevent_default = prevent_default;
    exports.prop_dev = prop_dev;
    exports.query_selector_all = query_selector_all;
    exports.run = run2;
    exports.run_all = run_all2;
    exports.safe_not_equal = safe_not_equal3;
    exports.schedule_update = schedule_update;
    exports.select_multiple_value = select_multiple_value;
    exports.select_option = select_option;
    exports.select_options = select_options;
    exports.select_value = select_value;
    exports.self = self;
    exports.setContext = setContext2;
    exports.set_attributes = set_attributes;
    exports.set_current_component = set_current_component2;
    exports.set_custom_element_data = set_custom_element_data;
    exports.set_data = set_data;
    exports.set_data_dev = set_data_dev;
    exports.set_input_type = set_input_type;
    exports.set_input_value = set_input_value;
    exports.set_now = set_now;
    exports.set_raf = set_raf;
    exports.set_store_value = set_store_value;
    exports.set_style = set_style;
    exports.set_svg_attributes = set_svg_attributes;
    exports.space = space;
    exports.spread = spread;
    exports.src_url_equal = src_url_equal;
    exports.start_hydrating = start_hydrating;
    exports.stop_propagation = stop_propagation;
    exports.subscribe = subscribe2;
    exports.svg_element = svg_element;
    exports.text = text;
    exports.tick = tick;
    exports.time_ranges_to_array = time_ranges_to_array;
    exports.to_number = to_number;
    exports.toggle_class = toggle_class;
    exports.transition_in = transition_in;
    exports.transition_out = transition_out;
    exports.trusted = trusted;
    exports.update_await_block_branch = update_await_block_branch;
    exports.update_keyed_each = update_keyed_each;
    exports.update_slot = update_slot;
    exports.update_slot_spread = update_slot_spread;
    exports.validate_component = validate_component2;
    exports.validate_each_argument = validate_each_argument;
    exports.validate_each_keys = validate_each_keys;
    exports.validate_slots = validate_slots;
    exports.validate_store = validate_store;
    exports.xlink_attr = xlink_attr;
  }
});

// node_modules/svelte/store/index.js
var require_store = __commonJS({
  "node_modules/svelte/store/index.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var internal = require_internal();
    var subscriber_queue3 = [];
    function readable2(value, start) {
      return {
        subscribe: writable3(value, start).subscribe
      };
    }
    function writable3(value, start = internal.noop) {
      let stop;
      const subscribers = new Set();
      function set(new_value) {
        if (internal.safe_not_equal(value, new_value)) {
          value = new_value;
          if (stop) {
            const run_queue = !subscriber_queue3.length;
            for (const subscriber of subscribers) {
              subscriber[1]();
              subscriber_queue3.push(subscriber, value);
            }
            if (run_queue) {
              for (let i = 0; i < subscriber_queue3.length; i += 2) {
                subscriber_queue3[i][0](subscriber_queue3[i + 1]);
              }
              subscriber_queue3.length = 0;
            }
          }
        }
      }
      function update(fn) {
        set(fn(value));
      }
      function subscribe2(run2, invalidate = internal.noop) {
        const subscriber = [run2, invalidate];
        subscribers.add(subscriber);
        if (subscribers.size === 1) {
          stop = start(set) || internal.noop;
        }
        run2(value);
        return () => {
          subscribers.delete(subscriber);
          if (subscribers.size === 0) {
            stop();
            stop = null;
          }
        };
      }
      return { set, update, subscribe: subscribe2 };
    }
    function derived(stores, fn, initial_value) {
      const single = !Array.isArray(stores);
      const stores_array = single ? [stores] : stores;
      const auto = fn.length < 2;
      return readable2(initial_value, (set) => {
        let inited = false;
        const values = [];
        let pending = 0;
        let cleanup = internal.noop;
        const sync = () => {
          if (pending) {
            return;
          }
          cleanup();
          const result = fn(single ? values[0] : values, set);
          if (auto) {
            set(result);
          } else {
            cleanup = internal.is_function(result) ? result : internal.noop;
          }
        };
        const unsubscribers = stores_array.map((store, i) => internal.subscribe(store, (value) => {
          values[i] = value;
          pending &= ~(1 << i);
          if (inited) {
            sync();
          }
        }, () => {
          pending |= 1 << i;
        }));
        inited = true;
        sync();
        return function stop() {
          internal.run_all(unsubscribers);
          cleanup();
        };
      });
    }
    Object.defineProperty(exports, "get", {
      enumerable: true,
      get: function() {
        return internal.get_store_value;
      }
    });
    exports.derived = derived;
    exports.readable = readable2;
    exports.writable = writable3;
  }
});

// node_modules/svelte-local-storage-store/dist/index.js
var require_dist = __commonJS({
  "node_modules/svelte-local-storage-store/dist/index.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var _store = require_store();
    var stores = {};
    function writable3(key, initialValue) {
      const browser = typeof localStorage != "undefined";
      function updateStorage(key2, value) {
        if (!browser)
          return;
        localStorage.setItem(key2, JSON.stringify(value));
      }
      if (!stores[key]) {
        const store = _store.writable.call(void 0, initialValue, (set2) => {
          const json = browser ? localStorage.getItem(key) : null;
          if (json) {
            set2(JSON.parse(json));
          }
          if (browser) {
            const handleStorage = (event) => {
              if (event.key === key)
                set2(event.newValue ? JSON.parse(event.newValue) : null);
            };
            window.addEventListener("storage", handleStorage);
            return () => window.removeEventListener("storage", handleStorage);
          }
        });
        const { subscribe: subscribe2, set } = store;
        stores[key] = {
          set(value) {
            updateStorage(key, value);
            set(value);
          },
          update(updater) {
            const value = updater(_store.get.call(void 0, store));
            updateStorage(key, value);
            set(value);
          },
          subscribe: subscribe2
        };
      }
      return stores[key];
    }
    exports.writable = writable3;
  }
});

// .svelte-kit/netlify/entry.js
__export(exports, {
  handler: () => handler
});
init_shims();

// .svelte-kit/output/server/app.js
init_shims();

// node_modules/@sveltejs/kit/dist/ssr.js
init_shims();

// node_modules/@sveltejs/kit/dist/adapter-utils.js
init_shims();
function isContentTypeTextual(content_type) {
  if (!content_type)
    return true;
  const [type] = content_type.split(";");
  return type === "text/plain" || type === "application/json" || type === "application/x-www-form-urlencoded" || type === "multipart/form-data";
}

// node_modules/@sveltejs/kit/dist/ssr.js
var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$";
var unsafeChars = /[<>\b\f\n\r\t\0\u2028\u2029]/g;
var reserved = /^(?:do|if|in|for|int|let|new|try|var|byte|case|char|else|enum|goto|long|this|void|with|await|break|catch|class|const|final|float|short|super|throw|while|yield|delete|double|export|import|native|return|switch|throws|typeof|boolean|default|extends|finally|package|private|abstract|continue|debugger|function|volatile|interface|protected|transient|implements|instanceof|synchronized)$/;
var escaped$1 = {
  "<": "\\u003C",
  ">": "\\u003E",
  "/": "\\u002F",
  "\\": "\\\\",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "	": "\\t",
  "\0": "\\0",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
};
var objectProtoOwnPropertyNames = Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
function devalue(value) {
  var counts = new Map();
  function walk(thing) {
    if (typeof thing === "function") {
      throw new Error("Cannot stringify a function");
    }
    if (counts.has(thing)) {
      counts.set(thing, counts.get(thing) + 1);
      return;
    }
    counts.set(thing, 1);
    if (!isPrimitive(thing)) {
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
        case "Date":
        case "RegExp":
          return;
        case "Array":
          thing.forEach(walk);
          break;
        case "Set":
        case "Map":
          Array.from(thing).forEach(walk);
          break;
        default:
          var proto = Object.getPrototypeOf(thing);
          if (proto !== Object.prototype && proto !== null && Object.getOwnPropertyNames(proto).sort().join("\0") !== objectProtoOwnPropertyNames) {
            throw new Error("Cannot stringify arbitrary non-POJOs");
          }
          if (Object.getOwnPropertySymbols(thing).length > 0) {
            throw new Error("Cannot stringify POJOs with symbolic keys");
          }
          Object.keys(thing).forEach(function(key) {
            return walk(thing[key]);
          });
      }
    }
  }
  walk(value);
  var names = new Map();
  Array.from(counts).filter(function(entry) {
    return entry[1] > 1;
  }).sort(function(a, b) {
    return b[1] - a[1];
  }).forEach(function(entry, i) {
    names.set(entry[0], getName(i));
  });
  function stringify(thing) {
    if (names.has(thing)) {
      return names.get(thing);
    }
    if (isPrimitive(thing)) {
      return stringifyPrimitive(thing);
    }
    var type = getType(thing);
    switch (type) {
      case "Number":
      case "String":
      case "Boolean":
        return "Object(" + stringify(thing.valueOf()) + ")";
      case "RegExp":
        return "new RegExp(" + stringifyString(thing.source) + ', "' + thing.flags + '")';
      case "Date":
        return "new Date(" + thing.getTime() + ")";
      case "Array":
        var members = thing.map(function(v, i) {
          return i in thing ? stringify(v) : "";
        });
        var tail = thing.length === 0 || thing.length - 1 in thing ? "" : ",";
        return "[" + members.join(",") + tail + "]";
      case "Set":
      case "Map":
        return "new " + type + "([" + Array.from(thing).map(stringify).join(",") + "])";
      default:
        var obj = "{" + Object.keys(thing).map(function(key) {
          return safeKey(key) + ":" + stringify(thing[key]);
        }).join(",") + "}";
        var proto = Object.getPrototypeOf(thing);
        if (proto === null) {
          return Object.keys(thing).length > 0 ? "Object.assign(Object.create(null)," + obj + ")" : "Object.create(null)";
        }
        return obj;
    }
  }
  var str = stringify(value);
  if (names.size) {
    var params_1 = [];
    var statements_1 = [];
    var values_1 = [];
    names.forEach(function(name, thing) {
      params_1.push(name);
      if (isPrimitive(thing)) {
        values_1.push(stringifyPrimitive(thing));
        return;
      }
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
          values_1.push("Object(" + stringify(thing.valueOf()) + ")");
          break;
        case "RegExp":
          values_1.push(thing.toString());
          break;
        case "Date":
          values_1.push("new Date(" + thing.getTime() + ")");
          break;
        case "Array":
          values_1.push("Array(" + thing.length + ")");
          thing.forEach(function(v, i) {
            statements_1.push(name + "[" + i + "]=" + stringify(v));
          });
          break;
        case "Set":
          values_1.push("new Set");
          statements_1.push(name + "." + Array.from(thing).map(function(v) {
            return "add(" + stringify(v) + ")";
          }).join("."));
          break;
        case "Map":
          values_1.push("new Map");
          statements_1.push(name + "." + Array.from(thing).map(function(_a) {
            var k = _a[0], v = _a[1];
            return "set(" + stringify(k) + ", " + stringify(v) + ")";
          }).join("."));
          break;
        default:
          values_1.push(Object.getPrototypeOf(thing) === null ? "Object.create(null)" : "{}");
          Object.keys(thing).forEach(function(key) {
            statements_1.push("" + name + safeProp(key) + "=" + stringify(thing[key]));
          });
      }
    });
    statements_1.push("return " + str);
    return "(function(" + params_1.join(",") + "){" + statements_1.join(";") + "}(" + values_1.join(",") + "))";
  } else {
    return str;
  }
}
function getName(num) {
  var name = "";
  do {
    name = chars[num % chars.length] + name;
    num = ~~(num / chars.length) - 1;
  } while (num >= 0);
  return reserved.test(name) ? name + "_" : name;
}
function isPrimitive(thing) {
  return Object(thing) !== thing;
}
function stringifyPrimitive(thing) {
  if (typeof thing === "string")
    return stringifyString(thing);
  if (thing === void 0)
    return "void 0";
  if (thing === 0 && 1 / thing < 0)
    return "-0";
  var str = String(thing);
  if (typeof thing === "number")
    return str.replace(/^(-)?0\./, "$1.");
  return str;
}
function getType(thing) {
  return Object.prototype.toString.call(thing).slice(8, -1);
}
function escapeUnsafeChar(c) {
  return escaped$1[c] || c;
}
function escapeUnsafeChars(str) {
  return str.replace(unsafeChars, escapeUnsafeChar);
}
function safeKey(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? key : escapeUnsafeChars(JSON.stringify(key));
}
function safeProp(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? "." + key : "[" + escapeUnsafeChars(JSON.stringify(key)) + "]";
}
function stringifyString(str) {
  var result = '"';
  for (var i = 0; i < str.length; i += 1) {
    var char = str.charAt(i);
    var code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped$1) {
      result += escaped$1[char];
    } else if (code >= 55296 && code <= 57343) {
      var next = str.charCodeAt(i + 1);
      if (code <= 56319 && (next >= 56320 && next <= 57343)) {
        result += char + str[++i];
      } else {
        result += "\\u" + code.toString(16).toUpperCase();
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
function noop() {
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
var subscriber_queue = [];
function writable(value, start = noop) {
  let stop;
  const subscribers = [];
  function set(new_value) {
    if (safe_not_equal(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue.length;
        for (let i = 0; i < subscribers.length; i += 1) {
          const s2 = subscribers[i];
          s2[1]();
          subscriber_queue.push(s2, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue.length; i += 2) {
            subscriber_queue[i][0](subscriber_queue[i + 1]);
          }
          subscriber_queue.length = 0;
        }
      }
    }
  }
  function update(fn) {
    set(fn(value));
  }
  function subscribe2(run2, invalidate = noop) {
    const subscriber = [run2, invalidate];
    subscribers.push(subscriber);
    if (subscribers.length === 1) {
      stop = start(set) || noop;
    }
    run2(value);
    return () => {
      const index2 = subscribers.indexOf(subscriber);
      if (index2 !== -1) {
        subscribers.splice(index2, 1);
      }
      if (subscribers.length === 0) {
        stop();
        stop = null;
      }
    };
  }
  return { set, update, subscribe: subscribe2 };
}
function hash(value) {
  let hash2 = 5381;
  let i = value.length;
  if (typeof value === "string") {
    while (i)
      hash2 = hash2 * 33 ^ value.charCodeAt(--i);
  } else {
    while (i)
      hash2 = hash2 * 33 ^ value[--i];
  }
  return (hash2 >>> 0).toString(36);
}
var s$1 = JSON.stringify;
async function render_response({
  options: options2,
  $session,
  page_config,
  status,
  error: error3,
  branch,
  page: page2
}) {
  const css2 = new Set(options2.entry.css);
  const js = new Set(options2.entry.js);
  const styles = new Set();
  const serialized_data = [];
  let rendered;
  let is_private = false;
  let maxage;
  if (error3) {
    error3.stack = options2.get_stack(error3);
  }
  if (branch) {
    branch.forEach(({ node, loaded, fetched, uses_credentials }) => {
      if (node.css)
        node.css.forEach((url) => css2.add(url));
      if (node.js)
        node.js.forEach((url) => js.add(url));
      if (node.styles)
        node.styles.forEach((content) => styles.add(content));
      if (fetched && page_config.hydrate)
        serialized_data.push(...fetched);
      if (uses_credentials)
        is_private = true;
      maxage = loaded.maxage;
    });
    const session = writable($session);
    const props = {
      stores: {
        page: writable(null),
        navigating: writable(null),
        session
      },
      page: page2,
      components: branch.map(({ node }) => node.module.default)
    };
    for (let i = 0; i < branch.length; i += 1) {
      props[`props_${i}`] = await branch[i].loaded.props;
    }
    let session_tracking_active = false;
    const unsubscribe = session.subscribe(() => {
      if (session_tracking_active)
        is_private = true;
    });
    session_tracking_active = true;
    try {
      rendered = options2.root.render(props);
    } finally {
      unsubscribe();
    }
  } else {
    rendered = { head: "", html: "", css: { code: "", map: null } };
  }
  const include_js = page_config.router || page_config.hydrate;
  if (!include_js)
    js.clear();
  const links = options2.amp ? styles.size > 0 || rendered.css.code.length > 0 ? `<style amp-custom>${Array.from(styles).concat(rendered.css.code).join("\n")}</style>` : "" : [
    ...Array.from(js).map((dep) => `<link rel="modulepreload" href="${dep}">`),
    ...Array.from(css2).map((dep) => `<link rel="stylesheet" href="${dep}">`)
  ].join("\n		");
  let init2 = "";
  if (options2.amp) {
    init2 = `
		<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
		<noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
		<script async src="https://cdn.ampproject.org/v0.js"><\/script>`;
  } else if (include_js) {
    init2 = `<script type="module">
			import { start } from ${s$1(options2.entry.file)};
			start({
				target: ${options2.target ? `document.querySelector(${s$1(options2.target)})` : "document.body"},
				paths: ${s$1(options2.paths)},
				session: ${try_serialize($session, (error4) => {
      throw new Error(`Failed to serialize session data: ${error4.message}`);
    })},
				host: ${page2 && page2.host ? s$1(page2.host) : "location.host"},
				route: ${!!page_config.router},
				spa: ${!page_config.ssr},
				trailing_slash: ${s$1(options2.trailing_slash)},
				hydrate: ${page_config.ssr && page_config.hydrate ? `{
					status: ${status},
					error: ${serialize_error(error3)},
					nodes: [
						${(branch || []).map(({ node }) => `import(${s$1(node.entry)})`).join(",\n						")}
					],
					page: {
						host: ${page2 && page2.host ? s$1(page2.host) : "location.host"}, // TODO this is redundant
						path: ${s$1(page2 && page2.path)},
						query: new URLSearchParams(${page2 ? s$1(page2.query.toString()) : ""}),
						params: ${page2 && s$1(page2.params)}
					}
				}` : "null"}
			});
		<\/script>`;
  }
  if (options2.service_worker) {
    init2 += `<script>
			if ('serviceWorker' in navigator) {
				navigator.serviceWorker.register('${options2.service_worker}');
			}
		<\/script>`;
  }
  const head = [
    rendered.head,
    styles.size && !options2.amp ? `<style data-svelte>${Array.from(styles).join("\n")}</style>` : "",
    links,
    init2
  ].join("\n\n		");
  const body = options2.amp ? rendered.html : `${rendered.html}

			${serialized_data.map(({ url, body: body2, json }) => {
    let attributes = `type="application/json" data-type="svelte-data" data-url="${url}"`;
    if (body2)
      attributes += ` data-body="${hash(body2)}"`;
    return `<script ${attributes}>${json}<\/script>`;
  }).join("\n\n			")}
		`.replace(/^\t{2}/gm, "");
  const headers = {
    "content-type": "text/html"
  };
  if (maxage) {
    headers["cache-control"] = `${is_private ? "private" : "public"}, max-age=${maxage}`;
  }
  if (!options2.floc) {
    headers["permissions-policy"] = "interest-cohort=()";
  }
  return {
    status,
    headers,
    body: options2.template({ head, body })
  };
}
function try_serialize(data, fail) {
  try {
    return devalue(data);
  } catch (err) {
    if (fail)
      fail(err);
    return null;
  }
}
function serialize_error(error3) {
  if (!error3)
    return null;
  let serialized = try_serialize(error3);
  if (!serialized) {
    const { name, message, stack } = error3;
    serialized = try_serialize({ ...error3, name, message, stack });
  }
  if (!serialized) {
    serialized = "{}";
  }
  return serialized;
}
function normalize(loaded) {
  const has_error_status = loaded.status && loaded.status >= 400 && loaded.status <= 599 && !loaded.redirect;
  if (loaded.error || has_error_status) {
    const status = loaded.status;
    if (!loaded.error && has_error_status) {
      return {
        status: status || 500,
        error: new Error()
      };
    }
    const error3 = typeof loaded.error === "string" ? new Error(loaded.error) : loaded.error;
    if (!(error3 instanceof Error)) {
      return {
        status: 500,
        error: new Error(`"error" property returned from load() must be a string or instance of Error, received type "${typeof error3}"`)
      };
    }
    if (!status || status < 400 || status > 599) {
      console.warn('"error" returned from load() without a valid status code \u2014 defaulting to 500');
      return { status: 500, error: error3 };
    }
    return { status, error: error3 };
  }
  if (loaded.redirect) {
    if (!loaded.status || Math.floor(loaded.status / 100) !== 3) {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be accompanied by a 3xx status code')
      };
    }
    if (typeof loaded.redirect !== "string") {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be a string')
      };
    }
  }
  return loaded;
}
var absolute = /^([a-z]+:)?\/?\//;
function resolve(base, path) {
  const base_match = absolute.exec(base);
  const path_match = absolute.exec(path);
  if (!base_match) {
    throw new Error(`bad base path: "${base}"`);
  }
  const baseparts = path_match ? [] : base.slice(base_match[0].length).split("/");
  const pathparts = path_match ? path.slice(path_match[0].length).split("/") : path.split("/");
  baseparts.pop();
  for (let i = 0; i < pathparts.length; i += 1) {
    const part = pathparts[i];
    if (part === ".")
      continue;
    else if (part === "..")
      baseparts.pop();
    else
      baseparts.push(part);
  }
  const prefix = path_match && path_match[0] || base_match && base_match[0] || "";
  return `${prefix}${baseparts.join("/")}`;
}
var s = JSON.stringify;
async function load_node({
  request,
  options: options2,
  state,
  route,
  page: page2,
  node,
  $session,
  context,
  is_leaf,
  is_error,
  status,
  error: error3
}) {
  const { module: module2 } = node;
  let uses_credentials = false;
  const fetched = [];
  let loaded;
  if (module2.load) {
    const load_input = {
      page: page2,
      get session() {
        uses_credentials = true;
        return $session;
      },
      fetch: async (resource, opts = {}) => {
        let url;
        if (typeof resource === "string") {
          url = resource;
        } else {
          url = resource.url;
          opts = {
            method: resource.method,
            headers: resource.headers,
            body: resource.body,
            mode: resource.mode,
            credentials: resource.credentials,
            cache: resource.cache,
            redirect: resource.redirect,
            referrer: resource.referrer,
            integrity: resource.integrity,
            ...opts
          };
        }
        const resolved = resolve(request.path, url.split("?")[0]);
        let response;
        const filename = resolved.replace(options2.paths.assets, "").slice(1);
        const filename_html = `${filename}/index.html`;
        const asset = options2.manifest.assets.find((d) => d.file === filename || d.file === filename_html);
        if (asset) {
          response = options2.read ? new Response(options2.read(asset.file), {
            headers: asset.type ? {
              "content-type": asset.type
            } : {}
          }) : await fetch(`http://${page2.host}/${asset.file}`, opts);
        } else if (resolved.startsWith(options2.paths.base || "/")) {
          const relative = resolved.replace(options2.paths.base, "");
          const headers = { ...opts.headers };
          if (opts.credentials !== "omit") {
            uses_credentials = true;
            headers.cookie = request.headers.cookie;
            if (!headers.authorization) {
              headers.authorization = request.headers.authorization;
            }
          }
          if (opts.body && typeof opts.body !== "string") {
            throw new Error("Request body must be a string");
          }
          const search = url.includes("?") ? url.slice(url.indexOf("?") + 1) : "";
          const rendered = await respond({
            host: request.host,
            method: opts.method || "GET",
            headers,
            path: relative,
            rawBody: opts.body,
            query: new URLSearchParams(search)
          }, options2, {
            fetched: url,
            initiator: route
          });
          if (rendered) {
            if (state.prerender) {
              state.prerender.dependencies.set(relative, rendered);
            }
            response = new Response(rendered.body, {
              status: rendered.status,
              headers: rendered.headers
            });
          }
        } else {
          if (resolved.startsWith("//")) {
            throw new Error(`Cannot request protocol-relative URL (${url}) in server-side fetch`);
          }
          if (typeof request.host !== "undefined") {
            const { hostname: fetch_hostname } = new URL(url);
            const [server_hostname] = request.host.split(":");
            if (`.${fetch_hostname}`.endsWith(`.${server_hostname}`) && opts.credentials !== "omit") {
              uses_credentials = true;
              opts.headers = {
                ...opts.headers,
                cookie: request.headers.cookie
              };
            }
          }
          const external_request = new Request(url, opts);
          response = await options2.hooks.serverFetch.call(null, external_request);
        }
        if (response) {
          const proxy = new Proxy(response, {
            get(response2, key, receiver) {
              async function text() {
                const body = await response2.text();
                const headers = {};
                for (const [key2, value] of response2.headers) {
                  if (key2 !== "etag" && key2 !== "set-cookie")
                    headers[key2] = value;
                }
                if (!opts.body || typeof opts.body === "string") {
                  fetched.push({
                    url,
                    body: opts.body,
                    json: `{"status":${response2.status},"statusText":${s(response2.statusText)},"headers":${s(headers)},"body":${escape(body)}}`
                  });
                }
                return body;
              }
              if (key === "text") {
                return text;
              }
              if (key === "json") {
                return async () => {
                  return JSON.parse(await text());
                };
              }
              return Reflect.get(response2, key, response2);
            }
          });
          return proxy;
        }
        return response || new Response("Not found", {
          status: 404
        });
      },
      context: { ...context }
    };
    if (is_error) {
      load_input.status = status;
      load_input.error = error3;
    }
    loaded = await module2.load.call(null, load_input);
  } else {
    loaded = {};
  }
  if (!loaded && is_leaf && !is_error)
    return;
  if (!loaded) {
    throw new Error(`${node.entry} - load must return a value except for page fall through`);
  }
  return {
    node,
    loaded: normalize(loaded),
    context: loaded.context || context,
    fetched,
    uses_credentials
  };
}
var escaped = {
  "<": "\\u003C",
  ">": "\\u003E",
  "/": "\\u002F",
  "\\": "\\\\",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "	": "\\t",
  "\0": "\\0",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
};
function escape(str) {
  let result = '"';
  for (let i = 0; i < str.length; i += 1) {
    const char = str.charAt(i);
    const code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped) {
      result += escaped[char];
    } else if (code >= 55296 && code <= 57343) {
      const next = str.charCodeAt(i + 1);
      if (code <= 56319 && next >= 56320 && next <= 57343) {
        result += char + str[++i];
      } else {
        result += `\\u${code.toString(16).toUpperCase()}`;
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
function lowercase_keys(obj) {
  const clone2 = {};
  for (const key in obj) {
    clone2[key.toLowerCase()] = obj[key];
  }
  return clone2;
}
function coalesce_to_error(err) {
  return err instanceof Error ? err : new Error(JSON.stringify(err));
}
async function respond_with_error({ request, options: options2, state, $session, status, error: error3 }) {
  const default_layout = await options2.load_component(options2.manifest.layout);
  const default_error = await options2.load_component(options2.manifest.error);
  const page2 = {
    host: request.host,
    path: request.path,
    query: request.query,
    params: {}
  };
  const loaded = await load_node({
    request,
    options: options2,
    state,
    route: null,
    page: page2,
    node: default_layout,
    $session,
    context: {},
    is_leaf: false,
    is_error: false
  });
  const branch = [
    loaded,
    await load_node({
      request,
      options: options2,
      state,
      route: null,
      page: page2,
      node: default_error,
      $session,
      context: loaded ? loaded.context : {},
      is_leaf: false,
      is_error: true,
      status,
      error: error3
    })
  ];
  try {
    return await render_response({
      options: options2,
      $session,
      page_config: {
        hydrate: options2.hydrate,
        router: options2.router,
        ssr: options2.ssr
      },
      status,
      error: error3,
      branch,
      page: page2
    });
  } catch (err) {
    const error4 = coalesce_to_error(err);
    options2.handle_error(error4);
    return {
      status: 500,
      headers: {},
      body: error4.stack
    };
  }
}
async function respond$1({ request, options: options2, state, $session, route }) {
  const match = route.pattern.exec(request.path);
  const params = route.params(match);
  const page2 = {
    host: request.host,
    path: request.path,
    query: request.query,
    params
  };
  let nodes;
  try {
    nodes = await Promise.all(route.a.map((id) => options2.load_component(id)));
  } catch (err) {
    const error4 = coalesce_to_error(err);
    options2.handle_error(error4);
    return await respond_with_error({
      request,
      options: options2,
      state,
      $session,
      status: 500,
      error: error4
    });
  }
  const leaf = nodes[nodes.length - 1].module;
  const page_config = {
    ssr: "ssr" in leaf ? !!leaf.ssr : options2.ssr,
    router: "router" in leaf ? !!leaf.router : options2.router,
    hydrate: "hydrate" in leaf ? !!leaf.hydrate : options2.hydrate
  };
  if (!leaf.prerender && state.prerender && !state.prerender.all) {
    return {
      status: 204,
      headers: {},
      body: ""
    };
  }
  let branch;
  let status = 200;
  let error3;
  ssr:
    if (page_config.ssr) {
      let context = {};
      branch = [];
      for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];
        let loaded;
        if (node) {
          try {
            loaded = await load_node({
              request,
              options: options2,
              state,
              route,
              page: page2,
              node,
              $session,
              context,
              is_leaf: i === nodes.length - 1,
              is_error: false
            });
            if (!loaded)
              return;
            if (loaded.loaded.redirect) {
              return {
                status: loaded.loaded.status,
                headers: {
                  location: encodeURI(loaded.loaded.redirect)
                }
              };
            }
            if (loaded.loaded.error) {
              ({ status, error: error3 } = loaded.loaded);
            } else {
              branch.push(loaded);
            }
          } catch (err) {
            const e = coalesce_to_error(err);
            options2.handle_error(e);
            status = 500;
            error3 = e;
          }
          if (error3) {
            while (i--) {
              if (route.b[i]) {
                const error_node = await options2.load_component(route.b[i]);
                let error_loaded;
                let node_loaded;
                let j = i;
                while (!(node_loaded = branch[j])) {
                  j -= 1;
                }
                try {
                  error_loaded = await load_node({
                    request,
                    options: options2,
                    state,
                    route,
                    page: page2,
                    node: error_node,
                    $session,
                    context: node_loaded.context,
                    is_leaf: false,
                    is_error: true,
                    status,
                    error: error3
                  });
                  if (error_loaded.loaded.error) {
                    continue;
                  }
                  branch = branch.slice(0, j + 1).concat(error_loaded);
                  break ssr;
                } catch (err) {
                  const e = coalesce_to_error(err);
                  options2.handle_error(e);
                  continue;
                }
              }
            }
            return await respond_with_error({
              request,
              options: options2,
              state,
              $session,
              status,
              error: error3
            });
          }
        }
        if (loaded && loaded.loaded.context) {
          context = {
            ...context,
            ...loaded.loaded.context
          };
        }
      }
    }
  try {
    return await render_response({
      options: options2,
      $session,
      page_config,
      status,
      error: error3,
      branch: branch && branch.filter(Boolean),
      page: page2
    });
  } catch (err) {
    const error4 = coalesce_to_error(err);
    options2.handle_error(error4);
    return await respond_with_error({
      request,
      options: options2,
      state,
      $session,
      status: 500,
      error: error4
    });
  }
}
async function render_page(request, route, options2, state) {
  if (state.initiator === route) {
    return {
      status: 404,
      headers: {},
      body: `Not found: ${request.path}`
    };
  }
  const $session = await options2.hooks.getSession(request);
  if (route) {
    const response = await respond$1({
      request,
      options: options2,
      state,
      $session,
      route
    });
    if (response) {
      return response;
    }
    return {
      status: 500,
      headers: {},
      body: `Bad request in load function: failed to fetch ${state.fetched}`
    };
  } else {
    return await respond_with_error({
      request,
      options: options2,
      state,
      $session,
      status: 404,
      error: new Error(`Not found: ${request.path}`)
    });
  }
}
function error(body) {
  return {
    status: 500,
    body,
    headers: {}
  };
}
function is_string(s2) {
  return typeof s2 === "string" || s2 instanceof String;
}
async function render_route(request, route) {
  const mod = await route.load();
  const handler2 = mod[request.method.toLowerCase().replace("delete", "del")];
  if (!handler2) {
    return error("no handler");
  }
  const match = route.pattern.exec(request.path);
  if (!match) {
    return error("could not parse parameters from request path");
  }
  const params = route.params(match);
  const response = await handler2({ ...request, params });
  const preface = `Invalid response from route ${request.path}`;
  if (!response) {
    return error("no response");
  }
  if (typeof response !== "object") {
    return error(`${preface}: expected an object, got ${typeof response}`);
  }
  let { status = 200, body, headers = {} } = response;
  headers = lowercase_keys(headers);
  const type = headers["content-type"];
  const is_type_textual = isContentTypeTextual(type);
  if (!is_type_textual && !(body instanceof Uint8Array || is_string(body))) {
    return error(`${preface}: body must be an instance of string or Uint8Array if content-type is not a supported textual content-type`);
  }
  let normalized_body;
  if ((typeof body === "object" || typeof body === "undefined") && !(body instanceof Uint8Array) && (!type || type.startsWith("application/json"))) {
    headers = { ...headers, "content-type": "application/json; charset=utf-8" };
    normalized_body = JSON.stringify(typeof body === "undefined" ? {} : body);
  } else {
    normalized_body = body;
  }
  return { status, body: normalized_body, headers };
}
function read_only_form_data() {
  const map = new Map();
  return {
    append(key, value) {
      if (map.has(key)) {
        (map.get(key) || []).push(value);
      } else {
        map.set(key, [value]);
      }
    },
    data: new ReadOnlyFormData(map)
  };
}
var ReadOnlyFormData = class {
  #map;
  constructor(map) {
    this.#map = map;
  }
  get(key) {
    const value = this.#map.get(key);
    return value && value[0];
  }
  getAll(key) {
    return this.#map.get(key);
  }
  has(key) {
    return this.#map.has(key);
  }
  *[Symbol.iterator]() {
    for (const [key, value] of this.#map) {
      for (let i = 0; i < value.length; i += 1) {
        yield [key, value[i]];
      }
    }
  }
  *entries() {
    for (const [key, value] of this.#map) {
      for (let i = 0; i < value.length; i += 1) {
        yield [key, value[i]];
      }
    }
  }
  *keys() {
    for (const [key] of this.#map)
      yield key;
  }
  *values() {
    for (const [, value] of this.#map) {
      for (let i = 0; i < value.length; i += 1) {
        yield value[i];
      }
    }
  }
};
function parse_body(raw, headers) {
  if (!raw)
    return raw;
  if (typeof raw === "string") {
    const [type, ...directives] = headers["content-type"].split(/;\s*/);
    switch (type) {
      case "text/plain":
        return raw;
      case "application/json":
        return JSON.parse(raw);
      case "application/x-www-form-urlencoded":
        return get_urlencoded(raw);
      case "multipart/form-data": {
        const boundary = directives.find((directive) => directive.startsWith("boundary="));
        if (!boundary)
          throw new Error("Missing boundary");
        return get_multipart(raw, boundary.slice("boundary=".length));
      }
      default:
        throw new Error(`Invalid Content-Type ${type}`);
    }
  }
  return raw;
}
function get_urlencoded(text) {
  const { data, append } = read_only_form_data();
  text.replace(/\+/g, " ").split("&").forEach((str) => {
    const [key, value] = str.split("=");
    append(decodeURIComponent(key), decodeURIComponent(value));
  });
  return data;
}
function get_multipart(text, boundary) {
  const parts = text.split(`--${boundary}`);
  if (parts[0] !== "" || parts[parts.length - 1].trim() !== "--") {
    throw new Error("Malformed form data");
  }
  const { data, append } = read_only_form_data();
  parts.slice(1, -1).forEach((part) => {
    const match = /\s*([\s\S]+?)\r\n\r\n([\s\S]*)\s*/.exec(part);
    if (!match) {
      throw new Error("Malformed form data");
    }
    const raw_headers = match[1];
    const body = match[2].trim();
    let key;
    raw_headers.split("\r\n").forEach((str) => {
      const [raw_header, ...raw_directives] = str.split("; ");
      let [name, value] = raw_header.split(": ");
      name = name.toLowerCase();
      const directives = {};
      raw_directives.forEach((raw_directive) => {
        const [name2, value2] = raw_directive.split("=");
        directives[name2] = JSON.parse(value2);
      });
      if (name === "content-disposition") {
        if (value !== "form-data")
          throw new Error("Malformed form data");
        if (directives.filename) {
          throw new Error("File upload is not yet implemented");
        }
        if (directives.name) {
          key = directives.name;
        }
      }
    });
    if (!key)
      throw new Error("Malformed form data");
    append(key, body);
  });
  return data;
}
async function respond(incoming, options2, state = {}) {
  if (incoming.path !== "/" && options2.trailing_slash !== "ignore") {
    const has_trailing_slash = incoming.path.endsWith("/");
    if (has_trailing_slash && options2.trailing_slash === "never" || !has_trailing_slash && options2.trailing_slash === "always" && !(incoming.path.split("/").pop() || "").includes(".")) {
      const path = has_trailing_slash ? incoming.path.slice(0, -1) : incoming.path + "/";
      const q = incoming.query.toString();
      return {
        status: 301,
        headers: {
          location: encodeURI(path + (q ? `?${q}` : ""))
        }
      };
    }
  }
  try {
    const headers = lowercase_keys(incoming.headers);
    return await options2.hooks.handle({
      request: {
        ...incoming,
        headers,
        body: parse_body(incoming.rawBody, headers),
        params: {},
        locals: {}
      },
      resolve: async (request) => {
        if (state.prerender && state.prerender.fallback) {
          return await render_response({
            options: options2,
            $session: await options2.hooks.getSession(request),
            page_config: { ssr: false, router: true, hydrate: true },
            status: 200,
            branch: []
          });
        }
        for (const route of options2.manifest.routes) {
          if (!route.pattern.test(request.path))
            continue;
          const response = route.type === "endpoint" ? await render_route(request, route) : await render_page(request, route, options2, state);
          if (response) {
            if (response.status === 200) {
              if (!/(no-store|immutable)/.test(response.headers["cache-control"])) {
                const etag = `"${hash(response.body || "")}"`;
                if (request.headers["if-none-match"] === etag) {
                  return {
                    status: 304,
                    headers: {},
                    body: ""
                  };
                }
                response.headers["etag"] = etag;
              }
            }
            return response;
          }
        }
        return await render_page(request, null, options2, state);
      }
    });
  } catch (err) {
    const e = coalesce_to_error(err);
    options2.handle_error(e);
    return {
      status: 500,
      headers: {},
      body: options2.dev ? e.stack : e.message
    };
  }
}

// .svelte-kit/output/server/app.js
var import_cookie = __toModule(require_cookie());

// node_modules/@lukeed/uuid/dist/index.mjs
init_shims();
var IDX = 256;
var HEX = [];
var BUFFER;
while (IDX--)
  HEX[IDX] = (IDX + 256).toString(16).substring(1);
function v4() {
  var i = 0, num, out = "";
  if (!BUFFER || IDX + 16 > 256) {
    BUFFER = Array(i = 256);
    while (i--)
      BUFFER[i] = 256 * Math.random() | 0;
    i = IDX = 0;
  }
  for (; i < 16; i++) {
    num = BUFFER[IDX + i];
    if (i == 6)
      out += HEX[num & 15 | 64];
    else if (i == 8)
      out += HEX[num & 63 | 128];
    else
      out += HEX[num];
    if (i & 1 && i > 1 && i < 11)
      out += "-";
  }
  IDX++;
  return out;
}

// .svelte-kit/output/server/app.js
var import_svelte_local_storage_store = __toModule(require_dist());
function noop2() {
}
function run(fn) {
  return fn();
}
function blank_object() {
  return Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
function safe_not_equal2(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
function subscribe(store, ...callbacks) {
  if (store == null) {
    return noop2;
  }
  const unsub = store.subscribe(...callbacks);
  return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
var current_component;
function set_current_component(component) {
  current_component = component;
}
function get_current_component() {
  if (!current_component)
    throw new Error("Function called outside component initialization");
  return current_component;
}
function setContext(key, context) {
  get_current_component().$$.context.set(key, context);
}
function getContext(key) {
  return get_current_component().$$.context.get(key);
}
Promise.resolve();
var escaped2 = {
  '"': "&quot;",
  "'": "&#39;",
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;"
};
function escape2(html) {
  return String(html).replace(/["'&<>]/g, (match) => escaped2[match]);
}
var missing_component = {
  $$render: () => ""
};
function validate_component(component, name) {
  if (!component || !component.$$render) {
    if (name === "svelte:component")
      name += " this={...}";
    throw new Error(`<${name}> is not a valid SSR component. You may need to review your build config to ensure that dependencies are compiled, rather than imported as pre-compiled modules`);
  }
  return component;
}
var on_destroy;
function create_ssr_component(fn) {
  function $$render(result, props, bindings, slots, context) {
    const parent_component = current_component;
    const $$ = {
      on_destroy,
      context: new Map(parent_component ? parent_component.$$.context : context || []),
      on_mount: [],
      before_update: [],
      after_update: [],
      callbacks: blank_object()
    };
    set_current_component({ $$ });
    const html = fn(result, props, bindings, slots);
    set_current_component(parent_component);
    return html;
  }
  return {
    render: (props = {}, { $$slots = {}, context = new Map() } = {}) => {
      on_destroy = [];
      const result = { title: "", head: "", css: new Set() };
      const html = $$render(result, props, {}, $$slots, context);
      run_all(on_destroy);
      return {
        html,
        css: {
          code: Array.from(result.css).map((css2) => css2.code).join("\n"),
          map: null
        },
        head: result.title + result.head
      };
    },
    $$render
  };
}
function add_attribute(name, value, boolean) {
  if (value == null || boolean && !value)
    return "";
  return ` ${name}${value === true ? "" : `=${typeof value === "string" ? JSON.stringify(escape2(value)) : `"${value}"`}`}`;
}
function afterUpdate() {
}
var css$7 = {
  code: "#svelte-announcer.svelte-1pdgbjn{clip:rect(0 0 0 0);-webkit-clip-path:inset(50%);clip-path:inset(50%);height:1px;left:0;overflow:hidden;position:absolute;top:0;white-space:nowrap;width:1px}",
  map: `{"version":3,"file":"root.svelte","sources":["root.svelte"],"sourcesContent":["<!-- This file is generated by @sveltejs/kit \u2014 do not edit it! -->\\n<script>\\n\\timport { setContext, afterUpdate, onMount } from 'svelte';\\n\\n\\t// stores\\n\\texport let stores;\\n\\texport let page;\\n\\n\\texport let components;\\n\\texport let props_0 = null;\\n\\texport let props_1 = null;\\n\\texport let props_2 = null;\\n\\n\\tsetContext('__svelte__', stores);\\n\\n\\t$: stores.page.set(page);\\n\\tafterUpdate(stores.page.notify);\\n\\n\\tlet mounted = false;\\n\\tlet navigated = false;\\n\\tlet title = null;\\n\\n\\tonMount(() => {\\n\\t\\tconst unsubscribe = stores.page.subscribe(() => {\\n\\t\\t\\tif (mounted) {\\n\\t\\t\\t\\tnavigated = true;\\n\\t\\t\\t\\ttitle = document.title || 'untitled page';\\n\\t\\t\\t}\\n\\t\\t});\\n\\n\\t\\tmounted = true;\\n\\t\\treturn unsubscribe;\\n\\t});\\n<\/script>\\n\\n<svelte:component this={components[0]} {...(props_0 || {})}>\\n\\t{#if components[1]}\\n\\t\\t<svelte:component this={components[1]} {...(props_1 || {})}>\\n\\t\\t\\t{#if components[2]}\\n\\t\\t\\t\\t<svelte:component this={components[2]} {...(props_2 || {})}/>\\n\\t\\t\\t{/if}\\n\\t\\t</svelte:component>\\n\\t{/if}\\n</svelte:component>\\n\\n{#if mounted}\\n\\t<div id=\\"svelte-announcer\\" aria-live=\\"assertive\\" aria-atomic=\\"true\\">\\n\\t\\t{#if navigated}\\n\\t\\t\\t{title}\\n\\t\\t{/if}\\n\\t</div>\\n{/if}\\n\\n<style>#svelte-announcer{clip:rect(0 0 0 0);-webkit-clip-path:inset(50%);clip-path:inset(50%);height:1px;left:0;overflow:hidden;position:absolute;top:0;white-space:nowrap;width:1px}</style>"],"names":[],"mappings":"AAqDO,gCAAiB,CAAC,KAAK,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,kBAAkB,MAAM,GAAG,CAAC,CAAC,UAAU,MAAM,GAAG,CAAC,CAAC,OAAO,GAAG,CAAC,KAAK,CAAC,CAAC,SAAS,MAAM,CAAC,SAAS,QAAQ,CAAC,IAAI,CAAC,CAAC,YAAY,MAAM,CAAC,MAAM,GAAG,CAAC"}`
};
var Root = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { stores } = $$props;
  let { page: page2 } = $$props;
  let { components } = $$props;
  let { props_0 = null } = $$props;
  let { props_1 = null } = $$props;
  let { props_2 = null } = $$props;
  setContext("__svelte__", stores);
  afterUpdate(stores.page.notify);
  if ($$props.stores === void 0 && $$bindings.stores && stores !== void 0)
    $$bindings.stores(stores);
  if ($$props.page === void 0 && $$bindings.page && page2 !== void 0)
    $$bindings.page(page2);
  if ($$props.components === void 0 && $$bindings.components && components !== void 0)
    $$bindings.components(components);
  if ($$props.props_0 === void 0 && $$bindings.props_0 && props_0 !== void 0)
    $$bindings.props_0(props_0);
  if ($$props.props_1 === void 0 && $$bindings.props_1 && props_1 !== void 0)
    $$bindings.props_1(props_1);
  if ($$props.props_2 === void 0 && $$bindings.props_2 && props_2 !== void 0)
    $$bindings.props_2(props_2);
  $$result.css.add(css$7);
  {
    stores.page.set(page2);
  }
  return `


${validate_component(components[0] || missing_component, "svelte:component").$$render($$result, Object.assign(props_0 || {}), {}, {
    default: () => `${components[1] ? `${validate_component(components[1] || missing_component, "svelte:component").$$render($$result, Object.assign(props_1 || {}), {}, {
      default: () => `${components[2] ? `${validate_component(components[2] || missing_component, "svelte:component").$$render($$result, Object.assign(props_2 || {}), {}, {})}` : ``}`
    })}` : ``}`
  })}

${``}`;
});
function set_paths(paths) {
}
function set_prerendering(value) {
}
var handle = async ({ request, resolve: resolve2 }) => {
  const cookies = import_cookie.default.parse(request.headers.cookie || "");
  request.locals.userid = cookies.userid || v4();
  if (request.query.has("_method")) {
    request.method = request.query.get("_method").toUpperCase();
  }
  const response = await resolve2(request);
  if (!cookies.userid) {
    response.headers["set-cookie"] = `userid=${request.locals.userid}; Path=/; HttpOnly`;
  }
  return response;
};
var user_hooks = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  handle
});
var template = ({ head, body }) => '<!DOCTYPE html>\n<html lang="en">\n\n<head>\n    <meta charset="utf-8" />\n    <link rel="icon" type="image/svg+xml" href="/favicon.svg">\n    <link rel="alternate icon" href="/favicon.png">\n    <meta name="viewport" content="width=device-width, initial-scale=1" /> ' + head + '\n</head>\n\n<body>\n    <div id="svelte">' + body + "</div>\n</body>\n\n</html>";
var options = null;
var default_settings = { paths: { "base": "", "assets": "/." } };
function init(settings = default_settings) {
  set_paths(settings.paths);
  set_prerendering(settings.prerendering || false);
  options = {
    amp: false,
    dev: false,
    entry: {
      file: "/./_app/start-c49c7607.js",
      css: ["/./_app/assets/start-0826e215.css"],
      js: ["/./_app/start-c49c7607.js", "/./_app/chunks/vendor-69ce0b92.js"]
    },
    fetched: void 0,
    floc: false,
    get_component_path: (id) => "/./_app/" + entry_lookup[id],
    get_stack: (error22) => String(error22),
    handle_error: (error22) => {
      if (error22.frame) {
        console.error(error22.frame);
      }
      console.error(error22.stack);
      error22.stack = options.get_stack(error22);
    },
    hooks: get_hooks(user_hooks),
    hydrate: true,
    initiator: void 0,
    load_component,
    manifest,
    paths: settings.paths,
    read: settings.read,
    root: Root,
    service_worker: null,
    router: true,
    ssr: true,
    target: "#svelte",
    template,
    trailing_slash: "never"
  };
}
var empty = () => ({});
var manifest = {
  assets: [{ "file": "favicon.png", "size": 1369, "type": "image/png" }, { "file": "favicon.svg", "size": 977, "type": "image/svg+xml" }, { "file": "fonts/Inter-Bold.woff2", "size": 106140, "type": "font/woff2" }, { "file": "fonts/Inter-BoldItalic.woff2", "size": 111808, "type": "font/woff2" }, { "file": "fonts/Inter-italic.var.woff2", "size": 245036, "type": "font/woff2" }, { "file": "fonts/Inter-Italic.woff2", "size": 106876, "type": "font/woff2" }, { "file": "fonts/Inter-Regular.woff2", "size": 98868, "type": "font/woff2" }, { "file": "fonts/Inter-roman.var.woff2", "size": 227180, "type": "font/woff2" }, { "file": "Goran-Alkovic-CV.pdf", "size": 189949, "type": "application/pdf" }, { "file": "robots.txt", "size": 67, "type": "text/plain" }],
  layout: "src/routes/__layout.svelte",
  error: ".svelte-kit/build/components/error.svelte",
  routes: [
    {
      type: "page",
      pattern: /^\/$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/index.svelte"],
      b: [".svelte-kit/build/components/error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/work\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/work/index.svelte"],
      b: [".svelte-kit/build/components/error.svelte"]
    }
  ]
};
var get_hooks = (hooks) => ({
  getSession: hooks.getSession || (() => ({})),
  handle: hooks.handle || (({ request, resolve: resolve2 }) => resolve2(request)),
  serverFetch: hooks.serverFetch || fetch
});
var module_lookup = {
  "src/routes/__layout.svelte": () => Promise.resolve().then(function() {
    return __layout;
  }),
  ".svelte-kit/build/components/error.svelte": () => Promise.resolve().then(function() {
    return error2;
  }),
  "src/routes/index.svelte": () => Promise.resolve().then(function() {
    return index$1;
  }),
  "src/routes/work/index.svelte": () => Promise.resolve().then(function() {
    return index;
  })
};
var metadata_lookup = { "src/routes/__layout.svelte": { "entry": "/./_app/pages/__layout.svelte-9bd94949.js", "css": ["/./_app/assets/pages/__layout.svelte-b12ee4d9.css"], "js": ["/./_app/pages/__layout.svelte-9bd94949.js", "/./_app/chunks/vendor-69ce0b92.js", "/./_app/chunks/stores-687d2ad9.js"], "styles": [] }, ".svelte-kit/build/components/error.svelte": { "entry": "/./_app/error.svelte-51269cd6.js", "css": [], "js": ["/./_app/error.svelte-51269cd6.js", "/./_app/chunks/vendor-69ce0b92.js"], "styles": [] }, "src/routes/index.svelte": { "entry": "/./_app/pages/index.svelte-2e704149.js", "css": ["/./_app/assets/pages/index.svelte-e248a3dd.css"], "js": ["/./_app/pages/index.svelte-2e704149.js", "/./_app/chunks/vendor-69ce0b92.js", "/./_app/chunks/ArrowButton-bd34c54c.js", "/./_app/chunks/stores-687d2ad9.js"], "styles": [] }, "src/routes/work/index.svelte": { "entry": "/./_app/pages/work/index.svelte-fe96b6ca.js", "css": ["/./_app/assets/pages/work/index.svelte-437abb16.css"], "js": ["/./_app/pages/work/index.svelte-fe96b6ca.js", "/./_app/chunks/vendor-69ce0b92.js", "/./_app/chunks/ArrowButton-bd34c54c.js"], "styles": [] } };
async function load_component(file) {
  return {
    module: await module_lookup[file](),
    ...metadata_lookup[file]
  };
}
function render(request, {
  prerender
} = {}) {
  const host = request.headers["host"];
  return respond({ ...request, host }, options, { prerender });
}
var getStores = () => {
  const stores = getContext("__svelte__");
  return {
    page: {
      subscribe: stores.page.subscribe
    },
    navigating: {
      subscribe: stores.navigating.subscribe
    },
    get preloading() {
      console.error("stores.preloading is deprecated; use stores.navigating instead");
      return {
        subscribe: stores.navigating.subscribe
      };
    },
    session: stores.session
  };
};
var page = {
  subscribe(fn) {
    const store = getStores().page;
    return store.subscribe(fn);
  }
};
var css$6 = {
  code: ".small.svelte-8c9r76{border-radius:.125rem;height:1.25rem;width:1.25rem}",
  map: `{"version":3,"file":"Logo.svelte","sources":["Logo.svelte"],"sourcesContent":["<script>\\r\\n\\texport let small = false;\\r\\n\\texport let color = false;\\r\\n<\/script>\\r\\n\\r\\n<svg\\r\\n\\tclass=\\"h-36 w-36 rounded\\"\\r\\n\\tclass:small\\r\\n\\twidth=\\"36\\"\\r\\n\\theight=\\"36\\"\\r\\n\\tviewBox=\\"0 0 36 36\\"\\r\\nfill=\\"none\\"\\r\\n\\txmlns=\\"http://www.w3.org/2000/svg\\"\\r\\n>\\r\\n\\t<path d=\\"M0 0h36v36H0V0z\\" class=\\"{color ? 'fill-rich-purple-500 dark:fill-rich-purple-300' : 'fill-current'} transition-colors\\" />\\r\\n\\t<path\\r\\n\\t\\td=\\"M13.378 13.798l6.903-.543c-1.131-5.567-6.46-9.154-12.99-8.64-7.537.593-13.072 6.366-12.345 15.597.702 8.928 6.62 14.022 14.709 13.385 7.26-.571 12.1-5.486 11.504-13.063l-.294-3.734-12.166.957.392 4.974 5.593-.44c.166 2.981-1.752 5.032-5.445 5.322-4.23.333-6.915-2.603-7.342-8.031-.424-5.387 1.91-8.676 6.002-8.998 2.728-.215 4.693.975 5.48 3.214zM27.84 31.778l1.393-6.071 9.741-.767 2.327 5.778 7.33-.576L36.889 2.672l-9.08.715-7.3 28.967 7.33-.577zm2.611-11.38l2.34-10.249.221-.017 3.929 9.756-6.49.51z\\"\\r\\n\\t\\tclass=\\"fill-white dark:fill-rich-purple-900 transition-colors\\"\\r\\n\\t/>\\r\\n</svg>\\r\\n\\r\\n<style lang=\\"postcss\\">.small{border-radius:.125rem;height:1.25rem;width:1.25rem}</style>\\r\\n"],"names":[],"mappings":"AAqBsB,oBAAM,CAAC,cAAc,OAAO,CAAC,OAAO,OAAO,CAAC,MAAM,OAAO,CAAC"}`
};
var Logo = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { small = false } = $$props;
  let { color = false } = $$props;
  if ($$props.small === void 0 && $$bindings.small && small !== void 0)
    $$bindings.small(small);
  if ($$props.color === void 0 && $$bindings.color && color !== void 0)
    $$bindings.color(color);
  $$result.css.add(css$6);
  return `<svg class="${["h-36 w-36 rounded svelte-8c9r76", small ? "small" : ""].join(" ").trim()}" width="${"36"}" height="${"36"}" viewBox="${"0 0 36 36"}" fill="${"none"}" xmlns="${"http://www.w3.org/2000/svg"}"><path d="${"M0 0h36v36H0V0z"}" class="${escape2(color ? "fill-rich-purple-500 dark:fill-rich-purple-300" : "fill-current") + " transition-colors"}"></path><path d="${"M13.378 13.798l6.903-.543c-1.131-5.567-6.46-9.154-12.99-8.64-7.537.593-13.072 6.366-12.345 15.597.702 8.928 6.62 14.022 14.709 13.385 7.26-.571 12.1-5.486 11.504-13.063l-.294-3.734-12.166.957.392 4.974 5.593-.44c.166 2.981-1.752 5.032-5.445 5.322-4.23.333-6.915-2.603-7.342-8.031-.424-5.387 1.91-8.676 6.002-8.998 2.728-.215 4.693.975 5.48 3.214zM27.84 31.778l1.393-6.071 9.741-.767 2.327 5.778 7.33-.576L36.889 2.672l-9.08.715-7.3 28.967 7.33-.577zm2.611-11.38l2.34-10.249.221-.017 3.929 9.756-6.49.51z"}" class="${"fill-white dark:fill-rich-purple-900 transition-colors"}"></path></svg>`;
});
var css$5 = {
  code: ".icon-hamburger.svelte-wiyv0z.svelte-wiyv0z{transform-origin:center center}.icon-hamburger.svelte-wiyv0z #btm.svelte-wiyv0z,.icon-hamburger.svelte-wiyv0z #mid.svelte-wiyv0z,.icon-hamburger.svelte-wiyv0z #top.svelte-wiyv0z{--tw-transform:translate3d(var(--tw-translate-x),var(--tw-translate-y),0) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));transform-origin:center center;transition-duration:.15s;transition-property:background-color,border-color,color,fill,stroke,opacity,box-shadow,transform,filter,-webkit-backdrop-filter;transition-property:background-color,border-color,color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter;transition-property:background-color,border-color,color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter,-webkit-backdrop-filter;transition-timing-function:cubic-bezier(.4,0,.2,1)}.icon-hamburger.svelte-wiyv0z #top.svelte-wiyv0z{transform:translateY(-.4rem)}.icon-hamburger.svelte-wiyv0z #btm.svelte-wiyv0z{transform:translateY(.4rem)}.icon-hamburger.svelte-wiyv0z:hover #top.svelte-wiyv0z{transform:translateY(-.5rem)}.icon-hamburger.svelte-wiyv0z:hover #btm.svelte-wiyv0z{transform:translateY(.5rem)}.icon-hamburger.svelte-wiyv0z:active #top.svelte-wiyv0z{transform:translateY(-.3rem)}.icon-hamburger.svelte-wiyv0z:active #btm.svelte-wiyv0z{transform:translateY(.3rem)}.is-open.svelte-wiyv0z .icon-hamburger #top.svelte-wiyv0z{stroke-width:1.25;transform:rotate(-45deg) scale(1.25)}.is-open.svelte-wiyv0z .icon-hamburger #mid.svelte-wiyv0z{transform:scaleX(0)}.is-open.svelte-wiyv0z .icon-hamburger #btm.svelte-wiyv0z{stroke-width:1.25;transform:rotate(45deg) scale(1.25)}.is-open.svelte-wiyv0z .icon-hamburger.svelte-wiyv0z:active{transform:scale(.95)}",
  map: `{"version":3,"file":"MenuButton.svelte","sources":["MenuButton.svelte"],"sourcesContent":["<script>\\r\\n\\texport let isMenuOpen = false;\\r\\n    export let extraClass = '';\\r\\n<\/script>\\r\\n\\r\\n<button\\r\\n\\taria-label=\\"Navigation menu toggle\\"\\r\\n\\tclass:is-open={isMenuOpen}\\r\\n\\tclass=\\"sm:hidden mr-auto w-40 h-40 flex items-center justify-center transform transition hover:scale-110 hover:bg-rich-purple-500 hover:bg-opacity-10 dark:hover:bg-rich-purple-300 dark:hover:bg-opacity-30 rounded-md dark:active:bg-opacity-50 active:bg-opacity-20 {extraClass}\\"\\r\\n\\ton:click\\r\\n>\\r\\n\\t<svg\\r\\n\\t\\tclass=\\"icon-hamburger w-30 h-30\\"\\r\\n\\t\\twidth=\\"24\\"\\r\\n\\t\\theight=\\"24\\"\\r\\n\\t\\tviewBox=\\"0 0 24 24\\"\\r\\n\\t\\tfill=\\"none\\"\\r\\n\\t\\txmlns=\\"http://www.w3.org/2000/svg\\"\\r\\n\\t>\\r\\n\\t\\t<line\\r\\n\\t\\t\\tx1=\\"2.75\\"\\r\\n\\t\\t\\ty1=\\"12\\"\\r\\n\\t\\t\\tx2=\\"21.25\\"\\r\\n\\t\\t\\ty2=\\"12\\"\\r\\n\\t\\t\\tstroke=\\"currentColor\\"\\r\\n\\t\\t\\tstroke-width=\\"1.5\\"\\r\\n\\t\\t\\tstroke-linecap=\\"round\\"\\r\\n\\t\\t\\tid=\\"top\\"\\r\\n\\t\\t/>\\r\\n\\t\\t<line\\r\\n\\t\\t\\tx1=\\"2.75\\"\\r\\n\\t\\t\\ty1=\\"12\\"\\r\\n\\t\\t\\tx2=\\"21.25\\"\\r\\n\\t\\t\\ty2=\\"12\\"\\r\\n\\t\\t\\tstroke=\\"currentColor\\"\\r\\n\\t\\t\\tstroke-width=\\"1.5\\"\\r\\n\\t\\t\\tstroke-linecap=\\"round\\"\\r\\n\\t\\t\\tid=\\"mid\\"\\r\\n\\t\\t/>\\r\\n\\t\\t<line\\r\\n\\t\\t\\tx1=\\"2.75\\"\\r\\n\\t\\t\\ty1=\\"12\\"\\r\\n\\t\\t\\tx2=\\"21.25\\"\\r\\n\\t\\t\\ty2=\\"12\\"\\r\\n\\t\\t\\tstroke=\\"currentColor\\"\\r\\n\\t\\t\\tstroke-width=\\"1.5\\"\\r\\n\\t\\t\\tstroke-linecap=\\"round\\"\\r\\n\\t\\t\\tid=\\"btm\\"\\r\\n\\t\\t/>\\r\\n\\t</svg>\\r\\n</button>\\r\\n\\r\\n<style lang=\\"postcss\\">.icon-hamburger{transform-origin:center center}.icon-hamburger #btm,.icon-hamburger #mid,.icon-hamburger #top{--tw-transform:translate3d(var(--tw-translate-x),var(--tw-translate-y),0) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));transform-origin:center center;transition-duration:.15s;transition-property:background-color,border-color,color,fill,stroke,opacity,box-shadow,transform,filter,-webkit-backdrop-filter;transition-property:background-color,border-color,color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter;transition-property:background-color,border-color,color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter,-webkit-backdrop-filter;transition-timing-function:cubic-bezier(.4,0,.2,1)}.icon-hamburger #top{transform:translateY(-.4rem)}.icon-hamburger #btm{transform:translateY(.4rem)}.icon-hamburger:hover #top{transform:translateY(-.5rem)}.icon-hamburger:hover #btm{transform:translateY(.5rem)}.icon-hamburger:active #top{transform:translateY(-.3rem)}.icon-hamburger:active #btm{transform:translateY(.3rem)}.is-open .icon-hamburger #top{stroke-width:1.25;transform:rotate(-45deg) scale(1.25)}.is-open .icon-hamburger #mid{transform:scaleX(0)}.is-open .icon-hamburger #btm{stroke-width:1.25;transform:rotate(45deg) scale(1.25)}.is-open .icon-hamburger:active{transform:scale(.95)}</style>\\r\\n"],"names":[],"mappings":"AAoDsB,2CAAe,CAAC,iBAAiB,MAAM,CAAC,MAAM,CAAC,6BAAe,CAAC,kBAAI,CAAC,6BAAe,CAAC,kBAAI,CAAC,6BAAe,CAAC,kBAAI,CAAC,eAAe,uLAAuL,CAAC,iBAAiB,MAAM,CAAC,MAAM,CAAC,oBAAoB,IAAI,CAAC,oBAAoB,gBAAgB,CAAC,YAAY,CAAC,KAAK,CAAC,IAAI,CAAC,MAAM,CAAC,OAAO,CAAC,UAAU,CAAC,SAAS,CAAC,MAAM,CAAC,uBAAuB,CAAC,oBAAoB,gBAAgB,CAAC,YAAY,CAAC,KAAK,CAAC,IAAI,CAAC,MAAM,CAAC,OAAO,CAAC,UAAU,CAAC,SAAS,CAAC,MAAM,CAAC,eAAe,CAAC,oBAAoB,gBAAgB,CAAC,YAAY,CAAC,KAAK,CAAC,IAAI,CAAC,MAAM,CAAC,OAAO,CAAC,UAAU,CAAC,SAAS,CAAC,MAAM,CAAC,eAAe,CAAC,uBAAuB,CAAC,2BAA2B,aAAa,EAAE,CAAC,CAAC,CAAC,EAAE,CAAC,CAAC,CAAC,CAAC,6BAAe,CAAC,kBAAI,CAAC,UAAU,WAAW,MAAM,CAAC,CAAC,6BAAe,CAAC,kBAAI,CAAC,UAAU,WAAW,KAAK,CAAC,CAAC,6BAAe,MAAM,CAAC,kBAAI,CAAC,UAAU,WAAW,MAAM,CAAC,CAAC,6BAAe,MAAM,CAAC,kBAAI,CAAC,UAAU,WAAW,KAAK,CAAC,CAAC,6BAAe,OAAO,CAAC,kBAAI,CAAC,UAAU,WAAW,MAAM,CAAC,CAAC,6BAAe,OAAO,CAAC,kBAAI,CAAC,UAAU,WAAW,KAAK,CAAC,CAAC,sBAAQ,CAAC,eAAe,CAAC,kBAAI,CAAC,aAAa,IAAI,CAAC,UAAU,OAAO,MAAM,CAAC,CAAC,MAAM,IAAI,CAAC,CAAC,sBAAQ,CAAC,eAAe,CAAC,kBAAI,CAAC,UAAU,OAAO,CAAC,CAAC,CAAC,sBAAQ,CAAC,eAAe,CAAC,kBAAI,CAAC,aAAa,IAAI,CAAC,UAAU,OAAO,KAAK,CAAC,CAAC,MAAM,IAAI,CAAC,CAAC,sBAAQ,CAAC,6BAAe,OAAO,CAAC,UAAU,MAAM,GAAG,CAAC,CAAC"}`
};
var MenuButton = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { isMenuOpen = false } = $$props;
  let { extraClass = "" } = $$props;
  if ($$props.isMenuOpen === void 0 && $$bindings.isMenuOpen && isMenuOpen !== void 0)
    $$bindings.isMenuOpen(isMenuOpen);
  if ($$props.extraClass === void 0 && $$bindings.extraClass && extraClass !== void 0)
    $$bindings.extraClass(extraClass);
  $$result.css.add(css$5);
  return `<button aria-label="${"Navigation menu toggle"}" class="${[
    "sm:hidden mr-auto w-40 h-40 flex items-center justify-center transform transition hover:scale-110 hover:bg-rich-purple-500 hover:bg-opacity-10 dark:hover:bg-rich-purple-300 dark:hover:bg-opacity-30 rounded-md dark:active:bg-opacity-50 active:bg-opacity-20 " + escape2(extraClass) + " svelte-wiyv0z",
    isMenuOpen ? "is-open" : ""
  ].join(" ").trim()}"><svg class="${"icon-hamburger w-30 h-30 svelte-wiyv0z"}" width="${"24"}" height="${"24"}" viewBox="${"0 0 24 24"}" fill="${"none"}" xmlns="${"http://www.w3.org/2000/svg"}"><line x1="${"2.75"}" y1="${"12"}" x2="${"21.25"}" y2="${"12"}" stroke="${"currentColor"}" stroke-width="${"1.5"}" stroke-linecap="${"round"}" id="${"top"}" class="${"svelte-wiyv0z"}"></line><line x1="${"2.75"}" y1="${"12"}" x2="${"21.25"}" y2="${"12"}" stroke="${"currentColor"}" stroke-width="${"1.5"}" stroke-linecap="${"round"}" id="${"mid"}" class="${"svelte-wiyv0z"}"></line><line x1="${"2.75"}" y1="${"12"}" x2="${"21.25"}" y2="${"12"}" stroke="${"currentColor"}" stroke-width="${"1.5"}" stroke-linecap="${"round"}" id="${"btm"}" class="${"svelte-wiyv0z"}"></line></svg>
</button>`;
});
var subscriber_queue2 = [];
function readable(value, start) {
  return {
    subscribe: writable2(value, start).subscribe
  };
}
function writable2(value, start = noop2) {
  let stop;
  const subscribers = new Set();
  function set(new_value) {
    if (safe_not_equal2(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue2.length;
        for (const subscriber of subscribers) {
          subscriber[1]();
          subscriber_queue2.push(subscriber, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue2.length; i += 2) {
            subscriber_queue2[i][0](subscriber_queue2[i + 1]);
          }
          subscriber_queue2.length = 0;
        }
      }
    }
  }
  function update(fn) {
    set(fn(value));
  }
  function subscribe2(run2, invalidate = noop2) {
    const subscriber = [run2, invalidate];
    subscribers.add(subscriber);
    if (subscribers.size === 1) {
      stop = start(set) || noop2;
    }
    run2(value);
    return () => {
      subscribers.delete(subscriber);
      if (subscribers.size === 0) {
        stop();
        stop = null;
      }
    };
  }
  return { set, update, subscribe: subscribe2 };
}
var reducedMotion = readable(false, (set) => {
  const query = "(prefers-reduced-motion: no-preference)";
  const mediaQueryList = typeof window !== "undefined" ? window.matchMedia(query) : {};
  const onChange = () => set(!mediaQueryList.matches);
  if (typeof window !== "undefined") {
    mediaQueryList.addListener(onChange);
    onChange();
  }
  return () => {
    if (typeof window !== "undefined")
      mediaQueryList.removeListener(onChange);
  };
});
var prefersColorSchemeDark = readable(false, (set) => {
  const query = "(prefers-color-scheme: light)";
  const mediaQueryList = typeof window !== "undefined" ? window.matchMedia(query) : {};
  const onChange = () => set(!mediaQueryList.matches);
  if (typeof window !== "undefined") {
    mediaQueryList.addListener(onChange);
    onChange();
  }
  return () => {
    if (typeof window !== "undefined")
      mediaQueryList.removeListener(onChange);
  };
});
var ThemeMode = {
  AUTO: "auto",
  LIGHT: "light",
  DARK: "dark"
};
var preferences = (0, import_svelte_local_storage_store.writable)("preferences", {
  theme: ThemeMode.AUTO
});
var transitonDuration = "duration-500";
var ThemePicker = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let isDay;
  let isAuto;
  let isNight;
  let rayTransform;
  let rayOpacity;
  let starScale;
  let $preferences, $$unsubscribe_preferences;
  $$unsubscribe_preferences = subscribe(preferences, (value) => $preferences = value);
  let { extraClass = "" } = $$props;
  if ($$props.extraClass === void 0 && $$bindings.extraClass && extraClass !== void 0)
    $$bindings.extraClass(extraClass);
  isDay = $preferences.theme === ThemeMode.LIGHT;
  isAuto = $preferences.theme === ThemeMode.AUTO;
  isNight = !isDay && !isAuto;
  rayTransform = isNight ? 6 : isAuto ? 0.5 : 0;
  rayOpacity = isAuto ? 0.4 : isDay ? 1 : 0;
  starScale = isDay || isAuto ? 0 : 1.25;
  $$unsubscribe_preferences();
  return `<button class="${escape2(extraClass) + " w-40 h-40 flex items-center justify-center transform transition hover:scale-110 hover:bg-rich-purple-500 hover:bg-opacity-10 dark:hover:bg-rich-purple-300 dark:hover:bg-opacity-30 rounded-md dark:active:bg-opacity-50 active:bg-opacity-20"}" aria-label="${"Toggle website theme"}"><svg class="${"w-36 h-36"}" width="${"24"}" height="${"24"}" viewBox="${"0 0 24 24"}" fill="${"none"}" xmlns="${"http://www.w3.org/2000/svg"}"><defs><clipPath id="${"sun-clip"}"><circle cx="${"12"}" cy="${"12"}" r="${"5.5"}" transform="${"scale(1.5)"}" style="${"transform-origin: center center"}"></circle></clipPath></defs><path class="${"transition " + escape2(transitonDuration)}" d="${"M12 4V1"}"${add_attribute("opacity", rayOpacity, 0)} transform="${"translate(0, " + escape2(rayTransform) + ")"}" stroke="${"currentColor"}" stroke-width="${"1.5"}" stroke-linecap="${"round"}"></path><path class="${"transition " + escape2(transitonDuration)}" d="${"M12 23V20"}"${add_attribute("opacity", rayOpacity, 0)} transform="${"translate(0, -" + escape2(rayTransform) + ")"}" stroke="${"currentColor"}" stroke-width="${"1.5"}" stroke-linecap="${"round"}"></path><path class="${"transition " + escape2(transitonDuration)}" d="${"M20 12L23 12"}"${add_attribute("opacity", rayOpacity, 0)} transform="${"translate(-" + escape2(rayTransform) + ", 0)"}" stroke="${"currentColor"}" stroke-width="${"1.5"}" stroke-linecap="${"round"}"></path><path class="${"transition " + escape2(transitonDuration)}" d="${"M1 12L4 12"}"${add_attribute("opacity", rayOpacity, 0)} transform="${"translate(" + escape2(rayTransform) + ", 0)"}" stroke="${"currentColor"}" stroke-width="${"1.5"}" stroke-linecap="${"round"}"></path><path class="${"transition " + escape2(transitonDuration)}" d="${"M17.657 6.34324L19.7783 4.22192"}"${add_attribute("opacity", rayOpacity, 0)} transform="${"translate(-" + escape2(rayTransform) + ", " + escape2(rayTransform) + ")"}" stroke="${"currentColor"}" stroke-width="${"1.5"}" stroke-linecap="${"round"}"></path><path class="${"transition " + escape2(transitonDuration)}" d="${"M4.22194 19.7783L6.34326 17.657"}"${add_attribute("opacity", rayOpacity, 0)} transform="${"translate(" + escape2(rayTransform) + ", -" + escape2(rayTransform) + ")"}" stroke="${"currentColor"}" stroke-width="${"1.5"}" stroke-linecap="${"round"}"></path><path class="${"transition " + escape2(transitonDuration)}" d="${"M17.657 17.657L19.7783 19.7783"}"${add_attribute("opacity", rayOpacity, 0)} transform="${"translate(-" + escape2(rayTransform) + ", -" + escape2(rayTransform) + ")"}" stroke="${"currentColor"}" stroke-width="${"1.5"}" stroke-linecap="${"round"}"></path><path class="${"transition " + escape2(transitonDuration)}" d="${"M4.22194 4.22194L6.34326 6.34326"}"${add_attribute("opacity", rayOpacity, 0)} transform="${"translate(" + escape2(rayTransform) + ", " + escape2(rayTransform) + ")"}" stroke="${"currentColor"}" stroke-width="${"1.5"}" stroke-linecap="${"round"}"></path><path class="${"transition " + escape2(transitonDuration)}"${add_attribute("opacity", isNight ? 1 : 0, 0)} transform="${"translate(7.5, 7.5) scale(" + escape2(isNight ? 1.1 : 0.1) + ")"}" fill-rule="${"evenodd"}" clip-rule="${"evenodd"}" d="${"M1.27586 9.42157C5.77489 9.42157 9.42208 5.77439 9.42208 1.27536C9.42208 0.841482 9.38816 0.415526 9.32282 0C11.5582 1.14832 13.0875 3.47707 13.0875 6.16301C13.0875 9.98719 9.98739 13.0873 6.16321 13.0873C3.47712 13.0873 1.14825 11.5578 0 9.32224C0.415685 9.38763 0.84181 9.42157 1.27586 9.42157Z"}" fill="${"currentColor"}" style="${"transform-origin: 40% 40%;"}"></path><path class="${"transition " + escape2(transitonDuration)}" transform="${"translate(8, 7.25) scale(" + escape2(isAuto ? 1 : 0) + ")"}" d="${"M1.2002 7.8L2 5.72051M6.8 7.8L6.00035 5.72051M2 5.72051H6.00035M2 5.72051L4.0002 1L6.00035 5.72051"}" stroke="${"currentColor"}" stroke-width="${"1.5"}" stroke-linecap="${"round"}" stroke-linejoin="${"round"}" style="${"transform-origin: 15% 25%"}"></path><path class="${"transition " + escape2(transitonDuration)}" transform="${"translate(" + escape2(isNight ? 2.5 : 0.5) + ", " + escape2(isNight ? 2.75 : 0.75) + ") scale(" + escape2(starScale) + ")"}" d="${"M1.88373 1.8487L2.76761 2.73258M3.65149 3.61646L2.76761 2.73258M3.75002 1.75002L2.76761 2.73258M2.76761 2.73258L1.75 3.75"}" stroke="${"currentColor"}" stroke-linecap="${"round"}" style="${"transform-origin: 11% 12%;"}"></path><path class="${"transition " + escape2(transitonDuration)}" transform="${"translate(" + escape2(isNight ? 5.5 : 3.5) + ", " + escape2(isNight ? 1.75 : 1.25) + ") scale(" + escape2(starScale) + ")"}" d="${"M7.53059 3.81382L6.90559 4.89635M6.28059 5.97889L6.90559 4.89635M8.10894 5.59099L6.90559 4.89635M6.90559 4.89635L5.65946 4.17675"}" stroke="${"currentColor"}" stroke-linecap="${"round"}" style="${"transform-origin: 29% 21%;"}"></path><path class="${"transition " + escape2(transitonDuration)}" transform="${"translate(" + escape2(isNight ? 4 : 3.5) + ", " + escape2(isNight ? 4.75 : 2.75) + ") scale(" + escape2(starScale) + ")"}" d="${"M2.69123 6.6485L2.90829 7.87951M3.12535 9.11052L2.90829 7.87951M4.27661 7.63813L2.90829 7.87951M2.90829 7.87951L1.49115 8.12926"}" stroke="${"currentColor"}" stroke-linecap="${"round"}" style="${"transform-origin: 12% 33%"}"></path><circle class="${"transition " + escape2(transitonDuration)}" transform="${"scale(" + escape2(isAuto ? 1 : 0.714) + ")"}" cx="${"12"}" cy="${"12"}" r="${"7"}" stroke="${"currentColor"}"${add_attribute("stroke-width", isAuto ? 1.5 : 2.1, 0)}${add_attribute("opacity", isDay || isAuto ? 1 : 0, 0)} style="${"transform-origin: center center"}"></circle></svg></button>`;
});
var css$4 = {
  code: ".open.svelte-1aiu52u.svelte-1aiu52u{--tw-translate-x:0;transform:var(--tw-transform)}nav.svelte-1aiu52u ul a.svelte-1aiu52u:not(.logo){--tw-text-opacity:1;color:rgba(255,255,255,var(--tw-text-opacity));font-size:1.125rem;line-height:1.5;transition-duration:.15s;transition-property:background-color,border-color,color,fill,stroke;transition-timing-function:cubic-bezier(.4,0,.2,1)}@media(min-width:640px){nav.svelte-1aiu52u ul a.svelte-1aiu52u:not(.logo){color:rgba(0,0,0,var(--tw-text-opacity));font-size:1rem;line-height:1.5}nav.svelte-1aiu52u ul a.svelte-1aiu52u:not(.logo),nav.svelte-1aiu52u ul a.svelte-1aiu52u:not(.logo):hover{--tw-text-opacity:1}nav.svelte-1aiu52u ul a.svelte-1aiu52u:not(.logo):hover{color:rgba(50,46,255,var(--tw-text-opacity))}.dark nav.svelte-1aiu52u ul a.svelte-1aiu52u:not(.logo){--tw-text-opacity:1;color:rgba(255,255,255,var(--tw-text-opacity))}.dark nav.svelte-1aiu52u ul a.svelte-1aiu52u:not(.logo):hover{--tw-text-opacity:1;color:rgba(114,112,255,var(--tw-text-opacity))}}nav.svelte-1aiu52u ul a.svelte-1aiu52u:not(.logo){display:block}.active.svelte-1aiu52u.svelte-1aiu52u{font-weight:700;pointer-events:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}@media(min-width:640px){.active.svelte-1aiu52u.svelte-1aiu52u{color:rgba(50,46,255,var(--tw-text-opacity));font-weight:400}.active.svelte-1aiu52u.svelte-1aiu52u{--tw-text-opacity:1}}",
  map: `{"version":3,"file":"Header.svelte","sources":["Header.svelte"],"sourcesContent":["<script>\\n\\timport { onMount } from 'svelte';\\n\\timport { fade } from 'svelte/transition';\\n\\n\\timport { page } from '$app/stores';\\n\\timport Logo from '$lib/Logo.svelte';\\n\\timport MenuButton from './MenuButton.svelte';\\n\\timport ThemePicker from './ThemePicker.svelte';\\n\\n\\tlet isOpen = false;\\n\\n\\tlet htmlElement;\\n\\n\\tconst closeMenu = () => (isOpen = false);\\n\\n\\tonMount(() => {\\n\\t\\thtmlElement = document.documentElement;\\n\\t});\\n\\n\\t$: {\\n\\t\\tif (htmlElement) {\\n\\t\\t\\tif (isOpen) {\\n\\t\\t\\t\\thtmlElement?.classList?.add('no-scroll');\\n\\t\\t\\t} else {\\n\\t\\t\\t\\thtmlElement?.classList?.remove('no-scroll');\\n\\t\\t\\t}\\n\\t\\t}\\n\\t}\\n<\/script>\\n\\n<header\\n\\tclass=\\"h-80 sm:h-100 flex items-center px-30 sm:px-48 fixed top-0 left-0 right-0 bg-white bg-opacity-90 dark:bg-rich-purple-900 dark:bg-opacity-90 backdrop-blur-lg z-10\\"\\n>\\n\\t<nav class=\\"contained w-full xl:px-48 flex items-center justify-between\\">\\n\\t\\t<div class=\\"flex items-center gap-30 text-16 w-full\\">\\n\\t\\t\\t<MenuButton on:click={() => (isOpen = !isOpen)} isMenuOpen={isOpen} extraClass=\\"z-30\\" />\\n\\n\\t\\t\\t<a\\n\\t\\t\\t\\tsveltekit:prefetch\\n\\t\\t\\t\\tclass=\\"visible logo mr-auto sm:mr-0 z-20 sm:z-auto\\"\\n\\t\\t\\t\\thref=\\"/\\"\\n\\t\\t\\t\\taria-label=\\"Go to homepage\\"><Logo color /></a\\n\\t\\t\\t>\\n\\n\\t\\t\\t{#if isOpen}\\n\\t\\t\\t\\t<div\\n\\t\\t\\t\\t\\tclass=\\"w-screen h-screen bg-white dark:bg-rich-purple-900 bg-opacity-95 dark:bg-opacity-95 fixed inset-0 z-10 sm:hidden\\"\\n\\t\\t\\t\\t\\ton:click={closeMenu}\\n\\t\\t\\t\\t\\ttransition:fade\\n\\t\\t\\t\\t/>\\n\\t\\t\\t{/if}\\n\\n\\t\\t\\t<div\\n\\t\\t\\t\\tclass:open={isOpen}\\n\\t\\t\\t\\tclass=\\"fixed top-80 left-0 w-full max-w-xs sm:static flex flex-col sm:flex-row gap-30 bg-rich-purple-500 dark:bg-rich-purple-300 sm:bg-transparent sm:dark:bg-transparent p-30 sm:p-0 sm:w-max transition transform-gpu -translate-x-full sm:translate-x-0 rounded-br-xl sm:rounded-br-none rounded-tr-xl sm:rounded-tr-none shadow-2xl sm:shadow-none z-20 sm:z-auto\\"\\n\\t\\t\\t>\\n\\t\\t\\t\\t<a\\n\\t\\t\\t\\t\\tclass:active={$page.path === '/#about'}\\n\\t\\t\\t\\t\\ton:click={closeMenu}\\n\\t\\t\\t\\t\\tsveltekit:prefetch\\n\\t\\t\\t\\t\\thref=\\"/#about\\">About me</a\\n\\t\\t\\t\\t>\\n\\n\\t\\t\\t\\t<a\\n\\t\\t\\t\\t\\tclass:active={$page.path.startsWith('/work')}\\n\\t\\t\\t\\t\\ton:click={closeMenu}\\n\\t\\t\\t\\t\\tsveltekit:prefetch\\n\\t\\t\\t\\t\\thref=\\"/work\\">Work</a\\n\\t\\t\\t\\t>\\n\\n\\t\\t\\t\\t<a on:click={closeMenu} sveltekit:prefetch href=\\"/#contact\\">Contact</a>\\n\\t\\t\\t\\t<a on:click={closeMenu} rel=\\"external\\" sveltekit:prefetch href=\\"/Goran-Alkovic-CV.pdf\\">CV</a\\n\\t\\t\\t\\t>\\n\\t\\t\\t</div>\\n\\n\\t\\t\\t<ThemePicker extraClass=\\"sm:ml-auto z-20 sm:z-auto\\" />\\n\\t\\t</div>\\n\\t</nav>\\n</header>\\n\\n<style lang=\\"postcss\\">.open{--tw-translate-x:0;transform:var(--tw-transform)}nav ul a:not(.logo){--tw-text-opacity:1;color:rgba(255,255,255,var(--tw-text-opacity));font-size:1.125rem;line-height:1.5;transition-duration:.15s;transition-property:background-color,border-color,color,fill,stroke;transition-timing-function:cubic-bezier(.4,0,.2,1)}@media (min-width:640px){nav ul a:not(.logo){color:rgba(0,0,0,var(--tw-text-opacity));font-size:1rem;line-height:1.5}nav ul a:not(.logo),nav ul a:not(.logo):hover{--tw-text-opacity:1}nav ul a:not(.logo):hover{color:rgba(50,46,255,var(--tw-text-opacity))}.dark nav ul a:not(.logo){--tw-text-opacity:1;color:rgba(255,255,255,var(--tw-text-opacity))}.dark nav ul a:not(.logo):hover{--tw-text-opacity:1;color:rgba(114,112,255,var(--tw-text-opacity))}}nav ul a:not(.logo){display:block}.active{font-weight:700;pointer-events:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}@media (min-width:640px){.active{color:rgba(50,46,255,var(--tw-text-opacity));font-weight:400}.active,.dark .active{--tw-text-opacity:1}.dark .active{color:rgba(114,112,255,var(--tw-text-opacity))}}</style>\\n"],"names":[],"mappings":"AAgFsB,mCAAK,CAAC,iBAAiB,CAAC,CAAC,UAAU,IAAI,cAAc,CAAC,CAAC,kBAAG,CAAC,EAAE,CAAC,gBAAC,KAAK,KAAK,CAAC,CAAC,kBAAkB,CAAC,CAAC,MAAM,KAAK,GAAG,CAAC,GAAG,CAAC,GAAG,CAAC,IAAI,iBAAiB,CAAC,CAAC,CAAC,UAAU,QAAQ,CAAC,YAAY,GAAG,CAAC,oBAAoB,IAAI,CAAC,oBAAoB,gBAAgB,CAAC,YAAY,CAAC,KAAK,CAAC,IAAI,CAAC,MAAM,CAAC,2BAA2B,aAAa,EAAE,CAAC,CAAC,CAAC,EAAE,CAAC,CAAC,CAAC,CAAC,MAAM,AAAC,WAAW,KAAK,CAAC,CAAC,kBAAG,CAAC,EAAE,CAAC,gBAAC,KAAK,KAAK,CAAC,CAAC,MAAM,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,IAAI,iBAAiB,CAAC,CAAC,CAAC,UAAU,IAAI,CAAC,YAAY,GAAG,CAAC,kBAAG,CAAC,EAAE,CAAC,gBAAC,KAAK,KAAK,CAAC,CAAC,kBAAG,CAAC,EAAE,CAAC,gBAAC,KAAK,KAAK,CAAC,MAAM,CAAC,kBAAkB,CAAC,CAAC,kBAAG,CAAC,EAAE,CAAC,gBAAC,KAAK,KAAK,CAAC,MAAM,CAAC,MAAM,KAAK,EAAE,CAAC,EAAE,CAAC,GAAG,CAAC,IAAI,iBAAiB,CAAC,CAAC,CAAC,KAAK,CAAC,kBAAG,CAAC,EAAE,CAAC,gBAAC,KAAK,KAAK,CAAC,CAAC,kBAAkB,CAAC,CAAC,MAAM,KAAK,GAAG,CAAC,GAAG,CAAC,GAAG,CAAC,IAAI,iBAAiB,CAAC,CAAC,CAAC,KAAK,CAAC,kBAAG,CAAC,EAAE,CAAC,gBAAC,KAAK,KAAK,CAAC,MAAM,CAAC,kBAAkB,CAAC,CAAC,MAAM,KAAK,GAAG,CAAC,GAAG,CAAC,GAAG,CAAC,IAAI,iBAAiB,CAAC,CAAC,CAAC,CAAC,kBAAG,CAAC,EAAE,CAAC,gBAAC,KAAK,KAAK,CAAC,CAAC,QAAQ,KAAK,CAAC,qCAAO,CAAC,YAAY,GAAG,CAAC,eAAe,IAAI,CAAC,oBAAoB,IAAI,CAAC,iBAAiB,IAAI,CAAC,gBAAgB,IAAI,CAAC,YAAY,IAAI,CAAC,MAAM,AAAC,WAAW,KAAK,CAAC,CAAC,qCAAO,CAAC,MAAM,KAAK,EAAE,CAAC,EAAE,CAAC,GAAG,CAAC,IAAI,iBAAiB,CAAC,CAAC,CAAC,YAAY,GAAG,CAAC,OAAO,8BAAc,CAAC,kBAAkB,CAAC,CAAC,AAA6D,CAAC"}`
};
var Header = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $page, $$unsubscribe_page;
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  let isOpen = false;
  $$result.css.add(css$4);
  $$unsubscribe_page();
  return `<header class="${"h-80 sm:h-100 flex items-center px-30 sm:px-48 fixed top-0 left-0 right-0 bg-white bg-opacity-90 dark:bg-rich-purple-900 dark:bg-opacity-90 backdrop-blur-lg z-10"}"><nav class="${"contained w-full xl:px-48 flex items-center justify-between svelte-1aiu52u"}"><div class="${"flex items-center gap-30 text-16 w-full"}">${validate_component(MenuButton, "MenuButton").$$render($$result, { isMenuOpen: isOpen, extraClass: "z-30" }, {}, {})}

			<a sveltekit:prefetch class="${"visible logo mr-auto sm:mr-0 z-20 sm:z-auto svelte-1aiu52u"}" href="${"/"}" aria-label="${"Go to homepage"}">${validate_component(Logo, "Logo").$$render($$result, { color: true }, {}, {})}</a>

			${``}

			<div class="${[
    "fixed top-80 left-0 w-full max-w-xs sm:static flex flex-col sm:flex-row gap-30 bg-rich-purple-500 dark:bg-rich-purple-300 sm:bg-transparent sm:dark:bg-transparent p-30 sm:p-0 sm:w-max transition transform-gpu -translate-x-full sm:translate-x-0 rounded-br-xl sm:rounded-br-none rounded-tr-xl sm:rounded-tr-none shadow-2xl sm:shadow-none z-20 sm:z-auto svelte-1aiu52u",
    ""
  ].join(" ").trim()}"><a sveltekit:prefetch href="${"/#about"}" class="${["svelte-1aiu52u", $page.path === "/#about" ? "active" : ""].join(" ").trim()}">About me</a>

				<a sveltekit:prefetch href="${"/work"}" class="${["svelte-1aiu52u", $page.path.startsWith("/work") ? "active" : ""].join(" ").trim()}">Work</a>

				<a sveltekit:prefetch href="${"/#contact"}" class="${"svelte-1aiu52u"}">Contact</a>
				<a rel="${"external"}" sveltekit:prefetch href="${"/Goran-Alkovic-CV.pdf"}" class="${"svelte-1aiu52u"}">CV</a></div>

			${validate_component(ThemePicker, "ThemePicker").$$render($$result, { extraClass: "sm:ml-auto z-20 sm:z-auto" }, {}, {})}</div></nav>
</header>`;
});
var Footer = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<footer class="${"border-t border-rich-purple-500 dark:border-rich-purple-300 border-opacity-5 dark:border-opacity-10 p-30 sm:px-60 sm:py-30 w-full"}"><div class="${"contained flex items-center justify-between"}"><div class="${"flex items-center gap-10 text-14 flex-shrink-0 mb-5 font-light"}">${validate_component(Logo, "Logo").$$render($$result, { small: true }, {}, {})}
        <span>\xA9 2021</span></div>

    <p class="${"text-right text-12 text-gray-800 dark:text-gray-300 font-light opacity-95 w-7/12 sm:w-full"}">Made with \u2764\uFE0F in <a href="${"https://www.figma.com/"}">Figma</a>, built using
        <a href="${"https://kit.svelte.dev"}">SvelteKit</a> and <a href="${"https://tailwindcss.com"}">TailwindCSS</a>, hosted on
        <a href="${"https://netlify.com"}">Netlify</a></p></div></footer>`;
});
var _layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$unsubscribe_preferences;
  let $$unsubscribe_prefersColorSchemeDark;
  let $$unsubscribe_page;
  let $$unsubscribe_reducedMotion;
  $$unsubscribe_preferences = subscribe(preferences, (value) => value);
  $$unsubscribe_prefersColorSchemeDark = subscribe(prefersColorSchemeDark, (value) => value);
  $$unsubscribe_page = subscribe(page, (value) => value);
  $$unsubscribe_reducedMotion = subscribe(reducedMotion, (value) => value);
  $$unsubscribe_preferences();
  $$unsubscribe_prefersColorSchemeDark();
  $$unsubscribe_page();
  $$unsubscribe_reducedMotion();
  return `${validate_component(Header, "Header").$$render($$result, {}, {}, {})}

<div><main class="${"contained grid grid-cols-[1.875rem,1fr,1.875rem] sm:grid-cols-[3rem,1fr,3rem]"}">${slots.default ? slots.default({}) : ``}</main>
		${validate_component(Footer, "Footer").$$render($$result, {}, {}, {})}</div>`;
});
var __layout = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": _layout
});
function load({ error: error22, status }) {
  return { props: { error: error22, status } };
}
var Error$1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { status } = $$props;
  let { error: error22 } = $$props;
  if ($$props.status === void 0 && $$bindings.status && status !== void 0)
    $$bindings.status(status);
  if ($$props.error === void 0 && $$bindings.error && error22 !== void 0)
    $$bindings.error(error22);
  return `<h1>${escape2(status)}</h1>

<pre>${escape2(error22.message)}</pre>



${error22.frame ? `<pre>${escape2(error22.frame)}</pre>` : ``}
${error22.stack ? `<pre>${escape2(error22.stack)}</pre>` : ``}`;
});
var error2 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Error$1,
  load
});
var ArrowDirections = {
  RIGHT: "right",
  LEFT: "left",
  UP: "up",
  DOWN: "down",
  DIAGONAL: "diagonal"
};
var ArrowButton = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { content } = $$props;
  let { url } = $$props;
  let { extraClass = "" } = $$props;
  let { arrowDirection = ArrowDirections.RIGHT } = $$props;
  let { external = false } = $$props;
  let { newTab = false } = $$props;
  if ($$props.content === void 0 && $$bindings.content && content !== void 0)
    $$bindings.content(content);
  if ($$props.url === void 0 && $$bindings.url && url !== void 0)
    $$bindings.url(url);
  if ($$props.extraClass === void 0 && $$bindings.extraClass && extraClass !== void 0)
    $$bindings.extraClass(extraClass);
  if ($$props.arrowDirection === void 0 && $$bindings.arrowDirection && arrowDirection !== void 0)
    $$bindings.arrowDirection(arrowDirection);
  if ($$props.external === void 0 && $$bindings.external && external !== void 0)
    $$bindings.external(external);
  if ($$props.newTab === void 0 && $$bindings.newTab && newTab !== void 0)
    $$bindings.newTab(newTab);
  return `<a rel${add_attribute("target", newTab ? "_blank" : "_self", 0)} class="${"flex items-center text-14w uppercase font-medium gap-5 group w-max p-px rounded-sm " + escape2(extraClass)}"${add_attribute("href", url, 0)}><span class="${"group-hover:text-rich-purple-500 dark:group-hover:text-rich-purple-300 group-hover:tracking-[0.18em] transition-all"}"><!-- HTML_TAG_START -->${content}<!-- HTML_TAG_END --></span>
	<svg class="${[
    "transform",
    (arrowDirection === ArrowDirections.DIAGONAL ? "-rotate-45" : "") + " " + (arrowDirection === ArrowDirections.DOWN ? "rotate-90" : "") + " " + (arrowDirection === ArrowDirections.UP ? "-rotate-90" : "") + " " + (arrowDirection === ArrowDirections.LEFT ? "rotate-180" : "")
  ].join(" ").trim()}" width="${"16"}" height="${"16"}" viewBox="${"0 0 16 16"}" fill="${"none"}" xmlns="${"http://www.w3.org/2000/svg"}"><path d="${"M8.84 2l5.66 6-5.66 6-.973-1.031 4.005-4.232H1.5V7.263h10.372L7.867 3.018 8.84 2z"}" class="${"fill-rich-purple-500 dark:fill-rich-purple-300"}"></path></svg></a>`;
});
var css$3 = {
  code: "svg.svelte-8vp0lw{shape-rendering:geometricPrecision;height:auto;width:100%}@media(min-width:640px){svg.svelte-8vp0lw{width:80vw}}@media(min-width:768px){svg.svelte-8vp0lw{width:60vw}}@media(min-width:1024px){svg.svelte-8vp0lw{--tw-translate-x:4.375rem;transform:var(--tw-transform);width:100%}}",
  map: '{"version":3,"file":"AboutImage.svelte","sources":["AboutImage.svelte"],"sourcesContent":["<svg\\r\\n\\twidth=\\"785\\"\\r\\n\\theight=\\"566\\"\\r\\n\\tviewBox=\\"0 0 785 566\\"\\r\\n\\tfill=\\"none\\"\\r\\n\\txmlns=\\"http://www.w3.org/2000/svg\\"\\r\\n\\txmlns:xlink=\\"http://www.w3.org/1999/xlink\\"\\r\\n>\\r\\n\\t<circle\\r\\n\\t\\tcx=\\"62.5012\\"\\r\\n\\t\\tcy=\\"79.5\\"\\r\\n\\t\\tr=\\"54.5\\"\\r\\n\\t\\ttransform=\\"rotate(-9.17892 62.5012 79.5)\\"\\r\\n\\t\\tfill=\\"url(#imgFill0)\\"\\r\\n\\t/>\\r\\n\\t<circle\\r\\n\\t\\tcx=\\"172.322\\"\\r\\n\\t\\tcy=\\"277.32\\"\\r\\n\\t\\tr=\\"34\\"\\r\\n\\t\\ttransform=\\"rotate(-14.244 172.322 277.32)\\"\\r\\n\\t\\tfill=\\"url(#imgFill1)\\"\\r\\n\\t/>\\r\\n\\t<circle cx=\\"650\\" cy=\\"297\\" r=\\"34\\" transform=\\"rotate(-19.6645 650 297)\\" fill=\\"url(#imgFill2)\\" />\\r\\n\\t<circle cx=\\"420.502\\" cy=\\"273.5\\" r=\\"88.5\\" fill=\\"url(#imgFill3)\\" />\\r\\n\\t<circle\\r\\n\\t\\tcx=\\"721.5\\"\\r\\n\\t\\tcy=\\"70.5001\\"\\r\\n\\t\\tr=\\"56.5\\"\\r\\n\\t\\ttransform=\\"rotate(6.69448 721.5 70.5001)\\"\\r\\n\\t\\tfill=\\"url(#imgFill4)\\"\\r\\n\\t/>\\r\\n\\t<circle cx=\\"554.501\\" cy=\\"503.5\\" r=\\"62.5\\" fill=\\"url(#imgFill5)\\" />\\r\\n\\t<circle cx=\\"157.5\\" cy=\\"493.5\\" r=\\"56.5\\" fill=\\"url(#imgFill6)\\" />\\r\\n\\t<circle cx=\\"462.502\\" cy=\\"34.5\\" r=\\"34.5\\" fill=\\"url(#imgFill7)\\" />\\r\\n\\t<circle\\r\\n\\t\\tcx=\\"344.117\\"\\r\\n\\t\\tcy=\\"450.115\\"\\r\\n\\t\\tr=\\"36.0472\\"\\r\\n\\t\\ttransform=\\"rotate(10.7041 344.117 450.115)\\"\\r\\n\\t\\tfill=\\"url(#imgFill8)\\"\\r\\n\\t/>\\r\\n\\t<circle\\r\\n\\t\\tcx=\\"722.325\\"\\r\\n\\t\\tcy=\\"437.325\\"\\r\\n\\t\\tr=\\"26.5\\"\\r\\n\\t\\ttransform=\\"rotate(6.48841 722.325 437.325)\\"\\r\\n\\t\\tfill=\\"url(#imgFill9)\\"\\r\\n\\t/>\\r\\n\\t<circle\\r\\n\\t\\tcx=\\"580.5\\"\\r\\n\\t\\tcy=\\"144.5\\"\\r\\n\\t\\tr=\\"30.326\\"\\r\\n\\t\\ttransform=\\"rotate(12.9617 580.5 144.5)\\"\\r\\n\\t\\tfill=\\"url(#imgFill10)\\"\\r\\n\\t/>\\r\\n\\t<circle\\r\\n\\t\\tcx=\\"264.501\\"\\r\\n\\t\\tcy=\\"126.5\\"\\r\\n\\t\\tr=\\"35.1832\\"\\r\\n\\t\\ttransform=\\"rotate(-12.2032 264.501 126.5)\\"\\r\\n\\t\\tfill=\\"url(#imgFill11)\\"\\r\\n\\t/>\\r\\n\\t<circle\\r\\n\\t\\tcx=\\"34.0707\\"\\r\\n\\t\\tcy=\\"372.071\\"\\r\\n\\t\\tr=\\"26.5\\"\\r\\n\\t\\ttransform=\\"rotate(8.3588 30.0707 372.071)\\"\\r\\n\\t\\tfill=\\"url(#imgFill12)\\"\\r\\n\\t/>\\r\\n\\t<defs>\\r\\n\\t\\t<pattern id=\\"imgFill0\\" patternContentUnits=\\"objectBoundingBox\\" width=\\"1\\" height=\\"1\\">\\r\\n\\t\\t\\t<image\\r\\n\\t\\t\\t\\tid=\\"img0\\"\\r\\n\\t\\t\\t\\twidth=\\"1\\"\\r\\n\\t\\t\\t\\theight=\\"1\\"\\r\\n\\t\\t\\t\\txlink:href=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/js-light_NsS7e7h1iO.png\\"\\r\\n\\t\\t\\t/>\\r\\n\\t\\t</pattern>\\r\\n\\t\\t<pattern id=\\"imgFill1\\" patternContentUnits=\\"objectBoundingBox\\" width=\\"1\\" height=\\"1\\"\\r\\n\\t\\t\\t><image\\r\\n\\t\\t\\t\\tid=\\"img1\\"\\r\\n\\t\\t\\t\\twidth=\\"1\\"\\r\\n\\t\\t\\t\\theight=\\"1\\"\\r\\n\\t\\t\\t\\txlink:href=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/figma_NhfQvqQk9s.png\\"\\r\\n\\t\\t\\t/>\\r\\n\\t\\t\\t<image\\r\\n\\t\\t\\t\\tid=\\"img1\\"\\r\\n\\t\\t\\t\\twidth=\\"1\\"\\r\\n\\t\\t\\t\\theight=\\"1\\"\\r\\n\\t\\t\\t\\txlink:href=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/figma_NhfQvqQk9s.png\\"\\r\\n\\t\\t\\t/>\\r\\n\\t\\t</pattern>\\r\\n\\t\\t<pattern id=\\"imgFill2\\" patternContentUnits=\\"objectBoundingBox\\" width=\\"1\\" height=\\"1\\"\\r\\n\\t\\t\\t><image\\r\\n\\t\\t\\t\\tid=\\"img2\\"\\r\\n\\t\\t\\t\\twidth=\\"1\\"\\r\\n\\t\\t\\t\\theight=\\"1\\"\\r\\n\\t\\t\\t\\txlink:href=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/work_SWEpk52-xk.png\\"\\r\\n\\t\\t\\t/>\\r\\n\\t\\t\\t<image\\r\\n\\t\\t\\t\\tid=\\"img2\\"\\r\\n\\t\\t\\t\\twidth=\\"1\\"\\r\\n\\t\\t\\t\\theight=\\"1\\"\\r\\n\\t\\t\\t\\txlink:href=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/work_SWEpk52-xk.png\\"\\r\\n\\t\\t\\t/>\\r\\n\\t\\t</pattern>\\r\\n\\t\\t<pattern id=\\"imgFill3\\" patternContentUnits=\\"objectBoundingBox\\" width=\\"1\\" height=\\"1\\"\\r\\n\\t\\t\\t><image\\r\\n\\t\\t\\t\\tid=\\"img3\\"\\r\\n\\t\\t\\t\\twidth=\\"1\\"\\r\\n\\t\\t\\t\\theight=\\"1\\"\\r\\n\\t\\t\\t\\txlink:href=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/me_8_97RTibL3.png\\"\\r\\n\\t\\t\\t/>\\r\\n\\t\\t\\t<image\\r\\n\\t\\t\\t\\tid=\\"img3\\"\\r\\n\\t\\t\\t\\twidth=\\"1\\"\\r\\n\\t\\t\\t\\theight=\\"1\\"\\r\\n\\t\\t\\t\\txlink:href=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/me_8_97RTibL3.png\\"\\r\\n\\t\\t\\t/>\\r\\n\\t\\t</pattern>\\r\\n\\t\\t<pattern id=\\"imgFill4\\" patternContentUnits=\\"objectBoundingBox\\" width=\\"1\\" height=\\"1\\"\\r\\n\\t\\t\\t><image\\r\\n\\t\\t\\t\\tid=\\"img4\\"\\r\\n\\t\\t\\t\\twidth=\\"1\\"\\r\\n\\t\\t\\t\\theight=\\"1\\"\\r\\n\\t\\t\\t\\txlink:href=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/city_bGlwgxsd7.png\\"\\r\\n\\t\\t\\t/>\\r\\n\\t\\t\\t<image\\r\\n\\t\\t\\t\\tid=\\"img4\\"\\r\\n\\t\\t\\t\\twidth=\\"1\\"\\r\\n\\t\\t\\t\\theight=\\"1\\"\\r\\n\\t\\t\\t\\txlink:href=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/city_bGlwgxsd7.png\\"\\r\\n\\t\\t\\t/>\\r\\n\\t\\t</pattern>\\r\\n\\t\\t<pattern id=\\"imgFill5\\" patternContentUnits=\\"objectBoundingBox\\" width=\\"1\\" height=\\"1\\"\\r\\n\\t\\t\\t><image\\r\\n\\t\\t\\t\\tid=\\"img5\\"\\r\\n\\t\\t\\t\\twidth=\\"1\\"\\r\\n\\t\\t\\t\\theight=\\"1\\"\\r\\n\\t\\t\\t\\txlink:href=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/dog_jmLx-UJ0Qn.png\\"\\r\\n\\t\\t\\t/>\\r\\n\\t\\t\\t<image\\r\\n\\t\\t\\t\\tid=\\"img5\\"\\r\\n\\t\\t\\t\\twidth=\\"1\\"\\r\\n\\t\\t\\t\\theight=\\"1\\"\\r\\n\\t\\t\\t\\txlink:href=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/dog_jmLx-UJ0Qn.png\\"\\r\\n\\t\\t\\t/>\\r\\n\\t\\t</pattern>\\r\\n\\t\\t<pattern id=\\"imgFill6\\" patternContentUnits=\\"objectBoundingBox\\" width=\\"1\\" height=\\"1\\"\\r\\n\\t\\t\\t><image\\r\\n\\t\\t\\t\\tid=\\"img6\\"\\r\\n\\t\\t\\t\\twidth=\\"1\\"\\r\\n\\t\\t\\t\\theight=\\"1\\"\\r\\n\\t\\t\\t\\txlink:href=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/coffee_Az-P5TG4TO.png\\"\\r\\n\\t\\t\\t/>\\r\\n\\t\\t\\t<image\\r\\n\\t\\t\\t\\tid=\\"img6\\"\\r\\n\\t\\t\\t\\twidth=\\"1\\"\\r\\n\\t\\t\\t\\theight=\\"1\\"\\r\\n\\t\\t\\t\\txlink:href=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/coffee_Az-P5TG4TO.png\\"\\r\\n\\t\\t\\t/>\\r\\n\\t\\t</pattern>\\r\\n\\t\\t<pattern id=\\"imgFill7\\" patternContentUnits=\\"objectBoundingBox\\" width=\\"1\\" height=\\"1\\"\\r\\n\\t\\t\\t><image\\r\\n\\t\\t\\t\\tid=\\"img7\\"\\r\\n\\t\\t\\t\\twidth=\\"1\\"\\r\\n\\t\\t\\t\\theight=\\"1\\"\\r\\n\\t\\t\\t\\txlink:href=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/wordpress_CL23aAT88.png\\"\\r\\n\\t\\t\\t/>\\r\\n\\t\\t\\t<image\\r\\n\\t\\t\\t\\tid=\\"img7\\"\\r\\n\\t\\t\\t\\twidth=\\"1\\"\\r\\n\\t\\t\\t\\theight=\\"1\\"\\r\\n\\t\\t\\t\\txlink:href=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/wordpress_CL23aAT88.png\\"\\r\\n\\t\\t\\t/>\\r\\n\\t\\t</pattern>\\r\\n\\t\\t<pattern id=\\"imgFill8\\" patternContentUnits=\\"objectBoundingBox\\" width=\\"1\\" height=\\"1\\"\\r\\n\\t\\t\\t><image\\r\\n\\t\\t\\t\\tid=\\"img8\\"\\r\\n\\t\\t\\t\\twidth=\\"1\\"\\r\\n\\t\\t\\t\\theight=\\"1\\"\\r\\n\\t\\t\\t\\txlink:href=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/svelte_hiH-1myDZrb.png\\"\\r\\n\\t\\t\\t/>\\r\\n\\t\\t\\t<image\\r\\n\\t\\t\\t\\tid=\\"img8\\"\\r\\n\\t\\t\\t\\twidth=\\"1\\"\\r\\n\\t\\t\\t\\theight=\\"1\\"\\r\\n\\t\\t\\t\\txlink:href=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/svelte_hiH-1myDZrb.png\\"\\r\\n\\t\\t\\t/>\\r\\n\\t\\t</pattern>\\r\\n\\t\\t<pattern id=\\"imgFill9\\" patternContentUnits=\\"objectBoundingBox\\" width=\\"1\\" height=\\"1\\"\\r\\n\\t\\t\\t><image\\r\\n\\t\\t\\t\\tid=\\"img9\\"\\r\\n\\t\\t\\t\\twidth=\\"1\\"\\r\\n\\t\\t\\t\\theight=\\"1\\"\\r\\n\\t\\t\\t\\txlink:href=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/indesign_v9_etFN4N.png\\"\\r\\n\\t\\t\\t/>\\r\\n\\t\\t\\t<image\\r\\n\\t\\t\\t\\tid=\\"img9\\"\\r\\n\\t\\t\\t\\twidth=\\"1\\"\\r\\n\\t\\t\\t\\theight=\\"1\\"\\r\\n\\t\\t\\t\\txlink:href=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/indesign_v9_etFN4N.png\\"\\r\\n\\t\\t\\t/>\\r\\n\\t\\t</pattern>\\r\\n\\t\\t<pattern id=\\"imgFill10\\" patternContentUnits=\\"objectBoundingBox\\" width=\\"1\\" height=\\"1\\"\\r\\n\\t\\t\\t><image\\r\\n\\t\\t\\t\\tid=\\"img10\\"\\r\\n\\t\\t\\t\\twidth=\\"1\\"\\r\\n\\t\\t\\t\\theight=\\"1\\"\\r\\n\\t\\t\\t\\txlink:href=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/android_hD0IP-0hc5.png\\"\\r\\n\\t\\t\\t/>\\r\\n\\t\\t\\t<image\\r\\n\\t\\t\\t\\tid=\\"img10\\"\\r\\n\\t\\t\\t\\twidth=\\"1\\"\\r\\n\\t\\t\\t\\theight=\\"1\\"\\r\\n\\t\\t\\t\\txlink:href=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/android_hD0IP-0hc5.png\\"\\r\\n\\t\\t\\t/>\\r\\n\\t\\t</pattern>\\r\\n\\t\\t<pattern id=\\"imgFill11\\" patternContentUnits=\\"objectBoundingBox\\" width=\\"1\\" height=\\"1\\"\\r\\n\\t\\t\\t><image\\r\\n\\t\\t\\t\\tid=\\"img11\\"\\r\\n\\t\\t\\t\\twidth=\\"1\\"\\r\\n\\t\\t\\t\\theight=\\"1\\"\\r\\n\\t\\t\\t\\txlink:href=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/airplane_9HO0AsWwb.png\\"\\r\\n\\t\\t\\t/>\\r\\n\\t\\t\\t<image\\r\\n\\t\\t\\t\\tid=\\"img11\\"\\r\\n\\t\\t\\t\\twidth=\\"1\\"\\r\\n\\t\\t\\t\\theight=\\"1\\"\\r\\n\\t\\t\\t\\txlink:href=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/airplane_9HO0AsWwb.png\\"\\r\\n\\t\\t\\t/>\\r\\n\\t\\t</pattern>\\r\\n\\t\\t<pattern id=\\"imgFill12\\" patternContentUnits=\\"objectBoundingBox\\" width=\\"1\\" height=\\"1\\"\\r\\n\\t\\t\\t><image\\r\\n\\t\\t\\t\\tid=\\"img12\\"\\r\\n\\t\\t\\t\\twidth=\\"1\\"\\r\\n\\t\\t\\t\\theight=\\"1\\"\\r\\n\\t\\t\\t\\txlink:href=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/photoshop_6Hh47E7c-.png\\"\\r\\n\\t\\t\\t/>\\r\\n\\t\\t\\t<image\\r\\n\\t\\t\\t\\tid=\\"img12\\"\\r\\n\\t\\t\\t\\twidth=\\"1\\"\\r\\n\\t\\t\\t\\theight=\\"1\\"\\r\\n\\t\\t\\t\\txlink:href=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/photoshop_6Hh47E7c-.png\\"\\r\\n\\t\\t\\t/>\\r\\n\\t\\t</pattern>\\r\\n\\t</defs>\\r\\n</svg>\\r\\n\\r\\n<style lang=\\"postcss\\">svg{shape-rendering:geometricPrecision;height:auto;width:100%}@media (min-width:640px){svg{width:80vw}}@media (min-width:768px){svg{width:60vw}}@media (min-width:1024px){svg{--tw-translate-x:4.375rem;transform:var(--tw-transform);width:100%}}</style>\\r\\n"],"names":[],"mappings":"AAyPsB,iBAAG,CAAC,gBAAgB,kBAAkB,CAAC,OAAO,IAAI,CAAC,MAAM,IAAI,CAAC,MAAM,AAAC,WAAW,KAAK,CAAC,CAAC,iBAAG,CAAC,MAAM,IAAI,CAAC,CAAC,MAAM,AAAC,WAAW,KAAK,CAAC,CAAC,iBAAG,CAAC,MAAM,IAAI,CAAC,CAAC,MAAM,AAAC,WAAW,MAAM,CAAC,CAAC,iBAAG,CAAC,iBAAiB,QAAQ,CAAC,UAAU,IAAI,cAAc,CAAC,CAAC,MAAM,IAAI,CAAC,CAAC"}'
};
var AboutImage = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$3);
  return `<svg width="${"785"}" height="${"566"}" viewBox="${"0 0 785 566"}" fill="${"none"}" xmlns="${"http://www.w3.org/2000/svg"}" xmlns:xlink="${"http://www.w3.org/1999/xlink"}" class="${"svelte-8vp0lw"}"><circle cx="${"62.5012"}" cy="${"79.5"}" r="${"54.5"}" transform="${"rotate(-9.17892 62.5012 79.5)"}" fill="${"url(#imgFill0)"}"></circle><circle cx="${"172.322"}" cy="${"277.32"}" r="${"34"}" transform="${"rotate(-14.244 172.322 277.32)"}" fill="${"url(#imgFill1)"}"></circle><circle cx="${"650"}" cy="${"297"}" r="${"34"}" transform="${"rotate(-19.6645 650 297)"}" fill="${"url(#imgFill2)"}"></circle><circle cx="${"420.502"}" cy="${"273.5"}" r="${"88.5"}" fill="${"url(#imgFill3)"}"></circle><circle cx="${"721.5"}" cy="${"70.5001"}" r="${"56.5"}" transform="${"rotate(6.69448 721.5 70.5001)"}" fill="${"url(#imgFill4)"}"></circle><circle cx="${"554.501"}" cy="${"503.5"}" r="${"62.5"}" fill="${"url(#imgFill5)"}"></circle><circle cx="${"157.5"}" cy="${"493.5"}" r="${"56.5"}" fill="${"url(#imgFill6)"}"></circle><circle cx="${"462.502"}" cy="${"34.5"}" r="${"34.5"}" fill="${"url(#imgFill7)"}"></circle><circle cx="${"344.117"}" cy="${"450.115"}" r="${"36.0472"}" transform="${"rotate(10.7041 344.117 450.115)"}" fill="${"url(#imgFill8)"}"></circle><circle cx="${"722.325"}" cy="${"437.325"}" r="${"26.5"}" transform="${"rotate(6.48841 722.325 437.325)"}" fill="${"url(#imgFill9)"}"></circle><circle cx="${"580.5"}" cy="${"144.5"}" r="${"30.326"}" transform="${"rotate(12.9617 580.5 144.5)"}" fill="${"url(#imgFill10)"}"></circle><circle cx="${"264.501"}" cy="${"126.5"}" r="${"35.1832"}" transform="${"rotate(-12.2032 264.501 126.5)"}" fill="${"url(#imgFill11)"}"></circle><circle cx="${"34.0707"}" cy="${"372.071"}" r="${"26.5"}" transform="${"rotate(8.3588 30.0707 372.071)"}" fill="${"url(#imgFill12)"}"></circle><defs><pattern id="${"imgFill0"}" patternContentUnits="${"objectBoundingBox"}" width="${"1"}" height="${"1"}"><image id="${"img0"}" width="${"1"}" height="${"1"}" xlink:href="${"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/js-light_NsS7e7h1iO.png"}"></image></pattern><pattern id="${"imgFill1"}" patternContentUnits="${"objectBoundingBox"}" width="${"1"}" height="${"1"}"><image id="${"img1"}" width="${"1"}" height="${"1"}" xlink:href="${"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/figma_NhfQvqQk9s.png"}"></image><image id="${"img1"}" width="${"1"}" height="${"1"}" xlink:href="${"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/figma_NhfQvqQk9s.png"}"></image></pattern><pattern id="${"imgFill2"}" patternContentUnits="${"objectBoundingBox"}" width="${"1"}" height="${"1"}"><image id="${"img2"}" width="${"1"}" height="${"1"}" xlink:href="${"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/work_SWEpk52-xk.png"}"></image><image id="${"img2"}" width="${"1"}" height="${"1"}" xlink:href="${"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/work_SWEpk52-xk.png"}"></image></pattern><pattern id="${"imgFill3"}" patternContentUnits="${"objectBoundingBox"}" width="${"1"}" height="${"1"}"><image id="${"img3"}" width="${"1"}" height="${"1"}" xlink:href="${"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/me_8_97RTibL3.png"}"></image><image id="${"img3"}" width="${"1"}" height="${"1"}" xlink:href="${"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/me_8_97RTibL3.png"}"></image></pattern><pattern id="${"imgFill4"}" patternContentUnits="${"objectBoundingBox"}" width="${"1"}" height="${"1"}"><image id="${"img4"}" width="${"1"}" height="${"1"}" xlink:href="${"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/city_bGlwgxsd7.png"}"></image><image id="${"img4"}" width="${"1"}" height="${"1"}" xlink:href="${"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/city_bGlwgxsd7.png"}"></image></pattern><pattern id="${"imgFill5"}" patternContentUnits="${"objectBoundingBox"}" width="${"1"}" height="${"1"}"><image id="${"img5"}" width="${"1"}" height="${"1"}" xlink:href="${"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/dog_jmLx-UJ0Qn.png"}"></image><image id="${"img5"}" width="${"1"}" height="${"1"}" xlink:href="${"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/dog_jmLx-UJ0Qn.png"}"></image></pattern><pattern id="${"imgFill6"}" patternContentUnits="${"objectBoundingBox"}" width="${"1"}" height="${"1"}"><image id="${"img6"}" width="${"1"}" height="${"1"}" xlink:href="${"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/coffee_Az-P5TG4TO.png"}"></image><image id="${"img6"}" width="${"1"}" height="${"1"}" xlink:href="${"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/coffee_Az-P5TG4TO.png"}"></image></pattern><pattern id="${"imgFill7"}" patternContentUnits="${"objectBoundingBox"}" width="${"1"}" height="${"1"}"><image id="${"img7"}" width="${"1"}" height="${"1"}" xlink:href="${"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/wordpress_CL23aAT88.png"}"></image><image id="${"img7"}" width="${"1"}" height="${"1"}" xlink:href="${"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/wordpress_CL23aAT88.png"}"></image></pattern><pattern id="${"imgFill8"}" patternContentUnits="${"objectBoundingBox"}" width="${"1"}" height="${"1"}"><image id="${"img8"}" width="${"1"}" height="${"1"}" xlink:href="${"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/svelte_hiH-1myDZrb.png"}"></image><image id="${"img8"}" width="${"1"}" height="${"1"}" xlink:href="${"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/svelte_hiH-1myDZrb.png"}"></image></pattern><pattern id="${"imgFill9"}" patternContentUnits="${"objectBoundingBox"}" width="${"1"}" height="${"1"}"><image id="${"img9"}" width="${"1"}" height="${"1"}" xlink:href="${"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/indesign_v9_etFN4N.png"}"></image><image id="${"img9"}" width="${"1"}" height="${"1"}" xlink:href="${"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/indesign_v9_etFN4N.png"}"></image></pattern><pattern id="${"imgFill10"}" patternContentUnits="${"objectBoundingBox"}" width="${"1"}" height="${"1"}"><image id="${"img10"}" width="${"1"}" height="${"1"}" xlink:href="${"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/android_hD0IP-0hc5.png"}"></image><image id="${"img10"}" width="${"1"}" height="${"1"}" xlink:href="${"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/android_hD0IP-0hc5.png"}"></image></pattern><pattern id="${"imgFill11"}" patternContentUnits="${"objectBoundingBox"}" width="${"1"}" height="${"1"}"><image id="${"img11"}" width="${"1"}" height="${"1"}" xlink:href="${"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/airplane_9HO0AsWwb.png"}"></image><image id="${"img11"}" width="${"1"}" height="${"1"}" xlink:href="${"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/airplane_9HO0AsWwb.png"}"></image></pattern><pattern id="${"imgFill12"}" patternContentUnits="${"objectBoundingBox"}" width="${"1"}" height="${"1"}"><image id="${"img12"}" width="${"1"}" height="${"1"}" xlink:href="${"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/photoshop_6Hh47E7c-.png"}"></image><image id="${"img12"}" width="${"1"}" height="${"1"}" xlink:href="${"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/photoshop_6Hh47E7c-.png"}"></image></pattern></defs></svg>`;
});
var css$2 = {
  code: "h3.svelte-119otmt{color:currentColor}@media(min-width:1024px){h3.svelte-119otmt{color:var(--work-showcase-text-color,currentColor)}}",
  map: '{"version":3,"file":"WorkShowcaseCard.svelte","sources":["WorkShowcaseCard.svelte"],"sourcesContent":["<script>\\r\\n\\timport { preferences, prefersColorSchemeDark, ThemeMode } from \'../stores\';\\r\\n\\r\\n\\texport let imageFilename;\\r\\n\\texport let imageFormat = \'png\';\\r\\n\\texport let name;\\r\\n\\texport let url;\\r\\n\\texport let lightColor = \'white\';\\r\\n\\texport let desktopTextHorAlignEnd = false;\\r\\n\\texport let desktopTextVerAlignBottom = false;\\r\\n\\texport let extraClass = \'\';\\r\\n\\r\\n\\tconst dHor = desktopTextHorAlignEnd ? \'lg:justify-self-end\' : \'lg:justify-self-start\';\\r\\n\\tconst dVer = desktopTextVerAlignBottom ? \'lg:self-end\' : \'lg:self-start\';\\r\\n\\r\\n\\tconst baseUrl =\\r\\n\\t\\t\'https://ik.imagekit.io/goranalkovic/personal_web/homepage/projects/tr:n-home_workcard\';\\r\\n\\tconst mobileImageUrl = `${baseUrl}/${imageFilename}-mobile-light.${imageFormat}`;\\r\\n\\tconst imageUrl = `${baseUrl}/${imageFilename}-light.${imageFormat}`;\\r\\n\\tconst darkMobileImageUrl = `${baseUrl}/${imageFilename}-mobile-dark.${imageFormat}`;\\r\\n\\tconst darkImageUrl = `${baseUrl}/${imageFilename}-dark.${imageFormat}`;\\r\\n\\r\\n\\t$: shouldBeDark =\\r\\n\\t\\t($preferences.theme === ThemeMode.AUTO && $prefersColorSchemeDark) ||\\r\\n\\t\\t$preferences.theme === ThemeMode.DARK;\\r\\n\\t$: mobileImage = shouldBeDark ? darkMobileImageUrl : mobileImageUrl;\\r\\n\\t$: desktopImage = shouldBeDark ? darkImageUrl : imageUrl;\\r\\n<\/script>\\r\\n\\r\\n<a\\r\\n\\thref={url}\\r\\n\\tclass=\\"rounded-xl flex flex-col lg:grid lg:grid-cols-1 lg:grid-rows-1 transform-gpu hover:scale-[1.01] transition {extraClass}\\"\\r\\n\\tstyle=\\"--work-showcase-text-color: {shouldBeDark ? \'#fff\' : lightColor};\\"\\r\\n>\\r\\n\\t<picture class=\\"lg:row-start-1 lg:row-end-1 lg:col-start-1 lg:col-end-1\\">\\r\\n\\t\\t<source srcset={mobileImage} media=\\"(max-width: 1023px)\\" />\\r\\n\\t\\t<img\\r\\n\\t\\t\\tclass=\\"rounded-xl w-full h-full md:h-300 lg:h-full object-cover\\"\\r\\n\\t\\t\\tsrc={desktopImage}\\r\\n\\t\\t\\talt={name}\\r\\n\\t\\t/>\\r\\n\\t</picture>\\r\\n\\t<h3\\r\\n\\t\\tclass=\\"mt-15 lg:mt-0 mb-30 sm:mb-0 text-18 md:text-24 lg:text-40 font-medium lg:font-semibold lg:row-start-1 lg:row-end-1 lg:col-start-1 lg:col-end-1 {dVer} {dHor} lg:p-20 transition-colors\\"\\r\\n\\t>\\r\\n\\t\\t{name}\\r\\n\\t</h3>\\r\\n</a>\\r\\n\\r\\n<style lang=\\"postcss\\">h3{color:currentColor}@media (min-width:1024px){h3{color:var(--work-showcase-text-color,currentColor)}}</style>\\r\\n"],"names":[],"mappings":"AAiDsB,iBAAE,CAAC,MAAM,YAAY,CAAC,MAAM,AAAC,WAAW,MAAM,CAAC,CAAC,iBAAE,CAAC,MAAM,IAAI,0BAA0B,CAAC,YAAY,CAAC,CAAC,CAAC"}'
};
var baseUrl = "https://ik.imagekit.io/goranalkovic/personal_web/homepage/projects/tr:n-home_workcard";
var WorkShowcaseCard = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let shouldBeDark;
  let mobileImage;
  let desktopImage;
  let $preferences, $$unsubscribe_preferences;
  let $prefersColorSchemeDark, $$unsubscribe_prefersColorSchemeDark;
  $$unsubscribe_preferences = subscribe(preferences, (value) => $preferences = value);
  $$unsubscribe_prefersColorSchemeDark = subscribe(prefersColorSchemeDark, (value) => $prefersColorSchemeDark = value);
  let { imageFilename } = $$props;
  let { imageFormat = "png" } = $$props;
  let { name } = $$props;
  let { url } = $$props;
  let { lightColor = "white" } = $$props;
  let { desktopTextHorAlignEnd = false } = $$props;
  let { desktopTextVerAlignBottom = false } = $$props;
  let { extraClass = "" } = $$props;
  const dHor = desktopTextHorAlignEnd ? "lg:justify-self-end" : "lg:justify-self-start";
  const dVer = desktopTextVerAlignBottom ? "lg:self-end" : "lg:self-start";
  const mobileImageUrl = `${baseUrl}/${imageFilename}-mobile-light.${imageFormat}`;
  const imageUrl = `${baseUrl}/${imageFilename}-light.${imageFormat}`;
  const darkMobileImageUrl = `${baseUrl}/${imageFilename}-mobile-dark.${imageFormat}`;
  const darkImageUrl = `${baseUrl}/${imageFilename}-dark.${imageFormat}`;
  if ($$props.imageFilename === void 0 && $$bindings.imageFilename && imageFilename !== void 0)
    $$bindings.imageFilename(imageFilename);
  if ($$props.imageFormat === void 0 && $$bindings.imageFormat && imageFormat !== void 0)
    $$bindings.imageFormat(imageFormat);
  if ($$props.name === void 0 && $$bindings.name && name !== void 0)
    $$bindings.name(name);
  if ($$props.url === void 0 && $$bindings.url && url !== void 0)
    $$bindings.url(url);
  if ($$props.lightColor === void 0 && $$bindings.lightColor && lightColor !== void 0)
    $$bindings.lightColor(lightColor);
  if ($$props.desktopTextHorAlignEnd === void 0 && $$bindings.desktopTextHorAlignEnd && desktopTextHorAlignEnd !== void 0)
    $$bindings.desktopTextHorAlignEnd(desktopTextHorAlignEnd);
  if ($$props.desktopTextVerAlignBottom === void 0 && $$bindings.desktopTextVerAlignBottom && desktopTextVerAlignBottom !== void 0)
    $$bindings.desktopTextVerAlignBottom(desktopTextVerAlignBottom);
  if ($$props.extraClass === void 0 && $$bindings.extraClass && extraClass !== void 0)
    $$bindings.extraClass(extraClass);
  $$result.css.add(css$2);
  shouldBeDark = $preferences.theme === ThemeMode.AUTO && $prefersColorSchemeDark || $preferences.theme === ThemeMode.DARK;
  mobileImage = shouldBeDark ? darkMobileImageUrl : mobileImageUrl;
  desktopImage = shouldBeDark ? darkImageUrl : imageUrl;
  $$unsubscribe_preferences();
  $$unsubscribe_prefersColorSchemeDark();
  return `<a${add_attribute("href", url, 0)} class="${"rounded-xl flex flex-col lg:grid lg:grid-cols-1 lg:grid-rows-1 transform-gpu hover:scale-[1.01] transition " + escape2(extraClass)}" style="${"--work-showcase-text-color: " + escape2(shouldBeDark ? "#fff" : lightColor) + ";"}"><picture class="${"lg:row-start-1 lg:row-end-1 lg:col-start-1 lg:col-end-1"}"><source${add_attribute("srcset", mobileImage, 0)} media="${"(max-width: 1023px)"}">
		<img class="${"rounded-xl w-full h-full md:h-300 lg:h-full object-cover"}"${add_attribute("src", desktopImage, 0)}${add_attribute("alt", name, 0)}></picture>
	<h3 class="${"mt-15 lg:mt-0 mb-30 sm:mb-0 text-18 md:text-24 lg:text-40 font-medium lg:font-semibold lg:row-start-1 lg:row-end-1 lg:col-start-1 lg:col-end-1 " + escape2(dVer) + " " + escape2(dHor) + " lg:p-20 transition-colors svelte-119otmt"}">${escape2(name)}</h3>
</a>`;
});
var ContactItem = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { title } = $$props;
  let { contactPrefix = "" } = $$props;
  let { contact } = $$props;
  let { buttonCaption } = $$props;
  let { buttonUrl } = $$props;
  if ($$props.title === void 0 && $$bindings.title && title !== void 0)
    $$bindings.title(title);
  if ($$props.contactPrefix === void 0 && $$bindings.contactPrefix && contactPrefix !== void 0)
    $$bindings.contactPrefix(contactPrefix);
  if ($$props.contact === void 0 && $$bindings.contact && contact !== void 0)
    $$bindings.contact(contact);
  if ($$props.buttonCaption === void 0 && $$bindings.buttonCaption && buttonCaption !== void 0)
    $$bindings.buttonCaption(buttonCaption);
  if ($$props.buttonUrl === void 0 && $$bindings.buttonUrl && buttonUrl !== void 0)
    $$bindings.buttonUrl(buttonUrl);
  return `<div><p class="${"text-18 font-bold transition-colors"}">${escape2(title)}</p>
    <p class="${"text-14 transition-colors text-black dark:text-rich-purple-300"}"><span>${escape2(contactPrefix)}</span><span class="${"text-rich-purple-500 dark:text-white"}">${escape2(contact)}</span></p>

    ${validate_component(ArrowButton, "ArrowButton").$$render($$result, {
    external: true,
    url: buttonUrl,
    content: buttonCaption,
    extraClass: "mt-15"
  }, {}, {})}</div>`;
});
var css$1 = {
  code: "section.svelte-ye5pxv.svelte-ye5pxv{padding-bottom:3.75rem;padding-top:7.5rem}@media(min-width:768px){section.svelte-ye5pxv.svelte-ye5pxv{padding-bottom:3.75rem;padding-top:11.25rem}}#about.svelte-ye5pxv p.svelte-ye5pxv{font-size:.875rem;line-height:1.5;transition-duration:.15s;transition-property:background-color,border-color,color,fill,stroke;transition-timing-function:cubic-bezier(.4,0,.2,1)}@media(min-width:768px){#about.svelte-ye5pxv p.svelte-ye5pxv{font-size:1.125rem;line-height:1.5}}",
  map: `{"version":3,"file":"index.svelte","sources":["index.svelte"],"sourcesContent":["<script>\\n\\timport ArrowButton, { ArrowDirections } from '$lib/ArrowButton.svelte';\\n\\timport AboutImage from '$lib/AboutImage.svelte';\\n\\timport WorkShowcaseCard from '$lib/WorkShowcaseCard.svelte';\\n\\timport ContactItem from '$lib/ContactItem.svelte';\\n<\/script>\\n\\n<svelte:head>\\n\\t<title>Goran Alkovi\u0107 | Developer & designer</title>\\n\\t<meta\\n\\t\\tname=\\"description\\"\\n\\t\\tcontent=\\"Goran Alkovi\u0107 - a frontend developer that also likes to design.\\"\\n\\t/>\\n</svelte:head>\\n\\n<section id=\\"intro\\" class=\\"content-padding h-[90vh] !py-0 flex flex-col justify-center\\">\\n\\t<h1 class=\\"max-w-[68rem]\\">\\n\\t\\t<span class=\\"block text-transparent text-stroke-1 text-stroke-black dark:text-stroke-white\\">\\n\\t\\t\\tHi! I'm Goran.\\n\\t\\t</span>\\n\\t\\t<span class=\\"block\\">\\n\\t\\t\\tA <span class=\\"purple-text\\">frontend developer</span> that also likes to design.\\n\\t\\t</span>\\n\\t</h1>\\n\\n\\t<ArrowButton\\n\\t\\tcontent=\\"Learn more about me\\"\\n\\t\\turl=\\"#about\\"\\n\\t\\tarrowDirection={ArrowDirections.DOWN}\\n\\t\\textraClass=\\"mt-30 md:mt-60\\"\\n\\t/>\\n</section>\\n\\n<section\\n\\tclass=\\"content-padding lg:flex lg:flex-row-reverse md:col-start-2 md:col-span-2\\"\\n\\tid=\\"about\\"\\n>\\n\\t<AboutImage />\\n\\t<div class=\\"flex flex-col gap-15 max-w-lg lg:max-w-420 md:mr-px mt-30 sm:mt-60 lg:mt-0 lg:mr-30\\">\\n\\t\\t<h2><span class=\\"purple-text\\">About</span> me</h2>\\n\\t\\t<p>\\n\\t\\t\\tI\u2019m a frontend developer who also likes to design. My philosophy is that everything should be\\n\\t\\t\\tvisually pleasing and easy to use, besides just doing its job.\\n\\t\\t</p>\\n\\t\\t<p>\\n\\t\\t\\tThroughout the years I tried a lot of technologies and fields in development, but what won at\\n\\t\\t\\tthe end was web development (mostly frontend).\\n\\t\\t</p>\\n\\t\\t<p>\\n\\t\\t\\tDesign-wise I\u2019ve done some print design, but mostly I\u2019ve worked on digital design and UI/UX\\n\\t\\t\\tfor my personal projects.\\n\\t\\t</p>\\n\\t\\t<p>\\n\\t\\t\\tCurrently working at <a class=\\"underline \\" href=\\"https://infinum.com\\">Infinum</a> as a WordPress\\n\\t\\t\\tengineer, where I create custom Gutenberg block themes and work on the open-source Eightshift boilerplate.\\n\\t\\t</p>\\n\\t\\t<p>\\n\\t\\t\\tIn my free time I love to drink coffee, explore what\u2019s new in tech, make crazy projects and\\n\\t\\t\\tgame a bit here and there.\\n\\t\\t</p>\\n\\t\\t<ArrowButton content=\\"Read my CV\\" url=\\"/about\\" extraClass=\\"mt-15 md:mt-30\\" />\\n\\t\\t<ArrowButton\\n\\t\\t\\tcontent=\\"Explore my work\\"\\n\\t\\t\\turl=\\"#work\\"\\n\\t\\t\\textraClass=\\"mt-15\\"\\n\\t\\t\\tarrowDirection={ArrowDirections.DOWN}\\n\\t\\t/>\\n\\t</div>\\n</section>\\n\\n<section class=\\"content-padding\\" id=\\"work\\">\\n\\t<div class=\\"sm:grid sm:grid-cols-2 sm:gap-15 md:gap-30 lg:grid-rows-[min,1fr,1fr,6rem]\\">\\n\\t\\t<h2 class=\\"mb-30 sm:mb-15 md:mb-0 sm:col-span-2 lg:col-span-1\\">\\n\\t\\t\\tSome of my <span class=\\"purple-text\\">work</span>\\n\\t\\t</h2>\\n\\t\\t<WorkShowcaseCard\\n\\t\\t\\tname=\\"Goc's recipe book\\"\\n\\t\\t\\turl=\\"https://recipes.goranalkovic.com\\"\\n\\t\\t\\timageFilename=\\"recipes\\"\\n\\t\\t\\tdesktopTextVerAlignBottom\\n\\t\\t\\textraClass=\\"lg:col-start-2 lg:row-start-1 lg:row-span-2\\"\\n\\t\\t\\tlightColor=\\"#CE0F4C\\"\\n\\t\\t/>\\n\\t\\t<WorkShowcaseCard\\n\\t\\t\\tname=\\"SocialByte\\"\\n\\t\\t\\turl=\\"https://socialbyte.agency\\"\\n\\t\\t\\timageFilename=\\"socialbyte\\"\\n\\t\\t\\tdesktopTextHorAlignEnd\\n\\t\\t\\tdesktopTextVerAlignBottom\\n\\t\\t/>\\n\\t\\t<WorkShowcaseCard\\n\\t\\t\\tname=\\"STEM Games 2019\\"\\n\\t\\t\\turl=\\"#\\"\\n\\t\\t\\timageFilename=\\"stemgames\\"\\n\\t\\t\\tdesktopTextHorAlignEnd\\n\\t\\t\\textraClass=\\"md:row-span-2\\"\\n\\t\\t\\tlightColor=\\"#06354A\\"\\n\\t\\t/>\\n\\t\\t<WorkShowcaseCard\\n\\t\\t\\tname=\\"Browser piano\\"\\n\\t\\t\\turl=\\"https://piano.goranalkovic.com\\"\\n\\t\\t\\timageFilename=\\"piano\\"\\n\\t\\t/>\\n\\t\\t<ArrowButton\\n\\t\\t\\tcontent=\\"See more\\"\\n\\t\\t\\turl=\\"/work\\"\\n\\t\\t\\textraClass=\\"mt-15 sm:mt-30 md:mt-0 sm:col-start-1 lg:col-start-2 sm:!w-full h-full lg:justify-center rounded-md lg:border lg:border-gray-200 lg:hover:border-rich-purple-500 lg:hover:border-opacity-50 lg:dark:border-rich-purple-300 lg:dark:border-opacity-10 lg:dark:hover:border-opacity-50 lg:dark:hover:border-rich-purple-300 !transition\\"\\n\\t\\t/>\\n\\t</div>\\n</section>\\n\\n<section id=\\"contact\\" class=\\"content-padding mb-[20vh]\\">\\n\\t<h2><span class=\\"purple-text\\">Contact</span> & socials</h2>\\n\\n\\t<div\\n\\t\\tclass=\\"flex flex-col gap-30 mt-30 sm:mt-60 md:grid md:grid-cols-2 lg:grid-rows-2 lg:auto-cols-fr lg:grid-flow-col md:gap-x-30 md:gap-y-48 lg:gap-y-60 w-full\\"\\n\\t>\\n\\t\\t<ContactItem\\n\\t\\t\\ttitle=\\"E-mail\\"\\n\\t\\t\\tcontact=\\"contact@goranalkovic.com\\"\\n\\t\\t\\tbuttonCaption=\\"Send an email\\"\\n\\t\\t\\tbuttonUrl=\\"mailto:contact@goranalkovic.com\\"\\n\\t\\t/>\\n\\t\\t<ContactItem\\n\\t\\t\\ttitle=\\"Phone\\"\\n\\t\\t\\tcontactPrefix=\\"+385 \\"\\n\\t\\t\\tcontact=\\"976 480 800\\"\\n\\t\\t\\tbuttonCaption=\\"Open in dialer\\"\\n\\t\\t\\tbuttonUrl=\\"tel:+385976480800\\"\\n\\t\\t/>\\n\\t\\t<ContactItem\\n\\t\\t\\ttitle=\\"GitHub\\"\\n\\t\\t\\tcontactPrefix=\\"github.com/\\"\\n\\t\\t\\tcontact=\\"goranalkovic\\"\\n\\t\\t\\tbuttonCaption=\\"View my repos\\"\\n\\t\\t\\tbuttonUrl=\\"https://github.com/goranalkovic\\"\\n\\t\\t/>\\n\\t\\t<ContactItem\\n\\t\\t\\ttitle=\\"LinkedIn\\"\\n\\t\\t\\tcontactPrefix=\\"linkedin.com/in/\\"\\n\\t\\t\\tcontact=\\"goran-alkovi\u0107-b9569379\\"\\n\\t\\t\\tbuttonCaption=\\"Connect with me\\"\\n\\t\\t\\tbuttonUrl=\\"https://www.linkedin.com/in/goran-alkovi%C4%87-b9569379\\"\\n\\t\\t/>\\n\\t\\t<div class=\\"lg:row-span-2\\">\\n\\t\\t\\t<ContactItem\\n\\t\\t\\t\\ttitle=\\"Unsplash\\"\\n\\t\\t\\t\\tcontactPrefix=\\"unsplash.com/\\"\\n\\t\\t\\t\\tcontact=\\"@goran_alkovic\\"\\n\\t\\t\\t\\tbuttonCaption=\\"Explore my photos\\"\\n\\t\\t\\t\\tbuttonUrl=\\"https://unsplash.com/@goran_alkovic\\"\\n\\t\\t\\t/>\\n\\t\\t\\t<div class=\\"grid grid-cols-3 gap-15 w-full max-w-xs mt-30\\">\\n\\t\\t\\t\\t<img\\n\\t\\t\\t\\t\\tclass=\\"rounded object-cover select-none\\"\\n\\t\\t\\t\\t\\tsrc=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/unsplash-1_g3R9aJ96u.png?updatedAt=1627165984534\\"\\n\\t\\t\\t\\t\\talt=\\"My dog\\"\\n\\t\\t\\t\\t/>\\n\\t\\t\\t\\t<img\\n\\t\\t\\t\\t\\tclass=\\"rounded object-cover select-none\\"\\n\\t\\t\\t\\t\\tsrc=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/unsplash-2_gwmIcs_7yi.png?updatedAt=1627165984655\\"\\n\\t\\t\\t\\t\\talt=\\"Food on a table\\"\\n\\t\\t\\t\\t/>\\n\\t\\t\\t\\t<img\\n\\t\\t\\t\\t\\tclass=\\"rounded object-cover select-none\\"\\n\\t\\t\\t\\t\\tsrc=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/unsplash-3_va-tBjnDmh.png?updatedAt=1627165984865\\"\\n\\t\\t\\t\\t\\talt=\\"Sunset at the Vara\u017Edin student dorm\\"\\n\\t\\t\\t\\t/>\\n\\t\\t\\t</div>\\n\\t\\t</div>\\n\\t</div>\\n</section>\\n\\n<style lang=\\"postcss\\">section{padding-bottom:3.75rem;padding-top:7.5rem}@media (min-width:768px){section{padding-bottom:3.75rem;padding-top:11.25rem}}#about p{font-size:.875rem;line-height:1.5;transition-duration:.15s;transition-property:background-color,border-color,color,fill,stroke;transition-timing-function:cubic-bezier(.4,0,.2,1)}@media (min-width:768px){#about p{font-size:1.125rem;line-height:1.5}}</style>\\n"],"names":[],"mappings":"AA6KsB,mCAAO,CAAC,eAAe,OAAO,CAAC,YAAY,MAAM,CAAC,MAAM,AAAC,WAAW,KAAK,CAAC,CAAC,mCAAO,CAAC,eAAe,OAAO,CAAC,YAAY,QAAQ,CAAC,CAAC,oBAAM,CAAC,eAAC,CAAC,UAAU,OAAO,CAAC,YAAY,GAAG,CAAC,oBAAoB,IAAI,CAAC,oBAAoB,gBAAgB,CAAC,YAAY,CAAC,KAAK,CAAC,IAAI,CAAC,MAAM,CAAC,2BAA2B,aAAa,EAAE,CAAC,CAAC,CAAC,EAAE,CAAC,CAAC,CAAC,CAAC,MAAM,AAAC,WAAW,KAAK,CAAC,CAAC,oBAAM,CAAC,eAAC,CAAC,UAAU,QAAQ,CAAC,YAAY,GAAG,CAAC,CAAC"}`
};
var Routes = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$1);
  return `${$$result.head += `${$$result.title = `<title>Goran Alkovi\u0107 | Developer &amp; designer</title>`, ""}<meta name="${"description"}" content="${"Goran Alkovi\u0107 - a frontend developer that also likes to design."}" data-svelte="svelte-vtqpfi">`, ""}

<section id="${"intro"}" class="${"content-padding h-[90vh] !py-0 flex flex-col justify-center svelte-ye5pxv"}"><h1 class="${"max-w-[68rem]"}"><span class="${"block text-transparent text-stroke-1 text-stroke-black dark:text-stroke-white"}">Hi! I&#39;m Goran.
		</span>
		<span class="${"block"}">A <span class="${"purple-text"}">frontend developer</span> that also likes to design.
		</span></h1>

	${validate_component(ArrowButton, "ArrowButton").$$render($$result, {
    content: "Learn more about me",
    url: "#about",
    arrowDirection: ArrowDirections.DOWN,
    extraClass: "mt-30 md:mt-60"
  }, {}, {})}</section>

<section class="${"content-padding lg:flex lg:flex-row-reverse md:col-start-2 md:col-span-2 svelte-ye5pxv"}" id="${"about"}">${validate_component(AboutImage, "AboutImage").$$render($$result, {}, {}, {})}
	<div class="${"flex flex-col gap-15 max-w-lg lg:max-w-420 md:mr-px mt-30 sm:mt-60 lg:mt-0 lg:mr-30"}"><h2><span class="${"purple-text"}">About</span> me</h2>
		<p class="${"svelte-ye5pxv"}">I\u2019m a frontend developer who also likes to design. My philosophy is that everything should be
			visually pleasing and easy to use, besides just doing its job.
		</p>
		<p class="${"svelte-ye5pxv"}">Throughout the years I tried a lot of technologies and fields in development, but what won at
			the end was web development (mostly frontend).
		</p>
		<p class="${"svelte-ye5pxv"}">Design-wise I\u2019ve done some print design, but mostly I\u2019ve worked on digital design and UI/UX
			for my personal projects.
		</p>
		<p class="${"svelte-ye5pxv"}">Currently working at <a class="${"underline "}" href="${"https://infinum.com"}">Infinum</a> as a WordPress
			engineer, where I create custom Gutenberg block themes and work on the open-source Eightshift boilerplate.
		</p>
		<p class="${"svelte-ye5pxv"}">In my free time I love to drink coffee, explore what\u2019s new in tech, make crazy projects and
			game a bit here and there.
		</p>
		${validate_component(ArrowButton, "ArrowButton").$$render($$result, {
    content: "Read my CV",
    url: "/about",
    extraClass: "mt-15 md:mt-30"
  }, {}, {})}
		${validate_component(ArrowButton, "ArrowButton").$$render($$result, {
    content: "Explore my work",
    url: "#work",
    extraClass: "mt-15",
    arrowDirection: ArrowDirections.DOWN
  }, {}, {})}</div></section>

<section class="${"content-padding svelte-ye5pxv"}" id="${"work"}"><div class="${"sm:grid sm:grid-cols-2 sm:gap-15 md:gap-30 lg:grid-rows-[min,1fr,1fr,6rem]"}"><h2 class="${"mb-30 sm:mb-15 md:mb-0 sm:col-span-2 lg:col-span-1"}">Some of my <span class="${"purple-text"}">work</span></h2>
		${validate_component(WorkShowcaseCard, "WorkShowcaseCard").$$render($$result, {
    name: "Goc's recipe book",
    url: "https://recipes.goranalkovic.com",
    imageFilename: "recipes",
    desktopTextVerAlignBottom: true,
    extraClass: "lg:col-start-2 lg:row-start-1 lg:row-span-2",
    lightColor: "#CE0F4C"
  }, {}, {})}
		${validate_component(WorkShowcaseCard, "WorkShowcaseCard").$$render($$result, {
    name: "SocialByte",
    url: "https://socialbyte.agency",
    imageFilename: "socialbyte",
    desktopTextHorAlignEnd: true,
    desktopTextVerAlignBottom: true
  }, {}, {})}
		${validate_component(WorkShowcaseCard, "WorkShowcaseCard").$$render($$result, {
    name: "STEM Games 2019",
    url: "#",
    imageFilename: "stemgames",
    desktopTextHorAlignEnd: true,
    extraClass: "md:row-span-2",
    lightColor: "#06354A"
  }, {}, {})}
		${validate_component(WorkShowcaseCard, "WorkShowcaseCard").$$render($$result, {
    name: "Browser piano",
    url: "https://piano.goranalkovic.com",
    imageFilename: "piano"
  }, {}, {})}
		${validate_component(ArrowButton, "ArrowButton").$$render($$result, {
    content: "See more",
    url: "/work",
    extraClass: "mt-15 sm:mt-30 md:mt-0 sm:col-start-1 lg:col-start-2 sm:!w-full h-full lg:justify-center rounded-md lg:border lg:border-gray-200 lg:hover:border-rich-purple-500 lg:hover:border-opacity-50 lg:dark:border-rich-purple-300 lg:dark:border-opacity-10 lg:dark:hover:border-opacity-50 lg:dark:hover:border-rich-purple-300 !transition"
  }, {}, {})}</div></section>

<section id="${"contact"}" class="${"content-padding mb-[20vh] svelte-ye5pxv"}"><h2><span class="${"purple-text"}">Contact</span> &amp; socials</h2>

	<div class="${"flex flex-col gap-30 mt-30 sm:mt-60 md:grid md:grid-cols-2 lg:grid-rows-2 lg:auto-cols-fr lg:grid-flow-col md:gap-x-30 md:gap-y-48 lg:gap-y-60 w-full"}">${validate_component(ContactItem, "ContactItem").$$render($$result, {
    title: "E-mail",
    contact: "contact@goranalkovic.com",
    buttonCaption: "Send an email",
    buttonUrl: "mailto:contact@goranalkovic.com"
  }, {}, {})}
		${validate_component(ContactItem, "ContactItem").$$render($$result, {
    title: "Phone",
    contactPrefix: "+385 ",
    contact: "976 480 800",
    buttonCaption: "Open in dialer",
    buttonUrl: "tel:+385976480800"
  }, {}, {})}
		${validate_component(ContactItem, "ContactItem").$$render($$result, {
    title: "GitHub",
    contactPrefix: "github.com/",
    contact: "goranalkovic",
    buttonCaption: "View my repos",
    buttonUrl: "https://github.com/goranalkovic"
  }, {}, {})}
		${validate_component(ContactItem, "ContactItem").$$render($$result, {
    title: "LinkedIn",
    contactPrefix: "linkedin.com/in/",
    contact: "goran-alkovi\u0107-b9569379",
    buttonCaption: "Connect with me",
    buttonUrl: "https://www.linkedin.com/in/goran-alkovi%C4%87-b9569379"
  }, {}, {})}
		<div class="${"lg:row-span-2"}">${validate_component(ContactItem, "ContactItem").$$render($$result, {
    title: "Unsplash",
    contactPrefix: "unsplash.com/",
    contact: "@goran_alkovic",
    buttonCaption: "Explore my photos",
    buttonUrl: "https://unsplash.com/@goran_alkovic"
  }, {}, {})}
			<div class="${"grid grid-cols-3 gap-15 w-full max-w-xs mt-30"}"><img class="${"rounded object-cover select-none"}" src="${"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/unsplash-1_g3R9aJ96u.png?updatedAt=1627165984534"}" alt="${"My dog"}">
				<img class="${"rounded object-cover select-none"}" src="${"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/unsplash-2_gwmIcs_7yi.png?updatedAt=1627165984655"}" alt="${"Food on a table"}">
				<img class="${"rounded object-cover select-none"}" src="${"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/unsplash-3_va-tBjnDmh.png?updatedAt=1627165984865"}" alt="${"Sunset at the Vara\u017Edin student dorm"}"></div></div></div>
</section>`;
});
var index$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Routes
});
var ProjectSummary = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { title } = $$props;
  let { subtitle } = $$props;
  let { timeframe } = $$props;
  let { button1Props } = $$props;
  let { button2Props } = $$props;
  let { extraClass = "" } = $$props;
  if ($$props.title === void 0 && $$bindings.title && title !== void 0)
    $$bindings.title(title);
  if ($$props.subtitle === void 0 && $$bindings.subtitle && subtitle !== void 0)
    $$bindings.subtitle(subtitle);
  if ($$props.timeframe === void 0 && $$bindings.timeframe && timeframe !== void 0)
    $$bindings.timeframe(timeframe);
  if ($$props.button1Props === void 0 && $$bindings.button1Props && button1Props !== void 0)
    $$bindings.button1Props(button1Props);
  if ($$props.button2Props === void 0 && $$bindings.button2Props && button2Props !== void 0)
    $$bindings.button2Props(button2Props);
  if ($$props.extraClass === void 0 && $$bindings.extraClass && extraClass !== void 0)
    $$bindings.extraClass(extraClass);
  return `<div${add_attribute("class", extraClass, 0)}>${title ? `<h3 class="${"text-40 mb-30"}"><!-- HTML_TAG_START -->${title}<!-- HTML_TAG_END --></h3>
		<div class="${"w-160 h-px bg-rich-purple-500 dark:bg-rich-purple-300 mb-15"}"></div>` : `<div class="${"w-160 h-px bg-rich-purple-500 dark:bg-rich-purple-300 mb-15"}"></div>`}

	<div class="${"flex flex-col gap-15 uppercase text-14w mb-30"}"><h4 class="${"font-bold"}"><!-- HTML_TAG_START -->${subtitle}<!-- HTML_TAG_END --></h4>
		<span class="${"opacity-40 hidden"}">\u2014</span>
		<span class="${"opacity-80 text-12"}"><!-- HTML_TAG_START -->${timeframe}<!-- HTML_TAG_END --></span></div>

	<p class="${"max-w-md flex flex-col gap-15 text-18 leading-relaxed"}">${slots.default ? slots.default({}) : ``}</p>

	${button1Props || button2Props ? `<div class="${"flex gap-30 mt-30"}">${button1Props ? `${validate_component(ArrowButton, "ArrowButton").$$render($$result, Object.assign(button1Props), {}, {})}` : ``}
			${button2Props ? `${validate_component(ArrowButton, "ArrowButton").$$render($$result, Object.assign(button2Props), {}, {})}` : ``}</div>` : ``}</div>`;
});
var css = {
  code: "section.svelte-1r10vf8.svelte-1r10vf8{display:flex;flex-direction:column;gap:3.75rem;margin-bottom:7.5rem;scroll-margin-block-start:3rem}@media(min-width:768px){section.svelte-1r10vf8.svelte-1r10vf8{scroll-margin-block-start:10rem}}section.svelte-1r10vf8 h2.svelte-1r10vf8{--tw-text-opacity:1;color:rgba(50,46,255,var(--tw-text-opacity));margin-bottom:-.9375rem}.dark section.svelte-1r10vf8 h2.svelte-1r10vf8{--tw-text-opacity:1;color:rgba(114,112,255,var(--tw-text-opacity))}",
  map: `{"version":3,"file":"index.svelte","sources":["index.svelte"],"sourcesContent":["<script>\\r\\n\\timport ArrowButton, { ArrowDirections } from '$lib/ArrowButton.svelte';\\r\\nimport ProjectSummary from '$lib/ProjectSummary.svelte';\\r\\n<\/script>\\r\\n\\r\\n<svelte:head>\\r\\n\\t<title>Goran Alkovi\u0107 | Work</title>\\r\\n\\t<meta\\r\\n\\t\\tname=\\"description\\"\\r\\n\\t\\tcontent=\\"Goran Alkovi\u0107 - a frontend developer that also likes to design.\\"\\r\\n\\t/>\\r\\n</svelte:head>\\r\\n\\r\\n<section class=\\"my-180\\">\\r\\n\\t<h1>Work</h1>\\r\\n\\t<div class=\\"flex gap-30\\">\\r\\n\\t\\t<ArrowButton content='Current' url='#current' arrowDirection={ArrowDirections.DOWN} />\\r\\n\\t\\t<ArrowButton content='Personal projects' url='#personal-projects' arrowDirection={ArrowDirections.DOWN} />\\r\\n\\t</div>\\r\\n</section>\\r\\n\\r\\n<section id=\\"current\\">\\r\\n\\t<h2 class=\\"purple-text\\">Current</h2>\\r\\n\\t<ProjectSummary title=\\"WordPress engineer\\" subtitle=\\"Infinum\\" timeframe=\\"from January 2021\\">\\r\\n\\t\\tI create custom WordPress block-based themes using Eightshift boilerplate. Main techologies used\\r\\n\\t\\tare React, PHP, HTML/CSS/JavaScript.\\r\\n\\t</ProjectSummary>\\r\\n</section>\\r\\n\\r\\n<section id=\\"student-jobs\\">\\r\\n\\t<h2>Student jobs</h2>\\r\\n\\t<ProjectSummary title=\\"Digital designer\\" subtitle=\\"Arbona\\" timeframe=\\"July 2020 - November 2020\\">\\r\\n\\t\\tI designed online advertising materials, made dynamic Google Display ads and put together\\r\\n\\t\\tgreat-looking newsletters and Viber marketing campaigns.\\r\\n\\t</ProjectSummary>\\r\\n</section>\\r\\n\\r\\n<section id=\\"internships\\">\\r\\n\\t<h2>Internships</h2>\\r\\n\\t<ProjectSummary title=\\"Summer internship\\" subtitle=\\"Ekobit\\" timeframe=\\"June 2019 - August 2019\\">\\r\\n\\t\\tI was a part of a team that worked on a company's project, used C# and SQL, learned a lot about\\r\\n\\t\\toptimizing SQL queries.\\r\\n\\t</ProjectSummary>\\r\\n</section>\\r\\n\\r\\n<section id=\\"freelancing\\">\\r\\n\\t<h2>Freelancing</h2>\\r\\n\\t<ProjectSummary\\r\\n\\t\\ttitle=\\"Branding and a WordPress website\\"\\r\\n\\t\\tsubtitle=\\"SocialByte\\"\\r\\n\\t\\ttimeframe=\\"2020, 2021\\"\\r\\n\\t\\tbutton1Props={{\\r\\n\\t\\t\\tcontent: 'Visit',\\r\\n\\t\\t\\turl: 'https://socialbyte.agency',\\r\\n\\t\\t\\texternal: true,\\r\\n\\t\\t\\tnewTab: true\\r\\n\\t\\t}}\\r\\n\\t>\\r\\n\\t\\tI designed a logo system for the agency, then set up a WordPress website, customized it, added\\r\\n\\t\\tcustom content and did some basic SEO.\\r\\n\\t</ProjectSummary>\\r\\n\\t<ProjectSummary title=\\"Promo materials\\" subtitle=\\"Temple Bar\\" timeframe=\\"March 2016 -\\">\\r\\n\\t\\t<span>I design promotional material for Facebook and Instagram ads for <i>Temple Bar</i> in Stubi\u010Dke toplice.</span>\\r\\n\\t\\t<span>Previously Adobe Photoshop and Xd were used, now mostly working in Figma.</span>\\r\\n\\t</ProjectSummary>\\r\\n\\t<ProjectSummary\\r\\n\\t\\ttitle=\\"Branding and bottle label design\\"\\r\\n\\t\\tsubtitle=\\"Aronija Juraj\\"\\r\\n\\t\\ttimeframe=\\"December 2018\\"\\r\\n\\t>\\r\\n\\t\\t<span>I designed a logo, a simple brand system and bottle labels for <i>Aronija Juraj</i>.</span>\\r\\n\\t</ProjectSummary>\\r\\n</section>\\r\\n\\r\\n<section id=\\"during-my-studies\\">\\r\\n\\t<h2>During my studies</h2>\\r\\n\\t<ProjectSummary title=\\"Lead designer\\" subtitle=\\"STEM Games\\" timeframe=\\"December 2018 - May 2019\\">\\r\\n\\t\\tI was the lead of a small design team; also worked on promotional materials, the event map,\\r\\n\\t\\tbanners, accreditations, ...\\r\\n\\t</ProjectSummary>\\r\\n\\t<ProjectSummary\\r\\n\\t\\ttitle=\\"Print design, lead designer\\"\\r\\n\\t\\tsubtitle=\\"ST@K\\"\\r\\n\\t\\ttimeframe=\\"January 2016 - September 2020\\"\\r\\n\\t>\\r\\n\\t\\t\\r\\n\\t<span>I was a part of the faculty magazine <i>St@k</i>. Started as a desginer, later lead the design\\r\\n\\t\\tteam for a while (and still designed).</span>\\r\\n\\t<span>Working in and leading a team helped me improve my\\r\\n\\t\\tteamwork and leadership skills.</span>\\r\\n\\t\\t<span>Magazine design was done in Adobe InDesign, together with Adobe Photoshop and Adobe Illustrator for\\r\\n\\t\\tsupporting materials. Adobe Xd was used for some promotional materials.</span>\\r\\n\\t</ProjectSummary>\\r\\n\\t<div class=\\"flex flex-col gap-30\\">\\r\\n\\t\\t<ProjectSummary\\r\\n\\t\\t\\ttitle=\\"Student council\\"\\r\\n\\t\\t\\tsubtitle=\\"Faculty of organization and informatics\\"\\r\\n\\t\\t\\ttimeframe=\\"March 2018 - September 2019\\"\\r\\n\\t\\t>\\r\\n\\t\\t\\tI was a part of the Faculty of organization and informatics' Student council, where I worked\\r\\n\\t\\t\\ton various projects.\\r\\n\\t\\t</ProjectSummary>\\r\\n\\t\\t<ProjectSummary subtitle=\\"FOI Career week\\" timeframe=\\"2016, 2017\\">\\r\\n\\t\\t\\tI was a part of the Organization team, supporting all the event activities.\\r\\n\\t\\t</ProjectSummary>\\r\\n\\t\\t<ProjectSummary subtitle=\\"Mladi poma\u017Eu\\" timeframe=\\"December 2018\\">\\r\\n\\t\\t\\tI created a logo and promotional materials for the student humanitarian action Mladi poma\u017Eu.\\r\\n\\t\\t</ProjectSummary>\\r\\n\\t\\t<ProjectSummary subtitle=\\"Bruco\u0161ijada grada Vara\u017Edina 2018\\" timeframe=\\"October 2018\\">\\r\\n\\t\\t\\t<span>I designed a logo, all the promotional materials and accrediations for the annual student\\r\\n\\t\\t\\t\\twelcoming party - <i>Bruco\u0161ijada</i>.</span>\\r\\n\\t\\t</ProjectSummary>\\r\\n\\t\\t<ProjectSummary\\r\\n\\t\\t\\tsubtitle=\\"Faculty of organization and informatics\\"\\r\\n\\t\\t\\ttimeframe=\\"April 2018, April 2019\\"\\r\\n\\t\\t>\\r\\n\\t\\t\\tI created promotional materials, t-shirt and banner designs for the Faculty of organization\\r\\n\\t\\t\\tand informatics at STEM Games 2018 & 2019.\\r\\n\\t\\t</ProjectSummary>\\r\\n\\t</div>\\r\\n</section>\\r\\n\\r\\n<section id=\\"personal-projects\\">\\r\\n\\t<h2 class=\\"purple-text\\">Personal projects</h2>\\r\\n\\t<ProjectSummary\\r\\n\\t\\ttitle=\\"Browser piano\\"\\r\\n\\t\\tsubtitle=\\"Svelte, TailwindCSS\\"\\r\\n\\t\\ttimeframe=\\"2020, 2021\\"\\r\\n\\t\\tbutton1Props={{\\r\\n\\t\\t\\tcontent: 'Check it out',\\r\\n\\t\\t\\turl: 'https://piano.goranalkovic.com',\\r\\n\\t\\t\\texternal: true,\\r\\n\\t\\t\\tnewTab: true\\r\\n\\t\\t}}\\r\\n\\t\\tbutton2Props={{\\r\\n\\t\\t\\tcontent: 'GitHub repo',\\r\\n\\t\\t\\turl: 'https://github.com/goranalkovic/SimplePiano',\\r\\n\\t\\t\\texternal: true,\\r\\n\\t\\t\\tnewTab: true\\r\\n\\t\\t}}\\r\\n\\t>\\r\\n\\t\\tA Svelte-based PWA that uses SoundFontPlayer to allow playing various combinations of\\r\\n\\t\\tinstruments. Also, more advanced functionalities like one-button chords are available!\\r\\n\\t</ProjectSummary>\\r\\n\\t<ProjectSummary\\r\\n\\t\\ttitle=\\"SVG2WP\\"\\r\\n\\t\\tsubtitle=\\"Svelte\\"\\r\\n\\t\\ttimeframe=\\"2021\\"\\r\\n\\t\\tbutton1Props={{\\r\\n\\t\\t\\tcontent: 'Check it out',\\r\\n\\t\\t\\turl: 'https://svg2wp.goranalkovic.com',\\r\\n\\t\\t\\texternal: true,\\r\\n\\t\\t\\tnewTab: true\\r\\n\\t\\t}}\\r\\n\\t\\tbutton2Props={{\\r\\n\\t\\t\\tcontent: 'GitHub repo',\\r\\n\\t\\t\\turl: 'https://github.com/goranalkovic/svg-to-wp',\\r\\n\\t\\t\\texternal: true,\\r\\n\\t\\t\\tnewTab: true\\r\\n\\t\\t}}\\r\\n\\t>\\r\\n\\t\\tA simple tool that can optimize and prepare your SVGs for use in Gutenberg or the site itself.\\r\\n\\t</ProjectSummary>\\r\\n\\t<ProjectSummary\\r\\n\\t\\ttitle=\\"Goc\u2019s recipe book\\"\\r\\n\\t\\tsubtitle=\\"Svelte(Kit), TailwindCSS\\"\\r\\n\\t\\ttimeframe=\\"2021\\"\\r\\n\\t\\tbutton1Props={{\\r\\n\\t\\t\\tcontent: 'Check it out',\\r\\n\\t\\t\\turl: 'https://svg-2-wp.goranalkovic.com',\\r\\n\\t\\t\\texternal: true,\\r\\n\\t\\t\\tnewTab: true\\r\\n\\t\\t}}\\r\\n\\t\\tbutton2Props={{\\r\\n\\t\\t\\tcontent: 'GitHub repo',\\r\\n\\t\\t\\turl: 'https://github.com/goranalkovic/svg-to-wp',\\r\\n\\t\\t\\texternal: true,\\r\\n\\t\\t\\tnewTab: true\\r\\n\\t\\t}}\\r\\n\\t>\\r\\n\\t\\tWebsite made to streamline preparing all the ingredients and make the preparation of various\\r\\n\\t\\trecipes easier by making everything simple, clean and effortless.\\r\\n\\t</ProjectSummary>\\r\\n\\t<ProjectSummary\\r\\n\\t\\ttitle=\\"COVID-19 HR\\"\\r\\n\\t\\tsubtitle=\\"Flutter\\"\\r\\n\\t\\ttimeframe=\\"2020\\"\\r\\n\\t\\tbutton2Props={{\\r\\n\\t\\t\\tcontent: 'GitHub repo',\\r\\n\\t\\t\\turl: 'https://github.com/goranalkovic/covid19hr-flutter',\\r\\n\\t\\t\\texternal: true,\\r\\n\\t\\t\\tnewTab: true\\r\\n\\t\\t}}\\r\\n\\t>\\r\\n\\t\\tA simple Flutter app to track COVID-19 cases in Croatia, made when the official one was very\\r\\n\\t\\tunpleasant to the eye.\\r\\n\\t</ProjectSummary>\\r\\n</section>\\r\\n\\r\\n<style lang=\\"postcss\\">section{display:flex;flex-direction:column;gap:3.75rem;margin-bottom:7.5rem;scroll-margin-block-start:3rem}@media (min-width:768px){section{scroll-margin-block-start:10rem}}section h2{--tw-text-opacity:1;color:rgba(50,46,255,var(--tw-text-opacity));margin-bottom:-.9375rem}.dark section h2{--tw-text-opacity:1;color:rgba(114,112,255,var(--tw-text-opacity))}</style>\\r\\n"],"names":[],"mappings":"AAuMsB,qCAAO,CAAC,QAAQ,IAAI,CAAC,eAAe,MAAM,CAAC,IAAI,OAAO,CAAC,cAAc,MAAM,CAAC,0BAA0B,IAAI,CAAC,MAAM,AAAC,WAAW,KAAK,CAAC,CAAC,qCAAO,CAAC,0BAA0B,KAAK,CAAC,CAAC,sBAAO,CAAC,iBAAE,CAAC,kBAAkB,CAAC,CAAC,MAAM,KAAK,EAAE,CAAC,EAAE,CAAC,GAAG,CAAC,IAAI,iBAAiB,CAAC,CAAC,CAAC,cAAc,SAAS,CAAC,KAAK,CAAC,sBAAO,CAAC,iBAAE,CAAC,kBAAkB,CAAC,CAAC,MAAM,KAAK,GAAG,CAAC,GAAG,CAAC,GAAG,CAAC,IAAI,iBAAiB,CAAC,CAAC,CAAC"}`
};
var Work = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css);
  return `${$$result.head += `${$$result.title = `<title>Goran Alkovi\u0107 | Work</title>`, ""}<meta name="${"description"}" content="${"Goran Alkovi\u0107 - a frontend developer that also likes to design."}" data-svelte="svelte-1ox6oqa">`, ""}

<section class="${"my-180 svelte-1r10vf8"}"><h1>Work</h1>
	<div class="${"flex gap-30"}">${validate_component(ArrowButton, "ArrowButton").$$render($$result, {
    content: "Current",
    url: "#current",
    arrowDirection: ArrowDirections.DOWN
  }, {}, {})}
		${validate_component(ArrowButton, "ArrowButton").$$render($$result, {
    content: "Personal projects",
    url: "#personal-projects",
    arrowDirection: ArrowDirections.DOWN
  }, {}, {})}</div></section>

<section id="${"current"}" class="${"svelte-1r10vf8"}"><h2 class="${"purple-text svelte-1r10vf8"}">Current</h2>
	${validate_component(ProjectSummary, "ProjectSummary").$$render($$result, {
    title: "WordPress engineer",
    subtitle: "Infinum",
    timeframe: "from January 2021"
  }, {}, {
    default: () => `I create custom WordPress block-based themes using Eightshift boilerplate. Main techologies used
		are React, PHP, HTML/CSS/JavaScript.
	`
  })}</section>

<section id="${"student-jobs"}" class="${"svelte-1r10vf8"}"><h2 class="${"svelte-1r10vf8"}">Student jobs</h2>
	${validate_component(ProjectSummary, "ProjectSummary").$$render($$result, {
    title: "Digital designer",
    subtitle: "Arbona",
    timeframe: "July 2020 - November 2020"
  }, {}, {
    default: () => `I designed online advertising materials, made dynamic Google Display ads and put together
		great-looking newsletters and Viber marketing campaigns.
	`
  })}</section>

<section id="${"internships"}" class="${"svelte-1r10vf8"}"><h2 class="${"svelte-1r10vf8"}">Internships</h2>
	${validate_component(ProjectSummary, "ProjectSummary").$$render($$result, {
    title: "Summer internship",
    subtitle: "Ekobit",
    timeframe: "June 2019 - August 2019"
  }, {}, {
    default: () => `I was a part of a team that worked on a company&#39;s project, used C# and SQL, learned a lot about
		optimizing SQL queries.
	`
  })}</section>

<section id="${"freelancing"}" class="${"svelte-1r10vf8"}"><h2 class="${"svelte-1r10vf8"}">Freelancing</h2>
	${validate_component(ProjectSummary, "ProjectSummary").$$render($$result, {
    title: "Branding and a WordPress website",
    subtitle: "SocialByte",
    timeframe: "2020, 2021",
    button1Props: {
      content: "Visit",
      url: "https://socialbyte.agency",
      external: true,
      newTab: true
    }
  }, {}, {
    default: () => `I designed a logo system for the agency, then set up a WordPress website, customized it, added
		custom content and did some basic SEO.
	`
  })}
	${validate_component(ProjectSummary, "ProjectSummary").$$render($$result, {
    title: "Promo materials",
    subtitle: "Temple Bar",
    timeframe: "March 2016 -"
  }, {}, {
    default: () => `<span>I design promotional material for Facebook and Instagram ads for <i>Temple Bar</i> in Stubi\u010Dke toplice.</span>
		<span>Previously Adobe Photoshop and Xd were used, now mostly working in Figma.</span>`
  })}
	${validate_component(ProjectSummary, "ProjectSummary").$$render($$result, {
    title: "Branding and bottle label design",
    subtitle: "Aronija Juraj",
    timeframe: "December 2018"
  }, {}, {
    default: () => `<span>I designed a logo, a simple brand system and bottle labels for <i>Aronija Juraj</i>.</span>`
  })}</section>

<section id="${"during-my-studies"}" class="${"svelte-1r10vf8"}"><h2 class="${"svelte-1r10vf8"}">During my studies</h2>
	${validate_component(ProjectSummary, "ProjectSummary").$$render($$result, {
    title: "Lead designer",
    subtitle: "STEM Games",
    timeframe: "December 2018 - May 2019"
  }, {}, {
    default: () => `I was the lead of a small design team; also worked on promotional materials, the event map,
		banners, accreditations, ...
	`
  })}
	${validate_component(ProjectSummary, "ProjectSummary").$$render($$result, {
    title: "Print design, lead designer",
    subtitle: "ST@K",
    timeframe: "January 2016 - September 2020"
  }, {}, {
    default: () => `<span>I was a part of the faculty magazine <i>St@k</i>. Started as a desginer, later lead the design
		team for a while (and still designed).</span>
	<span>Working in and leading a team helped me improve my
		teamwork and leadership skills.</span>
		<span>Magazine design was done in Adobe InDesign, together with Adobe Photoshop and Adobe Illustrator for
		supporting materials. Adobe Xd was used for some promotional materials.</span>`
  })}
	<div class="${"flex flex-col gap-30"}">${validate_component(ProjectSummary, "ProjectSummary").$$render($$result, {
    title: "Student council",
    subtitle: "Faculty of organization and informatics",
    timeframe: "March 2018 - September 2019"
  }, {}, {
    default: () => `I was a part of the Faculty of organization and informatics&#39; Student council, where I worked
			on various projects.
		`
  })}
		${validate_component(ProjectSummary, "ProjectSummary").$$render($$result, {
    subtitle: "FOI Career week",
    timeframe: "2016, 2017"
  }, {}, {
    default: () => `I was a part of the Organization team, supporting all the event activities.
		`
  })}
		${validate_component(ProjectSummary, "ProjectSummary").$$render($$result, {
    subtitle: "Mladi poma\u017Eu",
    timeframe: "December 2018"
  }, {}, {
    default: () => `I created a logo and promotional materials for the student humanitarian action Mladi poma\u017Eu.
		`
  })}
		${validate_component(ProjectSummary, "ProjectSummary").$$render($$result, {
    subtitle: "Bruco\u0161ijada grada Vara\u017Edina 2018",
    timeframe: "October 2018"
  }, {}, {
    default: () => `<span>I designed a logo, all the promotional materials and accrediations for the annual student
				welcoming party - <i>Bruco\u0161ijada</i>.</span>`
  })}
		${validate_component(ProjectSummary, "ProjectSummary").$$render($$result, {
    subtitle: "Faculty of organization and informatics",
    timeframe: "April 2018, April 2019"
  }, {}, {
    default: () => `I created promotional materials, t-shirt and banner designs for the Faculty of organization
			and informatics at STEM Games 2018 &amp; 2019.
		`
  })}</div></section>

<section id="${"personal-projects"}" class="${"svelte-1r10vf8"}"><h2 class="${"purple-text svelte-1r10vf8"}">Personal projects</h2>
	${validate_component(ProjectSummary, "ProjectSummary").$$render($$result, {
    title: "Browser piano",
    subtitle: "Svelte, TailwindCSS",
    timeframe: "2020, 2021",
    button1Props: {
      content: "Check it out",
      url: "https://piano.goranalkovic.com",
      external: true,
      newTab: true
    },
    button2Props: {
      content: "GitHub repo",
      url: "https://github.com/goranalkovic/SimplePiano",
      external: true,
      newTab: true
    }
  }, {}, {
    default: () => `A Svelte-based PWA that uses SoundFontPlayer to allow playing various combinations of
		instruments. Also, more advanced functionalities like one-button chords are available!
	`
  })}
	${validate_component(ProjectSummary, "ProjectSummary").$$render($$result, {
    title: "SVG2WP",
    subtitle: "Svelte",
    timeframe: "2021",
    button1Props: {
      content: "Check it out",
      url: "https://svg2wp.goranalkovic.com",
      external: true,
      newTab: true
    },
    button2Props: {
      content: "GitHub repo",
      url: "https://github.com/goranalkovic/svg-to-wp",
      external: true,
      newTab: true
    }
  }, {}, {
    default: () => `A simple tool that can optimize and prepare your SVGs for use in Gutenberg or the site itself.
	`
  })}
	${validate_component(ProjectSummary, "ProjectSummary").$$render($$result, {
    title: "Goc\u2019s recipe book",
    subtitle: "Svelte(Kit), TailwindCSS",
    timeframe: "2021",
    button1Props: {
      content: "Check it out",
      url: "https://svg-2-wp.goranalkovic.com",
      external: true,
      newTab: true
    },
    button2Props: {
      content: "GitHub repo",
      url: "https://github.com/goranalkovic/svg-to-wp",
      external: true,
      newTab: true
    }
  }, {}, {
    default: () => `Website made to streamline preparing all the ingredients and make the preparation of various
		recipes easier by making everything simple, clean and effortless.
	`
  })}
	${validate_component(ProjectSummary, "ProjectSummary").$$render($$result, {
    title: "COVID-19 HR",
    subtitle: "Flutter",
    timeframe: "2020",
    button2Props: {
      content: "GitHub repo",
      url: "https://github.com/goranalkovic/covid19hr-flutter",
      external: true,
      newTab: true
    }
  }, {}, {
    default: () => `A simple Flutter app to track COVID-19 cases in Croatia, made when the official one was very
		unpleasant to the eye.
	`
  })}
</section>`;
});
var index = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Work
});

// .svelte-kit/netlify/entry.js
init();
async function handler(event) {
  const { path, httpMethod, headers, rawQuery, body, isBase64Encoded } = event;
  const query = new URLSearchParams(rawQuery);
  const type = headers["content-type"];
  const rawBody = type && isContentTypeTextual(type) ? isBase64Encoded ? Buffer.from(body, "base64").toString() : body : new TextEncoder("base64").encode(body);
  const rendered = await render({
    method: httpMethod,
    headers,
    path,
    query,
    rawBody
  });
  if (rendered) {
    return {
      isBase64Encoded: false,
      statusCode: rendered.status,
      ...splitHeaders(rendered.headers),
      body: rendered.body
    };
  }
  return {
    statusCode: 404,
    body: "Not found"
  };
}
function splitHeaders(headers) {
  const h = {};
  const m = {};
  for (const key in headers) {
    const value = headers[key];
    const target = Array.isArray(value) ? m : h;
    target[key] = value;
  }
  return {
    headers: h,
    multiValueHeaders: m
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
/*!
 * cookie
 * Copyright(c) 2012-2014 Roman Shtylman
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */
