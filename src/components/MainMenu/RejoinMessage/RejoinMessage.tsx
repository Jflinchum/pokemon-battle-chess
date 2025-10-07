import Button from "../../common/Button/Button";
import "./RejoinMessage.css";

export interface RejoinMessageProps {
  data: { onYesClick: () => void; onNoClick: () => void };
  closeToast: () => void;
}

export const RejoinMessage = ({ data, closeToast }: RejoinMessageProps) => {
  const handleYesClick = () => {
    data.onYesClick();
    closeToast();
  };

  const handleNoClick = () => {
    data.onNoClick();
    closeToast();
  };

  return (
    <div>
      <span>
        It looks like your most recent game is still on-going. Would you like to
        re-join?
      </span>
      <div className="rejoinButtonContainer">
        <Button onClick={handleNoClick} data-testid="rejoin-message-no-button">
          No
        </Button>
        <Button
          onClick={handleYesClick}
          color="primary"
          className="rejoinSubmit"
          data-testid="rejoin-message-yes-button"
        >
          Yes
        </Button>
      </div>
    </div>
  );
};
