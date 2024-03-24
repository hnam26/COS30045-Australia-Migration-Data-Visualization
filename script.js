
var rowConverter = (d) => {
    return {
        year: new Date(`${d["Year"].split('-')[0]}-12-31`),
        tem_visa_holder: d["Temporary visa holders (000)"],
        aus_citizen: d["Australian Citizen (000)"],
        per_visa_holder: d["Permanent visa holders (000)"],
        nz_citizen: d["NZ Citizen (subclass 444) (000)"],
        unknown_visa: d["Unknown Visa (000)"]
    };
};


var LineChart = (dataset1, dataset2, category) => {
    var w = 1000; // Width
    var h = 450; // Height
    var paddingRight = paddingTop = 70;
    var axisLeft = 50;
    var axisBot = 100; // Space for bottom axis
    var xScale = d3.scaleTime()
        .domain([
            d3.min(dataset1, d => d.year),
            d3.max(dataset1, d => new Date(d.year.getFullYear() + 1, 0, 1))
        ])
        .range([axisLeft, w - paddingRight]);

    var yScale = d3.scaleLinear()
        .domain([
            0,
            Math.max(
                d3.max(dataset1, d => +d[category]),
                d3.max(dataset2, d => +d[category])
            )
        ])
        .rangeRound([h - axisBot, paddingTop]); // h - 50 for padding top


    var line1 = d3.line()
        .defined(d => d[category] >= 0)
        .x(d => xScale(d.year))
        .y(d => yScale(+d[category]));

    var line2 = d3.line()
        .defined(d => d[category] >= 0)
        .x(d => xScale(d.year))
        .y(d => yScale(+d[category]));

    // Create SVG container
    var svg = d3.select("#chart")
        .append("svg")
        .attr("width", w)
        .attr("height", h);

    // Create line for dataset1
    var lineSet1 = svg.append("path")
        .datum(dataset1)
        .attr("class", "line")
        .attr("d", line1)
        .style("stroke", "#2980B9"); // Make the line blue

    // Add transition
    lineSet1.transition() // Start a transition
        .duration(2000) // Set its duration to 2000 milliseconds
        .attrTween("stroke-dasharray", function () {
            var len = this.getTotalLength();
            return function (t) { return (d3.interpolateString("0," + len, len + ",0"))(t); };
        });



    // Create line for dataset2
    var lineSet2 = svg.append("path")
        .datum(dataset2)
        .attr("class", "line") // Use a different class for the second line
        .attr("d", line2)
        .style("stroke", "red"); // Make the line red

    // Add transition
    lineSet2
        .transition() // Start a transition
        .duration(2000) // Set its duration to 2000 milliseconds
        .attrTween("stroke-dasharray", function () {
            var len = this.getTotalLength();
            return function (t) { return (d3.interpolateString("0," + len, len + ",0"))(t); };
        });

    // Add mouseover and mouseout events
    lineSet1
        .on("mouseover", function () {
            focusLine1(true);
        })
        .on("mouseout", function () {
            focusLine1(false);
        });

    // Add mouseover and mouseout events
    lineSet2
        .on("mouseover", function () {
            focusLine2(true);
        })
        .on("mouseout", function () {
            focusLine2(false);
        });


    // Create x-axis
    const gx = svg.append("g")
        .attr("transform", `translate(0, ${h - axisBot})`)
        .call(d3.axisBottom(xScale).tickFormat((d, i) => `${d.getUTCFullYear()}`));

    gx.selectAll("text")
        .attr("dy", "1em") // Adjust the y-offset
        .attr("dx", "0em") // Adjust the x-offset
        .style("text-anchor", "middle");

    // Create y-axis
    const gy = svg.append("g")
        .attr("transform", `translate(${axisLeft},${0})`)
        .call(d3.axisLeft(yScale).tickFormat((d, i) => d));

    gy.selectAll("text")
        .attr("dx", "-0.5em") // Adjust the x-offset
        .style("text-anchor", "end");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", axisLeft - 55) // Adjust position to place it next to the y-axis
        .attr("x", 0 - (h / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Thousands");


    // Create a group for the legend
    var legend = svg.append("g");

    // Add lines for the legend colors
    legend.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 20)
        .attr("y2", 0)
        .style("stroke", "#2980B9") // Color for dataset1
        .style("stroke-width", "2px");

    legend.append("line")
        .attr("x1", 150)
        .attr("y1", 0)
        .attr("x2", 170)
        .attr("y2", 0)
        .style("stroke", "red") // Color for dataset2
        .style("stroke-width", "2px");

    // Add labels for the legend
    legend.append("text")
        .attr("x", 30)
        .attr("y", 0)
        .text("Arrival Visa")
        .attr("alignment-baseline", "middle");

    legend.append("text")
        .attr("x", 180)
        .attr("y", 0)
        .text("Departure Visa")
        .attr("alignment-baseline", "middle");

    var legendX = (w - legend.node().getBBox().width) / 2;
    var legendY = h - axisBot + 70;

    legend.attr("transform", `translate(${legendX}, ${legendY})`);

    // Create tooltips and circles for both datasets
    var tooltip1 = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    var tooltip2 = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Append a group of circles for each data point in dataset1
    var circles1 = svg.selectAll(".circle1")
        .data(dataset1)
        .enter()
        .append("circle")
        .attr("class", "circle1")
        .attr("cx", d => xScale(d.year))
        .attr("cy", d => yScale(+d[category]))
        .attr("r", 5)
        .attr("fill", "#2980B9")
        .style("opacity", 0); // Initially set to invisible

    // Transition to make the circles appear with the line
    circles1.transition()
        .delay((d, i) => {
            return i * (2000 / (dataset1.length));
        })
        .style("opacity", 1); // Make the circles visible

    // Do the same for dataset2
    var circles2 = svg.selectAll(".circle2")
        .data(dataset2)
        .enter()
        .append("circle")
        .attr("class", "circle2")
        .attr("cx", d => xScale(d.year))
        .attr("cy", d => yScale(+d[category]))
        .attr("r", 5)
        .attr("fill", "red")
        .style("opacity", 0); // Initially set to invisible

    // Transition to make the circles appear with the line
    circles2.transition()
        .delay((d, i) => {
            return i * (2000 / (dataset2.length));
        })
        .style("opacity", 1); // Make the circles visible


    // Create a bisector to find the closest data point on the line for a given x value
    var bisectDate = d3.bisector(d => d.year).left;
    svg.on("mousemove", function () {
        // Get the current mouse position
        var mouseX = d3.mouse(this)[0] - axisLeft;
        var mouseY = d3.mouse(this)[1];

        // Convert the mouse x position to a date
        var mouseDate = xScale.invert(mouseX);

        // Covert the mouse y position to a value
        var mouseValue = yScale.invert(mouseY);
        // Use the bisector to find the closest data point on the line
        var xi = bisectDate(dataset1, mouseDate);
        var yi = 0;
        if (Math.abs(mouseValue - dataset1[xi][category]) <= Math.abs(mouseValue - dataset2[xi][category])) {
            yi = 1;
        } else {
            yi = 2;
        }
        if (yi === 1) {
            circles1.attr("r", (d, i) => {
                if (i === xi) {
                    return 10;
                } else {
                    return 5;
                }
            });
            circles2.attr("r", 5);
            tooltip1.transition().style("opacity", .9);
            tooltip2.transition().style("opacity", 0);
            updateTooltip(tooltip1, dataset1[xi], xScale, yScale, w, svg, "Arrival Visa");
            focusLine1(true);
            focusLine2(false);
        } else {
            circles1.attr("r", 5);
            circles2.attr("r", (d, i) => {
                if (i === xi) {
                    return 10;
                } else {
                    return 5;
                }
            });
            tooltip1.transition().style("opacity", .0);
            tooltip2.transition().style("opacity", .9);
            updateTooltip(tooltip2, dataset2[xi], xScale, yScale, w, svg, "Departure Visa");
            focusLine1(false);
            focusLine2(true);
        }
        if (mouseY < paddingTop || mouseY > h - axisBot) {
            circles1.attr("r", 5);
            circles2.attr("r", 5);
            tooltip1.transition().style("opacity", .0);
            tooltip2.transition().style("opacity", .0);
            focusLine1(false);
            focusLine2(false);
        }

    })
        .on("mouseout", () => {
            circles1.attr("r", 5);
            circles2.attr("r", 5);
            tooltip1.transition().style("opacity", .0);
            tooltip2.transition().style("opacity", .0);
            focusLine1(false);
            focusLine2(false);
        });
    // Function to update tooltip position and value
    function updateTooltip(tooltip, d, xScale, yScale, w, svg, title) {
        tooltip.transition().style("opacity", .9);
        html = `<h3>${title}</h3>` + `<p>Year: ${d.year.getFullYear()}</p>` + `<p>Value: ${d[category]}</p>`;
        tooltip.html(html)
            .style("top", (yScale(d[category]) - 50 + svg.node().getBoundingClientRect().top) + "px");
        if (xScale(d.year) < w / 2) {
            tooltip.style("left", (xScale(d.year) + svg.node().getBoundingClientRect().left + 20) + "px");
        } else {
            tooltip.style("left", (xScale(d.year) + svg.node().getBoundingClientRect().left - tooltip.node().getBoundingClientRect().width) - 20 + "px");
        }
    }

    // 
    function focusLine1(focus = true) {
        if (focus) {
            lineSet1.style("stroke-width", "4");
            lineSet2.style("stroke", "gray");
            circles2.style("fill", "gray");
        } else {
            lineSet1.style("stroke-width", "2");
            lineSet2.style("stroke", "red");
            circles2.style("fill", "red");
        }
    }

    function focusLine2(focus = true) {
        if (focus) {
            lineSet2.style("stroke-width", "4");
            lineSet1.style("stroke", "gray");
            circles1.style("fill", "gray");
        } else {
            lineSet2.style("stroke-width", "2");
            lineSet1.style("stroke", "#2980B9");
            circles1.style("fill", "#2980B9");
        }
    }
};

function loadata(csv) {
    return new Promise((resolve, reject) => {
        d3.csv(csv, rowConverter)
            .then(function (data) {
                console.log(data);
                resolve(data);
            }).catch(function (error) {
                reject(error);
            });
    });

}

var data = [];
var data2 = [];
const init = async () => {
    data = await loadata('visa_arrival.csv');
    data2 = await loadata('visa_departure.csv');
    LineChart(dataset1 = data, dataset2 = data2, category = "tem_visa_holder");

};

init();

function updateChart(title, category) {
    // Reset chart
    d3.select("#title").html(title);
    d3.select("#chart").html("");
    LineChart(dataset1 = data, dataset2 = data2, category = category);
}

d3.select("#tem_visa_holder")
    .on("click", function () {
        var title = d3.select("#tem_visa_holder").html();
        updateChart(title, "tem_visa_holder");
    });

d3.select("#aus_citizen")
    .on("click", function () {
        var title = d3.select("#aus_citizen").html();
        updateChart(title, "aus_citizen");
    });

d3.select("#per_visa_holder")
    .on("click", function () {
        var title = d3.select("#per_visa_holder").html();
        updateChart(title, "per_visa_holder");
    });

d3.select("#nz_citizen")
    .on("click", function () {
        var title = d3.select("#nz_citizen").html();
        updateChart(title, "nz_citizen");
    });

d3.select("#unknown_visa")
    .on("click", function () {
        var title = d3.select("#unknown_visa").html();
        updateChart(title, "unknown_visa");
    });

