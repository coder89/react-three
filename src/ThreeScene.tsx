import * as React from 'react';
import * as THREE from 'three';

import ThreeComponent from './ThreeComponent'
import ThreeObject from './ThreeObject'

import Raycaster from './Internal/Raycaster'
import SceneInfo from './Internal/SceneInfo'
import TimeInfo from './Internal/TimeInfo'
import * as Interaction from './ThreeInteraction'

//-----------------------------------------------------------------------------
// Public interfaces
//-----------------------------------------------------------------------------

export interface IThreeTimeInfo {
    readonly current: number;
    readonly delta: number;
}

export interface IThreeSceneInfo {
    readonly time: IThreeTimeInfo;
    readonly camera: THREE.Camera;
    readonly raycaster: Interaction.IThreeRaycaster;
}

//-----------------------------------------------------------------------------
// Properties & states
//-----------------------------------------------------------------------------

export interface Properties {
    camera?: THREE.Camera;
}

//-----------------------------------------------------------------------------
// Public component
//-----------------------------------------------------------------------------

export default class ThreeScene extends ThreeObject<Properties, {}> {
    constructor(props: any) {
        var sceneInfo = new SceneInfo();
        var raycaster = new Raycaster(sceneInfo);

        super(props, sceneInfo, raycaster);

        this.m_sceneInfo = sceneInfo;
        this.m_raycaster = raycaster;

        this.m_sceneInfo.initialize(this);
        this.m_raycaster.initialize(this);
    }

    private readonly m_sceneInfo: SceneInfo;
    public get metadata(): IThreeSceneInfo {
        return this.m_sceneInfo;
    }

    private readonly m_raycaster: Raycaster;
    public get raycaster(): Interaction.IThreeRaycaster {
        return this.m_raycaster;
    }

    private m_camera: THREE.Camera;
    public get camera(): THREE.Camera {
        return this.m_camera;
    }
    public set camera(value: THREE.Camera) {
        this.m_camera = value;
    }
    private updateCamera() {
        if (this.props.camera) {
            this.camera = this.props.camera as THREE.Camera;
        } else if (!this.camera) {
            // TODO: expose via properties camera parameters
            // Task #807: Support for customizable camera (ThreeCamera instance)
            this.camera = new THREE.PerspectiveCamera(80, 1);
            console.warn('Camera was not set. Using default one.')
        }
    }

    private m_threeScene: THREE.Scene;
    public get sceneObject(): THREE.Scene {
        return this.object3D as THREE.Scene;
    }

    public setScale(s: THREE.Vector3 | THREE.Vector2) {
        if (s instanceof THREE.Vector3) {
            this.m_threeScene.scale.set(s.x, s.y, s.z);
        } else {
            this.m_threeScene.scale.setX(s.x);
            this.m_threeScene.scale.setY(s.y);
        }
    }

    public componentWillMount() {
        this.m_threeScene = new THREE.Scene();
        this.setObject3D(this.m_threeScene);

        this.updateCamera();
    }
    public componentDidUpdate() {
        this.updateCamera();
    }
    public componentWillUnmount() {
        super.componentWillUnmount();

        this.m_sceneInfo.dispose();
        this.m_raycaster.dispose();

        if (this.m_camera) {
            delete this.m_camera;
        }

        if (this.m_threeScene) {
            delete this.m_threeScene;
        }
    }

    protected OnGotFocus(): void { }
    protected OnLostFocus(): void { }

    protected OnPointerEnter(e: Interaction.IPointerEnterEvent): void { }
    protected OnPointerExit(e: Interaction.IPointerExitEvent): void { }
    protected OnPointerPress(e: Interaction.IPointerPressEvent): void { }
    protected OnPointerRelease(e: Interaction.IPointerReleaseEvent): void { }
    protected OnPointerMove(e: Interaction.IPointerMoveEvent): void { }
    protected OnPointerCaptureLost(e: Interaction.IPointerCaptureLostEvent): void { }
    protected OnClick(e: Interaction.IClickEvent): void { }
    protected OnLongPress(e: Interaction.ILongPressEvent): void { }
    protected OnManipulationStart(e: Interaction.IManipulationStartEvent): void { }
    protected OnManipulationDelta(e: Interaction.IManipulationDeltaEvent): void { }
    protected OnManipulationEnd(e: Interaction.IManipulationEndEvent): void { }

    protected OnBeforeUpdate(timestamp?: number): void {
        if (timestamp) {
            this.m_raycaster.OnUpdate();
        }
    } protected OnUpdate(timestamp?: number): void {
        if (timestamp) {
            this.m_sceneInfo.time.current = timestamp;
            this.update();
        }
    }
    protected OnPreRender() {
        this.m_raycaster.OnPreRender();
    }
    protected OnPostRender() {
        this.m_raycaster.OnPostRender();
    }
}
