import { Nullable } from '@/shared/application/type-utils';
import { createMachine, assign } from 'xstate';
import { isNotNil } from '@/shared/application/type-guards';
import { adjustElementCoordinates } from '@/context/whiteboard/application';
import {
  SelectedWhiteBoardElement,
  Shape,
  WhiteboardElement
} from '@/context/whiteboard/domain';

interface WhiteboardContext {
  selectedElement: Nullable<SelectedWhiteBoardElement>;
  selectedShape: Nullable<Shape>;
  elements: Array<WhiteboardElement>;
  elementInProgress: Nullable<WhiteboardElement>;
}

type WhiteboardEvent =
  | { type: 'initiate_draw'; shape: Shape }
  | { type: 'initiate_select' }
  | {
      type: 'start_drawing';
      element: WhiteboardElement;
    }
  | { type: 'continue_drawing'; element: WhiteboardElement }
  | { type: 'finish_drawing' }
  | { type: 'select_element'; element: SelectedWhiteBoardElement }
  | { type: 'remove_element'; elementId: string }
  | { type: 'deselect_element' }
  | { type: 'start_resizing'; element: WhiteboardElement }
  | { type: 'continue_resizing'; element: WhiteboardElement }
  | { type: 'cancel_resizing' }
  | { type: 'finish_resizing' }
  | { type: 'start_repositioning'; element: WhiteboardElement }
  | { type: 'continue_repositioning'; element: WhiteboardElement }
  | { type: 'cancel_repositioning' }
  | { type: 'finish_repositioning' }
  | { type: 'reset' };

export const whiteboardStateMachine = createMachine({
  types: {
    context: {} as WhiteboardContext,
    events: {} as WhiteboardEvent
  },
  context: {
    selectedElement: null,
    selectedShape: null,
    elementInProgress: null,
    elements: []
  },
  id: 'whiteboard',
  initial: 'idle',
  states: {
    idle: {
      entry: [
        assign({
          selectedElement: () => null,
          selectedShape: () => null,
          elementInProgress: () => null
        })
      ],
      on: {
        initiate_draw: {
          target: 'draw',
          actions: [
            assign({
              selectedShape: ({ event }) => event.shape
            }),
            () => {
              console.log('Transitioning to draw state');
            }
          ]
        },
        initiate_select: {
          target: 'select',
          actions: [
            assign({
              selectedElement: () => null
            }),
            () => {
              console.log('Transitioning to select state');
            }
          ]
        }
      },
      description:
        'The whiteboard is in an idle state, waiting for user interaction.'
    },
    select: {
      entry: [
        assign({
          selectedShape: () => null
        }),
        () => {
          console.log('Entering select state');
        }
      ],
      on: {
        select_element: {
          actions: assign({
            selectedElement: ({ event }) => event.element
          })
        },
        start_resizing: {
          target: 'resizing',
          actions: [
            assign({
              elementInProgress: ({ event }) => event.element
            }),
            () => {
              console.log('Transitioning to resizing state');
            }
          ]
        },
        start_repositioning: {
          target: 'repositioning',
          actions: [
            assign({
              elementInProgress: ({ event }) => event.element
            }),
            () => {
              console.log('Transitioning to repositioning state');
            }
          ]
        },
        remove_element: {
          actions: [
            assign({
              elements: ({ context, event }) =>
                context.elements.filter(
                  (element) => element.id !== event.elementId
                )
            }),
            assign({
              selectedElement: () => null
            })
          ]
        },
        deselect_element: {
          actions: assign({
            selectedElement: () => null
          })
        },
        initiate_draw: {
          target: 'draw',
          actions: [
            assign({
              selectedShape: ({ event }) => event.shape
            }),
            () => {
              console.log('Transitioning to draw state');
            }
          ]
        }
      },
      description:
        'An item on the whiteboard has been selected, enabling further actions such as resizing or repositioning.'
    },
    draw: {
      entry: [
        assign({
          selectedElement: () => null
        }),
        () => {
          console.log('Entering draw state');
        }
      ],
      on: {
        initiate_select: {
          target: 'select',
          actions: [
            () => {
              console.log('Transitioning to select state');
            }
          ]
        },
        initiate_draw: {
          actions: [
            assign({
              selectedShape: ({ event }) => event.shape
            }),
            ({ event }) => {
              console.log('Still in draw but changing shape', event.shape);
            }
          ]
        },
        start_drawing: {
          target: 'drawing',
          actions: [
            assign({
              elementInProgress: ({ event }) => event.element
            }),
            () => {
              console.log('Transitioning to drawing state');
            }
          ]
        }
      },
      description: 'The user has expressed the intent to draw.'
    },
    drawing: {
      entry: [
        assign({
          selectedElement: () => null
        }),
        () => {
          console.log('Entering drawing state');
        }
      ],
      on: {
        continue_drawing: {
          actions: [
            assign({
              elementInProgress: ({ event }) => event.element
            })
          ]
        },
        finish_drawing: {
          target: 'select',
          actions: [
            assign({
              elements: ({ context }) =>
                isNotNil(context.elementInProgress)
                  ? [...context.elements, context.elementInProgress]
                  : context.elements,
              selectedElement: ({ context }) => {
                return isNotNil(context.elementInProgress)
                  ? {
                      ...context.elementInProgress,
                      offsetX: 0,
                      offsetY: 0,
                      position: null
                    }
                  : null;
              }
            }),
            assign({
              elementInProgress: () => null
            })
          ]
        }
      },
      description:
        'The user is in drawing mode, allowing them to draw on the whiteboard.'
    },
    resizing: {
      on: {
        continue_resizing: {
          actions: [
            assign({
              elementInProgress: ({ event }) => event.element
            })
          ]
        },
        cancel_resizing: {
          target: 'select',
          actions: assign({
            elementInProgress: () => null
          })
        },
        finish_resizing: {
          target: 'select',
          actions: [
            assign({
              elements: ({ context }) =>
                context.elements.map((element) => {
                  if (
                    isNotNil(context.elementInProgress) &&
                    element.id === context.elementInProgress.id
                  ) {
                    const updatedCoordinates = adjustElementCoordinates(
                      context.elementInProgress
                    );
                    // overwrite the previous element with the new attributes
                    return {
                      ...updatedCoordinates,
                      id: context.elementInProgress.id,
                      type: context.elementInProgress.type
                    };
                  }
                  return element;
                }),
              selectedElement: ({ context }) => {
                return isNotNil(context.elementInProgress)
                  ? {
                      ...context.elementInProgress,
                      offsetX: 0,
                      offsetY: 0,
                      position: null
                    }
                  : null;
              }
            }),
            assign({
              elementInProgress: () => null
            })
          ]
        }
      },
      description: 'The user is resizing a selected item on the whiteboard.'
    },
    repositioning: {
      on: {
        continue_repositioning: {
          actions: assign({
            elementInProgress: ({ event }) => event.element
          })
        },
        cancel_repositioning: {
          target: 'select',
          actions: assign({
            elementInProgress: () => null
          })
        },
        finish_repositioning: {
          target: 'select',
          actions: [
            assign({
              elements: ({ context }) =>
                context.elements.map((element) => {
                  if (
                    isNotNil(context.elementInProgress) &&
                    element.id === context.elementInProgress.id
                  ) {
                    // overwrite the previous element with the new attributes
                    return context.elementInProgress;
                  }
                  return element;
                }),
              selectedElement: ({ context }) => {
                return isNotNil(context.elementInProgress)
                  ? {
                      ...context.elementInProgress,
                      offsetX: 0,
                      offsetY: 0,
                      position: null
                    }
                  : null;
              }
            }),
            assign({
              elementInProgress: () => null
            })
          ]
        }
      },
      description:
        'The user is repositioning a selected item on the whiteboard.'
    }
  },
  on: {
    reset: {
      target: '.idle'
    }
  }
});
