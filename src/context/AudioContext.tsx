import { useContext, createContext } from "react";

const audioTracks = { global: new Audio(), battle: new Audio() };

const AudioContext = createContext(audioTracks);

const AudioProvider = ({ children }: { children: React.ReactNode }) => (
  <AudioContext.Provider value={audioTracks}>{children}</AudioContext.Provider>
);

export const useAudio = () => useContext(AudioContext);

export default AudioProvider;