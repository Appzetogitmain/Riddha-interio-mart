import React from 'react';
import { FiAlertTriangle, FiRotateCw, FiHome } from 'react-icons/fi';
import monitoring from '../utils/monitoring';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.resetErrorBoundary = this.resetErrorBoundary.bind(this);
  }

  static getDerivedStateFromError(error) {
    // Update state so next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log exception to our centralized monitoring system
    monitoring.logException(error, {
      componentStack: errorInfo.componentStack,
      type: 'react_error_boundary'
    });
  }

  resetErrorBoundary() {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  }

  render() {
    if (this.state.hasError) {
      // If props provide a custom fallback component, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] w-full flex items-center justify-center bg-gradient-to-tr from-gray-50 to-gray-100 p-6 rounded-2xl border border-gray-200 shadow-sm my-4">
          <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-xl max-w-lg w-full text-center border border-red-100">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 border border-red-100 animate-pulse">
              <FiAlertTriangle size={32} />
            </div>
            
            <h2 className="text-2xl font-black text-gray-900 mb-2 font-display">
              Component Encounters a Glitch
            </h2>
            <p className="text-sm text-gray-500 mb-6 font-medium">
              We encountered an unexpected crash. The error has been logged automatically, and we are working to resolve it.
            </p>

            <div className="bg-gray-950 p-4 rounded-xl text-left overflow-x-auto mb-6 border border-gray-800 shadow-inner">
              <p className="text-xs text-red-400 font-mono select-all">
                {this.state.error?.toString() || 'Unknown Component Exception'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.resetErrorBoundary}
                className="flex items-center justify-center gap-2 bg-[#001B4E] text-white px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#A29A88] transition-all hover:scale-[1.02]"
              >
                <FiRotateCw size={14} className="animate-spin-slow" />
                Try Recovering
              </button>

              <button
                onClick={() => {
                  const path = window.location.pathname;
                  if (path.startsWith('/seller')) {
                    window.location.assign('/seller/dashboard');
                  } else if (path.startsWith('/admin')) {
                    window.location.assign('/admin/dashboard');
                  } else if (path.startsWith('/delivery')) {
                    window.location.assign('/delivery/dashboard');
                  } else {
                    window.location.assign('/');
                  }
                }}
                className="flex items-center justify-center gap-2 bg-gray-100 text-gray-800 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-all hover:scale-[1.02]"
              >
                <FiHome size={14} />
                Return to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
