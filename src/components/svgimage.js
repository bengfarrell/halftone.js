import { BaseHalftoneElement } from './basecomponent.js';

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
        const fill = this.hasAttribute('fillcolor') ? this.getAttribute('fillcolor') : 'black';
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

            case 'fillcolor': {
                const svg = this.domRoot.querySelector('svg');
                if (svg) {
                    svg.style.fill = newValue;
                }
                break;
            }
        }
    }
}

if (!customElements.get('halftone-svg-image')) {
    customElements.define('halftone-svg-image', HalftoneSVGImage);
}
