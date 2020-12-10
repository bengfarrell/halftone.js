import BaseShapes from './baseshapes';
import { CIRCLE as SVG_CIRCLE } from './svgshapefactory';
import { CIRCLE as CANVAS_CIRCLE } from './bitmapshapefactory';

import {SquareRootOfThree } from '../math';

export class Circles extends BaseShapes {
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
