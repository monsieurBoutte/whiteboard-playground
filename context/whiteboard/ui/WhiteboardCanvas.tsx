'use client';

import {
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
  MouseEvent as ReactMouseEvent,
  useCallback
} from 'react';
import cx from 'classnames';
import {
  FiGrid,
  FiSquare,
  FiCircle,
  FiMousePointer,
  FiSun,
  FiMoon
} from 'react-icons/fi';
import { IconButton } from './IconButton';
import { useMachine } from '@xstate/react';
import { whiteboardStateMachine } from '../infrastructure/whiteboardStateMachine';

import { match } from 'ts-pattern';
import {
  isNil,
  isNonEmptyArray,
  isNotNil
} from '@/shared/application/type-guards';
import { noOpFn } from '@/shared/application/utils';
import {
  cursorForPosition,
  drawElement,
  getElementAtPosition,
  resizedCoordinates
} from '@/context/whiteboard/application';
import { DARK_MODE_COLOR, LIGHT_MODE_COLOR } from '@/context/whiteboard/domain';

export const WhiteboardCanvas = () => {
  const [showGrid, setShowGrid] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const [state, send] = useMachine(whiteboardStateMachine);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const toolbar = toolbarRef.current;
    if (isNil(canvas) || isNil(toolbar)) return;
    const parent = canvas.parentElement;
    if (isNotNil(parent)) {
      const { width, height } = parent.getBoundingClientRect();
      const toolbarHeight = toolbar.getBoundingClientRect().height;
      canvas.width = width;
      canvas.height = height - toolbarHeight;
    }

    const context = canvas.getContext('2d');
    if (isNil(context)) return;

    context.clearRect(0, 0, canvas.width, canvas.height);

    context.save();

    const currentWorkInProgress = state.context.elementsInProgress;
    state.context.elements
      .filter(
        (element) =>
          !currentWorkInProgress.some((el) => el.id === element.id) &&
          !Array.from(state.context.selectedElements).some(
            (sel) => sel.id === element.id
          )
      )
      .forEach((element) => {
        drawElement(
          context,
          element,
          isDarkMode ? DARK_MODE_COLOR : LIGHT_MODE_COLOR
        );
      });

    if (isNotNil(currentWorkInProgress)) {
      currentWorkInProgress.forEach((element) => {
        drawElement(
          context,
          element,
          isDarkMode ? DARK_MODE_COLOR : LIGHT_MODE_COLOR,
          true
        );
      });
    }

    if (state.context.selectedElements.size > 0 && state.matches('select')) {
      state.context.selectedElements.forEach((element) => {
        drawElement(
          context,
          element,
          isDarkMode ? DARK_MODE_COLOR : LIGHT_MODE_COLOR,
          true
        );
      });
    }
    context.restore();
  }, [state, isDarkMode]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    console.log('state', state);
  }, [state]);

  // window.state = state;

  const onMouseDown = useCallback(
    (mouseEvent: ReactMouseEvent<HTMLCanvasElement, MouseEvent>) => {
      /**
       * note: we are using offsetX and offsetY here instead of clientX and clientY
       * because the offset grabs the mouse position relative to the top left of the canvas
       * while clientX and clientY grab the mouse position relative to the top left of the
       * viewport
       */
      const { offsetX, offsetY } = mouseEvent.nativeEvent;
      match(state.value)
        .with('draw', () => {
          if (isNotNil(state.context.selectedShape)) {
            send({
              type: 'start_drawing',
              element: {
                id: `${state.context.elements.length}`,
                x1: offsetX,
                y1: offsetY,
                x2: offsetX,
                y2: offsetY,
                type: state.context.selectedShape
              }
            });
          }
        })
        .with('select', () => {
          const isControlPressed = mouseEvent.ctrlKey || mouseEvent.metaKey;
          const elementAtPosition = getElementAtPosition(
            offsetX,
            offsetY,
            state.context.elements
          );
          if (isNotNil(elementAtPosition)) {
            const elementOffsetX = offsetX - elementAtPosition.element.x1;
            const elementOffsetY = offsetY - elementAtPosition.element.y1;
            send({
              type: 'select_element',
              element: {
                ...elementAtPosition.element,
                offsetX: elementOffsetX,
                offsetY: elementOffsetY,
                position: elementAtPosition.position
              },
              isMultiSelect: isControlPressed
            });
            if (isNotNil(elementAtPosition.position)) {
              match(elementAtPosition.position)
                .with('inside', () => {
                  send({
                    type: 'start_repositioning'
                  });
                })
                .otherwise(() => {
                  send({
                    type: 'start_resizing',
                    element: elementAtPosition.element
                  });
                });
            }
          }
        })
        .otherwise(() => noOpFn);
    },
    [state, send]
  );

  const onMouseMove = useCallback(
    (mouseEvent: ReactMouseEvent<HTMLCanvasElement, MouseEvent>) => {
      const { offsetX, offsetY } = mouseEvent.nativeEvent;
      match(state.value)
        .with('drawing', () => {
          // grab the current work in progress
          if (isNonEmptyArray(state.context.elementsInProgress)) {
            const { id, x1, y1, type } = state.context.elementsInProgress[0];
            send({
              type: 'continue_drawing',
              element: {
                id,
                x1,
                y1,
                x2: offsetX,
                y2: offsetY,
                type
              }
            });
          }
        })
        .with('select', () => {
          const elementAtPosition = getElementAtPosition(
            offsetX,
            offsetY,
            state.context.elements
          );
          mouseEvent.currentTarget.style.cursor =
            isNotNil(elementAtPosition) && isNotNil(elementAtPosition.position)
              ? cursorForPosition(elementAtPosition.position)
              : 'default';
        })
        .with('repositioning', () => {
          if (
            isNonEmptyArray(state.context.elementsInProgress) &&
            state.context.selectedElements.size > 0
          ) {
            // todo: account for multiple elements being detected at a position
            // const { offsetX: originalOffsetX, offsetY: originalOffsetY } =
            //   state.context.selectedElements.values().next().value;
            // const { id, x1, y1, x2, y2, type } =
            //   state.context.elementInProgress;
            // const width = x2 - x1;
            // const height = y2 - y1;
            // const newX = offsetX - originalOffsetX;
            // const newY = offsetY - originalOffsetY;
            // send({
            //   type: 'continue_repositioning',
            //   element: {
            //     id,
            //     x1: newX,
            //     y1: newY,
            //     x2: newX + width,
            //     y2: newY + height,
            //     type
            //   }
            // });
            const updatedElements = Array.from(
              state.context.selectedElements
            ).map((selectedElement) => {
              const { offsetX: originalOffsetX, offsetY: originalOffsetY } =
                selectedElement;
              const { id, x1, y1, x2, y2, type } = selectedElement;
              const width = x2 - x1;
              const height = y2 - y1;
              const newX = offsetX - originalOffsetX;
              const newY = offsetY - originalOffsetY;
              return {
                id,
                x1: newX,
                y1: newY,
                x2: newX + width,
                y2: newY + height,
                type
              };
            });

            console.log('moving', updatedElements.length);

            send({
              type: 'continue_repositioning',
              elements: updatedElements
            });
          }
        })
        .with('resizing', () => {
          if (
            isNonEmptyArray(state.context.elementsInProgress) &&
            state.context.selectedElements.size > 0
          ) {
            // todo: account for multiple
            const { position } = state.context.selectedElements
              .values()
              .next().value;
            console.log('*** position', position);
            const { id, x1, y1, x2, y2, type } =
              state.context.elementsInProgress[0];
            if (isNotNil(position)) {
              const resized = resizedCoordinates(offsetX, offsetY, position, {
                x1,
                y1,
                x2,
                y2
              });
              if (isNotNil(resized)) {
                send({
                  type: 'continue_resizing',
                  element: {
                    id,
                    x1: resized.x1,
                    y1: resized.y1,
                    x2: resized.x2,
                    y2: resized.y2,
                    type
                  }
                });
              }
            }
          }
        })
        .otherwise(() => noOpFn);
    },
    [state, send]
  );

  const onMouseUp = () => {
    match(state.value)
      .with('select', () => {
        send({ type: 'deselect_all' });
      })
      .with('drawing', () => {
        send({ type: 'finish_drawing' });
      })
      .with('repositioning', () => {
        send({ type: 'finish_repositioning' });
      })
      .with('resizing', () => {
        send({ type: 'finish_resizing' });
      })
      .otherwise(() => noOpFn);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        match(state.value)
          .with('repositioning', () => {
            send({ type: 'cancel_repositioning' });
          })
          .with('resizing', () => {
            send({ type: 'cancel_resizing' });
          })
          .otherwise(() => noOpFn);
      }

      if (
        (event.key === 'Delete' || event.key === 'Backspace') &&
        state.matches('select') &&
        state.context.selectedElements.size > 0
      ) {
        console.log('removing element');
        // todo account for more
        send({
          type: 'remove_element',
          elementId: state.context.selectedElements.values().next().value.id
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [state, send]);

  return (
    <div className="w-full h-full flex flex-col gap-2">
      <canvas
        ref={canvasRef}
        className={cx(
          'w-full h-full z-10',
          showGrid &&
            'bg-[length:40px_40px] bg-[radial-gradient(circle,_#323232_1px,_transparent_1px)] dark:bg-[radial-gradient(circle,_#5fd7ff_1px,_transparent_1px)]'
        )}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
      ></canvas>
      <div ref={toolbarRef} className="flex items-center justify-between">
        <IconButton
          onClick={() => {
            setIsDarkMode(!isDarkMode);
            send({ type: 'reset' });
          }}
          icon={isDarkMode ? <FiMoon /> : <FiSun />}
          label="Toggle Theme"
        />
        <div className="flex gap-4 items-center justify-center">
          <IconButton
            onClick={() => {
              send({ type: 'initiate_select' });
            }}
            icon={<FiMousePointer />}
            shouldHighlight={
              state.matches('select') ||
              state.matches('repositioning') ||
              state.matches('resizing')
            }
          />
          <IconButton
            onClick={() => {
              console.log('initiate draw with circle');
              send({
                type: 'initiate_draw',
                shape: 'circle'
              });
            }}
            icon={<FiCircle />}
            shouldHighlight={state.context.selectedShape === 'circle'}
          />
          <IconButton
            onClick={() => {
              console.log('initiate draw with rectangle');
              send({
                type: 'initiate_draw',
                shape: 'rectangle'
              });
            }}
            icon={<FiSquare />}
            shouldHighlight={state.context.selectedShape === 'rectangle'}
          />
        </div>
        <IconButton
          onClick={() => {
            setShowGrid(!showGrid);
            send({ type: 'reset' });
          }}
          icon={<FiGrid />}
          label="Toggle Grid"
        />
      </div>
    </div>
  );
};
