import * as THREE from 'three';
import 'three/Octree'
import ThreeScene from '../ThreeScene'
import ThreeObject from '../ThreeObject'
import * as Interaction from '../ThreeInteraction'
import { IThreeIntersection } from '../ThreeInteraction'
import SceneInfo from './SceneInfo'

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

type Iterable =
    Array<TObject>
    | IterableIterator<TObject>
    | IterableIterator<[any, TObject]>;

export default class Raycaster implements Interaction.IThreeRaycaster, Interaction.IThreeInteractionTracker {
    private readonly m_sceneInfo: SceneInfo;
    private readonly m_raycaster: THREE.Raycaster;
    private readonly m_octree: THREE.Octree;
    private m_scene: ThreeScene;

    public constructor(sceneInfo: SceneInfo) {
        this.m_sceneInfo = sceneInfo;

        this.m_octree = new THREE.Octree({
            // uncomment below to see the octree (may kill the fps)
            //scene: scene,
            // when undeferred = true, objects are inserted immediately
            // instead of being deferred until next octree.update() call
            // this may decrease performance as it forces a matrix update
            undeferred: false,
            // set the max depth of tree
            depthMax: Infinity,
            // max number of objects before nodes split or merge
            //objectsThreshold: 8,
            // percent between 0 and 1 that nodes will overlap each other
            // helps insert objects that lie over more than one node
            //overlapPct: 0.15
        });

        this.m_raycaster = new THREE.Raycaster();
    }
    public initialize(scene: ThreeScene): void {
        this.m_scene = scene;
    }
    public dispose(): void {
        if (this.m_scene) {
            delete this.m_scene;
        }
    }

    public subscribe(object: THREE.Object3D): void {
        if (this.m_scene.sceneObject !== object) {
            this.m_octree.add(object);
        }
    }
    public unsubscribe(object: THREE.Object3D): void {
        this.m_octree.remove(object);
    }

    public OnUpdate() { }
    public OnPreRender() { }
    public OnPostRender() {
        // update octree post render
        // this ensures any objects being added
        // have already had their matrices updated
        this.m_octree.update();
    }

    public raycast(viewportPosition: THREE.Vector2): IterableIterator<Interaction.IThreeIntersection>
    public raycast(viewportPosition: THREE.Vector2, objects: THREE.Object3D): Interaction.IThreeIntersection | null;
    public raycast(viewportPosition: THREE.Vector2, objects: THREE.Object3D, recursive: boolean): IterableIterator<Interaction.IThreeIntersection>;
    public raycast(viewportPosition: THREE.Vector2, objects: THREE.Object3D[], recursive?: boolean): IterableIterator<Interaction.IThreeIntersection>;
    public raycast(viewportPosition: THREE.Vector2, objects: ThreeObject<any, any>): Interaction.IThreeIntersection | null;
    public raycast(viewportPosition: THREE.Vector2, objects: ThreeObject<any, any>, recursive: boolean): IterableIterator<Interaction.IThreeIntersection>;
    public raycast(viewportPosition: THREE.Vector2, objects: ThreeObject<any, any>[], recursive?: boolean): IterableIterator<Interaction.IThreeIntersection>;
    public raycast(viewportPosition: THREE.Vector2, objects: IterableCollection, recursive?: boolean): IterableIterator<Interaction.IThreeIntersection>;
    public raycast(viewportPosition: THREE.Vector2, objects?: any, recursive?: boolean): any {
        if (this.m_sceneInfo.camera) {
            // Get camera ray
            this.m_raycaster.setFromCamera(viewportPosition, this.m_sceneInfo.camera)
            let ray: THREE.Ray = this.m_raycaster.ray;

            // Get list of THREE.Object3D instances to test
            if (objects instanceof ThreeObject) {
                // Raycast single element (with optional recursive flag)
                let intersections = this.m_raycaster.intersectObject((objects as any).object3D, recursive);
                if (recursive === undefined) {
                    // Return intersection point or null
                    return (intersections.length > 0 ? this.convertIntersection(intersections[0], objects) : null);
                } else {
                    // Return intersections as iterator
                    return this.createIntersectionIterator(intersections);
                }
            } else if (objects instanceof THREE.Object3D) {
                // Raycast single element (with optional recursive flag)
                let intersections = this.m_raycaster.intersectObject(objects, recursive);
                if (recursive === undefined) {
                    // Return intersection point or null
                    return (intersections.length > 0 ? this.convertIntersection(intersections[0]) : null);
                } else {
                    // Return intersections as iterator
                    return this.createIntersectionIterator(intersections);
                }
            } else {
                let iterable = Raycaster.getIterable(objects);
                if (iterable) {
                    return this.mapToIntersectionIterator(iterable, recursive);
                } else {
                    let threeObjects: THREE.Object3D[];
                    if (!objects || objects.length <= 0) {
                        // Raycast with Octree algorithm first
                        let octreeObjects = this.m_octree.search(ray.origin, this.m_raycaster.far, false, ray.direction) as any[];
                        threeObjects = octreeObjects.map((o: any): THREE.Object3D => o.object);
                    } else {
                        // Raycast list of given objects and return iterator
                        threeObjects = objects.map((o: any): THREE.Object3D => o.object3D);
                    }

                    return this.createRaycastIterator(threeObjects, recursive);
                }
            }
        }
    }

    private *createRaycastIterator(objects: THREE.Object3D[], recursive?: boolean): IterableIterator<Interaction.IThreeIntersection> {
        if (objects.length > 0) {
            let intersections = this.m_raycaster.intersectObjects(objects, recursive);
            for (const intersection of intersections) {
                yield this.convertIntersection(intersection);
            }
        }
    }

    private *createIntersectionIterator(intersections: THREE.Intersection[]): IterableIterator<Interaction.IThreeIntersection> {
        for (const intersection of intersections) {
            yield this.convertIntersection(intersection);
        }
    }

    private *mapToIntersectionIterator(iterable: Iterable, recursive?: boolean): IterableIterator<Interaction.IThreeIntersection> {
        for (let object of iterable) {
            if (object instanceof Array) {
                object = object[1];
            }

            if (object instanceof THREE.Object3D) {
                let intersections = this.m_raycaster.intersectObject(object, recursive);
                for (const intersection of intersections) {
                    yield this.convertIntersection(intersection);
                }
            } else {
                let intersections = this.m_raycaster.intersectObject((object as any).object3D, recursive);
                for (const intersection of intersections) {
                    yield this.convertIntersection(intersection, object);
                }
            }
        }
    }

    private convertIntersection(intersection: THREE.Intersection, component?: ThreeObject<any, any>): IThreeIntersection {
        return {
            ...intersection,
            component: (intersection.object as any).component || component
        };
    }

    private static getIterable(objects: IterableCollection): Array<TObject> | IterableIterator<TObject> | IterableIterator<[any, TObject]> | undefined {
        if (objects) {
            if (objects instanceof Array) {
                return objects;
            } else if (objects.values) {
                return objects.values();
            } else if (objects[Symbol.iterator]) {
                return objects[Symbol.iterator]();
            }
        }
    }
}
