import * as THREE from 'three';
import * as ThreeExtensions from '../../SceneGraph/ThreeExtensions'

// Note: Custom implementation of WebGLRenderList which add support
//       for grouping render items into layers which simplifies
//       logic of rendering multi-layered 2D objects.

interface RenderItem extends THREE.RenderItem {
    renderOrderGroup?: number;
}

function painterSortStable(a: RenderItem, b: RenderItem) {
    if (a.renderOrderGroup !== b.renderOrderGroup) {
        return (a.renderOrderGroup || Number.MIN_SAFE_INTEGER) - (b.renderOrderGroup || Number.MIN_SAFE_INTEGER);
    } else if (a.renderOrder !== b.renderOrder) {
        return a.renderOrder - b.renderOrder;
    } else if (a.program && b.program && a.program !== b.program) {
        return a.program.id - b.program.id;
    } else if (a.material.id !== b.material.id) {
        return a.material.id - b.material.id;
    } else if (a.z !== b.z) {
        return a.z - b.z;
    } else {
        return a.id - b.id;
    }
}

function reversePainterSortStable(a: RenderItem, b: RenderItem) {
    if (a.renderOrderGroup !== b.renderOrderGroup) {
        return (a.renderOrderGroup || Number.MIN_SAFE_INTEGER) - (b.renderOrderGroup || Number.MIN_SAFE_INTEGER);
    } else if (a.renderOrder !== b.renderOrder) {
        return a.renderOrder - b.renderOrder;
    } else if (a.z !== b.z) {
        return b.z - a.z;
    } else {
        return a.id - b.id;
    }
}

export class WebGLRenderList {

    private renderItems = new Array<RenderItem>();
    private renderItemsIndex = 0;

    private opaque = new Array<RenderItem>();
    private transparent = new Array<RenderItem>();

    public init() {
        this.renderItemsIndex = 0;
        this.opaque.length = 0;
        this.transparent.length = 0;
    }

    public push(object: THREE.Object3D, geometry: THREE.Geometry, material: any, z: number, group: THREE.Group) {

        var renderItem: RenderItem = this.renderItems[this.renderItemsIndex];

        if (renderItem === undefined) {
            renderItem = {
                id: object.id,
                object: object,
                geometry: geometry,
                material: material,
                program: material.program,
                renderOrder: object.renderOrder,
                z: z,
                group: group,
                renderOrderGroup: ThreeExtensions.Object3D.getRenderOrderGroup(object)
            };

            this.renderItems[this.renderItemsIndex] = renderItem;
        } else {
            renderItem.id = object.id;
            renderItem.object = object;
            renderItem.geometry = geometry;
            renderItem.material = material;
            renderItem.program = material.program;
            renderItem.renderOrder = object.renderOrder;
            renderItem.z = z;
            renderItem.group = group;
            renderItem.renderOrderGroup = ThreeExtensions.Object3D.getRenderOrderGroup(object);
        }

        (material.transparent === true ? this.transparent : this.opaque).push(renderItem);

        this.renderItemsIndex++;
    }

    public sort() {
        if (this.opaque.length > 1) {
            this.opaque.sort(painterSortStable);
        }

        if (this.transparent.length > 1) {
            this.transparent.sort(reversePainterSortStable);
        }
    }
}
