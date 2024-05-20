import { Nullable } from '@/shared/application/type-utils';
import { createMachine, assign } from 'xstate';
import { isNonEmptyArray, isNotNil } from '@/shared/application/type-guards';
import { adjustElementCoordinates } from '@/context/whiteboard/application';
import {
  SelectedWhiteBoardElement,
  Shape,
  WhiteboardElement
} from '@/context/whiteboard/domain';

interface WhiteboardContext {
  selectedElements: Set<SelectedWhiteBoardElement>;
  selectedShape: Nullable<Shape>;
  elements: Array<WhiteboardElement>;
  elementsInProgress: Array<WhiteboardElement>;
  initialSelectCoordinates: Nullable<{ x: number; y: number }>;
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
  | {
      type: 'select_element';
      element: SelectedWhiteBoardElement;
      coordinates: { x: number; y: number };
    }
  | { type: 'remove_elements' }
  | { type: 'deselect_all' }
  | { type: 'start_resizing'; element: WhiteboardElement }
  | { type: 'continue_resizing'; element: WhiteboardElement }
  | { type: 'cancel_resizing' }
  | { type: 'finish_resizing' }
  | { type: 'start_repositioning' }
  | { type: 'continue_repositioning'; elements: Array<WhiteboardElement> }
  | { type: 'cancel_repositioning' }
  | { type: 'finish_repositioning' }
  | { type: 'reset' };

export const whiteboardStateMachine = createMachine({
  types: {
    context: {} as WhiteboardContext,
    events: {} as WhiteboardEvent
  },
  context: {
    selectedElements: new Set<SelectedWhiteBoardElement>(),
    initialSelectCoordinates: null,
    selectedShape: null,
    elementsInProgress: [],
    elements: []
  },
  id: 'whiteboard',
  initial: 'idle',
  states: {
    idle: {
      entry: [
        assign({
          selectedElements: () => new Set<SelectedWhiteBoardElement>(),
          initialSelectCoordinates: () => null,
          selectedShape: () => null,
          elementsInProgress: () => []
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
              selectedElements: () => new Set<SelectedWhiteBoardElement>()
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
          actions: [
            assign({
              initialSelectCoordinates: ({ event }) => event.coordinates,
              selectedElements: ({ context, event }) => {
                const newSelectedElements = new Set(context.selectedElements);
                const existingElement = Array.from(newSelectedElements).find(
                  (el) => el.id === event.element.id
                );

                if (isNotNil(existingElement)) {
                  newSelectedElements.delete(existingElement);
                  // overwrite the existing element with the new position and new coordinates
                  newSelectedElements.add(event.element);
                } else {
                  newSelectedElements.add(event.element);
                }

                return newSelectedElements;
              }
            })
          ]
        },
        start_resizing: {
          target: 'resizing',
          guard: ({ context }) => context.selectedElements.size === 1,
          actions: [
            assign({
              elementsInProgress: ({ event }) => [event.element]
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
              elementsInProgress: ({ context }) =>
                Array.from(context.selectedElements)
            }),
            () => {
              console.log('Transitioning to repositioning state');
            }
          ]
        },
        remove_elements: {
          actions: [
            assign({
              elements: ({ context }) =>
                context.elements.filter(
                  (element) =>
                    !Array.from(context.selectedElements).some(
                      (selected) => selected.id === element.id
                    )
                )
            }),
            assign({
              selectedElements: () => new Set<SelectedWhiteBoardElement>(),
              initialSelectCoordinates: () => null
            })
          ]
        },
        deselect_all: {
          actions: assign({
            selectedElements: () => new Set<SelectedWhiteBoardElement>(),
            initialSelectCoordinates: () => null
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
          selectedElements: () => new Set<SelectedWhiteBoardElement>()
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
              elementsInProgress: ({ event }) => [event.element]
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
          selectedElements: () => new Set<SelectedWhiteBoardElement>()
        }),
        () => {
          console.log('Entering drawing state');
        }
      ],
      on: {
        continue_drawing: {
          actions: [
            assign({
              elementsInProgress: ({ event }) => [event.element]
            })
          ]
        },
        finish_drawing: {
          target: 'select',
          actions: [
            assign({
              elements: ({ context }) =>
                isNonEmptyArray(context.elementsInProgress)
                  ? [...context.elements, ...context.elementsInProgress]
                  : context.elements,
              selectedElements: ({ context }) => {
                const newSelectedElements =
                  new Set<SelectedWhiteBoardElement>();
                if (isNonEmptyArray(context.elementsInProgress)) {
                  const updatedElement = {
                    ...context.elementsInProgress[0],
                    offsetX: 0,
                    offsetY: 0,
                    position: null
                  };
                  newSelectedElements.add(updatedElement);
                }
                return newSelectedElements;
              }
            }),
            assign({
              elementsInProgress: () => []
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
              elementsInProgress: ({ event }) => [event.element]
            })
          ]
        },
        cancel_resizing: {
          target: 'select',
          actions: assign({
            elementsInProgress: () => []
          })
        },
        finish_resizing: {
          target: 'select',
          actions: [
            assign({
              elements: ({ context }) =>
                context.elements.map((element) => {
                  if (
                    isNonEmptyArray(context.elementsInProgress) &&
                    element.id === context.elementsInProgress[0].id
                  ) {
                    const updatedCoordinates = adjustElementCoordinates(
                      context.elementsInProgress[0]
                    );
                    // overwrite the previous element with the new attributes
                    return {
                      ...updatedCoordinates,
                      id: context.elementsInProgress[0].id,
                      type: context.elementsInProgress[0].type
                    };
                  }
                  return element;
                }),
              selectedElements: ({ context }) => {
                const newSelectedElements =
                  new Set<SelectedWhiteBoardElement>();
                if (isNonEmptyArray(context.elementsInProgress)) {
                  const updatedElement = {
                    ...context.elementsInProgress[0],
                    offsetX: 0,
                    offsetY: 0,
                    position: null
                  };
                  newSelectedElements.add(updatedElement);
                }
                return newSelectedElements;
              }
            }),
            assign({
              elementsInProgress: () => []
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
            elementsInProgress: ({ event }) => event.elements
          })
        },
        cancel_repositioning: {
          target: 'select',
          actions: assign({
            elementsInProgress: () => []
          })
        },
        finish_repositioning: {
          target: 'select',
          actions: [
            assign({
              elements: ({ context }) =>
                context.elements.map((element) => {
                  const updatedElement = context.elementsInProgress.find(
                    (inProgressElement) => inProgressElement.id === element.id
                  );

                  // If an updated element is found, return it; otherwise, return the original element
                  return updatedElement ? updatedElement : element;
                }),
              selectedElements: ({ context }) => {
                const newSelectedElements = new Set<SelectedWhiteBoardElement>(
                  context.selectedElements
                );

                if (isNonEmptyArray(context.elementsInProgress)) {
                  context.elementsInProgress.forEach((updatedElement) => {
                    const elementToUpdate = {
                      ...updatedElement,
                      offsetX: 0,
                      offsetY: 0,
                      position: null
                    };

                    // Find and remove the existing element with the same id
                    newSelectedElements.forEach((el) => {
                      if (el.id === elementToUpdate.id) {
                        newSelectedElements.delete(el);
                      }
                    });

                    // Add the updated element
                    newSelectedElements.add(elementToUpdate);
                  });
                }

                return newSelectedElements;
              }
            }),
            assign({
              elementsInProgress: () => []
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
