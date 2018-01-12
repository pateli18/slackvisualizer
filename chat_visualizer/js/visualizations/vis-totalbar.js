
BarChart = function(_parentElement, _data) {
    this.parentElement = _parentElement;
    this.data = _data;
    this.displayData = _data;

    this.initVis();
};

BarChart.prototype.initVis = function() {
  var vis = this;

    vis.margin = { top: 30, right: 20, bottom: 150, left: 50 };

    vis.width = $('#' + vis.parentElement).width() - vis.margin.left - vis.margin.right,
        vis.height = 350 - vis.margin.top - vis.margin.bottom;

    vis.svg = d3.select('#' + vis.parentElement)
        .append('svg')
        .attr('width', vis.width + vis.margin.left + vis.margin.right)
        .attr('height', vis.height + vis.margin.top + vis.margin.bottom)
        .attr('class', 'regular-bar')
        .append('g')
        .attr('transform', "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    vis.xScale = d3.scaleBand()
        .rangeRound([0, vis.width])
        .padding(0.15);

    vis.yScale = d3.scaleLinear()
        .range([vis.height, 0]);

    vis.xAxis = d3.axisBottom()
        .scale(vis.xScale);

    vis.yAxis = d3.axisLeft()
        .scale(vis.yScale);

    vis.svg.append("g")
        .attr("class", "x-axis axis")
        .attr("transform", "translate(0," + vis.height + ")");

    vis.svg.append("g")
        .attr("class", "y-axis");

    vis.toolTip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-8, 0]);

    vis.wrangleData(); 
};

BarChart.prototype.wrangleData = function() {
    var vis = this;

    vis.sectionVal = $('#section-selector').val();
    if (vis.sectionVal != 'all') {
        vis.displayData = vis.data.filter(function(d) {
            return d.section == vis.sectionVal;
        });
    } else {
        vis.displayData = vis.data;
    }

    vis.displayData = vis.displayData.filter(function(d) {
        return (d.ts >= slackChosenDates[0] && d.ts <= slackChosenDates[1]);
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

    vis.metricVal = $('#metric-selector').val();

    vis.displayData = d3.nest()
        .key(function(d) { return d.user + '-' + d.section; })
        .rollup(function(v) { return d3.sum(v, function(d) { return d[vis.metricVal]; }); })
        .entries(vis.displayData);

    vis.displayData.forEach(function(d) {
        var user_info  = d.key.split('-');
        d.name = user_info[0];
        d.section = user_info[1];
    });

    vis.displayData.sort(function(a, b) {
        return b.value - a.value;
    });

    vis.updateData();
};

BarChart.prototype.updateData = function() {
    var vis = this;

    vis.xScale.domain(vis.displayData.map(function(d) { return d.name; }));
    vis.yScale.domain([0, d3.max(vis.displayData, function(d) { return d.value; })]);

    vis.toolTip.html(function(d) {
        return d.value + ' ' + $('#metric-selector').find(':selected').text();
    });

    vis.svg.call(vis.toolTip);

    var bars = vis.svg.selectAll('.total-bar')
        .data(vis.displayData, function(d) {
            return d.name;
        });

    bars.enter()
        .append('rect')
        .attr('class', 'total-bar')
        .on('mouseover', vis.toolTip.show)
        .on('mouseout', vis.toolTip.hide)
        .on('click', function(d) {
            if (selectedStudent === d.name) {
                updateCharts();
            } else {
                studentSelected = true;
                selectedStudent = d.name;
                studentChart.wrangleData();
                timeLineChart.wrangleData();
                vis.wrangleData();
                d3.select('#total-comparison-chart').select('.x-axis').selectAll('text')
                    .attr('fill', function(d) {
                        if (d === selectedStudent) {
                            return 'black';
                        } else {
                            return 'lightgrey';
                        }
                    });
            }
        })
        .merge(bars)
        .transition()
        .duration(1000)
        .attr('fill', function(d) {
            if (studentSelected) {
                if (d.name === selectedStudent) {
                    return sectionColorScale(d.section);
                } else {
                    return 'lightgrey';
                }
            } else {
                return sectionColorScale(d.section);
            }
        })
        .attr('x', function(d) {
            return vis.xScale(d.name);
        })
        .attr('y', function(d) {
            return vis.yScale(d.value);
        })
        .attr('height', function(d) {
            return vis.height - vis.yScale(d.value);
        })
        .attr('width', vis.xScale.bandwidth());

    bars.exit().remove();

    vis.svg.select(".x-axis").transition().duration(1000).call(vis.xAxis)
        .selectAll("text")
        .attr("dy", "-.2em")
        .attr("dx", "-.9em")
        .attr("transform", "rotate(-60)")
        .style("text-anchor", "end");
    vis.svg.select(".y-axis").transition().duration(1000).call(vis.yAxis);
};