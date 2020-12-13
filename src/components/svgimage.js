import { BaseHalftoneElement } from './basecomponent';

export class HalftoneSVGImage extends BaseHalftoneElement {

    static get observedAttributes() {
        return [...BaseHalftoneElement.observedAttributes, 'src'];
    }

    constructor() {
        super();

        /**
         * last SVG render
         */
        this.cachedSVGPath = undefined;

        if (this.getAttribute('src')) {
            this.loadImage(this.getAttribute('src'));
        }
    }

    loadImage(uri) {
        this.renderer.loadImage(uri).then( () => { this.render() });
    }

    /**
     * render
     * @param dorender - default true, allow not invoking the underlying render function
     */
    render(dorender = true) {
        this.resize();
        if (this.renderer && this.renderer.isSourceReady) {
            if (dorender) {
                this.cachedSVGPath = this.renderer.render();
            }
            this.domRoot.innerHTML = `<style>
            svg {
                position: relative;
                top: ${this.visibleRect.y}px;
                left: ${this.visibleRect.x}px;
            }
            </style>
            ${this.getSVG()}`;
            this.style.display = 'inline-block';
        }
    }

    /**
     * get SVG markup
     * @return {any}
     */
    getSVG() {
        const fill = this.hasAttribute('shapecolor') ? this.getAttribute('shapecolor') : 'black';
        const background = this.hasAttribute('backgroundcolor') ? this.getAttribute('backgroundcolor') : 'white';
        const backgroundimg = this.hasAttribute('backgroundimage') ? this.getAttribute('backgroundimage') : undefined;
        const backgroundimgcss = backgroundimg ? `background-image: url('${backgroundimg}');` : '';
        const blendmode = this.hasAttribute('blendmode') ? this.getAttribute('blendmode') : 'normal';

        return `<svg style="${backgroundimgcss} background-color: ${background}"
                    width="${this.visibleRect.width}"
                    height="${this.visibleRect.height}">
            <g fill="${fill}" transform="scale(${this.visibleRect.width / this.renderer.width}, ${this.visibleRect.height / this.renderer.height})" style="mix-blend-mode: ${blendmode}">
                <path d="${this.svgPath}"></path>
            </g>
        </svg>`;
    }

    /**
     * get SVG path data from last render
     * @return {any}
     */
    get svgPath() {
        return this.cachedSVGPath;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue);
        switch (name) {
            case 'backgroundimage':
            case 'backgroundcolor':
            case 'shapecolor':
            case 'blendmode':
                this.render(false);
                break;

            case 'src':
                if (this.renderer) {
                    this.loadImage(newValue);
                }
                break;
        }
    }

    createRendererOptions() {
        const opts = super.createRendererOptions();
        opts.renderer = 'svgpath';
        return opts;
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

}

if (!customElements.get('halftone-svg-image')) {
    customElements.define('halftone-svg-image', HalftoneSVGImage);
}
