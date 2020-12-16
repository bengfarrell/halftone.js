function changeShape(event) {
    document.getElementById('halftone').setAttribute('shapetype', event.target.value);

    if (event.target.value === 'crosses') {
        document.getElementById('crosssize-container').style.display = 'block';
    } else {
        document.getElementById('crosssize-container').style.display = 'none';
    }
}

function downloadSVG() {
    const dl = document.createElement('a');
    const data = "data:image/svg+xml," + escape(document.getElementById('halftone').svg)
    dl.setAttribute('download', 'halftone.svg');
    dl.setAttribute('href', data);
    dl.click();
}

function downloadImage() {
    const svg = document.getElementById('halftone');
    svg.rasterizeToPNG().then( (pngdata) => {
        const dl = document.createElement('a');
        dl.setAttribute('download', 'halftone.png');
        dl.setAttribute('href', pngdata);
        dl.click();
    });
}

function changeDistance(event) {
    document.getElementById('halftone').setAttribute('distance', event.target.value);
}

function changeCrossSize(event) {
    document.getElementById('halftone').setAttribute('crossbarlength', event.target.value);
}

function changeFillColor(event) {
    document.getElementById('halftone').setAttribute('shapecolor', event.target.value);
}

function changeBackgroundColor(event) {
    document.getElementById('bgimage').style.backgroundColor = event.target.value;
}

function changeBGImage(event) {
    document.getElementById('bgimage').style.backgroundImage = `url("${event.target.value}")`;
}

function uploadBGImage(event) {
    document.getElementById('halftone').setAttribute('backgroundimage', URL.createObjectURL(event.target.files[0]));
}

function changeSrcImage(event) {
    document.getElementById('halftone').setAttribute('src', event.target.value);
}

function uploadSrcImage(event) {
    document.getElementById('halftone').setAttribute('src', URL.createObjectURL(event.target.files[0]));
}


function changeBlendMode(event) {
    document.getElementById('halftone').setAttribute('blendmode', event.target.value);
}

/**
 const img = new Image();
 img.onload = () => {
                    this.backgroundImageCanvas.width = img.width;
                    this.backgroundImageCanvas.height = img.height;
                    this.backgroundImageCanvasContext = this.backgroundImageCanvas.getContext('2d');
                    this.backgroundImageCanvasContext.drawImage(img, 0, 0);
                    this.render();
                }
 img.src = newValue;

 this.renderer.outputCanvasContext.globalCompositeOperation = 'overlay';

 drawBackgroundImage(offsetX = 0.5, offsetY = 0.5) {
        const w = this.visibleRect.width;
        const h = this.visibleRect.height;
        const ctx = this.renderer.outputCanvasContext;

        // keep bounds [0.0, 1.0]
        if (offsetX < 0) offsetX = 0;
        if (offsetY < 0) offsetY = 0;
        if (offsetX > 1) offsetX = 1;
        if (offsetY > 1) offsetY = 1;

        var iw = this.backgroundImageCanvas.width,
            ih = this.backgroundImageCanvas.height,
            r = Math.min(w / iw, h / ih),
            nw = iw * r,   // new prop. width
            nh = ih * r,   // new prop. height
            cx, cy, cw, ch, ar = 1;

        // decide which gap to fill
        if (nw < w) ar = w / nw;
        if (Math.abs(ar - 1) < 1e-14 && nh < h) ar = h / nh;  // updated
        nw *= ar;
        nh *= ar;

        // calc source rectangle
        cw = iw / (nw / w);
        ch = ih / (nh / h);

        cx = (iw - cw) * offsetX;
        cy = (ih - ch) * offsetY;

        // make sure source rectangle is valid
        if (cx < 0) cx = 0;
        if (cy < 0) cy = 0;
        if (cw > iw) cw = iw;
        if (ch > ih) ch = ih;

        // fill image in dest. rectangle
        ctx.drawImage(this.backgroundImageCanvas, cx, cy, cw, ch, 0, 0, w, h);
    }


 rasterizeToCanvas() {
        return this.rasterize();
    }

 rasterizeToPNG() {
        return new Promise( (resolve) => {
            const canvas = this.rasterizeToCanvas().then( (canvas) => {
                resolve(canvas.toDataURL("image/png"));
            });
        });
    }

 rasterize() {
        return new Promise( (resolve) => {
            const finalizeSVG = (dataURLBackground) => {
                const fill = this.hasAttribute('shapecolor') ? this.getAttribute('shapecolor') : 'black';
                const blendmode = this.hasAttribute('blendmode') ? this.getAttribute('blendmode') : 'normal';

                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
                svg.innerHTML = `<g fill="${fill}" transform="scale(${this.visibleRect.width / this.renderer.width}, ${this.visibleRect.height / this.renderer.height})" style="mix-blend-mode: ${blendmode}">
                                        <path d="${this.svgPath}"></path>
                                    </g>`;

                if (dataURLBackground) {
                    svg.style.backgroundImage = `url(${dataURLBackground})`;
                } else {
                    svg.style.backgroundColor = this.hasAttribute('backgroundcolor') ? this.getAttribute('backgroundcolor') : 'white';
                }
                const xml = new XMLSerializer().serializeToString(svg);
                const svg64 = btoa(xml);
                const b64Start = 'data:image/svg+xml;base64,';
                const image64 = b64Start + svg64;

                const img = document.createElement('img');
                const canvas = document.createElement('canvas');
                canvas.width = this.visibleRect.width;
                canvas.height = this.visibleRect.height;
                img.onload = function () {
                    canvas.getContext('2d').drawImage(img, 0, 0);
                    resolve(canvas);
                }
                img.src = image64;
            }

            if (this.hasAttribute('backgroundimage')) {
                const request = new XMLHttpRequest();
                request.open('GET', this.getAttribute('backgroundimage'), true);
                request.responseType = 'blob';
                request.onload = () => {
                    var reader = new FileReader();
                    reader.readAsDataURL(request.response);
                    reader.onload = e => finalizeSVG(e.target.result);
                };
                request.send();
            } else {
                finalizeSVG();
            }
        });
    }
 */
