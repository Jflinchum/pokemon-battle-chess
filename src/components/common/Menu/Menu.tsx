import { useState } from "react";
import { MenuOptions } from "./MenuOptions/MenuOptions";
import './Menu.css';

interface MenuProps {
  navLabels: string[];
  menuScreens: React.ReactNode[]
}

export const Menu = ({ navLabels, menuScreens }: MenuProps) => {
  if (navLabels.length !== menuScreens.length) {
    return (
      <>Make sure to have the same amount of navLabels as menuScreens</>
    );
  }

  const [menuIndex, setMenuIndex] = useState(0);

  return (
    <div className='menuContainer'>
      <div className='menuSideNavContainer'>
        {
          navLabels.map((label, index) => (
            <MenuOptions active={menuIndex === index} key={label} label={label} onClick={() => setMenuIndex(index)} />
          ))
        }
      </div>
      <div className='menuMainContentContainer'>
        {menuScreens[menuIndex]}
      </div>
    </div>
  );
};