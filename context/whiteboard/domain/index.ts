import { Nullable } from '@/shared/domain/type-utils';

export type Shape = 'circle' | 'rectangle';

export interface WhiteboardElement {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type: Shape;
}

export type Position = 'tl' | 'tr' | 'bl' | 'br' | 'inside';

export interface SelectedWhiteBoardElement extends WhiteboardElement {
  // these offsets are used to keep track of the element being dragged
  // which get accurately set by the user on mouse down
  offsetX: number;
  offsetY: number;
  // these are used to determine the position of the element
  // when it is being resized — which is also gets set by the user
  // on mouse down
  position: Nullable<Position>;
}

export const DARK_MODE_COLOR = '#5fd7ff';
export const LIGHT_MODE_COLOR = '#1b1b1b';
