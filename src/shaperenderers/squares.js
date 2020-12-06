import BaseShapes from './baseshapes.js';
import { SQUARE } from './svgshapefactory.js';
import {SquareRootOfThree, SquareRootOfTwo} from '../math.js';

export class Squares extends BaseShapes {
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
     * render SVG shape
     * @param cx
     * @param cy
     * @param r
     */
    renderSVGShape(cx, cy, r) {
        return SQUARE(cx, cy, r);
    }
}
