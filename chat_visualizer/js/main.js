
var sectionColorScale  = d3.scaleOrdinal()
    .range(["#8073ac", "#feb24c"])
    .domain(["A", "B"]);

var totalBarChart;
var timeLineChart;
var studentChart;
var dateList = [];
var chosenDates;
var selectedStudent = null;
var studentSelected = false;
var channelLookup = {};
var channels = [];

d3.json("data/chat_history.json", function(data) {

    data.forEach(function(d, i) {
        d.id = i;
        if (!(d.channel in channelLookup)) {
            channelLookup[d.channel] = 1;
            channels.push(d.channel);
        }
    });

    channels.sort();

    channels.forEach(function(d) {
       d3.select('#channel-selector').append('option').attr('value', d).text('#' + d);
    });

    $('#channel-selector').multiselect({
        inheritClass: true,
        includeSelectAllOption: true,
        selectAllValue: 'all',
    });

    $('#channel-selector').multiselect('selectAll', false);
    $('#channel-selector').multiselect('updateButtonText');

    data.forEach(function(d) {
       d.ts = d3.timeParse('%Y-%m-%d %H:%M:%S')(d.ts);
       d.ts = new Date(d.ts.getFullYear(), d.ts.getMonth(), d.ts.getDate());
    });

    var dateExtent = d3.extent(data, function(d) { return d.ts});
    var initialDate = dateExtent[0];
    var numDays = Math.round((dateExtent[1] - initialDate)/(1000*60*60*24));
    for (var i = 0; i <= numDays; i++) {
        var dateToAdd = new Date(initialDate.getFullYear(), initialDate.getMonth(), initialDate.getDate());
        dateList.push(dateToAdd);
        dateList[i] = new Date(dateList[i].setDate(dateList[i].getDate() + i));
    }
    chosenDates = [dateList[0], dateList[-1]];

    totalBarChart = new BarChart('total-comparison-chart', data);
    timeLineChart = new LineChart('time-comparison-chart', data);
    studentChart = new FrequencyChart('student-viewer-chart', data);

    createSlider();
});

function updateCharts() {
    studentSelected = false;
    selectedStudent = null;
    d3.select('#total-comparison-chart').select('.x-axis').selectAll('text')
        .attr('fill', 'black');
    totalBarChart.wrangleData();
    timeLineChart.wrangleData();
    studentChart.wrangleData();
}

function createSlider() {
    var slider = document.getElementById('slider');

    noUiSlider.create(slider, {
        start: [0, dateList.length - 1],
        connect: true,
        range: {
            'min':[0, 1],
            'max':[dateList.length - 1]
        }
    });

    slider.noUiSlider.on('update', function(values, handle) {
        var chosenDate = dateList[Math.floor(values[handle])];
        $("#date_" + handle).html(d3.timeFormat('%b %d')(chosenDate));
        chosenDates[handle] = chosenDate;
        console.log(chosenDates);
        totalBarChart.wrangleData();
        timeLineChart.wrangleData();
        studentChart.wrangleData();
    });

}