import { audioTracks, AudioContext } from "./AudioContext";

const AudioProvider = ({ children }: { children: React.ReactNode }) => (
  <AudioContext.Provider value={audioTracks}>{children}</AudioContext.Provider>
);

export default AudioProvider;
