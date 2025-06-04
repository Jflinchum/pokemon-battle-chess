import { ReactNode } from "react";
import Tooltip from "../Tooltip/Tooltip";
import "./PokemonMoveButton.css";

interface PokemonMoveButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  id: string;
  onClick?: () => void;
  colorPrimary?: string;
  colorSecondary?: string;
  toolTip?: ReactNode;
}

const PokemonMoveButton = ({
  id,
  onClick,
  colorPrimary = "white",
  colorSecondary = "white",
  children,
  toolTip,
  className = "",
  disabled,
  type,
}: PokemonMoveButtonProps) => {
  return (
    <>
      <button
        id={id}
        style={{
          border: `${colorPrimary} solid 3px`,
          background: `linear-gradient(0deg, ${colorPrimary} 0%, ${colorSecondary} 100%)`,
        }}
        className={`pokemonMoveButton ${className}`}
        onClick={onClick}
        disabled={disabled}
        type={type}
      >
        {children}
      </button>
      <Tooltip anchorSelect={`#${id}`}>{toolTip}</Tooltip>
    </>
  );
};

export default PokemonMoveButton;
