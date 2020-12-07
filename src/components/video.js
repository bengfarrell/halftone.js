import MediaEvents from '../playereventtypes.js';

export default class Video extends HTMLElement {
    static get PLAY_STATUS_CHANGED() { return 'status'; }

    static get TIME_UPDATE() { return 'timeupdate'; }

    static get METADATA() { return 'metadata'; }

    static get isMediaSource() { return true; }

    static get observedAttributes() {
        return ['camera', 'source']
    }

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

        this.attachShadow( { mode: 'open' } );
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: none;
                    overflow: hidden;
                }
                
                :host(.connected) {
                    display: inline-block;
                }
                
                video {
                    position: relative;
                }
            </style>
            <video playsinline></video>`;

        this.videoEl = this.shadowRoot.querySelector('video');
        this.playing = false;

        this.videoEl.onloadedmetadata = event => this.onMetadata(event);
        this.videoEl.onloadeddata = () => {
            if (this.hasAttribute('autoplay') || this.hasAttribute('camera')) {
                this.play();
            }
        };

        this.videoEl.onpause = () => {
            this.playing = false;
            clearInterval(this.timer);
            const ce = new CustomEvent(this.PLAY_STATUS_CHANGED, {
                detail: { playing: this.playing, video: this.videoEl, player: this },
                bubbles: true, composed: true });
            this.dispatchEvent(ce);
        }

        this.videoEl.onended = event => this.onEnded(event);

        this.videoEl.onplaying = () => {
            this.playing = true;
            clearInterval(this.timer);
            this.timer = setInterval( () => {
                const ce = new CustomEvent(this.TIME_UPDATE, {
                    detail: { time: this.currentTime, video: this.videoEl, player: this },
                    bubbles: true, composed: true });
                this.dispatchEvent(ce);
            }, 100);
            const ce = new CustomEvent(this.PLAY_STATUS_CHANGED, {
                detail: { playing: this.playing, video: this.videoEl, player: this },
                bubbles: true, composed: true });
            this.dispatchEvent(ce);
        }
    }

    get currentSource() {
        if (this.hasAttribute('camera')) {
            return 'camera';
        }
        return this.getAttribute('source');
    }

    set currentSource(val) {
        this.videoEl.src = val;
    }

    onMetadata() {
        this.aspectRatio = this.videoEl.videoWidth / this.videoEl.videoHeight;
        this.resize();
        const ce = new CustomEvent(MediaEvents.METADATA, {
            detail: {
                player: this,
                playing: this.playing,
                duration: this.videoEl.duration,
                video: this.videoEl
            },
            bubbles: true, composed: true });
        this.dispatchEvent(ce);
    }

    connectedCallback() {
        this._connected = true;
    }

    async loadCurrentSource() {
        let sourceChange = false;
        if (this.hasAttribute('source')) {
            this.videoEl.srcObject = null;
            this.videoEl.src = this.getAttribute('source');

            if (this._stream) {
                this._stream.getTracks()[0].stop();
                this._stream = null;
            }
            sourceChange = true;
        }

        if (this.hasAttribute('camera')) {
            this._stream = await navigator.mediaDevices.getUserMedia({
                'audio': true,
                'video': {
                    width: this.width,
                    height: this.height,
                },
            });
            this.videoEl.srcObject = this._stream;
            this.videoEl.muted = true;
            sourceChange = true;
        } else if (!this.hasAttribute('camera') && this.videoEl.srcObject) {
            this.videoEl.srcObject = null;
            if (this._stream) {
                this._stream.getTracks()[0].stop();
                this._stream = null;
            }
            sourceChange = true;
        }

        if (sourceChange) {
            const ce = new CustomEvent(MediaEvents.PLAY_STATUS_CHANGED, {
                detail: { playing: this.playing, video: this.videoEl, sourceChanged: true, player: this },
                bubbles: true, composed: true });
            this.dispatchEvent(ce);
        }
    }

    async attributeChangedCallback(name, oldval, newval) {
        switch (name) {
            case 'source':
                if (newval !== oldval && this._connected && !this.hasAttribute('camera')) {
                    this.loadCurrentSource();
                }
                break;
            case 'camera':
                if (this._connected) {
                    this.loadCurrentSource()
                }
                break;
            default:
                break;
        }
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
}

if (!customElements.get('paper-video')) {
    customElements.define('paper-video', Video);
}
