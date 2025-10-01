import {
  faVolumeHigh,
  faVolumeLow,
  faVolumeMute,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMemo, useState } from "react";
import { useDebounce } from "../../../utils";
import "./VolumeSlider.css";

export interface VolumeSliderProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  initialVolume?: number;
  onVolumeUpdate?: (volume: number) => void;
}

export const VolumeSlider = ({
  initialVolume = 100,
  onVolumeUpdate = () => {},
  ...props
}: VolumeSliderProps) => {
  const [volume, setVolume] = useState(initialVolume);
  const [previousVolume, setPreviousVolume] = useState(initialVolume);

  const handleChange = (newVolume: number) => {
    setPreviousVolume(volume);
    setVolume(newVolume);
    debounceVolumeChange(newVolume);
  };

  const debounceVolumeChange = useDebounce((newVolume: number) => {
    onVolumeUpdate(newVolume);
  }, 200);

  const handleVolumeIconClick = () => {
    if (volume === 0) {
      handleChange(previousVolume);
    } else {
      handleChange(0);
    }
  };

  const volumeIcon = useMemo(() => {
    if (volume > 50) {
      return faVolumeHigh;
    } else if (volume > 0) {
      return faVolumeLow;
    }
    return faVolumeMute;
  }, [volume]);

  return (
    <span className="volumeSliderContainer">
      <FontAwesomeIcon
        data-testid="volume-slider-icon"
        icon={volumeIcon}
        size="xs"
        onClick={handleVolumeIconClick}
      />
      <input
        data-testid="volume-slider-input"
        type="range"
        value={volume}
        onChange={(e) => handleChange(parseInt(e.target.value))}
        {...props}
      />
    </span>
  );
};
