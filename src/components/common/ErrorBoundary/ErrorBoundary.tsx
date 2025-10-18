import * as React from "react";
import sadPikachu from "../../../assets/pokemonAssets/sadPikachu.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClipboard, faDownload } from "@fortawesome/free-solid-svg-icons";
import "./ErrorBoundary.css";

class ErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    hasMatchHistory: boolean;
    onMatchHistoryDownloadClick: (error?: Error) => void;
  },
  { hasError: boolean; error?: Error }
> {
  constructor(props: {
    children: React.ReactNode;
    hasMatchHistory: boolean;
    onMatchHistoryDownloadClick: () => void;
  }) {
    super(props);
    this.state = { hasError: false };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // TODO: log to service
    console.log(error);
    console.log(info);
    this.setState({
      hasError: true,
      error,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="errorBoundaryContainer">
          <img src={sadPikachu} />
          <p>Uh oh! Something went wrong!</p>
          {this.props.hasMatchHistory ? (
            <div>
              <p>
                It looks like you were recently in a match. If you're able to,
                please use the following button to download the replay
                {this.state.hasError && this.state.error ? (
                  <>/error</>
                ) : null}{" "}
                and post it over at{" "}
                <a
                  href={
                    "https://github.com/Jflinchum/pokemon-battle-chess/issues"
                  }
                >
                  https://github.com/Jflinchum/pokemon-battle-chess/issues
                </a>
              </p>
              <div>
                <button
                  onClick={() =>
                    this.props.onMatchHistoryDownloadClick(this.state.error)
                  }
                >
                  <FontAwesomeIcon icon={faDownload} /> Download Replay
                </button>
              </div>
            </div>
          ) : null}
          {this.state.hasError && this.state.error ? (
            <p>
              {this.props.hasMatchHistory ? null : (
                <span>
                  If you're able to, please use the following button to copy the
                  error and post it over at{" "}
                  <a
                    href={
                      "https://github.com/Jflinchum/pokemon-battle-chess/issues"
                    }
                  >
                    https://github.com/Jflinchum/pokemon-battle-chess/issues
                  </a>
                </span>
              )}
              <span className="errorBoundaryCopyErrorContainer">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      JSON.stringify({
                        errorName: this.state.error?.name,
                        errorMessage: this.state.error?.message,
                        errorStack: this.state.error?.stack,
                      }),
                    );
                  }}
                >
                  <FontAwesomeIcon icon={faClipboard} /> Copy Error
                </button>
              </span>
            </p>
          ) : null}
          <p>
            It would be super helpful if you include a brief description of what
            happened. Thanks!
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
