import { RendererFactory, RenderShapeTypes } from '../rendererfactory.js';

export class BaseHalftoneElement extends HTMLElement {
    static get RenderShapeTypes() { return RenderShapeTypes }

    static get observedAttributes() { return [ 'shapetype', 'distance', 'crossbarlength', 'fillcolor', 'backgroundcolor' ]; }

    set distanceBetween(val) {
        if (this.renderer) {
            this.renderer.distanceBetween = val;
        }
    }

    get distanceBetween() {
        return this.renderer ? this.renderer.distanceBetween : undefined;
    }

    constructor() {
        super();
        if (!this.hasAttribute('noshadow')) {
            this.domRoot = this.attachShadow( { mode: 'open'});
        }
        this.createRenderer();
    }

    connectedCallback() {
        if (this.hasAttribute('noshadow')) {
            this.domRoot = this;
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case 'shapetype':
                this.createRenderer(this.renderer.inputSource);
                this.render();
                return;
            case 'distance':
                this.renderer.distanceBetween = newValue;
                this.render();
                return;
            case 'crossbarlength':
                if (this.renderer.rendererType === 'crosses') {
                    this.renderer.crossBarLength = newValue;
                    this.render();
                }
                return;
        }
    }

    render() {}

    createRenderer(input) {
        const opts = {};
        if (this.hasAttribute('distance')) {
            opts.distanceBetween = Number(this.getAttribute('distance'));
        }
        const type = this.hasAttribute('shapetype') ? this.getAttribute('shapetype') : 'circles';
        this.renderer = RendererFactory(type, opts, input);
    }
}
