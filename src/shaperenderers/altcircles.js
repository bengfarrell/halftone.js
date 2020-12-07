import BaseShapes from './baseshapes.js';
import { SquareRootOfTwo } from '../math.js';
import { CIRCLE as SVG_CIRCLE } from './svgshapefactory.js';
import { CIRCLE as CANVAS_CIRCLE } from './bitmapshapefactory.js';

export class AltCircles extends BaseShapes {
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
