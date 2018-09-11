import * as THREE from 'three'

// Note: This extensions in conjunction with custom implementation of WebGLRenderList 
//       adds support for grouping 2D objects into single layers and solves problem
//       with artifacts due to rounding errors in depth buffer when rendering 3D scenes.

export class Object3D {
    public static getRenderOrderGroup(o: THREE.Object3D): number {
        return (o as any)._renderOrderGroup;
    }
    public static setRenderOrderGroup(o: THREE.Object3D, renderOrderGroup?: number, recursive?: boolean): void {
        let obj = (o as any);
        if (renderOrderGroup) {
            obj._renderOrderGroup = renderOrderGroup;
        } else if (obj._renderOrderGroup) {
            delete obj._renderOrderGroup;
        }

        if (recursive) {
            let children = o.children;
            for (let i = 0; i < children.length; ++i) {
                Object3D.setRenderOrderGroup(children[i], renderOrderGroup, recursive);
            }
        }
    }
}
