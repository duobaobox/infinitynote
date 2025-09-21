declare module "leader-line" {
  interface LeaderLineOptions {
    color?: string;
    size?: number;
    path?: "straight" | "arc" | "fluid" | "magnet" | "grid";
    startSocket?: "top" | "right" | "bottom" | "left" | "auto";
    endSocket?: "top" | "right" | "bottom" | "left" | "auto";
    startSocketGravity?: number | [number, number] | "auto";
    endSocketGravity?: number | [number, number] | "auto";
    startPlug?:
      | "disc"
      | "square"
      | "arrow1"
      | "arrow2"
      | "arrow3"
      | "hand"
      | "crosshair"
      | "behind";
    endPlug?:
      | "disc"
      | "square"
      | "arrow1"
      | "arrow2"
      | "arrow3"
      | "hand"
      | "crosshair"
      | "behind";
    startPlugColor?: string | "auto";
    endPlugColor?: string | "auto";
    startPlugSize?: number;
    endPlugSize?: number;
    outline?: boolean;
    outlineColor?: string;
    outlineSize?: number;
    startPlugOutline?: boolean;
    endPlugOutline?: boolean;
    startPlugOutlineColor?: string | "auto";
    endPlugOutlineColor?: string | "auto";
    startPlugOutlineSize?: number;
    endPlugOutlineSize?: number;
    startLabel?: string;
    middleLabel?: string;
    endLabel?: string;
    dash?:
      | boolean
      | {
          len?: number | string;
          gap?: number | string;
          animation?:
            | boolean
            | {
                duration?: number;
                timing?: string | [number, number, number, number];
              };
        };
    gradient?:
      | boolean
      | {
          startColor?: string | "auto";
          endColor?: string | "auto";
        };
    dropShadow?:
      | boolean
      | {
          dx?: number;
          dy?: number;
          blur?: number;
          color?: string;
          opacity?: number;
        };
    hide?: boolean;
  }

  interface AnimationOptions {
    duration?: number;
    timing?: string | [number, number, number, number];
  }

  class LeaderLine {
    constructor(start: Element, end: Element, options?: LeaderLineOptions);
    constructor(options: LeaderLineOptions & { start: Element; end: Element });

    // Properties (can be read/written)
    color: string;
    size: number;
    path: string;
    startSocket: string;
    endSocket: string;
    startSocketGravity: number | [number, number] | string;
    endSocketGravity: number | [number, number] | string;
    startPlug: string;
    endPlug: string;
    startPlugColor: string;
    endPlugColor: string;
    startPlugSize: number;
    endPlugSize: number;
    outline: boolean;
    outlineColor: string;
    outlineSize: number;
    startPlugOutline: boolean;
    endPlugOutline: boolean;
    startPlugOutlineColor: string;
    endPlugOutlineColor: string;
    startPlugOutlineSize: number;
    endPlugOutlineSize: number;
    startLabel: string;
    middleLabel: string;
    endLabel: string;
    dash: boolean | object;
    gradient: boolean | object;
    dropShadow: boolean | object;

    // Methods
    setOptions(options: LeaderLineOptions): LeaderLine;
    show(
      showEffectName?: "none" | "fade" | "draw",
      animOptions?: AnimationOptions
    ): LeaderLine;
    hide(
      showEffectName?: "none" | "fade" | "draw",
      animOptions?: AnimationOptions
    ): LeaderLine;
    position(): LeaderLine;
    remove(): void;

    // Static properties
    static positionByWindowResize: boolean;

    // Static methods (attachments)
    static pointAnchor(
      element: Element,
      options?: { x?: number | string; y?: number | string }
    ): any;
    static pointAnchor(options: {
      element: Element;
      x?: number | string;
      y?: number | string;
    }): any;
    static areaAnchor(element: Element, shape?: string, options?: any): any;
    static areaAnchor(options: any): any;
    static mouseHoverAnchor(
      element: Element,
      showEffectName?: string,
      options?: any
    ): any;
    static mouseHoverAnchor(options: any): any;
    static captionLabel(text: string, options?: any): any;
    static captionLabel(options: any): any;
    static pathLabel(text: string, options?: any): any;
    static pathLabel(options: any): any;
  }

  // Export as namespace and default
  export = LeaderLine;
}
