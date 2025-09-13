import React from "react";

type State = { hasError: boolean };

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };
  
  static getDerivedStateFromError() { 
    return { hasError: true }; 
  }
  
  componentDidCatch(err: unknown) { 
    console.error("ErrorBoundary caught:", err); 
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 border rounded-xl bg-white">
          <div className="text-lg font-semibold text-slate-900">Something went wrong.</div>
          <div className="text-sm text-slate-600 mt-1">
            Please reload the page. If the issue persists, contact support.
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}