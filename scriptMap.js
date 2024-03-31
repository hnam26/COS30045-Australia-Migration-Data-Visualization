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
    .call(zoom); // Apply the zoom behavior to the SVG

// Define the clipping path
svg.append("defs")
    .append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("width", w)
    .attr("height", h);

// Apply the clipping path to the SVG group
var g = svg.append("g")
    .attr("clip-path", "url(#clip)");


// Asynchronous function to initialize the visualization
const init = async () => {
    d3.json("countries.json").then(async (json) => {
        var countries_raw = await loadData("Name_countries.csv");
        var countries = countries_raw.reduce(function (map, obj) {
            map[obj.Short_name] = obj.Name;
            return map;
        }, {});
        console.log(countries);

        var data = await loadData("net_overseas_migration_12_23_abs.csv");
        console.log("data: ", data);

        // Define color scale for mapping unemployment values to colors
        var minValue = d3.min(data, (d) => convertStringToInt(d['2012-13']));
        var maxValue = d3.max(data, (d) => convertStringToInt(d['2012-13']));

        var colorP = d3.scaleSequential((t) => d3.interpolate('#FFF', '#E72929')(t));
        if (maxValue >= 0)
            colorP.domain([0, maxValue]);

        var colorN = d3.scaleSequential((t) => d3.interpolate('#DFF5FF', '#5755FE')(t));
        if (minValue < 0)
            colorN.domain([0, -minValue]);

        var count = 0;
        for (let i = 0; i < data.length; i++) {
            var country_short = data[i]['Country of birth(d)'];
            var country = countries[country_short];
            for (var j = 0; j < json.features.length; j++) {
                var jsonCountry = json.features[j].properties.name;
                if (country === jsonCountry) {
                    json.features[j].properties.value = data[i]['2012-13'];
                    count++;
                    break;
                }
            }
        }
        console.log("Count number of countries: ", count);
        // Draw map paths
        g.selectAll("path")
            .data(json.features)
            .enter()
            .append("path")
            .attr("class", (d) => { return (d.properties.name + '-' + d.properties.value); })
            .attr("d", path)
            .on("mouseover", function () {
                d3.select(this)
                    .transition()
                    .duration(300)
                    .style("fill", "orange");
            })
            .on("mouseout", function () {
                d3.select(this)
                    .transition()
                    .duration(0)
                    .style("fill", (d) => {
                        var value = convertStringToInt(d.properties.value);
                        if (value !== null) {
                            if (value >= 0) {
                                return colorP(value);
                            } else if (value < 0) {
                                return colorN(-value);
                            }
                        } else {
                            return "green";
                        }
                    });
            })
            .style("fill", (d) => {
                var value = convertStringToInt(d.properties.value);
                if (value !== null) {
                    if (value >= 0) {
                        return colorP(value);
                    } else if (value < 0) {
                        return colorN(-value);
                    }
                } else {
                    return "green";
                }

            })
            .style("stroke", "gray")
            .style("stroke-width", "0.25px");
    });
};

// Call the initialization function
init();
