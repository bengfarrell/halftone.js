import { BaseHalftoneElement } from './basecomponent';

export class HalftoneSVGImage extends BaseHalftoneElement {
    constructor() {
        super();

        /**
         * last SVG render
         */
        this.cachedSVGPath = undefined;

        /**
         * svg element
         */
        this.svgEl = undefined;

        if (this.getAttribute('src')) {
            this.loadImage(this.getAttribute('src'));
        }

        this.createSVGElement();
    }

    connectedCallback() {
        super.connectedCallback();
        this.domRoot.appendChild(this.svgEl);
    }

    loadImage(uri) {
        this.renderer.loadImage(uri).then( () => { this.render() });
    }

    resize() {
        let modified = super.resize();
        if (modified) {
            this.svgEl.style.top = this.visibleRect.y + 'px';
            this.svgEl.style.left = this.visibleRect.x + 'px';
            this.svgEl.style.width = this.visibleRect.width + 'px';
            this.svgEl.style.height = this.visibleRect.height + 'px';
        }
        return modified;
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
            this.svgEl.innerHTML = this.svgPathWithTransformGroup;
        }
    }

    /**
     * get SVG markup
     * @return string
     */
    get svg() {
        return `<svg width="${this.visibleRect.width}" height="${this.visibleRect.height}">
            ${this.svgPathWithTransformGroup}
        </svg>`;
    }

    /**
     * get SVG path data from last render
     */
    get svgPath() {
        return this.cachedSVGPath;
    }

    /**
     * get SVG path with surrounding transform group
     */
    get svgPathWithTransformGroup() {
        const fill = this.hasAttribute('shapecolor') ? this.getAttribute('shapecolor') : 'black';
        return `<g fill="${fill}" transform="scale(${this.visibleRect.width / this.renderer.width}, ${this.visibleRect.height / this.renderer.height})">
            <path d="${this.svgPath}"></path>
        </g>`;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue);
        switch (name) {
            case 'shapecolor':
                this.render(false);
                break;

            case 'blendmode':
                this.svgEl.style['mix-blend-mode'] = newValue;
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

    createSVGElement() {
        this.svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svgEl.style.position = 'absolute';
        this.svgEl.style.display = 'inline-block';
    }
}

if (!customElements.get('halftone-svg-image')) {
    customElements.define('halftone-svg-image', HalftoneSVGImage);
}
