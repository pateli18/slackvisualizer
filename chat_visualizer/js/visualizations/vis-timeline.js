
LineChart = function(_parentElement, _data){
    this.parentElement = _parentElement;
    this.data = _data;
    this.displayData = _data;

    // for event handler

    this.initVis();
};

LineChart.prototype.initVis = function() {
    var vis = this;
    vis.margin = {top: 10, right: 20, bottom: 50, left: 50};

    vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right;
    vis.height = 170 - vis.margin.top - vis.margin.bottom;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    vis.xScale = d3.scaleTime()
        .range([0, vis.width]);

    vis.yScale = d3.scaleLinear()
        .range([vis.height, 0]);

    vis.xAxis = d3.axisBottom()
        .scale(vis.xScale);

    vis.yAxis = d3.axisLeft()
        .scale(vis.yScale)
        .ticks(5);

    vis.svg.append("g")
        .attr("class", "x-axis axis")
        .attr("transform", "translate(0," + vis.height + ")");

    vis.svg.append("g")
        .attr("class", "y-axis axis");

// draw line
    vis.line = d3.line()
        .x(function(d){ return vis.xScale(d.date);})
        .y(function(d){return vis.yScale(d.value);})
        .curve(d3.curveCardinal);

    vis.svg.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", vis.width)
        .attr("height", vis.height);

    vis.wrangleData();

};

LineChart.prototype.wrangleData = function() {
    var vis = this;

    vis.sectionVal = $('#section-selector').val();
    if (vis.sectionVal != 'all') {
        vis.displayData = vis.data.filter(function(d) {
            return d.section == vis.sectionVal;
        });
    } else {
        vis.displayData = vis.data;
    }

    vis.xScale.domain(chosenDates);

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

    vis.displayData.sort(function(a, b) {
        return a.ts - b.ts;
    });

    vis.metricVal = $('#metric-selector').val();

    vis.displayData = d3.nest()
        .key(function(d) { return d.user + '-' + d.section; })
        .key(function(d) { return d.ts})
        .rollup(function(v) { return d3.sum(v, function(d) { return d[vis.metricVal]; }); })
        .entries(vis.displayData);

    vis.yScale.domain([0, d3.max(vis.displayData, function(d) {
        return d3.max(d.values, function(v) { return v.value; });
    }) + 1]);

    vis.displayData.forEach(function(d) {
        var allDateValues = [];
        var counter = 0;
        dateList.forEach(function(date) {
           if (counter < d.values.length && date.getTime() === new Date(d.values[counter].key).getTime()) {
               allDateValues.push({date:date, value: d.values[counter].value});
               counter += 1;
           } else {
               allDateValues.push({date:date, value: 0});
           }
        });
        d.values = allDateValues;
    });

    vis.updateVis();

};


LineChart.prototype.updateVis = function() {
    var vis = this;

    //draw line
    var rideLine = vis.svg.selectAll(".student-line")
        .data(vis.displayData, function(d) {
            return d.key;
        });

    rideLine.enter().append("path")
        .attr("class", "student-line")
        .merge(rideLine)
        .transition()
        .duration(1000)
        .attr("d", function(d) {
            return vis.line(d.values);
        })
        .style("stroke", function(d){
            if (studentSelected) {
                if (d.key.split('-')[0] === selectedStudent) {
                    return sectionColorScale(d.key.split('-')[1]);
                } else {
                    return 'lightgrey';
                }
            } else {
                return sectionColorScale(d.key.split('-')[1]);
            }
        })
        .style("opacity", function(d) {
            if (studentSelected) {
                if (d.key.split('-')[0] === selectedStudent) {
                    return 1;
                } else {
                    return 0.1;
                }
            } else {
                return 1;
            }
        })
        .style("stroke-width", "2.5px")
        .attr('fill', 'none');

    rideLine.exit().remove();

    vis.svg.select(".x-axis").transition().duration(1000).call(vis.xAxis)
        .selectAll("text")
        //.attr("y", 50)
        //.attr("x", -30)
        .attr("dy", "-.2em")
        .attr("dx", "-.9em")
        .attr("transform", "rotate(-60)")
        .style("text-anchor", "end");
    vis.svg.select(".y-axis").transition().duration(1000).call(vis.yAxis);
    
};


