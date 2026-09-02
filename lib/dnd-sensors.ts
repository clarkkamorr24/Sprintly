import { PointerSensor, TouchSensor } from "@dnd-kit/core";

const INTERACTIVE = "button, a, input, textarea, select, [role='menuitem'], [contenteditable='true']";

function startsFromInteractiveElement(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;

  return target.closest(`${INTERACTIVE}, [data-no-drag]`) !== null;
}

export class CardPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: "onPointerDown" as const,
      handler: ({ nativeEvent }: React.PointerEvent) =>
        !startsFromInteractiveElement(nativeEvent.target),
    },
  ];
}

export class CardTouchSensor extends TouchSensor {
  static activators = [
    {
      eventName: "onTouchStart" as const,
      handler: ({ nativeEvent }: React.TouchEvent) =>
        !startsFromInteractiveElement(nativeEvent.target),
    },
  ];
}
