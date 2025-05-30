import "./ProgressBar.css";

interface ProgressBarProps {
  className: string;
  filled: number;
  color: string;
}

const ProgressBar = ({ filled, color, className }: ProgressBarProps) => {
  return (
    <div className={`${className} progressBarContainer`}>
      <div
        className="progressBarFiller"
        style={{ backgroundColor: color, width: `${filled}%` }}
      ></div>
    </div>
  );
};

export default ProgressBar;
