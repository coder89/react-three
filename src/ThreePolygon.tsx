import * as React from 'react';
import * as THREE from 'three';

import ThreeObject from './ThreeObject'
import * as Interaction from './ThreeInteraction'

//-----------------------------------------------------------------------------
// Properties
//-----------------------------------------------------------------------------

export interface Properties {
}

//-----------------------------------------------------------------------------
// Component
//-----------------------------------------------------------------------------

export default class ThreePolygon<P, S> extends ThreeObject<P & Properties, S> {
    public constructor(props: any) {
        super(props);
    }

    private m_mesh: THREE.Mesh;
    protected get mesh(): THREE.Mesh {
        return this.m_mesh;
    }

    private m_geometry: THREE.Geometry | THREE.BufferGeometry;
    public get geometry(): THREE.Geometry | THREE.BufferGeometry {
        return this.m_geometry;
    }
    public set geometry(value: THREE.Geometry | THREE.BufferGeometry) {
        this.m_geometry = value;
        this.updateGeometry();
    }
    private updateGeometry() {
        if (this.m_mesh) {
            this.m_mesh.geometry = this.m_geometry;
        }
    }

    private m_material: THREE.Material | THREE.Material[];
    public get material(): THREE.Material | THREE.Material[] {
        return this.m_material;
    }
    public set material(value: THREE.Material | THREE.Material[]) {
        this.m_material = value;
        this.updateMaterial();
    }
    private updateMaterial() {
        if (this.m_mesh) {
            this.m_mesh.material = this.m_material || [];
        }
    }

    public componentWillMount() {
        this.m_mesh = new THREE.Mesh();
        this.setObject3D(this.m_mesh);

        this.updateGeometry();
        this.updateMaterial();
    }

    protected OnUpdate(): void { }

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
}
