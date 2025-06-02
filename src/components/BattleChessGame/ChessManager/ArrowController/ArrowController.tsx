import { Color, Square } from "chess.js";
import { getNumberFromSquareLetter } from "../util";
import "./ArrowControler.css";

type Arrow = { from: Square; to: Square; type?: "default" | "battle" };

interface ArrowControllerProps {
  children: React.ReactNode;
  arrows: Arrow[];
  perspective: Color;
  className?: string;
}

const buildArrowPointsFromSquare = (
  { from, to }: Arrow,
  perspective: Color,
): { points: string; rotation: string; scale: string; translate: string } => {
  const squareDimension = 12.5;
  const fromX = getNumberFromSquareLetter(from[0]);
  const fromY =
    perspective === "w" ? 8 - parseInt(from[1]) : parseInt(from[1]) - 1;
  const toX = getNumberFromSquareLetter(to[0]);
  const toY = perspective === "w" ? 8 - parseInt(to[1]) : parseInt(to[1]) - 1;
  const distanceHoriz = Math.abs(fromX - toX);
  const distanceVert = Math.abs(fromY - toY);
  const positionOffsetX = (3 * squareDimension) / 8;
  const positionOffsetY = squareDimension * (7 / 8);
  let points: string[] = [];
  let rotation = "";
  let translate = "";
  let scale = "";

  if (
    (distanceHoriz === 1 && distanceVert === 2) ||
    (distanceVert === 1 && distanceHoriz === 2)
  ) {
    // Knight movement. Show L vector
    const firstPoint = [
      fromX * squareDimension + positionOffsetX,
      fromY * squareDimension + positionOffsetY,
    ];
    const secondPoint = [
      firstPoint[0],
      firstPoint[1] + squareDimension * 2 - positionOffsetY + positionOffsetX,
    ];
    const thirdPoint = [
      firstPoint[0] - squareDimension + positionOffsetX * 1.5,
      secondPoint[1],
    ];
    const arrowPointOne = [thirdPoint[0], thirdPoint[1] - squareDimension / 6];
    const arrowPointHead = [
      thirdPoint[0] - positionOffsetY / 2,
      thirdPoint[1] + squareDimension / 8,
    ];
    const arrowPointTwo = [
      thirdPoint[0],
      thirdPoint[1] + squareDimension / 4 + squareDimension / 6,
    ];
    const fourthPoint = [thirdPoint[0], thirdPoint[1] + squareDimension / 4];
    const fifthPoint = [firstPoint[0] + squareDimension / 4, fourthPoint[1]];
    const sixthPoint = [firstPoint[0] + squareDimension / 4, firstPoint[1]];
    points = [
      firstPoint.join(" "),
      secondPoint.join(" "),
      thirdPoint.join(" "),
      arrowPointOne.join(" "),
      arrowPointHead.join(" "),
      arrowPointTwo.join(" "),
      fourthPoint.join(" "),
      fifthPoint.join(" "),
      sixthPoint.join(" "),
    ];

    if (distanceHoriz === 2) {
      rotation = `${fromX - toX > 0 ? 90 : -90} ${fromX * squareDimension + squareDimension / 2} ${fromY * squareDimension + squareDimension / 2}`;
      if (
        (fromX - toX > 0 && fromY - toY < 0) ||
        (fromX - toX < 0 && fromY - toY > 0)
      ) {
        scale = "-1, 1";
        translate = `${-(1 + 2 * fromX) * squareDimension}, 0`;
      }
    } else {
      rotation = `${fromY - toY > 0 ? 180 : 0} ${fromX * squareDimension + squareDimension / 2} ${fromY * squareDimension + squareDimension / 2}`;
      if (
        (fromY - toY < 0 && fromX - toX < 0) ||
        (fromY - toY > 0 && fromX - toX > 0)
      ) {
        scale = "-1, 1";
        translate = `${-(1 + 2 * fromX) * squareDimension}, 0`;
      }
    }
  } else {
    const distance =
      squareDimension *
      Math.sqrt(Math.pow(toX - fromX, 2) + Math.pow(toY - fromY, 2));
    const directionX = toX - fromX;
    const directionY = toY - fromY;
    rotation = `${((Math.atan2(directionY, directionX) - Math.PI / 2) * 180) / Math.PI} ${fromX * squareDimension + squareDimension / 2} ${fromY * squareDimension + squareDimension / 2}`;
    const firstPoint = [
      fromX * squareDimension + positionOffsetX,
      fromY * squareDimension + positionOffsetY,
    ];
    const secondPoint = [
      firstPoint[0],
      firstPoint[1] + distance - positionOffsetY,
    ];
    const arrowPointOne = [
      firstPoint[0] - squareDimension / 6,
      firstPoint[1] + distance - positionOffsetY,
    ];
    const arrowPointHead = [
      firstPoint[0] + squareDimension / 8,
      firstPoint[1] + distance - positionOffsetY / 2,
    ];
    const arrowPointTwo = [
      firstPoint[0] + (2 * squareDimension) / 8 + squareDimension / 6,
      firstPoint[1] + distance - positionOffsetY,
    ];
    const thirdPoint = [
      firstPoint[0] + squareDimension / 4,
      firstPoint[1] + distance - positionOffsetY,
    ];
    const fourthPoint = [firstPoint[0] + squareDimension / 4, firstPoint[1]];
    points = [
      firstPoint.join(" "),
      secondPoint.join(" "),
      arrowPointOne.join(" "),
      arrowPointHead.join(" "),
      arrowPointTwo.join(" "),
      thirdPoint.join(" "),
      fourthPoint.join(" "),
    ];
  }

  return { points: points.join(","), rotation, scale, translate };
};

export const ArrowController = ({
  children,
  arrows,
  perspective,
  className = "",
}: ArrowControllerProps) => {
  return (
    <div className={`arrowControllerContainer ${className}`}>
      <svg viewBox="0 0 100 100" className="arrowContainer">
        {arrows.map((arrow, index) => {
          const vector = buildArrowPointsFromSquare(arrow, perspective);
          return (
            <polygon
              key={index}
              className={`arrow ${arrow.type || "default"}`}
              points={vector.points}
              transform={`rotate(${vector.rotation}) ${vector.scale ? `scale(${vector.scale})` : ""} ${vector.translate ? `translate(${vector.translate})` : ""}`}
            />
          );
        })}
      </svg>
      {children}
    </div>
  );
};
