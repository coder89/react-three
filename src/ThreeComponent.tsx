import * as React from 'react';
import * as THREE from 'three';

//-----------------------------------------------------------------------------
// Base component
//-----------------------------------------------------------------------------

export default abstract class ThreeComponent<P, S> extends React.Component<P, S> {
    private readonly m_components: any = {};
    private readonly m_refs: any = {};
    private readonly m_oldRefs: any = {};

    public constructor(props: any) {
        super(props);
    }

    public [Symbol.iterator](reversed?: boolean): IterableIterator<ThreeComponent<any, any>> {
        return this.createComponentsIterator(reversed);
    }

    protected get components() {
        return this.m_components;
    }

    public shouldComponentUpdate(props: Readonly<{ children?: React.ReactNode }> & Readonly<P>, nextState: Readonly<S>, nextContext: any): boolean {
        return (this.props.children !== props.children);
    }
    public render(props?: any): JSX.Element | false | null {
        return this.connectChildren(
            this.renderChildren(),
            props);
    }
    protected renderChildren(): React.ReactNode {
        return this.props.children;
    }

    protected abstract componentMounted(component: ThreeComponent<any, any>): void;
    protected abstract componentUnmounted(component: ThreeComponent<any, any>): void;

    private connectChildren(children: React.ReactNode, props?: any): any {
        return React.Children.map(children, (child: React.ReactChild, index: number) => {
            if (child && typeof child === 'object') {
                var oldRef = (child as any).ref;
                let element: React.ReactElement<ThreeComponent<any, any>> = child;
                if (element) {
                    let key: string = `index[${index}]`;
                    // Save old ref
                    if (this.m_oldRefs[key] !== oldRef) {
                        this.m_oldRefs[key] = oldRef;
                    }
                    // Create remp ref
                    if (this.m_refs[key] === undefined) {
                        this.m_refs[key] = this.onRef.bind(this, key);
                    }
                    return React.cloneElement(
                        child,
                        {
                            ...element.props,
                            ...props,
                            ref: this.m_refs[key]
                        },
                        child.props.children);
                }
            }

            return child;
        });
    }
    private onRef(key: string, component: ThreeComponent<any, any>) {
        let ref = this.m_oldRefs[key];
        if (ref) {
            ref(component);
        }
        if (component) {
            this.m_components[key] = component;
            this.componentMounted(component);
        } else if (this.m_components[key]) {
            this.componentUnmounted(this.m_components[key]);
            delete this.m_components[key];
        }
    }

    private *createComponentsIterator(reversed?: boolean): IterableIterator<ThreeComponent<any, any>> {
        if (reversed) {
            for (var key of Object.keys(this.m_components).reverse()) {
                yield this.m_components[key] as ThreeComponent<any, any>;
            }
        } else {
            for (var key in this.m_components) {
                yield this.m_components[key] as ThreeComponent<any, any>;
            }
        }
    }
}
