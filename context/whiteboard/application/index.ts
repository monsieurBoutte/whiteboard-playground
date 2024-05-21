import { match } from 'ts-pattern';
import { Position, WhiteboardElement } from '@/context/whiteboard/domain';
import { Nullable } from '@/shared/domain/type-utils';
import { isNotNil } from '@/shared/application/type-guards';
import { noOpFn } from '@/shared/application/utils';

/**
 * The function calculates the Euclidean distance between two points
 * a and b in a 2D space.
 *
 * @param a - The first point
 * @param b - The second point
 * @returns The Euclidean distance between the two points
 */
export const distance = (
  a: { x: number; y: number },
  b: { x: number; y: number }
) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

const nearPoint = (
  x: number,
  y: number,
  x1: number,
  y1: number,
  name: string
) => {
  // including the 5 here as an offset to help with proximity detection
  return Math.abs(x - x1) < 5 && Math.abs(y - y1) < 5 ? name : null;
};

export const positionWithinElement = (
  x: number,
  y: number,
  element: WhiteboardElement
) => {
  const { type, x1, x2, y1, y2 } = element;
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  return match(type)
    .returnType<Nullable<string>>()
    .with('rectangle', () => {
      const topLeft = nearPoint(x, y, minX, minY, 'tl');
      const topRight = nearPoint(x, y, maxX, minY, 'tr');
      const bottomLeft = nearPoint(x, y, minX, maxY, 'bl');
      const bottomRight = nearPoint(x, y, maxX, maxY, 'br');
      const inside =
        x >= minX && x <= maxX && y >= minY && y <= maxY ? 'inside' : null;
      return topLeft || topRight || bottomLeft || bottomRight || inside;
    })
    .with('circle', () => {
      const width = maxX - minX;
      const height = maxY - minY;
      const radius = Math.min(width, height) / 2;
      const centerX = minX + radius;
      const centerY = minY + radius;
      const inside =
        distance({ x, y }, { x: centerX, y: centerY }) <= radius
          ? 'inside'
          : null;
      return inside;
    })
    .exhaustive();
};

export const getElementAtPosition = (
  x: number,
  y: number,
  elements: Array<WhiteboardElement>
): Nullable<{ element: WhiteboardElement; position: Nullable<Position> }> => {
  const foundElement = elements.find((element) => {
    const position = positionWithinElement(x, y, element);
    return isNotNil(position);
  });

  return isNotNil(foundElement)
    ? {
        element: foundElement,
        position: positionWithinElement(
          x,
          y,
          foundElement
        ) as Nullable<Position>
      }
    : null;
};

export const adjustElementCoordinates = (element: WhiteboardElement) => {
  const { type, x1, y1, x2, y2 } = element;
  return match(type)
    .returnType<{
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    }>()
    .with('rectangle', 'circle', () => {
      const minX = Math.min(x1, x2);
      const maxX = Math.max(x1, x2);
      const minY = Math.min(y1, y2);
      const maxY = Math.max(y1, y2);
      return { x1: minX, y1: minY, x2: maxX, y2: maxY };
    })
    .otherwise(() => ({ x1, y1, x2, y2 }));
};

export const cursorForPosition = (position: Position) =>
  match(position)
    .returnType<string>()
    .with('tl', 'br', () => 'nwse-resize')
    .with('tr', 'bl', () => 'nesw-resize')
    .otherwise(() => 'move');

export type Coordinates = Omit<
  WhiteboardElement,
  'id' | 'type' | 'roughElement'
>;

export const resizedCoordinates = (
  offsetX: number,
  offsetY: number,
  position: string,
  coordinates: Coordinates
) => {
  const { x1, y1, x2, y2 } = coordinates;
  return match(position)
    .returnType<Nullable<Coordinates>>()
    .with('tl', () => {
      return { x1: offsetX, y1: offsetY, x2, y2 };
    })
    .with('tr', () => {
      return { x1, y1: offsetY, x2: offsetX, y2 };
    })
    .with('bl', () => {
      return { x1: offsetX, y1, x2, y2: offsetY };
    })
    .with('br', 'end', () => {
      return { x1, y1, x2: offsetX, y2: offsetY };
    })
    .otherwise(() => null);
};

export const drawElement = (
  context: CanvasRenderingContext2D,
  element: WhiteboardElement,
  color: string,
  isFocused: boolean = false,
  isMultiSelect: boolean = false
) => {
  const { type, x1, y1, x2, y2 } = element;
  context.beginPath();
  context.strokeStyle = isFocused ? '#d441ff' : color;

  match(type)
    .with('rectangle', () => {
      const width = x2 - x1;
      const height = y2 - y1;
      context.rect(x1, y1, width, height);
      context.stroke();
    })
    .with('circle', () => {
      /**
       * Drawing the circle:
       * calculating the radius of the circle to ensure it fits within the bounding box defined by the coordinates (x1, y1) and (x2, y2).
       * Here's a detailed breakdown:
       * 1. Math.abs(x2 - x1): This calculates the absolute width of the bounding box. The absolute value is used to ensure the width is always positive, regardless of the order of x1 and x2.
       * 2. Math.abs(y2 - y1): This calculates the absolute height of the bounding box. Similarly, the absolute value ensures the height is always positive.
       * 3. Math.min(Math.abs(x2 - x1), Math.abs(y2 - y1)): This finds the smaller of the two dimensions (width or height). This is important because the circle must fit within the bounding box, and the smaller dimension will be the limiting factor.
       * 4. / 2: This divides the smaller dimension by 2 to get the radius of the circle. The radius is half the diameter, and the diameter is the smaller of the width or height of the bounding box.
       */
      const radius = Math.min(Math.abs(x2 - x1), Math.abs(y2 - y1)) / 2;
      const centerX = (x1 + x2) / 2;
      const centerY = (y1 + y2) / 2;
      context.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      context.stroke();
    })
    .otherwise(() => noOpFn);

  if (isFocused) {
    // Draw dashed border
    context.setLineDash([3, 3]);
    context.strokeStyle = '#6700ff';
    context.lineWidth = 1;
    context.strokeRect(x1, y1, x2 - x1, y2 - y1);
    context.setLineDash([]); // Reset to solid line

    // Draw drag handles
    const handleSize = 6;
    const halfHandleSize = handleSize / 2;
    const handles = [
      { x: x1 - halfHandleSize, y: y1 - halfHandleSize }, // top-left
      { x: x2 - halfHandleSize, y: y1 - halfHandleSize }, // top-right
      { x: x1 - halfHandleSize, y: y2 - halfHandleSize }, // bottom-left
      { x: x2 - halfHandleSize, y: y2 - halfHandleSize } // bottom-right
    ];

    context.fillStyle = 'white';
    context.strokeStyle = 'blue';
    if (!isMultiSelect) {
      handles.forEach((handle) => {
        context.fillRect(handle.x, handle.y, handleSize, handleSize);
        context.strokeRect(handle.x, handle.y, handleSize, handleSize);
      });
    }
  }
};
