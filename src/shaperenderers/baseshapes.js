import {Mean, Round } from '../math';

export default class BaseShapes {
    static get DEFAULT_DISTANCE() { return 7 };

    static get DEFAULT_RENDERER() { return 'svgpath' };

    get rendererType() {
        return this.constructor.ShapeName;
    }

    /**
     * set distance between shapes
     * can be done after initializing, unlike the constructor options
     * @param val
     */
    set distanceBetween(val) {
        this.opts.distanceBetween = val;
        if (this.inputSource) {
            this.init();
        }
    }

    get distanceBetween() {
        return this.opts.distanceBetween;
    }

    /**
     * @param options - optional config options
     * @param inputimage - optional ImageElement to use when not wanting to load by URL
     */
    constructor(options, inputimage) {
        /**
         * dots array
         */
        this.dots = [];

        /**
         * buckets array
         */
        this.buckets = [];

        /**
         * input image
         */
        this.inputSource = undefined;

        /**
         * output canvas (if canvas/bitmap rendering)
         */
        this.outputCanvas = options.outputCanvas ? options.outputCanvas : undefined

        /**
         * buffer canvas for retrieving image data
         */
        this.buffer = document.createElement('canvas');

        /**
         * buffer canvas context for retrieving image data
         */
        this.bufferContext = undefined;

        /**
         * output canvas context
         */
        this.outputCanvasContext = undefined;

        /**
         * input image data
         */
        this.inputData = undefined;

        /**
         * width of image
         */
        this.width = undefined;

        /**
         * height of image
         */
        this.height = undefined;

        /**
         * benchmarking checkpoints and times
         * @type {*[]}
         */
        this.benchmarking = [];

        /**
         * render options
         */
        this.opts = options || {};

        if (this.opts.distanceBetween === undefined) {
            this.opts.distanceBetween = BaseShapes.DEFAULT_DISTANCE;
        }

        if (this.opts.renderer === undefined) {
            this.opts.renderer = BaseShapes.DEFAULT_RENDERER;
        }

        // Any extra constructor setup from derived classes
        this.preInit();

        if (inputimage) {
            this.input = inputimage;
        }
    }

    get isSourceReady() {
        if (!this.width) {
            return false;
        }

        if (!this.height) {
            return false;
        }
        return true;
    }

    preInit() {}

    /**
     * load image by URL
     * @param url
     * @return {Promise<unknown>}
     */
    async loadImage(url) {
        return new Promise( (resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', e => {
                this.input = image;
                resolve();
            });
            image.src = url;
        });
    }

    /**
     * set input image directly
     * @param src
     */
    set input(src) {
        this.inputSource = src;
        this.width = this.inputSource.width | this.inputSource.videoWidth;
        this.height = this.inputSource.height | this.inputSource.videoHeight;
        if (this.isSourceReady) {
            this.init();
        }
    }


    /**
     * process pixels from image
     */
    processPixels() {}

    /**
     * calculate radius? Is this what R is?
     * @param wantRate
     */
    calculateR(wantRate) {}

    /**
     * render SVG shape
     * @param cx
     * @param cy
     * @param r
     */
    renderSVGShape(cx, cy, r) {}

    /**
     * render bitmap shape
     * @param cx
     * @param cy
     * @param r
     */
    renderBitmapShape(cx, cy, r) {}

    /**
     * organize pixels into buckets
     * @param x
     * @param y
     */
    pushToBucket(x, y) {
        this.dots.push({ x, y });
        const xx = Math.ceil(x / 10);
        const yy = Math.ceil(y / 10);
        this.buckets[xx] = this.buckets[xx] || [];
        this.buckets[xx][yy] = this.buckets[xx][yy] || [];
        this.buckets[xx][yy].push({ x, y, i: this.dots.length - 1 });
    }

    /**
     * precalc and initialize some constants
     */
    init() {
        let benchmark;
        if (this.opts.benchmark) {
            benchmark = { start: Date.now(), title: 'initialization'}
        }
        this.dots = [];
        this.buckets = [];
        this.m = Math.max(this.width, this.height);
        this.div = Math.max(1, this.m / 1000);
        this.scale = this.opts.distanceBetween / 3;
        this.W = Math.round(this.width / this.div / this.scale);
        this.H = Math.round(this.height / this.div / this.scale);
        this.A = this.opts.distanceBetween / this.scale;
        this.aspectRatio = this.width / this.height;

        this.buffer.width = this.W;
        this.buffer.height = this.H;
        this.bufferContext = this.buffer.getContext('2d');
        this.bufferContext.drawImage(this.inputSource, 0, 0, this.W, this.H);
        this.inputData = this.bufferContext.getImageData(0, 0, this.W, this.H).data;

        if (this.opts.renderer === 'canvas') {
            this.setCanvasOutputSize(this.opts.outputSize ? this.opts.outputSize.width : this.width,this.opts.outputSize? this.opts.outputSize.height : this.height);
        }

        if (benchmark) {
            benchmark.end = Date.now();
            this.benchmarking.push(benchmark);
            benchmark = { start: Date.now(), title: 'process'}
        }
        this.processPixels();

        if (benchmark) {
            benchmark.end = Date.now();
            this.benchmarking.push(benchmark);
        }
    }

    setCanvasOutputSize(w, h) {
        this.opts.outputSize = { width: w, height: h };
        if (!this.outputCanvas) {
            this.outputCanvas = document.createElement('canvas');
        }
        this.outputCanvas.width = w;
        this.outputCanvas.height = h;
        this.outputCanvasContext = this.outputCanvas.getContext('2d');
    }

    render(refreshImage = false) {
        if (refreshImage) {
            // re-read image source without having to do initialization work or resize
            // intended for video sources where nothing changes except the image in the frame
            this.dots = [];
            this.buckets = [];
            this.bufferContext.drawImage(this.inputSource, 0, 0, this.W, this.H);
            this.inputData = this.bufferContext.getImageData(0, 0, this.W, this.H).data;
            this.processPixels();
        }

        let benchmark;
        if (this.opts.benchmark) {
            benchmark = { start: Date.now(), title: 'calculate' };
        }

        for (let y = 0; y < this.H; y++) {
            for (let x = 0; x < this.W; x++) {
                const i = y * (this.W * 4) + x * 4;
                let closest = Infinity;
                let theDot;
                const X = Math.ceil(x / 10);
                const Y = Math.ceil(y / 10);
                const theDots = [].concat(
                    this.buckets[X][Y] || [],
                    this.buckets[X][Y - 1] || [],
                    this.buckets[X][Y + 1] || [],
                    this.buckets[X - 1] ? this.buckets[X - 1][Y] || [] : [],
                    this.buckets[X - 1] ? this.buckets[X - 1][Y - 1] || [] : [],
                    this.buckets[X - 1] ? this.buckets[X - 1][Y + 1] || [] : [],
                    this.buckets[X + 1] ? this.buckets[X + 1][Y] || [] : [],
                    this.buckets[X + 1] ? this.buckets[X + 1][Y - 1] || [] : [],
                    this.buckets[X + 1] ? this.buckets[X + 1][Y + 1] || [] : []
                );
                theDots.forEach(dot => {
                    const d = (dot.x - x) ** 2 + (dot.y - y) ** 2;
                    if (d < closest) {
                        closest = d;
                        theDot = this.dots[dot.i];
                    }
                });
                theDot.v = theDot.v || [];
                const green = this.inputData[i + 1] || 0;
                theDot.v.push(this.opts.inverse ? green : 255 - green);
            }
        }

        if (benchmark) {
            benchmark.end = Date.now();
            this.benchmarking.push(benchmark);
            benchmark = { start: Date.now(), title: 'render' }
        }

        let output;
        switch (this.opts.renderer) {
            case 'svgpath':
                output = this.renderSVGPath();
                break;

            case 'svg':
                const svg = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
                svg.setAttribute('width', this.width);
                svg.setAttribute('height', this.height);
                svg.innerHTML = `<path d="${this.renderSVGPath()}"></path>`;
                output = svg;
                break;

            case 'canvas':
                this.renderBitmap();
                output = this.outputCanvas;
                break;

        }

        if (benchmark) {
            benchmark.end = Date.now();
            this.benchmarking.push(benchmark);
            this.logPerformance();
        }

        return output;
    }

    renderSVGPath() {
        const outputScaling = { x: this.width / ( this.W * this.scale ), y: this.height / ( this.H * this.scale) };
        const path = [];
        this.dots.forEach(dot => {
            if (!dot.v) {
                return;
            }
            const wantRate = Mean(dot.v) / 255;
            let r = this.calculateR(wantRate);
            const cx = dot.x * this.scale * outputScaling.x;
            const cy = dot.y * this.scale * outputScaling.y;
            r = Round(r * this.scale) * outputScaling.x;
            path.push(this.renderSVGShape(cx, cy, r));
        });
        return path.join('');
    }

    renderBitmap() {
        const outputScaling = { x: this.outputCanvas.width / ( this.W * this.scale ), y: this.outputCanvas.height / ( this.H * this.scale) };
        this.dots.forEach(dot => {
            if (!dot.v) {
                return;
            }
            const wantRate = Mean(dot.v) / 255;
            let r = this.calculateR(wantRate);
            const cx = dot.x * this.scale * outputScaling.x;
            const cy = dot.y * this.scale * outputScaling.y;
            r = Round(r * this.scale) * outputScaling.x;
            this.renderBitmapShape(cx, cy, r);
        });
    }

    logPerformance() {
        let ttltime = 0;
        this.benchmarking.forEach( task => {
            const time = task.end - task.start;
            ttltime += time;
            console.log(` - ${task.title} : ${time}ms`);
        });
        console.log(` Total time: ${ttltime} ms`);
        this.benchmarking = [];
    }

    clearBenchmarks() {
        this.benchmarking = [];
    }
}
