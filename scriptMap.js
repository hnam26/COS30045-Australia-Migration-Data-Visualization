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
function formatName(str) {
    return str.replace(/[^a-zA-Z0-9]/g, '-');
}



function filterCheckboxes() {
    var input, filter, checkboxes, label, txtValue;
    input = document.getElementById('search');
    filter = input.value.toUpperCase();
    checkboxes = document.getElementById("geographic-scope");
    label = checkboxes.getElementsByTagName('label');
    for (i = 0; i < label.length; i++) {
        txtValue = label[i].textContent || label[i].innerText;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
            label[i].style.display = "";
        } else {
            label[i].style.display = "none";
        }
    }
}

d3.select("#buttonArrow")
    .on("click", () => {
        document.getElementById("#");
        d3.select("#geographic-scope")
            .style("max-height",);
    });

var isMouseOut = true;
var search = document.getElementById("search");
var searchParent = search.parentNode;
search.addEventListener("click", () => {
    d3.select("#geographic-scope")
        .style("max-height", "120px");
});
// When the document is clicked
document.addEventListener('click', function (event) {
    // If the click was outside the dropdown and the dropdown is open
    if (!searchParent.contains(event.target) && d3.select("#geographic-scope").style("height") !== "0px") {
        // Close the dropdown
        d3.select("#geographic-scope")
            .style("max-height", "0px");
    }
});








var countries = null;
var data = null;
var features = null;
var countriesSelected = [];
var colorP, colorN;

// Get all checkboxes
var checkboxes = document.querySelectorAll('input[type=checkbox]');

class CountrySet {
    constructor () {
        this.selected = [];
        this.data;
    }
    setData(data) {
        this.data = data;
    }
    isHavingCountry(country) {
        return (this.selected.includes(country));
    }
    add(country) {
        this.selected.push(country);
        this.draw();
    }
    remove(country) {
        var index = this.selected.indexOf(country);
        this.selected.splice(index, 1);
        this.draw();
    }
    draw() {
        lineChart(this.data, this.selected);
    }
    reset() {
        this.selected = [];
    }

}
var Country = new CountrySet();



// Asynchronous function to initialize the visualization
const init = async (csv, title) => {
    d3.json("countries.json").then(async (json) => {
        var countries_raw = await loadData("Name_countries.csv");
        countries = countries_raw.reduce(function (map, obj) {
            map[obj.Short_name] = obj.Name;
            return map;
        }, {});

        data = await loadData(csv);
        Country.setData(data);
        console.log(data);

        features = json.features;

        var container = document.getElementById('geographic-scope');
        d3.select("#geographic-scope").html("");
        for (let i = 0; i < data.length; i++) {
            var country_short = data[i]['country'];
            var country = countries[country_short];
            for (var j = 0; j < json.features.length; j++) {
                var jsonCountry = json.features[j].properties.name;
                if (country === jsonCountry) {
                    json.features[j].properties.data = data[i];

                    var checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.id = 'checkbox' + j;
                    checkbox.value = (country_short);

                    checkbox.addEventListener('change', function () {
                        if (this.checked) {
                            d3.select(`.map .${formatName(countries[this.value])}`)
                                .style("fill", "orange");
                            Country.add(this.value);

                        } else {
                            var color = d3.select(`.map .${formatName(countries[this.value])}`).attr("color");
                            d3.select(`path.map.${formatName(this.value)}`).style("fill", color);
                            Country.remove(this.value);
                        }
                    });

                    var label = document.createElement('label');
                    label.htmlFor = 'checkbox' + j;
                    label.appendChild(document.createTextNode(jsonCountry));

                    // Add the checkbox and label to the container
                    container.appendChild(label);
                    label.insertBefore(checkbox, label.firstChild);
                    break;
                }
            }
        }
        drawMap(2012);
        Country.draw();
    });
};



const drawMap = (year) => {
    d3.select("#chart svg").remove();
    // Define width and height for the SVG container
    var w = 600; // Width
    var h = 400; // Height
    var rightMargin = 100;
    var bottomMargin = 100;
    // Define the projection for the map
    var projection = d3.geoMercator()
        .center([0, 0]) // The geographical center of the map
        .translate([w / 2, h / 2 + 100]) // The SVG point that corresponds to the geographical center
        .scale(90); // Scale of the map

    // Define the path generator for the map
    var path = d3.geoPath().projection(projection);

    // Define the zoom behavior
    var zoom = d3.zoom()
        .scaleExtent([1, 30]) // This defines the maximum and minimum zoom scale
        .on("zoom", function () {
            d3.selectAll('path.map') // Apply the transformation to the paths
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
    year = Number(year);
    var yearStr = String(year);
    // Get the last two digits of the next year
    var nextYearStr = String(year + 1).slice(-2);

    // Combine the strings
    var time = yearStr + '-' + nextYearStr;

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

    var g = svg.append("g")
        .attr("class", "map");
    var tooltipMap = d3.select("#tooltipMap");
    // Draw map paths
    var paths = g.selectAll("path")
        .data(features)
        .enter()
        .append("path")
        .attr("class", (d) => {
            return (`map ${formatName(d.properties.name)} - ${d.properties.data ? d.properties.data[time] : ""}`);
        })
        .attr("d", path)
        .on("click", function (d, i) {
            var country = null;
            for (let key in countries) {
                if (countries[key] === d.properties.name) {
                    country = key;
                    break;
                };
            }
            if (Country.isHavingCountry(country)) {
                // If d.properties.name is in countriesSelected, remove it
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
                Country.remove(country);
                // Check the checkbox
                document.getElementById('checkbox' + i).checked = false;
            } else if (country !== null) {
                d3.select(this)
                    .transition()
                    .duration(300)
                    .style("fill", (d) => {
                        var value = convertStringToInt(d.properties.data ? d.properties.data[time] : null);
                        if (value !== null) {
                            Country.add(country);
                            // Check the checkbox
                            document.getElementById('checkbox' + i).checked = true;

                            return "orange";
                        } else {
                            return "#eee";
                        }
                    });

            }
        })
        .on("mouseover", function (d) {
            d3.select(this)
                .transition()
                .duration(300)
                .style("fill", "orange");
            var value = convertStringToInt(d.properties.data ? d.properties.data[time] : null);
            showToolTip(value);
            tooltipMap.style("visibility", "visible");
        })
        .on("mouseout", function (d) {
            var country = null;
            for (let key in countries) {
                if (countries[key] === d.properties.name) country = key;
            }
            if (!Country.isHavingCountry(country)) {
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
            }
            hideToolTip();
            tooltipMap.style("visibility", "hidden");
        })
        .on("mousemove", function (d) {
            d3.select('.head-title h3')
                .text(`${d.properties.name}`);
            d3.select('.head-title span')
                .style("background", () => {
                    var color = d3.select(`path.map.${formatName(d.properties.name)}`).attr("color");
                    return color;
                });
            tooltipMap.select("p")
                .text(`Value: ${d.properties.data ? d.properties.data[time] : ''}`);
            tooltipMap.style("top", (event.pageY - 10) + "px").style("left", (event.pageX + 10) + "px");
        })
        .attr("color", (d) => {
            var country = null;
            var color;
            for (let key in countries) {
                if (countries[key] === d.properties.name) country = key;
                var value = convertStringToInt(d.properties.data ? d.properties.data[time] : null);
                if (value !== null) {
                    if (value >= 0) {
                        color = colorP(value);
                    } else if (value < 0) {
                        color = colorN(-value);
                    }
                } else {
                    color = "#eee";
                }
            }
            return color;
        })
        .style("fill", (d) => {
            var country = null;
            var color;
            for (let key in countries) {
                if (countries[key] === d.properties.name) country = key;
            }
            if (!Country.isHavingCountry(country)) {
                var value = convertStringToInt(d.properties.data ? d.properties.data[time] : null);
                if (value !== null) {
                    if (value >= 0) {
                        color = colorP(value);
                    } else if (value < 0) {
                        color = colorN(-value);
                    }
                } else {
                    color = "#eee";
                }
                return color;
            } else {
                return "orange";
            }


        })
        .style("stroke", "white")
        .style("stroke-width", "0.5px");


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


// ----------Line

var lineChart = (dataset, countries) => {
    console.log("countries: ", countries);
    // set the dimensions and margins of the graph
    const margin = { top: 10, right: 30, bottom: 100, left: 60 }, // Increased bottom margin
        width = 800 - margin.left - margin.right, // Increased width
        height = 500 - margin.top - margin.bottom;

    d3.select("#my_dataviz svg").remove();
    d3.select('#my_dataviz .tooltip').remove();
    d3.select('.line-legend').remove();
    // append the svg object to the body of the page
    const svg = d3.select("#my_dataviz")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);
    const g = svg
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);



    var countriesData = [];
    countries.forEach((country, index) => {

        var countryData = dataset.find(function (row) {
            return row['country'] === country;
        });


        if (countryData) {
            let { ['country']: _, ...rest } = countryData;
            countriesData.push(rest);
        }

    });

    // // delete countryData['country'];

    var datasetFormatted = Object.keys(countries).map(function (key) {
        return {
            name: countries[key],
            values: Object.entries(countriesData[key]).map(([year, value]) => {
                return {
                    year: year.replace('-', '-20'),
                    value: +value.replace(/,/g, '')
                };
            })
        };
    });
    console.log(datasetFormatted);
    // Get the maximum and minimum values of the years and values for setting the domain of scales
    // const years = [].concat.apply([], datasetFormatted.map(d => d.values.map(v => v.year)).slice(1, 11));
    const years = [].concat.apply([], datasetFormatted.map(d => d.values.map(v => v.year)));

    const values = [].concat.apply([], datasetFormatted.map(d => d.values.map(v => v.value)));
    const colors = d3.scaleOrdinal()
        .domain(countries)
        .range(d3.schemeCategory10);

    // Add X axis
    const x = d3.scaleBand()
        .domain(years)
        .range([0, width])
        .paddingInner(1); // Adjusted x-axis range

    g.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x));

    // Add Y axis
    const y = d3.scaleLinear()
        .domain([d3.min(values) < 0 ? d3.min(values) * 2 : d3.min(values) / 2,
        d3.max(values) > 0 ? d3.max(values) * 2 : d3.max(values) / 2])
        .range([height, 0]);
    g.append("g")
        .call(d3.axisLeft(y));

    // Define line function
    const line = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.value));

    // Add lines for each country
    var lines = g.selectAll(".line")
        .data(datasetFormatted)
        .enter()
        .append("path")
        .attr("class", (d, i) => "line" + i)
        .attr("d", d => line(d.values))
        .style("stroke", d => colors(d.name))
        .style("stroke-width", 3)
        .style("fill", "none");
    lines.transition()
        .duration(2000)
        .attrTween("stroke-dasharray", function () {
            var len = this.getTotalLength();
            return function (t) { return (d3.interpolateString("0," + len, len + ",0"))(t); };
        });

    // Add circles for each data point
    var groupCircle = g.selectAll(".dot")
        .data(datasetFormatted)
        .enter()
        .append("g")
        .attr("class", "dot");

    datasetFormatted.forEach((data, i) => {
        var circles = groupCircle.selectAll("circle" + i)
            .data(data.values)
            .enter()
            .append("circle")
            .attr("class", "circle" + i)
            .attr("cx", d => x(d.year))
            .attr("cy", d => y(d.value))
            .attr("r", 5)
            .style("opacity", 0) // Initially set to invisible
            .style("fill", colors(data.name));
        // .on("mouseover", mouseover)
        // .on("mousemove", mousemove);
        circles.transition()
            .delay((d, j) => {
                return j * (2000 / (data.values.length));
            })
            .style("opacity", 1); // Make the circles visible
    });

    // Create a group for the legend
    var legend = g.append("g")
        .attr("class", "line-legend");

    // Create a group for each data item
    countries.forEach((country, i) => {
        var yPosition = Math.floor(i / 5);
        var xPosition = i % 5;
        var legendGroup = legend.append("g")
            .attr("transform", "translate(" + (xPosition * 150) + ",0)");
        // Create the line for the legend
        legendGroup.append("line")
            .attr("x1", 0)
            .attr("y1", yPosition * 20)
            .attr("x2", 20)
            .attr("y2", yPosition * 20)
            .style("stroke", colors(country))
            .style("stroke-width", "2px");

        // Shorten the title if it is too long
        var title = country;
        if (title.length > 12) {
            title = title.substring(0, 12) + "...";
        }

        // Create the text for the legend
        legendGroup.append("text")
            .attr("x", 25)
            .attr("y", yPosition * 20)
            .attr("dy", ".35em")
            .text(title);
    });

    var legendX = (width - legend.node().getBBox().width) / 2;
    var legendY = height - margin.bottom + 150;

    legend.attr("transform", `translate(${legendX}, ${legendY})`);

    // Tooltip
    const Tooltip = d3.select("#tooltipLine");
    const mouseover = function (event, d) {
        Tooltip
            .style("visibility", "visible");
    };
    const mousemove = function (x, y, d, name) {
        Tooltip
            .style("left", `${x}px`)
            .style("top", `${y}px`);
        var tooltipLine = d3.select("#tooltipLine");
        tooltipLine.select('.head-title h3')
            .text(`${name}`);

        tooltipLine.select('.value')
            .text(`Value: ${d.value}`);

        tooltipLine.select('.time')
            .text(`Time: ${d.year}`);

    };
    const mouseleave = function (event, d) {
        Tooltip
            .style("visibility", "hidden");
    };


    svg
        .on("mousemove", function () {
            // Create a bisector to find the closest data point on the line for a given x value
            // Get the current mouse position
            var mouseX = d3.mouse(this)[0] - margin.left;
            var mouseY = d3.mouse(this)[1];

            var bands = x.domain();
            var i;
            var dis = [];
            // console.log("MouseX: ", mouseX);
            for (i = 0; i < bands.length; i++) {
                dis.push(Math.abs(mouseX - x(bands[i])));
            }

            i = dis.indexOf(Math.min(...dis));
            // Calculate the distances to each line
            var distances = datasetFormatted.map(dataItem => {
                return (Math.abs(y(dataItem.values[i].value) - mouseY));
            });

            // Find the index of the line with the smallest distance
            var closestLineIndex = distances.indexOf(Math.min(...distances));

            // Highlight the closest line and unhighlight the others
            datasetFormatted.forEach(dataItem => {
                var j = datasetFormatted.indexOf(dataItem);
                g.select(".line" + j).style("opacity", j === closestLineIndex ? 1 : .2);
                g.selectAll(".circle" + j)
                    .style("opacity", j === closestLineIndex ? 1 : .2)
                    .attr("r", (d, k) => {
                        if (k === i && j === closestLineIndex) {
                            return 10;
                        } else {
                            return 5;
                        }
                    });
            });
            // Select the circle corresponding to the closest line and the selected point
            let circle = groupCircle.selectAll(".circle" + closestLineIndex).nodes()[i];
            if (circle !== undefined) {
                // Get the position of the circle
                let position = circle.getBoundingClientRect();

                let xPosition = i <= Math.floor(bands.length / 2) ? position.x + 70 : position.x - 70 - 150;
                let yPosition = position.y - 40;
                let d = datasetFormatted[closestLineIndex].values[i];
                let name = datasetFormatted[closestLineIndex].name;
                // Call the mousemove function with the position of the circle
                mousemove(xPosition, yPosition, d, name);
            }
        })
        .on("mouseout", function () {
            datasetFormatted.forEach((dataItem) => {
                var j = datasetFormatted.indexOf(dataItem);
                svg.selectAll(".line" + j).style("opacity", 1);
                svg.selectAll(".circle" + j)
                    .style("opacity", 1)
                    .attr("r", 5);
            });
            if (datasetFormatted.length != 0) mouseleave();

        })
        .on("mouseover", () => {
            if (datasetFormatted.length != 0) mouseover();
        });

};


// Call the initialization function
init('data/net_overseas_migration_12_23_abs.csv');

const slideValue = document.querySelector('.sliderValue span');
const inputSlider = document.querySelector('.field input');
inputSlider.oninput = () => {
    let value = inputSlider.value;
    slideValue.textContent = value;
    let min = inputSlider.min || 0;
    let max = inputSlider.max || 100;
    drawMap(value);
    // Calculate the left position based on the min and max values
    slideValue.style.left = `calc(${((value - min) / (max - min)) * 100}%)`;
};
const selectElement = document.querySelector('.selectItem');

selectElement.onchange = function () {
    const selectedValue = this.value;
    console.log(selectedValue);
    switch (selectedValue) {
        case '1':
            init('data/net_overseas_migration_12_23_abs.csv', "oversea migration");
            Country.reset();
            break;
        case '2':
            init('data/gdp.csv', "gdp");
            Country.reset();
        default:
            break;
    }
};

var isMenuOpen = false;

function toggleMenu() {
    isMenuOpen = !isMenuOpen;
    var navbar = document.querySelector('.navbar');
    var navbarToggle = document.querySelector('.navbar-toggle');
    var navbarLinks = document.querySelector('.navbar-links');
    if (isMenuOpen) {
        navbar.className = 'navbar open';
        navbarToggle.className = 'navbar-toggle open';
        navbarLinks.className = 'navbar-links open';
    } else {
        navbar.className = 'navbar';
        navbarToggle.className = 'navbar-toggle';
        navbarLinks.className = 'navbar-links';
    }
}
