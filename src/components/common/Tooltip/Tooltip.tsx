import { Tooltip as ReactTooltip, ITooltip } from "react-tooltip";
import "./Tooltip.css";

interface TooltipProps extends ITooltip {
  darkBG?: boolean;
}

const Tooltip = ({
  children,
  darkBG,
  className = "",
  ...props
}: TooltipProps) => {
  return (
    <span className={`tooltipContainer ${darkBG ? "darkTooltip" : ""}`}>
      <ReactTooltip {...props} className={`tooltip ${className}`}>
        {children}
      </ReactTooltip>
    </span>
  );
};

export default Tooltip;
