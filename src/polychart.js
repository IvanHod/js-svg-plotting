import $ from 'jquery'
import {ChartMain} from "./chartmain";
import {ChartNavigation} from "./chartnav";

export class Polychart {
    constructor(el, width, data) {
        this.el = el;
        this.width = width;
        this.eventsCheckboxWasChanged = [];

        let mainBlock = $('<div>', {'class': 'chart-main'}).appendTo(el);
        this.chart = new ChartMain(mainBlock, data);

        let navigationBlock = $('<div>', {'class': 'chart-navigation'}).appendTo(el);
        this.navigation = new ChartNavigation(navigationBlock,
            this.chart.x, data,
            this.chart.min, this.chart.max);

        this.onLeftBorderWasMoved(this.chart, this.chart.moveLeft);
        this.onRightBorderWasMoved(this.chart, this.chart.moveRight);
        this.onWindowWasMoved(this.chart, this.chart.moveWindow);

        this.createLabels(data, $('<div>', {'class': 'chart-labels'}).appendTo(el));

        this.onCheckboxWasChanged(this.chart, this.chart.changeVisible);
        this.onCheckboxWasChanged(this.navigation, this.navigation.changeVisible);
    }

    createLabels(data, el) {
        let chart = this;
        for (let name in data.names) {
            let parentDiv = $('<div>', {'class': 'checkbox-block'}).appendTo(el);
            let roundDiv = $('<div>', {'class': 'round'}).appendTo(parentDiv);
            let input = $('<input>', {
                'type': 'checkbox',
                'checked': 'checked',
                'value': name,
                'id': 'checkbox-' + name
            }).appendTo(roundDiv);

            $('<label>', {
                'class': 'checkbox-container',
                'for': 'checkbox-' + name,
                'css': {
                    'backgroundColor': data.colors[name],
                    'borderColor': data.colors[name]
                }
            }).appendTo(roundDiv);
            $('<label>', {'class': 'checkbox-label', 'for': 'checkbox-' + name}).text(data.names[name]).appendTo(parentDiv);

            input.change(function (e) {
                let id = e.target.id.replace('checkbox-', '');

                chart.eventsCheckboxWasChanged.forEach(function (func) {
                    func(id, e.target.checked);
                });
            })
        }
    }

    onLeftBorderWasMoved(_class, func) {
        this.navigation.eventLeftBorderWasMoved.push(func.bind(_class));
    }

    onRightBorderWasMoved(_class, func) {
        this.navigation.eventRightBorderWasMoved.push(func.bind(_class));
    }

    onWindowWasMoved(_class, func) {
        this.navigation.eventWindowWasMoved.push(func.bind(_class));
    }

    onCheckboxWasChanged(_class, func) {
        this.eventsCheckboxWasChanged.push(func.bind(_class));
    }
}