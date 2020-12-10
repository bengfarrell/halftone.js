import { BaseHalftoneElement } from './basecomponent.js';

export class HalftoneBitmapImage extends BaseHalftoneElement {
    static get rendererType() { return 'canvas'; }

    constructor() {
        super();
        if (this.getAttribute('src')) {
            this.loadImage(this.getAttribute('src'));
        }
    }

    connectedCallback() {
        super.connectedCallback();
        this.domRoot.appendChild(this.canvas);
    }

    loadImage(uri) {
        this.renderer.loadURL(uri).then( () => { this.render() });
    }

    render() {
        if (this.renderer && this.renderer.isSourceReady) {
            const bgColor = this.hasAttribute('backgroundcolor') ? this.getAttribute('backgroundcolor') : 'white';
            const fillColor = this.hasAttribute('shapecolor') ? this.getAttribute('shapecolor') : 'black';
            this.renderer.outputCanvasContext.fillStyle = bgColor;
            this.renderer.outputCanvasContext.beginPath();
            this.renderer.outputCanvasContext.rect(0, 0, this.renderer.w, this.renderer.h );
            this.renderer.outputCanvasContext.fill();

            this.renderer.outputCanvasContext.fillStyle = fillColor;
            this.renderer.render();
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue);
        switch (name) {
            case 'backgroundcolor':
                this.render();
                break;

            case 'shapecolor':
                this.render();
                break;

        }
    }

    createRendererOptions() {
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
        }
        const opts = super.createRendererOptions();
        opts.renderer = 'canvas';
        opts.outputCanvas = this.canvas;
        return opts;
    }
}

if (!customElements.get('halftone-bitmap-image')) {
    customElements.define('halftone-bitmap-image', HalftoneBitmapImage);
}
