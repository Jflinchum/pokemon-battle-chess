import { faVolumeHigh, faVolumeLow, faVolumeMute } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMemo, useState } from "react";
import { useDebounce } from "../../../utils";
import './VolumeSlider.css';

interface VolumeSliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  initialVolume?: number;
  onVolumeUpdate?: (volume: number) => void;
}

export const VolumeSlider = ({ initialVolume = 100, onVolumeUpdate = () => {}, ...props }: VolumeSliderProps) => {
  const [volume, setVolume] = useState(initialVolume);

  const handleChange = (volume: number) => {
    setVolume(volume);
    debounceVolumeChange(volume);
  };

  const debounceVolumeChange = useDebounce((volume: number) => {
    onVolumeUpdate(volume);
  }, 200);

  const volumeIcon = useMemo(() => {
    if (volume > 50) {
      return faVolumeHigh;
    } else if (volume > 0) {
      return faVolumeLow;
    }
    return faVolumeMute;
  }, [volume]);

  return (
    <span className='volumeSliderContainer'>
      <FontAwesomeIcon icon={volumeIcon} size="xs" onClick={() => handleChange(0)}/>
      <input type='range' value={volume} onChange={(e) => handleChange(parseInt(e.target.value))} {...props}/>
    </span>
  );
};