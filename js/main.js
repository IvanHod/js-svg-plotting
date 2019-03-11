$(document).ready(function () {
    $.getJSON("chart_data.json", function(json) {
        var chart = new Chart($('#chart'), 800, json[0]);
    });
});
