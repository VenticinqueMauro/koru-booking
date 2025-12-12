var Pe = Object.defineProperty;
var Ee = (a, t, e) => t in a ? Pe(a, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : a[t] = e;
var c = (a, t, e) => Ee(a, typeof t != "symbol" ? t + "" : t, e);
function Oe(a, t) {
  var e = {};
  for (var n in a) Object.prototype.hasOwnProperty.call(a, n) && t.indexOf(n) < 0 && (e[n] = a[n]);
  if (a != null && typeof Object.getOwnPropertySymbols == "function")
    for (var r = 0, n = Object.getOwnPropertySymbols(a); r < n.length; r++)
      t.indexOf(n[r]) < 0 && Object.prototype.propertyIsEnumerable.call(a, n[r]) && (e[n[r]] = a[n[r]]);
  return e;
}
function j(a, t, e, n) {
  function r(i) {
    return i instanceof e ? i : new e(function(s) {
      s(i);
    });
  }
  return new (e || (e = Promise))(function(i, s) {
    function o(h) {
      try {
        u(n.next(h));
      } catch (m) {
        s(m);
      }
    }
    function d(h) {
      try {
        u(n.throw(h));
      } catch (m) {
        s(m);
      }
    }
    function u(h) {
      h.done ? i(h.value) : r(h.value).then(o, d);
    }
    u((n = n.apply(a, [])).next());
  });
}
class Ne {
  /**
   * Creates a new widget instance.
   * Extracts configuration from script tag data attributes.
   *
   * @param widgetOptions - Widget configuration including name, version, and options
   * @throws {Error} If script tag or required data attributes are missing
   *
   * @example
   * ```typescript
   * constructor() {
   *   super({
   *     name: 'my-widget',
   *     version: '1.0.0',
   *     options: {
   *       cache: true,
   *       debug: true,
   *       analytics: false
   *     }
   *   });
   * }
   * ```
   */
  constructor(t) {
    this.config = {}, this.authData = null, this.container = null, this.isInitialized = !1, this.widgetName = t.name, this.widgetVersion = t.version, this.options = Object.assign({ cache: !0, cacheDuration: 3600, retryAttempts: 3, retryDelay: 1e3, analytics: !1, debug: !1 }, t.options);
    const e = this.getCurrentScript();
    if (!e)
      throw new Error("[Widget SDK] Could not find script tag");
    if (this.websiteId = e.getAttribute("data-website-id") || "", this.appId = e.getAttribute("data-app-id") || "", this.koruUrl = e.getAttribute("data-app-manager-url") || "", !this.websiteId || !this.appId || !this.koruUrl)
      throw new Error("[Widget SDK] Missing required data attributes");
    this.log("SDK initialized", { websiteId: this.websiteId, appId: this.appId });
  }
  /**
   * Starts the widget lifecycle.
   * Waits for DOM, authorizes with Koru, then calls onInit and onRender hooks.
   *
   * @returns Promise that resolves when widget is fully initialized
   * @throws {Error} If authorization fails or lifecycle hooks throw errors
   *
   * @example
   * ```typescript
   * const widget = new MyWidget();
   * await widget.start();
   * ```
   */
  start() {
    return j(this, void 0, void 0, function* () {
      try {
        if (yield this.waitForDOM(), this.authData = yield this.authorize(), !this.authData.authorized) {
          this.log("Widget not authorized");
          return;
        }
        this.config = this.authData.config, yield this.onInit(this.config), yield this.onRender(this.config), this.isInitialized = !0, this.log("Widget started successfully"), this.options.analytics && this.track("widget_loaded", {
          widget: this.widgetName,
          version: this.widgetVersion
        });
      } catch (t) {
        this.handleError("Failed to start widget", t);
      }
    });
  }
  /**
   * Stops the widget and performs cleanup.
   * Calls the onDestroy hook to remove DOM elements and event listeners.
   *
   * @returns Promise that resolves when cleanup is complete
   *
   * @example
   * ```typescript
   * await widget.stop();
   * ```
   */
  stop() {
    return j(this, void 0, void 0, function* () {
      try {
        yield this.onDestroy(), this.isInitialized = !1, this.log("Widget stopped");
      } catch (t) {
        this.handleError("Failed to stop widget", t);
      }
    });
  }
  /**
   * Reloads the widget with fresh configuration from Koru.
   * Clears cache and re-authorizes. Calls onConfigUpdate if implemented, otherwise re-renders.
   *
   * @returns Promise that resolves when reload is complete
   *
   * @example
   * ```typescript
   * // Reload widget when configuration changes
   * await widget.reload();
   * ```
   */
  reload() {
    return j(this, void 0, void 0, function* () {
      try {
        if (this.clearCache(), this.authData = yield this.authorize(), !this.authData.authorized)
          return;
        const t = this.authData.config;
        this.onConfigUpdate ? yield this.onConfigUpdate(t) : (yield this.onDestroy(), yield this.onRender(t)), this.config = t, this.log("Widget reloaded");
      } catch (t) {
        this.handleError("Failed to reload widget", t);
      }
    });
  }
  // ==================== AUTHORIZATION ====================
  authorize() {
    return j(this, void 0, void 0, function* () {
      if (typeof window < "u" && window.__KORU_PREVIEW_CONFIG__)
        return this.log("Using Koru preview config"), {
          authorized: !0,
          config: window.__KORU_PREVIEW_CONFIG__,
          token: "preview-mode",
          app: {
            id: this.appId,
            name: "Preview Mode",
            description: "Widget running in Koru preview mode"
          },
          website: {
            id: this.websiteId,
            url: window.location.origin,
            is_ecommerce: !1,
            customer: "preview"
          }
        };
      if (this.options.cache) {
        const e = this.getFromCache();
        if (e)
          return this.log("Using cached authorization"), e;
      }
      let t = null;
      for (let e = 1; e <= this.options.retryAttempts; e++)
        try {
          this.log(`Authorization attempt ${e}/${this.options.retryAttempts}`);
          const n = `${this.koruUrl}/api/auth/widget?website_id=${this.websiteId}&app_id=${this.appId}`, r = yield fetch(n, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
          });
          if (!r.ok)
            throw new Error(`Authorization failed: ${r.status}`);
          const i = yield r.json();
          return this.options.cache && this.saveToCache(i), i;
        } catch (n) {
          t = n, this.log(`Authorization attempt ${e} failed:`, n), e < this.options.retryAttempts && (yield this.sleep(this.options.retryDelay));
        }
      throw t || new Error("Authorization failed");
    });
  }
  // ==================== HELPER METHODS ====================
  /**
   * Creates a DOM element with the specified tag and properties.
   * Provides a convenient way to build UI elements with type safety.
   *
   * @template K - HTML element tag name
   * @param tag - HTML tag name (e.g., 'div', 'button', 'span')
   * @param props - Element properties including className, style, onClick, and children
   * @returns The created HTML element
   *
   * @example
   * ```typescript
   * // Create a button with click handler
   * const button = this.createElement('button', {
   *   className: 'btn btn-primary',
   *   style: { padding: '10px', backgroundColor: 'blue' },
   *   onClick: () => console.log('clicked'),
   *   children: ['Click Me']
   * });
   *
   * // Create nested elements
   * const card = this.createElement('div', {
   *   className: 'card',
   *   children: [
   *     this.createElement('h2', { children: ['Title'] }),
   *     this.createElement('p', { children: ['Description'] })
   *   ]
   * });
   * ```
   */
  createElement(t, e) {
    const n = document.createElement(t);
    if (e) {
      const { className: r, style: i, onClick: s, children: o } = e, d = Oe(e, ["className", "style", "onClick", "children"]);
      r && (n.className = r), i && Object.assign(n.style, i), s && n.addEventListener("click", s), o && o.forEach((u) => {
        typeof u == "string" ? n.appendChild(document.createTextNode(u)) : n.appendChild(u);
      }), Object.assign(n, d);
    }
    return n;
  }
  /**
   * Detects if the current device is a mobile device.
   * Checks user agent string for common mobile device identifiers.
   *
   * @returns true if mobile device, false otherwise
   *
   * @example
   * ```typescript
   * async onRender(config) {
   *   const layout = this.isMobile() ? 'mobile' : 'desktop';
   *   this.container = this.createElement('div', {
   *     className: `widget-${layout}`
   *   });
   * }
   * ```
   */
  isMobile() {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
  /**
   * Tracks an analytics event to Koru.
   * Only sends events if analytics option is enabled.
   *
   * @param eventName - Name of the event to track
   * @param eventData - Optional event metadata
   *
   * @example
   * ```typescript
   * // Track button click
   * this.track('button_clicked', {
   *   button_id: 'cta',
   *   timestamp: Date.now()
   * });
   *
   * // Track page view
   * this.track('page_viewed', {
   *   page: 'home'
   * });
   * ```
   */
  track(t, e) {
    if (this.options.analytics)
      try {
        const n = `${this.koruUrl}/api/analytics`;
        fetch(n, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            website_id: this.websiteId,
            app_id: this.appId,
            event_type: t,
            event_data: Object.assign({ widget: this.widgetName, version: this.widgetVersion }, e)
          })
        }).catch((r) => this.log("Analytics error:", r));
      } catch (n) {
        this.log("Failed to track event:", n);
      }
  }
  /**
   * Logs a debug message to the console.
   * Only logs if debug option is enabled.
   *
   * @param message - Message to log
   * @param args - Additional arguments to log
   *
   * @example
   * ```typescript
   * this.log('Widget initialized', { config: this.config });
   * this.log('Fetching data from', apiUrl);
   * ```
   */
  log(t, ...e) {
    this.options.debug && console.log(`[${this.widgetName}]`, t, ...e);
  }
  handleError(t, e) {
    console.error(`[${this.widgetName}] ${t}:`, e), this.options.analytics && this.track("widget_error", {
      error: e instanceof Error ? e.message : String(e),
      message: t
    });
  }
  // ==================== PRIVATE HELPERS ====================
  getCurrentScript() {
    return document.currentScript;
  }
  waitForDOM() {
    return j(this, void 0, void 0, function* () {
      if (document.readyState === "loading")
        return new Promise((t) => {
          document.addEventListener("DOMContentLoaded", () => t());
        });
    });
  }
  sleep(t) {
    return new Promise((e) => setTimeout(e, t));
  }
  getCacheKey() {
    return `koru_widget_${this.websiteId}_${this.appId}`;
  }
  getFromCache() {
    try {
      const t = this.getCacheKey(), e = localStorage.getItem(t);
      if (!e)
        return null;
      const { data: n, timestamp: r } = JSON.parse(e);
      return (Date.now() - r) / 1e3 > this.options.cacheDuration ? (this.clearCache(), null) : n;
    } catch {
      return null;
    }
  }
  saveToCache(t) {
    try {
      const e = this.getCacheKey();
      localStorage.setItem(e, JSON.stringify({
        data: t,
        timestamp: Date.now()
      }));
    } catch (e) {
      this.log("Failed to cache auth data:", e);
    }
  }
  clearCache() {
    try {
      const t = this.getCacheKey();
      localStorage.removeItem(t);
    } catch {
    }
  }
}
const Le = "https://koru-booking.onrender.com";
class He {
  constructor(t, e) {
    this.credentials = null, this.baseURL = t || Le, this.credentials = e || null;
  }
  /**
   * Set Koru credentials for authentication
   */
  setCredentials(t) {
    this.credentials = t;
  }
  /**
   * Get headers with Koru authentication
   */
  getHeaders() {
    const t = {
      "Content-Type": "application/json"
    };
    return this.credentials && (t["X-Koru-Website-Id"] = this.credentials.websiteId, t["X-Koru-App-Id"] = this.credentials.appId), t;
  }
  /**
   * Obtiene todos los servicios activos
   */
  async getServices() {
    const t = await fetch(`${this.baseURL}/api/services`, {
      headers: this.getHeaders()
    });
    if (!t.ok)
      throw new Error("Error al cargar servicios");
    return t.json();
  }
  /**
   * Obtiene los slots disponibles para un servicio en una fecha
   */
  async getSlots(t, e) {
    const n = await fetch(
      `${this.baseURL}/api/slots?serviceId=${t}&date=${e}`,
      {
        headers: this.getHeaders()
      }
    );
    if (!n.ok)
      throw new Error("Error al cargar disponibilidad");
    return (await n.json()).slots;
  }
  /**
   * Crea una nueva reserva
   */
  async createBooking(t) {
    const e = await fetch(`${this.baseURL}/api/bookings`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(t)
    });
    if (!e.ok) {
      const n = await e.json();
      throw new Error(n.message || "Error al crear reserva");
    }
    return e.json();
  }
}
const G = (a, t) => new He(a, t), We = {
  clock: `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.5"/>
      <path d="M8 4V8L10.5 10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  `,
  dollar: `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 2V14M5 5.5C5 4.67157 5.67157 4 6.5 4H9.5C10.3284 4 11 4.67157 11 5.5C11 6.32843 10.3284 7 9.5 7H6.5C5.67157 7 5 7.67157 5 8.5C5 9.32843 5.67157 10 6.5 10H9.5C10.3284 10 11 10.6716 11 11.5C11 12.3284 10.3284 13 9.5 13H6.5C5.67157 13 5 12.3284 5 11.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  `,
  calendar: `
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2.5" y="3.5" width="13" height="12" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
      <path d="M2.5 6.5H15.5" stroke="currentColor" stroke-width="1.5"/>
      <path d="M5.5 2V5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M12.5 2V5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  `,
  checkCircle: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2"/>
      <path d="M6 10L9 13L14 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `,
  arrowLeft: `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `,
  sparkles: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 2L11 8L10 14L9 8L10 2Z" fill="currentColor"/>
      <path d="M18 10L12 11L6 10L12 9L18 10Z" fill="currentColor"/>
      <path d="M15 5L12 8L9 5L12 2L15 5Z" fill="currentColor" opacity="0.6"/>
      <path d="M15 15L12 12L9 15L12 18L15 15Z" fill="currentColor" opacity="0.6"/>
    </svg>
  `,
  user: `
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="9" cy="6" r="3" stroke="currentColor" stroke-width="1.5"/>
      <path d="M3 15C3 12.2386 5.23858 10 8 10H10C12.7614 10 15 12.2386 15 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  `,
  mail: `
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2.5" y="4.5" width="13" height="10" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
      <path d="M3 6L9 10L15 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  `,
  phone: `
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.5 2H7.5C7.77614 2 8 2.22386 8 2.5V5.5C8 5.77614 7.77614 6 7.5 6H5C4.44772 6 4 6.44772 4 7V7C4 10.866 7.13401 14 11 14V14C11.5523 14 12 13.5523 12 13V10.5C12 10.2239 12.2239 10 12.5 10H15.5C15.7761 10 16 10.2239 16 10.5V12.5C16 13.8807 14.8807 15 13.5 15H13C7.47715 15 3 10.5228 3 5V4.5C3 3.11929 4.11929 2 5.5 2Z" stroke="currentColor" stroke-width="1.5"/>
    </svg>
  `,
  note: `
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 6H13M5 9H13M5 12H10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <rect x="3.5" y="2.5" width="11" height="13" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
    </svg>
  `
};
function Y(a) {
  return We[a] || "";
}
class _e {
  constructor(t) {
    this.container = null, this.options = t;
  }
  render(t) {
    this.container = document.createElement("div"), this.container.className = "kb-service-selector";
    const e = document.createElement("div");
    e.className = "kb-services-header";
    const n = document.createElement("h2");
    n.className = "kb-step-title", n.textContent = "Selecciona tu servicio", e.appendChild(n);
    const r = document.createElement("p");
    r.className = "kb-step-subtitle", r.textContent = "Elige el servicio que mejor se adapte a tus necesidades", e.appendChild(r), this.container.appendChild(e);
    const i = document.createElement("div");
    i.className = `kb-services-${this.options.layout}`, this.options.services.forEach((s) => {
      const o = this.createServiceCard(s);
      i.appendChild(o);
    }), this.container.appendChild(i), t.appendChild(this.container);
  }
  createServiceCard(t) {
    const e = document.createElement("div");
    if (e.className = "kb-service-card", e.onclick = () => this.options.onSelect(t), t.imageUrl) {
      const o = document.createElement("img");
      o.src = t.imageUrl, o.alt = t.name, o.className = "kb-service-image", e.appendChild(o);
    }
    const n = document.createElement("div");
    n.className = "kb-service-content";
    const r = document.createElement("h3");
    r.className = "kb-service-name", r.textContent = t.name, n.appendChild(r);
    const i = document.createElement("div");
    i.className = "kb-service-details";
    const s = document.createElement("span");
    if (s.className = "kb-service-duration", s.innerHTML = `${Y("clock")} <span>${t.duration} min</span>`, i.appendChild(s), t.price) {
      const o = document.createElement("span");
      o.className = "kb-service-price", o.innerHTML = `$${t.price}`, i.appendChild(o);
    }
    return n.appendChild(i), e.appendChild(n), e.addEventListener("mouseenter", () => {
      e.style.borderColor = this.options.accentColor;
    }), e.addEventListener("mouseleave", () => {
      e.style.borderColor = "#e0e0e0";
    }), e;
  }
  destroy() {
    this.container && (this.container.remove(), this.container = null);
  }
}
function w(a) {
  const t = Object.prototype.toString.call(a);
  return a instanceof Date || typeof a == "object" && t === "[object Date]" ? new a.constructor(+a) : typeof a == "number" || t === "[object Number]" || typeof a == "string" || t === "[object String]" ? new Date(a) : /* @__PURE__ */ new Date(NaN);
}
function b(a, t) {
  return a instanceof Date ? new a.constructor(t) : new Date(t);
}
function Z(a, t) {
  const e = w(a);
  return isNaN(t) ? b(a, NaN) : (t && e.setDate(e.getDate() + t), e);
}
function he(a, t) {
  const e = w(a);
  if (isNaN(t)) return b(a, NaN);
  if (!t)
    return e;
  const n = e.getDate(), r = b(a, e.getTime());
  r.setMonth(e.getMonth() + t + 1, 0);
  const i = r.getDate();
  return n >= i ? r : (e.setFullYear(
    r.getFullYear(),
    r.getMonth(),
    n
  ), e);
}
const me = 6048e5, Ye = 864e5, Ie = 6e4, Se = 36e5, $e = 1e3;
let qe = {};
function q() {
  return qe;
}
function W(a, t) {
  var o, d, u, h;
  const e = q(), n = (t == null ? void 0 : t.weekStartsOn) ?? ((d = (o = t == null ? void 0 : t.locale) == null ? void 0 : o.options) == null ? void 0 : d.weekStartsOn) ?? e.weekStartsOn ?? ((h = (u = e.locale) == null ? void 0 : u.options) == null ? void 0 : h.weekStartsOn) ?? 0, r = w(a), i = r.getDay(), s = (i < n ? 7 : 0) + i - n;
  return r.setDate(r.getDate() - s), r.setHours(0, 0, 0, 0), r;
}
function $(a) {
  return W(a, { weekStartsOn: 1 });
}
function fe(a) {
  const t = w(a), e = t.getFullYear(), n = b(a, 0);
  n.setFullYear(e + 1, 0, 4), n.setHours(0, 0, 0, 0);
  const r = $(n), i = b(a, 0);
  i.setFullYear(e, 0, 4), i.setHours(0, 0, 0, 0);
  const s = $(i);
  return t.getTime() >= r.getTime() ? e + 1 : t.getTime() >= s.getTime() ? e : e - 1;
}
function A(a) {
  const t = w(a);
  return t.setHours(0, 0, 0, 0), t;
}
function Q(a) {
  const t = w(a), e = new Date(
    Date.UTC(
      t.getFullYear(),
      t.getMonth(),
      t.getDate(),
      t.getHours(),
      t.getMinutes(),
      t.getSeconds(),
      t.getMilliseconds()
    )
  );
  return e.setUTCFullYear(t.getFullYear()), +a - +e;
}
function Be(a, t) {
  const e = A(a), n = A(t), r = +e - Q(e), i = +n - Q(n);
  return Math.round((r - i) / Ye);
}
function Fe(a) {
  const t = fe(a), e = b(a, 0);
  return e.setFullYear(t, 0, 4), e.setHours(0, 0, 0, 0), $(e);
}
function se(a, t) {
  const e = A(a), n = A(t);
  return +e == +n;
}
function Re(a) {
  return a instanceof Date || typeof a == "object" && Object.prototype.toString.call(a) === "[object Date]";
}
function je(a) {
  if (!Re(a) && typeof a != "number")
    return !1;
  const t = w(a);
  return !isNaN(Number(t));
}
function Ae(a) {
  const t = w(a), e = t.getMonth();
  return t.setFullYear(t.getFullYear(), e + 1, 0), t.setHours(23, 59, 59, 999), t;
}
function Qe(a) {
  const t = w(a);
  return t.setDate(1), t.setHours(0, 0, 0, 0), t;
}
function Ve(a) {
  const t = w(a), e = b(a, 0);
  return e.setFullYear(t.getFullYear(), 0, 1), e.setHours(0, 0, 0, 0), e;
}
const Xe = {
  lessThanXSeconds: {
    one: "less than a second",
    other: "less than {{count}} seconds"
  },
  xSeconds: {
    one: "1 second",
    other: "{{count}} seconds"
  },
  halfAMinute: "half a minute",
  lessThanXMinutes: {
    one: "less than a minute",
    other: "less than {{count}} minutes"
  },
  xMinutes: {
    one: "1 minute",
    other: "{{count}} minutes"
  },
  aboutXHours: {
    one: "about 1 hour",
    other: "about {{count}} hours"
  },
  xHours: {
    one: "1 hour",
    other: "{{count}} hours"
  },
  xDays: {
    one: "1 day",
    other: "{{count}} days"
  },
  aboutXWeeks: {
    one: "about 1 week",
    other: "about {{count}} weeks"
  },
  xWeeks: {
    one: "1 week",
    other: "{{count}} weeks"
  },
  aboutXMonths: {
    one: "about 1 month",
    other: "about {{count}} months"
  },
  xMonths: {
    one: "1 month",
    other: "{{count}} months"
  },
  aboutXYears: {
    one: "about 1 year",
    other: "about {{count}} years"
  },
  xYears: {
    one: "1 year",
    other: "{{count}} years"
  },
  overXYears: {
    one: "over 1 year",
    other: "over {{count}} years"
  },
  almostXYears: {
    one: "almost 1 year",
    other: "almost {{count}} years"
  }
}, Ge = (a, t, e) => {
  let n;
  const r = Xe[a];
  return typeof r == "string" ? n = r : t === 1 ? n = r.one : n = r.other.replace("{{count}}", t.toString()), e != null && e.addSuffix ? e.comparison && e.comparison > 0 ? "in " + n : n + " ago" : n;
};
function S(a) {
  return (t = {}) => {
    const e = t.width ? String(t.width) : a.defaultWidth;
    return a.formats[e] || a.formats[a.defaultWidth];
  };
}
const ze = {
  full: "EEEE, MMMM do, y",
  long: "MMMM do, y",
  medium: "MMM d, y",
  short: "MM/dd/yyyy"
}, Ke = {
  full: "h:mm:ss a zzzz",
  long: "h:mm:ss a z",
  medium: "h:mm:ss a",
  short: "h:mm a"
}, Ue = {
  full: "{{date}} 'at' {{time}}",
  long: "{{date}} 'at' {{time}}",
  medium: "{{date}}, {{time}}",
  short: "{{date}}, {{time}}"
}, Je = {
  date: S({
    formats: ze,
    defaultWidth: "full"
  }),
  time: S({
    formats: Ke,
    defaultWidth: "full"
  }),
  dateTime: S({
    formats: Ue,
    defaultWidth: "full"
  })
}, Ze = {
  lastWeek: "'last' eeee 'at' p",
  yesterday: "'yesterday at' p",
  today: "'today at' p",
  tomorrow: "'tomorrow at' p",
  nextWeek: "eeee 'at' p",
  other: "P"
}, et = (a, t, e, n) => Ze[a];
function P(a) {
  return (t, e) => {
    const n = e != null && e.context ? String(e.context) : "standalone";
    let r;
    if (n === "formatting" && a.formattingValues) {
      const s = a.defaultFormattingWidth || a.defaultWidth, o = e != null && e.width ? String(e.width) : s;
      r = a.formattingValues[o] || a.formattingValues[s];
    } else {
      const s = a.defaultWidth, o = e != null && e.width ? String(e.width) : a.defaultWidth;
      r = a.values[o] || a.values[s];
    }
    const i = a.argumentCallback ? a.argumentCallback(t) : t;
    return r[i];
  };
}
const tt = {
  narrow: ["B", "A"],
  abbreviated: ["BC", "AD"],
  wide: ["Before Christ", "Anno Domini"]
}, nt = {
  narrow: ["1", "2", "3", "4"],
  abbreviated: ["Q1", "Q2", "Q3", "Q4"],
  wide: ["1st quarter", "2nd quarter", "3rd quarter", "4th quarter"]
}, rt = {
  narrow: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"],
  abbreviated: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ],
  wide: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ]
}, at = {
  narrow: ["S", "M", "T", "W", "T", "F", "S"],
  short: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
  abbreviated: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  wide: [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ]
}, it = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "mi",
    noon: "n",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "midnight",
    noon: "noon",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night"
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "midnight",
    noon: "noon",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night"
  }
}, st = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "mi",
    noon: "n",
    morning: "in the morning",
    afternoon: "in the afternoon",
    evening: "in the evening",
    night: "at night"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "midnight",
    noon: "noon",
    morning: "in the morning",
    afternoon: "in the afternoon",
    evening: "in the evening",
    night: "at night"
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "midnight",
    noon: "noon",
    morning: "in the morning",
    afternoon: "in the afternoon",
    evening: "in the evening",
    night: "at night"
  }
}, ot = (a, t) => {
  const e = Number(a), n = e % 100;
  if (n > 20 || n < 10)
    switch (n % 10) {
      case 1:
        return e + "st";
      case 2:
        return e + "nd";
      case 3:
        return e + "rd";
    }
  return e + "th";
}, ct = {
  ordinalNumber: ot,
  era: P({
    values: tt,
    defaultWidth: "wide"
  }),
  quarter: P({
    values: nt,
    defaultWidth: "wide",
    argumentCallback: (a) => a - 1
  }),
  month: P({
    values: rt,
    defaultWidth: "wide"
  }),
  day: P({
    values: at,
    defaultWidth: "wide"
  }),
  dayPeriod: P({
    values: it,
    defaultWidth: "wide",
    formattingValues: st,
    defaultFormattingWidth: "wide"
  })
};
function E(a) {
  return (t, e = {}) => {
    const n = e.width, r = n && a.matchPatterns[n] || a.matchPatterns[a.defaultMatchWidth], i = t.match(r);
    if (!i)
      return null;
    const s = i[0], o = n && a.parsePatterns[n] || a.parsePatterns[a.defaultParseWidth], d = Array.isArray(o) ? lt(o, (m) => m.test(s)) : (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- I challange you to fix the type
      dt(o, (m) => m.test(s))
    );
    let u;
    u = a.valueCallback ? a.valueCallback(d) : d, u = e.valueCallback ? (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- I challange you to fix the type
      e.valueCallback(u)
    ) : u;
    const h = t.slice(s.length);
    return { value: u, rest: h };
  };
}
function dt(a, t) {
  for (const e in a)
    if (Object.prototype.hasOwnProperty.call(a, e) && t(a[e]))
      return e;
}
function lt(a, t) {
  for (let e = 0; e < a.length; e++)
    if (t(a[e]))
      return e;
}
function pe(a) {
  return (t, e = {}) => {
    const n = t.match(a.matchPattern);
    if (!n) return null;
    const r = n[0], i = t.match(a.parsePattern);
    if (!i) return null;
    let s = a.valueCallback ? a.valueCallback(i[0]) : i[0];
    s = e.valueCallback ? e.valueCallback(s) : s;
    const o = t.slice(r.length);
    return { value: s, rest: o };
  };
}
const ut = /^(\d+)(th|st|nd|rd)?/i, ht = /\d+/i, mt = {
  narrow: /^(b|a)/i,
  abbreviated: /^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
  wide: /^(before christ|before common era|anno domini|common era)/i
}, ft = {
  any: [/^b/i, /^(a|c)/i]
}, pt = {
  narrow: /^[1234]/i,
  abbreviated: /^q[1234]/i,
  wide: /^[1234](th|st|nd|rd)? quarter/i
}, gt = {
  any: [/1/i, /2/i, /3/i, /4/i]
}, wt = {
  narrow: /^[jfmasond]/i,
  abbreviated: /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
  wide: /^(january|february|march|april|may|june|july|august|september|october|november|december)/i
}, bt = {
  narrow: [
    /^j/i,
    /^f/i,
    /^m/i,
    /^a/i,
    /^m/i,
    /^j/i,
    /^j/i,
    /^a/i,
    /^s/i,
    /^o/i,
    /^n/i,
    /^d/i
  ],
  any: [
    /^ja/i,
    /^f/i,
    /^mar/i,
    /^ap/i,
    /^may/i,
    /^jun/i,
    /^jul/i,
    /^au/i,
    /^s/i,
    /^o/i,
    /^n/i,
    /^d/i
  ]
}, yt = {
  narrow: /^[smtwf]/i,
  short: /^(su|mo|tu|we|th|fr|sa)/i,
  abbreviated: /^(sun|mon|tue|wed|thu|fri|sat)/i,
  wide: /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i
}, kt = {
  narrow: [/^s/i, /^m/i, /^t/i, /^w/i, /^t/i, /^f/i, /^s/i],
  any: [/^su/i, /^m/i, /^tu/i, /^w/i, /^th/i, /^f/i, /^sa/i]
}, vt = {
  narrow: /^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,
  any: /^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i
}, xt = {
  any: {
    am: /^a/i,
    pm: /^p/i,
    midnight: /^mi/i,
    noon: /^no/i,
    morning: /morning/i,
    afternoon: /afternoon/i,
    evening: /evening/i,
    night: /night/i
  }
}, Ct = {
  ordinalNumber: pe({
    matchPattern: ut,
    parsePattern: ht,
    valueCallback: (a) => parseInt(a, 10)
  }),
  era: E({
    matchPatterns: mt,
    defaultMatchWidth: "wide",
    parsePatterns: ft,
    defaultParseWidth: "any"
  }),
  quarter: E({
    matchPatterns: pt,
    defaultMatchWidth: "wide",
    parsePatterns: gt,
    defaultParseWidth: "any",
    valueCallback: (a) => a + 1
  }),
  month: E({
    matchPatterns: wt,
    defaultMatchWidth: "wide",
    parsePatterns: bt,
    defaultParseWidth: "any"
  }),
  day: E({
    matchPatterns: yt,
    defaultMatchWidth: "wide",
    parsePatterns: kt,
    defaultParseWidth: "any"
  }),
  dayPeriod: E({
    matchPatterns: vt,
    defaultMatchWidth: "any",
    parsePatterns: xt,
    defaultParseWidth: "any"
  })
}, ge = {
  code: "en-US",
  formatDistance: Ge,
  formatLong: Je,
  formatRelative: et,
  localize: ct,
  match: Ct,
  options: {
    weekStartsOn: 0,
    firstWeekContainsDate: 1
  }
};
function Mt(a) {
  const t = w(a);
  return Be(t, Ve(t)) + 1;
}
function we(a) {
  const t = w(a), e = +$(t) - +Fe(t);
  return Math.round(e / me) + 1;
}
function ee(a, t) {
  var h, m, C, D;
  const e = w(a), n = e.getFullYear(), r = q(), i = (t == null ? void 0 : t.firstWeekContainsDate) ?? ((m = (h = t == null ? void 0 : t.locale) == null ? void 0 : h.options) == null ? void 0 : m.firstWeekContainsDate) ?? r.firstWeekContainsDate ?? ((D = (C = r.locale) == null ? void 0 : C.options) == null ? void 0 : D.firstWeekContainsDate) ?? 1, s = b(a, 0);
  s.setFullYear(n + 1, 0, i), s.setHours(0, 0, 0, 0);
  const o = W(s, t), d = b(a, 0);
  d.setFullYear(n, 0, i), d.setHours(0, 0, 0, 0);
  const u = W(d, t);
  return e.getTime() >= o.getTime() ? n + 1 : e.getTime() >= u.getTime() ? n : n - 1;
}
function Dt(a, t) {
  var o, d, u, h;
  const e = q(), n = (t == null ? void 0 : t.firstWeekContainsDate) ?? ((d = (o = t == null ? void 0 : t.locale) == null ? void 0 : o.options) == null ? void 0 : d.firstWeekContainsDate) ?? e.firstWeekContainsDate ?? ((h = (u = e.locale) == null ? void 0 : u.options) == null ? void 0 : h.firstWeekContainsDate) ?? 1, r = ee(a, t), i = b(a, 0);
  return i.setFullYear(r, 0, n), i.setHours(0, 0, 0, 0), W(i, t);
}
function be(a, t) {
  const e = w(a), n = +W(e, t) - +Dt(e, t);
  return Math.round(n / me) + 1;
}
function p(a, t) {
  const e = a < 0 ? "-" : "", n = Math.abs(a).toString().padStart(t, "0");
  return e + n;
}
const H = {
  // Year
  y(a, t) {
    const e = a.getFullYear(), n = e > 0 ? e : 1 - e;
    return p(t === "yy" ? n % 100 : n, t.length);
  },
  // Month
  M(a, t) {
    const e = a.getMonth();
    return t === "M" ? String(e + 1) : p(e + 1, 2);
  },
  // Day of the month
  d(a, t) {
    return p(a.getDate(), t.length);
  },
  // AM or PM
  a(a, t) {
    const e = a.getHours() / 12 >= 1 ? "pm" : "am";
    switch (t) {
      case "a":
      case "aa":
        return e.toUpperCase();
      case "aaa":
        return e;
      case "aaaaa":
        return e[0];
      case "aaaa":
      default:
        return e === "am" ? "a.m." : "p.m.";
    }
  },
  // Hour [1-12]
  h(a, t) {
    return p(a.getHours() % 12 || 12, t.length);
  },
  // Hour [0-23]
  H(a, t) {
    return p(a.getHours(), t.length);
  },
  // Minute
  m(a, t) {
    return p(a.getMinutes(), t.length);
  },
  // Second
  s(a, t) {
    return p(a.getSeconds(), t.length);
  },
  // Fraction of second
  S(a, t) {
    const e = t.length, n = a.getMilliseconds(), r = Math.trunc(
      n * Math.pow(10, e - 3)
    );
    return p(r, t.length);
  }
}, I = {
  midnight: "midnight",
  noon: "noon",
  morning: "morning",
  afternoon: "afternoon",
  evening: "evening",
  night: "night"
}, oe = {
  // Era
  G: function(a, t, e) {
    const n = a.getFullYear() > 0 ? 1 : 0;
    switch (t) {
      case "G":
      case "GG":
      case "GGG":
        return e.era(n, { width: "abbreviated" });
      case "GGGGG":
        return e.era(n, { width: "narrow" });
      case "GGGG":
      default:
        return e.era(n, { width: "wide" });
    }
  },
  // Year
  y: function(a, t, e) {
    if (t === "yo") {
      const n = a.getFullYear(), r = n > 0 ? n : 1 - n;
      return e.ordinalNumber(r, { unit: "year" });
    }
    return H.y(a, t);
  },
  // Local week-numbering year
  Y: function(a, t, e, n) {
    const r = ee(a, n), i = r > 0 ? r : 1 - r;
    if (t === "YY") {
      const s = i % 100;
      return p(s, 2);
    }
    return t === "Yo" ? e.ordinalNumber(i, { unit: "year" }) : p(i, t.length);
  },
  // ISO week-numbering year
  R: function(a, t) {
    const e = fe(a);
    return p(e, t.length);
  },
  // Extended year. This is a single number designating the year of this calendar system.
  // The main difference between `y` and `u` localizers are B.C. years:
  // | Year | `y` | `u` |
  // |------|-----|-----|
  // | AC 1 |   1 |   1 |
  // | BC 1 |   1 |   0 |
  // | BC 2 |   2 |  -1 |
  // Also `yy` always returns the last two digits of a year,
  // while `uu` pads single digit years to 2 characters and returns other years unchanged.
  u: function(a, t) {
    const e = a.getFullYear();
    return p(e, t.length);
  },
  // Quarter
  Q: function(a, t, e) {
    const n = Math.ceil((a.getMonth() + 1) / 3);
    switch (t) {
      case "Q":
        return String(n);
      case "QQ":
        return p(n, 2);
      case "Qo":
        return e.ordinalNumber(n, { unit: "quarter" });
      case "QQQ":
        return e.quarter(n, {
          width: "abbreviated",
          context: "formatting"
        });
      case "QQQQQ":
        return e.quarter(n, {
          width: "narrow",
          context: "formatting"
        });
      case "QQQQ":
      default:
        return e.quarter(n, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // Stand-alone quarter
  q: function(a, t, e) {
    const n = Math.ceil((a.getMonth() + 1) / 3);
    switch (t) {
      case "q":
        return String(n);
      case "qq":
        return p(n, 2);
      case "qo":
        return e.ordinalNumber(n, { unit: "quarter" });
      case "qqq":
        return e.quarter(n, {
          width: "abbreviated",
          context: "standalone"
        });
      case "qqqqq":
        return e.quarter(n, {
          width: "narrow",
          context: "standalone"
        });
      case "qqqq":
      default:
        return e.quarter(n, {
          width: "wide",
          context: "standalone"
        });
    }
  },
  // Month
  M: function(a, t, e) {
    const n = a.getMonth();
    switch (t) {
      case "M":
      case "MM":
        return H.M(a, t);
      case "Mo":
        return e.ordinalNumber(n + 1, { unit: "month" });
      case "MMM":
        return e.month(n, {
          width: "abbreviated",
          context: "formatting"
        });
      case "MMMMM":
        return e.month(n, {
          width: "narrow",
          context: "formatting"
        });
      case "MMMM":
      default:
        return e.month(n, { width: "wide", context: "formatting" });
    }
  },
  // Stand-alone month
  L: function(a, t, e) {
    const n = a.getMonth();
    switch (t) {
      case "L":
        return String(n + 1);
      case "LL":
        return p(n + 1, 2);
      case "Lo":
        return e.ordinalNumber(n + 1, { unit: "month" });
      case "LLL":
        return e.month(n, {
          width: "abbreviated",
          context: "standalone"
        });
      case "LLLLL":
        return e.month(n, {
          width: "narrow",
          context: "standalone"
        });
      case "LLLL":
      default:
        return e.month(n, { width: "wide", context: "standalone" });
    }
  },
  // Local week of year
  w: function(a, t, e, n) {
    const r = be(a, n);
    return t === "wo" ? e.ordinalNumber(r, { unit: "week" }) : p(r, t.length);
  },
  // ISO week of year
  I: function(a, t, e) {
    const n = we(a);
    return t === "Io" ? e.ordinalNumber(n, { unit: "week" }) : p(n, t.length);
  },
  // Day of the month
  d: function(a, t, e) {
    return t === "do" ? e.ordinalNumber(a.getDate(), { unit: "date" }) : H.d(a, t);
  },
  // Day of year
  D: function(a, t, e) {
    const n = Mt(a);
    return t === "Do" ? e.ordinalNumber(n, { unit: "dayOfYear" }) : p(n, t.length);
  },
  // Day of week
  E: function(a, t, e) {
    const n = a.getDay();
    switch (t) {
      case "E":
      case "EE":
      case "EEE":
        return e.day(n, {
          width: "abbreviated",
          context: "formatting"
        });
      case "EEEEE":
        return e.day(n, {
          width: "narrow",
          context: "formatting"
        });
      case "EEEEEE":
        return e.day(n, {
          width: "short",
          context: "formatting"
        });
      case "EEEE":
      default:
        return e.day(n, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // Local day of week
  e: function(a, t, e, n) {
    const r = a.getDay(), i = (r - n.weekStartsOn + 8) % 7 || 7;
    switch (t) {
      case "e":
        return String(i);
      case "ee":
        return p(i, 2);
      case "eo":
        return e.ordinalNumber(i, { unit: "day" });
      case "eee":
        return e.day(r, {
          width: "abbreviated",
          context: "formatting"
        });
      case "eeeee":
        return e.day(r, {
          width: "narrow",
          context: "formatting"
        });
      case "eeeeee":
        return e.day(r, {
          width: "short",
          context: "formatting"
        });
      case "eeee":
      default:
        return e.day(r, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // Stand-alone local day of week
  c: function(a, t, e, n) {
    const r = a.getDay(), i = (r - n.weekStartsOn + 8) % 7 || 7;
    switch (t) {
      case "c":
        return String(i);
      case "cc":
        return p(i, t.length);
      case "co":
        return e.ordinalNumber(i, { unit: "day" });
      case "ccc":
        return e.day(r, {
          width: "abbreviated",
          context: "standalone"
        });
      case "ccccc":
        return e.day(r, {
          width: "narrow",
          context: "standalone"
        });
      case "cccccc":
        return e.day(r, {
          width: "short",
          context: "standalone"
        });
      case "cccc":
      default:
        return e.day(r, {
          width: "wide",
          context: "standalone"
        });
    }
  },
  // ISO day of week
  i: function(a, t, e) {
    const n = a.getDay(), r = n === 0 ? 7 : n;
    switch (t) {
      case "i":
        return String(r);
      case "ii":
        return p(r, t.length);
      case "io":
        return e.ordinalNumber(r, { unit: "day" });
      case "iii":
        return e.day(n, {
          width: "abbreviated",
          context: "formatting"
        });
      case "iiiii":
        return e.day(n, {
          width: "narrow",
          context: "formatting"
        });
      case "iiiiii":
        return e.day(n, {
          width: "short",
          context: "formatting"
        });
      case "iiii":
      default:
        return e.day(n, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // AM or PM
  a: function(a, t, e) {
    const r = a.getHours() / 12 >= 1 ? "pm" : "am";
    switch (t) {
      case "a":
      case "aa":
        return e.dayPeriod(r, {
          width: "abbreviated",
          context: "formatting"
        });
      case "aaa":
        return e.dayPeriod(r, {
          width: "abbreviated",
          context: "formatting"
        }).toLowerCase();
      case "aaaaa":
        return e.dayPeriod(r, {
          width: "narrow",
          context: "formatting"
        });
      case "aaaa":
      default:
        return e.dayPeriod(r, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // AM, PM, midnight, noon
  b: function(a, t, e) {
    const n = a.getHours();
    let r;
    switch (n === 12 ? r = I.noon : n === 0 ? r = I.midnight : r = n / 12 >= 1 ? "pm" : "am", t) {
      case "b":
      case "bb":
        return e.dayPeriod(r, {
          width: "abbreviated",
          context: "formatting"
        });
      case "bbb":
        return e.dayPeriod(r, {
          width: "abbreviated",
          context: "formatting"
        }).toLowerCase();
      case "bbbbb":
        return e.dayPeriod(r, {
          width: "narrow",
          context: "formatting"
        });
      case "bbbb":
      default:
        return e.dayPeriod(r, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // in the morning, in the afternoon, in the evening, at night
  B: function(a, t, e) {
    const n = a.getHours();
    let r;
    switch (n >= 17 ? r = I.evening : n >= 12 ? r = I.afternoon : n >= 4 ? r = I.morning : r = I.night, t) {
      case "B":
      case "BB":
      case "BBB":
        return e.dayPeriod(r, {
          width: "abbreviated",
          context: "formatting"
        });
      case "BBBBB":
        return e.dayPeriod(r, {
          width: "narrow",
          context: "formatting"
        });
      case "BBBB":
      default:
        return e.dayPeriod(r, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // Hour [1-12]
  h: function(a, t, e) {
    if (t === "ho") {
      let n = a.getHours() % 12;
      return n === 0 && (n = 12), e.ordinalNumber(n, { unit: "hour" });
    }
    return H.h(a, t);
  },
  // Hour [0-23]
  H: function(a, t, e) {
    return t === "Ho" ? e.ordinalNumber(a.getHours(), { unit: "hour" }) : H.H(a, t);
  },
  // Hour [0-11]
  K: function(a, t, e) {
    const n = a.getHours() % 12;
    return t === "Ko" ? e.ordinalNumber(n, { unit: "hour" }) : p(n, t.length);
  },
  // Hour [1-24]
  k: function(a, t, e) {
    let n = a.getHours();
    return n === 0 && (n = 24), t === "ko" ? e.ordinalNumber(n, { unit: "hour" }) : p(n, t.length);
  },
  // Minute
  m: function(a, t, e) {
    return t === "mo" ? e.ordinalNumber(a.getMinutes(), { unit: "minute" }) : H.m(a, t);
  },
  // Second
  s: function(a, t, e) {
    return t === "so" ? e.ordinalNumber(a.getSeconds(), { unit: "second" }) : H.s(a, t);
  },
  // Fraction of second
  S: function(a, t) {
    return H.S(a, t);
  },
  // Timezone (ISO-8601. If offset is 0, output is always `'Z'`)
  X: function(a, t, e) {
    const n = a.getTimezoneOffset();
    if (n === 0)
      return "Z";
    switch (t) {
      case "X":
        return de(n);
      case "XXXX":
      case "XX":
        return _(n);
      case "XXXXX":
      case "XXX":
      default:
        return _(n, ":");
    }
  },
  // Timezone (ISO-8601. If offset is 0, output is `'+00:00'` or equivalent)
  x: function(a, t, e) {
    const n = a.getTimezoneOffset();
    switch (t) {
      case "x":
        return de(n);
      case "xxxx":
      case "xx":
        return _(n);
      case "xxxxx":
      case "xxx":
      default:
        return _(n, ":");
    }
  },
  // Timezone (GMT)
  O: function(a, t, e) {
    const n = a.getTimezoneOffset();
    switch (t) {
      case "O":
      case "OO":
      case "OOO":
        return "GMT" + ce(n, ":");
      case "OOOO":
      default:
        return "GMT" + _(n, ":");
    }
  },
  // Timezone (specific non-location)
  z: function(a, t, e) {
    const n = a.getTimezoneOffset();
    switch (t) {
      case "z":
      case "zz":
      case "zzz":
        return "GMT" + ce(n, ":");
      case "zzzz":
      default:
        return "GMT" + _(n, ":");
    }
  },
  // Seconds timestamp
  t: function(a, t, e) {
    const n = Math.trunc(a.getTime() / 1e3);
    return p(n, t.length);
  },
  // Milliseconds timestamp
  T: function(a, t, e) {
    const n = a.getTime();
    return p(n, t.length);
  }
};
function ce(a, t = "") {
  const e = a > 0 ? "-" : "+", n = Math.abs(a), r = Math.trunc(n / 60), i = n % 60;
  return i === 0 ? e + String(r) : e + String(r) + t + p(i, 2);
}
function de(a, t) {
  return a % 60 === 0 ? (a > 0 ? "-" : "+") + p(Math.abs(a) / 60, 2) : _(a, t);
}
function _(a, t = "") {
  const e = a > 0 ? "-" : "+", n = Math.abs(a), r = p(Math.trunc(n / 60), 2), i = p(n % 60, 2);
  return e + r + t + i;
}
const le = (a, t) => {
  switch (a) {
    case "P":
      return t.date({ width: "short" });
    case "PP":
      return t.date({ width: "medium" });
    case "PPP":
      return t.date({ width: "long" });
    case "PPPP":
    default:
      return t.date({ width: "full" });
  }
}, ye = (a, t) => {
  switch (a) {
    case "p":
      return t.time({ width: "short" });
    case "pp":
      return t.time({ width: "medium" });
    case "ppp":
      return t.time({ width: "long" });
    case "pppp":
    default:
      return t.time({ width: "full" });
  }
}, Tt = (a, t) => {
  const e = a.match(/(P+)(p+)?/) || [], n = e[1], r = e[2];
  if (!r)
    return le(a, t);
  let i;
  switch (n) {
    case "P":
      i = t.dateTime({ width: "short" });
      break;
    case "PP":
      i = t.dateTime({ width: "medium" });
      break;
    case "PPP":
      i = t.dateTime({ width: "long" });
      break;
    case "PPPP":
    default:
      i = t.dateTime({ width: "full" });
      break;
  }
  return i.replace("{{date}}", le(n, t)).replace("{{time}}", ye(r, t));
}, K = {
  p: ye,
  P: Tt
}, Pt = /^D+$/, Et = /^Y+$/, Ot = ["D", "DD", "YY", "YYYY"];
function ke(a) {
  return Pt.test(a);
}
function ve(a) {
  return Et.test(a);
}
function U(a, t, e) {
  const n = Nt(a, t, e);
  if (console.warn(n), Ot.includes(a)) throw new RangeError(n);
}
function Nt(a, t, e) {
  const n = a[0] === "Y" ? "years" : "days of the month";
  return `Use \`${a.toLowerCase()}\` instead of \`${a}\` (in \`${t}\`) for formatting ${n} to the input \`${e}\`; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md`;
}
const Lt = /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g, Ht = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g, Wt = /^'([^]*?)'?$/, _t = /''/g, Yt = /[a-zA-Z]/;
function J(a, t, e) {
  var h, m, C, D, L, B, F, R;
  const n = q(), r = (e == null ? void 0 : e.locale) ?? n.locale ?? ge, i = (e == null ? void 0 : e.firstWeekContainsDate) ?? ((m = (h = e == null ? void 0 : e.locale) == null ? void 0 : h.options) == null ? void 0 : m.firstWeekContainsDate) ?? n.firstWeekContainsDate ?? ((D = (C = n.locale) == null ? void 0 : C.options) == null ? void 0 : D.firstWeekContainsDate) ?? 1, s = (e == null ? void 0 : e.weekStartsOn) ?? ((B = (L = e == null ? void 0 : e.locale) == null ? void 0 : L.options) == null ? void 0 : B.weekStartsOn) ?? n.weekStartsOn ?? ((R = (F = n.locale) == null ? void 0 : F.options) == null ? void 0 : R.weekStartsOn) ?? 0, o = w(a);
  if (!je(o))
    throw new RangeError("Invalid time value");
  let d = t.match(Ht).map((M) => {
    const l = M[0];
    if (l === "p" || l === "P") {
      const g = K[l];
      return g(M, r.formatLong);
    }
    return M;
  }).join("").match(Lt).map((M) => {
    if (M === "''")
      return { isToken: !1, value: "'" };
    const l = M[0];
    if (l === "'")
      return { isToken: !1, value: It(M) };
    if (oe[l])
      return { isToken: !0, value: M };
    if (l.match(Yt))
      throw new RangeError(
        "Format string contains an unescaped latin alphabet character `" + l + "`"
      );
    return { isToken: !1, value: M };
  });
  r.localize.preprocessor && (d = r.localize.preprocessor(o, d));
  const u = {
    firstWeekContainsDate: i,
    weekStartsOn: s,
    locale: r
  };
  return d.map((M) => {
    if (!M.isToken) return M.value;
    const l = M.value;
    (!(e != null && e.useAdditionalWeekYearTokens) && ve(l) || !(e != null && e.useAdditionalDayOfYearTokens) && ke(l)) && U(l, t, String(a));
    const g = oe[l[0]];
    return g(o, l, r.localize, u);
  }).join("");
}
function It(a) {
  const t = a.match(Wt);
  return t ? t[1].replace(_t, "'") : a;
}
function St(a) {
  return w(a).getDay();
}
function $t() {
  return Object.assign({}, q());
}
function qt(a) {
  let e = w(a).getDay();
  return e === 0 && (e = 7), e;
}
function xe(a, t) {
  const e = w(a), n = w(t);
  return +e < +n;
}
function Bt(a, t) {
  const e = t instanceof Date ? b(t, 0) : new t(0);
  return e.setFullYear(
    a.getFullYear(),
    a.getMonth(),
    a.getDate()
  ), e.setHours(
    a.getHours(),
    a.getMinutes(),
    a.getSeconds(),
    a.getMilliseconds()
  ), e;
}
const Ft = 10;
class Ce {
  constructor() {
    c(this, "subPriority", 0);
  }
  validate(t, e) {
    return !0;
  }
}
class Rt extends Ce {
  constructor(t, e, n, r, i) {
    super(), this.value = t, this.validateValue = e, this.setValue = n, this.priority = r, i && (this.subPriority = i);
  }
  validate(t, e) {
    return this.validateValue(t, this.value, e);
  }
  set(t, e, n) {
    return this.setValue(t, e, this.value, n);
  }
}
class jt extends Ce {
  constructor() {
    super(...arguments);
    c(this, "priority", Ft);
    c(this, "subPriority", -1);
  }
  set(e, n) {
    return n.timestampIsSet ? e : b(e, Bt(e, Date));
  }
}
class f {
  run(t, e, n, r) {
    const i = this.parse(t, e, n, r);
    return i ? {
      setter: new Rt(
        i.value,
        this.validate,
        this.set,
        this.priority,
        this.subPriority
      ),
      rest: i.rest
    } : null;
  }
  validate(t, e, n) {
    return !0;
  }
}
class At extends f {
  constructor() {
    super(...arguments);
    c(this, "priority", 140);
    c(this, "incompatibleTokens", ["R", "u", "t", "T"]);
  }
  parse(e, n, r) {
    switch (n) {
      case "G":
      case "GG":
      case "GGG":
        return r.era(e, { width: "abbreviated" }) || r.era(e, { width: "narrow" });
      case "GGGGG":
        return r.era(e, { width: "narrow" });
      case "GGGG":
      default:
        return r.era(e, { width: "wide" }) || r.era(e, { width: "abbreviated" }) || r.era(e, { width: "narrow" });
    }
  }
  set(e, n, r) {
    return n.era = r, e.setFullYear(r, 0, 1), e.setHours(0, 0, 0, 0), e;
  }
}
const v = {
  month: /^(1[0-2]|0?\d)/,
  // 0 to 12
  date: /^(3[0-1]|[0-2]?\d)/,
  // 0 to 31
  dayOfYear: /^(36[0-6]|3[0-5]\d|[0-2]?\d?\d)/,
  // 0 to 366
  week: /^(5[0-3]|[0-4]?\d)/,
  // 0 to 53
  hour23h: /^(2[0-3]|[0-1]?\d)/,
  // 0 to 23
  hour24h: /^(2[0-4]|[0-1]?\d)/,
  // 0 to 24
  hour11h: /^(1[0-1]|0?\d)/,
  // 0 to 11
  hour12h: /^(1[0-2]|0?\d)/,
  // 0 to 12
  minute: /^[0-5]?\d/,
  // 0 to 59
  second: /^[0-5]?\d/,
  // 0 to 59
  singleDigit: /^\d/,
  // 0 to 9
  twoDigits: /^\d{1,2}/,
  // 0 to 99
  threeDigits: /^\d{1,3}/,
  // 0 to 999
  fourDigits: /^\d{1,4}/,
  // 0 to 9999
  anyDigitsSigned: /^-?\d+/,
  singleDigitSigned: /^-?\d/,
  // 0 to 9, -0 to -9
  twoDigitsSigned: /^-?\d{1,2}/,
  // 0 to 99, -0 to -99
  threeDigitsSigned: /^-?\d{1,3}/,
  // 0 to 999, -0 to -999
  fourDigitsSigned: /^-?\d{1,4}/
  // 0 to 9999, -0 to -9999
}, O = {
  basicOptionalMinutes: /^([+-])(\d{2})(\d{2})?|Z/,
  basic: /^([+-])(\d{2})(\d{2})|Z/,
  basicOptionalSeconds: /^([+-])(\d{2})(\d{2})((\d{2}))?|Z/,
  extended: /^([+-])(\d{2}):(\d{2})|Z/,
  extendedOptionalSeconds: /^([+-])(\d{2}):(\d{2})(:(\d{2}))?|Z/
};
function x(a, t) {
  return a && {
    value: t(a.value),
    rest: a.rest
  };
}
function y(a, t) {
  const e = t.match(a);
  return e ? {
    value: parseInt(e[0], 10),
    rest: t.slice(e[0].length)
  } : null;
}
function N(a, t) {
  const e = t.match(a);
  if (!e)
    return null;
  if (e[0] === "Z")
    return {
      value: 0,
      rest: t.slice(1)
    };
  const n = e[1] === "+" ? 1 : -1, r = e[2] ? parseInt(e[2], 10) : 0, i = e[3] ? parseInt(e[3], 10) : 0, s = e[5] ? parseInt(e[5], 10) : 0;
  return {
    value: n * (r * Se + i * Ie + s * $e),
    rest: t.slice(e[0].length)
  };
}
function Me(a) {
  return y(v.anyDigitsSigned, a);
}
function k(a, t) {
  switch (a) {
    case 1:
      return y(v.singleDigit, t);
    case 2:
      return y(v.twoDigits, t);
    case 3:
      return y(v.threeDigits, t);
    case 4:
      return y(v.fourDigits, t);
    default:
      return y(new RegExp("^\\d{1," + a + "}"), t);
  }
}
function V(a, t) {
  switch (a) {
    case 1:
      return y(v.singleDigitSigned, t);
    case 2:
      return y(v.twoDigitsSigned, t);
    case 3:
      return y(v.threeDigitsSigned, t);
    case 4:
      return y(v.fourDigitsSigned, t);
    default:
      return y(new RegExp("^-?\\d{1," + a + "}"), t);
  }
}
function te(a) {
  switch (a) {
    case "morning":
      return 4;
    case "evening":
      return 17;
    case "pm":
    case "noon":
    case "afternoon":
      return 12;
    case "am":
    case "midnight":
    case "night":
    default:
      return 0;
  }
}
function De(a, t) {
  const e = t > 0, n = e ? t : 1 - t;
  let r;
  if (n <= 50)
    r = a || 100;
  else {
    const i = n + 50, s = Math.trunc(i / 100) * 100, o = a >= i % 100;
    r = a + s - (o ? 100 : 0);
  }
  return e ? r : 1 - r;
}
function Te(a) {
  return a % 400 === 0 || a % 4 === 0 && a % 100 !== 0;
}
class Qt extends f {
  constructor() {
    super(...arguments);
    c(this, "priority", 130);
    c(this, "incompatibleTokens", ["Y", "R", "u", "w", "I", "i", "e", "c", "t", "T"]);
  }
  parse(e, n, r) {
    const i = (s) => ({
      year: s,
      isTwoDigitYear: n === "yy"
    });
    switch (n) {
      case "y":
        return x(k(4, e), i);
      case "yo":
        return x(
          r.ordinalNumber(e, {
            unit: "year"
          }),
          i
        );
      default:
        return x(k(n.length, e), i);
    }
  }
  validate(e, n) {
    return n.isTwoDigitYear || n.year > 0;
  }
  set(e, n, r) {
    const i = e.getFullYear();
    if (r.isTwoDigitYear) {
      const o = De(
        r.year,
        i
      );
      return e.setFullYear(o, 0, 1), e.setHours(0, 0, 0, 0), e;
    }
    const s = !("era" in n) || n.era === 1 ? r.year : 1 - r.year;
    return e.setFullYear(s, 0, 1), e.setHours(0, 0, 0, 0), e;
  }
}
class Vt extends f {
  constructor() {
    super(...arguments);
    c(this, "priority", 130);
    c(this, "incompatibleTokens", [
      "y",
      "R",
      "u",
      "Q",
      "q",
      "M",
      "L",
      "I",
      "d",
      "D",
      "i",
      "t",
      "T"
    ]);
  }
  parse(e, n, r) {
    const i = (s) => ({
      year: s,
      isTwoDigitYear: n === "YY"
    });
    switch (n) {
      case "Y":
        return x(k(4, e), i);
      case "Yo":
        return x(
          r.ordinalNumber(e, {
            unit: "year"
          }),
          i
        );
      default:
        return x(k(n.length, e), i);
    }
  }
  validate(e, n) {
    return n.isTwoDigitYear || n.year > 0;
  }
  set(e, n, r, i) {
    const s = ee(e, i);
    if (r.isTwoDigitYear) {
      const d = De(
        r.year,
        s
      );
      return e.setFullYear(
        d,
        0,
        i.firstWeekContainsDate
      ), e.setHours(0, 0, 0, 0), W(e, i);
    }
    const o = !("era" in n) || n.era === 1 ? r.year : 1 - r.year;
    return e.setFullYear(o, 0, i.firstWeekContainsDate), e.setHours(0, 0, 0, 0), W(e, i);
  }
}
class Xt extends f {
  constructor() {
    super(...arguments);
    c(this, "priority", 130);
    c(this, "incompatibleTokens", [
      "G",
      "y",
      "Y",
      "u",
      "Q",
      "q",
      "M",
      "L",
      "w",
      "d",
      "D",
      "e",
      "c",
      "t",
      "T"
    ]);
  }
  parse(e, n) {
    return V(n === "R" ? 4 : n.length, e);
  }
  set(e, n, r) {
    const i = b(e, 0);
    return i.setFullYear(r, 0, 4), i.setHours(0, 0, 0, 0), $(i);
  }
}
class Gt extends f {
  constructor() {
    super(...arguments);
    c(this, "priority", 130);
    c(this, "incompatibleTokens", ["G", "y", "Y", "R", "w", "I", "i", "e", "c", "t", "T"]);
  }
  parse(e, n) {
    return V(n === "u" ? 4 : n.length, e);
  }
  set(e, n, r) {
    return e.setFullYear(r, 0, 1), e.setHours(0, 0, 0, 0), e;
  }
}
class zt extends f {
  constructor() {
    super(...arguments);
    c(this, "priority", 120);
    c(this, "incompatibleTokens", [
      "Y",
      "R",
      "q",
      "M",
      "L",
      "w",
      "I",
      "d",
      "D",
      "i",
      "e",
      "c",
      "t",
      "T"
    ]);
  }
  parse(e, n, r) {
    switch (n) {
      case "Q":
      case "QQ":
        return k(n.length, e);
      case "Qo":
        return r.ordinalNumber(e, { unit: "quarter" });
      case "QQQ":
        return r.quarter(e, {
          width: "abbreviated",
          context: "formatting"
        }) || r.quarter(e, {
          width: "narrow",
          context: "formatting"
        });
      case "QQQQQ":
        return r.quarter(e, {
          width: "narrow",
          context: "formatting"
        });
      case "QQQQ":
      default:
        return r.quarter(e, {
          width: "wide",
          context: "formatting"
        }) || r.quarter(e, {
          width: "abbreviated",
          context: "formatting"
        }) || r.quarter(e, {
          width: "narrow",
          context: "formatting"
        });
    }
  }
  validate(e, n) {
    return n >= 1 && n <= 4;
  }
  set(e, n, r) {
    return e.setMonth((r - 1) * 3, 1), e.setHours(0, 0, 0, 0), e;
  }
}
class Kt extends f {
  constructor() {
    super(...arguments);
    c(this, "priority", 120);
    c(this, "incompatibleTokens", [
      "Y",
      "R",
      "Q",
      "M",
      "L",
      "w",
      "I",
      "d",
      "D",
      "i",
      "e",
      "c",
      "t",
      "T"
    ]);
  }
  parse(e, n, r) {
    switch (n) {
      case "q":
      case "qq":
        return k(n.length, e);
      case "qo":
        return r.ordinalNumber(e, { unit: "quarter" });
      case "qqq":
        return r.quarter(e, {
          width: "abbreviated",
          context: "standalone"
        }) || r.quarter(e, {
          width: "narrow",
          context: "standalone"
        });
      case "qqqqq":
        return r.quarter(e, {
          width: "narrow",
          context: "standalone"
        });
      case "qqqq":
      default:
        return r.quarter(e, {
          width: "wide",
          context: "standalone"
        }) || r.quarter(e, {
          width: "abbreviated",
          context: "standalone"
        }) || r.quarter(e, {
          width: "narrow",
          context: "standalone"
        });
    }
  }
  validate(e, n) {
    return n >= 1 && n <= 4;
  }
  set(e, n, r) {
    return e.setMonth((r - 1) * 3, 1), e.setHours(0, 0, 0, 0), e;
  }
}
class Ut extends f {
  constructor() {
    super(...arguments);
    c(this, "incompatibleTokens", [
      "Y",
      "R",
      "q",
      "Q",
      "L",
      "w",
      "I",
      "D",
      "i",
      "e",
      "c",
      "t",
      "T"
    ]);
    c(this, "priority", 110);
  }
  parse(e, n, r) {
    const i = (s) => s - 1;
    switch (n) {
      case "M":
        return x(
          y(v.month, e),
          i
        );
      case "MM":
        return x(k(2, e), i);
      case "Mo":
        return x(
          r.ordinalNumber(e, {
            unit: "month"
          }),
          i
        );
      case "MMM":
        return r.month(e, {
          width: "abbreviated",
          context: "formatting"
        }) || r.month(e, { width: "narrow", context: "formatting" });
      case "MMMMM":
        return r.month(e, {
          width: "narrow",
          context: "formatting"
        });
      case "MMMM":
      default:
        return r.month(e, { width: "wide", context: "formatting" }) || r.month(e, {
          width: "abbreviated",
          context: "formatting"
        }) || r.month(e, { width: "narrow", context: "formatting" });
    }
  }
  validate(e, n) {
    return n >= 0 && n <= 11;
  }
  set(e, n, r) {
    return e.setMonth(r, 1), e.setHours(0, 0, 0, 0), e;
  }
}
class Jt extends f {
  constructor() {
    super(...arguments);
    c(this, "priority", 110);
    c(this, "incompatibleTokens", [
      "Y",
      "R",
      "q",
      "Q",
      "M",
      "w",
      "I",
      "D",
      "i",
      "e",
      "c",
      "t",
      "T"
    ]);
  }
  parse(e, n, r) {
    const i = (s) => s - 1;
    switch (n) {
      case "L":
        return x(
          y(v.month, e),
          i
        );
      case "LL":
        return x(k(2, e), i);
      case "Lo":
        return x(
          r.ordinalNumber(e, {
            unit: "month"
          }),
          i
        );
      case "LLL":
        return r.month(e, {
          width: "abbreviated",
          context: "standalone"
        }) || r.month(e, { width: "narrow", context: "standalone" });
      case "LLLLL":
        return r.month(e, {
          width: "narrow",
          context: "standalone"
        });
      case "LLLL":
      default:
        return r.month(e, { width: "wide", context: "standalone" }) || r.month(e, {
          width: "abbreviated",
          context: "standalone"
        }) || r.month(e, { width: "narrow", context: "standalone" });
    }
  }
  validate(e, n) {
    return n >= 0 && n <= 11;
  }
  set(e, n, r) {
    return e.setMonth(r, 1), e.setHours(0, 0, 0, 0), e;
  }
}
function Zt(a, t, e) {
  const n = w(a), r = be(n, e) - t;
  return n.setDate(n.getDate() - r * 7), n;
}
class en extends f {
  constructor() {
    super(...arguments);
    c(this, "priority", 100);
    c(this, "incompatibleTokens", [
      "y",
      "R",
      "u",
      "q",
      "Q",
      "M",
      "L",
      "I",
      "d",
      "D",
      "i",
      "t",
      "T"
    ]);
  }
  parse(e, n, r) {
    switch (n) {
      case "w":
        return y(v.week, e);
      case "wo":
        return r.ordinalNumber(e, { unit: "week" });
      default:
        return k(n.length, e);
    }
  }
  validate(e, n) {
    return n >= 1 && n <= 53;
  }
  set(e, n, r, i) {
    return W(Zt(e, r, i), i);
  }
}
function tn(a, t) {
  const e = w(a), n = we(e) - t;
  return e.setDate(e.getDate() - n * 7), e;
}
class nn extends f {
  constructor() {
    super(...arguments);
    c(this, "priority", 100);
    c(this, "incompatibleTokens", [
      "y",
      "Y",
      "u",
      "q",
      "Q",
      "M",
      "L",
      "w",
      "d",
      "D",
      "e",
      "c",
      "t",
      "T"
    ]);
  }
  parse(e, n, r) {
    switch (n) {
      case "I":
        return y(v.week, e);
      case "Io":
        return r.ordinalNumber(e, { unit: "week" });
      default:
        return k(n.length, e);
    }
  }
  validate(e, n) {
    return n >= 1 && n <= 53;
  }
  set(e, n, r) {
    return $(tn(e, r));
  }
}
const rn = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31], an = [
  31,
  29,
  31,
  30,
  31,
  30,
  31,
  31,
  30,
  31,
  30,
  31
];
class sn extends f {
  constructor() {
    super(...arguments);
    c(this, "priority", 90);
    c(this, "subPriority", 1);
    c(this, "incompatibleTokens", [
      "Y",
      "R",
      "q",
      "Q",
      "w",
      "I",
      "D",
      "i",
      "e",
      "c",
      "t",
      "T"
    ]);
  }
  parse(e, n, r) {
    switch (n) {
      case "d":
        return y(v.date, e);
      case "do":
        return r.ordinalNumber(e, { unit: "date" });
      default:
        return k(n.length, e);
    }
  }
  validate(e, n) {
    const r = e.getFullYear(), i = Te(r), s = e.getMonth();
    return i ? n >= 1 && n <= an[s] : n >= 1 && n <= rn[s];
  }
  set(e, n, r) {
    return e.setDate(r), e.setHours(0, 0, 0, 0), e;
  }
}
class on extends f {
  constructor() {
    super(...arguments);
    c(this, "priority", 90);
    c(this, "subpriority", 1);
    c(this, "incompatibleTokens", [
      "Y",
      "R",
      "q",
      "Q",
      "M",
      "L",
      "w",
      "I",
      "d",
      "E",
      "i",
      "e",
      "c",
      "t",
      "T"
    ]);
  }
  parse(e, n, r) {
    switch (n) {
      case "D":
      case "DD":
        return y(v.dayOfYear, e);
      case "Do":
        return r.ordinalNumber(e, { unit: "date" });
      default:
        return k(n.length, e);
    }
  }
  validate(e, n) {
    const r = e.getFullYear();
    return Te(r) ? n >= 1 && n <= 366 : n >= 1 && n <= 365;
  }
  set(e, n, r) {
    return e.setMonth(0, r), e.setHours(0, 0, 0, 0), e;
  }
}
function ne(a, t, e) {
  var m, C, D, L;
  const n = q(), r = (e == null ? void 0 : e.weekStartsOn) ?? ((C = (m = e == null ? void 0 : e.locale) == null ? void 0 : m.options) == null ? void 0 : C.weekStartsOn) ?? n.weekStartsOn ?? ((L = (D = n.locale) == null ? void 0 : D.options) == null ? void 0 : L.weekStartsOn) ?? 0, i = w(a), s = i.getDay(), d = (t % 7 + 7) % 7, u = 7 - r, h = t < 0 || t > 6 ? t - (s + u) % 7 : (d + u) % 7 - (s + u) % 7;
  return Z(i, h);
}
class cn extends f {
  constructor() {
    super(...arguments);
    c(this, "priority", 90);
    c(this, "incompatibleTokens", ["D", "i", "e", "c", "t", "T"]);
  }
  parse(e, n, r) {
    switch (n) {
      case "E":
      case "EE":
      case "EEE":
        return r.day(e, {
          width: "abbreviated",
          context: "formatting"
        }) || r.day(e, { width: "short", context: "formatting" }) || r.day(e, { width: "narrow", context: "formatting" });
      case "EEEEE":
        return r.day(e, {
          width: "narrow",
          context: "formatting"
        });
      case "EEEEEE":
        return r.day(e, { width: "short", context: "formatting" }) || r.day(e, { width: "narrow", context: "formatting" });
      case "EEEE":
      default:
        return r.day(e, { width: "wide", context: "formatting" }) || r.day(e, {
          width: "abbreviated",
          context: "formatting"
        }) || r.day(e, { width: "short", context: "formatting" }) || r.day(e, { width: "narrow", context: "formatting" });
    }
  }
  validate(e, n) {
    return n >= 0 && n <= 6;
  }
  set(e, n, r, i) {
    return e = ne(e, r, i), e.setHours(0, 0, 0, 0), e;
  }
}
class dn extends f {
  constructor() {
    super(...arguments);
    c(this, "priority", 90);
    c(this, "incompatibleTokens", [
      "y",
      "R",
      "u",
      "q",
      "Q",
      "M",
      "L",
      "I",
      "d",
      "D",
      "E",
      "i",
      "c",
      "t",
      "T"
    ]);
  }
  parse(e, n, r, i) {
    const s = (o) => {
      const d = Math.floor((o - 1) / 7) * 7;
      return (o + i.weekStartsOn + 6) % 7 + d;
    };
    switch (n) {
      case "e":
      case "ee":
        return x(k(n.length, e), s);
      case "eo":
        return x(
          r.ordinalNumber(e, {
            unit: "day"
          }),
          s
        );
      case "eee":
        return r.day(e, {
          width: "abbreviated",
          context: "formatting"
        }) || r.day(e, { width: "short", context: "formatting" }) || r.day(e, { width: "narrow", context: "formatting" });
      case "eeeee":
        return r.day(e, {
          width: "narrow",
          context: "formatting"
        });
      case "eeeeee":
        return r.day(e, { width: "short", context: "formatting" }) || r.day(e, { width: "narrow", context: "formatting" });
      case "eeee":
      default:
        return r.day(e, { width: "wide", context: "formatting" }) || r.day(e, {
          width: "abbreviated",
          context: "formatting"
        }) || r.day(e, { width: "short", context: "formatting" }) || r.day(e, { width: "narrow", context: "formatting" });
    }
  }
  validate(e, n) {
    return n >= 0 && n <= 6;
  }
  set(e, n, r, i) {
    return e = ne(e, r, i), e.setHours(0, 0, 0, 0), e;
  }
}
class ln extends f {
  constructor() {
    super(...arguments);
    c(this, "priority", 90);
    c(this, "incompatibleTokens", [
      "y",
      "R",
      "u",
      "q",
      "Q",
      "M",
      "L",
      "I",
      "d",
      "D",
      "E",
      "i",
      "e",
      "t",
      "T"
    ]);
  }
  parse(e, n, r, i) {
    const s = (o) => {
      const d = Math.floor((o - 1) / 7) * 7;
      return (o + i.weekStartsOn + 6) % 7 + d;
    };
    switch (n) {
      case "c":
      case "cc":
        return x(k(n.length, e), s);
      case "co":
        return x(
          r.ordinalNumber(e, {
            unit: "day"
          }),
          s
        );
      case "ccc":
        return r.day(e, {
          width: "abbreviated",
          context: "standalone"
        }) || r.day(e, { width: "short", context: "standalone" }) || r.day(e, { width: "narrow", context: "standalone" });
      case "ccccc":
        return r.day(e, {
          width: "narrow",
          context: "standalone"
        });
      case "cccccc":
        return r.day(e, { width: "short", context: "standalone" }) || r.day(e, { width: "narrow", context: "standalone" });
      case "cccc":
      default:
        return r.day(e, { width: "wide", context: "standalone" }) || r.day(e, {
          width: "abbreviated",
          context: "standalone"
        }) || r.day(e, { width: "short", context: "standalone" }) || r.day(e, { width: "narrow", context: "standalone" });
    }
  }
  validate(e, n) {
    return n >= 0 && n <= 6;
  }
  set(e, n, r, i) {
    return e = ne(e, r, i), e.setHours(0, 0, 0, 0), e;
  }
}
function un(a, t) {
  const e = w(a), n = qt(e), r = t - n;
  return Z(e, r);
}
class hn extends f {
  constructor() {
    super(...arguments);
    c(this, "priority", 90);
    c(this, "incompatibleTokens", [
      "y",
      "Y",
      "u",
      "q",
      "Q",
      "M",
      "L",
      "w",
      "d",
      "D",
      "E",
      "e",
      "c",
      "t",
      "T"
    ]);
  }
  parse(e, n, r) {
    const i = (s) => s === 0 ? 7 : s;
    switch (n) {
      case "i":
      case "ii":
        return k(n.length, e);
      case "io":
        return r.ordinalNumber(e, { unit: "day" });
      case "iii":
        return x(
          r.day(e, {
            width: "abbreviated",
            context: "formatting"
          }) || r.day(e, {
            width: "short",
            context: "formatting"
          }) || r.day(e, {
            width: "narrow",
            context: "formatting"
          }),
          i
        );
      case "iiiii":
        return x(
          r.day(e, {
            width: "narrow",
            context: "formatting"
          }),
          i
        );
      case "iiiiii":
        return x(
          r.day(e, {
            width: "short",
            context: "formatting"
          }) || r.day(e, {
            width: "narrow",
            context: "formatting"
          }),
          i
        );
      case "iiii":
      default:
        return x(
          r.day(e, {
            width: "wide",
            context: "formatting"
          }) || r.day(e, {
            width: "abbreviated",
            context: "formatting"
          }) || r.day(e, {
            width: "short",
            context: "formatting"
          }) || r.day(e, {
            width: "narrow",
            context: "formatting"
          }),
          i
        );
    }
  }
  validate(e, n) {
    return n >= 1 && n <= 7;
  }
  set(e, n, r) {
    return e = un(e, r), e.setHours(0, 0, 0, 0), e;
  }
}
class mn extends f {
  constructor() {
    super(...arguments);
    c(this, "priority", 80);
    c(this, "incompatibleTokens", ["b", "B", "H", "k", "t", "T"]);
  }
  parse(e, n, r) {
    switch (n) {
      case "a":
      case "aa":
      case "aaa":
        return r.dayPeriod(e, {
          width: "abbreviated",
          context: "formatting"
        }) || r.dayPeriod(e, {
          width: "narrow",
          context: "formatting"
        });
      case "aaaaa":
        return r.dayPeriod(e, {
          width: "narrow",
          context: "formatting"
        });
      case "aaaa":
      default:
        return r.dayPeriod(e, {
          width: "wide",
          context: "formatting"
        }) || r.dayPeriod(e, {
          width: "abbreviated",
          context: "formatting"
        }) || r.dayPeriod(e, {
          width: "narrow",
          context: "formatting"
        });
    }
  }
  set(e, n, r) {
    return e.setHours(te(r), 0, 0, 0), e;
  }
}
class fn extends f {
  constructor() {
    super(...arguments);
    c(this, "priority", 80);
    c(this, "incompatibleTokens", ["a", "B", "H", "k", "t", "T"]);
  }
  parse(e, n, r) {
    switch (n) {
      case "b":
      case "bb":
      case "bbb":
        return r.dayPeriod(e, {
          width: "abbreviated",
          context: "formatting"
        }) || r.dayPeriod(e, {
          width: "narrow",
          context: "formatting"
        });
      case "bbbbb":
        return r.dayPeriod(e, {
          width: "narrow",
          context: "formatting"
        });
      case "bbbb":
      default:
        return r.dayPeriod(e, {
          width: "wide",
          context: "formatting"
        }) || r.dayPeriod(e, {
          width: "abbreviated",
          context: "formatting"
        }) || r.dayPeriod(e, {
          width: "narrow",
          context: "formatting"
        });
    }
  }
  set(e, n, r) {
    return e.setHours(te(r), 0, 0, 0), e;
  }
}
class pn extends f {
  constructor() {
    super(...arguments);
    c(this, "priority", 80);
    c(this, "incompatibleTokens", ["a", "b", "t", "T"]);
  }
  parse(e, n, r) {
    switch (n) {
      case "B":
      case "BB":
      case "BBB":
        return r.dayPeriod(e, {
          width: "abbreviated",
          context: "formatting"
        }) || r.dayPeriod(e, {
          width: "narrow",
          context: "formatting"
        });
      case "BBBBB":
        return r.dayPeriod(e, {
          width: "narrow",
          context: "formatting"
        });
      case "BBBB":
      default:
        return r.dayPeriod(e, {
          width: "wide",
          context: "formatting"
        }) || r.dayPeriod(e, {
          width: "abbreviated",
          context: "formatting"
        }) || r.dayPeriod(e, {
          width: "narrow",
          context: "formatting"
        });
    }
  }
  set(e, n, r) {
    return e.setHours(te(r), 0, 0, 0), e;
  }
}
class gn extends f {
  constructor() {
    super(...arguments);
    c(this, "priority", 70);
    c(this, "incompatibleTokens", ["H", "K", "k", "t", "T"]);
  }
  parse(e, n, r) {
    switch (n) {
      case "h":
        return y(v.hour12h, e);
      case "ho":
        return r.ordinalNumber(e, { unit: "hour" });
      default:
        return k(n.length, e);
    }
  }
  validate(e, n) {
    return n >= 1 && n <= 12;
  }
  set(e, n, r) {
    const i = e.getHours() >= 12;
    return i && r < 12 ? e.setHours(r + 12, 0, 0, 0) : !i && r === 12 ? e.setHours(0, 0, 0, 0) : e.setHours(r, 0, 0, 0), e;
  }
}
class wn extends f {
  constructor() {
    super(...arguments);
    c(this, "priority", 70);
    c(this, "incompatibleTokens", ["a", "b", "h", "K", "k", "t", "T"]);
  }
  parse(e, n, r) {
    switch (n) {
      case "H":
        return y(v.hour23h, e);
      case "Ho":
        return r.ordinalNumber(e, { unit: "hour" });
      default:
        return k(n.length, e);
    }
  }
  validate(e, n) {
    return n >= 0 && n <= 23;
  }
  set(e, n, r) {
    return e.setHours(r, 0, 0, 0), e;
  }
}
class bn extends f {
  constructor() {
    super(...arguments);
    c(this, "priority", 70);
    c(this, "incompatibleTokens", ["h", "H", "k", "t", "T"]);
  }
  parse(e, n, r) {
    switch (n) {
      case "K":
        return y(v.hour11h, e);
      case "Ko":
        return r.ordinalNumber(e, { unit: "hour" });
      default:
        return k(n.length, e);
    }
  }
  validate(e, n) {
    return n >= 0 && n <= 11;
  }
  set(e, n, r) {
    return e.getHours() >= 12 && r < 12 ? e.setHours(r + 12, 0, 0, 0) : e.setHours(r, 0, 0, 0), e;
  }
}
class yn extends f {
  constructor() {
    super(...arguments);
    c(this, "priority", 70);
    c(this, "incompatibleTokens", ["a", "b", "h", "H", "K", "t", "T"]);
  }
  parse(e, n, r) {
    switch (n) {
      case "k":
        return y(v.hour24h, e);
      case "ko":
        return r.ordinalNumber(e, { unit: "hour" });
      default:
        return k(n.length, e);
    }
  }
  validate(e, n) {
    return n >= 1 && n <= 24;
  }
  set(e, n, r) {
    const i = r <= 24 ? r % 24 : r;
    return e.setHours(i, 0, 0, 0), e;
  }
}
class kn extends f {
  constructor() {
    super(...arguments);
    c(this, "priority", 60);
    c(this, "incompatibleTokens", ["t", "T"]);
  }
  parse(e, n, r) {
    switch (n) {
      case "m":
        return y(v.minute, e);
      case "mo":
        return r.ordinalNumber(e, { unit: "minute" });
      default:
        return k(n.length, e);
    }
  }
  validate(e, n) {
    return n >= 0 && n <= 59;
  }
  set(e, n, r) {
    return e.setMinutes(r, 0, 0), e;
  }
}
class vn extends f {
  constructor() {
    super(...arguments);
    c(this, "priority", 50);
    c(this, "incompatibleTokens", ["t", "T"]);
  }
  parse(e, n, r) {
    switch (n) {
      case "s":
        return y(v.second, e);
      case "so":
        return r.ordinalNumber(e, { unit: "second" });
      default:
        return k(n.length, e);
    }
  }
  validate(e, n) {
    return n >= 0 && n <= 59;
  }
  set(e, n, r) {
    return e.setSeconds(r, 0), e;
  }
}
class xn extends f {
  constructor() {
    super(...arguments);
    c(this, "priority", 30);
    c(this, "incompatibleTokens", ["t", "T"]);
  }
  parse(e, n) {
    const r = (i) => Math.trunc(i * Math.pow(10, -n.length + 3));
    return x(k(n.length, e), r);
  }
  set(e, n, r) {
    return e.setMilliseconds(r), e;
  }
}
class Cn extends f {
  constructor() {
    super(...arguments);
    c(this, "priority", 10);
    c(this, "incompatibleTokens", ["t", "T", "x"]);
  }
  parse(e, n) {
    switch (n) {
      case "X":
        return N(
          O.basicOptionalMinutes,
          e
        );
      case "XX":
        return N(O.basic, e);
      case "XXXX":
        return N(
          O.basicOptionalSeconds,
          e
        );
      case "XXXXX":
        return N(
          O.extendedOptionalSeconds,
          e
        );
      case "XXX":
      default:
        return N(O.extended, e);
    }
  }
  set(e, n, r) {
    return n.timestampIsSet ? e : b(
      e,
      e.getTime() - Q(e) - r
    );
  }
}
class Mn extends f {
  constructor() {
    super(...arguments);
    c(this, "priority", 10);
    c(this, "incompatibleTokens", ["t", "T", "X"]);
  }
  parse(e, n) {
    switch (n) {
      case "x":
        return N(
          O.basicOptionalMinutes,
          e
        );
      case "xx":
        return N(O.basic, e);
      case "xxxx":
        return N(
          O.basicOptionalSeconds,
          e
        );
      case "xxxxx":
        return N(
          O.extendedOptionalSeconds,
          e
        );
      case "xxx":
      default:
        return N(O.extended, e);
    }
  }
  set(e, n, r) {
    return n.timestampIsSet ? e : b(
      e,
      e.getTime() - Q(e) - r
    );
  }
}
class Dn extends f {
  constructor() {
    super(...arguments);
    c(this, "priority", 40);
    c(this, "incompatibleTokens", "*");
  }
  parse(e) {
    return Me(e);
  }
  set(e, n, r) {
    return [b(e, r * 1e3), { timestampIsSet: !0 }];
  }
}
class Tn extends f {
  constructor() {
    super(...arguments);
    c(this, "priority", 20);
    c(this, "incompatibleTokens", "*");
  }
  parse(e) {
    return Me(e);
  }
  set(e, n, r) {
    return [b(e, r), { timestampIsSet: !0 }];
  }
}
const Pn = {
  G: new At(),
  y: new Qt(),
  Y: new Vt(),
  R: new Xt(),
  u: new Gt(),
  Q: new zt(),
  q: new Kt(),
  M: new Ut(),
  L: new Jt(),
  w: new en(),
  I: new nn(),
  d: new sn(),
  D: new on(),
  E: new cn(),
  e: new dn(),
  c: new ln(),
  i: new hn(),
  a: new mn(),
  b: new fn(),
  B: new pn(),
  h: new gn(),
  H: new wn(),
  K: new bn(),
  k: new yn(),
  m: new kn(),
  s: new vn(),
  S: new xn(),
  X: new Cn(),
  x: new Mn(),
  t: new Dn(),
  T: new Tn()
}, En = /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g, On = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g, Nn = /^'([^]*?)'?$/, Ln = /''/g, Hn = /\S/, Wn = /[a-zA-Z]/;
function _n(a, t, e, n) {
  var B, F, R, M;
  const r = $t(), i = r.locale ?? ge, s = r.firstWeekContainsDate ?? ((F = (B = r.locale) == null ? void 0 : B.options) == null ? void 0 : F.firstWeekContainsDate) ?? 1, o = r.weekStartsOn ?? ((M = (R = r.locale) == null ? void 0 : R.options) == null ? void 0 : M.weekStartsOn) ?? 0, d = {
    firstWeekContainsDate: s,
    weekStartsOn: o,
    locale: i
  }, u = [new jt()], h = t.match(On).map((l) => {
    const g = l[0];
    if (g in K) {
      const T = K[g];
      return T(l, i.formatLong);
    }
    return l;
  }).join("").match(En), m = [];
  for (let l of h) {
    ve(l) && U(l, t, a), ke(l) && U(l, t, a);
    const g = l[0], T = Pn[g];
    if (T) {
      const { incompatibleTokens: re } = T;
      if (Array.isArray(re)) {
        const ae = m.find(
          (ie) => re.includes(ie.token) || ie.token === g
        );
        if (ae)
          throw new RangeError(
            `The format string mustn't contain \`${ae.fullToken}\` and \`${l}\` at the same time`
          );
      } else if (T.incompatibleTokens === "*" && m.length > 0)
        throw new RangeError(
          `The format string mustn't contain \`${l}\` and any other token at the same time`
        );
      m.push({ token: g, fullToken: l });
      const X = T.run(
        a,
        l,
        i.match,
        d
      );
      if (!X)
        return b(e, NaN);
      u.push(X.setter), a = X.rest;
    } else {
      if (g.match(Wn))
        throw new RangeError(
          "Format string contains an unescaped latin alphabet character `" + g + "`"
        );
      if (l === "''" ? l = "'" : g === "'" && (l = Yn(l)), a.indexOf(l) === 0)
        a = a.slice(l.length);
      else
        return b(e, NaN);
    }
  }
  if (a.length > 0 && Hn.test(a))
    return b(e, NaN);
  const C = u.map((l) => l.priority).sort((l, g) => g - l).filter((l, g, T) => T.indexOf(l) === g).map(
    (l) => u.filter((g) => g.priority === l).sort((g, T) => T.subPriority - g.subPriority)
  ).map((l) => l[0]);
  let D = w(e);
  if (isNaN(D.getTime()))
    return b(e, NaN);
  const L = {};
  for (const l of C) {
    if (!l.validate(D, d))
      return b(e, NaN);
    const g = l.set(D, L, d);
    Array.isArray(g) ? (D = g[0], Object.assign(L, g[1])) : D = g;
  }
  return b(e, D);
}
function Yn(a) {
  return a.match(Nn)[1].replace(Ln, "'");
}
function In(a, t) {
  return he(a, -1);
}
const Sn = {
  lessThanXSeconds: {
    one: "menos de un segundo",
    other: "menos de {{count}} segundos"
  },
  xSeconds: {
    one: "1 segundo",
    other: "{{count}} segundos"
  },
  halfAMinute: "medio minuto",
  lessThanXMinutes: {
    one: "menos de un minuto",
    other: "menos de {{count}} minutos"
  },
  xMinutes: {
    one: "1 minuto",
    other: "{{count}} minutos"
  },
  aboutXHours: {
    one: "alrededor de 1 hora",
    other: "alrededor de {{count}} horas"
  },
  xHours: {
    one: "1 hora",
    other: "{{count}} horas"
  },
  xDays: {
    one: "1 día",
    other: "{{count}} días"
  },
  aboutXWeeks: {
    one: "alrededor de 1 semana",
    other: "alrededor de {{count}} semanas"
  },
  xWeeks: {
    one: "1 semana",
    other: "{{count}} semanas"
  },
  aboutXMonths: {
    one: "alrededor de 1 mes",
    other: "alrededor de {{count}} meses"
  },
  xMonths: {
    one: "1 mes",
    other: "{{count}} meses"
  },
  aboutXYears: {
    one: "alrededor de 1 año",
    other: "alrededor de {{count}} años"
  },
  xYears: {
    one: "1 año",
    other: "{{count}} años"
  },
  overXYears: {
    one: "más de 1 año",
    other: "más de {{count}} años"
  },
  almostXYears: {
    one: "casi 1 año",
    other: "casi {{count}} años"
  }
}, $n = (a, t, e) => {
  let n;
  const r = Sn[a];
  return typeof r == "string" ? n = r : t === 1 ? n = r.one : n = r.other.replace("{{count}}", t.toString()), e != null && e.addSuffix ? e.comparison && e.comparison > 0 ? "en " + n : "hace " + n : n;
}, qn = {
  full: "EEEE, d 'de' MMMM 'de' y",
  long: "d 'de' MMMM 'de' y",
  medium: "d MMM y",
  short: "dd/MM/y"
}, Bn = {
  full: "HH:mm:ss zzzz",
  long: "HH:mm:ss z",
  medium: "HH:mm:ss",
  short: "HH:mm"
}, Fn = {
  full: "{{date}} 'a las' {{time}}",
  long: "{{date}} 'a las' {{time}}",
  medium: "{{date}}, {{time}}",
  short: "{{date}}, {{time}}"
}, Rn = {
  date: S({
    formats: qn,
    defaultWidth: "full"
  }),
  time: S({
    formats: Bn,
    defaultWidth: "full"
  }),
  dateTime: S({
    formats: Fn,
    defaultWidth: "full"
  })
}, jn = {
  lastWeek: "'el' eeee 'pasado a la' p",
  yesterday: "'ayer a la' p",
  today: "'hoy a la' p",
  tomorrow: "'mañana a la' p",
  nextWeek: "eeee 'a la' p",
  other: "P"
}, An = {
  lastWeek: "'el' eeee 'pasado a las' p",
  yesterday: "'ayer a las' p",
  today: "'hoy a las' p",
  tomorrow: "'mañana a las' p",
  nextWeek: "eeee 'a las' p",
  other: "P"
}, Qn = (a, t, e, n) => t.getHours() !== 1 ? An[a] : jn[a], Vn = {
  narrow: ["AC", "DC"],
  abbreviated: ["AC", "DC"],
  wide: ["antes de cristo", "después de cristo"]
}, Xn = {
  narrow: ["1", "2", "3", "4"],
  abbreviated: ["T1", "T2", "T3", "T4"],
  wide: ["1º trimestre", "2º trimestre", "3º trimestre", "4º trimestre"]
}, Gn = {
  narrow: ["e", "f", "m", "a", "m", "j", "j", "a", "s", "o", "n", "d"],
  abbreviated: [
    "ene",
    "feb",
    "mar",
    "abr",
    "may",
    "jun",
    "jul",
    "ago",
    "sep",
    "oct",
    "nov",
    "dic"
  ],
  wide: [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre"
  ]
}, zn = {
  narrow: ["d", "l", "m", "m", "j", "v", "s"],
  short: ["do", "lu", "ma", "mi", "ju", "vi", "sá"],
  abbreviated: ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"],
  wide: [
    "domingo",
    "lunes",
    "martes",
    "miércoles",
    "jueves",
    "viernes",
    "sábado"
  ]
}, Kn = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "mn",
    noon: "md",
    morning: "mañana",
    afternoon: "tarde",
    evening: "tarde",
    night: "noche"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "medianoche",
    noon: "mediodia",
    morning: "mañana",
    afternoon: "tarde",
    evening: "tarde",
    night: "noche"
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "medianoche",
    noon: "mediodia",
    morning: "mañana",
    afternoon: "tarde",
    evening: "tarde",
    night: "noche"
  }
}, Un = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "mn",
    noon: "md",
    morning: "de la mañana",
    afternoon: "de la tarde",
    evening: "de la tarde",
    night: "de la noche"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "medianoche",
    noon: "mediodia",
    morning: "de la mañana",
    afternoon: "de la tarde",
    evening: "de la tarde",
    night: "de la noche"
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "medianoche",
    noon: "mediodia",
    morning: "de la mañana",
    afternoon: "de la tarde",
    evening: "de la tarde",
    night: "de la noche"
  }
}, Jn = (a, t) => Number(a) + "º", Zn = {
  ordinalNumber: Jn,
  era: P({
    values: Vn,
    defaultWidth: "wide"
  }),
  quarter: P({
    values: Xn,
    defaultWidth: "wide",
    argumentCallback: (a) => Number(a) - 1
  }),
  month: P({
    values: Gn,
    defaultWidth: "wide"
  }),
  day: P({
    values: zn,
    defaultWidth: "wide"
  }),
  dayPeriod: P({
    values: Kn,
    defaultWidth: "wide",
    formattingValues: Un,
    defaultFormattingWidth: "wide"
  })
}, er = /^(\d+)(º)?/i, tr = /\d+/i, nr = {
  narrow: /^(ac|dc|a|d)/i,
  abbreviated: /^(a\.?\s?c\.?|a\.?\s?e\.?\s?c\.?|d\.?\s?c\.?|e\.?\s?c\.?)/i,
  wide: /^(antes de cristo|antes de la era com[uú]n|despu[eé]s de cristo|era com[uú]n)/i
}, rr = {
  any: [/^ac/i, /^dc/i],
  wide: [
    /^(antes de cristo|antes de la era com[uú]n)/i,
    /^(despu[eé]s de cristo|era com[uú]n)/i
  ]
}, ar = {
  narrow: /^[1234]/i,
  abbreviated: /^T[1234]/i,
  wide: /^[1234](º)? trimestre/i
}, ir = {
  any: [/1/i, /2/i, /3/i, /4/i]
}, sr = {
  narrow: /^[efmajsond]/i,
  abbreviated: /^(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)/i,
  wide: /^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i
}, or = {
  narrow: [
    /^e/i,
    /^f/i,
    /^m/i,
    /^a/i,
    /^m/i,
    /^j/i,
    /^j/i,
    /^a/i,
    /^s/i,
    /^o/i,
    /^n/i,
    /^d/i
  ],
  any: [
    /^en/i,
    /^feb/i,
    /^mar/i,
    /^abr/i,
    /^may/i,
    /^jun/i,
    /^jul/i,
    /^ago/i,
    /^sep/i,
    /^oct/i,
    /^nov/i,
    /^dic/i
  ]
}, cr = {
  narrow: /^[dlmjvs]/i,
  short: /^(do|lu|ma|mi|ju|vi|s[áa])/i,
  abbreviated: /^(dom|lun|mar|mi[ée]|jue|vie|s[áa]b)/i,
  wide: /^(domingo|lunes|martes|mi[ée]rcoles|jueves|viernes|s[áa]bado)/i
}, dr = {
  narrow: [/^d/i, /^l/i, /^m/i, /^m/i, /^j/i, /^v/i, /^s/i],
  any: [/^do/i, /^lu/i, /^ma/i, /^mi/i, /^ju/i, /^vi/i, /^sa/i]
}, lr = {
  narrow: /^(a|p|mn|md|(de la|a las) (mañana|tarde|noche))/i,
  any: /^([ap]\.?\s?m\.?|medianoche|mediodia|(de la|a las) (mañana|tarde|noche))/i
}, ur = {
  any: {
    am: /^a/i,
    pm: /^p/i,
    midnight: /^mn/i,
    noon: /^md/i,
    morning: /mañana/i,
    afternoon: /tarde/i,
    evening: /tarde/i,
    night: /noche/i
  }
}, hr = {
  ordinalNumber: pe({
    matchPattern: er,
    parsePattern: tr,
    valueCallback: function(a) {
      return parseInt(a, 10);
    }
  }),
  era: E({
    matchPatterns: nr,
    defaultMatchWidth: "wide",
    parsePatterns: rr,
    defaultParseWidth: "any"
  }),
  quarter: E({
    matchPatterns: ar,
    defaultMatchWidth: "wide",
    parsePatterns: ir,
    defaultParseWidth: "any",
    valueCallback: (a) => a + 1
  }),
  month: E({
    matchPatterns: sr,
    defaultMatchWidth: "wide",
    parsePatterns: or,
    defaultParseWidth: "any"
  }),
  day: E({
    matchPatterns: cr,
    defaultMatchWidth: "wide",
    parsePatterns: dr,
    defaultParseWidth: "any"
  }),
  dayPeriod: E({
    matchPatterns: lr,
    defaultMatchWidth: "any",
    parsePatterns: ur,
    defaultParseWidth: "any"
  })
}, mr = {
  code: "es",
  formatDistance: $n,
  formatLong: Rn,
  formatRelative: Qn,
  localize: Zn,
  match: hr,
  options: {
    weekStartsOn: 1,
    firstWeekContainsDate: 1
  }
};
function ue(a) {
  return J(a, "yyyy-MM-dd");
}
function fr(a) {
  return _n(a, "yyyy-MM-dd", /* @__PURE__ */ new Date());
}
function pr(a, t) {
  const e = fr(a), [n, r] = t.split(":").map(Number), i = new Date(e);
  return i.setHours(n, r, 0, 0), xe(i, /* @__PURE__ */ new Date());
}
class gr {
  constructor(t) {
    this.container = null, this.availableSlots = [], this.loading = !1, this.options = t, this.selectedDate = /* @__PURE__ */ new Date(), this.currentMonth = /* @__PURE__ */ new Date();
  }
  async render(t) {
    this.container = document.createElement("div"), this.container.className = "kb-datetime-picker";
    const e = document.createElement("div");
    e.className = "kb-step-header";
    const n = document.createElement("button");
    n.className = "kb-back-button", n.textContent = "← Volver", n.onclick = () => this.options.onBack(), e.appendChild(n);
    const r = document.createElement("h2");
    r.className = "kb-step-title", r.textContent = `${this.options.service.name}`, e.appendChild(r), this.container.appendChild(e);
    const i = document.createElement("div");
    i.className = "kb-datetime-layout";
    const s = document.createElement("div");
    s.className = "kb-calendar-section", this.renderCalendar(s), i.appendChild(s);
    const o = document.createElement("div");
    o.className = "kb-slots-section", o.id = "kb-slots-container", i.appendChild(o), this.container.appendChild(i), t.appendChild(this.container), await this.loadSlots();
  }
  renderCalendar(t) {
    t.innerHTML = "";
    const e = document.createElement("h3");
    e.textContent = "Selecciona una fecha", e.className = "kb-calendar-title", t.appendChild(e);
    const n = document.createElement("div");
    n.className = "kb-month-header";
    const r = document.createElement("button");
    r.className = "kb-month-nav", r.innerHTML = "←", r.onclick = () => this.changeMonth(-1), n.appendChild(r);
    const i = document.createElement("div");
    i.className = "kb-month-label", i.textContent = J(this.currentMonth, "MMMM yyyy", { locale: mr }), n.appendChild(i);
    const s = document.createElement("button");
    s.className = "kb-month-nav", s.innerHTML = "→", s.onclick = () => this.changeMonth(1), n.appendChild(s), t.appendChild(n);
    const o = document.createElement("div");
    o.className = "kb-weekday-header", ["L", "M", "M", "J", "V", "S", "D"].forEach((h) => {
      const m = document.createElement("div");
      m.className = "kb-weekday-label", m.textContent = h, o.appendChild(m);
    }), t.appendChild(o);
    const u = document.createElement("div");
    u.className = "kb-calendar", u.id = "kb-calendar-grid", this.renderMonthDays(u), t.appendChild(u);
  }
  renderMonthDays(t) {
    t.innerHTML = "";
    const e = Qe(this.currentMonth), n = Ae(this.currentMonth);
    let r = St(e);
    r = r === 0 ? 6 : r - 1;
    const i = A(/* @__PURE__ */ new Date());
    for (let o = 0; o < r; o++) {
      const d = document.createElement("div");
      d.className = "kb-day-card kb-day-empty", t.appendChild(d);
    }
    let s = e;
    for (; s <= n; ) {
      const o = this.createDayCard(s, i);
      t.appendChild(o), s = Z(s, 1);
    }
  }
  changeMonth(t) {
    var n;
    t > 0 ? this.currentMonth = he(this.currentMonth, 1) : this.currentMonth = In(this.currentMonth);
    const e = (n = this.container) == null ? void 0 : n.querySelector(".kb-calendar-section");
    e && this.renderCalendar(e);
  }
  createDayCard(t, e) {
    const n = document.createElement("div");
    n.className = "kb-day-card";
    const r = xe(t, e), i = se(t, e), s = se(t, this.selectedDate);
    r && n.classList.add("kb-day-past"), i && n.classList.add("kb-day-today"), s && (n.classList.add("kb-day-selected"), n.style.backgroundColor = this.options.accentColor);
    const o = document.createElement("div");
    return o.className = "kb-day-number", o.textContent = J(t, "d"), n.appendChild(o), r || (n.onclick = async () => {
      this.selectedDate = t, this.updateCalendarSelection(), await this.loadSlots();
    }), n;
  }
  updateCalendarSelection() {
    var e;
    const t = (e = this.container) == null ? void 0 : e.querySelector("#kb-calendar-grid");
    t && this.renderMonthDays(t);
  }
  async loadSlots() {
    const t = document.getElementById("kb-slots-container");
    if (t) {
      this.loading = !0, t.innerHTML = '<div class="kb-loading">Cargando disponibilidad...</div>';
      try {
        const e = ue(this.selectedDate);
        this.availableSlots = await this.options.apiClient.getSlots(this.options.service.id, e);
        const n = this.availableSlots.filter(
          (s) => !pr(e, s)
        );
        if (t.innerHTML = "", n.length === 0) {
          t.innerHTML = '<div class="kb-no-slots">No hay horarios disponibles para esta fecha</div>';
          return;
        }
        const r = document.createElement("h3");
        r.textContent = "Horarios disponibles", r.className = "kb-slots-title", t.appendChild(r);
        const i = document.createElement("div");
        i.className = "kb-slots-grid", n.forEach((s) => {
          const o = document.createElement("button");
          o.className = "kb-slot-button";
          const d = document.createElement("span");
          d.textContent = s, d.style.position = "relative", d.style.zIndex = "1", o.appendChild(d), o.onclick = () => this.options.onSelect(ue(this.selectedDate), s), i.appendChild(o);
        }), t.appendChild(i);
      } catch (e) {
        t.innerHTML = `<div class="kb-error">Error al cargar horarios: ${e.message}</div>`;
      } finally {
        this.loading = !1;
      }
    }
  }
  destroy() {
    this.container && (this.container.remove(), this.container = null);
  }
}
function wr(a) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a);
}
function br(a) {
  return !a || a.trim() === "" ? !0 : /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/.test(a);
}
function yr(a) {
  return a.trim().length >= 2;
}
const z = {
  name: "El nombre debe tener al menos 2 caracteres",
  email: "Por favor ingresa un email válido",
  phone: "Por favor ingresa un teléfono válido"
};
class kr {
  constructor(t) {
    this.container = null, this.submitButton = null, this.formData = {
      name: "",
      email: "",
      phone: "",
      notes: ""
    }, this.options = t;
  }
  render(t) {
    this.container = document.createElement("div"), this.container.className = "kb-customer-form";
    const e = document.createElement("div");
    e.className = "kb-step-header";
    const n = document.createElement("button");
    n.className = "kb-back-button", n.innerHTML = `${Y("arrowLeft")} Volver`, n.onclick = () => this.options.onBack(), e.appendChild(n), this.container.appendChild(e);
    const r = document.createElement("div");
    r.className = "kb-form-header";
    const i = document.createElement("h2");
    i.className = "kb-step-title", i.textContent = "Completa tus datos", r.appendChild(i);
    const s = document.createElement("p");
    s.className = "kb-step-subtitle", s.textContent = "Necesitamos algunos datos para confirmar tu reserva", r.appendChild(s), this.container.appendChild(r);
    const o = document.createElement("div");
    o.className = "kb-booking-summary", o.innerHTML = `
      <div class="kb-summary-item">
        <strong>Servicio</strong>
        <span>${this.options.service.name}</span>
      </div>
      <div class="kb-summary-item">
        <strong>Fecha</strong>
        <span>${this.formatDisplayDate(this.options.date)}</span>
      </div>
      <div class="kb-summary-item">
        <strong>Hora</strong>
        <span>${this.options.time}</span>
      </div>
      <div class="kb-summary-item">
        <strong>Duración</strong>
        <span>${this.options.service.duration} min</span>
      </div>
    `, this.container.appendChild(o);
    const d = document.createElement("form");
    d.className = "kb-form", d.onsubmit = (C) => {
      C.preventDefault(), this.handleSubmit();
    }, d.appendChild(this.createField("name", "Nombre completo", "text", !0, "user", "Juan Pérez")), d.appendChild(this.createField("email", "Correo electrónico", "email", !0, "mail", "tu@email.com")), d.appendChild(this.createField("phone", "Teléfono", "tel", !1, "phone", "+54 11 1234-5678"));
    const u = document.createElement("div");
    u.className = "kb-form-group";
    const h = document.createElement("label");
    h.className = "kb-form-label", h.innerHTML = `${Y("note")} <span>Notas adicionales <span class="kb-optional">(opcional)</span></span>`, u.appendChild(h);
    const m = document.createElement("textarea");
    m.className = "kb-form-textarea", m.rows = 4, m.placeholder = "Agrega cualquier información adicional que consideres relevante...", m.oninput = (C) => {
      this.formData.notes = C.target.value;
    }, u.appendChild(m), d.appendChild(u), this.submitButton = document.createElement("button"), this.submitButton.type = "submit", this.submitButton.className = "kb-submit-button", this.submitButton.innerHTML = `
      <div class="kb-button-content">
        ${Y("checkCircle")}
        <span>Confirmar Reserva</span>
      </div>
      <div class="kb-spinner"></div>
    `, d.appendChild(this.submitButton), this.container.appendChild(d), t.appendChild(this.container);
  }
  createField(t, e, n, r, i, s) {
    const o = document.createElement("div");
    o.className = "kb-form-group";
    const d = document.createElement("label");
    d.className = "kb-form-label";
    const u = r ? '<span class="kb-required">*</span>' : '<span class="kb-optional">(opcional)</span>';
    d.innerHTML = `${Y(i)} <span>${e} ${u}</span>`, o.appendChild(d);
    const h = document.createElement("input");
    h.type = n, h.className = "kb-form-input", h.required = r, h.placeholder = s, h.oninput = (C) => {
      this.formData[t] = C.target.value, this.clearError(o);
    }, o.appendChild(h);
    const m = document.createElement("div");
    return m.className = "kb-form-error", o.appendChild(m), o;
  }
  handleSubmit() {
    var i, s, o;
    let t = !0;
    const e = (i = this.container) == null ? void 0 : i.querySelector(".kb-form-group:nth-child(1)");
    e && !yr(this.formData.name) && (this.showError(e, z.name), t = !1);
    const n = (s = this.container) == null ? void 0 : s.querySelector(".kb-form-group:nth-child(2)");
    n && !wr(this.formData.email) && (this.showError(n, z.email), t = !1);
    const r = (o = this.container) == null ? void 0 : o.querySelector(".kb-form-group:nth-child(3)");
    r && this.formData.phone && !br(this.formData.phone) && (this.showError(r, z.phone), t = !1), t && (this.setLoading(!0), this.options.onSubmit(this.formData));
  }
  setLoading(t) {
    this.submitButton && (t ? this.submitButton.classList.add("kb-loading") : this.submitButton.classList.remove("kb-loading"));
  }
  showError(t, e) {
    const n = t.querySelector(".kb-form-error"), r = t.querySelector(".kb-form-input");
    n && (n.textContent = e), r && r.classList.add("kb-form-input-error");
  }
  clearError(t) {
    const e = t.querySelector(".kb-form-error"), n = t.querySelector(".kb-form-input");
    e && (e.textContent = ""), n && n.classList.remove("kb-form-input-error");
  }
  formatDisplayDate(t) {
    const e = /* @__PURE__ */ new Date(t + "T00:00:00"), n = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    };
    return e.toLocaleDateString("es-ES", n);
  }
  destroy() {
    this.container && (this.container.remove(), this.container = null);
  }
}
class vr {
  constructor(t) {
    this.container = null, this.options = t;
  }
  render(t) {
    this.container = document.createElement("div"), this.container.className = "kb-confirmation";
    const e = document.createElement("div");
    e.className = "kb-success-icon", e.innerHTML = Y("checkCircle"), this.container.appendChild(e);
    const n = document.createElement("h2");
    n.className = "kb-confirmation-title", n.textContent = "¡Reserva Confirmada!", this.container.appendChild(n);
    const r = document.createElement("p");
    r.className = "kb-confirmation-message", r.innerHTML = `Hemos enviado la confirmación a<br><strong>${this.options.booking.customerEmail}</strong>`, this.container.appendChild(r);
    const i = document.createElement("div");
    i.className = "kb-booking-summary kb-confirmation-details", i.innerHTML = `
      <div class="kb-summary-item">
        <strong>Servicio</strong>
        <span>${this.options.booking.serviceName}</span>
      </div>
      <div class="kb-summary-item">
        <strong>Fecha</strong>
        <span>${this.formatDisplayDate(this.options.booking.date)}</span>
      </div>
      <div class="kb-summary-item">
        <strong>Hora</strong>
        <span>${this.options.booking.time}</span>
      </div>
    `, this.container.appendChild(i);
    const s = document.createElement("div");
    s.className = "kb-confirmation-actions";
    const o = document.createElement("button");
    o.className = "kb-submit-button", o.innerHTML = `
      <div class="kb-button-content">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="4" width="14" height="14" rx="2" stroke="currentColor" stroke-width="2"/>
          <path d="M3 8H17" stroke="currentColor" stroke-width="2"/>
          <path d="M7 2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M13 2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <span>Nueva Reserva</span>
      </div>
    `, o.onclick = () => this.options.onClose(), o.style.marginTop = "0", s.appendChild(o);
    const d = document.createElement("a");
    d.className = "kb-button-secondary", d.innerHTML = `
      ${Y("calendar")}
      <span>Agregar a Calendario</span>
    `, d.href = this.generateCalendarLink(), d.target = "_blank", d.rel = "noopener noreferrer", s.appendChild(d), this.container.appendChild(s), t.appendChild(this.container);
  }
  formatDisplayDate(t) {
    const e = /* @__PURE__ */ new Date(t + "T00:00:00"), n = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    };
    return e.toLocaleDateString("es-ES", n);
  }
  generateCalendarLink() {
    const { booking: t } = this.options, e = /* @__PURE__ */ new Date(`${t.date}T${t.time}:00`), n = new Date(e.getTime() + 60 * 60 * 1e3), r = (u) => u.toISOString().replace(/-|:|\.\d+/g, ""), i = encodeURIComponent(`${t.serviceName} - Reserva`), s = encodeURIComponent(`Reserva confirmada con ${t.customerName}`), o = r(e), d = r(n);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${i}&dates=${o}/${d}&details=${s}`;
  }
  destroy() {
    this.container && (this.container.remove(), this.container = null);
  }
}
class xr extends Ne {
  constructor() {
    super({
      name: "koru-booking",
      version: "1.0.0"
    }), this.widgetContainer = null, this.modalOverlay = null, this.triggerButton = null, this.currentStep = "service", this.services = [], this.selectedService = null, this.selectedDate = "", this.selectedTime = "", this.bookingResult = null, this.widgetConfig = null, this.isOpen = !1, this.serviceSelector = null, this.dateTimePicker = null, this.customerForm = null, this.confirmation = null, this.apiClient = G(), this.log("BookingWidget constructor called");
  }
  /**
   * Get Koru credentials from script tag data attributes
   */
  getCredentialsFromScriptTag() {
    const t = document.querySelectorAll("script[data-website-id][data-app-id]");
    if (t.length === 0)
      return console.warn("No script tag found with data-website-id and data-app-id attributes"), null;
    const e = t[0], n = e.getAttribute("data-website-id"), r = e.getAttribute("data-app-id");
    return !n || !r ? (console.warn("Script tag missing required attributes"), null) : { websiteId: n, appId: r };
  }
  /**
   * Override start to bypass Koru SDK authentication in development
   */
  async start() {
    console.log("🚀 BookingWidget.start() called");
    const t = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    console.log("isDev:", t);
    const e = this.getCredentialsFromScriptTag();
    if (!e && !t)
      throw console.error("❌ Koru credentials not found in script tag"), new Error("Koru credentials are required. Add data-website-id and data-app-id to your script tag.");
    if (e ? (this.log("🔑 Koru credentials loaded:", { websiteId: e.websiteId }), this.apiClient = G(void 0, e)) : (this.log("⚠️ Development mode: No credentials provided"), this.apiClient = G()), t) {
      this.log("🚀 Development mode detected: Bypassing Koru SDK auth");
      const n = {
        accentColor: "#0d9488",
        displayMode: "modal",
        // Cambiar a 'inline' para modo embebido
        triggerText: "Reservar cita",
        triggerPosition: "bottom-right",
        offsetX: 24,
        offsetY: 24
      };
      try {
        console.log("Calling onInit..."), await this.onInit(n), console.log("onInit completed, calling onRender..."), await this.onRender(n), console.log("onRender completed");
      } catch (r) {
        console.error("Error starting widget in dev mode:", r);
      }
      return;
    }
    console.log("🚀 Production mode: Using Koru SDK authentication");
    try {
      await super.start(), console.log("✅ Koru SDK authentication completed");
    } catch (n) {
      throw console.error("❌ Error in Koru SDK authentication:", n), n;
    }
  }
  async onInit(t) {
    console.log("📝 onInit called with config:", t), this.log("Booking Widget initialized", t);
    try {
      console.log("Fetching services from API..."), this.services = await this.apiClient.getServices(), console.log("Services loaded:", this.services), this.log("Services loaded", this.services);
    } catch (e) {
      throw console.error("Error loading services:", e), this.log("Error loading services", e), e;
    }
  }
  async onRender(t) {
    console.log("🎨 onRender called");
    const e = t;
    this.config = e, (e.displayMode || "modal") === "modal" ? this.renderModalMode(e) : this.renderInlineMode(e);
  }
  renderInlineMode(t) {
    console.log("Rendering inline mode..."), this.widgetContainer = this.createElement("div", {
      className: "koru-booking-widget"
    }), (document.getElementById("widget-root") || document.body).appendChild(this.widgetContainer), this.renderStep(t);
  }
  renderModalMode(t) {
    console.log("Rendering modal mode..."), this.triggerButton = this.createElement("button", {
      className: "kb-trigger-button"
    });
    const e = t.triggerText || "Reservar ahora";
    this.triggerButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="4" width="14" height="14" rx="2" stroke="currentColor" stroke-width="2"/>
        <path d="M3 8H17" stroke="currentColor" stroke-width="2"/>
        <path d="M7 2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M13 2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <span>${e}</span>
    `;
    const n = t.triggerPosition || "bottom-right", r = t.offsetX ?? 24, i = t.offsetY ?? 24;
    switch (n) {
      case "bottom-right":
        this.triggerButton.style.bottom = `${i}px`, this.triggerButton.style.right = `${r}px`;
        break;
      case "bottom-left":
        this.triggerButton.style.bottom = `${i}px`, this.triggerButton.style.left = `${r}px`;
        break;
      case "top-right":
        this.triggerButton.style.top = `${i}px`, this.triggerButton.style.right = `${r}px`;
        break;
      case "top-left":
        this.triggerButton.style.top = `${i}px`, this.triggerButton.style.left = `${r}px`;
        break;
    }
    this.triggerButton.onclick = () => this.openModal(t), document.body.appendChild(this.triggerButton), this.modalOverlay = this.createElement("div", {
      className: "kb-modal-overlay"
    }), this.modalOverlay.style.display = "none", this.modalOverlay.onclick = (o) => {
      o.target === this.modalOverlay && this.closeModal();
    }, this.widgetContainer = this.createElement("div", {
      className: "koru-booking-widget kb-modal-content"
    });
    const s = this.createElement("button", {
      className: "kb-modal-close"
    });
    s.innerHTML = "×", s.onclick = () => this.closeModal(), this.widgetContainer.appendChild(s), this.modalOverlay.appendChild(this.widgetContainer), document.body.appendChild(this.modalOverlay);
  }
  openModal(t) {
    !this.modalOverlay || !this.widgetContainer || (this.isOpen = !0, this.modalOverlay.style.display = "flex", requestAnimationFrame(() => {
      this.modalOverlay.classList.add("kb-modal-open");
    }), this.widgetContainer.querySelector(".kb-step-container") || this.renderStep(t), document.body.style.overflow = "hidden");
  }
  closeModal() {
    this.modalOverlay && (this.isOpen = !1, this.modalOverlay.classList.remove("kb-modal-open"), setTimeout(() => {
      this.modalOverlay && (this.modalOverlay.style.display = "none");
    }, 300), document.body.style.overflow = "");
  }
  async renderStep(t) {
    if (!this.widgetContainer) return;
    this.clearCurrentComponent();
    const e = this.createElement("div", {
      className: "kb-step-container"
    });
    this.widgetContainer.innerHTML = "", this.widgetContainer.appendChild(e);
    const n = t.accentColor || "#00C896";
    switch (this.currentStep) {
      case "service":
        this.serviceSelector = new _e({
          services: this.services,
          accentColor: n,
          layout: "list",
          // Layout is now managed from backoffice, hardcoded to 'list'
          onSelect: (r) => this.handleServiceSelect(r, t)
        }), this.serviceSelector.render(e);
        break;
      case "datetime":
        this.selectedService && (this.dateTimePicker = new gr({
          service: this.selectedService,
          accentColor: n,
          apiClient: this.apiClient,
          onSelect: (r, i) => this.handleDateTimeSelect(r, i, t),
          onBack: () => this.goToStep("service", t)
        }), await this.dateTimePicker.render(e));
        break;
      case "form":
        this.selectedService && (this.customerForm = new kr({
          service: this.selectedService,
          date: this.selectedDate,
          time: this.selectedTime,
          accentColor: n,
          onSubmit: (r) => this.handleFormSubmit(r, t),
          onBack: () => this.goToStep("datetime", t)
        }), this.customerForm.render(e));
        break;
      case "confirmation":
        this.bookingResult && (this.confirmation = new vr({
          booking: this.bookingResult,
          accentColor: n,
          onClose: () => this.resetWidget(t)
        }), this.confirmation.render(e));
        break;
    }
  }
  clearCurrentComponent() {
    var t, e, n, r;
    (t = this.serviceSelector) == null || t.destroy(), (e = this.dateTimePicker) == null || e.destroy(), (n = this.customerForm) == null || n.destroy(), (r = this.confirmation) == null || r.destroy(), this.serviceSelector = null, this.dateTimePicker = null, this.customerForm = null, this.confirmation = null;
  }
  handleServiceSelect(t, e) {
    this.log("Service selected", t), this.selectedService = t, this.goToStep("datetime", e);
  }
  handleDateTimeSelect(t, e, n) {
    this.log("Date/Time selected", { date: t, time: e }), this.selectedDate = t, this.selectedTime = e, this.goToStep("form", n);
  }
  async handleFormSubmit(t, e) {
    if (this.log("Form submitted", t), !(!this.selectedService || !this.widgetContainer)) {
      this.showLoading();
      try {
        this.bookingResult = await this.apiClient.createBooking({
          serviceId: this.selectedService.id,
          date: this.selectedDate,
          time: this.selectedTime,
          customerName: t.name,
          customerEmail: t.email,
          customerPhone: t.phone,
          notes: t.notes
        }), this.log("Booking created", this.bookingResult), this.track("booking_completed", {
          serviceId: this.selectedService.id,
          date: this.selectedDate,
          time: this.selectedTime
        }), this.goToStep("confirmation", e);
      } catch (n) {
        this.log("Error creating booking", n), this.showError(n.message);
      }
    }
  }
  goToStep(t, e) {
    this.currentStep = t, this.renderStep(e);
  }
  resetWidget(t) {
    this.selectedService = null, this.selectedDate = "", this.selectedTime = "", this.bookingResult = null, this.goToStep("service", t);
  }
  showLoading() {
    this.widgetContainer && (this.widgetContainer.innerHTML = `
      <div class="kb-loading-overlay" style="min-height: 400px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px;">
        <div class="kb-spinner" style="
          width: 48px;
          height: 48px;
          border: 4px solid #e2e8f0;
          border-top-color: #0d9488;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        "></div>
        <p style="margin-top: 20px; font-size: 16px; color: #64748b; font-weight: 500;">Procesando tu reserva...</p>
      </div>
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    `);
  }
  showError(t) {
    if (!this.widgetContainer) return;
    const e = this.createElement("div", {
      className: "kb-error-message",
      style: {
        padding: "20px",
        backgroundColor: "#fee",
        border: "1px solid #fcc",
        borderRadius: "8px",
        color: "#c33",
        textAlign: "center"
      }
    });
    e.textContent = t, this.widgetContainer.innerHTML = "", this.widgetContainer.appendChild(e), setTimeout(() => {
      this.config && this.goToStep(this.currentStep, this.config);
    }, 3e3);
  }
  async onDestroy() {
    var t;
    this.clearCurrentComponent(), (t = this.widgetContainer) == null || t.remove(), this.widgetContainer = null, this.log("Widget destroyed");
  }
  async onConfigUpdate(t) {
    this.log("Config updated", t), await this.renderStep(t);
  }
}
typeof window < "u" && new xr().start();
export {
  xr as BookingWidget
};
//# sourceMappingURL=koru-booking-widget.es.js.map
