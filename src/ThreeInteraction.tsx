import * as THREE from 'three';

import ThreeObject from './ThreeObject'

//-----------------------------------------------------------------------------
// Public interfaces
//-----------------------------------------------------------------------------

type TObject =
    ThreeObject<any, any>
    | THREE.Object3D;

type IterableCollection =
    Array<TObject>
    | Map<any, TObject>
    | Set<TObject>
    | ReadonlyArray<TObject>
    | ReadonlyMap<any, TObject>
    | ReadonlySet<TObject>;

export interface IThreeInteractionTracker {
    subscribe(object: THREE.Object3D): void;
    unsubscribe(object: THREE.Object3D): void;
}

export interface IThreeIntersection extends THREE.Intersection {
    readonly component: ThreeObject<any, any>;
}

export interface IThreeRaycaster {
    raycast(viewportPosition: THREE.Vector2): IterableIterator<IThreeIntersection>;
    raycast(viewportPosition: THREE.Vector2, object: THREE.Object3D): IThreeIntersection | null;
    raycast(viewportPosition: THREE.Vector2, object: THREE.Object3D, recursive: boolean): IterableIterator<IThreeIntersection>;
    raycast(viewportPosition: THREE.Vector2, objects: THREE.Object3D[], recursive?: boolean): IterableIterator<IThreeIntersection>;
    raycast(viewportPosition: THREE.Vector2, object: ThreeObject<any, any>): IThreeIntersection | null;
    raycast(viewportPosition: THREE.Vector2, object: ThreeObject<any, any>, recursive: boolean): IterableIterator<IThreeIntersection>;
    raycast(viewportPosition: THREE.Vector2, objects: ThreeObject<any, any>[], recursive?: boolean): IterableIterator<IThreeIntersection>;
    raycast(viewportPosition: THREE.Vector2, objects: IterableCollection, recursive?: boolean): IterableIterator<IThreeIntersection>;
}

export enum PointerDeviceType {
    Mouse,
    Touch,
    Pen,
    Other
}
export enum MouseButton {
    None = 0,
    Left = 1,
    Right = 2,
    Middle = 4
}

export interface PointerProperties { }
export interface MousePointerProperties extends PointerProperties {
    readonly buttons: MouseButton;
}
export interface TouchPointerProperties extends PointerProperties { }
export interface PenPointerProperties extends PointerProperties {
    readonly isInContact: boolean;
}

export interface IPointerEvent {
    // Boolean flag indicating whether this object will capture (when set to true) further pointer events.
    // If no element captures this event it will be forwarded to the root of DOM.
    // Manipulation events will only be sent when there is an object that captured pointer events.
    handled: boolean;
    // Device type
    readonly type: PointerDeviceType;
    // Pointer properties
    readonly properties: PointerProperties | MousePointerProperties | TouchPointerProperties | PenPointerProperties;
    // Viewport position
    readonly capturing: boolean;
    // Viewport position
    readonly position: THREE.Vector2;
    // Info about pointer intersection on the receiving object
    readonly intersection: THREE.Intersection;
}
export interface IPointerEnterEvent extends IPointerEvent { }
export interface IPointerExitEvent extends IPointerEvent { }
export interface IPointerPressEvent extends IPointerEvent { }
export interface IPointerReleaseEvent extends IPointerEvent { }
export interface IPointerMoveEvent extends IPointerEvent { }
export interface IPointerCaptureLostEvent extends IPointerEvent { }

export interface IClickEvent extends IPointerEvent {
    // Number of consecutive mouse clicks
    readonly count: number;
}
export interface ILongPressEvent extends IPointerEvent {
}

export interface IManipulationEvent {
    readonly sourceEvent: IPointerEvent;
}
export interface IManipulationStartEvent extends IManipulationEvent {
    // Boolean flag indicating whether this object will ignore (when set to true)
    // or accept (false or undefined) further pointer events until the next manipulation event.
    cancel: boolean;
    // Center of the gesture region in viewport coordinates space
    readonly center: THREE.Vector2;
}
export interface IManipulationDeltaEvent extends IManipulationEvent {
    // Boolean flag indicating whether this object will ignore (when set to true)
    // or accept (false or undefined) further pointer events until the next manipulation event.
    cancel: boolean;
    // Center of the gesture region in viewport coordinates space
    readonly center: THREE.Vector2;
    // Move from the beginning of this manipulation series (viewport coordinates).
    readonly aggregatedMove: THREE.Vector2;
    // Scale change from the beginning of this manipulation series.
    readonly aggregatedScale: number;
    // Rotation change from the beginning of this manipulation series (in degrees).
    readonly aggregatedRotation: number;
    // Move from the previous manipulation event (viewport coordinates).
    readonly deltaMove: THREE.Vector2;
    // Scale change from the previous manipulation event.
    readonly deltaScale: number;
    // Rotation change from the previous manipulation event (degrees).
    readonly deltaRotation: number;
}
export interface IManipulationEndEvent extends IManipulationEvent { }

export interface IThreeInteractionListener {
    OnGotFocus(): void;
    OnLostFocus(): void;
    OnPointerEnter(e: IPointerEnterEvent): void;
    OnPointerExit(e: IPointerExitEvent): void;
    OnPointerPress(e: IPointerPressEvent): void;
    OnPointerRelease(e: IPointerReleaseEvent): void;
    OnPointerMove(e: IPointerMoveEvent): void;
    OnPointerCaptureLost(e: IPointerCaptureLostEvent): void;
    OnClick(e: IClickEvent): void;
    OnLongPress(e: ILongPressEvent): void;
    OnManipulationStart(e: IManipulationStartEvent): void;
    OnManipulationDelta(e: IManipulationDeltaEvent): void;
    OnManipulationEnd(e: IManipulationEndEvent): void;
}
