import * as THREE from 'three';

import ThreeScene, { IThreeSceneInfo } from '../ThreeScene'
import { IThreeRaycaster } from '../ThreeInteraction'
import TimeInfo from './TimeInfo'

//-----------------------------------------------------------------------------
// Component
//-----------------------------------------------------------------------------

export default class SceneInfo implements IThreeSceneInfo {
    public readonly time: TimeInfo;
    private m_scene: ThreeScene;

    constructor() {
        this.time = new TimeInfo();
    }
    public initialize(scene: ThreeScene): void {
        this.m_scene = scene;
    }
    public dispose(): void {
        if (this.m_scene) {
            delete this.m_scene;
        }
    }

    public get camera(): THREE.Camera {
        return this.m_scene.camera;
    }

    public get raycaster(): IThreeRaycaster {
        return this.m_scene.raycaster;
    }
}
