import { Tooltip as ReactTooltip, ITooltip } from "react-tooltip";
import './Tooltip.css';

const Tooltip = ({ children, className = '', ...props }: ITooltip) => {

  return (
    <ReactTooltip {...props} className={`tooltip ${className}`}>
      {children}
    </ReactTooltip>
  );
}

export default Tooltip;