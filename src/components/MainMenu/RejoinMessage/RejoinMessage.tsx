import Button from "../../common/Button/Button";
import "./RejoinMessage.css";

export const RejoinMessage = ({
  data,
  closeToast,
}: {
  data: { onYesClick: () => void; onNoClick: () => void };
  closeToast: () => void;
}) => {
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
        <Button onClick={handleNoClick}>No</Button>
        <Button
          onClick={handleYesClick}
          color="primary"
          className="rejoinSubmit"
        >
          Yes
        </Button>
      </div>
    </div>
  );
};
