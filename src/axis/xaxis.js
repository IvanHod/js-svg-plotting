import {createSvgElement} from "../tools/svg";
import {Axis} from "./axis";

var monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];
var daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function moment(time, format) {
    let date = new Date(time), res = format;
    if (format.indexOf('DDD') > -1) {
        res = res.replace('DDD', daysOfWeek[date.getDay()]);
    }
    if (format.indexOf('MMM') > -1) {
        res = res.replace('MMM', monthNames[date.getMonth()]);
    }
    if (format.indexOf('DD') > -1) {
        let day = date.getDate();
        res = res.replace('DD', day > 9 ? day : ('0' + day));
    }
    return res;
}

export class XAxis extends Axis {
    constructor(svg, x, width, height, color='gray') {
        super(svg, x, width, height, color);

        this.format = 'MMM DD';
        this.level = 1;
        this.left_offset = 0;
        this.right_offset = 0;

        this.g = createSvgElement('g', {'class': 'xaxis'});
        this.svg.append(this.g);

        this.draw();
    }

    getDateByIndex(index) {
        return moment(this.data[index], this.format);
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

        return moment(timestamp, this.format);
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

        let y = this.height - 3;
        for (let i = 0; i < numberWords; i++) {
            let date = this.getDateByPixel(startPos + widthOfWord / 2);
            this.appendLabel(startPos, y, this.g, date, {'class': 'level-0'});
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

        let points = this.svg.getElementsByTagName('polyline')[0]
            .getAttributeNS(null, 'points').split(' ').slice(0, 2);

        let delta = parseFloat(points[1].split(',')[0]) - parseFloat(points[0].split(',')[0]);
        let leftWidth = delta * end_index;
        let rightWidth = delta * (this.data.length - 1 - start_index);

        let labels = this.g.childNodes;
        labels.forEach(function (textElement) {
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
            let labels = this.g.getElementsByClassName('level-' + (this.level - 1));
            let n = labels.length;
            for (let i = n - 1; i >= 0; i--) {
                labels[i].remove();
            }
            this.level -= 1;
        } else if (opacity > 0) {
            let labels = this.g.getElementsByClassName('level-' + (this.level - 1));
            for (let i = 0; i < labels.length; i++) {
                labels[i].setAttributeNS(null, 'opacity', opacity);
            }
        }

    }

    appendNextLevel(opacity) {
        let widthOfWord = this.widthOfLetter * this.format.length, height = this.height - 3;
        let labels = this.g.getElementsByClassName('level-' + this.level);
        if (!labels.length) {
            let prevLabels = this.g.getElementsByTagName('text');
            let n = prevLabels.length - 1;
            for (let i = 0; i < n; i++) {
                let j = i * 2;
                let currentEndPos = XAxis.getMovingCoordinate(prevLabels[j], false, false);
                let nextStartPos = XAxis.getMovingCoordinate(prevLabels[j + 1], false, true);

                let newStartPos = currentEndPos + (nextStartPos - currentEndPos - widthOfWord) / 2;
                let date = this.getDateByPixel(newStartPos + (widthOfWord / 2));

                let text = this.appendLabel(newStartPos, height, this.g, date, {
                    'class': 'level-' + this.level,
                    'opacity': opacity
                }, prevLabels[i * 2]);

                newStartPos = currentEndPos + (nextStartPos - currentEndPos - text.getBBox().width) / 2;
                text.setAttributeNS(null, 'x', newStartPos);
                text.innerHTML = this.getDateByPixel(newStartPos + (text.getBBox().width / 2));
            }
        }
    }
}