import { Tooltip as ReactTooltip, ITooltip } from "react-tooltip";
import "./Tooltip.css";

const Tooltip = ({ children, className = "", ...props }: ITooltip) => {
  return (
    <span className="tooltipContainer">
      <ReactTooltip {...props} className={`tooltip ${className}`}>
        {children}
      </ReactTooltip>
    </span>
  );
};

export default Tooltip;
