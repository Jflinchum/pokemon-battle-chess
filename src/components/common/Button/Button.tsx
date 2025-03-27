import { ReactNode } from "react";
import './Button.css';

interface ButtonProps extends React.HTMLProps<HTMLButtonElement> {
  onClick?: () => void;
  colorPrimary?: string;
  colorSecondary?: string;
  toolTip?: ReactNode;
};

const Button = ({ onClick, colorPrimary = 'white', colorSecondary = 'white', children, toolTip, className = '', disabled }: ButtonProps) => {

  return (
    <button
      style={{ border: `${colorPrimary} solid 3px`, background: `linear-gradient(0deg, ${colorPrimary} 0%, ${colorSecondary} 100%)` }}
      className={`button ${className}`}
      onClick={onClick}
      disabled={disabled}
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

export default Button;