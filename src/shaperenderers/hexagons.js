import BaseShapes from './baseshapes';
import { SquareRootOfThree } from '../math';
import { HEXAGON as CANVAS_HEXAGON } from './bitmapshapefactory';
import { HEXAGON as SVG_HEXAGON } from './svgshapefactory';

export class Hexagons extends BaseShapes {
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
        CANVAS_HEXAGON(this.outputCanvasContext, cx, cy, r);
    }

    /**
     * render SVG shape
     * @param cx
     * @param cy
     * @param r
     */
    renderSVGShape(cx, cy, r) {
        return SVG_HEXAGON(cx, cy, r);
    }
}
