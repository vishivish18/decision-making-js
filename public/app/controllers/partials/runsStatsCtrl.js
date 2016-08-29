// Runs Stats controller
// This controller is attached to a directive - runsStats
// and the purpose of this controller is to work on the runsStats passed to its $scope via its attribute
angular.module('app')
    .controller('runsStatsCtrl', function($scope) {
        // Watch for the $scope.centuryStats variable to get the data from attribute
        $scope.$watch(function() {
            return $scope.runsStats;
        }, function(n) {
            if (!n) return;
            // If it has received data then start working on Analyzing Centuries
            $scope.analyzeInnings($scope.runsStats);
        });


        $scope.analyzeInnings = function(runsStats) {
            //Runs over the years
            var runsByYear = [];
            var runsAgainstTeams = [];
            var firstInnings = 0;
            var secondInnings = 0;
            var runsFirstInnings = 0;
            var runsSecondInnings = 0;
            runsStats.allInnings.map(function(res) {
                //calculate number of first innings and second innings played and run scored in them
                if (res.innings == "1st") {
                    firstInnings++;
                    runsFirstInnings += res.runs;
                } else {
                    secondInnings++;
                    runsSecondInnings += res.runs;
                }

                //get runs on yearly basis
                var year = res.year;
                var team = res.against;
                if (typeof(runsByYear[year]) == "undefined") {
                    runsByYear[year] = [];
                }
                if (typeof(runsByYear[year]) == "number") {
                    runsByYear[year] += parseInt(res.runs);
                } else {
                    runsByYear[year] = parseInt(res.runs);
                }

                //get runs against teams
                if (typeof(runsAgainstTeams[team]) == "undefined") {
                    runsAgainstTeams[team] = [];
                }
                if (typeof(runsAgainstTeams[team]) == "number") {
                    return runsAgainstTeams[team] += parseInt(res.runs);
                } else {
                    return runsAgainstTeams[team] = parseInt(res.runs);
                }
            });
            $scope.prepareRunsByYearGraph(runsByYear);
            $scope.prepareRunsByTeamGraph(runsAgainstTeams);
            $scope.prepareRunsByInningsGraph(runsFirstInnings, runsSecondInnings);
            $scope.prepareAverageByInningsGraph(runsFirstInnings, firstInnings, runsStats.firstInningsNotouts, runsSecondInnings, secondInnings, runsStats.secondInningsNotouts);
        };


        $scope.prepareRunsByYearGraph = function(runsByYear) {
            var years = [];
            var runs = [];
            for (var year in runsByYear) {
                if (runsByYear.hasOwnProperty(year)) {
                    years.push(year);
                    runs.push(runsByYear[year]);
                }
            }
            var colors = [];
            runs.map(function(res, key) {
                if (res >= 1000) {
                    return colors[key] = "#FFFF00";
                } else {
                    return colors[key] = "#0084FF";
                }
            });

            $scope.yearBardata = {
                labels: years,
                datasets: [{
                    label: 'Runs Over the years',
                    fillColor: colors,
                    strokeColor: 'rgba(220,220,220,1)',
                    pointColor: 'rgba(220,220,220,1)',
                    pointStrokeColor: '#fff',
                    pointHighlightFill: '#fff',
                    pointHighlightStroke: 'rgba(220,220,220,1)',
                    data: runs
                }]
            };

            // Chart.js Options
            $scope.yearBaroptions = {

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
        $scope.prepareRunsByTeamGraph = function(runsAgainstTeams) {
            var teams = [];
            var runs = [];
            for (var team in runsAgainstTeams) {
                if (runsAgainstTeams.hasOwnProperty(team)) {
                    teams.push(team);
                    runs.push(runsAgainstTeams[team]);
                }
            }
            $scope.teamBardata = {
                labels: teams,
                datasets: [{
                    label: 'Runs Over the years',
                    fillColor: ['#0084FF'],
                    strokeColor: 'rgba(220,220,220,1)',
                    pointColor: 'rgba(220,220,220,1)',
                    pointStrokeColor: '#fff',
                    pointHighlightFill: '#fff',
                    pointHighlightStroke: 'rgba(220,220,220,1)',
                    data: runs
                }]
            };

            // Chart.js Options
            $scope.teamBaroptions = {

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
        $scope.prepareRunsByInningsGraph = function(firstInnings, secondInnings) {
            $scope.inniningsRunsresources = [{
                value: firstInnings,
                color: '#FFFF00',
                highlight: '#e5e500',
                label: 'First Innings'
            }, {
                value: secondInnings,
                color: '#46BFBD',
                highlight: '#5AD3D1',
                label: 'Second Innings'
            }];

            // Chart.js Options
            $scope.inniningsRunsoptions = {

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
                animateScale: false

            };

        };

        $scope.prepareAverageByInningsGraph = function(runsFirstInnings, firstInnings, firstInningsNotouts, runsSecondInnings, secondInnings, secondInningsNotouts) {
            var firstInningsAverage = runsFirstInnings / (firstInnings - firstInningsNotouts);
            var secondInningsAverage = runsSecondInnings / (secondInnings - secondInningsNotouts);

            $scope.averageData = [{
                value: firstInningsAverage.toFixed(2),
                color: '#F7464A',
                highlight: '#FF5A5E',
                label: 'Average in First Innings'
            }, {
                value: secondInningsAverage.toFixed(2),
                color: '#FDB45C',
                highlight: '#FFC870',
                label: 'Average in Second Innings'
            }];

            // Chart.js Options
            $scope.averageOptions = {

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
