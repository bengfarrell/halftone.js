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
        if (this.renderer && this.renderer.isSourceReady) {
            if (dorender) {
                this.cachedSVGPath = this.renderer.render();
            }
            this.domRoot.innerHTML = this.getSVG();
        }
    }

    /**
     * get SVG path data from last render
     * @return {any}
     */
    getSVG() {
        const fill = this.hasAttribute('shapecolor') ? this.getAttribute('shapecolor') : 'black';
        const background = this.hasAttribute('backgroundcolor') ? this.getAttribute('backgroundcolor') : 'white';
        const blendmode =  this.hasAttribute('blendmode') ? this.getAttribute('blendmode') : 'normal';
        return `<svg fill="${fill}" style="fill: ${fill}; background-color: ${background}"
                    width="${this.renderer.width}"
                    height="${this.renderer.height}">
            ${ this.hasAttribute('backgroundimage') ? `<image href="${this.getAttribute('backgroundimage')}"/>` : ''}      
            <g style="mix-blend-mode: ${blendmode}">
                <path d="${this.cachedSVGPath}"></path>
            </g>
        </svg>`;
    }

    /**
     * get SVG path data from last render
     * @return {any}
     */
    getSVGPath() {
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
}

if (!customElements.get('halftone-svg-image')) {
    customElements.define('halftone-svg-image', HalftoneSVGImage);
}
