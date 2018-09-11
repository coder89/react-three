import * as React from 'react';
import * as THREE from 'three';
import { RouteComponentProps } from 'react-router-dom';
import * as ReactDOM from 'react-dom';

import ThreeComponent from './ThreeComponent'
import ThreeScene from './ThreeScene'

import { Internal } from './Internal/InteractionManager'
import { WebGLRenderList } from './Internal/WebGLRenderLists'

//-----------------------------------------------------------------------------
// Public interfaces
//-----------------------------------------------------------------------------

type Size = {
    width: number;
    height: number;
};

export interface ResizeEvent {
    readonly oldSize: Size;
    readonly newSize: Size;
}

//-----------------------------------------------------------------------------
// Properties
//-----------------------------------------------------------------------------

export interface Properties extends React.HTMLAttributes<HTMLCanvasElement> {
    canvas?: HTMLCanvasElement;
    children: React.ReactElement<ThreeScene>
    enableRenderLoop?: boolean;
    onResize?: (e: ResizeEvent) => void;
}

//-----------------------------------------------------------------------------
// Component
//-----------------------------------------------------------------------------

export default class ThreeRenderer extends ThreeComponent<Properties, {}> {
    private readonly m_interactionManager: Internal.InteractionManager;
    private m_canvas: HTMLCanvasElement;
    private m_scene: ThreeScene;
    private m_renderLifecycle: IRenderLifecycle;
    private m_renderer: THREE.WebGLRenderer;
    private m_requestMeasureToken: number;
    private m_requestRenderToken: number;
    private m_requestAnimationFrameToken: number;

    static get defaultProps() {
        return {
            enableRenderLoop: true,
        }
    }

    public constructor(props: any) {
        super(props);

        this.m_interactionManager = new Internal.InteractionManager();

        this.renderScene = this.renderScene.bind(this);
        this.requestRender = this.requestRender.bind(this);
        this.renderCallback = this.renderCallback.bind(this);
        this.renderLoop = this.renderLoop.bind(this);
        this.takeScreenshot = this.takeScreenshot.bind(this);
    }

    public takeScreenshot() {
        this.m_renderer.render(this.m_scene.sceneObject, this.m_scene.camera);
        return this.m_renderer.domElement.toDataURL();
    }

    public get size() {
        return this.m_renderer.getSize();
    }
    public get clientSize() {
        return {
            width: this.canvas.clientWidth,
            height: this.canvas.clientHeight
        };
    }
    public get scene(): ThreeScene {
        return this.m_scene;
    }
    protected get canvas(): HTMLCanvasElement {
        return this.props.canvas || this.m_canvas;
    }

    // #region Public methods
    public refresh(): void {
        if (!this.props.enableRenderLoop) {
            this.requestRender();
        }
    }
    public invalidateMeasure(): void {
        this.cancelRequestMeasure();
        this.m_requestMeasureToken = window.setTimeout(() => {
            delete this.m_requestMeasureToken;
            if (this.m_renderer) {
                this.updateRendererSize();
                this.renderScene();
            }
        });
    }
    // #endregion

    // #region React.Component
    public componentWillMount() {
        if (this.props.canvas) {
            this.connectInteraction(this.props.canvas);
        }
    }
    public componentDidMount() {
        this.initializeRenderer();
    }
    public componentWillUnmount() {
        this.uninitializeRenderer();

        this.m_interactionManager.disconnectEvents();
        this.m_interactionManager.dispose();

        if (this.m_scene) {
            if (this.m_renderLifecycle) {
                delete this.m_renderLifecycle;
            }
            delete this.m_scene;
        }
    }
    public componentWillReceiveProps(nextProps: Properties) {
        if (this.m_renderer) {
            ThreeRenderer.setupRenderer(this.m_renderer, nextProps);
        }

        if (this.props.canvas != nextProps.canvas) {
            if (this.props.canvas) {
                this.disconnectInteraction();
                this.uninitializeRenderer();
            }
        }
    }
    public componentWillUpdate() {
        this.invalidateMeasure();
    }
    public componentDidUpdate() {
        this.updateRendererSize();

        if (this.m_canvas) {
            this.connectInteraction(this.m_canvas);
        } else {
            this.disconnectInteraction();
        }

        if (this.m_renderer) {
            this.initializeRendering();
        }
    }
    public render() {
        // Render onto the external xanvas
        if (this.props.canvas) {
            return null;
        }

        // Create own canvas internally
        const { enableRenderLoop, canvas, children, onResize, ...canvasProps } = this.props;
        return React.createElement("canvas", {
            ...canvasProps,
            children: super.render(),
            ref: (canvas: HTMLCanvasElement) => {
                this.m_canvas = canvas;
                if (this.m_canvas) {
                    this.connectInteraction(this.m_canvas);
                }
            }
        });
    }
    // #endregion

    // #region ThreeComponent
    protected componentMounted(component: any): void {
        this.m_scene = component as ThreeScene;
        if (this.m_scene) {
            this.m_renderLifecycle = (this.m_scene as any) as IRenderLifecycle;
            this.m_interactionManager.initialize(this.m_scene);
        }
    }
    protected componentUnmounted(component: ThreeComponent<any, any>): void {
        this.m_interactionManager.uninitialize();
        if (this.m_scene) {
            if (this.m_renderLifecycle) {
                delete this.m_renderLifecycle;
            }
            delete this.m_scene;
        }
    }
    // #endregion

    // #region Render loop
    private initializeRendering(): void {
        // Render first frame if there is no scheduled render pending
        if (!this.m_requestAnimationFrameToken && !this.m_requestRenderToken) {
            this.renderScene(0);
        }

        if (this.props.enableRenderLoop) {
            // If animated rendering is enabled schedule updates
            this.m_interactionManager.onInteraction = null;
            // Cancel render request
            this.cancelRequestRender();
            // Start animation loop if not running yet
            if (!this.m_requestAnimationFrameToken) {
                this.continueRenderLoop();
            }
        } else {
            // Cancel animation loop if still running
            this.stopRenderLoop();
            // Otherwise set a callback that will be called when user interacts with the scene
            this.m_interactionManager.onInteraction = this.requestRender;
        }
    }
    private renderScene(timestamp?: number) {
        if (this.m_renderer) {
            // Clear the canvas with fill color
            this.m_renderer.clear();

            if (this.m_scene) {
                this.m_renderLifecycle.OnBeforeUpdate();

                // Update scene state with a tick
                if (this.props.enableRenderLoop) {
                    this.m_interactionManager.update();
                }

                this.m_renderLifecycle.OnUpdate(timestamp);

                // Render the scene
                this.m_renderLifecycle.OnPreRender();
                this.m_renderer.render(
                    this.m_scene.sceneObject,
                    this.m_scene.camera);
                this.m_renderLifecycle.OnPostRender();
            }
        }
    }
    private requestRender(): void {
        if (this.m_requestRenderToken || this.props.enableRenderLoop) {
            return;
        }

        this.m_requestRenderToken = window.setTimeout(this.renderCallback, 0);
    }
    private cancelRequestRender(): void {
        if (this.m_requestRenderToken) {
            window.clearTimeout(this.m_requestRenderToken);
            delete this.m_requestRenderToken;
        }
    }
    private renderCallback(): void {
        if (this.m_requestRenderToken) {
            delete this.m_requestRenderToken;
        }

        this.renderScene();
    }
    private renderLoop(timestamp: number): void {
        if (this.m_requestAnimationFrameToken && this.props.enableRenderLoop) {
            this.continueRenderLoop();
        }

        this.renderScene(timestamp);
    }
    private continueRenderLoop(): void {
        this.m_requestAnimationFrameToken = window.requestAnimationFrame(this.renderLoop);
    }
    private stopRenderLoop(): void {
        if (this.m_requestAnimationFrameToken) {
            window.cancelAnimationFrame(this.m_requestAnimationFrameToken);
            delete this.m_requestAnimationFrameToken;
        }
    }
    private cancelRequestMeasure(): void {
        if (this.m_requestMeasureToken) {
            window.clearTimeout(this.m_requestMeasureToken);
            delete this.m_requestMeasureToken;
        }
    }
    // #endregion

    // #region Interaction
    private connectInteraction(canvas: HTMLCanvasElement): void {
        this.m_interactionManager.connectEvents(canvas);
    }
    private disconnectInteraction(): void {
        this.m_interactionManager.disconnectEvents();
    }
    // #endregion

    // #region Renderer initialization
    private initializeRenderer(): void {
        // Create renderer
        let renderer = ThreeRenderer.createRenderer(this.canvas, this.props);
        if (renderer && this.m_renderer !== renderer) {
            this.m_renderer = renderer;
            this.updateRendererSize();
            this.initializeRendering();
        }
    }
    private uninitializeRenderer(): void {
        this.cancelRequestMeasure();
        this.cancelRequestRender();
        this.stopRenderLoop();

        if (this.m_renderer) {
            if (this.m_renderer instanceof THREE.WebGLRenderer) {
                this.m_renderer.dispose();
            }
            delete this.m_renderer;
        }
    }
    private updateRendererSize(): void {
        if (this.m_renderer) {
            var rendererSize = this.size;
            var clientSize = this.clientSize;
            if (clientSize.width != this.size.width || clientSize.height != rendererSize.height) {
                // Note: pixelRatio needs to be set before setSize() to ensure textures don't show up blurry.
                this.m_renderer.setPixelRatio(window.devicePixelRatio || 1);
                this.m_renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight, false);
                this.m_renderer.setViewport(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
                var resizeHandler = this.props.onResize;
                if (resizeHandler) {
                    resizeHandler({
                        oldSize: rendererSize,
                        newSize: clientSize
                    });
                }
            }
        }
    }
    private static createRenderer(canvas: HTMLCanvasElement, props: Properties): THREE.WebGLRenderer | undefined {
        // TODO: Use Three.js Detector example utility to test for that
        let webglSupported = false;
        try {
            webglSupported = !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        } catch (e) { }

        var renderer;
        if (webglSupported) {
            renderer = new THREE.WebGLRenderer({
                alpha: true,
                antialias: true,
                canvas: canvas
            });

            // Note: Injects custom implementation of WebGLRenderList which add support
            //       for grouping render items into layers which simplifies
            //       logic of rendering multi-layered 2D objects.
            var lists: any = {};
            var oldGet = renderer.renderLists.get;
            renderer.renderLists.get = function (scene: THREE.Scene, camera: THREE.Camera): THREE.WebGLRenderList {
                var hash = `${scene.id},${camera.id}`;
                var list = lists[hash];

                if (list === undefined) {
                    list = new WebGLRenderList();
                    lists[hash] = list;
                }

                return list;
            };
            renderer.renderLists.dispose = function () {
                lists = {};
            }
        } else {
            // TODO: This is not supported. THREE.CanvasRenderer has been deprecated and moved out to 'three/examples/js/renderers/CanvasRenderer.js'
            //       Fix this later to add support for older browsers!!!
            console.warn('WebGL not supported!');
            return;
        }

        ThreeRenderer.setupRenderer(renderer, props);
        return renderer;
    }
    private static setupRenderer(renderer: THREE.WebGLRenderer, props: Properties): void {
        renderer.autoClear = false;

        if (props.style && props.style.backgroundColor) {
            renderer.setClearColor(props.style.backgroundColor);
        }
    }
    // #endregion
}

interface IRenderLifecycle {
    OnBeforeUpdate(): void;
    OnUpdate(timestamp?: number): void;
    OnPreRender(): void;
    OnPostRender(): void;
}