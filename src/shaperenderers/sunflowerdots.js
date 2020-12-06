import BaseShapes from './baseshapes.js';
import { SquareRootOfThree } from '../math.js';
import { CIRCLE } from './svgshapefactory.js';

export class SunflowerDots extends BaseShapes {
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
        return CIRCLE(cx, cy, r);
    }
}
