import {Mean, Round } from '../math.js';

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
        this.inputSource = inputimage;

        /**
         * output canvas (if canvas/bitmap rendering)
         */
        this.outputCanvas = options.outputCanvas ? options.outputCanvas : undefined;

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

        if (this.inputSource) {
            this.init();
        }
    }

    /**
     * load image by URL
     * @param url
     * @return {Promise<unknown>}
     */
    async loadURL(url) {
        return new Promise( (resolve, reject) => {
            this.inputSource = new Image();
            this.inputSource.addEventListener('load', e => {
                this.init();
                resolve();
            });
            this.inputSource.src = url;
        });
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
        this.w = this.inputSource.width;
        this.h = this.inputSource.height;
        this.m = Math.max(this.w, this.h);
        this.div = Math.max(1, this.m / 1000);
        this.scale = this.opts.distanceBetween / 3;
        this.W = Math.round(this.w / this.div / this.scale);
        this.H = Math.round(this.h / this.div / this.scale);
        this.A = this.opts.distanceBetween / this.scale;

        const c = document.createElement('canvas');
        c.width = this.W;
        c.height = this.H;
        const ctx = c.getContext('2d');
        ctx.drawImage(this.inputSource, 0, 0, this.W, this.H);
        this.inputData = ctx.getImageData(0, 0, this.W, this.H).data;

        this.width = this.inputSource.width;
        this.height = this.inputSource.height;

        if (this.opts.renderer === 'canvas') {
            if (!this.outputCanvas) {
                this.outputCanvas = document.createElement('canvas');
            }
            this.outputCanvas.width = this.w;
            this.outputCanvas.height = this.h;
            this.outputCanvasContext = this.outputCanvas.getContext('2d');
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

    render() {
        let benchmark;
        if (this.opts.benchmark) {
            benchmark = { start: Date.now(), title: 'render' };
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
            benchmark = { start: Date.now(), title: 'output' }
        }

        let output;
        switch (this.opts.renderer) {
            case 'svgpath':
                output = this.renderSVGPath();
                break;

            case 'svg':
                const svg = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
                svg.setAttribute('width', this.w);
                svg.setAttribute('height', this.h);
                svg.innerHTML = `<g transform="scale(1.9, 1.9)"><path d="${this.renderSVGPath()}"></path></g>`;
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
        const path = [];
        this.dots.forEach(dot => {
            if (!dot.v) {
                return;
            }
            const wantRate = Mean(dot.v) / 255;
            let r = this.calculateR(wantRate);
            const cx = dot.x * this.scale;
            const cy = dot.y * this.scale;
            r = Round(r * this.scale);
            path.push(this.renderSVGShape(cx, cy, r));
        });
        return path.join('');
    }

    renderBitmap() {
        this.dots.forEach(dot => {
            if (!dot.v) {
                return;
            }
            const wantRate = Mean(dot.v) / 255;
            let r = this.calculateR(wantRate);
            const cx = dot.x * this.scale;
            const cy = dot.y * this.scale;
            r = Round(r * this.scale);
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
