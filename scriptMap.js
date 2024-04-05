// Function to load data from a CSV file asynchronously
function loadData(csv) {
    return new Promise((resolve, reject) => {
        d3.csv(csv)
            .then(function (data) {
                resolve(data);
            }).catch(function (error) {
                reject(error);
            });
    });
}
function convertStringToInt(str) {
    if (str) {
        let noCommas = str.replace(/,/g, '');
        let num = Number(noCommas);
        if (isNaN(num)) {
            return null;
        } else {
            return num;
        }
    }
    else return null;
}


// Define width and height for the SVG container
var w = 800; // Width
var h = 550; // Height
var rightMargin = 100;
var bottomMargin = 100;
// Define the projection for the map
var projection = d3.geoMercator()
    .center([0, 0]) // The geographical center of the map
    .translate([w / 2, h / 2 + 100]) // The SVG point that corresponds to the geographical center
    .scale(120); // Scale of the map

// Define the path generator for the map
var path = d3.geoPath().projection(projection);

// Define the zoom behavior
var zoom = d3.zoom()
    .scaleExtent([1, 30]) // This defines the maximum and minimum zoom scale
    .on("zoom", function () {
        g.selectAll('path') // Apply the transformation to the paths
            .attr('transform', d3.event.transform);
    });


// Define the SVG container
var svg = d3.select("#chart")
    .append("svg")
    .attr("width", w)
    .attr("height", h)
    .style("border", "1px solid black")
    .style("background", "")
    .style("margin-top", "20px")
    .call(zoom); // Apply the zoom behavior to the SVG


var g = svg.append("g")
    .attr("class", "map");



var countries = null;
var data = null;
var features = null;

// Asynchronous function to initialize the visualization
const init = async () => {
    d3.json("countries.json").then(async (json) => {
        var countries_raw = await loadData("Name_countries.csv");
        countries = countries_raw.reduce(function (map, obj) {
            map[obj.Short_name] = obj.Name;
            return map;
        }, {});

        data = await loadData("data/net_overseas_migration_12_23_abs.csv");
        console.log("data: ", data);

        features = json.features;
        for (let i = 0; i < data.length; i++) {
            var country_short = data[i]['Country of birth(d)'];
            var country = countries[country_short];
            for (var j = 0; j < json.features.length; j++) {
                var jsonCountry = json.features[j].properties.name;
                if (country === jsonCountry) {
                    json.features[j].properties.data = data[i];
                    break;
                }
            }
        }
        drawChart(2012, firstDraw = true);

    });
};




const drawChart = (year, firstDraw = false) => {
    year = Number(year);
    var yearStr = String(year);
    console.log(data, features);
    // Get the last two digits of the next year
    var nextYearStr = String(year + 1).slice(-2);

    // Combine the strings
    var time = yearStr + '-' + nextYearStr;
    console.log(time);

    // Filter data to get only positive values
    var positiveData = data.filter((d) => convertStringToInt(d[time]) >= 0);
    // Filter data to get only negative values
    var negativeData = data.filter((d) => convertStringToInt(d[time]) < 0);

    // Find the min, max positive value
    var minPositiveValue = d3.min(positiveData, (d) => convertStringToInt(d[time]));
    var maxPositiveValue = d3.max(positiveData, (d) => convertStringToInt(d[time]));

    // Find the min, max negative value
    var minNegativeValue = d3.min(negativeData, (d) => convertStringToInt(d[time]));
    var maxNegativeValue = d3.max(negativeData, (d) => convertStringToInt(d[time]));

    var colorP = d3.scaleSequential((t) => d3.interpolate('#fee6dc', '#fd3a38')(t));
    if (maxPositiveValue)
        colorP.domain([minPositiveValue, maxPositiveValue]);

    var colorN = d3.scaleSequential((t) => d3.interpolate('#C1EFFF', '#1473e6')(t));
    if (minNegativeValue)
        colorN.domain([-maxNegativeValue, -minNegativeValue]);

    if (firstDraw) {
        // Draw map paths
        g.selectAll("path")
            .data(features)
            .enter()
            .append("path")
            .attr("class", (d) => {
                return (`${d.properties.name} - ${d.properties.data ? d.properties.data[time] : ""}`);
            })
            .attr("d", path)
            .on("mouseover", function (d) {
                d3.select(this)
                    .transition()
                    .duration(300)
                    .style("fill", "orange");
                var value = convertStringToInt(d.properties.data ? d.properties.data[time] : null);
                showToolTip(value);
            })
            .on("mouseout", function () {
                d3.select(this)
                    .transition()
                    .duration(0)
                    .style("fill", (d) => {
                        var value = convertStringToInt(d.properties.data ? d.properties.data[time] : null);
                        if (value !== null) {
                            if (value >= 0) {
                                return colorP(value);
                            } else if (value < 0) {
                                return colorN(-value);
                            }
                        } else {
                            return "#eee";
                        }
                    });
                hideToolTip();
            })
            .style("fill", (d) => {
                var value = convertStringToInt(d.properties.data ? d.properties.data[time] : null);
                if (value !== null) {
                    if (value >= 0) {
                        return colorP(value);
                    } else if (value < 0) {
                        return colorN(-value);
                    }
                } else {
                    return "#eee";
                }

            })
            .style("stroke", "white")
            .style("stroke-width", "0.5px");



    } else {
        var paths = g.selectAll("path");
        paths
            .attr("class", (d) => {
                return (`${d.properties.name} - ${d.properties.data ? d.properties.data[time] : ""}`);
            })
            .on("mouseover", function (d) {
                d3.select(this)
                    .transition()
                    .duration(300)
                    .style("fill", "orange");

                var value = convertStringToInt(d.properties.data ? d.properties.data[time] : null);
                showToolTip(value);
            })
            .on("mouseout", function () {
                d3.select(this)
                    .transition()
                    .duration(0)
                    .style("fill", (d) => {
                        var value = convertStringToInt(d.properties.data ? d.properties.data[time] : null);
                        if (value !== null) {
                            if (value >= 0) {
                                return colorP(value);
                            } else if (value < 0) {
                                return colorN(-value);
                            }
                        } else {
                            return "#eee";
                        }
                    });
                hideToolTip();
            });

        // Start the transition
        paths.transition()
            .duration(200)
            .style("fill", (d) => {
                var value = convertStringToInt(d.properties.data ? d.properties.data[time] : null);
                if (value !== null) {
                    if (value >= 0) {
                        return colorP(value);
                    } else if (value < 0) {
                        return colorN(-value);
                    }
                } else {
                    return "#eee";
                }
            });
    }

    // Remove the existing legend if it exists
    d3.select(".legend").remove();

    var legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${w - 250},${h - 60})`);

    var gradientP = legend.append("defs")
        .append("linearGradient")
        .attr("id", "gradientP")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%")
        .attr("spreadMethod", "pad");

    gradientP.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#fee6dc")
        .attr("stop-opacity", 1);

    gradientP.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#fd3a38")
        .attr("stop-opacity", 1);

    // Second gradient
    var gradientN = legend.append("defs")
        .append("linearGradient")
        .attr("id", "gradientN")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%")
        .attr("spreadMethod", "pad");

    gradientN.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#C1EFFF")
        .attr("stop-opacity", 1);

    gradientN.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#1473e6")
        .attr("stop-opacity", 1);

    legend.append("rect")
        .attr("x", 10)
        .attr("y", 10)
        .attr("width", 150)
        .attr("height", 10)
        .style("fill", "url(#gradientP)");


    legend.append("rect")
        .attr("x", 10)
        .attr("y", 30)
        .attr("width", 150)
        .attr("height", 10)
        .style("fill", "url(#gradientN)");

    var minPositiveText = legend.append("text")
        .attr("x", 10)  // Position at the left of the first rectangle
        .attr("y", 15)  // Align with the first rectangle
        .text(minPositiveValue)
        .style("alignment-baseline", "middle");

    var minPositiveTextWidth = minPositiveText.node().getBBox().width;

    minPositiveText.attr("x", 10 - minPositiveTextWidth - 5);  // Adjust the position

    var maxPositiveText = legend.append("text")
        .attr("x", 160)  // Position at the right of the first rectangle
        .attr("y", 15)  // Align with the first rectangle
        .text(maxPositiveValue)
        .style("alignment-baseline", "middle");

    var maxPositiveTextWidth = maxPositiveText.node().getBBox().width;

    maxPositiveText.attr("x", 160 + 5);  // Adjust the position

    // Add min and max negative values for the second rectangle
    var maxNegativeText = legend.append("text")
        .attr("x", 10)  // Position at the left of the second rectangle
        .attr("y", 35)  // Align with the second rectangle
        .text(maxNegativeValue)
        .style("alignment-baseline", "middle");

    var maxNegativeTextWidth = maxNegativeText.node().getBBox().width;

    maxNegativeText.attr("x", 10 - maxNegativeTextWidth - 5);  // Adjust the position

    var minNegativeText = legend.append("text")
        .attr("x", 160)  // Position at the right of the second rectangle
        .attr("y", 35)  // Align with the second rectangle
        .text(minNegativeValue)
        .style("alignment-baseline", "middle");

    var minNegativeTextWidth = minNegativeText.node().getBBox().width;

    minNegativeText.attr("x", 160 + 5);  // Adjust the position

    d3.selectAll(".tooltip").remove();

    var tooltip1 = svg.append("g")
        .attr("class", "tooltip")
        .attr("transform", `translate(${w - 250},${h - 60})`);

    var rect1 = tooltip1.append("rect")
        .attr("x", 30)
        .attr("y", 10 - 3)
        .attr("width", 2)
        .attr("height", 16)
        .style("opacity", "0")
        .style("fill", "black");


    var text1 = tooltip1.append("text")
        .attr("x", 30)
        .attr("y", 10 - 3 - 2)
        .text(123)
        .style("opacity", "0")
        .style("text-anchor", "middle");


    var tooltip2 = svg.append("g")
        .attr("class", "tooltip")
        .attr("transform", `translate(${w - 250},${h - 60})`);

    var rect2 = tooltip2.append("rect")
        .attr("x", 30)
        .attr("y", 30 - 3)
        .attr("width", 2)
        .attr("height", 16)
        .style("opacity", "0")
        .style("fill", "black");


    var text2 = tooltip2.append("text")
        .attr("x", 30)
        .attr("y", 40 + 15)
        .text(123)
        .style("opacity", "0")
        .style("text-anchor", "middle");

    const showToolTip = (value) => {
        var xScaleP = d3.scaleLinear()
            .domain([minPositiveValue, maxPositiveValue])
            .range([10, 160]);
        var xScaleN = d3.scaleLinear()
            .domain([minNegativeValue, maxNegativeValue])
            .range([160, 10]);

        if (value >= 0) {
            var x = xScaleP(value);
            rect1
                .attr("x", x)
                .style("opacity", 1);
            text1
                .attr("x", x)
                .text(value)
                .style("opacity", 1);
        } else if (value < 0) {
            // console.log("value < 0");
            var x = xScaleN(value);
            rect2
                .attr("x", x)
                .style("opacity", 1);
            text2
                .attr("x", x)
                .text(value)
                .style("opacity", 1);
        }
    };

    const hideToolTip = () => {
        rect1
            .style("opacity", 0);
        text1
            .style("opacity", 0);
        rect2
            .style("opacity", 0);
        text2
            .style("opacity", 0);
    };

};

// Call the initialization function
init();

document.getElementById('scrollbar').addEventListener('input', function (e) {
    var year = e.target.value;
    document.getElementById('yearValue').innerText = year;
    drawChart(year);
});
