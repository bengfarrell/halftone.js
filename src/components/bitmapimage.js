import { BaseHalftoneElement } from './basecomponent';

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
        this.canvas.style.position = 'absolute';
    }

    loadImage(uri) {
        this.renderer.loadImage(uri).then( () => { this.render() });
    }

    resize() {
        let modified = super.resize();
        if (modified) {
            this.canvas.style.top = this.visibleRect.y + 'px';
            this.canvas.style.left = this.visibleRect.x + 'px';
        }
        return modified;
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
            case 'blendmode':
                this.canvas.style['mix-blend-mode'] = newValue;
                break;

            case 'shapecolor':
                this.render();
                break;

            case 'src':
                if (this.renderer) {
                    this.loadImage(newValue);
                }
                break;

        }
    }

    createRendererOptions() {
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.style.position = 'relative';
        }
        const opts = super.createRendererOptions();
        opts.renderer = 'canvas';
        opts.outputCanvas = this.canvas;
        opts.outputSize = this.renderer?.opts.outputSize ? this.renderer?.opts.outputSize : { width: 0, height: 0 };
        return opts;
    }
}

if (!customElements.get('halftone-bitmap-image')) {
    customElements.define('halftone-bitmap-image', HalftoneBitmapImage);
}
