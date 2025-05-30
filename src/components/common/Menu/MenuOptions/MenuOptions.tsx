import "./MenuOptions.css";

interface MenuOptionsProps {
  label: string;
  onClick?: () => void;
  active?: boolean;
}

export const MenuOptions = ({ label, active, onClick }: MenuOptionsProps) => {
  return (
    <button
      className={`menuOptionsButton ${active ? "menuOptionsButtonActive" : ""}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
};
