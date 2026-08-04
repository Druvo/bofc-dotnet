// Standalone static+proxy server for testing the PRODUCTION build locally
// (needed because the service worker — and therefore real Web Push — only
// registers when NODE_ENV === "production", which the CRA dev server never is).
const path = require("path");
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const BUILD_DIR = "D:\\Projects\\RND\\bofc-dotnet\\bofc-frontend\\build";

app.use("/api", createProxyMiddleware({ target: "http://localhost:9191", changeOrigin: true, pathRewrite: { "^/api": "" } }));
app.use("/ws/auction", createProxyMiddleware({ target: "http://localhost:9191", changeOrigin: true, ws: true }));

app.use(express.static(BUILD_DIR));
app.get("*", (req, res) => res.sendFile(path.join(BUILD_DIR, "index.html")));

const PORT = 5000;
app.listen(PORT, () => console.log(`Production build serving on http://localhost:${PORT}`));
