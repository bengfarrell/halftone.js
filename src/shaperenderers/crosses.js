import BaseShapes from './baseshapes';
import { Round } from '../math';
import { CROSS as SVG_CROSS } from './svgshapefactory';
import { CROSS as CANVAS_CROSS } from './bitmapshapefactory';

export class Crosses extends BaseShapes {
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
        CANVAS_CROSS(this.outputCanvasContext, cx, cy, r, b);
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
        return SVG_CROSS(cx, cy, r, b);
    }
}
