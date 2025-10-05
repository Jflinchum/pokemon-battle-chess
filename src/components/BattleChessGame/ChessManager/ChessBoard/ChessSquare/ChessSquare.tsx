import PokemonChessPieceSprite from "../PokemonChessPieceSprite/PokemonChessPieceSprite";
import { PokemonWeatherBackground } from "../../../../common/Pokemon/PokemonWeatherBackground/PokemonWeatherBackground";
import { PokemonChessBoardSquare } from "../../../../../types/chess/PokemonChessBoardSquare";
import { SquareModifier } from "../../../../../../shared/models/PokemonBattleChessManager";
import "./ChessSquare.css";

export interface ChessSquareProps {
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
      data-testid="chess-square-container"
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
        data-testid="chess-square-color"
        className={`squareColorFilter ${getSquareHighlightClass(selected, possibleMove, mostRecentMove, isBattleSquare, isPreMove)} ${square?.pokemon || square?.type ? "pieceSquare" : ""}`}
      />
      <div className="squareWeatherContainer">
        {squareModifier?.modifiers?.weather && (
          <PokemonWeatherBackground
            data-testid="chess-square-weather-modifiers"
            key={squareModifier.modifiers.weather.id}
            className="squareWeather"
            modifierType={squareModifier.modifiers.weather.id}
          />
        )}
        {squareModifier?.modifiers?.terrain && (
          <PokemonWeatherBackground
            data-testid="chess-square-terrain-modifiers"
            key={squareModifier.modifiers.terrain.id}
            className="squareWeather"
            modifierType={squareModifier.modifiers.terrain.id}
          />
        )}
      </div>
      {square.type && square.color ? (
        <PokemonChessPieceSprite
          data-testid="chess-square-piece-sprite"
          chessPieceType={square.type}
          chessPieceColor={square.color}
          pokemon={square.pokemon}
          onDragStart={() => {
            onPieceDrag(square);
          }}
        />
      ) : null}
      {square.square[0] === "a" && (
        <span
          data-testid="chess-square-rank-label"
          className="squareText squareNum"
        >
          {square.square[1]}
        </span>
      )}
      {square.square[1] === "1" && (
        <span
          data-testid="chess-square-file-label"
          className="squareText squareChar"
        >
          {square.square[0]}
        </span>
      )}
    </div>
  );
};

export default ChessSquare;
