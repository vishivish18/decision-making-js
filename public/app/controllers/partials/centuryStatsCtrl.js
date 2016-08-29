// Century Stats controller
// This controller is attached to a directive - centuryStats
// and the purpose of this controller is to work on the centuryStats passed to its $scope via its attribute

angular.module('app')
    .controller('centuryStatsCtrl', function($scope) {
        // Watch for the $scope.centuryStats variable to get the data from attribute
        $scope.$watch(function() {
            return $scope.centuryStats;
        }, function(n) {
            if (!n) return;
            // If it has received data then start working on Analyzing Centuries
            $scope.analyzeCenturies($scope.centuryStats);
        });

        $scope.analyzeCenturies = function(centuryStats) {
            //Get the runs scored while making a century
            var scores = _.pluck(centuryStats.centuriesScored, 'runs');

            //Get the opponents againse which the century was scored
            var against = _.pluck(centuryStats.centuriesScored, 'against');

            //Get the total number of half centuries scored
            var totalFifties = centuryStats.halfCenturiesScored.length;

            //Get the total number of centuries scored
            var totalHundreds = centuryStats.centuriesScored.length;
            //Send array of colors to chartjs
            var colors = [];
            centuryStats.centuriesScored.map(function(res, key) {
                if (res.result == "won") {
                    colors[key] = "#0084FF";
                } else if (res.result == "lost") {
                    colors[key] = "#ED3F2F";
                } else if (res.result == "tied") {
                    colors[key] = "#DFF8EB";
                } else {
                    colors[key] = "#DDB967";
                }
                return colors;
            });
            var won = _.filter(centuryStats.centuriesScored, function(cent) {
                return cent.result == "won";
            });
            // var lost = _.filter(centuryStats.centuriesScored, function(cent){
            //   return cent.result === "lost"
            // })
            // var tied = _.filter(centuryStats.centuriesScored, function(cent){
            //   return cent.result === "tied"
            // })
            // var noresult = _.filter(centuryStats.centuriesScored, function(cent){
            //   return cent.result === "n/r"
            // })

            //Century while chasing
            var chasingCenturies = _.filter(centuryStats.centuriesScored, function(cent) {
                return cent.innings == "2nd";
            });
            var winchasingCenturies = _.filter(chasingCenturies, function(cent) {
                return cent.result == "won";
            });
            var lostchasingCenturies = _.filter(chasingCenturies, function(cent) {
                return cent.result === "lost";
            });
            var tiedchasingCenturies = _.filter(chasingCenturies, function(cent) {
                return cent.result === "tied";
            });
            var noresultchasingCenturies = _.filter(chasingCenturies, function(cent) {
                return cent.result === "n/r";
            });

            //Century against teams
            var centuryAgainstTeams = [];
            centuryStats.centuriesScored.map(function(res) {
                var team = res.against;
                var century = {
                    score: res.runs
                };
                if (typeof(centuryAgainstTeams[team]) == "undefined")
                    centuryAgainstTeams[team] = [];
                return centuryAgainstTeams[team].push(century);
            });

            //Century over the years
            var centuryByYear = [];
            centuryStats.centuriesScored.map(function(res) {
                var year = res.year;
                var century = {
                    score: res.runs
                };
                if (typeof(centuryByYear[year]) == "undefined")
                    centuryByYear[year] = [];
                return centuryByYear[year].push(century);
            });

            var halfCenturyByYear = [];
            centuryStats.halfCenturiesScored.map(function(res) {
                var year = res.year;
                var halfCentury = {
                    score: res.runs
                };
                if (typeof(halfCenturyByYear[year]) == "undefined")
                    halfCenturyByYear[year] = [];
                return halfCenturyByYear[year].push(halfCentury);
            });


            $scope.winningRatio = (won.length / centuryStats.centuriesScored.length).toFixed(2) * 10;
            $scope.prepareBarGraph(scores, against, colors);
            $scope.prepareBarGraphAgainstTeam(centuryAgainstTeams);
            $scope.prepareLineGraph(centuryByYear, halfCenturyByYear);
            $scope.prepareDoughnutChart(winchasingCenturies.length, lostchasingCenturies.length, tiedchasingCenturies.length, noresultchasingCenturies.length);
            $scope.prepareConversionRatePieChart(totalFifties, totalHundreds);
        };


        // Prepare Bar graph to show Century against teams and the match result via colors
        $scope.prepareBarGraph = function(scores, against, colors) {
            $scope.bardata = {
                labels: against,
                datasets: [{
                    label: 'Centuries',
                    fillColor: colors,
                    strokeColor: 'rgba(220,220,220,1)',
                    pointColor: 'rgba(220,220,220,1)',
                    pointStrokeColor: '#fff',
                    pointHighlightFill: '#fff',
                    pointHighlightStroke: 'rgba(220,220,220,1)',
                    data: scores
                }]
            };

            // Chart.js Options
            $scope.baroptions = {

                // Sets the chart to be responsive
                responsive: true,

                //Boolean - Whether the scale should start at zero, or an order of magnitude down from the lowest value
                scaleBeginAtZero: true,

                //Boolean - Whether grid lines are shown across the chart
                scaleShowGridLines: true,

                //String - Colour of the grid lines
                scaleGridLineColor: "rgba(0,0,0,.05)",

                //Number - Width of the grid lines
                scaleGridLineWidth: 1,

                //Boolean - If there is a stroke on each bar
                barShowStroke: true,

                //Number - Pixel width of the bar stroke
                barStrokeWidth: 2,

                //Number - Spacing between each of the X value sets
                barValueSpacing: 5,

                //Number - Spacing between data sets within X values
                barDatasetSpacing: 1
            };
        };

        //Prepare bar graph to show number of centuries against teams
        $scope.prepareBarGraphAgainstTeam = function(centuryAgainstTeams) {
            var againstForCenturies = [];
            var numberOfCenturies = [];
            for (var centuryKey in centuryAgainstTeams) {
                if (centuryAgainstTeams.hasOwnProperty(centuryKey)) {
                    againstForCenturies.push(centuryKey);
                    numberOfCenturies.push(centuryAgainstTeams[centuryKey].length);
                }
            }
            $scope.bardataAgainstTeam = {
                labels: againstForCenturies,
                datasets: [{
                    label: 'Centuries',
                    fillColor: ['#0084FF'],
                    strokeColor: 'rgba(220,220,220,1)',
                    pointColor: 'rgba(220,220,220,1)',
                    pointStrokeColor: '#fff',
                    pointHighlightFill: '#fff',
                    pointHighlightStroke: 'rgba(220,220,220,1)',
                    data: numberOfCenturies
                }]
            };

            // Chart.js Options
            $scope.baroptionsAgainstTeam = {

                // Sets the chart to be responsive
                responsive: true,

                //Boolean - Whether the scale should start at zero, or an order of magnitude down from the lowest value
                scaleBeginAtZero: true,

                //Boolean - Whether grid lines are shown across the chart
                scaleShowGridLines: true,

                //String - Colour of the grid lines
                scaleGridLineColor: "rgba(0,0,0,.05)",

                //Number - Width of the grid lines
                scaleGridLineWidth: 1,

                //Boolean - If there is a stroke on each bar
                barShowStroke: true,

                //Number - Pixel width of the bar stroke
                barStrokeWidth: 2,

                //Number - Spacing between each of the X value sets
                barValueSpacing: 5,

                //Number - Spacing between data sets within X values
                barDatasetSpacing: 1
            };
        };

        // Prepare Line Graph to show centuries and half centuries over the year
        $scope.prepareLineGraph = function(centuryByYear, halfCenturyByYear) {
            var yearOfcenturies = [];
            var numberOfCenturies = [];

            for (var century in centuryByYear) {
                if (centuryByYear.hasOwnProperty(century)) {
                    yearOfcenturies.push(century);
                    numberOfCenturies.push(centuryByYear[century].length);
                }
            }
            var yearOfhalfCenturies = [];
            var numberOfHalfCenturies = [];

            for (var halfCentury in halfCenturyByYear) {
                if (halfCenturyByYear.hasOwnProperty(halfCentury)) {
                    yearOfhalfCenturies.push(halfCentury);
                    numberOfHalfCenturies.push(halfCenturyByYear[halfCentury].length);
                }
            }
            // Now since there can be years when he scored a century and did not score a half century and vice versa
            // We need to find years for both seperately and take a union of them

            var yearWithNoHalfCentury = _.filter(yearOfcenturies, function(el) {
                return yearOfhalfCenturies.indexOf(el) < 0;
            });
            var yearWithNoCentury = _.filter(yearOfhalfCenturies, function(el) {
                return yearOfcenturies.indexOf(el) < 0;
            });

            // Taking union of both years of centuries and half centuries, CLEAN IT UP LATER
            var allYearsForData = _.union(yearOfcenturies, yearOfhalfCenturies).sort();
            var indexOfNoHalfcentury = yearWithNoHalfCentury.map(function(res) {
                return allYearsForData.indexOf(res);
            });
            var indexOfNoCentury = yearWithNoCentury.map(function(res) {
                return allYearsForData.indexOf(res);
            });
            // Add insert method add prototype level later if this type of functionality is required frequently
            // Since we have the years without century and without half century we can add 0 in their respective arrays
            // for those years
            indexOfNoCentury.map(function(res) {
                return numberOfCenturies.splice(res, 0, 0);
            });
            indexOfNoHalfcentury.map(function(res) {
                return numberOfHalfCenturies.splice(res, 0, 0);
            });
            $scope.lineData = {
                labels: allYearsForData,
                datasets: [{
                    label: 'Half Centuries over the years',
                    fillColor: ['rgba(0,132,255,0.4)'],
                    strokeColor: 'rgba(0,132,255,0.4)',
                    pointColor: 'rgba(0,132,255,0.4)',
                    pointStrokeColor: '#fff',
                    pointHighlightFill: '#fff',
                    pointHighlightStroke: 'rgba(220,220,220,1)',
                    data: numberOfHalfCenturies
                }, {
                    label: 'Centuries',
                    fillColor: ['rgba(220,220,220,0.6)'],
                    strokeColor: 'rgba(220,220,220,0.6)',
                    pointColor: 'rgba(220,220,220,0.6)',
                    pointStrokeColor: '#fff',
                    pointHighlightFill: '#fff',
                    pointHighlightStroke: 'rgba(220,220,220,1)',
                    data: numberOfCenturies
                }]
            };

            // Chart.js Options
            $scope.lineOptions = {

                // Sets the chart to be responsive
                responsive: true,

                ///Boolean - Whether grid lines are shown across the chart
                scaleShowGridLines: true,

                //String - Colour of the grid lines
                scaleGridLineColor: "rgba(0,0,0,.05)",

                //Number - Width of the grid lines
                scaleGridLineWidth: 1,

                //Boolean - Whether the line is curved between points
                bezierCurve: true,

                //Number - Tension of the bezier curve between points
                bezierCurveTension: 0.4,

                //Boolean - Whether to show a dot for each point
                pointDot: true,

                //Number - Radius of each point dot in pixels
                pointDotRadius: 4,

                //Number - Pixel width of point dot stroke
                pointDotStrokeWidth: 1,

                //Number - amount extra to add to the radius to cater for hit detection outside the drawn point
                pointHitDetectionRadius: 20,

                //Boolean - Whether to show a stroke for datasets
                datasetStroke: true,

                //Number - Pixel width of dataset stroke
                datasetStrokeWidth: 2,

                //Boolean - Whether to fill the dataset with a colour
                datasetFill: true,

                // Function - on animation progress
                onAnimationProgress: function() {},

                // Function - on animation complete
                onAnimationComplete: function() {}

            };
        };
        $scope.prepareDoughnutChart = function(won, lost, tied, noresult) {
            $scope.resources = [{
                value: won,
                color: '#FFFF00',
                highlight: '#e5e500',
                label: 'India Won'
            }, {
                value: lost,
                color: '#46BFBD',
                highlight: '#5AD3D1',
                label: 'India Lost'
            }, {
                value: tied,
                color: '#F7464A',
                highlight: '#FF5A5E',
                label: 'Match Tied'
            }, {
                value: noresult,
                color: '#F7464A',
                highlight: '#EF5A5E',
                label: 'No Result'
            }];

            // Chart.js Options
            $scope.options = {

                // Sets the chart to be responsive
                responsive: true,

                //Boolean - Whether we should show a stroke on each segment
                segmentShowStroke: true,

                //String - The colour of each segment stroke
                segmentStrokeColor: '#fff',

                //Number - The width of each segment stroke
                segmentStrokeWidth: 2,

                //Number - The percentage of the chart that we cut out of the middle
                percentageInnerCutout: 50, // This is 0 for Pie charts

                //Number - Amount of animation steps
                animationSteps: 100,

                //String - Animation easing effect
                animationEasing: 'easeOutBounce',

                //Boolean - Whether we animate the rotation of the Doughnut
                animateRotate: true,

                //Boolean - Whether we animate scaling the Doughnut from the centre
                animateScale: false,

            };

        };

        $scope.prepareConversionRatePieChart = function(fifty, hundred) {
            $scope.conversionData = [{
                value: fifty,
                color: '#F7464A',
                highlight: '#FF5A5E',
                label: 'Half Centuries'
            }, {
                value: hundred,
                color: '#FDB45C',
                highlight: '#FFC870',
                label: 'Centuries'
            }];

            // Chart.js Options
            $scope.conversionOptions = {

                // Sets the chart to be responsive
                responsive: true,

                //Boolean - Whether we should show a stroke on each segment
                segmentShowStroke: true,

                //String - The colour of each segment stroke
                segmentStrokeColor: '#fff',

                //Number - The width of each segment stroke
                segmentStrokeWidth: 2,

                //Number - The percentage of the chart that we cut out of the middle
                percentageInnerCutout: 0, // This is 0 for Pie charts

                //Number - Amount of animation steps
                animationSteps: 100,

                //String - Animation easing effect
                animationEasing: 'easeOutBounce',

                //Boolean - Whether we animate the rotation of the Doughnut
                animateRotate: true,

                //Boolean - Whether we animate scaling the Doughnut from the centre
                animateScale: false

            };
        };
    });
