import BaseShapes from './baseshapes.js';
import { SquareRootOfThree } from '../math.js';
import { CIRCLE as SVG_CIRCLE } from './svgshapefactory.js';
import { CIRCLE as CANVAS_CIRCLE } from './bitmapshapefactory.js';

export class CircularDots extends BaseShapes {
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
        return SVG_CIRCLE(cx, cy, r);
    }

    /**
     * render bitmap shape
     * @param cx
     * @param cy
     * @param r
     */
    renderBitmapShape(cx, cy, r) {
        CANVAS_CIRCLE(this.outputCanvasContext, cx, cy, r);
    }
}
