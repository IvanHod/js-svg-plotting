export function createText(props) {
    let shape = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    for (let prop in props) {
        if (prop !== 'val') {
            shape.setAttributeNS(null, prop, props[prop]);
        }
    }
    shape.appendChild(document.createTextNode(props['val']));
    return shape
}

export function createSvgElement(type, props) {
    let shape = document.createElementNS('http://www.w3.org/2000/svg', type);
    for (let prop in props) {
        shape.setAttributeNS(null, prop, props[prop]);
    }
    return shape
}

export function createPolyline(group, props) {
    if (!group) {
        group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    }
    let shape = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');

    for (let prop in props) {
        shape.setAttributeNS(null, prop, props[prop]);
    }

    group.append(shape);

    let animate = createTransform('points', '0', '0');
    shape.append(animate);

    return shape
}

export function createTransform(type, from, to, fill='freeze') {
    let animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
    animate.setAttributeNS(null, 'attributeName', type);

    animate.setAttributeNS(null, 'from', from);
    animate.setAttributeNS(null, 'to', to);
    animate.setAttributeNS(null, 'fill', fill);

    animate.setAttributeNS(null, 'begin', 'indefinite');
    animate.setAttributeNS(null, 'dur', '200ms');
    return animate
}