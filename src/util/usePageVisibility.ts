import { useEffect, useState } from "react";


const usePageVisibility = () => {
  const [isVisible, setIsVisible] = useState(!document.hidden);

  useEffect(() => {
    const onHiddenChange = () => {
      setIsVisible(!document.hidden);
    }
    document.addEventListener('visibilitychange', onHiddenChange, false);

    return () => {
      document.removeEventListener('visibilitychange', onHiddenChange);
    }
  }, []);

  return { isVisible };
};

export default usePageVisibility;