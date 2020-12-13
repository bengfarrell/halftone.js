import { RendererFactory, RenderShapeTypes } from '../rendererfactory';

export class BaseHalftoneElement extends HTMLElement {
    static get RenderShapeTypes() { return RenderShapeTypes }

    static get observedAttributes() { return [
        'shapetype',
        'distance',
        'crossbarlength',
        'shapecolor',
        'backgroundcolor',
        'backgroundimage',
        'blendmode' ];
    }

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

        /**
         * visible area bounding box
         * whether letterboxed or cropped, will report visible video area
         * @type {{x: number, y: number, width: number, height: number}}
         */
        this.visibleRect = { x: 0, y: 0, width: 0, height: 0 };

        /**
         *  total component width
         */
        this.componentWidth = undefined;

        /**
         *  total component height
         */
        this.componentHeight = undefined;

        /**
         *  renderer aspect ratio
         */
        this.componentHeight = undefined;

        this.createRenderer();
    }

    /**
     * update canvas dimensions when resized
     * @private
     */
    resize() {
        const bounds = this.getBoundingClientRect();
        if (bounds.width === 0 || bounds.height === 0) {
            return;
        }

        this.componentWidth = bounds.width;
        this.componentHeight = bounds.height;
        let renderWidth = bounds.width;
        let renderHeight = bounds.height;
        const componentAspectRatio = bounds.width / bounds.height;

        // calculate letterbox borders
        if (componentAspectRatio < this.renderer.aspectRatio) {
            renderHeight = bounds.width / this.renderer.aspectRatio;
            this.letterBoxTop = bounds.height / 2 - renderHeight / 2;
            this.letterBoxLeft = 0;
        } else if (componentAspectRatio > this.renderer.aspectRatio) {
            renderWidth = bounds.height * this.renderer.aspectRatio;
            this.letterBoxLeft = bounds.width/2 - renderWidth / 2;
            this.letterBoxTop = 0;
        } else {
            this.letterBoxTop = 0;
            this.letterBoxLeft = 0;
        }

        this.visibleRect.x = this.letterBoxLeft;
        this.visibleRect.y = this.letterBoxTop;
        this.visibleRect.width = renderWidth;
        this.visibleRect.height = renderHeight;
    };


    connectedCallback() {
        if (this.hasAttribute('noshadow')) {
            this.domRoot = this;
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case 'shapetype':
                if (this.renderer.rendererType !== newValue) {
                    this.createRenderer(this.renderer.inputSource);
                    this.render();
                }
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

    createRendererOptions() {
        const opts = {};
        if (this.hasAttribute('distance')) {
            opts.distanceBetween = Number(this.getAttribute('distance'));
        }
        return opts;
    }

    createRenderer(input) {
        const opts = { renderer: this.constructor.rendererType };
        if (this.hasAttribute('distance')) {
            opts.distanceBetween = Number(this.getAttribute('distance'));
        }
        const type = this.hasAttribute('shapetype') ? this.getAttribute('shapetype') : 'circles';
        this.renderer = RendererFactory(type, this.createRendererOptions(), input);
    }
}
