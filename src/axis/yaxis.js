import {getMinOfArray, getMaxOfArray} from "../tools/queries";
import {Axis} from "./axis";

export class YAxis extends Axis {
    constructor(svg, y, color='gray') {
        super(svg, y, color);

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

    getValue(pixel, id) {
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
        let numberOfLabels = 4;
        let padding = (height - numberOfLabels * this.heightOfLetter) / (numberOfLabels - 1);
        let startPos = height;

        let group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        for (let i = 0; i < numberOfLabels; i++) {
            this.drawHorizontalLine(0, startPos, this.width, startPos);
            this.appendLabel(10, startPos - 10, group, this.getValue(startPos));
            startPos -= this.heightOfLetter + padding;
        }
        this.svg.append(group);
    }

    redraw() {

    }
}