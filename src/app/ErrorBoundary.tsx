import type { ErrorInfo, ReactNode } from 'react';
import { Component } from 'react';

type Fallback = ReactNode | ((error: Error) => ReactNode);

interface Props {
  children: ReactNode;
  fallback?: Fallback;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    // biome-ignore lint/suspicious/noConsole: error boundaries intentionally report uncaught render errors.
    console.error('Uncaught error:', error, info.componentStack);
  }

  override render() {
    const { error } = this.state;
    const { fallback, children } = this.props;
    if (error) {
      return typeof fallback === 'function' ? fallback(error) : (fallback ?? null);
    }
    return children;
  }
}
