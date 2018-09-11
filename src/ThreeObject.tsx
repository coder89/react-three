import * as React from 'react';
import * as THREE from 'three';

import ThreeComponent from './ThreeComponent'
import ThreeScene, { IThreeSceneInfo } from './ThreeScene'
import * as ThreeExtensions from './ThreeExtensions'
import * as Interaction from './ThreeInteraction'

//-----------------------------------------------------------------------------
// Properties
//-----------------------------------------------------------------------------
type Element = React.ReactElement<ThreeComponent<any, any>> | null | undefined;
type ElementFragment = Array<Element | Element[] | boolean>;
type ElementNode = Element | ElementFragment | boolean | null | undefined;

export interface Properties {
    name?: string;
    children?: ElementNode;
    group?: number;
    isHitTestVisible?: boolean;
    isVisible?: boolean;
    position?: THREE.Vector3;
    rotation?: THREE.Quaternion;
    renderOrder?: number;
}

//-----------------------------------------------------------------------------
// Component
//-----------------------------------------------------------------------------

export default abstract class ThreeObject<P, S> extends ThreeComponent<P & Properties, S> {
    protected readonly sceneInfo: IThreeSceneInfo;
    protected readonly interactionTracker: Interaction.IThreeInteractionTracker;
    private readonly interactionListener: ThreeInteractionListener;

    public constructor(props: any, sceneInfo?: IThreeSceneInfo, interactionTracker?: Interaction.IThreeInteractionTracker) {
        super(props);
        this.sceneInfo = sceneInfo ? sceneInfo : props.sceneInfo;
        this.interactionTracker = interactionTracker ? interactionTracker : props.interactionTracker;
        this.interactionListener = new ThreeInteractionListener(this);
    }

    private m_isHitTestVisible: boolean = true;
    public get isHitTestVisible(): boolean {
        return this.m_isHitTestVisible;
    }
    public set isHitTestVisible(value: boolean) {
        if (this.m_isHitTestVisible != value) {
            this.m_isHitTestVisible = value;
            if (this.isHitTestVisible && this.isVisible) {
                this.subscribeInteractionTracker();
            } else {
                this.unsubscribeInteractionTracker();
            }
        }
    }

    public get isVisible(): boolean {
        if (this.m_object3D) {
            return this.m_object3D.visible;
        } else {
            return false;
        }
    }
    public set isVisible(value: boolean) {
        if (this.m_object3D && this.m_object3D.visible != value) {
            this.m_object3D.visible = value;
            if (this.isHitTestVisible && this.isVisible) {
                this.subscribeInteractionTracker();
            } else {
                this.unsubscribeInteractionTracker();
            }
        }
    }

    private m_object3D: THREE.Object3D;
    public get object3D(): THREE.Object3D {
        return this.m_object3D;
    }
    protected setObject3D(value: THREE.Object3D) {
        if (this.m_object3D) {
            this.unsubscribeInteractionTracker();
        }

        this.m_object3D = value;
        this.updateObjectProperties();

        if (this.isHitTestVisible && this.isVisible) {
            this.subscribeInteractionTracker();
        }
    }

    // #region React.Component
    public componentWillUnmount(): void {
        if (this.m_object3D) {
            this.unsubscribeInteractionTracker();
            delete this.m_object3D;
        }
    }
    public componentWillReceiveProps(nextProps: Readonly<P & Properties>): void {
        this.updateObjectProperties();
    }
    public render(): JSX.Element | false | null {
        return <div data-name={this.props.name}>
            {super.render(
                {
                    sceneInfo: this.sceneInfo,
                    interactionTracker: this.interactionTracker
                })}
        </div>;
    }
    // #endregion

    public update(): void {
        if (this.m_object3D) {
            this.OnUpdate();

            // Update children
            for (let key in this.components) {
                this.components[key].update();
            }
        }
    }

    protected componentMounted(component: ThreeComponent<any, any>): void {
        let obj = component as ThreeObject<any, any>;
        if (obj && obj.object3D) {
            if (this.object3D) {
                this.object3D.add(obj.object3D);
            }
        } else {
            console.warn('[MEMORY LEAK] componentMounted() was called but no object instance is present.')
        }
    }
    protected componentUnmounted(component: ThreeComponent<any, any>): void {
        let obj = component as ThreeObject<any, any>;
        if (obj && obj.object3D) {
            if (this.object3D) {
                this.object3D.remove(obj.object3D);
            }
        } else {
            console.warn('[MEMORY LEAK] componentUnmounted() was called but no object instance is present.')
        }
    }

    protected abstract OnUpdate(): void;

    protected Focus(): void {
        // TODO: Implement manual focus mechanism if needed.
        //       Not needed at the time of writing this code.
        throw DOMException.NOT_SUPPORTED_ERR;
    }
    protected abstract OnGotFocus(): void;
    protected abstract OnLostFocus(): void;

    protected abstract OnPointerEnter(e: Interaction.IPointerEnterEvent): void;
    protected abstract OnPointerExit(e: Interaction.IPointerExitEvent): void;
    protected abstract OnPointerPress(e: Interaction.IPointerPressEvent): void;
    protected abstract OnPointerRelease(e: Interaction.IPointerReleaseEvent): void;
    protected abstract OnPointerMove(e: Interaction.IPointerMoveEvent): void;
    protected abstract OnPointerCaptureLost(e: Interaction.IPointerCaptureLostEvent): void;
    protected abstract OnClick(e: Interaction.IClickEvent): void;
    protected abstract OnLongPress(e: Interaction.ILongPressEvent): void;
    protected abstract OnManipulationStart(e: Interaction.IManipulationStartEvent): void;
    protected abstract OnManipulationDelta(e: Interaction.IManipulationDeltaEvent): void;
    protected abstract OnManipulationEnd(e: Interaction.IManipulationEndEvent): void;

    private updateObjectProperties() {
        if (this.m_object3D) {
            this.m_object3D.name = this.props.name as string;
            ThreeExtensions.Object3D.setRenderOrderGroup(this.m_object3D, this.props.group);

            if (this.props.position) {
                Object.assign(this.m_object3D.position, this.props.position);
            }

            if (this.props.rotation) {
                Object.assign(this.m_object3D.rotation, this.props.rotation);
            }

            if (this.props.isHitTestVisible !== undefined) {
                this.isHitTestVisible = this.props.isHitTestVisible as boolean;
            }

            if (this.props.isVisible !== undefined) {
                this.isVisible = this.props.isVisible as boolean;
            }

            if (this.props.renderOrder) {
                this.m_object3D.renderOrder = this.props.renderOrder as number;
            }
        }
    }

    protected enableInteraction(object: THREE.Object3D): void {
        if (object) {
            if (!(object as any).component) {
                Object.assign(object, { component: this });
                this.interactionTracker.subscribe(object);
            }
        }
    }
    protected disableInteraction(object: THREE.Object3D): void {
        if (object) {
            if ((object as any).component) {
                delete (object as any).component;
                this.interactionTracker.unsubscribe(object);
            }
        }
    }

    private subscribeInteractionTracker(): void {
        this.enableInteraction(this.m_object3D);
    }
    private unsubscribeInteractionTracker(): void {
        this.disableInteraction(this.m_object3D);
    }
}

//-----------------------------------------------------------------------------
// Interaction callback helper
//-----------------------------------------------------------------------------

class ThreeInteractionListener implements Interaction.IThreeInteractionListener {
    private readonly m_obj: any;

    public constructor(obj: any) {
        this.m_obj = obj;
    }

    public OnGotFocus(): void {
        this.m_obj.OnGotFocus();
    }
    public OnLostFocus(): void {
        this.m_obj.OnLostFocus();
    }
    public OnPointerEnter(args: Interaction.IPointerEnterEvent): void {
        this.m_obj.OnPointerEnter(args);
    }
    public OnPointerExit(args: Interaction.IPointerExitEvent): void {
        this.m_obj.OnPointerExit(args);
    }
    public OnPointerPress(args: Interaction.IPointerPressEvent): void {
        this.m_obj.OnPointerPress(args);
    }
    public OnPointerRelease(args: Interaction.IPointerReleaseEvent): void {
        this.m_obj.OnPointerRelease(args);
    }
    public OnPointerMove(args: Interaction.IPointerMoveEvent): void {
        this.m_obj.OnPointerMove(args);
    }
    public OnPointerCaptureLost(args: Interaction.IPointerCaptureLostEvent): void {
        this.m_obj.OnPointerCaptureLost(args);
    }
    public OnClick(args: Interaction.IClickEvent): void {
        this.m_obj.OnClick(args);
    }
    public OnLongPress(args: Interaction.ILongPressEvent): void {
        this.m_obj.OnLongPress(args);
    }
    public OnManipulationStart(args: Interaction.IManipulationStartEvent): void {
        this.m_obj.OnManipulationStart(args);
    }
    public OnManipulationDelta(args: Interaction.IManipulationDeltaEvent): void {
        this.m_obj.OnManipulationDelta(args);
    }
    public OnManipulationEnd(args: Interaction.IManipulationEndEvent): void {
        this.m_obj.OnManipulationEnd(args);
    }
}
