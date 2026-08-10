import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import reportWebVitals from "./reportWebVitals";
import { Provider } from "react-redux";
import store from "./state/store";
import { normalizeErrorMessage } from "./utils/normalizeErrorMessage";
import { showErrorNotification } from "./utils/errorNotification";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";

// Suppress harmless ResizeObserver error from ReactFlow
// This is a known issue: https://github.com/xyflow/xyflow/issues/3457
const resizeObserverLoopErrRe = /^ResizeObserver loop (completed with undelivered notifications|limit exceeded)/;

// Override console.error to filter out ResizeObserver errors
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  const firstArg = args[0];
  if (typeof firstArg === 'string' && resizeObserverLoopErrRe.test(firstArg)) {
    return;
  }
  originalConsoleError.apply(console, args);
};

// Also handle window error events
window.addEventListener('error', (event: ErrorEvent) => {
  if (resizeObserverLoopErrRe.test(event.message)) {
    event.stopImmediatePropagation();
    event.preventDefault();
  }
});

// Prevent dev/runtime overlay crashes caused by unhandled API promise rejections
// that may carry non-Error objects (e.g., backend 403 payload objects).
window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
  const reason = event.reason as any;

  const hasApiShape = Boolean(
    reason &&
      typeof reason === 'object' &&
      (reason.statusCode || reason.status || reason.data || reason.response)
  );

  if (!hasApiShape) {
    return;
  }

  const statusCode =
    reason?.statusCode ||
    reason?.status ||
    reason?.response?.status ||
    reason?.data?.statusCode;

  const apiPayload = reason?.response?.data || reason?.data || reason;
  const message = normalizeErrorMessage(apiPayload, "An unexpected error occurred");

  event.preventDefault();

  showErrorNotification({
    statusCode: typeof statusCode === 'number' ? statusCode : undefined,
    message,
  });
});

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// Enables installability (Add to Home Screen / desktop install) - see
// public/sw.js for what it does and, importantly, does not cache.
serviceWorkerRegistration.register();
