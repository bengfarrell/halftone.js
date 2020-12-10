import { BaseHalftoneElement } from './basecomponent';

export class HalftoneSVGImage extends BaseHalftoneElement {
    constructor() {
        super();
        if (this.getAttribute('src')) {
            this.loadImage(this.getAttribute('src'));
        }
    }

    loadImage(uri) {
        this.renderer.loadURL(uri).then( () => { this.render() });
    }

    render() {
        if (this.renderer && this.renderer.isSourceReady) {
            const fill = this.hasAttribute('shapecolor') ? this.getAttribute('shapecolor') : 'black';
            const background = this.hasAttribute('backgroundcolor') ? this.getAttribute('backgroundcolor') : 'white';
            this.domRoot.innerHTML = `
            <svg fill="${fill}" style="fill: ${fill}; background-color: ${background}"
                width="${this.renderer.width}"
                height="${this.renderer.height}">
                    <g transform="scale(1.85, 1.85)">
                        <path d="${this.renderer.render()}"></path>
                    </g>
            </svg>`;
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue);
        switch (name) {
            case 'backgroundcolor': {
                const svg = this.domRoot.querySelector('svg');
                if (svg) {
                    svg.style.backgroundColor = newValue;
                }
                break;
            }

            case 'shapecolor': {
                const svg = this.domRoot.querySelector('svg');
                if (svg) {
                    svg.style.fill = newValue;
                }
                break;
            }
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
