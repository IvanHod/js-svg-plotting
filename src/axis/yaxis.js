import {getMinOfArray, getMaxOfArray} from "../tools/queries";
import {Axis} from "./axis";

export class YAxis extends Axis {
    constructor(svg, y, color='gray') {
        super(svg, y, color);

        this.draw();
    }

    getValue(pixel, id) {
        let invertPixel = this.height - this.paddingBottom - pixel;
        let percentile = invertPixel / (this.height - this.paddingBottom);
        let minVal = getMinOfArray(this.data), maxVal = getMaxOfArray(this.data);
        return Math.round(minVal + (maxVal - minVal) * percentile);
    }

    getPixelByValue(value, min, max) {
        let height = this.height - this.paddingBottom;
        let percentile = (value - min) / (max - min);
        return height - height * percentile;
    }

    draw() {
        let height = this.height - this.paddingBottom / 2;
        let numberOfLabels = 4;
        let padding = (height - numberOfLabels * this.heightOfLetter) / (numberOfLabels - 1);
        let startPos = height;

        let group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        for (let i = 0; i < numberOfLabels; i++) {
            if (i > 0) {
                this.drawHorizontalLine(0, startPos, this.width, startPos);
            }
            this.appendLabel(10, startPos - 10, group, this.getValue(startPos));
            startPos -= this.heightOfLetter + padding;
        }
        this.svg.append(group);
    }

    redraw() {

    }
}