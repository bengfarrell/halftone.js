import BaseShapes from './baseshapes.js';
import {SquareRootOfThree} from '../math.js';

export class Triangles extends BaseShapes {
    static get ShapeName() { return 'triangles'; }

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
        let Y = y;
        while (y < this.H) {
            this.pushToBucket(x, y);
            x += (this.A * SquareRootOfThree) / 2;
            y = y + (this.A / 2) * (this.processCol ? -1 : 1);
            this.processCol = !this.processCol;
            if (x > this.W) {
                y = Y + this.A * (this.processRow ? 1 : 2);
                Y = y;
                x = 0;
                this.processRow = !this.processRow;
                this.processCol = this.processRow;
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
        if ((this.outputCol + this.outputRow) % 2) {
            return `M${cx},${cy + aa}l${(-aa * SquareRootOfThree) / 2},${(-aa / 2) * 3}h${aa * SquareRootOfThree}z`;
        } else {
            return `M${cx},${cy - aa}l${(-aa * SquareRootOfThree) / 2},${(aa / 2) * 3}h${aa * SquareRootOfThree}z`;
        }
    }
}
