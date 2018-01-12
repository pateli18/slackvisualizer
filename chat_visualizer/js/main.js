
var sectionColorScale  = d3.scaleOrdinal()
    .range(["#8073ac", "#feb24c"])
    .domain(["A", "B"]);

var totalBarChart;
var timeLineChart;
var studentChart;
var slackDateList = [];
var slackChosenDates;
var selectedStudent = null;
var studentSelected = false;
var channelLookup = {};
var channels = [];
var trelloFullDateList = [];
var trelloDateDomain = [];
var trelloActionList = [];
var trelloChosenDates;

var trelloTimeChart;
var trelloMemberChart;

queue()
    .defer(d3.json, "data/slack_chat_history.json")
    .defer(d3.json, "data/trello_action_history.json")
    .await(function(error, slackData, trelloData){

    // process Slack Data
    slackData.forEach(function(d, i) {
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

    slackData.forEach(function(d) {
       d.ts = d3.timeParse('%Y-%m-%d %H:%M:%S')(d.ts);
       d.ts = new Date(d.ts.getFullYear(), d.ts.getMonth(), d.ts.getDate());
    });

    var dateExtent = d3.extent(slackData, function(d) { return d.ts});
    var initialDate = dateExtent[0];
    var numDays = Math.round((dateExtent[1] - initialDate)/(1000*60*60*24));
    for (var i = 0; i <= numDays; i++) {
        var dateToAdd = new Date(initialDate.getFullYear(), initialDate.getMonth(), initialDate.getDate());
        slackDateList.push(dateToAdd);
        slackDateList[i] = new Date(slackDateList[i].setDate(slackDateList[i].getDate() + i));
    }
    slackChosenDates = [slackDateList[0], slackDateList[-1]];

    totalBarChart = new BarChart('total-comparison-chart', slackData);
    timeLineChart = new LineChart('time-comparison-chart', slackData);
    studentChart = new FrequencyChart('student-viewer-chart', slackData);

    createSlider('slack-slider', 'slack_date', slackDateList.length - 1, slackChosenDates, slackDateList, slackChartUpdate);

    // process Trello Data

    var trelloDateListChecker = {};
    var trelloDateList = [];
    var trelloActionChecker = {};

    for (var board in trelloData) {
        d3.select('#group-selector').append('option').attr('value', board).text(trelloData[board].name);
        var action_count = 0;
       trelloData[board].actions.forEach(function(a, i) {
          a.time = d3.timeParse('%Y-%m-%d')(a.time);
          /*
          if (i > 0 && a.time.getTime() === trelloData[board].actions[i - 1].time.getTime()) {
              action_count += 1;
          } else {
              action_count = 0;
          }
          a.item_count = action_count;
          a.id = board + '-' + i;
            */
           if (a.type in trelloActionChecker) {
           } else {
               trelloActionList.push(a.type);
               trelloActionChecker[a.type] = 1;
           }

          if (a.time in trelloDateListChecker) {
          } else{
              trelloDateList.push(a.time);
              trelloDateListChecker[a.time] = 1;
          }
       });
    }

    trelloActionList.forEach(function(d) {
        d3.select('#action-selector').append('option').attr('value', d).text(d);
    });

    $('#action-selector').multiselect({
        inheritClass: true,
        includeSelectAllOption: true,
        selectAllValue: 'all',
    });

    $('#action-selector').multiselect('selectAll', false);
    $('#action-selector').multiselect('updateButtonText');

    var firstTrelloDate = d3.min(trelloDateList);
    slackDateList.forEach(function(d) {
        if (d >= firstTrelloDate) {
            trelloFullDateList.push(d);
            trelloDateDomain.push(d3.timeFormat('%b %d')(d));
        }
    });

    trelloChosenDates = [trelloFullDateList[0], trelloFullDateList[trelloFullDateList.length - 1]];


    trelloTimeChart = new TrelloBar('trello-time-comparison-chart', trelloData, 'time');
    trelloMemberChart = new TrelloBar('trello-member-comparison-chart', trelloData, 'member');

    createSlider('trello-slider', 'trello_date', trelloFullDateList.length - 1, trelloChosenDates, trelloFullDateList, updateTrelloCharts);

});

function updateCharts() {
    studentSelected = false;
    selectedStudent = null;
    d3.select('#total-comparison-chart').select('.x-axis').selectAll('text')
        .attr('fill', 'black');
    slackChartUpdate();
}

function slackChartUpdate() {
    totalBarChart.wrangleData();
    timeLineChart.wrangleData();
    studentChart.wrangleData();
}

function createSlider(sliderId, dateId, itemCount, chosenDates, dateList, updateFunction) {
    var slider = document.getElementById(sliderId);


    noUiSlider.create(slider, {
        start: [0, itemCount],
        connect: true,
        range: {
            'min':[0, 1],
            'max':[itemCount]
        }
    });

    slider.noUiSlider.on('update', function(values, handle) {
        var chosenDate = dateList[Math.floor(values[handle])];
        $("#" + dateId + '_' + handle).html(d3.timeFormat('%b %d')(chosenDate));
        chosenDates[handle] = chosenDate;
        updateFunction();
    });

}

function updateTrelloCharts() {
    trelloTimeChart.wrangleData();
    trelloMemberChart.wrangleData();
}

$(function() {
    $('#fullPage')
        .fullpage({

            navigation: true,
            menu: '#main-menu',
            verticalCentered: false,


        });
});