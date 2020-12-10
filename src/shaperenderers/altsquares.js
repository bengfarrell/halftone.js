import BaseShapes from './baseshapes';
import { SQUARE as SVG_SQUARE } from './svgshapefactory';
import {SQUARE as CANVAS_SQUARE} from './bitmapshapefactory';

export class AltSquares extends BaseShapes {
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
        CANVAS_SQUARE(this.outputCanvasContext, cx, cy, r);
    }

    /**
     * render SVG shape
     * @param cx
     * @param cy
     * @param r
     */
    renderSVGShape(cx, cy, r) {
        return SVG_SQUARE(cx, cy, r);
    }
}
