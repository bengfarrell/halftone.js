// Bitmap Square Primitive
import {SquareRootOfThree, SquareRootOfTwo} from '../math';

export const SQUARE = (ctx, cx, cy, r) => {
    ctx.beginPath();
    ctx.rect(cx - r / 2, cy  - r / 2, r , r );
    ctx.fill();
}

// Bitmap Circle Primitive
export const CIRCLE = (ctx, cx, cy, r) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.fill();
}

// Bitmap Triangle Primitive
export const TRIANGLE = (ctx, cx, cy, r, flipped) => {
    const aa = (r / 3) * 2;
    ctx.beginPath();

    let startX = cx;
    let startY = cy + flipped * aa;
    let currX = startX
    let currY = startY;
    ctx.moveTo(currX, currY);

    currX += (-aa * SquareRootOfThree) / 2;
    currY += (flipped * -aa / 2) * 3;
    ctx.lineTo(currX, currY);

    currX += aa * SquareRootOfThree;
    ctx.lineTo(currX, currY);
    ctx.lineTo(startX, startY);
    ctx.fill();
}

// Bitmap Diamond Primitive
export const DIAMOND = (ctx, cx, cy, r) => {
    const r2 = r /= SquareRootOfTwo;
    ctx.beginPath();

    let startX = cx;
    let startY = cy - r2 / 2;
    let currX = startX
    let currY = startY;
    ctx.moveTo(currX, currY);

    currX += r2
    currY += r2;
    ctx.lineTo(currX, currY);

    currX += -r2
    currY += r2;
    ctx.lineTo(currX, currY);

    currX += -r2
    currY += -r2;
    ctx.lineTo(currX, currY);

    ctx.lineTo(startX, startY);
    ctx.fill();
}

// Bitmap Hexagon Primitive
export const HEXAGON = (ctx, cx, cy, r) => {
    const r2 = r / 2;
    const r23 = r2 * SquareRootOfThree;
    ctx.beginPath();

    let startX = cx;
    let startY = cy - r;
    let currX = startX
    let currY = startY;
    ctx.moveTo(currX, currY);

    currX += r23
    currY += r2;
    ctx.lineTo(currX, currY);

    currY += r;
    ctx.lineTo(currX, currY);

    currX += -r23
    currY += r2;
    ctx.lineTo(currX, currY);

    currX += -r23
    currY += -r2;
    ctx.lineTo(currX, currY);

    currY += -r;
    ctx.lineTo(currX, currY);

    ctx.lineTo(startX, startY);
    ctx.fill();
}


// Bitmap Cube Primitive
export const CUBE = (ctx, cx, cy, r) => {
    const r2 = r / 2;
    const r23 = r2 * SquareRootOfThree;
    ctx.beginPath();

    let startX = cx;
    let startY = cy - r;
    let currX = startX
    let currY = startY;
    ctx.moveTo(currX, currY);

    currX += r23
    currY += -r2;
    ctx.lineTo(currX, currY);

    currY += r;
    ctx.lineTo(currX, currY);

    currX += -r23
    currY += r2;
    ctx.lineTo(currX, currY);

    currX += -r23
    currY += -r2;
    ctx.lineTo(currX, currY);

    currY += -r;
    ctx.lineTo(currX, currY);

    ctx.lineTo(startX, startY);
    ctx.fill();
}

// Bitmap Cross Primitive
export const CROSS = (ctx, cx, cy, r, b) => {
    ctx.beginPath();

    let startX = cx - r / 2;
    let startY = cy - b - r / 2;
    let currX = startX
    let currY = startY;
    ctx.moveTo(currX, currY);

    currX += r;
    ctx.lineTo(currX, currY);

    currY += b;
    ctx.lineTo(currX, currY);

    currX += b;
    ctx.lineTo(currX, currY);

    currY += r;
    ctx.lineTo(currX, currY);

    currX += -b;
    ctx.lineTo(currX, currY);

    currY += b;
    ctx.lineTo(currX, currY);

    currX += -r;
    ctx.lineTo(currX, currY);

    currY += -b;
    ctx.lineTo(currX, currY);

    currX += -b;
    ctx.lineTo(currX, currY);

    currY += -r;
    ctx.lineTo(currX, currY);

    currX += b;
    ctx.lineTo(currX, currY);

    ctx.lineTo(startX, startY);
    ctx.fill();
}
