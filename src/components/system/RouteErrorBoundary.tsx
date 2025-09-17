import React from "react";

export class RouteErrorBoundary extends React.Component<
  { children: React.ReactNode }, 
  { error: any }
> {
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("RouteErrorBoundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6">
          <div className="max-w-2xl w-full">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="text-red-600 font-medium mb-4">Something went wrong</div>
              <details className="text-sm">
                <summary className="cursor-pointer text-slate-700 mb-2">
                  Click to see error details
                </summary>
                <pre className="text-xs whitespace-pre-wrap bg-slate-100 p-3 rounded border overflow-auto">
                  {String(this.state.error?.message || this.state.error)}
                  {this.state.error?.stack && (
                    <>
                      {"\n\nStack trace:\n"}
                      {this.state.error.stack}
                    </>
                  )}
                </pre>
              </details>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}