/** get mean value */
const Mean = array => array.reduce((a, b) => a + b) / array.length;

/** round value */
const Round = num => Math.round(num * 1e4) / 1e4;

/** pre calculated square root of 2 */
const SquareRootOfTwo = Math.sqrt(2);

/** pre calculated square root of 3 */
const SquareRootOfThree = Math.sqrt(3);

class BaseShapes {
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
        this.outputCanvas = options.outputCanvas ? options.outputCanvas : undefined;

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

        return this.inputSource.complete;
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
        this.width = this.inputSource.width;
        this.height = this.inputSource.height;

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
            benchmark = { start: Date.now(), title: 'initialization'};
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
        this.aspectRatio = this.width / this.height;

        this.buffer.width = this.W;
        this.buffer.height = this.H;
        this.bufferContext = this.buffer.getContext('2d');
        this.bufferContext.drawImage(this.inputSource, 0, 0, this.W, this.H);
        this.inputData = this.bufferContext.getImageData(0, 0, this.W, this.H).data;

        if (this.opts.renderer === 'canvas') {
            this.setCanvasOutputSize(this.opts.outputSize.width || this.w,this.opts.outputSize.height || this.h);
        }

        if (benchmark) {
            benchmark.end = Date.now();
            this.benchmarking.push(benchmark);
            benchmark = { start: Date.now(), title: 'process'};
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
            benchmark = { start: Date.now(), title: 'output' };
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
        const outputScaling = { x: this.w / ( this.W * this.scale ), y: this.h / ( this.H * this.scale) };
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

// Bitmap Square Primitive

const SQUARE = (ctx, cx, cy, r) => {
    ctx.beginPath();
    ctx.rect(cx - r / 2, cy  - r / 2, r , r );
    ctx.fill();
};

// Bitmap Circle Primitive
const CIRCLE = (ctx, cx, cy, r) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.fill();
};

// Bitmap Triangle Primitive
const TRIANGLE = (ctx, cx, cy, r, flipped) => {
    const aa = (r / 3) * 2;
    ctx.beginPath();

    let startX = cx;
    let startY = cy + flipped * aa;
    let currX = startX;
    let currY = startY;
    ctx.moveTo(currX, currY);

    currX += (-aa * SquareRootOfThree) / 2;
    currY += (flipped * -aa / 2) * 3;
    ctx.lineTo(currX, currY);

    currX += aa * SquareRootOfThree;
    ctx.lineTo(currX, currY);
    ctx.lineTo(startX, startY);
    ctx.fill();
};

// Bitmap Diamond Primitive
const DIAMOND = (ctx, cx, cy, r) => {
    const r2 = r /= SquareRootOfTwo;
    ctx.beginPath();

    let startX = cx;
    let startY = cy - r2 / 2;
    let currX = startX;
    let currY = startY;
    ctx.moveTo(currX, currY);

    currX += r2;
    currY += r2;
    ctx.lineTo(currX, currY);

    currX += -r2;
    currY += r2;
    ctx.lineTo(currX, currY);

    currX += -r2;
    currY += -r2;
    ctx.lineTo(currX, currY);

    ctx.lineTo(startX, startY);
    ctx.fill();
};

// Bitmap Hexagon Primitive
const HEXAGON = (ctx, cx, cy, r) => {
    const r2 = r / 2;
    const r23 = r2 * SquareRootOfThree;
    ctx.beginPath();

    let startX = cx;
    let startY = cy - r;
    let currX = startX;
    let currY = startY;
    ctx.moveTo(currX, currY);

    currX += r23;
    currY += r2;
    ctx.lineTo(currX, currY);

    currY += r;
    ctx.lineTo(currX, currY);

    currX += -r23;
    currY += r2;
    ctx.lineTo(currX, currY);

    currX += -r23;
    currY += -r2;
    ctx.lineTo(currX, currY);

    currY += -r;
    ctx.lineTo(currX, currY);

    ctx.lineTo(startX, startY);
    ctx.fill();
};

// Bitmap Cross Primitive
const CROSS = (ctx, cx, cy, r, b) => {
    ctx.beginPath();

    let startX = cx - r / 2;
    let startY = cy - b - r / 2;
    let currX = startX;
    let currY = startY;
    ctx.moveTo(currX, currY);

    currX += r;
    ctx.lineTo(currX, currY);

    currY += b;
    ctx.lineTo(currX, currY);

    currX += b;
    ctx.lineTo(currX, currY);

    currY += r;
    ctx.lineTo(currX, currY);

    currX += -b;
    ctx.lineTo(currX, currY);

    currY += b;
    ctx.lineTo(currX, currY);

    currX += -r;
    ctx.lineTo(currX, currY);

    currY += -b;
    ctx.lineTo(currX, currY);

    currX += -b;
    ctx.lineTo(currX, currY);

    currY += -r;
    ctx.lineTo(currX, currY);

    currX += b;
    ctx.lineTo(currX, currY);

    ctx.lineTo(startX, startY);
    ctx.fill();
};

// SVG Square Primitive
const SQUARE$1 = (cx, cy, r) => {
    return `M${cx - r / 2},${cy - r / 2}h${r}v${r}h${-r}z`;
};

// SVG Circle Primitive
const CIRCLE$1 = (cx, cy, r) => {
    return `M${Round(cx)},${Round(cy - r)}a${[r, r, 0, 0, 1, 0, 2 * r]}a${[
        r,
        r,
        0,
        0,
        1,
        0,
        -2 * r
    ]}z`
};

// SVG Triangle Primitive
const TRIANGLE$1 = (cx, cy, r, flipped) => {
    const aa = (r / 3) * 2;
    return `M${cx},${cy + flipped * aa}l${(-aa * SquareRootOfThree) / 2},${(flipped * -aa / 2) * 3}h${aa * SquareRootOfThree}z`;
};

// SVG Diamond Primitive
const DIAMOND$1 = (cx, cy, r) => {
    const r2 = r /= SquareRootOfTwo;
    return `M${cx},${cy - r2 / 2}l${r2},${r2},${-r2},${r2},${-r2},${-r2}z`;
};

// SVG Hexagon Primitive
const HEXAGON$1 = (cx, cy, r) => {
    const r2 = r / 2;
    const r23 = r2 * SquareRootOfThree;
    return `M${cx},${cy -
    r}l${r23},${r2}v${r}l${-r23},${r2},${-r23},${-r2}v${-r}z`;
};

// SVG Cross Primitive
const CROSS$1 = (cx, cy, r, b) => {
    return `M${cx - r / 2},${cy - b -
    r / 2}h${r}v${b}h${b}v${r}h${-b}v${b}h${-r}v${-b}h${-b}v${-r}h${b}z`
};

class Hexagons extends BaseShapes {
    static get ShapeName() { return 'hexagons'; }

    /**
     * process pixels from image
     */
    processPixels() {
        let x = 0;
        let y = 0;
        let odd = true;
        while (y < this.H) {
            this.pushToBucket(x, y);
            x += this.A;
            if (x > this.W) {
                y += (this.A / 2) * SquareRootOfThree;
                x = (this.A / 2) * odd;
                odd = !odd;
            }
        }
    }

    /**
     * calculate radius? Is this what R is?
     * @param wantRate
     */
    calculateR(wantRate) {
        return this.A * Math.sqrt(wantRate / 3);
    }

    /**
     * render bitmap shape
     * @param cx
     * @param cy
     * @param r
     */
    renderBitmapShape(cx, cy, r) {
        HEXAGON(this.outputCanvasContext, cx, cy, r);
    }

    /**
     * render SVG shape
     * @param cx
     * @param cy
     * @param r
     */
    renderSVGShape(cx, cy, r) {
        return HEXAGON$1(cx, cy, r);
    }
}

class Circles extends BaseShapes {
    static get ShapeName() { return 'circles'; }

    /**
     * process pixels from image
     */
    processPixels() {
        let x = 0;
        let y = 0;
        let odd = true;
        while (y < this.H) {
            this.pushToBucket(x, y);
            x += this.A;
            if (x > this.W) {
                y += (this.A / 2) * SquareRootOfThree;
                x = (this.A / 2) * odd;
                odd = !odd;
            }
        }
    }

    calculateR(wantRate) {
        const d = (36 * (Math.PI - 2 * SquareRootOfThree)) / (this.A ** 2 * 2 * SquareRootOfThree * (3 - 2 * SquareRootOfThree) ** 2);
        const k = (this.A ** 2 * SquareRootOfThree) / 2 / Math.PI;
        const k2 = (this.A * SquareRootOfThree) / 3;
        return wantRate < Math.PI / (2 * SquareRootOfThree)
            ? Math.sqrt(wantRate * k)
            : (2 * k2 * d +
            Math.sqrt(
                4 * k2 ** 2 * d ** 2 - 4 * d * (d * k2 ** 2 + 1 - wantRate)
            )) /
            (2 * d);
    }

    /**
     * render SVG shape
     * @param cx
     * @param cy
     * @param r
     */
    renderSVGShape(cx, cy, r) {
        return CIRCLE$1(cx, cy, r);
    }

    /**
     * render bitmap shape
     * @param cx
     * @param cy
     * @param r
     */
    renderBitmapShape(cx, cy, r) {
        CIRCLE(this.outputCanvasContext, cx, cy, r);
    }
}

class CircularDots extends BaseShapes {
    static get ShapeName() { return 'circulardots'; }

    /**
     * process pixels from image
     */
    processPixels() {
        const cx = this.W / 2;
        const cy = this.H / 2;
        const rmax = Math.hypot(cx, cy);
        let r = this.A;
        let n = 6;
        this.pushToBucket(cx, cy);
        while (r < rmax) {
            const α = (2 * Math.PI) / n;
            for (let i = 0; i < n; i++) {
                const x = cx + r * Math.cos(α * i);
                const y = cy + r * Math.sin(α * i);
                this.pushToBucket(x, y);
            }
            r += (this.A * SquareRootOfThree) / 2;
            n += 6;
        }
    }

    /**
     * calculate radius? Is this what R is?
     * @param wantRate
     */
    calculateR(wantRate) {
        const d = (36 * (Math.PI - 2 * SquareRootOfThree)) / (this.A ** 2 * 2 * SquareRootOfThree * (3 - 2 * SquareRootOfThree) ** 2);
        const k = (this.A ** 2 * SquareRootOfThree) / 2 / Math.PI;
        const k2 = (this.A * SquareRootOfThree) / 3;

        return wantRate < Math.PI / (2 * SquareRootOfThree)
                ? Math.sqrt(wantRate * k)
                : (2 * k2 * d +
                Math.sqrt(
                    4 * k2 ** 2 * d ** 2 - 4 * d * (d * k2 ** 2 + 1 - wantRate)
                )) /
                (2 * d);
    }

    /**
     * render SVG shape
     * @param cx
     * @param cy
     * @param r
     */
    renderSVGShape(cx, cy, r) {
        return CIRCLE$1(cx, cy, r);
    }

    /**
     * render bitmap shape
     * @param cx
     * @param cy
     * @param r
     */
    renderBitmapShape(cx, cy, r) {
        CIRCLE(this.outputCanvasContext, cx, cy, r);
    }
}

class SunflowerDots extends BaseShapes {
    static get ShapeName() { return 'sunflowerdots'; }

    /**
     * process pixels from image
     */
    processPixels() {
        const cx = this.W / 2;
        const cy = this.H / 2;
        this.pushToBucket(cx + this.A / 2, cy);
        const θ = Math.PI * (3 - 5 ** .5);
        let n = 0;
        let R = (this.A / 2) * n ** .5;
        let α = n * θ;
        const rmax = Math.hypot(cx, cy);
        while (R < rmax) {
            const x = cx + R * Math.cos(α);
            const y = cy + R * Math.sin(α);
            this.pushToBucket(x, y);
            n++;
            R = (this.A / 2) * n ** .5;
            α = n * θ;
        }
    }

    /**
     * calculate radius? Is this what R is?
     * @param wantRate
     */
    calculateR(wantRate) {
        const d = (36 * (Math.PI - 2 * SquareRootOfThree)) / (this.A ** 2 * 2 * SquareRootOfThree * (3 - 2 * SquareRootOfThree) ** 2);
        const k = (this.A ** 2 * SquareRootOfThree) / 2 / Math.PI;
        const k2 = (this.A * SquareRootOfThree) / 3;

        return wantRate < Math.PI / (2 * SquareRootOfThree)
            ? Math.sqrt(wantRate * k)
            : (2 * k2 * d +
            Math.sqrt(
                4 * k2 ** 2 * d ** 2 - 4 * d * (d * k2 ** 2 + 1 - wantRate)
            )) /
            (2 * d);
    }

    /**
     * render SVG shape
     * @param cx
     * @param cy
     * @param r
     */
    renderSVGShape(cx, cy, r) {
        return CIRCLE$1(cx, cy, r);
    }

    /**
     * render bitmap shape
     * @param cx
     * @param cy
     * @param r
     */
    renderBitmapShape(cx, cy, r) {
        CIRCLE(this.outputCanvasContext, cx, cy, r);
    }
}

class AltCircles extends BaseShapes {
    static get ShapeName() { return 'altcircles'; }

    /**
     * process pixels from image
     */
    processPixels() {
        let x = 0;
        let y = 0;
        while (y < this.H) {
            this.pushToBucket(x, y);
            x += this.A;
            if (x > this.W) {
                y += this.A;
                x = 0;
            }
        }
    }

    /**
     * calculate radius? Is this what R is?
     * @param wantRate
     */
    calculateR(wantRate) {
        const d3 = (Math.PI - 4) / (this.A ** 2 * (3 - 2 * SquareRootOfTwo));
        return wantRate < Math.PI / 4
                ? Math.sqrt((wantRate * this.A ** 2) / Math.PI)
                : (this.A * d3 * SquareRootOfTwo + Math.sqrt(4 * d3 * (wantRate - 1))) / (2 * d3);
    }

    /**
     * render SVG shape
     * @param cx
     * @param cy
     * @param r
     */
    renderSVGShape(cx, cy, r) {
        return CIRCLE$1(cx, cy, r);
    }

    /**
     * render bitmap shape
     * @param cx
     * @param cy
     * @param r
     */
    renderBitmapShape(cx, cy, r) {
        CIRCLE(this.outputCanvasContext, cx, cy, r);
    }
}

class Squares extends BaseShapes {
    static get ShapeName() { return 'squares'; }

    /**
     * process pixels from image
     */
    processPixels() {
        let x = 0;
        let y = 0;
        while (y < this.H) {
            this.pushToBucket(x, y);
            x += this.A;
            if (x > this.W) {
                y += this.A;
                x = 0;
            }
        }
    }

    /**
     * calculate radius? Is this what R is?
     * @param wantRate
     */
    calculateR(wantRate) {
        return this.A * Math.sqrt(wantRate);
    }

    /**
     * render bitmap shape
     * @param cx
     * @param cy
     * @param r
     */
    renderBitmapShape(cx, cy, r) {
        SQUARE(this.outputCanvasContext, cx, cy, r);
    }

    /**
     * render SVG shape
     * @param cx
     * @param cy
     * @param r
     */
    renderSVGShape(cx, cy, r) {
        return SQUARE$1(cx, cy, r);
    }
}

class Crosses extends BaseShapes {
    static get ShapeName() { return 'crosses'; }

    /**
     * set crossbar length
     * can be done after initializing, unlike the constructor options
     * @param val
     */
    set crossBarLength(val) {
        this.opts.crossBarLength = val;
        if (this.inputSource) {
            this.init();
        }
    }

    get crossBarLength() {
        return this.opts.crossBarLength
    }

    init() {
        super.init();

        if (this.opts.crossBarLength === undefined) {
            this.opts.crossBarLength = this.opts.distanceBetween / 2;
        }

        this.cbarLength = this.opts.crossBarLength / this.scale;
    }
    /**
     * process pixels from image
     */
    processPixels() {
        let x = 0;
        let y = 0;
        let odd = true;
        while (y < this.H) {
            this.pushToBucket(x, y);
            x += this.A;
            if (x > this.W) {
                y += (this.A / 4) * 3;
                x = (this.A / 2) * odd;
                odd = !odd;
            }
        }
    }

    /**
     * calculate radius? Is this what R is?
     * @param wantRate
     */
    calculateR(wantRate) {
        return (this.A *
            Math.sqrt(
                this.cbarLength ** 2 + 2.25 * this.A ** 2 * wantRate - 3 * this.A * this.cbarLength * wantRate
            ) -
            this.A * this.cbarLength) /
            (3 * this.A - 4 * this.cbarLength);
    }

    /**
     * render bitmap shape
     * @param cx
     * @param cy
     * @param r
     */
    renderBitmapShape(cx, cy, r) {
        const a = Round(this.A * this.scale);
        const c = Round(this.cbarLength * this.scale);
        const b = (r * (a - c)) / a + (c - r) / 2;
        CROSS(this.outputCanvasContext, cx, cy, r, b);
    }

    /**
     * render SVG shape
     * @param cx
     * @param cy
     * @param r
     */
    renderSVGShape(cx, cy, r) {
        const a = Round(this.A * this.scale);
        const c = Round(this.cbarLength * this.scale);
        const b = (r * (a - c)) / a + (c - r) / 2;
        return CROSS$1(cx, cy, r, b);
    }
}

class Triangles extends BaseShapes {
    static get ShapeName() { return 'triangles'; }

    preInit() {
        this.processRow = true;
        this.processCol = true;
        this.outputRow = -1;
        this.outputCol = -1;
    }

    /**
     * process pixels from image
     */
    processPixels() {
        let x = 0;
        let y = 0;
        this.processRow = true;
        this.processCol = true;
        let Y = y;
        while (y < this.H) {
            this.pushToBucket(x, y);
            x += (this.A * SquareRootOfThree) / 2;
            y = y + (this.A / 2) * (this.processCol ? -1 : 1);
            this.processCol = !this.processCol;
            if (x > this.W) {
                y = Y + this.A * (this.processRow ? 1 : 2);
                Y = y;
                x = 0;
                this.processRow = !this.processRow;
                this.processCol = this.processRow;
            }
        }
    }

    /**
     * calculate radius? Is this what R is?
     * @param wantRate
     */
    calculateR(wantRate) {
        return (3 / 2) * this.A * Math.sqrt(wantRate);
    }

    /**
     * render SVG shape
     * @param cx
     * @param cy
     * @param r
     */
    renderSVGShape(cx, cy, r) {
        return this.renderCommonShape('svg', cx, cy, r);
    }

    /**
     * render bitmap shape
     * @param cx
     * @param cy
     * @param r
     */
    renderBitmapShape(cx, cy, r) {
        this.renderCommonShape('bitmap', cx, cy, r);
    }

    renderCommonShape(type, cx, cy, r) {
        if (!cx) {
            this.outputRow++;
            this.outputCol = -1;
        }
        this.outputCol ++;
        if ((this.outputCol + this.outputRow) % 2) {
            if (type === 'svg') {
                return TRIANGLE$1(cx, cy, r, 1);
            } else {
                TRIANGLE(this.outputCanvasContext, cx, cy, r, 1);
            }
        } else {
            if (type === 'svg') {
                return TRIANGLE$1(cx, cy, r, -1);
            } else {
                TRIANGLE(this.outputCanvasContext, cx, cy, r, -1);
            }
        }
    }
}

class AltTriangles extends BaseShapes {
    static get ShapeName() { return 'alttriangles'; }

    preInit() {
        this.processRow = true;
        this.processCol = true;
        this.outputRow = -1;
        this.outputCol = -1;
    }

    /**
     * process pixels from image
     */
    processPixels() {
        let x = 0;
        let y = 0;
        this.processCol = true;
        let Y = y;
        while (y < this.H) {
            this.pushToBucket(x, y);
            x += (this.A * SquareRootOfThree) / 2;
            y = y + (this.A / 2) * (this.processCol ? -1 : 1);
            this.processCol = !this.processCol;
            if (x > this.W) {
                y = Y + this.A * 1.5;
                Y = y;
                x = 0;
                this.processCol = true;
            }
        }
    }

    /**
     * calculate radius? Is this what R is?
     * @param wantRate
     */
    calculateR(wantRate) {
        return (3 / 2) * this.A * Math.sqrt(wantRate);
    }

    /**
     * render SVG shape
     * @param cx
     * @param cy
     * @param r
     */
    renderSVGShape(cx, cy, r) {
        return this.renderCommonShape('svg', cx, cy, r);
    }

    /**
     * render bitmap shape
     * @param cx
     * @param cy
     * @param r
     */
    renderBitmapShape(cx, cy, r) {
        this.renderCommonShape('bitmap', cx, cy, r);
    }

    /**
     * render SVG shape
     * @param cx
     * @param cy
     * @param r
     */
    renderCommonShape(type, cx, cy, r) {
        if (!cx) {
            this.outputRow++;
            this.outputCol = -1;
        }
        this.outputCol++;
        if (this.outputCol % 2) {
            if (type === 'svg') {
                return TRIANGLE$1(cx, cy, r, 1);
            } else {
                TRIANGLE(this.outputCanvasContext, cx, cy, r, 1);
            }
        } else {
            if (type === 'svg') {
                return TRIANGLE$1(cx, cy, r, -1);
            } else {
                TRIANGLE(this.outputCanvasContext, cx, cy, r, -1);
            }
        }
    }
}

class Diamonds extends BaseShapes {
    static get ShapeName() { return 'diamonds'; }

    /**
     * process pixels from image
     */
    processPixels() {
        let x = 0;
        let y = 0;
        let odd = true;
        while (y < this.H) {
            this.pushToBucket(x, y);
            x += this.A * SquareRootOfTwo;
            if (x > this.W) {
                y += this.A / SquareRootOfTwo;
                x = odd ? this.A / SquareRootOfTwo : 0;
                odd = !odd;
            }
        }
    }

    /**
     * calculate radius? Is this what R is?
     * @param wantRate
     */
    calculateR(wantRate) {
        return this.A * Math.sqrt( wantRate );
    }

    /**
     * render SVG shape
     * @param cx
     * @param cy
     * @param r
     */
    renderSVGShape(cx, cy, r) {
        return DIAMOND$1(cx, cy, r);
    }

    /**
     * render bitmap shape
     * @param cx
     * @param cy
     * @param r
     */
    renderBitmapShape(cx, cy, r) {
        DIAMOND(this.outputCanvasContext, cx, cy, r);
    }
}

class Waves extends BaseShapes {
    static get ShapeName() { return 'waves'; }

    /**
     * process pixels from image
     */
    processPixels() {
        let x = 0;
        let y = 0;
        while (y < this.H + this.A) {
            this.pushToBucket(x, y + Math.sin(x / 4));
            x += this.A;
            if (x > this.W) {
                y += this.A;
                x = 0;
            }
        }
    }

    /**
     * calculate radius? Is this what R is?
     * @param wantRate
     */
    calculateR(wantRate) {
        const d3 = (Math.PI - 4) / (this.A ** 2 * (3 - 2 * SquareRootOfTwo));
        return wantRate < Math.PI / 4
            ? Math.sqrt((wantRate * this.A ** 2) / Math.PI)
            : (this.A * d3 * SquareRootOfTwo + Math.sqrt(4 * d3 * (wantRate - 1))) / (2 * d3);
    }

    /**
     * render SVG shape
     * @param cx
     * @param cy
     * @param r
     */
    renderSVGShape(cx, cy, r) {
        return CIRCLE$1(cx, cy, r);
    }

    /**
     * render bitmap shape
     * @param cx
     * @param cy
     * @param r
     */
    renderBitmapShape(cx, cy, r) {
        CIRCLE(this.outputCanvasContext, cx, cy, r);
    }
}

class AltSquares extends BaseShapes {
    static get ShapeName() { return 'altsquares'; }

    /**
     * process pixels from image
     */
    processPixels() {
        let x = 0;
        let y = 0;
        let odd = true;
        while (y < this.H) {
            this.pushToBucket(x, y);
            x += this.A;
            if (x > this.W) {
                y += this.A;
                x = (this.A / 2) * odd;
                odd = !odd;
            }
        }
    }

    /**
     * calculate radius? Is this what R is?
     * @param wantRate
     */
    calculateR(wantRate) {
        return this.A * Math.sqrt(wantRate);
    }

    /**
     * render bitmap shape
     * @param cx
     * @param cy
     * @param r
     */
    renderBitmapShape(cx, cy, r) {
        SQUARE(this.outputCanvasContext, cx, cy, r);
    }

    /**
     * render SVG shape
     * @param cx
     * @param cy
     * @param r
     */
    renderSVGShape(cx, cy, r) {
        return SQUARE$1(cx, cy, r);
    }
}

var Shapes = /*#__PURE__*/Object.freeze({
    __proto__: null,
    Hexagons: Hexagons,
    Circles: Circles,
    CircularDots: CircularDots,
    SunflowerDots: SunflowerDots,
    AltCircles: AltCircles,
    Squares: Squares,
    Crosses: Crosses,
    Triangles: Triangles,
    AltTriangles: AltTriangles,
    Diamonds: Diamonds,
    Waves: Waves,
    AltSquares: AltSquares
});

const RendererFactory = (type, opts, imageobj) => {
    const ctor = Object.entries(Shapes).find( item => {
        return item[1].ShapeName === type;
    })[1];

    return new ctor(opts, imageobj);
};

const RenderShapeTypes = Object.entries(Shapes).map(item => {
    return item[1].ShapeName;
});

class BaseHalftoneElement extends HTMLElement {
    static get RenderShapeTypes() { return RenderShapeTypes }

    static get observedAttributes() { return [
        'src',
        'shapetype',
        'distance',
        'crossbarlength',
        'shapecolor',
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

        this.createBackgroundSlot();
        this.createRenderer();
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

        if (bounds.width === this.componentWidth ||
            bounds.height === this.componentHeight ||
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
        this.backgroundSlot.style.left = `${this.visibleRect.xt}px`;
        return true;
    };

    connectedCallback() {
        if (this.hasAttribute('noshadow')) {
            this.domRoot = this;
        }

        this.domRoot.appendChild(this.backgroundSlot);
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

    createBackgroundSlot() {
        this.backgroundSlot = document.createElement('slot');
        this.backgroundSlot.style.position = 'absolute';
        this.backgroundSlot.style.display = 'inline-block';
    }
}

class HalftoneBitmapCamera extends BaseHalftoneElement {

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

        this.canvasEl = document.createElement('canvas');
        this.videoEl.onloadedmetadata = event => this.onMetadata(event);
        this.videoEl.onplaying = () => {
            this.createRenderer(this.videoEl);
            this.renderer.init();
            setInterval( () => {
                this.render();
            }, 150);
        };
    }

    onMetadata() {
        this.aspectRatio = this.videoEl.videoWidth / this.videoEl.videoHeight;
        this.canvasEl.setAttribute('width', this.videoEl.videoWidth);
        this.canvasEl.setAttribute('height', this.videoEl.videoHeight);
        // this.resize();
    }

    connectedCallback() {
        super.connectedCallback();
        this.domRoot.appendChild(this.canvasEl);
        this.startCamera();
    }

    render() {
        if (this.renderer) {
            const bgColor = this.hasAttribute('backgroundcolor') ? this.getAttribute('backgroundcolor') : 'white';
            const fillColor = this.hasAttribute('shapecolor') ? this.getAttribute('shapecolor') : 'black';
            this.renderer.outputCanvasContext.fillStyle = bgColor;
            this.renderer.outputCanvasContext.beginPath();
            this.renderer.outputCanvasContext.rect(0, 0, this.renderer.w, this.renderer.h );
            this.renderer.outputCanvasContext.fill();

            this.renderer.outputCanvasContext.fillStyle = fillColor;
            this.renderer.render(true);
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
        /* switch (name) {
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
        } */
    }

    createRendererOptions() {
        const opts = super.createRendererOptions();
        opts.inputSource = this.videoEl;
        opts.outputCanvas = this.canvasEl;
        opts.renderer = 'canvas';
        return opts;
    }
}

if (!customElements.get('halftone-bitmap-camera')) {
    customElements.define('halftone-bitmap-camera', HalftoneBitmapCamera);
}

class HalftoneBitmapImage extends BaseHalftoneElement {
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
        this.renderer.loadImage(uri).then( () => { this.render(); });
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

class HalftoneSVGCamera extends BaseHalftoneElement {

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
        };
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

class HalftoneSVGImage extends BaseHalftoneElement {
    constructor() {
        super();

        /**
         * last SVG render
         */
        this.cachedSVGPath = undefined;

        /**
         * svg element
         */
        this.svgEl = undefined;

        if (this.getAttribute('src')) {
            this.loadImage(this.getAttribute('src'));
        }

        this.createSVGElement();
    }

    connectedCallback() {
        super.connectedCallback();
        this.domRoot.appendChild(this.svgEl);
    }

    loadImage(uri) {
        this.renderer.loadImage(uri).then( () => { this.render(); });
    }

    resize() {
        let modified = super.resize();
        if (modified) {
            this.svgEl.style.top = this.visibleRect.y + 'px';
            this.svgEl.style.left = this.visibleRect.x + 'px';
            this.svgEl.style.width = this.visibleRect.width + 'px';
            this.svgEl.style.height = this.visibleRect.height + 'px';
        }
        return modified;
    }

    /**
     * render
     * @param dorender - default true, allow not invoking the underlying render function
     */
    render(dorender = true) {
        this.resize();
        if (this.renderer && this.renderer.isSourceReady) {
            if (dorender) {
                this.cachedSVGPath = this.renderer.render();
            }
            this.svgEl.innerHTML = this.svgPathWithTransformGroup;
        }
    }

    /**
     * get SVG markup
     * @return string
     */
    getSVG(width, height) {
        return `<svg width="${width | this.visibleRect.width}" height="${height | this.visibleRect.height}" xmlns="http://www.w3.org/2000/svg">
            ${this.svgPathWithTransformGroup}
        </svg>`;
    }

    /**
     * get SVG path data from last render
     */
    get svgPath() {
        return this.cachedSVGPath;
    }

    /**
     * get SVG path with surrounding transform group
     */
    get svgPathWithTransformGroup() {
        const fill = this.hasAttribute('shapecolor') ? this.getAttribute('shapecolor') : 'black';
        return `<g fill="${fill}" transform="scale(${this.visibleRect.width / this.renderer.width}, ${this.visibleRect.height / this.renderer.height})">
            <path d="${this.svgPath}"></path>
        </g>`;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue);
        switch (name) {
            case 'shapecolor':
                this.render(false);
                break;

            case 'blendmode':
                this.svgEl.style['mix-blend-mode'] = newValue;
                break;

            case 'src':
                if (this.renderer) {
                    this.loadImage(newValue);
                }
                break;
        }
    }

    createRendererOptions() {
        const opts = super.createRendererOptions();
        opts.renderer = 'svgpath';
        return opts;
    }

    createSVGElement() {
        this.svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svgEl.style.position = 'absolute';
        this.svgEl.style.display = 'inline-block';
    }
}

if (!customElements.get('halftone-svg-image')) {
    customElements.define('halftone-svg-image', HalftoneSVGImage);
}

var index = /*#__PURE__*/Object.freeze({
    __proto__: null,
    HalftoneBitmapCamera: HalftoneBitmapCamera,
    HalftoneBitmapImage: HalftoneBitmapImage,
    HalftoneSVGCamera: HalftoneSVGCamera,
    HalftoneSVGImage: HalftoneSVGImage
});

export { index as Components, RenderShapeTypes, RendererFactory, Shapes };
