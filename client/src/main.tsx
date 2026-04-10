import { createRoot } from "react-dom/client";
import { Component, type ReactNode } from "react";
import App from "./App";
import "./index.css";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error?: Error }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: unknown) {
    console.error("App crashed:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", padding: "24px", background: "white", color: "#b91c1c", fontFamily: "system-ui, sans-serif" }}>
          <h1>Aplikasi mengalami error</h1>
          <p>{this.state.error?.message || "Unknown error"}</p>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: "12px", border: "none", borderRadius: "8px", background: "#111827", color: "white", padding: "10px 14px" }}
          >
            Muat ulang
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
