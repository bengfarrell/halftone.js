import { BaseHalftoneElement } from './basecomponent';

export class HalftoneBitmapImage extends BaseHalftoneElement {
    static get rendererType() { return 'canvas'; }

    connectedCallback() {
        super.connectedCallback();
        this.domRoot.appendChild(this.halftoneSurface);
    }

    render() {
        if (this.renderer && this.renderer.isSourceReady) {
            const modified = this.resize();
            if (modified) {
                this.renderer.setCanvasOutputSize(this.visibleRect.width, this.visibleRect.height);
            }
            this.renderer.outputCanvasContext.clearRect(0, 0, this.renderer.outputCanvas.width, this.renderer.outputCanvas.height);
            const fillColor = this.hasAttribute('shapecolor') ? this.getAttribute('shapecolor') : 'black';

            this.renderer.outputCanvasContext.fillStyle = fillColor;
            this.renderer.render();
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue);
        switch (name) {
            case 'shapecolor':
                this.render();
                break;
        }
    }

    createRendererOptions() {
        const opts = super.createRendererOptions();

        if (!this.halftoneSurface) {
            this.halftoneSurface = document.createElement('canvas');
            this.halftoneSurface.style.position = 'absolute';
        }

        opts.renderer = 'canvas';
        opts.outputCanvas = this.halftoneSurface;
        opts.outputSize = this.renderer?.opts.outputSize ? this.renderer?.opts.outputSize : { width: 0, height: 0 };
        return opts;
    }
}

if (!customElements.get('halftone-bitmap-image')) {
    customElements.define('halftone-bitmap-image', HalftoneBitmapImage);
}
