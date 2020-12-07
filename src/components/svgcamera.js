import { BaseHalftoneElement } from './basecomponent.js';

export class HalftoneSVGCamera extends BaseHalftoneElement {

    get naturalSize() {
        return {
            width: this.videoEl.videoWidth,
            height: this.videoEl.videoHeight
        };
    }

    constructor() {
        super();

        /**
         * width of component
         * @type {int}
         * @default 0
         */
        this.width = 0;

        /**
         * height of component
         * @type {int}
         * @default 0
         */
        this.height = 0;

        /**
         * left offset for letterbox of video
         * @type {int}
         * @default 0
         */
        this.letterBoxLeft = 0;

        /**
         * top offset for letterbox of video
         * @type {int}
         * @default 0
         */
        this.letterBoxTop = 0;

        /**
         * aspect ratio of video
         * @type {number}
         */
        this.aspectRatio = 0;

        /**
         * visible area bounding box
         * whether letterboxed or cropped, will report visible video area
         * does not include positioning in element, so if letterboxing, x and y will be reported as 0
         * @type {{x: number, y: number, width: number, height: number}}
         */
        this.visibleMediaRect = { x: 0, y: 0, width: 0, height: 0 };


        this.videoEl = document.createElement('video');
        this.videoEl.width = 640;
        this.videoEl.height = 480;

        this.svgEl = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
        this.videoEl.onloadedmetadata = event => this.onMetadata(event);
        this.videoEl.onplaying = () => {
            this.createRenderer(this.videoEl);
            this.renderer.init();
            setInterval( () => {
                this.render();
            }, 100);
        }
    }

    onMetadata() {
        this.aspectRatio = this.videoEl.videoWidth / this.videoEl.videoHeight;
        this.svgEl.setAttribute('width', this.videoEl.videoWidth);
        this.svgEl.setAttribute('height', this.videoEl.videoHeight);
        // this.resize();
    }

    connectedCallback() {
        super.connectedCallback();
        this.domRoot.appendChild(this.svgEl);
        this.startCamera();
    }

    render() {
        if (this.renderer) {
            this.svgEl.innerHTML = `<g transform="scale(1, 1)">
                                        <path d="${this.renderer.render(true)}"></path>
                                    </g></svg>`;
        }
    }

    async startCamera() {
        this._stream = await navigator.mediaDevices.getUserMedia({
            'audio': false,
            'video': {
                width: this.width,
                height: this.height,
            },
        });
        this.videoEl.srcObject = this._stream;
        this.videoEl.play();
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

        this.mediaScaledWidth = bounds.width;
        this.mediaScaledHeight = bounds.height;
        const componentAspectRatio = bounds.width/bounds.height;

        // calculate letterbox borders
        if (componentAspectRatio < this.aspectRatio) {
            this.mediaScaledHeight = bounds.width / this.aspectRatio;
            this.letterBoxTop = bounds.height/2 - this.mediaScaledHeight/2;
            this.letterBoxLeft = 0;
        } else if (componentAspectRatio > this.aspectRatio) {
            this.mediaScaledWidth = bounds.height * this.aspectRatio;
            this.letterBoxLeft = bounds.width/2 - this.mediaScaledWidth/2;
            this.letterBoxTop = 0;
        } else {
            this.letterBoxTop = 0;
            this.letterBoxLeft = 0;
        }

        this.visibleMediaRect.x = this.letterBoxLeft;
        this.visibleMediaRect.y = this.letterBoxTop;
        this.visibleMediaRect.width = this.mediaScaledWidth;
        this.visibleMediaRect.height = this.mediaScaledHeight;

        // set video to component size
        this.videoEl.setAttribute('width', this.mediaScaledWidth);
        this.videoEl.setAttribute('height', this.mediaScaledHeight);
        this.videoEl.style.left = `${this.letterBoxLeft}px`;
        this.videoEl.style.top = `${this.letterBoxTop}px`;
    };

    disconnectedCallback() {
        clearInterval(this.timer);
        this._connected = false;
        if (this._stream) {
            const tracks = this._stream.getTracks();
            tracks.forEach( track => {
                track.stop();
            });
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue);
        switch (name) {
            case 'backgroundcolor': {
                if (this.svgEl) {
                    this.svgEl.style.backgroundColor = newValue;
                }
                break;
            }

            case 'shapecolor': {
                if (this.svgEl) {
                    this.svgEl.style.fill = newValue;
                }
                break;
            }
        }
    }

    createRendererOptions() {
        const opts = super.createRendererOptions();
        opts.inputSource = this.videoEl;
        opts.renderer = 'svgpath';
        return opts;
    }
}

if (!customElements.get('halftone-svg-camera')) {
    customElements.define('halftone-svg-camera', HalftoneSVGCamera);
}
