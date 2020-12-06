import BaseShapes from './baseshapes.js';
import {SquareRootOfTwo} from '../math.js';

export class Diamonds extends BaseShapes {
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
        r /= SquareRootOfTwo;
        return `M${cx},${cy - r / 2}l${r},${r},${-r},${r},${-r},${-r}z`;
    }
}
