import {ColorGenerator} from "./tools/colorgenerator";
import {createPolyline, createSvgElement, createTransform} from "./tools/svg";
import {getMaxOfArray, getMinOfArray} from "./tools/queries";
import {XAxis} from "./axis/xaxis";
import {YAxis} from "./axis/yaxis";
import $ from 'jquery';
import moment from 'moment'

export class ChartMain {
    constructor(el, data) {
        this.el = el;
        this.x = data.columns[0].slice(1);
        this.width = el.width();
        this.height = this.width / 2;
        this.format = 'MMM DD';
        this.paddingBottom = 40;
        this.minIndex = 0;
        this.maxIndex = this.x.length - 1;
        this.min = Number.POSITIVE_INFINITY;
        this.max = Number.NEGATIVE_INFINITY;

        this.minX = this.x[0];
        this.maxX = this.x[this.x.length - 1];

        this.colorGenerator = new ColorGenerator();
        this.formData(data);

        el.append('<svg viewBox="0 0 ' + this.width + ' ' + this.height +'" class="chart-svg"></svg>');
        let svg = el.find('svg');

        this.g = createSvgElement('g', {'class': 'plot-lines'});
        svg.append(this.g);

        svg.on('mousemove', this.mouseMoving.bind(this));
        svg.on('mouseover', this.mouseOver.bind(this));
        svg.on('mouseleave', this.mouseLeave.bind(this));

        this.xaxis = new XAxis(svg, data.columns[0].slice(1));
        this.yaxis = new YAxis(svg, this.data);

        this.drawLines(0, null, true);

        this.createHelpWindow(data);
    }

    createHelpWindow(data) {
        this.helpingGroup = createSvgElement('g',{'class': 'helping-group invisible'});
        $(this.el).find('svg').append(this.helpingGroup);
        let line = createSvgElement('line', {
            'class': 'vertical-line',
            'x1': 0, 'y1': this.height - this.paddingBottom / 2,
            'x2': 0, 'y2': 0,
            'fill': 'none', 'stroke': 'gray', 'stroke-width': '1'});
        this.helpingGroup.append(line);

        let helpingBlock = $('<div>', {'class': 'helping-block hide'}).appendTo(this.el);
        $('<div>', {'class': 'helping-date'}).appendTo(helpingBlock);

        let dataInfo = $('<div>', {'class': 'helping-data-info-block'}).appendTo(helpingBlock);

        for (let id in this.data) {
            let detail = $('<div>', {
                'id': 'helping-detail-' + id,
                'class': 'helping-detail',
                'css': {
                    'color': this.colors[id]
                }
            }).appendTo(dataInfo);
            $('<div>', {'class': 'helping-detail-number'}).appendTo(detail);
            $('<div>', {'class': 'helping-detail-name'}).text(data.names[id]).appendTo(detail);

            let circle = createSvgElement('circle', {
                'cx': 0, 'cy': 0, 'r': 3,
                'class': 'circle-label-' + id,
                stroke: this.colors[id], 'stroke-width': '2', 'fill': 'white'});
            this.helpingGroup.append(circle);
        }
        this.helpingBlock = helpingBlock;
    }

    mouseMoving(e) {
        let pixel = e.offsetX;
        let index = this.getIndexByTimestamp(this.xaxis.getTimestampByPixel(pixel, this.minIndex, this.maxIndex));
        $(this.helpingBlock).find('.helping-date').text(this.xaxis.getDateByIndex(index));

        for (let id in this.data) {
            if (this.visible[id]) {
                let detail = $(this.helpingBlock).find('#helping-detail-' + id);

                let value = this.data[id][index];
                detail.children('.helping-detail-number').text(value);

                let circleY = this.yaxis.getPixelByValue(value, this.min, this.max);
                let circleX = this.xaxis.getPixelByTimestamp(this.x[index], this.minIndex, this.maxIndex);

                let cirlce = this.helpingGroup.getElementsByClassName('circle-label-' + id)[0];
                cirlce.setAttributeNS(null, 'cx', circleX);
                cirlce.setAttributeNS(null, 'cy', circleY);
            }
        }

        let line = this.helpingGroup.getElementsByTagName('line')[0];
        line.setAttributeNS(null, 'x1', pixel);
        line.setAttributeNS(null, 'x2', pixel);

        let helpingBlock = $(this.el).find('.helping-block');
        let helpingBlockWidth = helpingBlock[0].offsetWidth;

        let helpingBlockPosition = Math.min(this.width - helpingBlockWidth, pixel - helpingBlockWidth / 2);
        helpingBlockPosition = Math.max(0, helpingBlockPosition);

        helpingBlock.css({'left': helpingBlockPosition + 'px'});
    }

    mouseOver() {
        $(this.el).find('.helping-block').removeClass('hide');
        this.helpingGroup.classList.remove('invisible')
    }

    mouseLeave(e) {
        if (!$(e.relatedTarget).hasClass('helping-block')) {
            $(this.el).find('.helping-block').addClass('hide');
            this.helpingGroup.classList.add('invisible');
        }
    }

    formData(data) {
        this.data = {};
        this.visible = {};
        this.colors = data.colors;

        for (let i = 0; i < data.columns.length; i++) {
            let id = data.columns[i][0];
            if (data.types[id] === 'line') {
                this.data[id] = data.columns[i].slice(1);
                this.visible[id] = true;
                if (!this.colors[id]) {
                    this.colors[id] = this.colorGenerator.getNextColor();
                }
            }
        }
    }

    detectMinMax() {
        let min = Number.POSITIVE_INFINITY, max = Number.NEGATIVE_INFINITY;
        for (let id in this.data) {
            if (this.visible[id]) {
                let data = this.data[id].slice(this.minIndex, this.maxIndex);
                min = Math.min(min, getMinOfArray(data));
                max = Math.max(max, getMaxOfArray(data));
            }
        }
        let isChange = min !== this.min && max !== this.max;
        this.prevMin = Number.isFinite(this.min) ? this.min : min;
        this.min = min;
        this.prevMax = Number.isFinite(this.max) ? this.max : max;
        this.max = max;
        return isChange
    }

    getIndexByTimestamp(timestamp) {
        let index = 0;
        while (timestamp > this.x[index]) {
            index += 1;
        }
        if (timestamp - this.x[index - 1] < this.x[index] - timestamp) {
            index -= 1;
        }
        return index;
    }

    transform_value(yn, min=null, max=null) {
        if (!min) {
            min = this.min;
            max = this.max;
        }
        let height = this.height - this.paddingBottom;
        return height - ((yn - min) / (max - min)) * height
    }

    transform_date(xn) {
        return ((xn - this.minX) / (this.maxX - this.minX)) * this.width
    }

    drawLine(id, start_index=0, end_index=null, animate=false) {
        let polyline = $(this.g).find('>#chart-line-' + id)[0];

        if (polyline && !this.visible[id]) {
            polyline.remove();
        }

        if (this.visible[id]) {
            let Y = this.data[id], points = '', newPoints = '';
            for (let i = start_index; i <= end_index; i++) {
                let x = this.transform_date(this.x[i]);
                points += x + ',' + this.transform_value(Y[i], this.prevMin, this.prevMax) + ' ';
                newPoints += x + ',' + this.transform_value(Y[i]) + ' ';
            }

            if (!polyline) {
                createPolyline(this.g, {
                    'points': newPoints,
                    'fill': 'none',
                    'id': 'chart-line-' + id,
                    'stroke-width': '1', 'stroke': this.colors[id]});
            } else {
                if (!animate) {
                    let animateElem = polyline.childNodes[0];
                    if (animateElem) {
                        animateElem.remove();
                    }
                    polyline.setAttributeNS(null, 'points', newPoints);
                } else {
                    polyline.setAttributeNS(null, 'points', points);

                    let animateElem = createTransform('points', points, newPoints);
                    polyline.append(animateElem);
                    animateElem.beginElement();
                }
            }
        }
    }

    drawLines(start_index=0, end_index=null, animate=false) {
        if (!end_index) {
            end_index = this.x.length - 1;
        }

        this.minIndex = start_index;
        this.maxIndex = end_index;

        this.detectMinMax();

        this.minX = this.x[start_index];
        this.maxX = this.x[end_index];

        for (let id in this.data) {
            this.drawLine(id, start_index, end_index, animate);
        }
    }

    moveLeft(start_index, end_index) {
        this.drawLines(start_index, end_index);

        this.xaxis.redraw(start_index, end_index);
        this.yaxis.redraw();
    }

    moveRight(start_index, end_index) {
        this.drawLines(start_index, end_index);

        this.xaxis.redraw(start_index, end_index);
        this.yaxis.redraw();
    }

    moveWindow(start_index, end_index) {
        this.drawLines(start_index, end_index);

        this.xaxis.redraw(start_index, end_index);
        this.yaxis.redraw();
    }

    changeVisible(lineId, isVisible) {
        this.visible[lineId] = isVisible;

        this.drawLines(this.minIndex, this.maxIndex, true);

        this.yaxis.redraw(this.min, this.max);
    }
}