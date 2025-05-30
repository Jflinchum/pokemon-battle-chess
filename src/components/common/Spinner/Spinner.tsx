import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./Spinner.css";

const Spinner = ({ className }: { className?: string }) => {
  return (
    <FontAwesomeIcon
      icon={faSpinner}
      className={`spinner ${className || ""}`}
    />
  );
};

export default Spinner;
