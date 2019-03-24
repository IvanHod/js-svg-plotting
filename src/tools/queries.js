export function getMaxOfArray(numArray) {
    return Math.max.apply(null, numArray);
}

export function getMinOfArray(numArray) {
    return Math.min.apply(null, numArray);
}

export function query(el, props, appendToElement) {
    let element = null;
    if (props) {
        let styles = '';
        element = document.createElement(el);
        for (let key in props) {
            if (key === 'css') {
                for (let name in props[key]) {
                    styles += name + ':' + props[key][name] + ';';
                }
            } else {
                element.setAttribute(key, props[key]);
            }
        }
        if (styles) {
            element.setAttribute('style', styles);
        }
    } else {
        if (el[0] === '#') {
            element = document.getElementById(el);
        } else if (el[0] === '.') {
            element = document.getElementsByClassName(el);
        } else {
            element = document.getElementsByTagName(el);
        }
    }
    appendToElement.append(element);
    return element;
}