import {ColorGenerator} from './tools/colorgenerator';
import {createSvgElement, createPolyline} from './tools/svg'
import $ from 'jquery';
import {getMaxOfArray, getMinOfArray} from "./tools/queries";

export class ChartNavigation {
    constructor(el, x, data, minValue, maxValue) {
        let blackout = $('<div>', {'class': 'navigation-blackout'}).appendTo(el);
        $('<div>', {'class': 'navigation-border'}).appendTo(blackout);

        this.el = el;
        this.x = x;
        this.minValue = minValue;
        this.maxValue = maxValue;
        this.left_index = 0;
        this.right_index = x.length - 1;
        this.width = el.width();
        this.height = 90;
        this.left_border_dragging = false;
        this.right_border_dragging = false;
        this.window_is_moving = false;
        this.colorGenerator = new ColorGenerator();
        this.initEvents();
        el.append('<svg viewBox="0 0 ' + this.width + ' ' + this.height +'" class="navigation"></svg>');

        this.g = createSvgElement('g', {'class': 'plot-navigation-lines'});
        el.find('svg').append(this.g);

        this.drawLines(data);

        this.eventLeftBorderWasMoved = [];
        this.eventRightBorderWasMoved = [];
        this.eventWindowWasMoved = [];
    }

    initEvents() {
        let chart = this;
        this.el.on('mousedown', '.navigation-border', function (e) {
            if (e.offsetX <= 0) {
                chart.left_border_dragging = true;
            } else if (e.offsetX > $(this).width()) {
                chart.right_border_dragging = true;
            } else if (e.offsetX > 0 && e.offsetX < $(this).width()) {
                chart.window_is_moving = e.offsetX;
            }
        }).on('mouseup', '.navigation-border', function (e) {
            chart.left_border_dragging = false;
            chart.right_border_dragging = false;
            chart.window_is_moving = false;
        });

        this.el.on('mousemove', '.navigation-blackout', function (e) {
            let offsetLeft = parseFloat($(this).css('border-left-width'));
            let offsetRight = parseFloat($(this).css('border-right-width'));
            let border = parseFloat($(this).children().css('border-left-width'));
            let offsetX = e.pageX - 8;
            if (chart.left_border_dragging && offsetX >= border / 2 && offsetX < chart.width - border * 1.5) {
                $(this).children().css({'width': (chart.width - e.pageX + 8 - border * 1.5 - offsetRight) + 'px'});
                $(this).css({'border-left-width': (offsetX - border / 2) + 'px'});
                $(this).css({'width': (chart.width - e.pageX + 8 + border / 2 - offsetRight) + 'px'});

                chart.leftBorderWasMoved(offsetX - border / 2);
            }
            else if (chart.right_border_dragging && offsetX <= chart.width - border / 2) {
                let frameWidth = e.pageX - border * 1.5 - offsetLeft - 8;
                $(this).children().css({'width': frameWidth + 'px'});
                $(this).css({'width': (frameWidth + border * 2) + 'px'});
                $(this).css({'border-right-width': (chart.width - frameWidth - offsetLeft - border * 2) + 'px'});

                chart.rightBorderWasMoved(offsetX + border / 2);
            } else if (chart.window_is_moving) {
                let maxWidth = chart.width - $(this).width(), borderWindowWidth = $(this.children[0]).width();

                let borderLeft = Math.max(0, offsetX - chart.window_is_moving - border);
                borderLeft = Math.min(borderLeft, maxWidth);
                $(this).css({'border-left-width': borderLeft + 'px'});

                let distanceToRightBorder = borderWindowWidth - chart.window_is_moving + border;
                let borderRight = Math.max(0, chart.width - offsetX - distanceToRightBorder);
                borderRight = Math.min(borderRight, maxWidth);
                $(this).css({'border-right-width': borderRight + 'px'});

                chart.windowWasMoved(borderLeft, borderLeft + borderWindowWidth + border * 2);
            }
        });
    }

    leftBorderWasMoved(pixel) {
        let percentile = (pixel - 0) / (this.width - 0), obj = this;

        let minVal = getMinOfArray(this.x), maxVal = getMaxOfArray(this.x);
        let timestamp = Math.round(minVal + (maxVal - minVal) * percentile), index = 0;
        while (timestamp > this.x[index]) {
            index += 1;
        }
        this.left_index = index;

        this.eventLeftBorderWasMoved.forEach(function (func, i) {
            func(index, obj.right_index);
        });
    }

    rightBorderWasMoved(pixel) {
        let percentile = (pixel - 0) / (this.width - 0), obj = this;

        let minVal = this.x[0], maxVal = this.x[this.x.length - 1];
        let timestamp = Math.round(minVal + (maxVal - minVal) * percentile), index = this.x.length - 1;
        while (timestamp < this.x[index]) {
            index -= 1;
        }
        this.right_index = index;

        this.eventRightBorderWasMoved.forEach(function (func, i) {
            func(obj.left_index, index);
        });
    }

    windowWasMoved(startPixel, endPixel) {
        let startPercentile = (startPixel - 0) / (this.width - 0),
            endPercentile = (endPixel - 0) / (this.width - 0);

        let minVal = this.x[0], maxVal = this.x[this.x.length - 1];
        let startTimestamp = Math.round(minVal + (maxVal - minVal) * startPercentile);
        let endTimestamp = Math.round(minVal + (maxVal - minVal) * endPercentile);

        let startIndex = 0, endIndex = this.x.length - 1;
        while (startTimestamp > this.x[startIndex]) {
            startIndex += 1;
        }
        while (endTimestamp < this.x[endIndex]) {
            endIndex -= 1;
        }
        this.left_index = startIndex;
        this.right_index = endIndex;

        this.eventWindowWasMoved.forEach(function (func) {
            func(startIndex, endIndex);
        });
    }

    transform_value(yn) {
        let minY = this.minValue, maxY = this.maxValue;
        return this.height - ((yn - minY) / (maxY - minY)) * this.height
    }

    transform_date(xn) {
        return ((xn - this.x[0]) / (this.x[this.x.length - 1] - this.x[0])) * this.width
    }

    drawLines(data) {
        this.data = {};
        this.visible = {};
        this.colors = data.colors;

        for (let i = 0; i < data.columns.length; i++) {
            let id = data.columns[i][0];
            if (data.types[id] === 'line') {
                this.data[id] = data.columns[i].slice(1);
                this.visible[id] = true;
                this.drawLine(id, true, data.colors[id]);
            }
        }
    }

    updateLine(id) {
        let polyline = this.g.querySelector('#nav-line-'+ id);
        polyline.classList.remove("invisible");
        if (!this.visible[id]) {
            polyline.classList.add("invisible");
        }
    }

    drawLine(id, toDraw, color=null) {
        let navigator = this;
        if (!color) {
            color = this.colorGenerator.getNextColor();
        }

        let y = this.data[id], points = '';
        this.x.forEach(function (xn, i) {
            points += navigator.transform_date(navigator.x[i]) + ',' + navigator.transform_value(y[i]) + ' ';
        });

        createPolyline(this.g, {'points': points, 'fill': 'none', 'stroke': color, 'stroke-width': '1', 'id': 'nav-line-' + id});
    }

    changeVisible(lineId, isVisible) {
        this.visible[lineId] = isVisible;
        this.updateLine(lineId);
    }
}