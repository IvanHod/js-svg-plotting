import {getMinOfArray, getMaxOfArray} from "../tools/queries";
import {Axis} from "./axis";
import {createSvgElement} from "../tools/svg";

export class YAxis extends Axis {
    constructor(svg, y, width, height, color='gray') {
        super(svg, y, width, height, color);

        this.visible = {};
        for (let id in y) {
            this.dataLength = y[id].length;
            this.visible[id] = true;
        }
        this.min = Number.POSITIVE_INFINITY;
        this.max = Number.NEGATIVE_INFINITY;

        this.draw();
    }

    detectMinMax(startIndex=0, endIndex=-1) {
        if (endIndex) {
            endIndex = this.dataLength - 1;
        }
        let min = this.min, max = this.max;
        for (let id in this.data) {
            if (this.visible[id]) {
                let data = this.data[id].slice(startIndex, endIndex);
                min = Math.min(min, getMinOfArray(data));
                max = Math.max(max, getMaxOfArray(data));
            }
        }
        let isChange = min !== this.min && max !== this.max;
        this.min = min;
        this.max = max;
        return isChange
    }

    getValue(pixel) {
        let invertPixel = this.height - this.paddingBottom - pixel;
        let percentile = invertPixel / (this.height - this.paddingBottom);
        return Math.round(this.min + (this.max - this.min) * percentile);
    }


    getPixelByValue(value, min, max) {
        let height = this.height - this.paddingBottom;
        let percentile = (value - min) / (max - min);
        return height - height * percentile;
    }

    draw() {
        this.detectMinMax();
        let height = this.height - this.paddingBottom / 2;
        let numberOfLabels = 5;
        let padding = (height - numberOfLabels * this.heightOfLetter) / (numberOfLabels - 1);
        let startPos = height;

        this.group = createSvgElement('g');
        this.svg.append(this.group);

        for (let i = 0; i < numberOfLabels; i++) {
            this.drawHorizontalLine(0, startPos, this.width, startPos);
            this.appendLabel(10, startPos - 10, this.group, this.getValue(startPos));
            startPos -= this.heightOfLetter + padding;
        }
    }

    redraw(min, max) {
        if (this.min !== min || this.max !== max) {
            this.min = min;
            this.max = max;
            let textNodes = this.group.getElementsByTagName('text');
            for (let i = 0; i < textNodes.length; i++) {
                let pos = parseFloat(textNodes[i].getAttributeNS(null, 'y'));
                textNodes[i].innerHTML = this.getValue(pos);
            }
        }
    }
}