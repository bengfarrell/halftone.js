import BaseShapes from './baseshapes';
import { SquareRootOfTwo } from '../math';
import { CIRCLE as SVG_CIRCLE } from './svgshapefactory';
import { CIRCLE as CANVAS_CIRCLE } from './bitmapshapefactory';

export class Waves extends BaseShapes {
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
