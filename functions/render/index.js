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
var css$5 = {
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
  $$result.css.add(css$5);
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
var template = ({ head, body }) => '<!DOCTYPE html>\n<html lang="en">\n\n<head>\n    <meta charset="utf-8" />\n    <link rel="icon" href="/favicon.png" />\n    <meta name="viewport" content="width=device-width, initial-scale=1" /> ' + head + '\n</head>\n\n<body>\n    <div id="svelte">' + body + "</div>\n</body>\n\n</html>";
var options = null;
var default_settings = { paths: { "base": "", "assets": "/." } };
function init(settings = default_settings) {
  set_paths(settings.paths);
  set_prerendering(settings.prerendering || false);
  options = {
    amp: false,
    dev: false,
    entry: {
      file: "/./_app/start-2d94c3ba.js",
      css: ["/./_app/assets/start-0826e215.css"],
      js: ["/./_app/start-2d94c3ba.js", "/./_app/chunks/vendor-05a29c9f.js"]
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
  assets: [{ "file": "favicon.png", "size": 1571, "type": "image/png" }, { "file": "robots.txt", "size": 67, "type": "text/plain" }, { "file": "svelte-welcome.png", "size": 360807, "type": "image/png" }, { "file": "svelte-welcome.webp", "size": 115470, "type": "image/webp" }],
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
      pattern: /^\/about\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/about.svelte"],
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
    return index;
  }),
  "src/routes/about.svelte": () => Promise.resolve().then(function() {
    return about;
  })
};
var metadata_lookup = { "src/routes/__layout.svelte": { "entry": "/./_app/pages/__layout.svelte-5274efec.js", "css": ["/./_app/assets/pages/__layout.svelte-96028ef9.css"], "js": ["/./_app/pages/__layout.svelte-5274efec.js", "/./_app/chunks/vendor-05a29c9f.js"], "styles": [] }, ".svelte-kit/build/components/error.svelte": { "entry": "/./_app/error.svelte-54f74c90.js", "css": [], "js": ["/./_app/error.svelte-54f74c90.js", "/./_app/chunks/vendor-05a29c9f.js"], "styles": [] }, "src/routes/index.svelte": { "entry": "/./_app/pages/index.svelte-b44e82af.js", "css": ["/./_app/assets/pages/index.svelte-dcc7fc38.css"], "js": ["/./_app/pages/index.svelte-b44e82af.js", "/./_app/chunks/vendor-05a29c9f.js"], "styles": [] }, "src/routes/about.svelte": { "entry": "/./_app/pages/about.svelte-e1c19174.js", "css": [], "js": ["/./_app/pages/about.svelte-e1c19174.js", "/./_app/chunks/vendor-05a29c9f.js"], "styles": [] } };
async function load_component(file) {
  return {
    module: await module_lookup[file](),
    ...metadata_lookup[file]
  };
}
function render(request, {
  prerender: prerender2
} = {}) {
  const host = request.headers["host"];
  return respond({ ...request, host }, options, { prerender: prerender2 });
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
var css$4 = {
  code: ".small.svelte-12qkcbw{border-radius:.125rem;height:1.25rem;width:1.25rem}.letter-color.svelte-12qkcbw{fill:#322eff}@media(prefers-color-scheme:dark){.letter-color.svelte-12qkcbw{fill:#7270ff}}",
  map: '{"version":3,"file":"Logo.svelte","sources":["Logo.svelte"],"sourcesContent":["<script>\\r\\n    export let small = false;\\r\\n    export let color = false;\\r\\n<\/script>\\r\\n\\r\\n<svg class=\\"h-36 w-36 rounded\\" class:small={small} width=\\"400\\" height=\\"400\\" viewBox=\\"0 0 400 400\\" fill=\\"none\\" xmlns=\\"http://www.w3.org/2000/svg\\"><path d=\\"M0 0h400v400H0V0z\\" class:letter-color={color} class=\\"fill-current\\"/><path d=\\"M148.649 153.313l76.698-6.036C212.777 85.419 153.57 45.562 81.006 51.273c-83.74 6.59-145.236 70.734-137.164 173.304 7.808 99.202 73.569 155.796 163.432 148.723 80.678-6.349 134.453-60.952 127.826-145.151l-3.265-41.487-135.178 10.639 4.35 55.265 62.154-4.892c1.837 33.128-19.476 55.908-60.504 59.137-46.998 3.699-76.83-28.92-81.577-89.237-4.71-59.858 21.218-96.403 66.686-99.981 30.311-2.386 52.147 10.837 60.883 35.72zM309.33 353.085l15.486-67.455 108.234-8.518 25.848 64.202 81.444-6.41-130.46-305.202-100.886 7.94-81.11 321.853 81.444-6.41zm29.021-126.438l26.004-113.878 2.449-.193 43.652 108.396-72.105 5.675z\\" class=\\"fill-white dark:fill-rich-purple-900\\" /></svg>\\r\\n\\r\\n<style>.small{border-radius:.125rem;height:1.25rem;width:1.25rem}.letter-color{fill:#322eff}@media (prefers-color-scheme:dark){.letter-color{fill:#7270ff}}</style>"],"names":[],"mappings":"AAOO,qBAAM,CAAC,cAAc,OAAO,CAAC,OAAO,OAAO,CAAC,MAAM,OAAO,CAAC,4BAAa,CAAC,KAAK,OAAO,CAAC,MAAM,AAAC,sBAAsB,IAAI,CAAC,CAAC,4BAAa,CAAC,KAAK,OAAO,CAAC,CAAC"}'
};
var Logo = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { small = false } = $$props;
  let { color = false } = $$props;
  if ($$props.small === void 0 && $$bindings.small && small !== void 0)
    $$bindings.small(small);
  if ($$props.color === void 0 && $$bindings.color && color !== void 0)
    $$bindings.color(color);
  $$result.css.add(css$4);
  return `<svg class="${["h-36 w-36 rounded svelte-12qkcbw", small ? "small" : ""].join(" ").trim()}" width="${"400"}" height="${"400"}" viewBox="${"0 0 400 400"}" fill="${"none"}" xmlns="${"http://www.w3.org/2000/svg"}"><path d="${"M0 0h400v400H0V0z"}" class="${["fill-current svelte-12qkcbw", color ? "letter-color" : ""].join(" ").trim()}"></path><path d="${"M148.649 153.313l76.698-6.036C212.777 85.419 153.57 45.562 81.006 51.273c-83.74 6.59-145.236 70.734-137.164 173.304 7.808 99.202 73.569 155.796 163.432 148.723 80.678-6.349 134.453-60.952 127.826-145.151l-3.265-41.487-135.178 10.639 4.35 55.265 62.154-4.892c1.837 33.128-19.476 55.908-60.504 59.137-46.998 3.699-76.83-28.92-81.577-89.237-4.71-59.858 21.218-96.403 66.686-99.981 30.311-2.386 52.147 10.837 60.883 35.72zM309.33 353.085l15.486-67.455 108.234-8.518 25.848 64.202 81.444-6.41-130.46-305.202-100.886 7.94-81.11 321.853 81.444-6.41zm29.021-126.438l26.004-113.878 2.449-.193 43.652 108.396-72.105 5.675z"}" class="${"fill-white dark:fill-rich-purple-900"}"></path></svg>`;
});
var css$3 = {
  code: "li.svelte-7z51lo:not(.visible){display:none}",
  map: `{"version":3,"file":"Header.svelte","sources":["Header.svelte"],"sourcesContent":["<script>\\n\\timport { page } from '$app/stores';\\n\\timport Logo from '$lib/Logo.svelte';\\n<\/script>\\n\\n<header class=\\"fixed top-0 py-30 bg-white dark:bg-rich-purple-900 bg-opacity-90 dark:bg-opacity-95 backdrop-blur-lg z-10 w-full\\">\\n\\t<nav>\\n\\t\\t<ul class=\\"flex items-center gap-30 text-18\\">\\n\\t\\t\\t<li class=\\"visible\\"><a sveltekit:prefetch href=\\"/\\" aria-label=\\"Go to homepage\\"><Logo color /></a></li>\\n\\t\\t\\t<li class:visible={$page.path !== '/'}><a sveltekit:prefetch href=\\"/\\">Back</a></li>\\n\\t\\t\\t<li class:visible={$page.path === '/'}><a sveltekit:prefetch href=\\"#about\\">About me</a></li>\\n\\t\\t\\t<li class:visible={$page.path === '/'}><a sveltekit:prefetch href=\\"#work\\">Work</a></li>\\n\\t\\t\\t<li class:visible={$page.path === '/'}><a sveltekit:prefetch href=\\"#contact\\">Contact</a></li>\\n\\t\\t</ul>\\n\\t</nav>\\n</header>\\n\\n<style>li:not(.visible){display:none}</style>"],"names":[],"mappings":"AAiBO,gBAAE,KAAK,QAAQ,CAAC,CAAC,QAAQ,IAAI,CAAC"}`
};
var Header = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $page, $$unsubscribe_page;
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  $$result.css.add(css$3);
  $$unsubscribe_page();
  return `<header class="${"fixed top-0 py-30 bg-white dark:bg-rich-purple-900 bg-opacity-90 dark:bg-opacity-95 backdrop-blur-lg z-10 w-full"}"><nav><ul class="${"flex items-center gap-30 text-18"}"><li class="${"visible svelte-7z51lo"}"><a sveltekit:prefetch href="${"/"}" aria-label="${"Go to homepage"}">${validate_component(Logo, "Logo").$$render($$result, { color: true }, {}, {})}</a></li>
			<li class="${["svelte-7z51lo", $page.path !== "/" ? "visible" : ""].join(" ").trim()}"><a sveltekit:prefetch href="${"/"}">Back</a></li>
			<li class="${["svelte-7z51lo", $page.path === "/" ? "visible" : ""].join(" ").trim()}"><a sveltekit:prefetch href="${"#about"}">About me</a></li>
			<li class="${["svelte-7z51lo", $page.path === "/" ? "visible" : ""].join(" ").trim()}"><a sveltekit:prefetch href="${"#work"}">Work</a></li>
			<li class="${["svelte-7z51lo", $page.path === "/" ? "visible" : ""].join(" ").trim()}"><a sveltekit:prefetch href="${"#contact"}">Contact</a></li></ul></nav>
</header>`;
});
var css$2 = {
  code: "body{--tw-bg-opacity:1;--tw-text-opacity:1;background-color:rgba(255,255,255,var(--tw-bg-opacity));color:rgba(0,0,0,var(--tw-text-opacity));margin-left:auto;margin-right:auto;max-width:80rem;padding:1.875rem;transition-duration:.15s;transition-property:background-color,border-color,color,fill,stroke;transition-timing-function:cubic-bezier(.4,0,.2,1)}@media(prefers-color-scheme:dark){body{--tw-bg-opacity:1;--tw-text-opacity:1;background-color:rgba(18,18,29,var(--tw-bg-opacity));color:rgba(255,255,255,var(--tw-text-opacity))}}@media(min-width:768px){body{padding:3rem}}body,html{overflow-x:hidden;scroll-behavior:smooth}.purple-text{--tw-text-opacity:1;color:rgba(50,46,255,var(--tw-text-opacity))}@media(prefers-color-scheme:dark){.purple-text{--tw-text-opacity:1;color:rgba(114,112,255,var(--tw-text-opacity))}}footer{--tw-border-opacity:1;--tw-border-opacity:0.05;border-color:rgba(50,46,255,var(--tw-border-opacity));border-top-width:1px;margin-left:-3.75rem;margin-right:-3.75rem;padding-left:3.75rem;padding-right:3.75rem;padding-top:2.25rem}@media(prefers-color-scheme:dark){footer{--tw-border-opacity:1;--tw-border-opacity:0.1;border-color:rgba(114,112,255,var(--tw-border-opacity))}}footer p a{font-weight:500}footer p a:hover{--tw-text-opacity:1;color:rgba(50,46,255,var(--tw-text-opacity))}@media(prefers-color-scheme:dark){footer p a:hover{--tw-text-opacity:1;color:rgba(114,112,255,var(--tw-text-opacity))}}::-webkit-scrollbar{background-color:transparent;border-left:1px solid rgba(70 62 251/.05);width:1rem}::-webkit-scrollbar:hover{border-left:1px solid rgba(70 62 251/.15)}::-webkit-scrollbar-thumb{background-clip:content-box;background-color:rgba(70 62 251/.1);border:5px solid transparent;border-radius:100px}::-webkit-scrollbar-thumb:hover{background-color:rgba(70 62 251/.8)}::-webkit-scrollbar-track{background-color:transparent}@media(prefers-color-scheme:dark){::-webkit-scrollbar{border-left:1px solid rgba(122 117 251/.05)}::-webkit-scrollbar:hover{border-left:1px solid rgba(122 117 251/.15)}::-webkit-scrollbar-thumb{background-color:rgba(122 117 251/.1)}::-webkit-scrollbar-thumb:hover{background-color:rgba(122 117 251/.8)}}",
  map: `{"version":3,"file":"__layout.svelte","sources":["__layout.svelte"],"sourcesContent":["<script>\\n\\timport Header from '$lib/header/Header.svelte';\\n\\timport Logo from '$lib/Logo.svelte';\\n\\timport '../app.postcss';\\n<\/script>\\n\\n<Header />\\n\\n<main>\\n\\t<slot />\\n</main>\\n\\n<footer class=\\"flex items-center justify-between gap-15\\">\\n\\t<div class=\\"flex items-center gap-5 text-18 flex-shrink-0\\">\\n\\t\\t<Logo small />\\n\\t\\t<span>&copy; 2021</span>\\n\\t</div>\\n\\n\\t<p class=\\"text-right text-12 w-1/2 sm:w-full text-gray-800 dark:text-gray-200 font-light\\">\\n\\t\\tMade with \u2764\uFE0F in <a href=\\"https://www.figma.com/\\">Figma</a>, built using <a href=\\"https://kit.svelte.dev\\">SvelteKit</a>, hosted on <a href=\\"https://netlify.com\\">Netlify</a>\\n\\t</p>\\n</footer>\\n\\n<style global>:global(body){--tw-bg-opacity:1;--tw-text-opacity:1;background-color:rgba(255,255,255,var(--tw-bg-opacity));color:rgba(0,0,0,var(--tw-text-opacity));margin-left:auto;margin-right:auto;max-width:80rem;padding:1.875rem;transition-duration:.15s;transition-property:background-color,border-color,color,fill,stroke;transition-timing-function:cubic-bezier(.4,0,.2,1)}@media (prefers-color-scheme:dark){:global(body){--tw-bg-opacity:1;--tw-text-opacity:1;background-color:rgba(18,18,29,var(--tw-bg-opacity));color:rgba(255,255,255,var(--tw-text-opacity))}}@media (min-width:768px){:global(body){padding:3rem}}:global(body),:global(html){overflow-x:hidden;scroll-behavior:smooth}:global(.purple-text){--tw-text-opacity:1;color:rgba(50,46,255,var(--tw-text-opacity))}@media (prefers-color-scheme:dark){:global(.purple-text){--tw-text-opacity:1;color:rgba(114,112,255,var(--tw-text-opacity))}}:global(footer){--tw-border-opacity:1;--tw-border-opacity:0.05;border-color:rgba(50,46,255,var(--tw-border-opacity));border-top-width:1px;margin-left:-3.75rem;margin-right:-3.75rem;padding-left:3.75rem;padding-right:3.75rem;padding-top:2.25rem}@media (prefers-color-scheme:dark){:global(footer){--tw-border-opacity:1;--tw-border-opacity:0.1;border-color:rgba(114,112,255,var(--tw-border-opacity))}}:global(footer) :global(p) :global(a){font-weight:500}:global(footer) :global(p) :global(a:hover){--tw-text-opacity:1;color:rgba(50,46,255,var(--tw-text-opacity))}@media (prefers-color-scheme:dark){:global(footer) :global(p) :global(a:hover){--tw-text-opacity:1;color:rgba(114,112,255,var(--tw-text-opacity))}}:global(::-webkit-scrollbar){background-color:transparent;border-left:1px solid rgba(70 62 251/.05);width:1rem}:global(::-webkit-scrollbar:hover){border-left:1px solid rgba(70 62 251/.15)}:global(::-webkit-scrollbar-thumb){background-clip:content-box;background-color:rgba(70 62 251/.1);border:5px solid transparent;border-radius:100px}:global(::-webkit-scrollbar-thumb:hover){background-color:rgba(70 62 251/.8)}:global(::-webkit-scrollbar-track){background-color:transparent}@media (prefers-color-scheme:dark){:global(::-webkit-scrollbar){border-left:1px solid rgba(122 117 251/.05)}:global(::-webkit-scrollbar:hover){border-left:1px solid rgba(122 117 251/.15)}:global(::-webkit-scrollbar-thumb){background-color:rgba(122 117 251/.1)}:global(::-webkit-scrollbar-thumb:hover){background-color:rgba(122 117 251/.8)}}</style>\\n"],"names":[],"mappings":"AAuBsB,IAAI,AAAC,CAAC,gBAAgB,CAAC,CAAC,kBAAkB,CAAC,CAAC,iBAAiB,KAAK,GAAG,CAAC,GAAG,CAAC,GAAG,CAAC,IAAI,eAAe,CAAC,CAAC,CAAC,MAAM,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,IAAI,iBAAiB,CAAC,CAAC,CAAC,YAAY,IAAI,CAAC,aAAa,IAAI,CAAC,UAAU,KAAK,CAAC,QAAQ,QAAQ,CAAC,oBAAoB,IAAI,CAAC,oBAAoB,gBAAgB,CAAC,YAAY,CAAC,KAAK,CAAC,IAAI,CAAC,MAAM,CAAC,2BAA2B,aAAa,EAAE,CAAC,CAAC,CAAC,EAAE,CAAC,CAAC,CAAC,CAAC,MAAM,AAAC,sBAAsB,IAAI,CAAC,CAAC,AAAQ,IAAI,AAAC,CAAC,gBAAgB,CAAC,CAAC,kBAAkB,CAAC,CAAC,iBAAiB,KAAK,EAAE,CAAC,EAAE,CAAC,EAAE,CAAC,IAAI,eAAe,CAAC,CAAC,CAAC,MAAM,KAAK,GAAG,CAAC,GAAG,CAAC,GAAG,CAAC,IAAI,iBAAiB,CAAC,CAAC,CAAC,CAAC,MAAM,AAAC,WAAW,KAAK,CAAC,CAAC,AAAQ,IAAI,AAAC,CAAC,QAAQ,IAAI,CAAC,CAAC,AAAQ,IAAI,AAAC,CAAC,AAAQ,IAAI,AAAC,CAAC,WAAW,MAAM,CAAC,gBAAgB,MAAM,CAAC,AAAQ,YAAY,AAAC,CAAC,kBAAkB,CAAC,CAAC,MAAM,KAAK,EAAE,CAAC,EAAE,CAAC,GAAG,CAAC,IAAI,iBAAiB,CAAC,CAAC,CAAC,MAAM,AAAC,sBAAsB,IAAI,CAAC,CAAC,AAAQ,YAAY,AAAC,CAAC,kBAAkB,CAAC,CAAC,MAAM,KAAK,GAAG,CAAC,GAAG,CAAC,GAAG,CAAC,IAAI,iBAAiB,CAAC,CAAC,CAAC,CAAC,AAAQ,MAAM,AAAC,CAAC,oBAAoB,CAAC,CAAC,oBAAoB,IAAI,CAAC,aAAa,KAAK,EAAE,CAAC,EAAE,CAAC,GAAG,CAAC,IAAI,mBAAmB,CAAC,CAAC,CAAC,iBAAiB,GAAG,CAAC,YAAY,QAAQ,CAAC,aAAa,QAAQ,CAAC,aAAa,OAAO,CAAC,cAAc,OAAO,CAAC,YAAY,OAAO,CAAC,MAAM,AAAC,sBAAsB,IAAI,CAAC,CAAC,AAAQ,MAAM,AAAC,CAAC,oBAAoB,CAAC,CAAC,oBAAoB,GAAG,CAAC,aAAa,KAAK,GAAG,CAAC,GAAG,CAAC,GAAG,CAAC,IAAI,mBAAmB,CAAC,CAAC,CAAC,CAAC,AAAQ,MAAM,AAAC,CAAC,AAAQ,CAAC,AAAC,CAAC,AAAQ,CAAC,AAAC,CAAC,YAAY,GAAG,CAAC,AAAQ,MAAM,AAAC,CAAC,AAAQ,CAAC,AAAC,CAAC,AAAQ,OAAO,AAAC,CAAC,kBAAkB,CAAC,CAAC,MAAM,KAAK,EAAE,CAAC,EAAE,CAAC,GAAG,CAAC,IAAI,iBAAiB,CAAC,CAAC,CAAC,MAAM,AAAC,sBAAsB,IAAI,CAAC,CAAC,AAAQ,MAAM,AAAC,CAAC,AAAQ,CAAC,AAAC,CAAC,AAAQ,OAAO,AAAC,CAAC,kBAAkB,CAAC,CAAC,MAAM,KAAK,GAAG,CAAC,GAAG,CAAC,GAAG,CAAC,IAAI,iBAAiB,CAAC,CAAC,CAAC,CAAC,AAAQ,mBAAmB,AAAC,CAAC,iBAAiB,WAAW,CAAC,YAAY,GAAG,CAAC,KAAK,CAAC,KAAK,EAAE,CAAC,EAAE,CAAC,GAAG,CAAC,GAAG,CAAC,CAAC,MAAM,IAAI,CAAC,AAAQ,yBAAyB,AAAC,CAAC,YAAY,GAAG,CAAC,KAAK,CAAC,KAAK,EAAE,CAAC,EAAE,CAAC,GAAG,CAAC,GAAG,CAAC,CAAC,AAAQ,yBAAyB,AAAC,CAAC,gBAAgB,WAAW,CAAC,iBAAiB,KAAK,EAAE,CAAC,EAAE,CAAC,GAAG,CAAC,EAAE,CAAC,CAAC,OAAO,GAAG,CAAC,KAAK,CAAC,WAAW,CAAC,cAAc,KAAK,CAAC,AAAQ,+BAA+B,AAAC,CAAC,iBAAiB,KAAK,EAAE,CAAC,EAAE,CAAC,GAAG,CAAC,EAAE,CAAC,CAAC,AAAQ,yBAAyB,AAAC,CAAC,iBAAiB,WAAW,CAAC,MAAM,AAAC,sBAAsB,IAAI,CAAC,CAAC,AAAQ,mBAAmB,AAAC,CAAC,YAAY,GAAG,CAAC,KAAK,CAAC,KAAK,GAAG,CAAC,GAAG,CAAC,GAAG,CAAC,GAAG,CAAC,CAAC,AAAQ,yBAAyB,AAAC,CAAC,YAAY,GAAG,CAAC,KAAK,CAAC,KAAK,GAAG,CAAC,GAAG,CAAC,GAAG,CAAC,GAAG,CAAC,CAAC,AAAQ,yBAAyB,AAAC,CAAC,iBAAiB,KAAK,GAAG,CAAC,GAAG,CAAC,GAAG,CAAC,EAAE,CAAC,CAAC,AAAQ,+BAA+B,AAAC,CAAC,iBAAiB,KAAK,GAAG,CAAC,GAAG,CAAC,GAAG,CAAC,EAAE,CAAC,CAAC,CAAC"}`
};
var _layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$2);
  return `${validate_component(Header, "Header").$$render($$result, {}, {}, {})}

<main>${slots.default ? slots.default({}) : ``}</main>

<footer class="${"flex items-center justify-between gap-15"}"><div class="${"flex items-center gap-5 text-18 flex-shrink-0"}">${validate_component(Logo, "Logo").$$render($$result, { small: true }, {}, {})}
		<span>\xA9 2021</span></div>

	<p class="${"text-right text-12 w-1/2 sm:w-full text-gray-800 dark:text-gray-200 font-light"}">Made with \u2764\uFE0F in <a href="${"https://www.figma.com/"}">Figma</a>, built using <a href="${"https://kit.svelte.dev"}">SvelteKit</a>, hosted on <a href="${"https://netlify.com"}">Netlify</a></p>
</footer>`;
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
  if ($$props.content === void 0 && $$bindings.content && content !== void 0)
    $$bindings.content(content);
  if ($$props.url === void 0 && $$bindings.url && url !== void 0)
    $$bindings.url(url);
  if ($$props.extraClass === void 0 && $$bindings.extraClass && extraClass !== void 0)
    $$bindings.extraClass(extraClass);
  if ($$props.arrowDirection === void 0 && $$bindings.arrowDirection && arrowDirection !== void 0)
    $$bindings.arrowDirection(arrowDirection);
  return `<a class="${"flex items-center text-14w uppercase font-medium gap-5 group w-max p-px rounded-sm " + escape2(extraClass)}"${add_attribute("href", url, 0)}><span class="${"group-hover:text-rich-purple-500 dark:group-hover:text-rich-purple-300 group-hover:tracking-[0.18em] transition-all"}"><!-- HTML_TAG_START -->${content}<!-- HTML_TAG_END --></span>
    <svg class="${[
    "transform",
    (arrowDirection === ArrowDirections.DIAGONAL ? "-rotate-45" : "") + " " + (arrowDirection === ArrowDirections.DOWN ? "rotate-90" : "") + " " + (arrowDirection === ArrowDirections.UP ? "-rotate-90" : "") + " " + (arrowDirection === ArrowDirections.LEFT ? "rotate-180" : "")
  ].join(" ").trim()}" width="${"16"}" height="${"16"}" viewBox="${"0 0 16 16"}" fill="${"none"}" xmlns="${"http://www.w3.org/2000/svg"}"><path d="${"M8.84 2l5.66 6-5.66 6-.973-1.031 4.005-4.232H1.5V7.263h10.372L7.867 3.018 8.84 2z"}" class="${"fill-rich-purple-500 dark:fill-rich-purple-300"}"></path></svg></a>`;
});
var css$1 = {
  code: "svg.svelte-uh6x0s{height:auto;width:100%}@media(min-width:640px){svg.svelte-uh6x0s{width:80vw}}@media(min-width:768px){svg.svelte-uh6x0s{width:60vw}}@media(min-width:1024px){svg.svelte-uh6x0s{--tw-translate-x:4.375rem;transform:var(--tw-transform);width:100%}}",
  map: '{"version":3,"file":"AboutImage.svelte","sources":["AboutImage.svelte"],"sourcesContent":["<svg width=\\"785\\" height=\\"566\\" viewBox=\\"0 0 785 566\\" fill=\\"none\\" xmlns=\\"http://www.w3.org/2000/svg\\" xmlns:xlink=\\"http://www.w3.org/1999/xlink\\">\\r\\n    <g clip-path=\\"url(#clip0)\\">\\r\\n    <path d=\\"M71.195 133.302C100.909 128.501 121.105 100.52 116.303 70.8063C111.502 41.0922 83.5216 20.8965 53.8075 25.6979C24.0934 30.4993 3.89769 58.4796 8.6991 88.1937C13.5005 117.908 41.4809 138.104 71.195 133.302Z\\" fill=\\"#F2DD39\\"/>\\r\\n    <path d=\\"M71.195 133.302C100.909 128.501 121.105 100.52 116.303 70.8063C111.502 41.0922 83.5216 20.8965 53.8075 25.6979C24.0934 30.4993 3.89769 58.4796 8.6991 88.1937C13.5005 117.908 41.4809 138.104 71.195 133.302Z\\" fill=\\"url(#pattern0)\\"/>\\r\\n    <path d=\\"M180.688 310.275C198.888 305.654 209.897 287.155 205.277 268.954C200.656 250.754 182.157 239.745 163.956 244.365C145.756 248.985 134.747 267.485 139.367 285.686C143.988 303.886 162.487 314.895 180.688 310.275Z\\" fill=\\"url(#pattern1)\\"/>\\r\\n    <path d=\\"M661.441 329.017C679.124 322.698 688.336 303.241 682.017 285.559C675.698 267.876 656.241 258.664 638.559 264.983C620.876 271.302 611.664 290.759 617.983 308.441C624.302 326.124 643.759 335.336 661.441 329.017Z\\" fill=\\"url(#pattern2)\\"/>\\r\\n    <path d=\\"M420.502 362C469.379 362 509.002 322.377 509.002 273.5C509.002 224.623 469.379 185 420.502 185C371.625 185 332.002 224.623 332.002 273.5C332.002 322.377 371.625 362 420.502 362Z\\" fill=\\"url(#pattern3)\\"/>\\r\\n    <path d=\\"M714.913 126.615C745.905 130.252 773.977 108.078 777.615 77.0866C781.252 46.0953 759.078 18.0229 728.086 14.3853C697.095 10.7477 669.023 32.9223 665.385 63.9136C661.748 94.9049 683.922 122.977 714.913 126.615Z\\" fill=\\"url(#pattern4)\\"/>\\r\\n    <path d=\\"M554.501 566C589.019 566 617.001 538.018 617.001 503.5C617.001 468.982 589.019 441 554.501 441C519.983 441 492.001 468.982 492.001 503.5C492.001 538.018 519.983 566 554.501 566Z\\" fill=\\"url(#pattern5)\\"/>\\r\\n    <path d=\\"M157.5 550C188.704 550 214 524.704 214 493.5C214 462.296 188.704 437 157.5 437C126.296 437 101 462.296 101 493.5C101 524.704 126.296 550 157.5 550Z\\" fill=\\"url(#pattern6)\\"/>\\r\\n    <path d=\\"M462.502 69C481.556 69 497.002 53.5538 497.002 34.5C497.002 15.4462 481.556 0 462.502 0C443.448 0 428.002 15.4462 428.002 34.5C428.002 53.5538 443.448 69 462.502 69Z\\" fill=\\"#38A2D0\\"/>\\r\\n    <path d=\\"M462.502 69C481.556 69 497.002 53.5538 497.002 34.5C497.002 15.4462 481.556 0 462.502 0C443.448 0 428.002 15.4462 428.002 34.5C428.002 53.5538 443.448 69 462.502 69Z\\" fill=\\"url(#pattern7)\\"/>\\r\\n    <path d=\\"M337.422 485.535C356.984 489.233 375.84 476.372 379.537 456.81C383.235 437.248 370.374 418.393 350.813 414.695C331.251 410.997 312.395 423.858 308.697 443.42C305 462.982 317.86 481.837 337.422 485.535Z\\" fill=\\"url(#pattern8)\\"/>\\r\\n    <path d=\\"M719.33 463.655C733.872 465.309 747.001 454.861 748.655 440.32C750.309 425.778 739.861 412.649 725.32 410.995C710.778 409.341 697.649 419.789 695.995 434.331C694.341 448.872 704.789 462.001 719.33 463.655Z\\" fill=\\"url(#pattern9)\\"/>\\r\\n    <path d=\\"M573.698 174.053C590.02 177.81 606.297 167.624 610.053 151.302C613.81 134.98 603.624 118.703 587.302 114.947C570.98 111.19 554.704 121.376 550.947 137.698C547.19 154.02 557.376 170.297 573.698 174.053Z\\" fill=\\"url(#pattern10)\\"/>\\r\\n    <path d=\\"M271.938 160.888C290.93 156.781 302.997 138.055 298.889 119.063C294.782 100.071 276.056 88.0045 257.064 92.1118C238.072 96.2192 226.005 114.945 230.113 133.937C234.22 152.929 252.946 164.996 271.938 160.888Z\\" fill=\\"url(#pattern11)\\"/>\\r\\n    <path d=\\"M26.2184 398.29C40.6985 400.417 54.1616 390.404 56.2892 375.923C58.4168 361.443 48.4032 347.98 33.9231 345.853C19.443 343.725 5.97983 353.739 3.85224 368.219C1.72465 382.699 11.7383 396.162 26.2184 398.29Z\\" fill=\\"url(#pattern12)\\"/>\\r\\n    </g>\\r\\n    <defs>\\r\\n    <pattern id=\\"pattern0\\" patternContentUnits=\\"objectBoundingBox\\" width=\\"1\\" height=\\"1\\">\\r\\n    <use xlink:href=\\"#image0\\"/>\\r\\n    </pattern>\\r\\n    <pattern id=\\"pattern1\\" patternContentUnits=\\"objectBoundingBox\\" width=\\"1\\" height=\\"1\\">\\r\\n    <use xlink:href=\\"#image1\\"/>\\r\\n    </pattern>\\r\\n    <pattern id=\\"pattern2\\" patternContentUnits=\\"objectBoundingBox\\" width=\\"1\\" height=\\"1\\">\\r\\n    <use xlink:href=\\"#image2\\"/>\\r\\n    </pattern>\\r\\n    <pattern id=\\"pattern3\\" patternContentUnits=\\"objectBoundingBox\\" width=\\"1\\" height=\\"1\\">\\r\\n    <use xlink:href=\\"#image3\\"/>\\r\\n    </pattern>\\r\\n    <pattern id=\\"pattern4\\" patternContentUnits=\\"objectBoundingBox\\" width=\\"1\\" height=\\"1\\">\\r\\n    <use xlink:href=\\"#image4\\"/>\\r\\n    </pattern>\\r\\n    <pattern id=\\"pattern5\\" patternContentUnits=\\"objectBoundingBox\\" width=\\"1\\" height=\\"1\\">\\r\\n    <use xlink:href=\\"#image5\\"/>\\r\\n    </pattern>\\r\\n    <pattern id=\\"pattern6\\" patternContentUnits=\\"objectBoundingBox\\" width=\\"1\\" height=\\"1\\">\\r\\n    <use xlink:href=\\"#image6\\"/>\\r\\n    </pattern>\\r\\n    <pattern id=\\"pattern7\\" patternContentUnits=\\"objectBoundingBox\\" width=\\"1\\" height=\\"1\\">\\r\\n    <use xlink:href=\\"#image7\\"/>\\r\\n    </pattern>\\r\\n    <pattern id=\\"pattern8\\" patternContentUnits=\\"objectBoundingBox\\" width=\\"1\\" height=\\"1\\">\\r\\n    <use xlink:href=\\"#image8\\"/>\\r\\n    </pattern>\\r\\n    <pattern id=\\"pattern9\\" patternContentUnits=\\"objectBoundingBox\\" width=\\"1\\" height=\\"1\\">\\r\\n    <use xlink:href=\\"#image9\\"/>\\r\\n    </pattern>\\r\\n    <pattern id=\\"pattern10\\" patternContentUnits=\\"objectBoundingBox\\" width=\\"1\\" height=\\"1\\">\\r\\n    <use xlink:href=\\"#image10\\"/>\\r\\n    </pattern>\\r\\n    <pattern id=\\"pattern11\\" patternContentUnits=\\"objectBoundingBox\\" width=\\"1\\" height=\\"1\\">\\r\\n    <use xlink:href=\\"#image11\\"/>\\r\\n    </pattern>\\r\\n    <pattern id=\\"pattern12\\" patternContentUnits=\\"objectBoundingBox\\" width=\\"1\\" height=\\"1\\">\\r\\n    <use xlink:href=\\"#image12\\"/>\\r\\n    </pattern>\\r\\n    <clipPath id=\\"clip0\\">\\r\\n    <rect width=\\"785\\" height=\\"566\\" fill=\\"white\\"/>\\r\\n    </clipPath>\\r\\n    <image id=\\"image0\\" width=\\"1\\" height=\\"1\\" xlink:href=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/js-light_NsS7e7h1iO.png?updatedAt=1627165983549\\"/>\\r\\n    <image id=\\"image1\\" width=\\"1\\" height=\\"1\\" xlink:href=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/figma_NhfQvqQk9s.png?updatedAt=1627165982830\\"/>\\r\\n    <image id=\\"image2\\" width=\\"1\\" height=\\"1\\" xlink:href=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/work_SWEpk52-xk.png?updatedAt=1627165985511\\"/>\\r\\n    <image id=\\"image3\\" width=\\"1\\" height=\\"1\\" xlink:href=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/me_8_97RTibL3.png?updatedAt=1627165983972\\"/>\\r\\n    <image id=\\"image4\\" width=\\"1\\" height=\\"1\\" xlink:href=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/city_bGlwgxsd7.png?updatedAt=1627165982406\\"/>\\r\\n    <image id=\\"image5\\" width=\\"1\\" height=\\"1\\" xlink:href=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/dog_jmLx-UJ0Qn.png?updatedAt=1627165983118\\"/>\\r\\n    <image id=\\"image6\\" width=\\"1\\" height=\\"1\\" xlink:href=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/coffee_Az-P5TG4TO.png?updatedAt=1627165983126\\"/>\\r\\n    <image id=\\"image7\\" width=\\"1\\" height=\\"1\\" xlink:href=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/wordpress_CL23aAT88.png?updatedAt=1627165985258\\"/>\\r\\n    <image id=\\"image8\\" width=\\"1\\" height=\\"1\\" xlink:href=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/svelte_hiH-1myDZrb.png?updatedAt=1627165984078\\"/>\\r\\n    <image id=\\"image9\\" width=\\"1\\" height=\\"1\\" xlink:href=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/indesign_v9_etFN4N.png?updatedAt=1627165983054\\"/>\\r\\n    <image id=\\"image10\\" width=\\"1\\" height=\\"1\\" xlink:href=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/android_hD0IP-0hc5.png?updatedAt=1627165981743\\"/>\\r\\n    <image id=\\"image11\\" width=\\"1\\" height=\\"1\\" xlink:href=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/airplane_9HO0AsWwb.png?updatedAt=1627165981820\\"/>\\r\\n    <image id=\\"image12\\" width=\\"1\\" height=\\"1\\" xlink:href=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/photoshop_6Hh47E7c-.png?updatedAt=1627165983918\\"/>\\r\\n    </defs>\\r\\n    </svg>\\r\\n    \\r\\n<style>svg{height:auto;width:100%}@media (min-width:640px){svg{width:80vw}}@media (min-width:768px){svg{width:60vw}}@media (min-width:1024px){svg{--tw-translate-x:4.375rem;transform:var(--tw-transform);width:100%}}</style>"],"names":[],"mappings":"AA6EO,iBAAG,CAAC,OAAO,IAAI,CAAC,MAAM,IAAI,CAAC,MAAM,AAAC,WAAW,KAAK,CAAC,CAAC,iBAAG,CAAC,MAAM,IAAI,CAAC,CAAC,MAAM,AAAC,WAAW,KAAK,CAAC,CAAC,iBAAG,CAAC,MAAM,IAAI,CAAC,CAAC,MAAM,AAAC,WAAW,MAAM,CAAC,CAAC,iBAAG,CAAC,iBAAiB,QAAQ,CAAC,UAAU,IAAI,cAAc,CAAC,CAAC,MAAM,IAAI,CAAC,CAAC"}'
};
var AboutImage = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$1);
  return `<svg width="${"785"}" height="${"566"}" viewBox="${"0 0 785 566"}" fill="${"none"}" xmlns="${"http://www.w3.org/2000/svg"}" xmlns:xlink="${"http://www.w3.org/1999/xlink"}" class="${"svelte-uh6x0s"}"><g clip-path="${"url(#clip0)"}"><path d="${"M71.195 133.302C100.909 128.501 121.105 100.52 116.303 70.8063C111.502 41.0922 83.5216 20.8965 53.8075 25.6979C24.0934 30.4993 3.89769 58.4796 8.6991 88.1937C13.5005 117.908 41.4809 138.104 71.195 133.302Z"}" fill="${"#F2DD39"}"></path><path d="${"M71.195 133.302C100.909 128.501 121.105 100.52 116.303 70.8063C111.502 41.0922 83.5216 20.8965 53.8075 25.6979C24.0934 30.4993 3.89769 58.4796 8.6991 88.1937C13.5005 117.908 41.4809 138.104 71.195 133.302Z"}" fill="${"url(#pattern0)"}"></path><path d="${"M180.688 310.275C198.888 305.654 209.897 287.155 205.277 268.954C200.656 250.754 182.157 239.745 163.956 244.365C145.756 248.985 134.747 267.485 139.367 285.686C143.988 303.886 162.487 314.895 180.688 310.275Z"}" fill="${"url(#pattern1)"}"></path><path d="${"M661.441 329.017C679.124 322.698 688.336 303.241 682.017 285.559C675.698 267.876 656.241 258.664 638.559 264.983C620.876 271.302 611.664 290.759 617.983 308.441C624.302 326.124 643.759 335.336 661.441 329.017Z"}" fill="${"url(#pattern2)"}"></path><path d="${"M420.502 362C469.379 362 509.002 322.377 509.002 273.5C509.002 224.623 469.379 185 420.502 185C371.625 185 332.002 224.623 332.002 273.5C332.002 322.377 371.625 362 420.502 362Z"}" fill="${"url(#pattern3)"}"></path><path d="${"M714.913 126.615C745.905 130.252 773.977 108.078 777.615 77.0866C781.252 46.0953 759.078 18.0229 728.086 14.3853C697.095 10.7477 669.023 32.9223 665.385 63.9136C661.748 94.9049 683.922 122.977 714.913 126.615Z"}" fill="${"url(#pattern4)"}"></path><path d="${"M554.501 566C589.019 566 617.001 538.018 617.001 503.5C617.001 468.982 589.019 441 554.501 441C519.983 441 492.001 468.982 492.001 503.5C492.001 538.018 519.983 566 554.501 566Z"}" fill="${"url(#pattern5)"}"></path><path d="${"M157.5 550C188.704 550 214 524.704 214 493.5C214 462.296 188.704 437 157.5 437C126.296 437 101 462.296 101 493.5C101 524.704 126.296 550 157.5 550Z"}" fill="${"url(#pattern6)"}"></path><path d="${"M462.502 69C481.556 69 497.002 53.5538 497.002 34.5C497.002 15.4462 481.556 0 462.502 0C443.448 0 428.002 15.4462 428.002 34.5C428.002 53.5538 443.448 69 462.502 69Z"}" fill="${"#38A2D0"}"></path><path d="${"M462.502 69C481.556 69 497.002 53.5538 497.002 34.5C497.002 15.4462 481.556 0 462.502 0C443.448 0 428.002 15.4462 428.002 34.5C428.002 53.5538 443.448 69 462.502 69Z"}" fill="${"url(#pattern7)"}"></path><path d="${"M337.422 485.535C356.984 489.233 375.84 476.372 379.537 456.81C383.235 437.248 370.374 418.393 350.813 414.695C331.251 410.997 312.395 423.858 308.697 443.42C305 462.982 317.86 481.837 337.422 485.535Z"}" fill="${"url(#pattern8)"}"></path><path d="${"M719.33 463.655C733.872 465.309 747.001 454.861 748.655 440.32C750.309 425.778 739.861 412.649 725.32 410.995C710.778 409.341 697.649 419.789 695.995 434.331C694.341 448.872 704.789 462.001 719.33 463.655Z"}" fill="${"url(#pattern9)"}"></path><path d="${"M573.698 174.053C590.02 177.81 606.297 167.624 610.053 151.302C613.81 134.98 603.624 118.703 587.302 114.947C570.98 111.19 554.704 121.376 550.947 137.698C547.19 154.02 557.376 170.297 573.698 174.053Z"}" fill="${"url(#pattern10)"}"></path><path d="${"M271.938 160.888C290.93 156.781 302.997 138.055 298.889 119.063C294.782 100.071 276.056 88.0045 257.064 92.1118C238.072 96.2192 226.005 114.945 230.113 133.937C234.22 152.929 252.946 164.996 271.938 160.888Z"}" fill="${"url(#pattern11)"}"></path><path d="${"M26.2184 398.29C40.6985 400.417 54.1616 390.404 56.2892 375.923C58.4168 361.443 48.4032 347.98 33.9231 345.853C19.443 343.725 5.97983 353.739 3.85224 368.219C1.72465 382.699 11.7383 396.162 26.2184 398.29Z"}" fill="${"url(#pattern12)"}"></path></g><defs><pattern id="${"pattern0"}" patternContentUnits="${"objectBoundingBox"}" width="${"1"}" height="${"1"}"><use xlink:href="${"#image0"}"></use></pattern><pattern id="${"pattern1"}" patternContentUnits="${"objectBoundingBox"}" width="${"1"}" height="${"1"}"><use xlink:href="${"#image1"}"></use></pattern><pattern id="${"pattern2"}" patternContentUnits="${"objectBoundingBox"}" width="${"1"}" height="${"1"}"><use xlink:href="${"#image2"}"></use></pattern><pattern id="${"pattern3"}" patternContentUnits="${"objectBoundingBox"}" width="${"1"}" height="${"1"}"><use xlink:href="${"#image3"}"></use></pattern><pattern id="${"pattern4"}" patternContentUnits="${"objectBoundingBox"}" width="${"1"}" height="${"1"}"><use xlink:href="${"#image4"}"></use></pattern><pattern id="${"pattern5"}" patternContentUnits="${"objectBoundingBox"}" width="${"1"}" height="${"1"}"><use xlink:href="${"#image5"}"></use></pattern><pattern id="${"pattern6"}" patternContentUnits="${"objectBoundingBox"}" width="${"1"}" height="${"1"}"><use xlink:href="${"#image6"}"></use></pattern><pattern id="${"pattern7"}" patternContentUnits="${"objectBoundingBox"}" width="${"1"}" height="${"1"}"><use xlink:href="${"#image7"}"></use></pattern><pattern id="${"pattern8"}" patternContentUnits="${"objectBoundingBox"}" width="${"1"}" height="${"1"}"><use xlink:href="${"#image8"}"></use></pattern><pattern id="${"pattern9"}" patternContentUnits="${"objectBoundingBox"}" width="${"1"}" height="${"1"}"><use xlink:href="${"#image9"}"></use></pattern><pattern id="${"pattern10"}" patternContentUnits="${"objectBoundingBox"}" width="${"1"}" height="${"1"}"><use xlink:href="${"#image10"}"></use></pattern><pattern id="${"pattern11"}" patternContentUnits="${"objectBoundingBox"}" width="${"1"}" height="${"1"}"><use xlink:href="${"#image11"}"></use></pattern><pattern id="${"pattern12"}" patternContentUnits="${"objectBoundingBox"}" width="${"1"}" height="${"1"}"><use xlink:href="${"#image12"}"></use></pattern><clipPath id="${"clip0"}"><rect width="${"785"}" height="${"566"}" fill="${"white"}"></rect></clipPath><image id="${"image0"}" width="${"1"}" height="${"1"}" xlink:href="${"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/js-light_NsS7e7h1iO.png?updatedAt=1627165983549"}"></image><image id="${"image1"}" width="${"1"}" height="${"1"}" xlink:href="${"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/figma_NhfQvqQk9s.png?updatedAt=1627165982830"}"></image><image id="${"image2"}" width="${"1"}" height="${"1"}" xlink:href="${"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/work_SWEpk52-xk.png?updatedAt=1627165985511"}"></image><image id="${"image3"}" width="${"1"}" height="${"1"}" xlink:href="${"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/me_8_97RTibL3.png?updatedAt=1627165983972"}"></image><image id="${"image4"}" width="${"1"}" height="${"1"}" xlink:href="${"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/city_bGlwgxsd7.png?updatedAt=1627165982406"}"></image><image id="${"image5"}" width="${"1"}" height="${"1"}" xlink:href="${"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/dog_jmLx-UJ0Qn.png?updatedAt=1627165983118"}"></image><image id="${"image6"}" width="${"1"}" height="${"1"}" xlink:href="${"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/coffee_Az-P5TG4TO.png?updatedAt=1627165983126"}"></image><image id="${"image7"}" width="${"1"}" height="${"1"}" xlink:href="${"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/wordpress_CL23aAT88.png?updatedAt=1627165985258"}"></image><image id="${"image8"}" width="${"1"}" height="${"1"}" xlink:href="${"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/svelte_hiH-1myDZrb.png?updatedAt=1627165984078"}"></image><image id="${"image9"}" width="${"1"}" height="${"1"}" xlink:href="${"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/indesign_v9_etFN4N.png?updatedAt=1627165983054"}"></image><image id="${"image10"}" width="${"1"}" height="${"1"}" xlink:href="${"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/android_hD0IP-0hc5.png?updatedAt=1627165981743"}"></image><image id="${"image11"}" width="${"1"}" height="${"1"}" xlink:href="${"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/airplane_9HO0AsWwb.png?updatedAt=1627165981820"}"></image><image id="${"image12"}" width="${"1"}" height="${"1"}" xlink:href="${"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/photoshop_6Hh47E7c-.png?updatedAt=1627165983918"}"></image></defs></svg>`;
});
var WorkShowcaseCard = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { mobileImageUrl } = $$props;
  let { imageUrl } = $$props;
  let { darkMobileImageUrl } = $$props;
  let { darkImageUrl } = $$props;
  let { name } = $$props;
  let { url } = $$props;
  let { lightColor = "white" } = $$props;
  let { desktopTextHorAlignEnd = false } = $$props;
  let { desktopTextVerAlignBottom = false } = $$props;
  let { extraClass = "" } = $$props;
  const dHor = desktopTextHorAlignEnd ? "sm:justify-self-end" : "sm:justify-self-start";
  const dVer = desktopTextVerAlignBottom ? "sm:self-end" : "sm:self-start";
  if ($$props.mobileImageUrl === void 0 && $$bindings.mobileImageUrl && mobileImageUrl !== void 0)
    $$bindings.mobileImageUrl(mobileImageUrl);
  if ($$props.imageUrl === void 0 && $$bindings.imageUrl && imageUrl !== void 0)
    $$bindings.imageUrl(imageUrl);
  if ($$props.darkMobileImageUrl === void 0 && $$bindings.darkMobileImageUrl && darkMobileImageUrl !== void 0)
    $$bindings.darkMobileImageUrl(darkMobileImageUrl);
  if ($$props.darkImageUrl === void 0 && $$bindings.darkImageUrl && darkImageUrl !== void 0)
    $$bindings.darkImageUrl(darkImageUrl);
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
  return `<a${add_attribute("href", url, 0)} class="${"rounded-xl sm:grid sm:grid-cols-1 sm:grid-rows-1 transform-gpu hover:scale-[1.01] transition hover:shadow-xl dark:hover:shadow-2xl " + escape2(extraClass)}"><picture class="${"sm:row-start-1 sm:row-end-1 sm:col-start-1 sm:col-end-1"}"><source${add_attribute("srcset", darkMobileImageUrl, 0)} media="${"(prefers-color-scheme: dark) and (max-width: 639px)"}">
		<source${add_attribute("srcset", mobileImageUrl, 0)} media="${"(max-width: 639px)"}">
		<source${add_attribute("srcset", darkImageUrl, 0)} media="${"(prefers-color-scheme: dark) and (min-width: 640px)"}">
		<img class="${"rounded-xl"}"${add_attribute("src", imageUrl, 0)}${add_attribute("alt", name, 0)}></picture>
	<h3 class="${"mt-15 sm:mt-0 mb-30 sm:mb-0 text-24 sm:text-48 font-medium sm:font-bold sm:row-start-1 sm:row-end-1 sm:col-start-1 sm:col-end-1 " + escape2(dVer) + " " + escape2(dHor) + " sm:p-20 sm:text-[" + escape2(lightColor) + "] sm:dark:text-white"}">${escape2(name)}</h3></a>`;
});
var css = {
  code: "section.svelte-15brwd.svelte-15brwd{padding-bottom:3.75rem;padding-top:7.5rem}@media(min-width:768px){section.svelte-15brwd.svelte-15brwd{padding-bottom:3.75rem;padding-top:11.25rem}}#about.svelte-15brwd p.svelte-15brwd{font-size:.875rem;line-height:1.5}@media(min-width:768px){#about.svelte-15brwd p.svelte-15brwd{font-size:1.125rem;line-height:1.5}}a.underline.svelte-15brwd.svelte-15brwd{-webkit-text-decoration-color:#322eff;text-decoration-color:#322eff;text-decoration-thickness:2px;text-underline-offset:.1em}@media(prefers-color-scheme:dark){a.underline.svelte-15brwd.svelte-15brwd{-webkit-text-decoration-color:#7270ff;text-decoration-color:#7270ff}}",
  map: `{"version":3,"file":"index.svelte","sources":["index.svelte"],"sourcesContent":["<script>\\n\\timport ArrowButton, { ArrowDirections } from '$lib/ArrowButton.svelte';\\n\\timport AboutImage from '$lib/AboutImage.svelte';\\n\\timport WorkShowcaseCard from '$lib/WorkShowcaseCard.svelte';\\n<\/script>\\n\\n<svelte:head>\\n\\t<title>Goran Alkovi\u0107 - Developer & designer</title>\\n\\t<meta name=\\"description\\" content=\\"Goran Alkovi\u0107 - a frontend developer that also likes to design.\\">\\n</svelte:head>\\n\\n<section id=\\"intro\\" class=\\"mt-120 md:mt-60 mb-100 md:mb-100\\">\\n\\t<h1 class=\\"text-48 md:text-96 font-bold max-w-[68rem]\\">\\n\\t\\t<span class=\\"text-transparent text-stroke-black dark:text-stroke-white text-stroke-DEFAULT\\">\\n\\t\\t\\tHi! I'm Goran.\\n\\t\\t</span>\\n\\t\\t<br />\\n\\t\\tA <span class=\\"purple-text\\">frontend developer</span> that also likes to design.\\n\\t</h1>\\n\\n\\t<ArrowButton\\n\\t\\tcontent=\\"Learn more about me\\"\\n\\t\\turl=\\"#about\\"\\n\\t\\tarrowDirection={ArrowDirections.DOWN}\\n\\t\\textraClass=\\"mt-30 md:mt-60\\"\\n\\t/>\\n</section>\\n\\n<section class=\\"lg:flex lg:flex-row-reverse lg:-mr-30\\" id=\\"about\\">\\n\\t<AboutImage />\\n\\t<div class=\\"flex flex-col gap-15 max-w-lg lg:max-w-420 md:mr-px\\">\\n\\t\\t<h2 class=\\"text-40 md:text-80 mt-48 lg:mt-0 mb-15 lg:mb-30 font-bold\\">\\n\\t\\t\\t<span class=\\"purple-text\\">About</span> me\\n\\t\\t</h2>\\n\\t\\t<p>\\n\\t\\t\\tI\u2019m a frontend developer who also likes to design. My philosophy is that everything should be\\n\\t\\t\\tvisually pleasing and easy to use, besides just doing its job.\\n\\t\\t</p>\\n\\t\\t<p>\\n\\t\\t\\tThroughout the years I tried a lot of technologies and fields in development, but what won at\\n\\t\\t\\tthe end was web development (mostly frontend).\\n\\t\\t</p>\\n\\t\\t<p>\\n\\t\\t\\tDesign-wise I\u2019ve done some print design, but mostly I\u2019ve worked on digital design and UI/UX\\n\\t\\t\\tfor my personal projects.\\n\\t\\t</p>\\n\\t\\t<p>\\n\\t\\t\\tCurrently working at <a class=\\"underline \\" href=\\"https://infinum.com\\">Infinum</a> as a WordPress\\n\\t\\t\\tengineer, where I create custom Gutenberg block themes and work on the open-source Eightshift boilerplate.\\n\\t\\t</p>\\n\\t\\t<p>\\n\\t\\t\\tIn my free time I love to drink coffee, explore what\u2019s new in tech, make crazy projects and\\n\\t\\t\\tgame a bit here and there.\\n\\t\\t</p>\\n\\t\\t<ArrowButton content=\\"Read my CV\\" url=\\"/about\\" extraClass=\\"mt-15 md:mt-30\\" />\\n\\t\\t<ArrowButton content=\\"Explore my work\\" url=\\"#work\\" extraClass=\\"mt-15\\" arrowDirection={ArrowDirections.DOWN} />\\n\\t</div>\\n</section>\\n\\n<section class=\\"sm:grid sm:grid-cols-2 sm:gap-30 sm:auto-rows-auto\\" id=\\"work\\">\\n\\t<h2 class=\\"text-40 md:text-80 mt-48 sm:mt-0 mb-15 font-bold sm:max-w-sm\\">\\n\\t\\tSome of my <span class=\\"purple-text\\">work</span>\\n\\t</h2>\\n\\t<WorkShowcaseCard\\n\\t\\tname=\\"Goc's recipe book\\"\\n\\t\\turl=\\"#\\"\\n\\t\\timageUrl=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-home_workcard/recipes-light_CBuuzFsxnI.png?updatedAt=1627165988227\\"\\n\\t\\tmobileImageUrl=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-home_workcard/recipes-mobile-light_XWcpickYcWy.png?updatedAt=1627165988012\\"\\n\\t\\tdarkImageUrl=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-home_workcard/recipes-dark_dxtEc90MB.png?updatedAt=1627165987564\\"\\n\\t\\tdarkMobileImageUrl=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-home_workcard/recipes-mobile-dark_zfLf4dnSHD.png?updatedAt=1627165987852\\"\\n\\t\\tdesktopTextVerAlignBottom\\n\\t\\textraClass='sm:col-start-2 sm:row-start-1 sm:row-span-2'\\n\\t\\tlightColor='#CE0F4C'\\n\\t/>\\n\\t<WorkShowcaseCard\\n\\t\\tname=\\"SocialByte\\"\\n\\t\\turl=\\"#\\"\\n\\t\\timageUrl=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-home_workcard/socialbyte-light_6Fs5-KvVHZ.png?updatedAt=1627165987943\\"\\n\\t\\tmobileImageUrl=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-home_workcard/socialbyte-mobile-light_46G2pDGDGZ6.png?updatedAt=1627165988015\\"\\n\\t\\tdarkImageUrl=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-home_workcard/socialbyte-dark_KM_w1H6OX.png?updatedAt=1627165987738\\"\\n\\t\\tdarkMobileImageUrl=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-home_workcard/socialbyte-mobile-dark_QZq8k78asl.png?updatedAt=1627165987903\\"\\n\\t\\tdesktopTextHorAlignEnd\\n\\t\\tdesktopTextVerAlignBottom\\n\\t/>\\n\\t<WorkShowcaseCard\\n\\t\\tname=\\"STEM Games 2019\\"\\n\\t\\turl=\\"#\\"\\n\\t\\timageUrl=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-home_workcard/stemgames-light_k4ULUo0nk8.png?updatedAt=1627165989027\\"\\n\\t\\tmobileImageUrl=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-home_workcard/stemgames-mobile-light_13ucLiqCy.png?updatedAt=1627165989031\\"\\n\\t\\tdarkImageUrl=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-home_workcard/stemgames-dark_kgvG_ykqN.png?updatedAt=1627165988771\\"\\n\\t\\tdarkMobileImageUrl=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-home_workcard/stemgames-mobile-dark_1hAUMDfN0W.png?updatedAt=1627165988788\\"\\n\\t\\tdesktopTextHorAlignEnd\\n\\t\\textraClass='sm:row-span-2'\\n\\t\\tlightColor='#06354A'\\n\\t/>\\n\\t<WorkShowcaseCard\\n\\t\\tname=\\"Browser piano\\"\\n\\t\\turl=\\"#\\"\\n\\t\\timageUrl=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-home_workcard/piano-light_UmAFBIU3D.png?updatedAt=1627165985952\\"\\n\\t\\tmobileImageUrl=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-home_workcard/piano-mobile-light_unCuRJAfVG.png?updatedAt=1627165986293\\"\\n\\t\\tdarkImageUrl=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-home_workcard/piano-dark_Kr8fRagSe6.png?updatedAt=1627165985722\\"\\n\\t\\tdarkMobileImageUrl=\\"https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-home_workcard/piano-mobile-dark_yIBhRQQBTG.png?updatedAt=1627165986143\\"\\n\\t/>\\n</section>\\n\\n<style>section{padding-bottom:3.75rem;padding-top:7.5rem}@media (min-width:768px){section{padding-bottom:3.75rem;padding-top:11.25rem}}#about p{font-size:.875rem;line-height:1.5}@media (min-width:768px){#about p{font-size:1.125rem;line-height:1.5}}a.underline{-webkit-text-decoration-color:#322eff;text-decoration-color:#322eff;text-decoration-thickness:2px;text-underline-offset:.1em}@media (prefers-color-scheme:dark){a.underline{-webkit-text-decoration-color:#7270ff;text-decoration-color:#7270ff}}</style>\\n"],"names":[],"mappings":"AAyGO,mCAAO,CAAC,eAAe,OAAO,CAAC,YAAY,MAAM,CAAC,MAAM,AAAC,WAAW,KAAK,CAAC,CAAC,mCAAO,CAAC,eAAe,OAAO,CAAC,YAAY,QAAQ,CAAC,CAAC,oBAAM,CAAC,eAAC,CAAC,UAAU,OAAO,CAAC,YAAY,GAAG,CAAC,MAAM,AAAC,WAAW,KAAK,CAAC,CAAC,oBAAM,CAAC,eAAC,CAAC,UAAU,QAAQ,CAAC,YAAY,GAAG,CAAC,CAAC,CAAC,sCAAU,CAAC,8BAA8B,OAAO,CAAC,sBAAsB,OAAO,CAAC,0BAA0B,GAAG,CAAC,sBAAsB,IAAI,CAAC,MAAM,AAAC,sBAAsB,IAAI,CAAC,CAAC,CAAC,sCAAU,CAAC,8BAA8B,OAAO,CAAC,sBAAsB,OAAO,CAAC,CAAC"}`
};
var Routes = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css);
  return `${$$result.head += `${$$result.title = `<title>Goran Alkovi\u0107 - Developer &amp; designer</title>`, ""}<meta name="${"description"}" content="${"Goran Alkovi\u0107 - a frontend developer that also likes to design."}" data-svelte="svelte-bunc03">`, ""}

<section id="${"intro"}" class="${"mt-120 md:mt-60 mb-100 md:mb-100 svelte-15brwd"}"><h1 class="${"text-48 md:text-96 font-bold max-w-[68rem]"}"><span class="${"text-transparent text-stroke-black dark:text-stroke-white text-stroke-DEFAULT"}">Hi! I&#39;m Goran.
		</span>
		<br>
		A <span class="${"purple-text"}">frontend developer</span> that also likes to design.
	</h1>

	${validate_component(ArrowButton, "ArrowButton").$$render($$result, {
    content: "Learn more about me",
    url: "#about",
    arrowDirection: ArrowDirections.DOWN,
    extraClass: "mt-30 md:mt-60"
  }, {}, {})}</section>

<section class="${"lg:flex lg:flex-row-reverse lg:-mr-30 svelte-15brwd"}" id="${"about"}">${validate_component(AboutImage, "AboutImage").$$render($$result, {}, {}, {})}
	<div class="${"flex flex-col gap-15 max-w-lg lg:max-w-420 md:mr-px"}"><h2 class="${"text-40 md:text-80 mt-48 lg:mt-0 mb-15 lg:mb-30 font-bold"}"><span class="${"purple-text"}">About</span> me
		</h2>
		<p class="${"svelte-15brwd"}">I\u2019m a frontend developer who also likes to design. My philosophy is that everything should be
			visually pleasing and easy to use, besides just doing its job.
		</p>
		<p class="${"svelte-15brwd"}">Throughout the years I tried a lot of technologies and fields in development, but what won at
			the end was web development (mostly frontend).
		</p>
		<p class="${"svelte-15brwd"}">Design-wise I\u2019ve done some print design, but mostly I\u2019ve worked on digital design and UI/UX
			for my personal projects.
		</p>
		<p class="${"svelte-15brwd"}">Currently working at <a class="${"underline  svelte-15brwd"}" href="${"https://infinum.com"}">Infinum</a> as a WordPress
			engineer, where I create custom Gutenberg block themes and work on the open-source Eightshift boilerplate.
		</p>
		<p class="${"svelte-15brwd"}">In my free time I love to drink coffee, explore what\u2019s new in tech, make crazy projects and
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

<section class="${"sm:grid sm:grid-cols-2 sm:gap-30 sm:auto-rows-auto svelte-15brwd"}" id="${"work"}"><h2 class="${"text-40 md:text-80 mt-48 sm:mt-0 mb-15 font-bold sm:max-w-sm"}">Some of my <span class="${"purple-text"}">work</span></h2>
	${validate_component(WorkShowcaseCard, "WorkShowcaseCard").$$render($$result, {
    name: "Goc's recipe book",
    url: "#",
    imageUrl: "https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-home_workcard/recipes-light_CBuuzFsxnI.png?updatedAt=1627165988227",
    mobileImageUrl: "https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-home_workcard/recipes-mobile-light_XWcpickYcWy.png?updatedAt=1627165988012",
    darkImageUrl: "https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-home_workcard/recipes-dark_dxtEc90MB.png?updatedAt=1627165987564",
    darkMobileImageUrl: "https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-home_workcard/recipes-mobile-dark_zfLf4dnSHD.png?updatedAt=1627165987852",
    desktopTextVerAlignBottom: true,
    extraClass: "sm:col-start-2 sm:row-start-1 sm:row-span-2",
    lightColor: "#CE0F4C"
  }, {}, {})}
	${validate_component(WorkShowcaseCard, "WorkShowcaseCard").$$render($$result, {
    name: "SocialByte",
    url: "#",
    imageUrl: "https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-home_workcard/socialbyte-light_6Fs5-KvVHZ.png?updatedAt=1627165987943",
    mobileImageUrl: "https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-home_workcard/socialbyte-mobile-light_46G2pDGDGZ6.png?updatedAt=1627165988015",
    darkImageUrl: "https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-home_workcard/socialbyte-dark_KM_w1H6OX.png?updatedAt=1627165987738",
    darkMobileImageUrl: "https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-home_workcard/socialbyte-mobile-dark_QZq8k78asl.png?updatedAt=1627165987903",
    desktopTextHorAlignEnd: true,
    desktopTextVerAlignBottom: true
  }, {}, {})}
	${validate_component(WorkShowcaseCard, "WorkShowcaseCard").$$render($$result, {
    name: "STEM Games 2019",
    url: "#",
    imageUrl: "https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-home_workcard/stemgames-light_k4ULUo0nk8.png?updatedAt=1627165989027",
    mobileImageUrl: "https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-home_workcard/stemgames-mobile-light_13ucLiqCy.png?updatedAt=1627165989031",
    darkImageUrl: "https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-home_workcard/stemgames-dark_kgvG_ykqN.png?updatedAt=1627165988771",
    darkMobileImageUrl: "https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-home_workcard/stemgames-mobile-dark_1hAUMDfN0W.png?updatedAt=1627165988788",
    desktopTextHorAlignEnd: true,
    extraClass: "sm:row-span-2",
    lightColor: "#06354A"
  }, {}, {})}
	${validate_component(WorkShowcaseCard, "WorkShowcaseCard").$$render($$result, {
    name: "Browser piano",
    url: "#",
    imageUrl: "https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-home_workcard/piano-light_UmAFBIU3D.png?updatedAt=1627165985952",
    mobileImageUrl: "https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-home_workcard/piano-mobile-light_unCuRJAfVG.png?updatedAt=1627165986293",
    darkImageUrl: "https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-home_workcard/piano-dark_Kr8fRagSe6.png?updatedAt=1627165985722",
    darkMobileImageUrl: "https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-home_workcard/piano-mobile-dark_yIBhRQQBTG.png?updatedAt=1627165986143"
  }, {}, {})}
</section>`;
});
var index = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Routes
});
var browser = false;
var dev = false;
var hydrate = dev;
var router = browser;
var prerender = true;
var About = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${$$result.head += `${$$result.title = `<title>About</title>`, ""}`, ""}

About.`;
});
var about = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": About,
  hydrate,
  router,
  prerender
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
