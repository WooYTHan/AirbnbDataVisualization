var width = 860,
    height = 800,
    centered;

var click = 0;
var Clicked2 = 0;
var id = 0;

//Each Number Represents a City
var map_number = 0;
var pre_number = 0;

var domain;
var countObj;

var filterType;
var filterPrice;

var curRange;
var interval;
$("#" + 0).css('color', '#fd5c63');

//Tooltip
var tooltip = d3.select("body").append("div").style("position", "absolute").style("z-index", "10")
    .style("visibility", "hidden")
    .attr("class", "tooltip")
    .style("color", "white")
    .style("padding", "8px")
    .style("background-color", "rgba(0, 0, 0, 0.75)")
    .style("border-radius", "6px")
    .style("font-size", "20px")
    .text("tooltip");
var tooltip2 = d3.select("body").append("div").style("position", "absolute").style("z-index", "10")
    .style("visibility", "hidden")
    .attr("class", "tooltip2")
    .text("tooltip");
//Change City Map Function
$(".typeOne").click(function() {
    $(".getPrice").val('0');
    $(".getType").val('0');
    d3.selectAll('.map svg').remove();
    d3.selectAll('.wc svg').remove();
    d3.select('#polygon svg').remove();
    $("#" + pre_number).css('color', '#000000');
    $(this).css('color', '#fd5c63');
    map_number = $(this).attr("id");
    map(map_number);
    pre_number = map_number;
});

//City Center Logitude and Latitude
var center = [
    [-122.44, 37.72],
    [-122.35, 47.588],
    [-73.98, 40.68],
    [-87.75, 41.80],
    [-77.037, 38.88]
];

//Scale for Each City
var scale = [160000, 108000, 82000, 82000, 140000];
var json = ['sf.geo.json', 'sea.geo.json', 'nyc.geo.json', 'chi.geo.json', 'wdc.geo.json'];
var csv = ['sf_listing.csv', 'sea_listing.csv', 'nyc_listing.csv', 'chi_listing.csv', 'wdc_listing.csv'];
var csv_famous = ['sf_famous.csv', 'sea_famous.csv', 'nyc_famous.csv', 'chi_famous.csv', 'wdc_famous.csv'];
var csv_wc = ['sf', 'sea', 'nyc', 'chi', 'wdc'];
var csv_type = ['Entire home/apt', 'Private room', 'Shared room'];

map(map_number);

// Define color scale
var color = d3.scaleLinear()
    .domain([0, 20])
    .clamp(true)
    .range(['#f7eded', '#fd5c63']);


function map(map_number) {
    // Load map data
    d3.queue()
        .defer(d3.json, "json/" + json[map_number])
        .defer(d3.csv, "csv/listing/" + csv[map_number])
        .defer(d3.csv, "csv/listing/" + csv_famous[map_number])
        .defer(d3.csv, "csv/wordcloud/" + csv_wc[map_number] + "_wordcloud.csv")
        .await(function(error, mapData, listing, famous, wcData) {
            listing.forEach(function(d) {
                d.price = d.price * 1;
            });
            var projection = d3.geoMercator()
                .scale(scale[map_number])
                .center(center[map_number])
                .translate([(width + 100) / 2, (height + 100) / 2]);

            var path = d3.geoPath().projection(projection);

            var svg = d3.select(".map").append("svg").attr("width", width).attr("height", height).attr('y', '50');

            /* ----------------------------------------------------Draw Word Cloud--------------------------------------------*/
            var wc_postfix = "";

            wcData.forEach(function(d) {
                d.count = +d.count;
            });

            var filterlist = wcData.filter(function(d) {
                if (d.neighbourhood == wc_postfix) {
                    return d;
                }
            });
            drawWC(filterlist);

            /* ----------------------------------------------------Draw Polygon--------------------------------------------*/
            drawPolygon(listing);

            /* ----------------------------------------------------click background to quit zooming--------------------------------------------*/
            svg.append('rect')
                .attr('class', 'background')
                .attr('width', width)
                .attr('height', height)
                .on('click', clicked);
            
            $(".background").click(function(){
                tooltip2.style("visibility", "hidden");
            })
            var g = svg.append('g');

            var mapLayer = g.append('g')
                .classed('map-layer', true);

            $("button").css('cursor', 'pointer');
            $(".map-layer").css('cursor', 'pointer');
            /* ----------------------------------------------------Filter Data Based on Type and Price--------------------------------------------*/
            $("select").on('change', function (e){
                filterType = $(".getType").val();
                filterPrice = $(".getPrice").val() * 200;
                var listing2 = listing;
                listing2 = filterData(listing2, listing);
                count(listing2);
                changeMapColor(listing2);
            });
             /* ----------------------------------------------------Here will return a filtered list--------------------------------------------*/
            function filterData(listing2, listing) {
                if (filterType != 0 && filterPrice != 0) {
                    if (filterPrice == 6) {
                        listing2 = listing.filter(function(d) {
                            if (d.price >= 1000 && d.room_type == csv_type[filterType - 1]) {
                                return d;
                            }
                        });
                    } else {
                        listing2 = listing.filter(function(d) {
                            if (d.price < filterPrice && d.price >= filterPrice - 100 && d.room_type == csv_type[filterType - 1]) {
                                return d;
                            }
                        });
                    }
                } else if (filterType == 0 && filterPrice == 0) {
                    listing2 = listing;
                } else if (filterType == 0 && filterPrice != 0) {
                    if (filterPrice == 6) {
                        listing2 = listing.filter(function(d) {
                            if (d.price >= 1000) {
                                return d;
                            }
                        });
                    } else {
                        listing2 = listing.filter(function(d) {
                            if (d.price < filterPrice && d.price >= filterPrice - 100) {
                                return d;
                            }
                        });
                    }
                } else if (filterType != 0 && filterPrice == 0) {
                    listing2 = listing.filter(function(d) {
                        if (d.room_type == csv_type[filterType - 1]) {
                            return d;
                        }
                    });
                }
                return listing2;
            }
            var features = mapData.features;
            count(listing);

            /* ----------------------------------------------------Count Room Number and Save to Object--------------------------*/
            function count(listing) {
                countObj = {};
                listing.forEach(function(d) {
                    var neighbour = d.neighbourhood;
                    if (countObj[neighbour] === undefined) {
                        countObj[neighbour] = 1;
                    } else {
                        countObj[neighbour]++;
                    }
                    d.neighCount = countObj[neighbour];
                });
                domain = [0, d3.max(listing, function(d) {
                    return d.neighCount;
                })];
                color.domain(domain);
            }
            // Update color scale domain based on data

            /* ----------------------------------------------------Legend--------------------------*/
            appendLegned();
            var legend;
            var lengendSvg;

            function appendLegned() {
                legend = d3.select(".map").append("svg")
                    .attr("class", "legend")
                    .attr("width", 100)
                    .attr("height", 200)
                var defs = legend.append("defs");

                var linearGradient = defs.append("linearGradient")
                    .attr("id", "linear-gradient");

                linearGradient.append("stop")
                    .attr("offset", "0%")
                    .attr("stop-color", "#f7eded");

                linearGradient.append("stop")
                    .attr("offset", "100%")
                    .attr("stop-color", "#fd5c63");

                lengendSvg = svg.append("g");
                lengendSvg.append("rect")
                    .attr("class", "legend")
                    .attr("width", 150)
                    .attr("height", 20)
                    .attr("x", 700)
                    .attr("y", 20)
                    .style("fill", "url(#linear-gradient)");

                lengendSvg.append("text")
                    .attr("fill", "#4d4f54")
                    .attr("class", "legend")
                    .attr("id", "mainText")
                    .attr("x", 773)
                    .attr("y", 35)
                    .attr("text-anchor", "middle")
                    .style("font-size", "15px")
                    .text("Room Availability");
            }
            xScale();
            
            function xScale() {
                var xScale = d3.scaleLinear()
                    .range([-73, 75])
                    .domain(domain);

                //Define x-axis
                var xAxis = d3.axisBottom(xScale)
                    .ticks(5)
                    .scale(xScale);

                //Set up X axis
                lengendSvg.append("g")
                    .attr("class", "axis")
                    .attr("fill", "#4d4f54")
                    .attr("transform", "translate(775," + (35) + ")")

                    .call(xAxis);
            }
            /* ----------------------------------------------------Draw Map--------------------------*/
            mapLayer.selectAll('path')
                .data(features)
                .enter().append('path')
                .attr('id', function(d) {
                    return nameFn(d);
                })
                .attr('d', path)
                .attr('vector-effect', 'non-scaling-stroke')
                .style('fill', function(d) {
                    if (countObj[nameFn(d)] >= 0) {
                        return color(countObj[nameFn(d)]);
                    } else {
                        return '#f7eded';
                    }
                })
                .on('click', clicked)
                .on("mouseover", function(d) {
                    tooltip.text(nameFn(d) + "  Availability: " + countObj[nameFn(d)]);
                    tooltip.style("visibility", "visible");

                })
                .on("mousemove", function() {
                    return tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
                })
                .on("mouseout", function(d) {
                    return tooltip.style("visibility", "hidden");
                });
              /* ----------------------------------------------------attractions svg--------------------------------------------*/
            var logo = d3.select(".map").append("svg")
                .attr("class", "logo")
                .attr("width", 25)
                .attr("height", 25);
            logo.append("defs").append("pattern")
                .attr("id", "famousLogo1")
                .attr('patternUnits', 'userSpaceOnUse')
                .attr("width", 25)
                .attr("height", 25)
                .append("image")
                .attr("xlink:href", "svg/logo4.svg")
                .attr("width", 25)
                .attr("height", 25);
            logo.append("defs").append("pattern")
                .attr("id", "famousLogo2")
                .attr('patternUnits', 'userSpaceOnUse')
                .attr("width", 8)
                .attr("height", 8)
                .append("image")
                .attr("xlink:href", "svg/logo4.svg")
                .attr("width", 8)
                .attr("height", 8);
             /* ----------------------------------------------------show attractions on the map --------------------------------------------*/
            if ($(".famousClicker").prop('checked') == true) {
                plotFamous(25, 25, 1);
            } else {
                d3.selectAll('.famous').remove();
            }
            $(".famousClicker").click(function() {
                if (this.checked == true) {
                    plotFamous(25, 25, 1);
                } else {
                    d3.selectAll('.famous').remove();
                }
            });
            function plotFamous(height, width, id) {
                d3.selectAll('.famous').remove();
                mapLayer.append('g')
                    .selectAll("rect")
                    .data(famous)
                    .enter()
                    .append("rect")
                    .attr("class", "famous")
                    .attr("height", height)
                    .attr("width", width)
                    .style("fill", "url(#famousLogo" + id + ")")
                    .attr("transform", function(d) {
                        return "translate(" + projection([d.longitude, d.latitude]) + ")";
                    })
                    .on("mouseover", function(d) {
                        tooltip.html("<div>"+d.name+"</div><img src=\""+d.url+"\" style=\"width:128px;height:128px;\">");
                        tooltip.style("visibility", "visible");
                    })
                    .on("mousemove", function() {
                        return tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
                    })
                    .on("mouseout", function(d) {
                        return tooltip.style("visibility", "hidden");
                    });
            }
            /* ----------------------------------------------------Update Map Color--------------------------*/
            function changeMapColor() {
                mapLayer.selectAll('path').style('fill', function(d) {
                    if (countObj[nameFn(d)] >= 0) {
                        return color(countObj[nameFn(d)]);
                    } else {
                        return '#f7eded';
                    }
                })
                d3.selectAll('.axis').remove();
                appendLegned();
                xScale();
            }

            // Get province name
            function nameFn(d) {
                return d && d.properties ? d.properties.neighbourhood : null;
            }
            /* ----------------------------------------------------Map Zooming--------------------------------------------*/
            function clicked(d) {
                var x, y, k;
                if (d && centered !== d) {
                    filterType = $(".getType").val();
                    filterPrice = $(".getPrice").val() * 200;
                    var centroid = path.centroid(d);
                    x = centroid[0];
                    y = centroid[1];
                    k = 4;
                    centered = d;
                    wc_postfix = nameFn(d);
                    d3.selectAll('.axis').remove();
                    d3.selectAll('.legend').remove();
                    plotPoints(d);
                    if ($(".famousClicker").prop('checked') == true) {
                        plotFamous(8, 8, 2);
                    } else {
                        d3.selectAll('.famous').remove();
                    }
                    $(".famousClicker").click(function() {
                        if (this.checked == true) {
                            plotFamous(8, 8, 2);
                        } else {
                            d3.selectAll('.famous').remove();
                        }
                    });
                    $(".filterClicker").click(function() {
                        filterType = $(".getType").val();
                        filterPrice = $(".getPrice").val() * 200;
                        plotPoints(d);
                        d3.selectAll('.axis').remove();
                        d3.selectAll('.legend').remove();
                    });

                } else {
                    d3.select(".map-layer").selectAll('.points').remove();
                    x = width / 2;
                    y = height / 2;
                    k = 1;
                    centered = null;
                    wc_postfix = "";
                    appendLegned();
                    xScale();
                    if ($(".famousClicker").prop('checked') == true) {
                        plotFamous(25, 25, 1);
                    } else {
                        d3.selectAll('.famous').remove();
                    }
                    $(".famousClicker").click(function() {
                        if (this.checked == true) {
                            plotFamous(25, 25, 1);
                        } else {
                            d3.selectAll('.famous').remove();
                        }
                    });
                    $(".filterClicker").click(function() {
                        d3.selectAll('.points').remove();
                        filterType = $(".getType").val();
                        filterPrice = $(".getPrice").val() * 200;
                        appendLegned();
                        xScale();
                    });
                }
                filterlist = wcData.filter(function(d) {
                    if (d.neighbourhood == wc_postfix) {
                        return d;
                    }
                });
                drawWC(filterlist);
                drawPolygon(listing);
                mapLayer.selectAll('path')
                    .style('fill', function(d) {
                        if (countObj[nameFn(d)] >= 0) {
                            return color(countObj[nameFn(d)]);
                        } else {
                            return '#f7eded';
                        }
                    });
                g.transition()
                    .duration(750)
                    .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')scale(' + k + ')translate(' + -x + ',' + -y + ')');
            }
 /* ----------------------------------------------------Plot each room on the map--------------------------------------------*/
            function plotPoints(d) {
                d3.selectAll('.points').remove();
                var custype = [{
                    type: "Avaliable",
                    value: 0
                }, {
                    type: "NotAvaliable",
                    value: 0
                }];
                var listing3 = listing.filter(function(data) {
                    if (data.neighbourhood == nameFn(d)) {
                        return data;
                    }
                });
                var filteredListing = filterData(filteredListing, listing3);
                filteredListing.forEach(function(d) {
                    d.price = d.price * 1;
                });

                var maxPrice = d3.max(filteredListing, function(d) {
                    return d.price;
                });
                console.log(maxPrice);
                if (maxPrice >= 1000) {
                    interval = 200;
                } else if (maxPrice <= 400) {
                    interval = 50;
                }
                else
                {
                    interval = 100;
                }
                mapLayer.append('g')
                    .selectAll("circle")
                    .data(filteredListing)
                    .enter()
                    .append("circle")
                    .attr("class", function(d) {
                        return "points price" + Math.ceil(d.price / interval) * interval;
                    })
                    .attr("id", function(d) {
                        return "room" + d.id;
                    })
                    .attr("r", 1.2)
                    .attr("fill", "rgba(104, 108, 112,0.7)")
                    .style("stroke", "#d63e7d")
                    .style("stroke-width", 0.2)
                    .attr("transform", function(d) {
                        return "translate(" + projection([d.longitude, d.latitude]) + ")";
                    })
                    .on("mouseover", function(d) {
                        tooltip2.html("<div class=\"details\"><p class=\"des\">Click the pin to fix tooltip position</p><p class=\"des\">scroll down to read more</p><h3>" + d.name + "</h3>" + "<p>Room Type: " + d.room_type + "</p>" +
                            "<h4>Availability In 365 Days: </h4><div class=\"pie\"></div>" +
                            "<h4>Price: <div class=\"text\">0</div><div class=\"lineChart\"></div></h4><h4 id=\"rateText\">Rating</h4><svg id=\"fill\"></svg></div><button type=\"button\" id=\"close\">close</button></div>");
                        custype[0].value = d.availability_365;
                        custype[1].value = 365 - custype[0].value;
                        d3.select("#close").style("margin-top", "15px");

                        priceBarChart(filteredListing, d.price)
                        if (d.review_scores_rating == "") {
                            document.getElementById("rateText").innerHTML = "Rating is not available at this time";
                        } else {
                            ratingFill(d.review_scores_rating);
                        }
                        textTween(d.price);
                        pieChart(custype);
                        tooltip2.style("visibility", "visible");
                    })
                    .on("click", function(d) {
                        if (click == 0) {
                            click = 1;
                            id = $(this).attr("id");
                            $("#" + id).attr("r", 2.8).attr("fill", "rgba(0,0,0,0.7)");
                        } else {
                            click = 0;
                            $("#" + id).attr("r", 1.2).attr("fill", "rgba(104, 108, 112,0.7)");
                        }
                        closeTooltip();
                    })
                    .on("mouseout", function(d) {
                        if (click == 0) {
                            return tooltip2.style("visibility", "hidden");
                        } else if (click == 1) {
                            tooltip2.style("visibility", "visible");
                        }
                        closeTooltip();
                    });
                /* ----------------------------------------------------[tooltip]Close Tooltip when clicked close button--------------------------------------------*/
                function closeTooltip() {
                    $("#close").click(function() {
                        click = 0;
                        tooltip2.style("visibility", "hidden");
                        $("#" + id).attr("r", 1.2).attr("fill", "rgba(104, 108, 112,0.7)");
                    });
                }

                function ratingFill(rate) {
                    d3.select("#fill").call(d3.liquidfillgauge, rate, {
                        circleThickness: 0.2,
                        circleColor: "#fd5c63",
                        textColor: "#fd5c63",
                        waveTextColor: "#4d4f54",
                        waveColor: "#fd5c63",
                        textVertPosition: 0.52,
                        waveAnimateTime: 2000,
                        waveHeight: 0.2,
                        waveCount: 2,
                        waveOffset: 0.25,
                        textSize: 1.2,
                        minValue: 50,
                        maxValue: 101,
                        displayPercent: false
                    });
                }
                /* ----------------------------------------------------[tooltip]Price Text Tween effect--------------------------------------------*/
                function textTween(price) {
                    var format = d3.format(",d");
                    d3.select(".text")
                        .transition()
                        .duration(1500)
                        .on("start", function repeat() {
                            d3.active(this)
                                .tween("text", function() {
                                    var that = d3.select(this),
                                        i = d3.interpolateNumber(that.text().replace(/,/g, ""), price);
                                    return function(t) {
                                        that.text("$" + format(i(t)));
                                    };
                                })
                                .transition()
                                .delay(500)
                        });
                }
                /* ----------------------------------------------------[tooltip]PriceBarCahrt--------------------------------------------*/
                function priceBarChart(filteredListing, curPrice) {
                    var array = [];
                    var countObj = {};
                    filteredListing.forEach(function(d) {
                        price = Math.ceil(d.price / interval) * interval;
                        if (countObj[price] === undefined) {
                            countObj[price] = 1;
                            array.push({
                                range: price,
                                count: 1,
                                name: price - interval + "-" + price
                            });
                        } else {
                            $.each(array, function() {
                                if (this.range === price) {
                                    this.count++;
                                }
                            });
                        }
                    });
                    array.sort(function(a, b) {
                        return a.range - b.range
                    });
                    console.log(array);
                    var width = 200;
                    var height = 200;
                    var margin = 50;
                    var svg3 = d3.select(".lineChart").append("svg")
                        .attr("width", width + 80)
                        .attr("height", height + 80)
                        .append("g")
                        .attr("transform",
                            "translate(" + 40 + "," + 40 + ")");
                    var x = d3.scaleBand().rangeRound([0, width]).padding(0.1),
                        y = d3.scaleLinear().rangeRound([height, 0]);

                    var g = svg3.append("g")
                        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                    x.domain(array.map(function(d) {
                        return d.name;
                    }));
                    y.domain([0, d3.max(array, function(d) {
                        return d.count;
                    }) * 1.2]);

                    g.append("g")
                        .attr("class", "axis axis--x")
                        .attr("transform", "translate(0," + height + ")")
                        .call(d3.axisBottom(x))
                        .selectAll("text")
                        .attr("y", 0)
                        .attr("x", 4)
                        .attr("dy", ".35em")
                        .attr("transform", "rotate(38)")
                        .style("text-anchor", "start");

                    g.append("g")
                        .attr("class", "axis axis--y")
                        .call(d3.axisLeft(y).ticks(10))
                        .append("text")
                        .attr("transform", "rotate(-90)")
                        .attr("y", 6)
                        .attr("dy", "0.71em")
                        .attr("text-anchor", "end")
                        .text("Count");

                    g.selectAll(".bar")
                        .data(array)
                        .enter().append("rect")
                        .attr("class", function(d) {
                            return "price" + d.range;
                        })
                        .attr("id", function(d) {
                            return "range" + d.name;
                        })
                        .attr("x", function(d) {
                            return x(d.name);
                        })
                        .attr("y", function(d) {
                            return y(d.count);
                        })
                        .attr("width", x.bandwidth())
                        .attr("height", function(d) {
                            return height - y(d.count);
                        })
                        .attr("fill", "#fd5c63")
                        .on("mouseover", function(d) {
                            d3.selectAll(".price" + d.range).filter("circle").attr("fill", "#ffffff");
                            d3.selectAll(".price" + d.range).filter("rect").attr("fill", "#ffffff");
                        })
                        .on("mouseout", function(d) {
                            d3.selectAll(".price" + d.range).filter("circle").attr("fill", "rgba(104, 108, 112,0.7)");
                            d3.selectAll(".price" + d.range).filter("rect").attr("fill", "#fd5c63");
                            $("#" + id).attr("r", 2.8).attr("fill", "rgba(0,0,0,0.7)");
                            d3.select("#range" + curRange).attr("fill", "rgba(0,0,0,0.7)");
                        });
                    //curPrice = Math.ceil(d.price/interval) * interval;
                    $.each(array, function() {
                        if (this.range - interval < curPrice && this.range >= curPrice) {
                            curRange = this.name;
                        }
                    });
                    console.log(curRange);
                    d3.select("#range" + curRange).attr("fill", "rgba(0,0,0,0.7)");

                }
                /* ----------------------------------------------------[tooltip]Availability in 365 Pie Chart--------------------------------------------*/
                function pieChart(custype) {
                    var chart = d3.select(".pie").append("svg")
                        .attr("width", 200 + 5 + 5)
                        .attr("height", 200 + 5 + 5)
                        .append("g")
                        .attr("transform",
                            "translate(" + ((200 / 2) + 5) + "," + ((200 / 2) + 5) + ")");

                    var radius = Math.min(200, 200) / 2;
                    var color = d3.scaleOrdinal().range(["#fd5c63", "#4d4f54"]);
                    var arc = d3.arc().outerRadius(radius).innerRadius(radius - 20);
                    var pie = d3.pie().sort(null)
                        .startAngle(1.1 * Math.PI)
                        .endAngle(3.1 * Math.PI)
                        .value(function(d) {
                            return d.value;
                        });
                    var g = chart.selectAll(".arc")
                        .data(pie(custype))
                        .enter().append("g")
                        .attr("class", "arc");
                    g.append("path")
                        .style("fill", function(d) {
                            return color(d.data.type);
                        })
                        .transition().delay(function(d, i) {
                            return i * 500;
                        }).duration(500)
                        .attrTween('d', function(d) {
                            var i = d3.interpolate(d.startAngle + 0.1, d.endAngle);
                            return function(t) {
                                d.endAngle = i(t);
                                return arc(d);
                            }
                        });
                    var ratio1 = custype[0].value / 365 * 100;
                    ratio1 = Math.round(ratio1 * 10) / 10;
                    chart.append("text")
                        .attr("fill", "#4d4f54")
                        .attr("x", 0)
                        .attr("y", 0 + (40 / 2) - 15)
                        .attr("text-anchor", "middle")
                        .style("font-size", "18px")
                        .text("Availability: " + ratio1 + "%");

                }
            }

            /* ----------------------------------------------------Draw Word Cloud--------------------------------------------*/
            function drawWC(wcData) {
                d3.selectAll('.wc svg').remove();

                var svg_wc = d3.select('.wc').append("svg")
                    .attr("width", 400)
                    .attr("height", 200)
                    .append("g")
                    .attr("transform", "translate(5,5)");

                var wordcloud = svg_wc.append("g")
                    .attr('class', 'wordcloud')
                    .attr("transform", "translate(" + 400 / 2 + "," + 200 / 2 + ")");

                var maximum = d3.max(wcData, function(d) {
                    return d.count;
                });
                var minimum = d3.min(wcData, function(d) {
                    return d.count;
                });

                var color_wc = d3.scaleLinear()
                    .range(['#F3DBD3', '#fd5c63'])
                    .domain([Math.sin(minimum), Math.sqrt(maximum)]);

                var layout = d3.layout.cloud()
                    .timeInterval(10000)
                    .size([350, 150])
                    .words(wcData)
                    .rotate(function(d) {
                        return 0;
                    })
                    .font('monospace')
                    .fontSize(function(d) {
                        return (Math.sqrt(d.count) / Math.sqrt(maximum)) * 70;
                    })
                    .text(function(d) {
                        return d.word;
                    })
                    .spiral("archimedean")
                    .on("end", draw)
                    .start();

                function draw(words) {
                    wordcloud.selectAll("text")
                        .data(words)
                        .enter().append("text").transition().duration(700)
                        .attr('class', 'word')
                        .style("font-size", function(d) {
                            return d.size + "px";
                        })
                        .style("font-family", function(d) {
                            return d.font;
                        })
                        .style("fill", function(d) {
                            return color_wc(Math.sqrt(d.count));
                        })
                        .attr("text-anchor", "middle")
                        .attr("transform", function(d) {
                            return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                        })
                        .text(function(d) {
                            return d.text;
                        })
                    wordcloud.exit()
                        .remove();

                };
            }

            /* ----------------------------------------------------Draw Polygon--------------------------------------------*/
            function drawPolygon(listing) {
                d3.select('#polygon svg').remove();
                //var rating_list = ["review_scores_accuracy", "review_scores_cleanliness", "review_scores_checkin", "review_scores_communication", "review_scores_location", "review_scores_rating"]
                var rating_accu = 0,
                    rating_clean = 0,
                    rating_checkin = 0,
                    rating_comm = 0,
                    rating_loc = 0,
                    rating_overall = 0;
                /* ----------------------------------------------------Calculate Rating--------------------------------------------*/
                if (wc_postfix == "") {
                    rating_accu = d3.mean(listing, function(d) {
                        if (d.review_scores_accuracy) return d.review_scores_accuracy
                    });
                    rating_clean = d3.mean(listing, function(d) {
                        if (d.review_scores_cleanliness) return d.review_scores_cleanliness
                    });
                    rating_checkin = d3.mean(listing, function(d) {
                        if (d.review_scores_checkin) return d.review_scores_checkin
                    });
                    rating_comm = d3.mean(listing, function(d) {
                        if (d.review_scores_communication) return d.review_scores_communication
                    });
                    rating_loc = d3.mean(listing, function(d) {
                        if (d.review_scores_location) return d.review_scores_location
                    });
                    rating_overall = d3.mean([rating_accu, rating_clean, rating_checkin, rating_comm, rating_loc]);
                } else {
                    rating_accu = d3.mean(listing, function(d) {
                        if (d.neighbourhood == wc_postfix)
                            if (d.review_scores_accuracy) return d.review_scores_accuracy
                    });
                    rating_clean = d3.mean(listing, function(d) {
                        if (d.neighbourhood == wc_postfix)
                            if (d.review_scores_cleanliness) return d.review_scores_cleanliness
                    });
                    rating_checkin = d3.mean(listing, function(d) {
                        if (d.neighbourhood == wc_postfix)
                            if (d.review_scores_checkin) return d.review_scores_checkin
                    });
                    rating_comm = d3.mean(listing, function(d) {
                        if (d.neighbourhood == wc_postfix)
                            if (d.review_scores_communication) return d.review_scores_communication
                    });
                    rating_loc = d3.mean(listing, function(d) {
                        if (d.neighbourhood == wc_postfix)
                            if (d.review_scores_location) return d.review_scores_location
                    });
                    rating_overall = d3.mean([rating_accu, rating_clean, rating_checkin, rating_comm, rating_loc]);
                }

                /* ----------------------------------------------------Draw Base Polygon--------------------------------------------*/
                var vis = d3.select("#polygon").append("svg")
                    .attr("width", 400)
                    .attr("height", 250),

                    scaleX = d3.scaleLinear()
                    .domain([-10, 10])
                    .range([0, 200]),

                    scaleY = d3.scaleLinear()
                    .domain([-10, 10])
                    .range([190, 0]),

                    poly = [{
                            "x": 0.0,
                            "y": 10.0
                        },
                        {
                            "x": -10.0,
                            "y": 2
                        },
                        {
                            "x": -6.5,
                            "y": -10
                        },
                        {
                            "x": 6.5,
                            "y": -10
                        },
                        {
                            "x": 10.0,
                            "y": 2
                        }
                    ];

                vis.selectAll("polygon")
                    .data([poly])
                    .enter().append("polygon")
                    .attr("transform", "translate(100,40)")
                    .attr("points", function(d) {
                        return d.map(function(d) {
                            return [scaleX(d.x), scaleY(d.y)].join(",");
                        }).join(" ");
                    })
                    .attr("stroke", "#fff")
                    .style("fill", "#FFECED")
                    .style("margin", "auto")
                    .attr("stroke-width", 2);

                /* ----------------------------------------------------Draw Top Polygon--------------------------------------------*/
                var newpoly = [{
                        "x": 0.0,
                        "y": rating_accu
                    },
                    {
                        "x": -rating_clean,
                        "y": 2 * (rating_clean / 10)
                    },
                    {
                        "x": -6.5 * (rating_checkin / 10),
                        "y": -rating_checkin
                    },
                    {
                        "x": 6.5 * (rating_comm / 10),
                        "y": -rating_comm
                    },
                    {
                        "x": rating_loc,
                        "y": 2 * (rating_loc / 10)
                    }
                ];

                var poly_g = vis.append("g")
                    .attr("transform", "translate(0,0)");

                poly_g.selectAll("polygon")
                    .data([newpoly])
                    .enter().append("polygon")
                    .attr("transform", "translate(100,40)")
                    .attr("points", function(d) {
                        return d.map(function(d) {
                            return [scaleX(d.x), scaleY(d.y)].join(",");
                        }).join(" ");
                    })
                    .attr("stroke", "#fff")
                    .style("fill", "#FD5C63")
                    .style("margin", "auto")
                    .attr("stroke-width", 2);

                /* ----------------------------------------------------Add LLine--------------------------------------------*/
                poly_g.append("line")
                    .attr("x1", 200)
                    .attr("y1", 140)
                    .attr("x2", scaleX(poly[0].x) + 100)
                    .attr("y2", scaleY(poly[0].y) + 40)
                    .attr("stroke-width", 1)
                    .attr("stroke", "brown")
                    .style("stroke-dasharray", ("3, 7"));
                poly_g.append("line")
                    .attr("x1", 200)
                    .attr("y1", 140)
                    .attr("x2", scaleX(poly[1].x) + 100)
                    .attr("y2", scaleY(poly[1].y) + 40)
                    .attr("stroke-width", 1)
                    .attr("stroke", "brown")
                    .style("stroke-dasharray", ("3, 7"));
                poly_g.append("line")
                    .attr("x1", 200)
                    .attr("y1", 140)
                    .attr("x2", scaleX(poly[2].x) + 100)
                    .attr("y2", scaleY(poly[2].y) + 40)
                    .attr("stroke-width", 1)
                    .attr("stroke", "brown")
                    .style("stroke-dasharray", ("3, 7"));
                poly_g.append("line")
                    .attr("x1", 200)
                    .attr("y1", 140)
                    .attr("x2", scaleX(poly[3].x) + 100)
                    .attr("y2", scaleY(poly[3].y) + 40)
                    .attr("stroke-width", 1)
                    .attr("stroke", "brown")
                    .style("stroke-dasharray", ("3, 7"));
                poly_g.append("line")
                    .attr("x1", 200)
                    .attr("y1", 140)
                    .attr("x2", scaleX(poly[4].x) + 100)
                    .attr("y2", scaleY(poly[4].y) + 40)
                    .attr("stroke-width", 1)
                    .attr("stroke", "brown")
                    .style("stroke-dasharray", ("3, 7"));
                /* ----------------------------------------------------Add Text--------------------------------------------*/
                poly_g.append("text")
                    .attr("transform", "translate(200,160)")
                    .attr("fill", "#00000")
                    .attr("text-anchor", "middle")
                    .style("font-size", "50px")
                    .style("font-weight", "bold")
                    .text(rating_overall.toFixed(2));

                poly_g.append("text")
                    .attr("transform", "translate(200,12)")
                    .attr("fill", "#00000")
                    .attr("text-anchor", "middle")
                    .style("font-size", "16px")
                    .text("Accuracy");
                poly_g.append("text")
                    .attr("transform", "translate(200,30)")
                    .attr("fill", "#00000")
                    .attr("text-anchor", "middle")
                    .style("font-size", "16px")
                    .text(rating_accu.toFixed(2) + "/10");

                poly_g.append("text")
                    .attr("transform", "translate(60,100)")
                    .attr("fill", "#00000")
                    .attr("text-anchor", "middle")
                    .style("font-size", "16px")
                    .text("Cleanliness");
                poly_g.append("text")
                    .attr("transform", "translate(60,118)")
                    .attr("fill", "#00000")
                    .attr("text-anchor", "middle")
                    .style("font-size", "16px")
                    .text(rating_clean.toFixed(2) + "/10");

                poly_g.append("text")
                    .attr("transform", "translate(90,230)")
                    .attr("fill", "#00000")
                    .attr("text-anchor", "middle")
                    .style("font-size", "16px")
                    .text("Checkin");
                poly_g.append("text")
                    .attr("transform", "translate(90,248)")
                    .attr("fill", "#00000")
                    .attr("text-anchor", "middle")
                    .style("font-size", "16px")
                    .text(rating_checkin.toFixed(2) + "/10");

                poly_g.append("text")
                    .attr("transform", "translate(340,230)")
                    .attr("fill", "#00000")
                    .attr("text-anchor", "middle")
                    .style("font-size", "16px")
                    .text("Communication");
                poly_g.append("text")
                    .attr("transform", "translate(340,248)")
                    .attr("fill", "#00000")
                    .attr("text-anchor", "middle")
                    .style("font-size", "16px")
                    .text(rating_comm.toFixed(2) + "/10");

                poly_g.append("text")
                    .attr("transform", "translate(340,100)")
                    .attr("fill", "#00000")
                    .attr("text-anchor", "middle")
                    .style("font-size", "16px")
                    .text("Location");
                poly_g.append("text")
                    .attr("transform", "translate(340,118)")
                    .attr("fill", "#00000")
                    .attr("text-anchor", "middle")
                    .style("font-size", "16px")
                    .text(rating_loc.toFixed(2) + "/10");
            }
        });
}
