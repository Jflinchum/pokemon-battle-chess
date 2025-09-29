import PokemonChessPieceSprite from "../PokemonChessPieceSprite/PokemonChessPieceSprite";
import { PokemonWeatherBackground } from "../../../../common/Pokemon/PokemonWeatherBackground/PokemonWeatherBackground";
import { PokemonChessBoardSquare } from "../../../../../types/chess/PokemonChessBoardSquare";
import { SquareModifier } from "../../../../../../shared/models/PokemonBattleChessManager";
import "./ChessSquare.css";

interface ChessSquareProps {
  square: PokemonChessBoardSquare;
  squareModifier?: SquareModifier;
  backgroundColor: "white" | "black";
  onClick: (arg0: PokemonChessBoardSquare) => void;
  onSquareHover?: (arg0?: PokemonChessBoardSquare | null) => void;
  onPieceDrop: (arg0: PokemonChessBoardSquare) => void;
  onPieceDrag: (arg0: PokemonChessBoardSquare) => void;
  possibleMove: boolean;
  selected: boolean;
  mostRecentMove: boolean;
  isPreMove: boolean;
  isBattleSquare: boolean;
}

const getSquareHighlightClass = (
  selected: boolean,
  possibleMove: boolean,
  mostRecentMove: boolean,
  isBattleSquare: boolean,
  isPremove: boolean,
) => {
  if (selected) {
    return "selected";
  } else if (isBattleSquare) {
    return "battleSquare";
  } else if (possibleMove) {
    return "highlighted";
  } else if (isPremove) {
    return "premove";
  } else if (mostRecentMove) {
    return "mostRecentMove";
  }
  return "";
};

const ChessSquare = ({
  square,
  squareModifier,
  backgroundColor,
  onPieceDrop,
  onPieceDrag,
  onClick,
  onSquareHover,
  possibleMove,
  selected,
  mostRecentMove,
  isPreMove,
  isBattleSquare,
}: ChessSquareProps) => {
  return (
    <div
      id={`chessSquare-${square.square}`}
      className={`chessSquare ${backgroundColor}ChessSquare`}
      onMouseEnter={() => {
        onSquareHover?.(square);
      }}
      onMouseLeave={() => {
        onSquareHover?.(null);
      }}
      onClick={() => {
        onClick(square);
      }}
      onDrop={() => {
        onPieceDrop(square);
      }}
      onDragOver={(e) => {
        e.preventDefault();
      }}
    >
      <div
        className={`squareColorFilter ${getSquareHighlightClass(selected, possibleMove, mostRecentMove, isBattleSquare, isPreMove)} ${square?.pokemon || square?.type ? "pieceSquare" : ""}`}
      />
      <div className="squareWeatherContainer">
        {squareModifier?.modifiers?.weather && (
          <PokemonWeatherBackground
            key={squareModifier.modifiers.weather.id}
            className="squareWeather"
            weatherType={squareModifier.modifiers.weather.id}
          />
        )}
        {squareModifier?.modifiers?.terrain && (
          <PokemonWeatherBackground
            key={squareModifier.modifiers.terrain.id}
            className="squareWeather"
            weatherType={squareModifier.modifiers.terrain.id}
          />
        )}
      </div>
      <PokemonChessPieceSprite
        type={square?.type}
        color={square?.color}
        pokemon={square.pokemon}
        onDragStart={() => {
          onPieceDrag(square);
        }}
      />
      {square.square[0] === "a" && (
        <span className="squareText squareNum">{square.square[1]}</span>
      )}
      {square.square[1] === "1" && (
        <span className="squareText squareChar">{square.square[0]}</span>
      )}
    </div>
  );
};

export default ChessSquare;
