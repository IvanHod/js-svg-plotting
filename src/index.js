import {Polychart} from './polychart';
import json from '../chart_data.json'
import $ from 'jquery'

$(document).ready(function () {
    let charts = $('#charts');

    json.forEach(function (el) {
        let chartBlock = $('<div>', {'id': 'chart', 'class': 'polychart'}).appendTo(charts);

        new Polychart(chartBlock, 600, el);
    });

});