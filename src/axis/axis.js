import {createSvgElement, createText} from "../tools/svg";

export class Axis {
    constructor(svg, data, width, height, color='gray', fontSize='18px') {
        this.svg = svg;
        this.data = data;
        this.width = width;
        this.height = height;
        this.fontSize = fontSize;
        this.paddingBottom = 40;
        this.color = color;
        this.format = '';

        this.detectLetterWidth();
    }

    drawHorizontalLine(x1, y1, x2, y2) {
        let shape = createSvgElement('line', {
            'x1': x1,
            'y1': y1,
            'x2': x2,
            'y2': y2,
            'fill': 'none', 'stroke': this.color, 'stroke-width': '1'});
        this.svg.append(shape);
    }

    detectLetterWidth() {
        this.lettersWidth = {};
        let text = createText({x: 0, y: 0, 'val': 'J', 'font-size': this.fontSize, 'color': 'black'});
        this.svg.append(text);
        this.heightOfLetter = text.getBBox().height;
        this.widthOfLetter = text.getBBox().width;
        text.remove();
    }

    appendLabel(x, y, g, val, props, currentElement=null) {
        let dateText = createText({x: x, y: y, 'val': val, 'font-size': this.fontSize, 'fill': this.color});
        for (let prop in props) {
            dateText.setAttributeNS(null, prop, props[prop]);
        }
        if (!currentElement) {
            g.append(dateText);
        } else {
            currentElement.parentNode.insertBefore(dateText, currentElement.nextSibling);
        }
        return dateText
    }
}