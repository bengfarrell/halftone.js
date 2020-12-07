// Bitmap Square Primitive
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
