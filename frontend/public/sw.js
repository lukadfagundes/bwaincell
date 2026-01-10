if (!self.define) {
  let e,
    s = {};
  const t = (t, c) => (
    (t = new URL(t + ".js", c).href),
    s[t] ||
      new Promise((s) => {
        if ("document" in self) {
          const e = document.createElement("script");
          ((e.src = t), (e.onload = s), document.head.appendChild(e));
        } else ((e = t), importScripts(t), s());
      }).then(() => {
        let e = s[t];
        if (!e) throw new Error(`Module ${t} didn’t register its module`);
        return e;
      })
  );
  self.define = (c, a) => {
    const i =
      e ||
      ("document" in self ? document.currentScript.src : "") ||
      location.href;
    if (s[i]) return;
    let n = {};
    const u = (e) => t(e, i),
      r = { module: { uri: i }, exports: n, require: u };
    s[i] = Promise.all(c.map((e) => r[e] || u(e))).then((e) => (a(...e), n));
  };
}
define(["./workbox-f52fd911"], function (e) {
  "use strict";
  (importScripts(),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        {
          url: "/_next/app-build-manifest.json",
          revision: "15bbdde06b218be4a9c66ca0ee639fc3",
        },
        {
          url: "/_next/static/asWt81mget6up9Nwkc19k/_buildManifest.js",
          revision: "172e769da91baa11de9b258fb2d92f86",
        },
        {
          url: "/_next/static/asWt81mget6up9Nwkc19k/_ssgManifest.js",
          revision: "b6652df95db52feb4daf4eca35380933",
        },
        {
          url: "/_next/static/chunks/117-808f10ba8b898a71.js",
          revision: "asWt81mget6up9Nwkc19k",
        },
        {
          url: "/_next/static/chunks/183-c05282c4d29d06e9.js",
          revision: "asWt81mget6up9Nwkc19k",
        },
        {
          url: "/_next/static/chunks/27-7394c83a71abb822.js",
          revision: "asWt81mget6up9Nwkc19k",
        },
        {
          url: "/_next/static/chunks/476-6883aada4ac37265.js",
          revision: "asWt81mget6up9Nwkc19k",
        },
        {
          url: "/_next/static/chunks/481-78a91837c2bbfdfa.js",
          revision: "asWt81mget6up9Nwkc19k",
        },
        {
          url: "/_next/static/chunks/490-1935809f7dee73d7.js",
          revision: "asWt81mget6up9Nwkc19k",
        },
        {
          url: "/_next/static/chunks/513-383feaa9cb99fc96.js",
          revision: "asWt81mget6up9Nwkc19k",
        },
        {
          url: "/_next/static/chunks/569-718f2851b81ae8a0.js",
          revision: "asWt81mget6up9Nwkc19k",
        },
        {
          url: "/_next/static/chunks/605-9d6763d9bc0b948b.js",
          revision: "asWt81mget6up9Nwkc19k",
        },
        {
          url: "/_next/static/chunks/648-121c50e66f2b2175.js",
          revision: "asWt81mget6up9Nwkc19k",
        },
        {
          url: "/_next/static/chunks/68-fd746424876d45e0.js",
          revision: "asWt81mget6up9Nwkc19k",
        },
        {
          url: "/_next/static/chunks/709.7670b3db97b09884.js",
          revision: "7670b3db97b09884",
        },
        {
          url: "/_next/static/chunks/714.1a38251b6fee2804.js",
          revision: "1a38251b6fee2804",
        },
        {
          url: "/_next/static/chunks/763-23be102c21ec6dbf.js",
          revision: "asWt81mget6up9Nwkc19k",
        },
        {
          url: "/_next/static/chunks/813-78ab302170255f2f.js",
          revision: "asWt81mget6up9Nwkc19k",
        },
        {
          url: "/_next/static/chunks/859-c58e00e5ecf499f2.js",
          revision: "asWt81mget6up9Nwkc19k",
        },
        {
          url: "/_next/static/chunks/944-dc7ddff8936ad4a2.js",
          revision: "asWt81mget6up9Nwkc19k",
        },
        {
          url: "/_next/static/chunks/954-8d7347d89b072cdb.js",
          revision: "asWt81mget6up9Nwkc19k",
        },
        {
          url: "/_next/static/chunks/app/_not-found/page-07307f3324296403.js",
          revision: "asWt81mget6up9Nwkc19k",
        },
        {
          url: "/_next/static/chunks/app/dashboard/budget/page-19c2bb3d774786db.js",
          revision: "asWt81mget6up9Nwkc19k",
        },
        {
          url: "/_next/static/chunks/app/dashboard/layout-ef840b27198798b1.js",
          revision: "asWt81mget6up9Nwkc19k",
        },
        {
          url: "/_next/static/chunks/app/dashboard/lists/page-c27dbd32645e2e0e.js",
          revision: "asWt81mget6up9Nwkc19k",
        },
        {
          url: "/_next/static/chunks/app/dashboard/notes/page-c07adc0f60dee5a4.js",
          revision: "asWt81mget6up9Nwkc19k",
        },
        {
          url: "/_next/static/chunks/app/dashboard/page-476bc6213bd049c8.js",
          revision: "asWt81mget6up9Nwkc19k",
        },
        {
          url: "/_next/static/chunks/app/dashboard/reminders/page-de444770cc83fca8.js",
          revision: "asWt81mget6up9Nwkc19k",
        },
        {
          url: "/_next/static/chunks/app/dashboard/tasks/page-e2fc84f4df0ea09d.js",
          revision: "asWt81mget6up9Nwkc19k",
        },
        {
          url: "/_next/static/chunks/app/layout-02dd0df1f80614b3.js",
          revision: "asWt81mget6up9Nwkc19k",
        },
        {
          url: "/_next/static/chunks/app/login/page-eae0c8679312106a.js",
          revision: "asWt81mget6up9Nwkc19k",
        },
        {
          url: "/_next/static/chunks/app/page-4d5208379c4d1c3b.js",
          revision: "asWt81mget6up9Nwkc19k",
        },
        {
          url: "/_next/static/chunks/app/privacy/page-c368ce88693406ac.js",
          revision: "asWt81mget6up9Nwkc19k",
        },
        {
          url: "/_next/static/chunks/app/terms/page-afbcf6a383cc3c84.js",
          revision: "asWt81mget6up9Nwkc19k",
        },
        {
          url: "/_next/static/chunks/fd9d1056-81d1bacde8d5a64f.js",
          revision: "asWt81mget6up9Nwkc19k",
        },
        {
          url: "/_next/static/chunks/framework-00a8ba1a63cfdc9e.js",
          revision: "asWt81mget6up9Nwkc19k",
        },
        {
          url: "/_next/static/chunks/main-app-760bb69774915a23.js",
          revision: "asWt81mget6up9Nwkc19k",
        },
        {
          url: "/_next/static/chunks/main-f5e27a66bbb445f6.js",
          revision: "asWt81mget6up9Nwkc19k",
        },
        {
          url: "/_next/static/chunks/pages/_app-15e2daefa259f0b5.js",
          revision: "asWt81mget6up9Nwkc19k",
        },
        {
          url: "/_next/static/chunks/pages/_error-28b803cb2479b966.js",
          revision: "asWt81mget6up9Nwkc19k",
        },
        {
          url: "/_next/static/chunks/polyfills-42372ed130431b0a.js",
          revision: "846118c33b2c0e922d7b3a7676f81f6f",
        },
        {
          url: "/_next/static/chunks/webpack-a59a753cfa00f5e4.js",
          revision: "asWt81mget6up9Nwkc19k",
        },
        {
          url: "/_next/static/css/9619ee9532c691bb.css",
          revision: "9619ee9532c691bb",
        },
        { url: "/icon-192.png", revision: "c1e5e5d3444aa9b83cc4ae6bf2ccbbf8" },
        { url: "/icon-192.svg", revision: "8293ec633fa01e7600fbe5f602e517c1" },
        { url: "/icon-512.png", revision: "838e0f19d855facb5edfed2822d67cd9" },
        { url: "/icon-512.svg", revision: "586f65792b57f7229a01d9c02bac4bb2" },
        { url: "/icon.svg", revision: "1f0720165ea6b8f0c4f2ac2d2d874a5b" },
        { url: "/manifest.json", revision: "34abd90b6f4076580de9814dbbcd75c5" },
      ],
      { ignoreURLParametersMatching: [] },
    ),
    e.cleanupOutdatedCaches(),
    e.registerRoute(
      "/",
      new e.NetworkFirst({
        cacheName: "start-url",
        plugins: [
          {
            cacheWillUpdate: async ({
              request: e,
              response: s,
              event: t,
              state: c,
            }) =>
              s && "opaqueredirect" === s.type
                ? new Response(s.body, {
                    status: 200,
                    statusText: "OK",
                    headers: s.headers,
                  })
                : s,
          },
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
      new e.CacheFirst({
        cacheName: "google-fonts",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 31536e3 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:jpg|jpeg|png|svg|gif|webp)$/i,
      new e.CacheFirst({
        cacheName: "image-cache",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 2592e3 }),
        ],
      }),
      "GET",
    ));
});
