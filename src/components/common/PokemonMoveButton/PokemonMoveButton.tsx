import { ReactNode } from "react";
import './PokemonMoveButton.css';

interface PokemonMoveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onClick?: () => void;
  colorPrimary?: string;
  colorSecondary?: string;
  toolTip?: ReactNode;
};

const PokemonMoveButton = ({ onClick, colorPrimary = 'white', colorSecondary = 'white', children, toolTip, className = '', disabled, type }: PokemonMoveButtonProps) => {

  return (
    <button
      style={{ border: `${colorPrimary} solid 3px`, background: `linear-gradient(0deg, ${colorPrimary} 0%, ${colorSecondary} 100%)` }}
      className={`button ${className}`}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {children}
      {
        toolTip && (
          <div className='tooltip'>
            {toolTip}
          </div>
        )
      }
    </button>
  );
}

export default PokemonMoveButton;