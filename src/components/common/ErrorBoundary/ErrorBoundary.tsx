import * as React from 'react';
import sadPikachu from '../../../assets/pokemonAssets/sadPikachu.png';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // TODO: log to service
    console.log(error);
    console.log(info);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className='errorBoundaryContainer'>
          <img src={sadPikachu} />
          <p>Uh oh! Something went wrong!</p>
          <p>Please open up the dev console and send a screenshot to the silly dev that made a mistake. Then, refresh the page and go back to what you were doing.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;