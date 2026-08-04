const { createProxyMiddleware } = require("http-proxy-middleware");

// Local dev only: settings.ts points API_URL at "/api" for production
// (nginx proxies /api to the backend there). This mirrors that locally
// by forwarding /api/* to the backend on :9191, stripping the /api prefix.
// No websocket traffic ever goes through /api, so ws:true here would only
// grab Node's server-wide 'upgrade' event and race webpack-dev-server's own
// HMR socket (also on this dev server) for it — hence ws left off below.
//
// The auction live-bidding socket connects to /ws/auction directly (see
// useAuctionWebSocket.ts), same as nginx's own separate `location /ws/`
// block in prod (nginx.conf) — mirrored here as its own proxy entry so it
// isn't silently unrouted in dev.
//
// Deliberately NOT ws:true. webpack-dev-server registers any ws:true proxy's
// upgrade handler globally on the raw HTTP server's 'upgrade' event
// (lib/Server.js, "Keep track of websocket proxies for external websocket
// upgrade") — that registration isn't scoped by this middleware's mount
// path, so it collides with webpack-dev-server's own HMR client socket
// (also on path "/ws" by default — see its defaultWebSocketServerOptions),
// producing ERR_STREAM_WRITE_AFTER_END and breaking hot reload. Without
// ws:true, plain HTTP still proxies fine — SockJS's own info/handshake and
// polling-transport requests are regular HTTP, so the auction connection
// falls back to HTTP long-polling locally (works, just not a persistent
// socket). Production's nginx `location /ws/` block does the real WebSocket
// upgrade correctly and isn't affected by any of this.
module.exports = function (app) {
  app.use(
    "/api",
    createProxyMiddleware({
      target: "http://localhost:8080",
      changeOrigin: true,
      pathRewrite: { "^/api": "" },
    })
  );

  app.use(
    "/ws/auction",
    createProxyMiddleware({
      target: "http://localhost:8080",
      changeOrigin: true,
    })
  );
};
