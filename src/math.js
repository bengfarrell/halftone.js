/** get mean value */
export const Mean = array => array.reduce((a, b) => a + b) / array.length;

/** round value */
export const Round = num => Math.round(num * 1e4) / 1e4;

/** pre calculated square root of 2 */
export const SquareRootOfTwo = Math.sqrt(2);

/** pre calculated square root of 3 */
export const SquareRootOfThree = Math.sqrt(3);
