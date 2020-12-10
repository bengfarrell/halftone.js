import BaseShapes from './baseshapes';
import {SquareRootOfThree} from '../math';
import { TRIANGLE as SVG_TRIANGLE } from '../shaperenderers/svgshapefactory';
import { TRIANGLE as CANVAS_TRIANGLE } from '../shaperenderers/bitmapshapefactory';

export class Triangles extends BaseShapes {
    static get ShapeName() { return 'triangles'; }

    preInit() {
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
        this.processRow = true;
        this.processCol = true;
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
        return this.renderCommonShape('svg', cx, cy, r);
    }

    /**
     * render bitmap shape
     * @param cx
     * @param cy
     * @param r
     */
    renderBitmapShape(cx, cy, r) {
        this.renderCommonShape('bitmap', cx, cy, r);
    }

    renderCommonShape(type, cx, cy, r) {
        if (!cx) {
            this.outputRow++;
            this.outputCol = -1;
        }
        this.outputCol ++;
        if ((this.outputCol + this.outputRow) % 2) {
            if (type === 'svg') {
                return SVG_TRIANGLE(cx, cy, r, 1);
            } else {
                CANVAS_TRIANGLE(this.outputCanvasContext, cx, cy, r, 1);
            }
        } else {
            if (type === 'svg') {
                return SVG_TRIANGLE(cx, cy, r, -1);
            } else {
                CANVAS_TRIANGLE(this.outputCanvasContext, cx, cy, r, -1);
            }
        }
    }
}
