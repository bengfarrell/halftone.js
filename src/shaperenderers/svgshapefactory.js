import {Round, SquareRootOfThree, SquareRootOfTwo} from '../math';

// SVG Square Primitive
export const SQUARE = (cx, cy, r) => {
    return `M${cx - r / 2},${cy - r / 2}h${r}v${r}h${-r}z`;
}

// SVG Circle Primitive
export const CIRCLE = (cx, cy, r) => {
    return `M${Round(cx)},${Round(cy - r)}a${[r, r, 0, 0, 1, 0, 2 * r]}a${[
        r,
        r,
        0,
        0,
        1,
        0,
        -2 * r
    ]}z`
}

// SVG Triangle Primitive
export const TRIANGLE = (cx, cy, r, flipped) => {
    const aa = (r / 3) * 2;
    return `M${cx},${cy + flipped * aa}l${(-aa * SquareRootOfThree) / 2},${(flipped * -aa / 2) * 3}h${aa * SquareRootOfThree}z`;
}

// SVG Diamond Primitive
export const DIAMOND = (cx, cy, r) => {
    const r2 = r /= SquareRootOfTwo;
    return `M${cx},${cy - r2 / 2}l${r2},${r2},${-r2},${r2},${-r2},${-r2}z`;
}

// SVG Hexagon Primitive
export const HEXAGON = (cx, cy, r) => {
    const r2 = r / 2;
    const r23 = r2 * SquareRootOfThree;
    return `M${cx},${cy -
    r}l${r23},${r2}v${r}l${-r23},${r2},${-r23},${-r2}v${-r}z`;
}

// SVG Cross Primitive
export const CROSS = (cx, cy, r, b) => {
    return `M${cx - r / 2},${cy - b -
    r / 2}h${r}v${b}h${b}v${r}h${-b}v${b}h${-r}v${-b}h${-b}v${-r}h${b}z`
}
