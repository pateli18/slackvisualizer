
TrelloBar = function(_parentElement, _data, _chosenMetric){
    this.parentElement = _parentElement;
    this.data = _data;
    this.displayData = _data;
    this.chosenMetric = _chosenMetric;
    this.previousGroupVal = null;
    // for event handler

    this.initVis();
};

TrelloBar.prototype.initVis = function() {
    var vis = this;
    vis.margin = {top: 50, right: 20, bottom: 100, left: 50};

    vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right;
    vis.height = 500 - vis.margin.top - vis.margin.bottom;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    vis.xScale = d3.scaleBand()
        .rangeRound([0, vis.width])
        .paddingInner([0.1]);

    vis.yScale = d3.scaleLinear()
        .range([vis.height, 0]);

    vis.colorScale = d3.scaleOrdinal(d3.schemeCategory20)
        .domain(trelloActionList);

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

TrelloBar.prototype.wrangleData = function() {
    var vis = this;

    vis.groupVal = $('#group-selector').val();

    if (vis.previousGroupVal != vis.groupVal) {
        var groupMembers = vis.data[vis.groupVal]['members'];
        var memberSelector = document.getElementById('member-selector');

        while (memberSelector.hasChildNodes()) {
            memberSelector.removeChild(memberSelector.childNodes[0]);
        }

        d3.select('#member-selector').append('option').attr('value', 'all').text('All Members');

        groupMembers.forEach(function(d) {
            d3.select('#member-selector').append('option').attr('value', d).text(d);
        });
        vis.previousGroupVal = vis.groupVal;
    }

    var groupData = vis.data[vis.groupVal]['actions'];

    vis.memberVal = $('#member-selector').val();
    var filteredGroupData;
    if (vis.memberVal != 'all') {
        filteredGroupData = groupData.filter(function (d) {
            return d.member === vis.memberVal;
        });
    } else {
        filteredGroupData = groupData;
    }

    vis.activityVal = $('#action-selector').val();
    if (!Array.isArray(vis.activityVal)) {
        vis.activityVal = [vis.activityVal];
    }

    var activitiesSelected = {};
    vis.activityVal.forEach(function(d) {
        activitiesSelected[d] = 1;
    });

    filteredGroupData = filteredGroupData.filter(function(d) {
        return (d.type in activitiesSelected);
    });

    filteredGroupData = filteredGroupData.filter(function(d) {
        return (d.time >= trelloChosenDates[0] && d.time <= trelloChosenDates[1])
    });

    filteredGroupData.sort(function(a, b) {
        return a.time - b.time;
    });

    var nestedData = d3.nest()
        .key(function(d) {
            if (vis.chosenMetric === 'time') {
                return d3.timeFormat('%b %d')(d[vis.chosenMetric]);
            } else {
                return d[vis.chosenMetric];
            }
        })
        .key(function(d) { return d.type; })
        .rollup(function(leaves) { return leaves.length; })
        .entries(filteredGroupData);

    if (vis.chosenMetric === 'member') {
        var domain = nestedData.map(function(d) {return d.key});
        vis.xScale.domain(domain);
    } else {
        vis.xScale.domain(trelloDateDomain);
    }

    var cleanedData = [];
    nestedData.forEach(function(d) {
        var dataElement = {};
        dataElement[vis.chosenMetric] = d.key;
        d.values.forEach(function(v) {
            dataElement[v.key] = v.value;
        });
        cleanedData.push(dataElement);
    });

    cleanedData.forEach(function(d) {
       trelloActionList.forEach(function(v) {
           if (v in d) {
           } else {
               d[v] = 0;
           }
       })
    });

    var stack = d3.stack()
        .keys(trelloActionList);

    var stackedData = stack(cleanedData);

    vis.displayData = [];

    stackedData.forEach(function(d, i) {
        d.forEach(function(v, j) {
            var newElement = {};
            newElement.key = d.key;
            newElement[vis.chosenMetric] = v.data[vis.chosenMetric];
            newElement.base = v[0];
            newElement.top = v[1];
            vis.displayData.push(newElement);
        })
    });

    console.log(vis.displayData);

    vis.updateVis();

};


TrelloBar.prototype.updateVis = function() {
    var vis = this;

    vis.yScale.domain([0, d3.max(vis.displayData, function(d) {
        return d.top;
    })]);

    vis.toolTip.html(function(d) {
        return '<strong style="color:' + vis.colorScale(d.key) + '">' + d.key + '</strong>:' + (d.top - d.base);
    });

    vis.svg.call(vis.toolTip);

    var bar = vis.svg.selectAll('.trello-action')
        .data(vis.displayData);

    bar.exit().remove();

    bar.enter()
        .append('rect')
        .attr('class', 'trello-action')
        .on('mouseover', vis.toolTip.show)
        .on('mouseout', vis.toolTip.hide)
        .merge(bar)
        .transition()
        .duration(1000)
        .attr('x', function(d) {
            return vis.xScale(d[vis.chosenMetric]);
        })
        .attr('y', function(d) {
            return vis.yScale(d.top);
        })
        .attr('width', vis.xScale.bandwidth())
        .attr('height', function(d) {
            return vis.yScale(d.base) - vis.yScale(d.top);
        })
        .attr('fill', function(d) {
            return vis.colorScale(d.key);
        });

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


