const { createProxyMiddleware } = require("http-proxy-middleware");

// Local dev only: settings.ts points API_URL at "/api" for production
// (nginx proxies /api to the backend there). This mirrors that locally
// by forwarding /api/* to the backend on :9191, stripping the /api prefix.
// No websocket traffic ever goes through /api, so ws:true here would only
// grab Node's server-wide 'upgrade' event and race webpack-dev-server's own
// HMR socket (also on this dev server) for it — hence ws left off below.
module.exports = function (app) {
  app.use(
    "/api",
    createProxyMiddleware({
      target: "http://localhost:9700",
      changeOrigin: true,
      pathRewrite: { "^/api": "" },
    })
  );
};
