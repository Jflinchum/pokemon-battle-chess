import { useModalState } from "../../../../context/ModalState/ModalStateContext";
import Button from "../../../common/Button/Button";
import { PokemonSprite } from "../../../common/Pokemon/PokemonSprite/PokemonSprite";
import { changeLog } from "../../../Modals/ChangeLogModal/ChangeLogData/changeLog";
import "./ChangeLogButton.css";

export const ChangeLogButton = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLButtonElement>) => {
  const { dispatch: dispatchModalState } = useModalState();

  const handleChangeLogClick = () => {
    dispatchModalState({ type: "OPEN_CHANGE_LOG_MODAL", payload: {} });
  };

  return (
    <Button
      {...props}
      color="light"
      className={`changeLogButton ${className || ""}`}
      onClick={() => handleChangeLogClick()}
    >
      Change Log - {changeLog[0].version} {changeLog[0].title}
      <PokemonSprite
        pokemonIdentifier={changeLog[0].mascot.identifier}
        gender={changeLog[0].mascot.gender}
        className="changeLogButtonMascot"
      />
    </Button>
  );
};
