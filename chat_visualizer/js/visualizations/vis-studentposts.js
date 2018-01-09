FrequencyChart = function(_parentElement, _data){
    this.parentElement = _parentElement;
    this.data = _data;
    this.displayData = _data;

    this.initVis();
};

FrequencyChart.prototype.initVis = function() {
var vis=this;

    vis.margin = { top: 30, right: 20, bottom: 150, left: 50 };
    vis.width = $('#' + vis.parentElement).width() - vis.margin.left - vis.margin.right;
    vis.height = 400 - vis.margin.top - vis.margin.bottom;

    vis.svg = d3.select("#" + vis.parentElement)
        .append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top +
            ")");

    vis.xScale = d3.scaleBand()
        .rangeRound([0, vis.width])
        .padding(0.15)
        .domain(channels);

    vis.yScale = d3.scaleBand()
        .rangeRound([vis.height, 0]);

    vis.xAxis = d3.axisBottom()
        .scale(vis.xScale);

    vis.svg.append("g")
        .attr("class", "x-axis axis")
        .attr("transform", "translate(0," + vis.height + ")");

    vis.wrangleData()
};

FrequencyChart.prototype.wrangleData = function() {
    var vis = this;

    vis.displayData = vis.data.filter(function(d) {
       return d.user === selectedStudent;
    });

    vis.displayData = vis.displayData.filter(function(d) {
        return (d.ts >= chosenDates[0] && d.ts <= chosenDates[1]);
    });

    vis.channelVal = $('#channel-selector').val();
    if (!Array.isArray(vis.channelVal)) {
        vis.channelVal = [vis.channelVal];
    }

    var channelsSelected = {};
    vis.channelVal.forEach(function(d) {
        channelsSelected[d] = 1;
    });

    vis.displayData = vis.displayData.filter(function(d) {
        return (d.channel in channelsSelected);
    });

    vis.displayData.sort(function (a, b) {
        return b.channel - a.channel;
    })

    var counter = 1;
    vis.displayData.forEach(function(d, i) {
        if (i > 0 && vis.displayData[i - 1].channel === d.channel) {
            d.value = counter;
            counter += 1;
        } else {
            d.value = 1;
            counter = 2;
        }
    });

    var maxValue = d3.max(vis.displayData, function(d) {
        return d.value;
    });

    maxValue = Math.max(maxValue, channels.length);

    var yDomain = [];
    for (var i = 1; i <= maxValue; i++) {
        yDomain.push(i);
    }
    vis.yScale.domain(yDomain);

    vis.updateVis();
};


FrequencyChart.prototype.updateVis = function() {
    var vis=this;

    vis.svg.selectAll('#selection-prompt').remove();
    if (!studentSelected) {
        vis.svg.append('text')
            .attr('x', vis.width / 5)
            .attr('y', vis.height / 2.5)
            .text('Click User Bar to View History')
            .attr('id', 'selection-prompt');
    }

    var circle = vis.svg.selectAll('.student-post')
        .data(vis.displayData, function(d) {
            return d.id;
        });

    circle.exit().remove();

    circle.enter()
        .append('circle')
        .attr('class', 'student-post')
        .on('mouseover', function(d) {
            $('#comment-date').html(d3.timeFormat('%B %d')(d.ts));
            $('#comment-channel').html(d.channel);
            $('#comment-text').html(d.text);
        })
        .merge(circle)
        .transition()
        .duration(1000)
        .attr('cx', function(d) {
            return vis.xScale(d.channel);
        })
        .attr('cy', function(d) {
            return vis.yScale(d.value);
        })
        .attr('r', vis.yScale.bandwidth() / 2)
        .attr('fill', function(d) {
            return sectionColorScale(d.section);
        });

    vis.svg.select(".x-axis").transition().duration(1000).call(vis.xAxis)
        .selectAll("text")
        //.attr("y", 50)
        //.attr("x", -30)
        .attr("dy", "-.2em")
        .attr("dx", "-.9em")
        .attr("transform", "rotate(-60)")
        .style("text-anchor", "end");

};