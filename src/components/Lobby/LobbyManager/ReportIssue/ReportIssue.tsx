import { useState } from "react";
import { faQuestion } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./ReportIssue.css";

export const ReportIssue = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="reportIssueContainer">
      <button
        className={`reportIssueButton ${open ? "" : "reportIssueButtonClosed"}`}
        onClick={() => setOpen(!open)}
      >
        {open ? (
          <>
            Need to report an issue?{" "}
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://github.com/Jflinchum/pokemon-battle-chess/issues"
            >
              Click here
            </a>
          </>
        ) : (
          <FontAwesomeIcon icon={faQuestion} />
        )}
      </button>
    </div>
  );
};
