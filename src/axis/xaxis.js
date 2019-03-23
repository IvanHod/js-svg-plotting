import {createSvgElement} from "../tools/svg";
import {Axis} from "./axis";
import $ from 'jquery';
import moment from 'moment';

export class XAxis extends Axis {
    constructor(svg, x, color='gray') {
        super(svg, x, color);

        this.format = 'MMM DD';
        this.level = 1;
        this.left_offset = 0;
        this.right_offset = 0;

        this.draw();
    }

    getDateByIndex(index) {
        return moment(this.data[index]).format(this.format);
    }

    getTimestampByPixel(pixel, start_index = 0, end_index = -1) {
        if (end_index === -1) {
            end_index = this.data.length - 1
        }
        let minVal = this.data[start_index], maxVal = this.data[end_index];

        let percentile = (pixel - 0) / (this.width - 0);
        return Math.round(minVal + (maxVal - minVal) * percentile);
    }

    getDateByPixel(pixel, start_index = 0, end_index = -1) {
        let timestamp = this.getTimestampByPixel(pixel, start_index, end_index);

        return moment(timestamp).format(this.format);
    }

    getPixelByTimestamp(timestamp, start_index = 0, end_index = -1) {
        if (end_index === -1) {
            end_index = this.data.length - 1
        }
        let minVal = this.data[start_index], maxVal = this.data[end_index];
        let percentile = (timestamp - minVal) / (maxVal - minVal);
        return this.width * percentile;
    }

    calcDatesAndPixels(min_index, max_index) {
        let datesPixelsDict = {};
        for (let i = 0; i < this.data.length; i++) {
            datesPixelsDict[this.getDateByIndex(i, min_index, max_index)] = this.getPixelByTimestamp(this.data[i], min_index, max_index);
        }
        this.datesPixelsDict = datesPixelsDict;
    }

    draw(min_index, max_index) {
        this.calcDatesAndPixels(min_index, max_index);
        let widthOfWord = this.widthOfLetter * this.format.length;
        let startPos = widthOfWord / 4;
        let lastPos = this.width - startPos;

        let numberWords = Math.ceil(((lastPos - startPos) / widthOfWord) / 2);
        let padding = (lastPos - startPos - widthOfWord * numberWords) / (numberWords - 1);

        let group = createSvgElement('g', {'class': 'xaxis'});
        this.svg.append(group);

        for (let i = 0; i < numberWords; i++) {
            let date = this.getDateByPixel(startPos + widthOfWord / 2);
            this.appendLabel(startPos, this.height, group, date, {'class': 'level-0'});
            startPos += widthOfWord + padding;
        }
    }

    static getMovingCoordinate(elem, isTransform=true, isStart=true) {
        let x = parseFloat(elem.getAttributeNS(null, 'x'));
        let transform = elem.getAttributeNS(null, 'transform');
        let width = isStart === true ? 0 : elem.getBBox().width;

        if (transform) {
            transform = parseFloat(transform.replace('translate(', '').replace(')', ''))
        }
        return x + (isTransform && transform ? transform : 0) + width;
    }

    redraw(start_index, end_index) {
        let axis = this, padding = this.widthOfLetter * this.format.length;

        let points = $(this.svg).find('polyline')[0].getAttributeNS(null, 'points').split(' ').slice(0, 2);

        let delta = parseFloat(points[1].split(',')[0]) - parseFloat(points[0].split(',')[0]);
        let leftWidth = delta * end_index;
        let rightWidth = delta * (this.data.length - 1 - start_index);

        let labels = $(this.svg).find('g.xaxis')[0].childNodes;
        labels.forEach(function (textElement, i) {
            let currentPixel = axis.width - XAxis.getMovingCoordinate(textElement, false);
            let leftOffset = currentPixel - ((currentPixel * leftWidth) / (axis.width));

            currentPixel = XAxis.getMovingCoordinate(textElement, false);
            let rightOffset = currentPixel - (currentPixel * rightWidth) / axis.width;

            textElement.setAttributeNS(null, 'transform', 'translate(' + (leftOffset - rightOffset) + ')');
        });

        this.updateOpacity(labels);
    }

    updateOpacity(labels) {
        let firstX = XAxis.getMovingCoordinate(labels[0], true, false),
            secondX = XAxis.getMovingCoordinate(labels[1], true),
            thirdX = XAxis.getMovingCoordinate(labels[2], true);
        let distance = XAxis.getMovingCoordinate(labels[0], false, false) - XAxis.getMovingCoordinate(labels[0], false, true);

        let opacity = (((thirdX - firstX) / distance) - 1) * 4;
        if (opacity > 2 && ((secondX - firstX) / distance) >= 1) {
            this.appendNextLevel(0);
            this.level += 1;
        } else if (opacity < 0) {
            $(this.svg).find('g.xaxis .level-' + (this.level - 1)).remove();
            this.level -= 1;
        } else if (opacity > 0) {
            let labels = $(this.svg).find('g.xaxis .level-' + (this.level - 1));
            labels.each(function (i, elem) {
                elem.setAttributeNS(null, 'opacity', opacity);
            })
        }

    }

    appendNextLevel(opacity) {
        let g = $(this.svg).find('g.xaxis'), widthOfWord = this.widthOfLetter * this.format.length;
        let labels = $(this.svg).find('g.xaxis .level-' + this.level);
        if (!labels.length) {
            let prevLabels = $(this.svg).find('g.xaxis text');
            let n = prevLabels.length - 1;
            for (let i = 0; i < n; i++) {
                let currentEndPos = XAxis.getMovingCoordinate(prevLabels[i], false, false);
                let nextStartPos = XAxis.getMovingCoordinate(prevLabels[i + 1], false, true);

                let newStartPos = currentEndPos + (nextStartPos - currentEndPos - widthOfWord) / 2;
                let date = this.getDateByPixel(newStartPos + (widthOfWord / 2));
                let text = this.appendLabel(newStartPos, this.height, g, date, {'class': 'level-' + this.level, 'opacity': opacity}, prevLabels[i]);

                text.setAttributeNS(null, 'x', currentEndPos + (nextStartPos - currentEndPos - text.getBBox().width) / 2);
                text.innerHTML = this.getDateByPixel(newStartPos + (text.getBBox().width / 2));
            }
        }
    }
}