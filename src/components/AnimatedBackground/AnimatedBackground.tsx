import { useMemo, useState } from "react";
import { Sprites } from "@pkmn/img";
import { Color, PieceSymbol } from "chess.js";
import ChessPieceSprite from "../BattleChessGame/ChessManager/ChessBoard/ChessPieceSprite/ChessPieceSprite";
import { getRandomPokemon } from "../Lobby/PokemonOfTheDay/PokemonOfTheDayUtil";
import "./AnimatedBackground.css";
import { useUserState } from "../../context/UserState/UserStateContext";

const getRandomChessPiece = () => {
  const chessPieces: PieceSymbol[] = ["p", "b", "n", "r", "k", "q"];
  const chessColor: Color[] = ["w", "b"];

  const randomPiece =
    chessPieces[Math.floor(Math.random() * chessPieces.length)];
  const randomColor = chessColor[Math.floor(Math.random() * chessColor.length)];

  return {
    piece: randomPiece,
    color: randomColor,
    left: `${Math.random() * 95}%`,
    staticBottom: `${Math.random() * 95}%`,
    bottom: `${Math.floor(Math.random() * -300 - 300)}px`,
    scale: Math.random() * 2 + 1,
    rotation: `${(Math.random() > 0.5 ? 1 : -1) * (Math.random() * 60 + 20)}deg`,
  };
};

const getRandomBackgroundPokemon = (availablePokemon: string[]) => {
  const randomPokemon =
    availablePokemon[Math.floor(Math.random() * availablePokemon.length)];

  return {
    pkmn: randomPokemon,
    shiny: Math.random() < 0.004096,
    left: `${Math.random() * 95}%`,
    staticBottom: `${Math.random() * 95}%`,
    bottom: `${Math.floor(Math.random() * -300 - 300)}px`,
    scale: Math.random() * 2 + 1,
    rotation: `${(Math.random() > 0.5 ? 1 : -1) * (Math.random() * 60 + 20)}deg`,
  };
};

const RandomPokemonBackground = ({
  animated,
  delay,
  availablePokemon,
}: {
  animated: boolean;
  delay: number;
  availablePokemon: string[];
}) => {
  const [pkmn, setPkmn] = useState(
    getRandomBackgroundPokemon(availablePokemon),
  );
  const { userState } = useUserState();

  return (
    <img
      alt={pkmn.pkmn}
      onAnimationIteration={() =>
        setPkmn(getRandomBackgroundPokemon(availablePokemon))
      }
      style={
        {
          left: pkmn.left,
          bottom: animated ? pkmn.bottom : pkmn.staticBottom,
          opacity: animated ? "" : "30%",
          transform: animated
            ? ""
            : `rotate(${pkmn.rotation}) scale(${pkmn.scale})`,
          "--scale": pkmn.scale,
          "--rotation": pkmn.rotation,
          animationDelay: `${delay}s`,
          zIndex: -1 * Math.floor(pkmn.scale) - 1,
        } as React.CSSProperties
      }
      src={
        Sprites.getDexPokemon(pkmn.pkmn, {
          gen: userState.use2DSprites ? "gen5" : "dex",
          shiny: pkmn.shiny,
        }).url
      }
      className={`${animated ? "backgroundFloat" : "backgroundStatic"} backgroundPokemon`}
    />
  );
};

const RandomChessPieceBackground = ({
  animated,
  delay,
}: {
  animated: boolean;
  delay: number;
}) => {
  const [piece, setPiece] = useState(getRandomChessPiece());

  return (
    <ChessPieceSprite
      onAnimationIteration={() => setPiece(getRandomChessPiece())}
      style={
        {
          left: piece.left,
          bottom: animated ? piece.bottom : piece.staticBottom,
          opacity: animated ? "" : "20%",
          transform: animated
            ? ""
            : `rotate(${piece.rotation}) scale(${piece.scale})`,
          "--scale": piece.scale,
          "--rotation": piece.rotation,
          animationDelay: `${delay}s`,
          zIndex: -1 * Math.floor(piece.scale) - 1,
        } as React.CSSProperties
      }
      type={piece.piece}
      color={piece.color}
      className={`${animated ? "backgroundFloat" : "backgroundStatic"} backgroundChess`}
    />
  );
};

const AnimatedBackground = () => {
  const { userState } = useUserState();

  const animationEnabled = userState.animatedBackgroundEnabled;
  // Doing this so we're not constantly fetching all 1000 pokemon images to save client bandwidth
  const availablePokemon = useMemo(() => {
    const pkmn = [];
    for (let i = 0; i < 50; i++) {
      pkmn.push(getRandomPokemon());
    }
    return pkmn;
  }, []);

  return (
    <div className="backgroundContainer">
      {[...Array(animationEnabled ? 6 : 3)].map((_, index) => (
        <RandomPokemonBackground
          animated={animationEnabled}
          availablePokemon={availablePokemon}
          delay={-5 + index * 3 - 1}
          key={index}
        />
      ))}
      {[...Array(animationEnabled ? 6 : 3)].map((_, index) => (
        <RandomChessPieceBackground
          animated={animationEnabled}
          delay={-5 + index * 3}
          key={index}
        />
      ))}
    </div>
  );
};

export default AnimatedBackground;
