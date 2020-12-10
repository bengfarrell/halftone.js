import BaseShapes from './baseshapes';
import {SquareRootOfThree} from '../math';
import {TRIANGLE as SVG_TRIANGLE} from './svgshapefactory';
import {TRIANGLE as CANVAS_TRIANGLE} from './bitmapshapefactory';

export class AltTriangles extends BaseShapes {
    static get ShapeName() { return 'alttriangles'; }

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

    /**
     * render SVG shape
     * @param cx
     * @param cy
     * @param r
     */
    renderCommonShape(type, cx, cy, r) {
        if (!cx) {
            this.outputRow++;
            this.outputCol = -1;
        }
        this.outputCol++;
        if (this.outputCol % 2) {
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
