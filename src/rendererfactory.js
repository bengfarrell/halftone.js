import * as Shapes from './shaperenderers/index'

export const RendererFactory = (type, opts, imageobj) => {
    const ctor = Object.entries(Shapes).find( item => {
        return item[1].ShapeName === type;
    })[1];

    return new ctor(opts, imageobj);
}

export const RenderShapeTypes = Object.entries(Shapes).map(item => {
    return item[1].ShapeName;
});
