import { RendererFactory, RenderShapeTypes } from '../rendererfactory';

export class BaseHalftoneElement extends HTMLElement {
    static get RenderShapeTypes() { return RenderShapeTypes }

    static get observedAttributes() { return [
        'src',
        'shapetype',
        'distance',
        'crossbarlength',
        'shapecolor',
        'refreshrate',
        'blendmode' ];
    }

    loadImage(uri) {
        this.inputSource = new Image();
        this.inputSource.crossOrigin = 'anonymous';
        this.inputSource.addEventListener('load', e => {
            if (this.renderer) {
                this.renderer.input = this.inputSource;
                this.resize();
                this.render();
            }
        });
        this.inputSource.src = uri;
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
        this.style.position = 'relative';
        this.style.display = 'inline-block';

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

        /**
         * slot for inserting a background layer sized to the rendered halftone
         */
        this.backgroundSlot = undefined;

        /**
         * surface for halftone rendering
         */
        this.halftoneSurface = undefined;

        /**
         * refresh rate for input sources that change (like video)
         */
        this.refreshRate = 150;

        this.createBackgroundSlot();
        this.createRenderer();

        if (this.getAttribute('src')) {
            const source = this.getAttribute('src');
            if (source === 'camera') {
                this.startCamera();
            } else {
                this.loadImage(source);
            }
        }
    }

    get renderSurface() {
        return this.halftoneSurface;
    }

    get contentWidth() {
        return this.visibleRect.width;
    }

    get contentHeight() {
        return this.visibleRect.height;
    }

    /**
     * update canvas dimensions when resized
     * @return modified
     */
    resize() {
        const bounds = this.getBoundingClientRect();
        if (bounds.width === 0 || bounds.height === 0) {
            return false;
        }

        if (bounds.width === this.componentWidth &&
            bounds.height === this.componentHeight &&
            this.sourceAspectRatio === this.renderer.aspectRatio) {
            return false;
        }

        this.componentWidth = bounds.width;
        this.componentHeight = bounds.height;
        let renderWidth = bounds.width;
        let renderHeight = bounds.height;
        const componentAspectRatio = bounds.width / bounds.height;
        this.sourceAspectRatio = this.renderer.aspectRatio;

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

        this.backgroundSlot.style.width = `${this.visibleRect.width}px`;
        this.backgroundSlot.style.height = `${this.visibleRect.height}px`;
        this.backgroundSlot.style.top = `${this.visibleRect.y}px`;
        this.backgroundSlot.style.left = `${this.visibleRect.x}px`;

        this.halftoneSurface.style.top = this.visibleRect.y + 'px';
        this.halftoneSurface.style.left = this.visibleRect.x + 'px';
        this.halftoneSurface.style.width = this.visibleRect.width + 'px';
        this.halftoneSurface.style.height = this.visibleRect.height + 'px';
        return true;
    };

    connectedCallback() {
        if (this.hasAttribute('noshadow')) {
            this.domRoot = this;
        }

        this.domRoot.appendChild(this.backgroundSlot);
        this.resize();
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

            case 'src':
                this.cleanup();
                if (newValue === 'camera') {
                    this.startCamera();
                } else {
                    this.loadImage(newValue);
                }
                break;

            case 'blendmode':
                this.halftoneSurface.style['mix-blend-mode'] = newValue;
                break;

            case 'refreshrate':
                this.refreshRate = newValue;
                if (this._timer) {
                    clearInterval(this._timer);
                    this._timer = setInterval( () => {
                        this.render();
                    }, this.refreshRate);
                }
        }
    }

    render() {}

    async startCamera() {
        this.inputSource = document.createElement('video');
        this._stream = await navigator.mediaDevices.getUserMedia({
            'audio': false,
            'video': {
                width: this.width,
                height: this.height,
            },
        });

        this.inputSource.onloadedmetadata = event => {
            this.renderer.input = this.inputSource;
            this.resize();
        }

        this.inputSource.onplaying = () => {
            this._timer = setInterval( () => {
                this.render();
            }, this.refreshRate);
        }

        this.inputSource.srcObject = this._stream;
        this.inputSource.play();
    }

    createRendererOptions() {
        const opts = { inputSource: this.inputSource };
        if (this.hasAttribute('benchmark')) {
            opts.benchmark = true;
        }
        if (this.hasAttribute('distance')) {
            opts.distanceBetween = Number(this.getAttribute('distance'));
        }
        return opts;
    }

    createRenderer(input) {
        const type = this.hasAttribute('shapetype') ? this.getAttribute('shapetype') : 'circles';
        this.renderer = RendererFactory(type, this.createRendererOptions(), input);
    }

    createBackgroundSlot() {
        this.backgroundSlot = document.createElement('slot');
        this.backgroundSlot.style.position = 'absolute';
        this.backgroundSlot.style.display = 'inline-block';
    }

    cleanup() {
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = undefined;
        }
        if (this._stream) {
            const tracks = this._stream.getTracks();
            tracks.forEach( track => {
                track.stop();
            });
            this._stream = undefined;
        }
    }
}
