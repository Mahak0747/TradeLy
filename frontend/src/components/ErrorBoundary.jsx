import React from "react";

/** Prevents one rendering bug from blanking the whole app (the original white-screened). */
export default class ErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error, info) {
    console.error("UI error:", error, info?.componentStack);
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h3>Something went wrong displaying this page.</h3>
        <button type="button" onClick={() => window.location.reload()} style={{ padding: "8px 16px", cursor: "pointer" }}>
          Reload
        </button>
      </div>
    );
  }
}
