import BaseShapes from './baseshapes.js';
import {SquareRootOfThree} from '../math.js';

export class AltTriangles extends BaseShapes {
    static get ShapeName() { return 'alttriangles'; }

    constructor(opts) {
        super(opts);
        this.processRow = true;
        this.processCol = true;
        this.outputRow = -1;
        this.outputCol = -1;
    }
    /**
     * process pixels from image
     */
    processPixels() {
        let x = 0;
        let y = 0;
        this.processCol = true;
        let Y = y;
        while (y < this.H) {
            this.pushToBucket(x, y);
            x += (this.A * SquareRootOfThree) / 2;
            y = y + (this.A / 2) * (this.processCol ? -1 : 1);
            this.processCol = !this.processCol;
            if (x > this.W) {
                y = Y + this.A * 1.5;
                Y = y;
                x = 0;
                this.processCol = true;
            }
        }
    }

    /**
     * calculate radius? Is this what R is?
     * @param wantRate
     */
    calculateR(wantRate) {
        return (3 / 2) * this.A * Math.sqrt(wantRate);
    }

    /**
     * render SVG shape
     * @param cx
     * @param cy
     * @param r
     */
    renderSVGShape(cx, cy, r) {
        if (!cx) {
            this.outputRow++;
            this.outputCol = -1;
        }
        const aa = (r / 3) * 2;
        this.outputCol ++;
        if ((this.outputCol) % 2) {
            return `M${cx},${cy + aa}l${(-aa * SquareRootOfThree) / 2},${(-aa / 2) * 3}h${aa * SquareRootOfThree}z`;
        } else {
            return `M${cx},${cy - aa}l${(-aa * SquareRootOfThree) / 2},${(aa / 2) * 3}h${aa * SquareRootOfThree}z`;
        }
    }
}
