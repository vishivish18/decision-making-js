angular.module('app',[
  'ngRoute','ui.router','tc.chartjs'
])

angular.module('app')
    .controller('homeCtrl', ["$scope", "$http", "dataMutator", function($scope, $http, dataMutator) {
        $scope.setup = function() {
          dataMutator.getData()
          .then(function(response) {
                dataMutator.csvToJSON(response.data, function(json){
                    dataMutator.getCareerStats(json, function(stats){
                      console.log(stats)
                      $scope.stats = stats
                    })
                })
          }, function(err) {
                console.log(err)
          });
        }
        $scope.setup();
    }])

angular.module('app')
    .controller('masterCtrl', ["$scope", "$rootScope", function($scope, $rootScope) {
        console.log("masterCtrl");
    }])

angular.module('app')
    .config(["$stateProvider", "$urlRouterProvider", "$locationProvider", function($stateProvider, $urlRouterProvider, $locationProvider) {

        $urlRouterProvider.otherwise('/');

        $stateProvider
            .state('app', {
                url: '/',
                views: {
                    'header': {
                        templateUrl: '/nav.html',
                    },
                    'content': {
                        templateUrl: '/home.html',
                        controller: 'homeCtrl'
                    }
                }
            })



        .state('app.home', {
            url: 'home',
            views: {
                'content@': {
                    templateUrl: 'users/home.html',
                    controller: 'homeCtrl'
                }
            }

        })




        $locationProvider.html5Mode(true)

    }]);

angular.module('app')
    .directive('careerStats', function() {
        return{
            restrict: 'E',
            scope: {
                stats: '=item',
            },
            templateUrl: 'partials/careerStats.html'
                //controller: 'app.partials.venues.venueItemCtrl'
        }
    })

angular.module('app')
    .directive('centuryStats', function() {
        return{
            restrict: 'E',
            scope: {
                centuryStats: '=item',
            },
            templateUrl: 'partials/centuryStats.html',
            controller: 'centuryStatsCtrl'
        }
    })

angular.module('app')
    .directive('personalInfo', function() {
        return{
            restrict: 'E',            
            templateUrl: 'partials/personalInfo.html'
        }
    })

angular.module('app')
    .directive('runsStats', function() {
        return{
            restrict: 'E',
            scope: {
                runsStats: '=item',
            },
            templateUrl: 'partials/runsStats.html',
            controller: 'runsStatsCtrl'
        }
    })

//Things we can get from the data : -
//Total matches played -done
//Total centuries scored - done
//runs scored in a year
//centuries scored in a year - done
//half centuries scored in a year - done
//half centuries coverted into century - done
//score against the teams
//score in the winning cause - done
//bowling figures- done
//performance in close matches
//batting first performance
//moving average, longitudanal career growth
//1000 Runs in one calendar year
//batting second performance (while chasing)

//TODO:
//Get centuries by country-done
//Get centuries by year-done
//Get runs by country
//Get runs by year
//Get runs by winning
//Get runs by loosing
//Get centuries in winning cause-done



//NOTE: Once all data is collected clean out the callback hell :P
angular.module('app')
    .service('dataMutator', ["$http", function($http) {
        return{
            getData: getData,
            csvToJSON: csvToJSON,
            getCareerStats: getCareerStats

        }

        function getData() {
            return $http.get('/data/sachin.csv')
        }

        function csvToJSON(csv, callback) {
            var lines=csv.split("\n");
            var result = [];
            var headers=lines[0].split(",");
            for(var i=1;i<lines.length -1;i++){
                var obj = {};
                var currentline=lines[i].split(",");
                for(var j=0;j<headers.length;j++){
                  obj[headers[j]] = currentline[j];
                }
                result.push(obj);
            }
            console.log(result)
            if(callback && (typeof callback === 'function')) {
                return callback(result);
            }
          return result;
        }

        function getCareerStats(data, callback) {
            var totalMatches = data.length;
            var totalRuns = 0;
            var centuriesScored = [];
            var halfCenturiesScored = [];
            var allInnings = [];
            var notOuts = 0;
            var didNotBat = 0;
            var wicketsTaken = 0;
            var runsConceded = 0;
            var catches = 0;
            var firstInningsNotouts = 0;
            var secondInningsNotouts = 0;
            angular.forEach(data, function(value) {
              var inningsDetail = {};
              var centuryDetail = {};
              var halfCenturyDetail = {};

              //Batting stats

              //check to see if the score contains a * in the end which dentoes NotOuts, if yes remove for calculations
              if(value.batting_score.indexOf("*") > -1){
                if(value.batting_innings == "1st"){
                  firstInningsNotouts++;
                }else{
                  secondInningsNotouts++;
                }
                value.batting_score = value.batting_score.replace('*','');
                notOuts++;
              }
              //if the value of score is Not a number , it means it could be DNB(did not bat) or TDNB (team did not bat)
              if(isNaN(value.batting_score)){
                didNotBat++;
              }else{
                //Converting the string to integers to do calculations
                value.batting_score = parseInt(value.batting_score)
                //Getting all innings runs
                inningsDetail.runs = value.batting_score
                inningsDetail.against = value.opposition
                inningsDetail.result = value.match_result
                inningsDetail.innings = value.batting_innings
                inningsDetail.year = (new Date(Date.parse(value.date))).getFullYear()
                allInnings.push(inningsDetail)


                //Checking to see if the score was a half century or century
                if(value.batting_score >= 50 && value.batting_score < 100){
                  halfCenturyDetail.runs = value.batting_score
                  halfCenturyDetail.against = value.opposition
                  halfCenturyDetail.result = value.match_result
                  halfCenturyDetail.innings = value.batting_innings
                  halfCenturyDetail.year = (new Date(Date.parse(value.date))).getFullYear()
                  halfCenturiesScored.push(halfCenturyDetail)
                }else if(value.batting_score >= 100){
                  centuryDetail.runs = value.batting_score
                  centuryDetail.against = value.opposition
                  centuryDetail.result = value.match_result
                  centuryDetail.innings = value.batting_innings
                  centuryDetail.year = (new Date(Date.parse(value.date))).getFullYear()
                  centuriesScored.push(centuryDetail)
                }
                //Saving total runs
                totalRuns += value.batting_score;
              }

              //Bowling stats
              if(!isNaN(value.wickets) && parseInt(value.wickets) > 0){
                value.wickets = parseInt(value.wickets)
                wicketsTaken += value.wickets
              }
              if(!isNaN(value.catches) && parseInt(value.catches) > 0){
                value.catches = parseInt(value.catches)
                catches += value.catches
              }
              if(!isNaN(value.runs_conceded)){
                value.runs_conceded = parseInt(value.runs_conceded)
                runsConceded += value.runs_conceded;
              }
            });
          console.log(firstInningsNotouts);
          console.log(secondInningsNotouts);

          var totalInnings = totalMatches - didNotBat
          var stats = {
            totalMatches : totalMatches,
            totalRuns: totalRuns,
            halfCenturiesScored: halfCenturiesScored.length,
            centuriesScored: centuriesScored.length,
            highestScore:  Math.max.apply(null,centuriesScored.map(function(index){return index.runs})),
            notOuts: notOuts,
            totalInnings: totalInnings,
            battingAverage: (totalRuns / (totalInnings - notOuts)).toFixed(2),
            wicketsTaken: wicketsTaken,
            runsConceded: runsConceded,
            bowlingAverage: (runsConceded / wicketsTaken).toFixed(2),
            catches: catches,
            allCenturies: {centuriesScored,halfCenturiesScored},
            allInnings: {allInnings,firstInningsNotouts,secondInningsNotouts}
          };
          if(callback && (typeof callback === 'function')) {
              return callback(stats);
          }
          return stats
        }


    }])

angular.module('app')
    .controller('centuryStatsCtrl', ["$scope", function($scope) {
      $scope.$watch(function() {
             return $scope.centuryStats;
           }, function(n) {
               if(!n)return
               $scope.analyzeCenturies($scope.centuryStats)
           });

      $scope.analyzeCenturies = function(centuryStats){
        var scores = _.pluck(centuryStats.centuriesScored, 'runs')
        var against = _.pluck(centuryStats.centuriesScored, 'against')

        var totalFifties = centuryStats.halfCenturiesScored.length
        var totalHundreds = centuryStats.centuriesScored.length
        //Send array of colors to chartjs
        var colors = [];
        centuryStats.centuriesScored.map(function(res, key){
          if(res.result == "won"){
            colors[key] = "rgba(0,132,255,0.8)"
          }else if(res.result == "lost"){
            colors[key] = "rgba(237,63,47,0.8)"
          }else if(res.result == "tied"){
            colors[key] = "black"
          }else{
            colors[key] = "yellow"
          }
          return colors
        })
        var won = _.filter(centuryStats.centuriesScored, function(cent){
          return cent.result == "won"
        })
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
        var chasingCenturies = _.filter(centuryStats.centuriesScored, function(cent){
          return cent.innings == "2nd"
        })
        var winchasingCenturies = _.filter(chasingCenturies, function(cent){
          return cent.result == "won"
        })
        var lostchasingCenturies = _.filter(chasingCenturies, function(cent){
          return cent.result === "lost"
        })
        var tiedchasingCenturies = _.filter(chasingCenturies, function(cent){
          return cent.result === "tied"
        })
        var noresultchasingCenturies = _.filter(chasingCenturies, function(cent){
          return cent.result === "n/r"
        })

        //Century against teams
        var centuryAgainstTeams = [];
        centuryStats.centuriesScored.map(function(res){
          var team = res.against;
          var century = {
            score: res.runs
          }
          if(typeof(centuryAgainstTeams[team]) == "undefined")
                  centuryAgainstTeams[team] = []
          return centuryAgainstTeams[team].push(century)
        })

        //Century over the years
        var centuryByYear = [];
        centuryStats.centuriesScored.map(function(res){
          var year = res.year;
          var century = {
            score: res.runs
          }
          if(typeof(centuryByYear[year]) == "undefined")
                  centuryByYear[year] = []
          return centuryByYear[year].push(century)
        })

        var halfCenturyByYear = [];
        centuryStats.halfCenturiesScored.map(function(res){
          var year = res.year;
          var halfCentury = {
            score: res.runs
          }
          if(typeof(halfCenturyByYear[year]) == "undefined")
                  halfCenturyByYear[year] = []
          return halfCenturyByYear[year].push(halfCentury)
        })

        console.log(centuryByYear,halfCenturyByYear)


        $scope.winningRatio = (won.length/centuryStats.centuriesScored.length).toFixed(2) * 10;
        $scope.prepareBarGraph(scores, against, colors)
        $scope.prepareBarGraphAgainstTeam(centuryAgainstTeams)
        $scope.prepareLineGraph(centuryByYear,halfCenturyByYear);
        $scope.prepareDoughnutChart(winchasingCenturies.length,lostchasingCenturies.length,tiedchasingCenturies.length,noresultchasingCenturies.length)
        $scope.prepareConversionRatePieChart(totalFifties,totalHundreds)
      }








      $scope.prepareBarGraph = function (scores,against, colors){
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
               barDatasetSpacing: 1,

               //String - A legend template
               legendTemplate: '<ul class="tc-chart-js-legend"><% for (var i=0; i<datasets.length; i++){%><li><span style="background-color:<%=datasets[i].fillColor%>"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>'
           };
      }

      $scope.prepareBarGraphAgainstTeam = function (centuryAgainstTeams){
        var againstForCenturies = []
        var numberOfCenturies = []
        for(var centuryKey in centuryAgainstTeams) {
          if(centuryAgainstTeams.hasOwnProperty(centuryKey)) {
            againstForCenturies.push(centuryKey);
            numberOfCenturies.push(centuryAgainstTeams[centuryKey].length)
          }
        }
        $scope.bardataAgainstTeam = {
               labels: againstForCenturies,
               datasets: [{
                   label: 'Centuries',
                   fillColor: ['blue'],
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
               barDatasetSpacing: 1,

               //String - A legend template
               legendTemplate: '<ul class="tc-chart-js-legend"><% for (var i=0; i<datasets.length; i++){%><li><span style="background-color:<%=datasets[i].fillColor%>"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>'
           };
      }


      $scope.prepareLineGraph = function(centuryByYear,halfCenturyByYear){
          var yearOfcenturies = []
          var numberOfCenturies = []

          for(var century in centuryByYear) {
            if(centuryByYear.hasOwnProperty(century)) {
              yearOfcenturies.push(century);
              numberOfCenturies.push(centuryByYear[century].length)
            }
          }
          var yearOfhalfCenturies = []
          var numberOfHalfCenturies = []

          for(var halfCentury in halfCenturyByYear) {
            if(halfCenturyByYear.hasOwnProperty(halfCentury)) {
              yearOfhalfCenturies.push(halfCentury);
              numberOfHalfCenturies.push(halfCenturyByYear[halfCentury].length)
            }
          }
          var yearWithNoHalfCentury = _.filter(yearOfcenturies, function(el){
            return yearOfhalfCenturies.indexOf(el) < 0
          })
          var yearWithNoCentury = _.filter(yearOfhalfCenturies, function(el){
            return yearOfcenturies.indexOf(el) < 0
          })
          console.log(yearWithNoHalfCentury)
          console.log(yearWithNoCentury)
          // Taking union of both years of centuries and half centuries, CLEAN IT UP LATER
          var allYearsForData = _.union(yearOfcenturies,yearOfhalfCenturies).sort()
          var indexOfNoHalfcentury = yearWithNoHalfCentury.map(function(res){
              return allYearsForData.indexOf(res)
          })
          var indexOfNoCentury = yearWithNoCentury.map(function(res){
              return allYearsForData.indexOf(res)
          })          
          //Add insert method add prototype level later
          indexOfNoCentury.map(function(res){
            return numberOfCenturies.splice(res, 0, 0);
          })
          indexOfNoHalfcentury.map(function(res){
            return numberOfHalfCenturies.splice(res, 0, 0);
          })
          $scope.lineData = {
          labels: allYearsForData,
          datasets: [
            {
              label: 'Half Centuries over the years',
              fillColor: ['rgba(120,20,220,0.4)'],
              strokeColor: 'rgba(220,220,220,1)',
              pointColor: 'rgba(220,220,220,1)',
              pointStrokeColor: '#fff',
              pointHighlightFill: '#fff',
              pointHighlightStroke: 'rgba(220,220,220,1)',
              data: numberOfHalfCenturies
            },
            {
              label: 'Centuries',
              fillColor: ['rgba(220,220,220,0.6)'],
              strokeColor: 'rgba(220,220,220,1)',
              pointColor: 'rgba(220,220,220,1)',
              pointStrokeColor: '#fff',
              pointHighlightFill: '#fff',
              pointHighlightStroke: 'rgba(220,220,220,1)',
              data: numberOfCenturies
            }
          ]
        };

        // Chart.js Options
        $scope.lineOptions =  {

          // Sets the chart to be responsive
          responsive: true,

          ///Boolean - Whether grid lines are shown across the chart
          scaleShowGridLines : true,

          //String - Colour of the grid lines
          scaleGridLineColor : "rgba(0,0,0,.05)",

          //Number - Width of the grid lines
          scaleGridLineWidth : 1,

          //Boolean - Whether the line is curved between points
          bezierCurve : true,

          //Number - Tension of the bezier curve between points
          bezierCurveTension : 0.4,

          //Boolean - Whether to show a dot for each point
          pointDot : true,

          //Number - Radius of each point dot in pixels
          pointDotRadius : 4,

          //Number - Pixel width of point dot stroke
          pointDotStrokeWidth : 1,

          //Number - amount extra to add to the radius to cater for hit detection outside the drawn point
          pointHitDetectionRadius : 20,

          //Boolean - Whether to show a stroke for datasets
          datasetStroke : true,

          //Number - Pixel width of dataset stroke
          datasetStrokeWidth : 2,

          //Boolean - Whether to fill the dataset with a colour
          datasetFill : true,

          // Function - on animation progress
          onAnimationProgress: function(){},

          // Function - on animation complete
          onAnimationComplete: function(){},

          //String - A legend template
          legendTemplate : '<ul class="tc-chart-js-legend"><% for (var i=0; i<datasets.length; i++){%><li><span style="background-color:<%=datasets[i].strokeColor%>"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>'
        };
      }
      $scope.prepareDoughnutChart = function(won, lost, tied, noresult){
        $scope.resources = [{
               value: won,
               color: '#FFFF00',
               highlight: '#e5e500',
               label: 'Win'
           }, {
               value: lost,
               color: '#46BFBD',
               highlight: '#5AD3D1',
               label: 'Loss'
           }, {
               value: tied,
               color: '#F7464A',
               highlight: '#FF5A5E',
               label: 'Tie'
           }, {
               value: noresult,
               color: '#F7464A',
               highlight: '#EF5A5E',
               label: 'No Result'
           }
         ];

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

               //String - A legend template
               legendTemplate: '<ul class="tc-chart-js-legend"><% for (var i=0; i<segments.length; i++){%><li><span style="background-color:<%=segments[i].fillColor%>"></span><%if(segments[i].label){%><%=segments[i].label%><%}%></li><%}%></ul>'

           };

      }

      $scope.prepareConversionRatePieChart = function(fifty,hundred){
            $scope.conversionData = [
          {
            value: fifty,
            color:'#F7464A',
            highlight: '#FF5A5E',
            label: 'Half Centuries'
          },
          {
            value: hundred,
            color: '#FDB45C',
            highlight: '#FFC870',
            label: 'Centuries'
          }
        ];

        // Chart.js Options
        $scope.conversionOptions =  {

          // Sets the chart to be responsive
          responsive: true,

          //Boolean - Whether we should show a stroke on each segment
          segmentShowStroke : true,

          //String - The colour of each segment stroke
          segmentStrokeColor : '#fff',

          //Number - The width of each segment stroke
          segmentStrokeWidth : 2,

          //Number - The percentage of the chart that we cut out of the middle
          percentageInnerCutout : 0, // This is 0 for Pie charts

          //Number - Amount of animation steps
          animationSteps : 100,

          //String - Animation easing effect
          animationEasing : 'easeOutBounce',

          //Boolean - Whether we animate the rotation of the Doughnut
          animateRotate : true,

          //Boolean - Whether we animate scaling the Doughnut from the centre
          animateScale : false,

          //String - A legend template
          legendTemplate : '<ul class="tc-chart-js-legend"><% for (var i=0; i<segments.length; i++){%><li><span style="background-color:<%=segments[i].fillColor%>"></span><%if(segments[i].label){%><%=segments[i].label%><%}%></li><%}%></ul>'

        };
      }


    }])

angular.module('app')
    .controller('runsStatsCtrl', ["$scope", function($scope) {
      $scope.$watch(function() {
             return $scope.runsStats;
           }, function(n) {
               if(!n)return
               $scope.analyzeInnings($scope.runsStats)
           });


      $scope.analyzeInnings = function(runsStats){
        //Runs over the years
        var runsByYear = [];
        var runsAgainstTeams = [];
        var firstInnings = 0;
        var secondInnings = 0;
        var runsFirstInnings = 0;
        var runsSecondInnings = 0;
        runsStats.allInnings.map(function(res){
          //calculate number of first innings and second innings played and run scored in them
          if(res.innings == "1st"){
            firstInnings++;
            runsFirstInnings += res.runs;
          }else{
            secondInnings++;
            runsSecondInnings += res.runs;
          }

          //get runs on yearly basis
          var year = res.year;
          var team = res.against;
          if(typeof(runsByYear[year]) == "undefined"){
              runsByYear[year] = []
          }
          if(typeof(runsByYear[year]) == "number"){
              runsByYear[year] += parseInt(res.runs)
          }else{
            runsByYear[year] = parseInt(res.runs)
          }

          //get runs against teams
          if(typeof(runsAgainstTeams[team]) == "undefined"){
              runsAgainstTeams[team] = []
          }
          if(typeof(runsAgainstTeams[team]) == "number"){
              return runsAgainstTeams[team] += parseInt(res.runs)
          }else{
            return runsAgainstTeams[team] = parseInt(res.runs)
          }
        })
        $scope.prepareRunsByYearGraph(runsByYear)
        $scope.prepareRunsByTeamGraph(runsAgainstTeams)
        $scope.prepareRunsByInningsGraph(runsFirstInnings, runsSecondInnings)
        $scope.prepareAverageByInningsGraph(runsFirstInnings,firstInnings,runsStats.firstInningsNotouts,runsSecondInnings, secondInnings,runsStats.secondInningsNotouts)

      }


      $scope.prepareRunsByYearGraph = function (runsByYear){
        var years = []
        var runs = []
        for(var year in runsByYear) {
          if(runsByYear.hasOwnProperty(year)) {
            years.push(year);
            runs.push(runsByYear[year])
          }
        }
        var colors = [];
        runs.map(function(res, key){
          if(res >= 1000){
            return colors[key] = "yellow"
          }else{
            return colors[key] = "blue"
          }
        })

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
               barDatasetSpacing: 1,

               //String - A legend template
               legendTemplate: '<ul class="tc-chart-js-legend"><% for (var i=0; i<datasets.length; i++){%><li><span style="background-color:<%=datasets[i].fillColor%>"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>'
           };
      }
      $scope.prepareRunsByTeamGraph = function (runsAgainstTeams){
        var teams = []
        var runs = []
        for(var team in runsAgainstTeams) {
          if(runsAgainstTeams.hasOwnProperty(team)) {
            teams.push(team);
            runs.push(runsAgainstTeams[team])
          }
        }
        $scope.teamBardata = {
               labels: teams,
               datasets: [{
                   label: 'Runs Over the years',
                   fillColor: ['blue'],
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
               barDatasetSpacing: 1,

               //String - A legend template
               legendTemplate: '<ul class="tc-chart-js-legend"><% for (var i=0; i<datasets.length; i++){%><li><span style="background-color:<%=datasets[i].fillColor%>"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>'
           };
      }
      $scope.prepareRunsByInningsGraph = function(firstInnings, secondInnings){
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
               animateScale: false,

               //String - A legend template
               legendTemplate: '<ul class="tc-chart-js-legend"><% for (var i=0; i<segments.length; i++){%><li><span style="background-color:<%=segments[i].fillColor%>"></span><%if(segments[i].label){%><%=segments[i].label%><%}%></li><%}%></ul>'

           };

      }

      $scope.prepareAverageByInningsGraph = function(runsFirstInnings,firstInnings,firstInningsNotouts,runsSecondInnings, secondInnings,secondInningsNotouts){
        var firstInningsAverage = runsFirstInnings / (firstInnings - firstInningsNotouts);
        var secondInningsAverage = runsSecondInnings / (secondInnings - secondInningsNotouts);

        $scope.averageData = [
          {
            value: firstInningsAverage.toFixed(2),
            color:'#F7464A',
            highlight: '#FF5A5E',
            label: 'Average in First Innings'
          },
          {
            value: secondInningsAverage.toFixed(2),
            color: '#FDB45C',
            highlight: '#FFC870',
            label: 'Average in Second Innings'
          }
        ];

        // Chart.js Options
        $scope.averageOptions =  {

          // Sets the chart to be responsive
          responsive: true,

          //Boolean - Whether we should show a stroke on each segment
          segmentShowStroke : true,

          //String - The colour of each segment stroke
          segmentStrokeColor : '#fff',

          //Number - The width of each segment stroke
          segmentStrokeWidth : 2,

          //Number - The percentage of the chart that we cut out of the middle
          percentageInnerCutout : 0, // This is 0 for Pie charts

          //Number - Amount of animation steps
          animationSteps : 100,

          //String - Animation easing effect
          animationEasing : 'easeOutBounce',

          //Boolean - Whether we animate the rotation of the Doughnut
          animateRotate : true,

          //Boolean - Whether we animate scaling the Doughnut from the centre
          animateScale : false,

          //String - A legend template
          legendTemplate : '<ul class="tc-chart-js-legend"><% for (var i=0; i<segments.length; i++){%><li><span style="background-color:<%=segments[i].fillColor%>"></span><%if(segments[i].label){%><%=segments[i].label%><%}%></li><%}%></ul>'

        };
      }




}])

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZHVsZS5qcyIsImNvbnRyb2xsZXJzL2hvbWVDdHJsLmpzIiwiY29udHJvbGxlcnMvbWFzdGVyQ3RybC5qcyIsImNvbnRyb2xsZXJzL3JvdXRlcy5qcyIsImRpcmVjdGl2ZXMvY2FyZWVyU3RhdHMuanMiLCJkaXJlY3RpdmVzL2NlbnR1cnlTdGF0cy5qcyIsImRpcmVjdGl2ZXMvcGVyc29uYWxJbmZvLmpzIiwiZGlyZWN0aXZlcy9ydW5zU3RhdHMuanMiLCJzZXJ2aWNlcy9kYXRhTXV0YXRvci5qcyIsImNvbnRyb2xsZXJzL3BhcnRpYWxzL2NlbnR1cnlTdGF0c0N0cmwuanMiLCJjb250cm9sbGVycy9wYXJ0aWFscy9ydW5zU3RhdHNDdHJsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFFBQUEsT0FBQSxNQUFBO0VBQ0EsVUFBQSxZQUFBOzs7QUNEQSxRQUFBLE9BQUE7S0FDQSxXQUFBLCtDQUFBLFNBQUEsUUFBQSxPQUFBLGFBQUE7UUFDQSxPQUFBLFFBQUEsV0FBQTtVQUNBLFlBQUE7V0FDQSxLQUFBLFNBQUEsVUFBQTtnQkFDQSxZQUFBLFVBQUEsU0FBQSxNQUFBLFNBQUEsS0FBQTtvQkFDQSxZQUFBLGVBQUEsTUFBQSxTQUFBLE1BQUE7c0JBQ0EsUUFBQSxJQUFBO3NCQUNBLE9BQUEsUUFBQTs7O2FBR0EsU0FBQSxLQUFBO2dCQUNBLFFBQUEsSUFBQTs7O1FBR0EsT0FBQTs7O0FDZkEsUUFBQSxPQUFBO0tBQ0EsV0FBQSx1Q0FBQSxTQUFBLFFBQUEsWUFBQTtRQUNBLFFBQUEsSUFBQTs7O0FDRkEsUUFBQSxPQUFBO0tBQ0EscUVBQUEsU0FBQSxnQkFBQSxvQkFBQSxtQkFBQTs7UUFFQSxtQkFBQSxVQUFBOztRQUVBO2FBQ0EsTUFBQSxPQUFBO2dCQUNBLEtBQUE7Z0JBQ0EsT0FBQTtvQkFDQSxVQUFBO3dCQUNBLGFBQUE7O29CQUVBLFdBQUE7d0JBQ0EsYUFBQTt3QkFDQSxZQUFBOzs7Ozs7O1NBT0EsTUFBQSxZQUFBO1lBQ0EsS0FBQTtZQUNBLE9BQUE7Z0JBQ0EsWUFBQTtvQkFDQSxhQUFBO29CQUNBLFlBQUE7Ozs7Ozs7OztRQVNBLGtCQUFBLFVBQUE7Ozs7QUNuQ0EsUUFBQSxPQUFBO0tBQ0EsVUFBQSxlQUFBLFdBQUE7UUFDQSxNQUFBO1lBQ0EsVUFBQTtZQUNBLE9BQUE7Z0JBQ0EsT0FBQTs7WUFFQSxhQUFBOzs7OztBQ1BBLFFBQUEsT0FBQTtLQUNBLFVBQUEsZ0JBQUEsV0FBQTtRQUNBLE1BQUE7WUFDQSxVQUFBO1lBQ0EsT0FBQTtnQkFDQSxjQUFBOztZQUVBLGFBQUE7WUFDQSxZQUFBOzs7O0FDUkEsUUFBQSxPQUFBO0tBQ0EsVUFBQSxnQkFBQSxXQUFBO1FBQ0EsTUFBQTtZQUNBLFVBQUE7WUFDQSxhQUFBOzs7O0FDSkEsUUFBQSxPQUFBO0tBQ0EsVUFBQSxhQUFBLFdBQUE7UUFDQSxNQUFBO1lBQ0EsVUFBQTtZQUNBLE9BQUE7Z0JBQ0EsV0FBQTs7WUFFQSxhQUFBO1lBQ0EsWUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNvQkEsUUFBQSxPQUFBO0tBQ0EsUUFBQSx5QkFBQSxTQUFBLE9BQUE7UUFDQSxNQUFBO1lBQ0EsU0FBQTtZQUNBLFdBQUE7WUFDQSxnQkFBQTs7OztRQUlBLFNBQUEsVUFBQTtZQUNBLE9BQUEsTUFBQSxJQUFBOzs7UUFHQSxTQUFBLFVBQUEsS0FBQSxVQUFBO1lBQ0EsSUFBQSxNQUFBLElBQUEsTUFBQTtZQUNBLElBQUEsU0FBQTtZQUNBLElBQUEsUUFBQSxNQUFBLEdBQUEsTUFBQTtZQUNBLElBQUEsSUFBQSxFQUFBLEVBQUEsRUFBQSxNQUFBLFFBQUEsRUFBQSxJQUFBO2dCQUNBLElBQUEsTUFBQTtnQkFDQSxJQUFBLFlBQUEsTUFBQSxHQUFBLE1BQUE7Z0JBQ0EsSUFBQSxJQUFBLEVBQUEsRUFBQSxFQUFBLFFBQUEsT0FBQSxJQUFBO2tCQUNBLElBQUEsUUFBQSxNQUFBLFlBQUE7O2dCQUVBLE9BQUEsS0FBQTs7WUFFQSxRQUFBLElBQUE7WUFDQSxHQUFBLGFBQUEsT0FB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UUFBQTtNQUNBLE9BQUEsT0FBQSxXQUFBO2FBQ0EsT0FBQSxPQUFBO2NBQ0EsU0FBQSxHQUFBO2VBQ0EsR0FBQSxDQUFBLEVBQUE7ZUFDQSxPQUFBLGlCQUFBLE9BQUE7OztNQUdBLE9BQUEsbUJBQUEsU0FBQSxhQUFBO1FBQ0EsSUFBQSxTQUFBLEVBQUEsTUFBQSxhQUFBLGlCQUFBO1FBQ0EsSUFBQSxVQUFBLEVBQUEsTUFBQSxhQUFBLGlCQUFBOztRQUVBLElBQUEsZUFBQSxhQUFBLG9CQUFBO1FBQ0EsSUFBQSxnQkFBQSxhQUFBLGdCQUFBOztRQUVBLElBQUEsU0FBQTtRQUNBLGFBQUEsZ0JBQUEsSUFBQSxTQUFBLEtBQUEsSUFBQTtVQUNBLEdBQUEsSUFBQSxVQUFBLE1BQUE7WUFDQSxPQUFBLE9BQUE7Z0JBQ0EsR0FBQSxJQUFBLFVBQUEsT0FBQTtZQUNBLE9BQUEsT0FBQTtnQkFDQSxHQUFBLElBQUEsVUFBQSxPQUFBO1lBQ0EsT0FBQSxPQUFBO2VBQ0E7WUFDQSxPQUFBLE9BQUE7O1VBRUEsT0FBQTs7UUFFQSxJQUFBLE1BQUEsRUFBQSxPQUFBLGFBQUEsaUJBQUEsU0FBQSxLQUFBO1VBQ0EsT0FBQSxLQUFBLFVBQUE7Ozs7Ozs7Ozs7Ozs7UUFhQSxJQUFBLG1CQUFBLEVBQUEsT0FBQSxhQUFBLGlCQUFBLFNBQUEsS0FBQTtVQUNBLE9BQUEsS0FBQSxXQUFBOztRQUVBLElBQUEsc0JBQUEsRUFBQSxPQUFBLGtCQUFBLFNBQUEsS0FBQTtVQUNBLE9BQUEsS0FBQSxVQUFBOztRQUVBLElBQUEsdUJBQUEsRUFBQSxPQUFBLGtCQUFBLFNBQUEsS0FBQTtVQUNBLE9BQUEsS0FBQSxXQUFBOztRQUVBLElBQUEsdUJBQUEsRUFBQSxPQUFBLGtCQUFBLFNBQUEsS0FBQTtVQUNBLE9BQUEsS0FBQSxXQUFBOztRQUVBLElBQUEsMkJBQUEsRUFBQSxPQUFBLGtCQUFBLFNBQUEsS0FBQTtVQUNBLE9BQUEsS0FBQSxXQUFBOzs7O1FBSUEsSUFBQSxzQkFBQTtRQUNBLGFBQUEsZ0JBQUEsSUFBQSxTQUFBLElB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QUFBLG9CQUFBLG1CQUFBLGNBQUEscUJBQUE7UUFDQSxJQUFBLHNCQUFBLG9CQUFBLGVBQUE7UUFDQSxJQUFBLHVCQUFBLHFCQUFBLGdCQUFBOztRQUVBLE9BQUEsY0FBQTtVQUNBO1lBQ0EsT0FBQSxvQkFBQSxRQUFBO1lBQ0EsTUFBQTtZQUNBLFdBQUE7WUFDQSxPQUFBOztVQUVBO1lBQ0EsT0FBQSxxQkFBQSxRQUFBO1lBQ0EsT0FBQTtZQUNBLFdBQUE7WUFDQSxPQUFBOzs7OztRQUtBLE9BQUEsa0JBQUE7OztVQUdBLFlBQUE7OztVQUdBLG9CQUFBOzs7VUFHQSxxQkFBQTs7O1VBR0EscUJBQUE7OztVQUdBLHdCQUFBOzs7VUFHQSxpQkFBQTs7O1VBR0Esa0JBQUE7OztVQUdBLGdCQUFBOzs7VUFHQSxlQUFBOzs7VUFHQSxpQkFBQTs7Ozs7Ozs7O0FBU0EiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiYW5ndWxhci5tb2R1bGUoJ2FwcCcsW1xuICAnbmdSb3V0ZScsJ3VpLnJvdXRlcicsJ3RjLmNoYXJ0anMnXG5dKVxuIiwiYW5ndWxhci5tb2R1bGUoJ2FwcCcpXG4gICAgLmNvbnRyb2xsZXIoJ2hvbWVDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCAkaHR0cCwgZGF0YU11dGF0b3IpIHtcbiAgICAgICAgJHNjb3BlLnNldHVwID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgZGF0YU11dGF0b3IuZ2V0RGF0YSgpXG4gICAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBkYXRhTXV0YXRvci5jc3ZUb0pTT04ocmVzcG9uc2UuZGF0YSwgZnVuY3Rpb24oanNvbil7XG4gICAgICAgICAgICAgICAgICAgIGRhdGFNdXRhdG9yLmdldENhcmVlclN0YXRzKGpzb24sIGZ1bmN0aW9uKHN0YXRzKXtcbiAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhzdGF0cylcbiAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc3RhdHMgPSBzdGF0c1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgfSwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgICRzY29wZS5zZXR1cCgpO1xuICAgIH0pXG4iLCJhbmd1bGFyLm1vZHVsZSgnYXBwJylcbiAgICAuY29udHJvbGxlcignbWFzdGVyQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJHJvb3RTY29wZSkge1xuICAgICAgICBjb25zb2xlLmxvZyhcIm1hc3RlckN0cmxcIik7XG4gICAgfSlcbiIsImFuZ3VsYXIubW9kdWxlKCdhcHAnKVxuICAgIC5jb25maWcoZnVuY3Rpb24oJHN0YXRlUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIpIHtcblxuICAgICAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvJyk7XG5cbiAgICAgICAgJHN0YXRlUHJvdmlkZXJcbiAgICAgICAgICAgIC5zdGF0ZSgnYXBwJywge1xuICAgICAgICAgICAgICAgIHVybDogJy8nLFxuICAgICAgICAgICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAgICAgICAgICdoZWFkZXInOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy9uYXYuaHRtbCcsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICdjb250ZW50Jzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvaG9tZS5odG1sJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdob21lQ3RybCdcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG5cblxuXG4gICAgICAgIC5zdGF0ZSgnYXBwLmhvbWUnLCB7XG4gICAgICAgICAgICB1cmw6ICdob21lJyxcbiAgICAgICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAgICAgJ2NvbnRlbnRAJzoge1xuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3VzZXJzL2hvbWUuaHRtbCcsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdob21lQ3RybCdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSlcblxuXG5cblxuICAgICAgICAkbG9jYXRpb25Qcm92aWRlci5odG1sNU1vZGUodHJ1ZSlcblxuICAgIH0pO1xuIiwiYW5ndWxhci5tb2R1bGUoJ2FwcCcpXG4gICAgLmRpcmVjdGl2ZSgnY2FyZWVyU3RhdHMnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJue1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgc3RhdHM6ICc9aXRlbScsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdwYXJ0aWFscy9jYXJlZXJTdGF0cy5odG1sJ1xuICAgICAgICAgICAgICAgIC8vY29udHJvbGxlcjogJ2FwcC5wYXJ0aWFscy52ZW51ZXMudmVudWVJdGVtQ3RybCdcbiAgICAgICAgfVxuICAgIH0pXG4iLCJhbmd1bGFyLm1vZHVsZSgnYXBwJylcbiAgICAuZGlyZWN0aXZlKCdjZW50dXJ5U3RhdHMnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJue1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgY2VudHVyeVN0YXRzOiAnPWl0ZW0nLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAncGFydGlhbHMvY2VudHVyeVN0YXRzLmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ2NlbnR1cnlTdGF0c0N0cmwnXG4gICAgICAgIH1cbiAgICB9KVxuIiwiYW5ndWxhci5tb2R1bGUoJ2FwcCcpXG4gICAgLmRpcmVjdGl2ZSgncGVyc29uYWxJbmZvJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybntcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsICAgICAgICAgICAgXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3BhcnRpYWxzL3BlcnNvbmFsSW5mby5odG1sJ1xuICAgICAgICB9XG4gICAgfSlcbiIsImFuZ3VsYXIubW9kdWxlKCdhcHAnKVxuICAgIC5kaXJlY3RpdmUoJ3J1bnNTdGF0cycsIGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm57XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHtcbiAgICAgICAgICAgICAgICBydW5zU3RhdHM6ICc9aXRlbScsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdwYXJ0aWFscy9ydW5zU3RhdHMuaHRtbCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiAncnVuc1N0YXRzQ3RybCdcbiAgICAgICAgfVxuICAgIH0pXG4iLCIvL1RoaW5ncyB3ZSBjYW4gZ2V0IGZyb20gdGhlIGRhdGEgOiAtXG4vL1RvdGFsIG1hdGNoZXMgcGxheWVkIC1kb25lXG4vL1RvdGFsIGNlbnR1cmllcyBzY29yZWQgLSBkb25lXG4vL3J1bnMgc2NvcmVkIGluIGEgeWVhclxuLy9jZW50dXJpZXMgc2NvcmVkIGluIGEgeWVhciAtIGRvbmVcbi8vaGFsZiBjZW50dXJpZXMgc2NvcmVkIGluIGEgeWVhciAtIGRvbmVcbi8vaGFsZiBjZW50dXJpZXMgY292ZXJ0ZWQgaW50byBjZW50dXJ5IC0gZG9uZVxuLy9zY29yZSBhZ2FpbnN0IHRoZSB0ZWFtc1xuLy9zY29yZSBpbiB0aGUgd2lubmluZyBjYXVzZSAtIGRvbmVcbi8vYm93bGluZyBmaWd1cmVzLSBkb25lXG4vL3BlcmZvcm1hbmNlIGluIGNsb3NlIG1hdGNoZXNcbi8vYmF0dGluZyBmaXJzdCBwZXJmb3JtYW5jZVxuLy9tb3ZpbmcgYXZlcmFnZSwgbG9uZ2l0dWRhbmFsIGNhcmVlciBncm93dGhcbi8vMTAwMCBSdW5zIGluIG9uZSBjYWxlbmRhciB5ZWFyXG4vL2JhdHRpbmcgc2Vjb25kIHBlcmZvcm1hbmNlICh3aGlsZSBjaGFzaW5nKVxuXG4vL1RPRE86XG4vL0dldCBjZW50dXJpZXMgYnkgY291bnRyeS1kb25lXG4vL0dldCBjZW50dXJpZXMgYnkgeWVhci1kb25lXG4vL0dldCBydW5zIGJ5IGNvdW50cnlcbi8vR2V0IHJ1bnMgYnkgeWVhclxuLy9HZXQgcnVucyBieSB3aW5uaW5nXG4vL0dldCBydW5zIGJ5IGxvb3Npbmdcbi8vR2V0IGNlbnR1cmllcyBpbiB3aW5uaW5nIGNhdXNlLWRvbmVcblxuXG5cbi8vTk9URTogT25jZSBhbGwgZGF0YSBpcyBjb2xsZWN0ZWQgY2xlYW4gb3V0IHRoZSBjYWxsYmFjayBoZWxsIDpQXG5hbmd1bGFyLm1vZHVsZSgnYXBwJylcbiAgICAuc2VydmljZSgnZGF0YU11dGF0b3InLCBmdW5jdGlvbigkaHR0cCkge1xuICAgICAgICByZXR1cm57XG4gICAgICAgICAgICBnZXREYXRhOiBnZXREYXRhLFxuICAgICAgICAgICAgY3N2VG9KU09OOiBjc3ZUb0pTT04sXG4gICAgICAgICAgICBnZXRDYXJlZXJTdGF0czogZ2V0Q2FyZWVyU3RhdHNcblxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZ2V0RGF0YSgpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9kYXRhL3NhY2hpbi5jc3YnKVxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gY3N2VG9KU09OKGNzdiwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHZhciBsaW5lcz1jc3Yuc3BsaXQoXCJcXG5cIik7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgICAgICAgICB2YXIgaGVhZGVycz1saW5lc1swXS5zcGxpdChcIixcIik7XG4gICAgICAgICAgICBmb3IodmFyIGk9MTtpPGxpbmVzLmxlbmd0aCAtMTtpKyspe1xuICAgICAgICAgICAgICAgIHZhciBvYmogPSB7fTtcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudGxpbmU9bGluZXNbaV0uc3BsaXQoXCIsXCIpO1xuICAgICAgICAgICAgICAgIGZvcih2YXIgaj0wO2o8aGVhZGVycy5sZW5ndGg7aisrKXtcbiAgICAgICAgICAgICAgICAgIG9ialtoZWFkZXJzW2pdXSA9IGN1cnJlbnRsaW5lW2pdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChvYmopO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc29sZS5sb2cocmVzdWx0KVxuICAgICAgICAgICAgaWYoY2FsbGJhY2sgJiYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2socmVzdWx0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZ2V0Q2FyZWVyU3RhdHMoZGF0YSwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHZhciB0b3RhbE1hdGNoZXMgPSBkYXRhLmxlbmd0aDtcbiAgICAgICAgICAgIHZhciB0b3RhbFJ1bnMgPSAwO1xuICAgICAgICAgICAgdmFyIGNlbnR1cmllc1Njb3JlZCA9IFtdO1xuICAgICAgICAgICAgdmFyIGhhbGZDZW50dXJpZXNTY29yZWQgPSBbXTtcbiAgICAgICAgICAgIHZhciBhbGxJbm5pbmdzID0gW107XG4gICAgICAgICAgICB2YXIgbm90T3V0cyA9IDA7XG4gICAgICAgICAgICB2YXIgZGlkTm90QmF0ID0gMDtcbiAgICAgICAgICAgIHZhciB3aWNrZXRzVGFrZW4gPSAwO1xuICAgICAgICAgICAgdmFyIHJ1bnNDb25jZWRlZCA9IDA7XG4gICAgICAgICAgICB2YXIgY2F0Y2hlcyA9IDA7XG4gICAgICAgICAgICB2YXIgZmlyc3RJbm5pbmdzTm90b3V0cyA9IDA7XG4gICAgICAgICAgICB2YXIgc2Vjb25kSW5uaW5nc05vdG91dHMgPSAwO1xuICAgICAgICAgICAgYW5ndWxhci5mb3JFYWNoKGRhdGEsIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICAgIHZhciBpbm5pbmdzRGV0YWlsID0ge307XG4gICAgICAgICAgICAgIHZhciBjZW50dXJ5RGV0YWlsID0ge307XG4gICAgICAgICAgICAgIHZhciBoYWxmQ2VudHVyeURldGFpbCA9IHt9O1xuXG4gICAgICAgICAgICAgIC8vQmF0dGluZyBzdGF0c1xuXG4gICAgICAgICAgICAgIC8vY2hlY2sgdG8gc2VlIGlmIHRoZSBzY29yZSBjb250YWlucyBhICogaW4gdGhlIGVuZCB3aGljaCBkZW50b2VzIE5vdE91dHMsIGlmIHllcyByZW1vdmUgZm9yIGNhbGN1bGF0aW9uc1xuICAgICAgICAgICAgICBpZih2YWx1ZS5iYXR0aW5nX3Njb3JlLmluZGV4T2YoXCIqXCIpID4gLTEpe1xuICAgICAgICAgICAgICAgIGlmKHZhbHVlLmJhdHRpbmdfaW5uaW5ncyA9PSBcIjFzdFwiKXtcbiAgICAgICAgICAgICAgICAgIGZpcnN0SW5uaW5nc05vdG91dHMrKztcbiAgICAgICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICAgIHNlY29uZElubmluZ3NOb3RvdXRzKys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhbHVlLmJhdHRpbmdfc2NvcmUgPSB2YWx1ZS5iYXR0aW5nX3Njb3JlLnJlcGxhY2UoJyonLCcnKTtcbiAgICAgICAgICAgICAgICBub3RPdXRzKys7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgLy9pZiB0aGUgdmFsdWUgb2Ygc2NvcmUgaXMgTm90IGEgbnVtYmVyICwgaXQgbWVhbnMgaXQgY291bGQgYmUgRE5CKGRpZCBub3QgYmF0KSBvciBURE5CICh0ZWFtIGRpZCBub3QgYmF0KVxuICAgICAgICAgICAgICBpZihpc05hTih2YWx1ZS5iYXR0aW5nX3Njb3JlKSl7XG4gICAgICAgICAgICAgICAgZGlkTm90QmF0Kys7XG4gICAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgIC8vQ29udmVydGluZyB0aGUgc3RyaW5nIHRvIGludGVnZXJzIHRvIGRvIGNhbGN1bGF0aW9uc1xuICAgICAgICAgICAgICAgIHZhbHVlLmJhdHRpbmdfc2NvcmUgPSBwYXJzZUludCh2YWx1ZS5iYXR0aW5nX3Njb3JlKVxuICAgICAgICAgICAgICAgIC8vR2V0dGluZyBhbGwgaW5uaW5ncyBydW5zXG4gICAgICAgICAgICAgICAgaW5uaW5nc0RldGFpbC5ydW5zID0gdmFsdWUuYmF0dGluZ19zY29yZVxuICAgICAgICAgICAgICAgIGlubmluZ3NEZXRhaWwuYWdhaW5zdCA9IHZhbHVlLm9wcG9zaXRpb25cbiAgICAgICAgICAgICAgICBpbm5pbmdzRGV0YWlsLnJlc3VsdCA9IHZhbHVlLm1hdGNoX3Jlc3VsdFxuICAgICAgICAgICAgICAgIGlubmluZ3NEZXRhaWwuaW5uaW5ncyA9IHZhbHVlLmJhdHRpbmdfaW5uaW5nc1xuICAgICAgICAgICAgICAgIGlubmluZ3NEZXRhaWwueWVhciA9IChuZXcgRGF0ZShEYXRlLnBhcnNlKHZhbHVlLmRhdGUpKSkuZ2V0RnVsbFllYXIoKVxuICAgICAgICAgICAgICAgIGFsbElubmluZ3MucHVzaChpbm5pbmdzRGV0YWlsKVxuXG5cbiAgICAgICAgICAgICAgICAvL0NoZWNraW5nIHRvIHNlZSBpZiB0aGUgc2NvcmUgd2FzIGEgaGFsZiBjZW50dXJ5IG9yIGNlbnR1cnlcbiAgICAgICAgICAgICAgICBpZih2YWx1ZS5iYXR0aW5nX3Njb3JlID49IDUwICYmIHZhbHVlLmJhdHRpbmdfc2NvcmUgPCAxMDApe1xuICAgICAgICAgICAgICAgICAgaGFsZkNlbnR1cnlEZXRhaWwucnVucyA9IHZhbHVlLmJhdHRpbmdfc2NvcmVcbiAgICAgICAgICAgICAgICAgIGhhbGZDZW50dXJ5RGV0YWlsLmFnYWluc3QgPSB2YWx1ZS5vcHBvc2l0aW9uXG4gICAgICAgICAgICAgICAgICBoYWxmQ2VudHVyeURldGFpbC5yZXN1bHQgPSB2YWx1ZS5tYXRjaF9yZXN1bHRcbiAgICAgICAgICAgICAgICAgIGhhbGZDZW50dXJ5RGV0YWlsLmlubmluZ3MgPSB2YWx1ZS5iYXR0aW5nX2lubmluZ3NcbiAgICAgICAgICAgICAgICAgIGhhbGZDZW50dXJ5RGV0YWlsLnllYXIgPSAobmV3IERhdGUoRGF0ZS5wYXJzZSh2YWx1ZS5kYXRlKSkpLmdldEZ1bGxZZWFyKClcbiAgICAgICAgICAgICAgICAgIGhhbGZDZW50dXJpZXNTY29yZWQucHVzaChoYWxmQ2VudHVyeURldGFpbClcbiAgICAgICAgICAgICAgICB9ZWxzZSBpZih2YWx1ZS5iYXR0aW5nX3Njb3JlID49IDEwMCl7XG4gICAgICAgICAgICAgICAgICBjZW50dXJ5RGV0YWlsLnJ1bnMgPSB2YWx1ZS5iYXR0aW5nX3Njb3JlXG4gICAgICAgICAgICAgICAgICBjZW50dXJ5RGV0YWlsLmFnYWluc3QgPSB2YWx1ZS5vcHBvc2l0aW9uXG4gICAgICAgICAgICAgICAgICBjZW50dXJ5RGV0YWlsLnJlc3VsdCA9IHZhbHVlLm1hdGNoX3Jlc3VsdFxuICAgICAgICAgICAgICAgICAgY2VudHVyeURldGFpbC5pbm5pbmdzID0gdmFsdWUuYmF0dGluZ19pbm5pbmdzXG4gICAgICAgICAgICAgICAgICBjZW50dXJ5RGV0YWlsLnllYXIgPSAobmV3IERhdGUoRGF0ZS5wYXJzZSh2YWx1ZS5kYXRlKSkpLmdldEZ1bGxZZWFyKClcbiAgICAgICAgICAgICAgICAgIGNlbnR1cmllc1Njb3JlZC5wdXNoKGNlbnR1cnlEZXRhaWwpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vU2F2aW5nIHRvdGFsIHJ1bnNcbiAgICAgICAgICAgICAgICB0b3RhbFJ1bnMgKz0gdmFsdWUuYmF0dGluZ19zY29yZTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIC8vQm93bGluZyBzdGF0c1xuICAgICAgICAgICAgICBpZighaXNOYU4odmFsdWUud2lja2V0cykgJiYgcGFyc2VJbnQodmFsdWUud2lja2V0cykgPiAwKXtcbiAgICAgICAgICAgICAgICB2YWx1ZS53aWNrZXRzID0gcGFyc2VJbnQodmFsdWUud2lja2V0cylcbiAgICAgICAgICAgICAgICB3aWNrZXRzVGFrZW4gKz0gdmFsdWUud2lja2V0c1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmKCFpc05hTih2YWx1ZS5jYXRjaGVzKSAmJiBwYXJzZUludCh2YWx1ZS5jYXRjaGVzKSA+IDApe1xuICAgICAgICAgICAgICAgIHZhbHVlLmNhdGNoZXMgPSBwYXJzZUludCh2YWx1ZS5jYXRjaGVzKVxuICAgICAgICAgICAgICAgIGNhdGNoZXMgKz0gdmFsdWUuY2F0Y2hlc1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmKCFpc05hTih2YWx1ZS5ydW5zX2NvbmNlZGVkKSl7XG4gICAgICAgICAgICAgICAgdmFsdWUucnVuc19jb25jZWRlZCA9IHBhcnNlSW50KHZhbHVlLnJ1bnNfY29uY2VkZWQpXG4gICAgICAgICAgICAgICAgcnVuc0NvbmNlZGVkICs9IHZhbHVlLnJ1bnNfY29uY2VkZWQ7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIGNvbnNvbGUubG9nKGZpcnN0SW5uaW5nc05vdG91dHMpO1xuICAgICAgICAgIGNvbnNvbGUubG9nKHNlY29uZElubmluZ3NOb3RvdXRzKTtcblxuICAgICAgICAgIHZhciB0b3RhbElubmluZ3MgPSB0b3RhbE1hdGNoZXMgLSBkaWROb3RCYXRcbiAgICAgICAgICB2YXIgc3RhdHMgPSB7XG4gICAgICAgICAgICB0b3RhbE1hdGNoZXMgOiB0b3RhbE1hdGNoZXMsXG4gICAgICAgICAgICB0b3RhbFJ1bnM6IHRvdGFsUnVucyxcbiAgICAgICAgICAgIGhhbGZDZW50dXJpZXNTY29yZWQ6IGhhbGZDZW50dXJpZXNTY29yZWQubGVuZ3RoLFxuICAgICAgICAgICAgY2VudHVyaWVzU2NvcmVkOiBjZW50dXJpZXNTY29yZWQubGVuZ3RoLFxuICAgICAgICAgICAgaGlnaGVzdFNjb3JlOiAgTWF0aC5tYXguYXBwbHkobnVsbCxjZW50dXJpZXNTY29yZWQubWFwKGZ1bmN0aW9uKGluZGV4KXtyZXR1cm4gaW5kZXgucnVuc30pKSxcbiAgICAgICAgICAgIG5vdE91dHM6IG5vdE91dHMsXG4gICAgICAgICAgICB0b3RhbElubmluZ3M6IHRvdGFsSW5uaW5ncyxcbiAgICAgICAgICAgIGJhdHRpbmdBdmVyYWdlOiAodG90YWxSdW5zIC8gKHRvdGFsSW5uaW5ncyAtIG5vdE91dHMpKS50b0ZpeGVkKDIpLFxuICAgICAgICAgICAgd2lja2V0c1Rha2VuOiB3aWNrZXRzVGFrZW4sXG4gICAgICAgICAgICBydW5zQ29uY2VkZWQ6IHJ1bnNDb25jZWRlZCxcbiAgICAgICAgICAgIGJvd2xpbmdBdmVyYWdlOiAocnVuc0NvbmNlZGVkIC8gd2lja2V0c1Rha2VuKS50b0ZpeGVkKDIpLFxuICAgICAgICAgICAgY2F0Y2hlczogY2F0Y2hlcyxcbiAgICAgICAgICAgIGFsbENlbnR1cmllczoge2NlbnR1cmllc1Njb3JlZCxoYWxmQ2VudHVyaWVzU2NvcmVkfSxcbiAgICAgICAgICAgIGFsbElubmluZ3M6IHthbGxJbm5pbmdzLGZpcnN0SW5uaW5nc05vdG91dHMsc2Vjb25kSW5uaW5nc05vdG91dHN9XG4gICAgICAgICAgfTtcbiAgICAgICAgICBpZihjYWxsYmFjayAmJiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSkge1xuICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soc3RhdHMpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gc3RhdHNcbiAgICAgICAgfVxuXG5cbiAgICB9KVxuIiwiYW5ndWxhci5tb2R1bGUoJ2FwcCcpXG4gICAgLmNvbnRyb2xsZXIoJ2NlbnR1cnlTdGF0c0N0cmwnLCBmdW5jdGlvbigkc2NvcGUpIHtcbiAgICAgICRzY29wZS4kd2F0Y2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgcmV0dXJuICRzY29wZS5jZW50dXJ5U3RhdHM7XG4gICAgICAgICAgIH0sIGZ1bmN0aW9uKG4pIHtcbiAgICAgICAgICAgICAgIGlmKCFuKXJldHVyblxuICAgICAgICAgICAgICAgJHNjb3BlLmFuYWx5emVDZW50dXJpZXMoJHNjb3BlLmNlbnR1cnlTdGF0cylcbiAgICAgICAgICAgfSk7XG5cbiAgICAgICRzY29wZS5hbmFseXplQ2VudHVyaWVzID0gZnVuY3Rpb24oY2VudHVyeVN0YXRzKXtcbiAgICAgICAgdmFyIHNjb3JlcyA9IF8ucGx1Y2soY2VudHVyeVN0YXRzLmNlbnR1cmllc1Njb3JlZCwgJ3J1bnMnKVxuICAgICAgICB2YXIgYWdhaW5zdCA9IF8ucGx1Y2soY2VudHVyeVN0YXRzLmNlbnR1cmllc1Njb3JlZCwgJ2FnYWluc3QnKVxuXG4gICAgICAgIHZhciB0b3RhbEZpZnRpZXMgPSBjZW50dXJ5U3RhdHMuaGFsZkNlbnR1cmllc1Njb3JlZC5sZW5ndGhcbiAgICAgICAgdmFyIHRvdGFsSHVuZHJlZHMgPSBjZW50dXJ5U3RhdHMuY2VudHVyaWVzU2NvcmVkLmxlbmd0aFxuICAgICAgICAvL1NlbmQgYXJyYXkgb2YgY29sb3JzIHRvIGNoYXJ0anNcbiAgICAgICAgdmFyIGNvbG9ycyA9IFtdO1xuICAgICAgICBjZW50dXJ5U3RhdHMuY2VudHVyaWVzU2NvcmVkLm1hcChmdW5jdGlvbihyZXMsIGtleSl7XG4gICAgICAgICAgaWYocmVzLnJlc3VsdCA9PSBcIndvblwiKXtcbiAgICAgICAgICAgIGNvbG9yc1trZXldID0gXCJyZ2JhKDAsMTMyLDI1NSwwLjgpXCJcbiAgICAgICAgICB9ZWxzZSBpZihyZXMucmVzdWx0ID09IFwibG9zdFwiKXtcbiAgICAgICAgICAgIGNvbG9yc1trZXldID0gXCJyZ2JhKDIzNyw2Myw0NywwLjgpXCJcbiAgICAgICAgICB9ZWxzZSBpZihyZXMucmVzdWx0ID09IFwidGllZFwiKXtcbiAgICAgICAgICAgIGNvbG9yc1trZXldID0gXCJibGFja1wiXG4gICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBjb2xvcnNba2V5XSA9IFwieWVsbG93XCJcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGNvbG9yc1xuICAgICAgICB9KVxuICAgICAgICB2YXIgd29uID0gXy5maWx0ZXIoY2VudHVyeVN0YXRzLmNlbnR1cmllc1Njb3JlZCwgZnVuY3Rpb24oY2VudCl7XG4gICAgICAgICAgcmV0dXJuIGNlbnQucmVzdWx0ID09IFwid29uXCJcbiAgICAgICAgfSlcbiAgICAgICAgLy8gdmFyIGxvc3QgPSBfLmZpbHRlcihjZW50dXJ5U3RhdHMuY2VudHVyaWVzU2NvcmVkLCBmdW5jdGlvbihjZW50KXtcbiAgICAgICAgLy8gICByZXR1cm4gY2VudC5yZXN1bHQgPT09IFwibG9zdFwiXG4gICAgICAgIC8vIH0pXG4gICAgICAgIC8vIHZhciB0aWVkID0gXy5maWx0ZXIoY2VudHVyeVN0YXRzLmNlbnR1cmllc1Njb3JlZCwgZnVuY3Rpb24oY2VudCl7XG4gICAgICAgIC8vICAgcmV0dXJuIGNlbnQucmVzdWx0ID09PSBcInRpZWRcIlxuICAgICAgICAvLyB9KVxuICAgICAgICAvLyB2YXIgbm9yZXN1bHQgPSBfLmZpbHRlcihjZW50dXJ5U3RhdHMuY2VudHVyaWVzU2NvcmVkLCBmdW5jdGlvbihjZW50KXtcbiAgICAgICAgLy8gICByZXR1cm4gY2VudC5yZXN1bHQgPT09IFwibi9yXCJcbiAgICAgICAgLy8gfSlcblxuICAgICAgICAvL0NlbnR1cnkgd2hpbGUgY2hhc2luZ1xuICAgICAgICB2YXIgY2hhc2luZ0NlbnR1cmllcyA9IF8uZmlsdGVyKGNlbnR1cnlTdGF0cy5jZW50dXJpZXNTY29yZWQsIGZ1bmN0aW9uKGNlbnQpe1xuICAgICAgICAgIHJldHVybiBjZW50LmlubmluZ3MgPT0gXCIybmRcIlxuICAgICAgICB9KVxuICAgICAgICB2YXIgd2luY2hhc2luZ0NlbnR1cmllcyA9IF8uZmlsdGVyKGNoYXNpbmdDZW50dXJpZXMsIGZ1bmN0aW9uKGNlbnQpe1xuICAgICAgICAgIHJldHVybiBjZW50LnJlc3VsdCA9PSBcIndvblwiXG4gICAgICAgIH0pXG4gICAgICAgIHZhciBsb3N0Y2hhc2luZ0NlbnR1cmllcyA9IF8uZmlsdGVyKGNoYXNpbmdDZW50dXJpZXMsIGZ1bmN0aW9uKGNlbnQpe1xuICAgICAgICAgIHJldHVybiBjZW50LnJlc3VsdCA9PT0gXCJsb3N0XCJcbiAgICAgICAgfSlcbiAgICAgICAgdmFyIHRpZWRjaGFzaW5nQ2VudHVyaWVzID0gXy5maWx0ZXIoY2hhc2luZ0NlbnR1cmllcywgZnVuY3Rpb24oY2VudCl7XG4gICAgICAgICAgcmV0dXJuIGNlbnQucmVzdWx0ID09PSBcInRpZWRcIlxuICAgICAgICB9KVxuICAgICAgICB2YXIgbm9yZXN1bHRjaGFzaW5nQ2VudHVyaWVzID0gXy5maWx0ZXIoY2hhc2luZ0NlbnR1cmllcywgZnVuY3Rpb24oY2VudCl7XG4gICAgICAgICAgcmV0dXJuIGNlbnQucmVzdWx0ID09PSBcIm4vclwiXG4gICAgICAgIH0pXG5cbiAgICAgICAgLy9DZW50dXJ5IGFnYWluc3QgdGVhbXNcbiAgICAgICAgdmFyIGNlbnR1cnlBZ2FpbnN0VGVhbXMgPSBbXTtcbiAgICAgICAgY2VudHVyeVN0YXRzLmNlbnR1cmllc1Njb3JlZC5tYXAoZnVuY3Rpb24ocmVzKXtcbiAgICAgICAgICB2YXIgdGVhbSA9IHJlcy5hZ2FpbnN0O1xuICAgICAgICAgIHZhciBjZW50dXJ5ID0ge1xuICAgICAgICAgICAgc2NvcmU6IHJlcy5ydW5zXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmKHR5cGVvZihjZW50dXJ5QWdhaW5zdFRlYW1zW3RlYW1dKSA9PSBcInVuZGVmaW5lZFwiKVxuICAgICAgICAgICAgICAgICAgY2VudHVyeUFnYWluc3RUZWFtc1t0ZWFtXSA9IFtdXG4gICAgICAgICAgcmV0dXJuIGNlbnR1cnlBZ2FpbnN0VGVhbXNbdGVhbV0ucHVzaChjZW50dXJ5KVxuICAgICAgICB9KVxuXG4gICAgICAgIC8vQ2VudHVyeSBvdmVyIHRoZSB5ZWFyc1xuICAgICAgICB2YXIgY2VudHVyeUJ5WWVhciA9IFtdO1xuICAgICAgICBjZW50dXJ5U3RhdHMuY2VudHVyaWVzU2NvcmVkLm1hcChmdW5jdGlvbihyZXMpe1xuICAgICAgICAgIHZhciB5ZWFyID0gcmVzLnllYXI7XG4gICAgICAgICAgdmFyIGNlbnR1cnkgPSB7XG4gICAgICAgICAgICBzY29yZTogcmVzLnJ1bnNcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYodHlwZW9mKGNlbnR1cnlCeVllYXJbeWVhcl0pID09IFwidW5kZWZpbmVkXCIpXG4gICAgICAgICAgICAgICAgICBjZW50dXJ5QnlZZWFyW3llYXJdID0gW11cbiAgICAgICAgICByZXR1cm4gY2VudHVyeUJ5WWVhclt5ZWFyXS5wdXNoKGNlbnR1cnkpXG4gICAgICAgIH0pXG5cbiAgICAgICAgdmFyIGhhbGZDZW50dXJ5QnlZZWFyID0gW107XG4gICAgICAgIGNlbnR1cnlTdGF0cy5oYWxmQ2VudHVyaWVzU2NvcmVkLm1hcChmdW5jdGlvbihyZXMpe1xuICAgICAgICAgIHZhciB5ZWFyID0gcmVzLnllYXI7XG4gICAgICAgICAgdmFyIGhhbGZDZW50dXJ5ID0ge1xuICAgICAgICAgICAgc2NvcmU6IHJlcy5ydW5zXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmKHR5cGVvZihoYWxmQ2VudHVyeUJ5WWVhclt5ZWFyXSkgPT0gXCJ1bmRlZmluZWRcIilcbiAgICAgICAgICAgICAgICAgIGhhbGZDZW50dXJ5QnlZZWFyW3llYXJdID0gW11cbiAgICAgICAgICByZXR1cm4gaGFsZkNlbnR1cnlCeVllYXJbeWVhcl0ucHVzaChoYWxmQ2VudHVyeSlcbiAgICAgICAgfSlcblxuICAgICAgICBjb25zb2xlLmxvZyhjZW50dXJ5QnlZZWFyLGhhbGZDZW50dXJ5QnlZZWFyKVxuXG5cbiAgICAgICAgJHNjb3BlLndpbm5pbmdSYXRpbyA9ICh3b24ubGVuZ3RoL2NlbnR1cnlTdGF0cy5jZW50dXJpZXNTY29yZWQubGVuZ3RoKS50b0ZpeGVkKDIpICogMTA7XG4gICAgICAgICRzY29wZS5wcmVwYXJlQmFyR3JhcGgoc2NvcmVzLCBhZ2FpbnN0LCBjb2xvcnMpXG4gICAgICAgICRzY29wZS5wcmVwYXJlQmFyR3JhcGhBZ2FpbnN0VGVhbShjZW50dXJ5QWdhaW5zdFRlYW1zKVxuICAgICAgICAkc2NvcGUucHJlcGFyZUxpbmVHcmFwaChjZW50dXJ5QnlZZWFyLGhhbGZDZW50dXJ5QnlZZWFyKTtcbiAgICAgICAgJHNjb3BlLnByZXBhcmVEb3VnaG51dENoYXJ0KHdpbmNoYXNpbmdDZW50dXJpZXMubGVuZ3RoLGxvc3RjaGFzaW5nQ2VudHVyaWVzLmxlbmd0aCx0aWVkY2hhc2luZ0NlbnR1cmllcy5sZW5ndGgsbm9yZXN1bHRjaGFzaW5nQ2VudHVyaWVzLmxlbmd0aClcbiAgICAgICAgJHNjb3BlLnByZXBhcmVDb252ZXJzaW9uUmF0ZVBpZUNoYXJ0KHRvdGFsRmlmdGllcyx0b3RhbEh1bmRyZWRzKVxuICAgICAgfVxuXG5cblxuXG5cblxuXG5cbiAgICAgICRzY29wZS5wcmVwYXJlQmFyR3JhcGggPSBmdW5jdGlvbiAoc2NvcmVzLGFnYWluc3QsIGNvbG9ycyl7XG4gICAgICAgICRzY29wZS5iYXJkYXRhID0ge1xuICAgICAgICAgICAgICAgbGFiZWxzOiBhZ2FpbnN0LFxuICAgICAgICAgICAgICAgZGF0YXNldHM6IFt7XG4gICAgICAgICAgICAgICAgICAgbGFiZWw6ICdDZW50dXJpZXMnLFxuICAgICAgICAgICAgICAgICAgIGZpbGxDb2xvcjogY29sb3JzLFxuICAgICAgICAgICAgICAgICAgIHN0cm9rZUNvbG9yOiAncmdiYSgyMjAsMjIwLDIyMCwxKScsXG4gICAgICAgICAgICAgICAgICAgcG9pbnRDb2xvcjogJ3JnYmEoMjIwLDIyMCwyMjAsMSknLFxuICAgICAgICAgICAgICAgICAgIHBvaW50U3Ryb2tlQ29sb3I6ICcjZmZmJyxcbiAgICAgICAgICAgICAgICAgICBwb2ludEhpZ2hsaWdodEZpbGw6ICcjZmZmJyxcbiAgICAgICAgICAgICAgICAgICBwb2ludEhpZ2hsaWdodFN0cm9rZTogJ3JnYmEoMjIwLDIyMCwyMjAsMSknLFxuICAgICAgICAgICAgICAgICAgIGRhdGE6IHNjb3Jlc1xuICAgICAgICAgICAgICAgfV1cbiAgICAgICAgICAgfTtcblxuICAgICAgICAgICAvLyBDaGFydC5qcyBPcHRpb25zXG4gICAgICAgICAgICRzY29wZS5iYXJvcHRpb25zID0ge1xuXG4gICAgICAgICAgICAgICAvLyBTZXRzIHRoZSBjaGFydCB0byBiZSByZXNwb25zaXZlXG4gICAgICAgICAgICAgICByZXNwb25zaXZlOiB0cnVlLFxuXG4gICAgICAgICAgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIHRoZSBzY2FsZSBzaG91bGQgc3RhcnQgYXQgemVybywgb3IgYW4gb3JkZXIgb2YgbWFnbml0dWRlIGRvd24gZnJvbSB0aGUgbG93ZXN0IHZhbHVlXG4gICAgICAgICAgICAgICBzY2FsZUJlZ2luQXRaZXJvOiB0cnVlLFxuXG4gICAgICAgICAgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIGdyaWQgbGluZXMgYXJlIHNob3duIGFjcm9zcyB0aGUgY2hhcnRcbiAgICAgICAgICAgICAgIHNjYWxlU2hvd0dyaWRMaW5lczogdHJ1ZSxcblxuICAgICAgICAgICAgICAgLy9TdHJpbmcgLSBDb2xvdXIgb2YgdGhlIGdyaWQgbGluZXNcbiAgICAgICAgICAgICAgIHNjYWxlR3JpZExpbmVDb2xvcjogXCJyZ2JhKDAsMCwwLC4wNSlcIixcblxuICAgICAgICAgICAgICAgLy9OdW1iZXIgLSBXaWR0aCBvZiB0aGUgZ3JpZCBsaW5lc1xuICAgICAgICAgICAgICAgc2NhbGVHcmlkTGluZVdpZHRoOiAxLFxuXG4gICAgICAgICAgICAgICAvL0Jvb2xlYW4gLSBJZiB0aGVyZSBpcyBhIHN0cm9rZSBvbiBlYWNoIGJhclxuICAgICAgICAgICAgICAgYmFyU2hvd1N0cm9rZTogdHJ1ZSxcblxuICAgICAgICAgICAgICAgLy9OdW1iZXIgLSBQaXhlbCB3aWR0aCBvZiB0aGUgYmFyIHN0cm9rZVxuICAgICAgICAgICAgICAgYmFyU3Ryb2tlV2lkdGg6IDIsXG5cbiAgICAgICAgICAgICAgIC8vTnVtYmVyIC0gU3BhY2luZyBiZXR3ZWVuIGVhY2ggb2YgdGhlIFggdmFsdWUgc2V0c1xuICAgICAgICAgICAgICAgYmFyVmFsdWVTcGFjaW5nOiA1LFxuXG4gICAgICAgICAgICAgICAvL051bWJlciAtIFNwYWNpbmcgYmV0d2VlbiBkYXRhIHNldHMgd2l0aGluIFggdmFsdWVzXG4gICAgICAgICAgICAgICBiYXJEYXRhc2V0U3BhY2luZzogMSxcblxuICAgICAgICAgICAgICAgLy9TdHJpbmcgLSBBIGxlZ2VuZCB0ZW1wbGF0ZVxuICAgICAgICAgICAgICAgbGVnZW5kVGVtcGxhdGU6ICc8dWwgY2xhc3M9XCJ0Yy1jaGFydC1qcy1sZWdlbmRcIj48JSBmb3IgKHZhciBpPTA7IGk8ZGF0YXNldHMubGVuZ3RoOyBpKyspeyU+PGxpPjxzcGFuIHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjo8JT1kYXRhc2V0c1tpXS5maWxsQ29sb3IlPlwiPjwvc3Bhbj48JWlmKGRhdGFzZXRzW2ldLmxhYmVsKXslPjwlPWRhdGFzZXRzW2ldLmxhYmVsJT48JX0lPjwvbGk+PCV9JT48L3VsPidcbiAgICAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgJHNjb3BlLnByZXBhcmVCYXJHcmFwaEFnYWluc3RUZWFtID0gZnVuY3Rpb24gKGNlbnR1cnlBZ2FpbnN0VGVhbXMpe1xuICAgICAgICB2YXIgYWdhaW5zdEZvckNlbnR1cmllcyA9IFtdXG4gICAgICAgIHZhciBudW1iZXJPZkNlbnR1cmllcyA9IFtdXG4gICAgICAgIGZvcih2YXIgY2VudHVyeUtleSBpbiBjZW50dXJ5QWdhaW5zdFRlYW1zKSB7XG4gICAgICAgICAgaWYoY2VudHVyeUFnYWluc3RUZWFtcy5oYXNPd25Qcm9wZXJ0eShjZW50dXJ5S2V5KSkge1xuICAgICAgICAgICAgYWdhaW5zdEZvckNlbnR1cmllcy5wdXNoKGNlbnR1cnlLZXkpO1xuICAgICAgICAgICAgbnVtYmVyT2ZDZW50dXJpZXMucHVzaChjZW50dXJ5QWdhaW5zdFRlYW1zW2NlbnR1cnlLZXldLmxlbmd0aClcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgJHNjb3BlLmJhcmRhdGFBZ2FpbnN0VGVhbSA9IHtcbiAgICAgICAgICAgICAgIGxhYmVsczogYWdhaW5zdEZvckNlbnR1cmllcyxcbiAgICAgICAgICAgICAgIGRhdGFzZXRzOiBbe1xuICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnQ2VudHVyaWVzJyxcbiAgICAgICAgICAgICAgICAgICBmaWxsQ29sb3I6IFsnYmx1ZSddLFxuICAgICAgICAgICAgICAgICAgIHN0cm9rZUNvbG9yOiAncmdiYSgyMjAsMjIwLDIyMCwxKScsXG4gICAgICAgICAgICAgICAgICAgcG9pbnRDb2xvcjogJ3JnYmEoMjIwLDIyMCwyMjAsMSknLFxuICAgICAgICAgICAgICAgICAgIHBvaW50U3Ryb2tlQ29sb3I6ICcjZmZmJyxcbiAgICAgICAgICAgICAgICAgICBwb2ludEhpZ2hsaWdodEZpbGw6ICcjZmZmJyxcbiAgICAgICAgICAgICAgICAgICBwb2ludEhpZ2hsaWdodFN0cm9rZTogJ3JnYmEoMjIwLDIyMCwyMjAsMSknLFxuICAgICAgICAgICAgICAgICAgIGRhdGE6IG51bWJlck9mQ2VudHVyaWVzXG4gICAgICAgICAgICAgICB9XVxuICAgICAgICAgICB9O1xuXG4gICAgICAgICAgIC8vIENoYXJ0LmpzIE9wdGlvbnNcbiAgICAgICAgICAgJHNjb3BlLmJhcm9wdGlvbnNBZ2FpbnN0VGVhbSA9IHtcblxuICAgICAgICAgICAgICAgLy8gU2V0cyB0aGUgY2hhcnQgdG8gYmUgcmVzcG9uc2l2ZVxuICAgICAgICAgICAgICAgcmVzcG9uc2l2ZTogdHJ1ZSxcblxuICAgICAgICAgICAgICAgLy9Cb29sZWFuIC0gV2hldGhlciB0aGUgc2NhbGUgc2hvdWxkIHN0YXJ0IGF0IHplcm8sIG9yIGFuIG9yZGVyIG9mIG1hZ25pdHVkZSBkb3duIGZyb20gdGhlIGxvd2VzdCB2YWx1ZVxuICAgICAgICAgICAgICAgc2NhbGVCZWdpbkF0WmVybzogdHJ1ZSxcblxuICAgICAgICAgICAgICAgLy9Cb29sZWFuIC0gV2hldGhlciBncmlkIGxpbmVzIGFyZSBzaG93biBhY3Jvc3MgdGhlIGNoYXJ0XG4gICAgICAgICAgICAgICBzY2FsZVNob3dHcmlkTGluZXM6IHRydWUsXG5cbiAgICAgICAgICAgICAgIC8vU3RyaW5nIC0gQ29sb3VyIG9mIHRoZSBncmlkIGxpbmVzXG4gICAgICAgICAgICAgICBzY2FsZUdyaWRMaW5lQ29sb3I6IFwicmdiYSgwLDAsMCwuMDUpXCIsXG5cbiAgICAgICAgICAgICAgIC8vTnVtYmVyIC0gV2lkdGggb2YgdGhlIGdyaWQgbGluZXNcbiAgICAgICAgICAgICAgIHNjYWxlR3JpZExpbmVXaWR0aDogMSxcblxuICAgICAgICAgICAgICAgLy9Cb29sZWFuIC0gSWYgdGhlcmUgaXMgYSBzdHJva2Ugb24gZWFjaCBiYXJcbiAgICAgICAgICAgICAgIGJhclNob3dTdHJva2U6IHRydWUsXG5cbiAgICAgICAgICAgICAgIC8vTnVtYmVyIC0gUGl4ZWwgd2lkdGggb2YgdGhlIGJhciBzdHJva2VcbiAgICAgICAgICAgICAgIGJhclN0cm9rZVdpZHRoOiAyLFxuXG4gICAgICAgICAgICAgICAvL051bWJlciAtIFNwYWNpbmcgYmV0d2VlbiBlYWNoIG9mIHRoZSBYIHZhbHVlIHNldHNcbiAgICAgICAgICAgICAgIGJhclZhbHVlU3BhY2luZzogNSxcblxuICAgICAgICAgICAgICAgLy9OdW1iZXIgLSBTcGFjaW5nIGJldHdlZW4gZGF0YSBzZXRzIHdpdGhpbiBYIHZhbHVlc1xuICAgICAgICAgICAgICAgYmFyRGF0YXNldFNwYWNpbmc6IDEsXG5cbiAgICAgICAgICAgICAgIC8vU3RyaW5nIC0gQSBsZWdlbmQgdGVtcGxhdGVcbiAgICAgICAgICAgICAgIGxlZ2VuZFRlbXBsYXRlOiAnPHVsIGNsYXNzPVwidGMtY2hhcnQtanMtbGVnZW5kXCI+PCUgZm9yICh2YXIgaT0wOyBpPGRhdGFzZXRzLmxlbmd0aDsgaSsrKXslPjxsaT48c3BhbiBzdHlsZT1cImJhY2tncm91bmQtY29sb3I6PCU9ZGF0YXNldHNbaV0uZmlsbENvbG9yJT5cIj48L3NwYW4+PCVpZihkYXRhc2V0c1tpXS5sYWJlbCl7JT48JT1kYXRhc2V0c1tpXS5sYWJlbCU+PCV9JT48L2xpPjwlfSU+PC91bD4nXG4gICAgICAgICAgIH07XG4gICAgICB9XG5cblxuICAgICAgJHNjb3BlLnByZXBhcmVMaW5lR3JhcGggPSBmdW5jdGlvbihjZW50dXJ5QnlZZWFyLGhhbGZDZW50dXJ5QnlZZWFyKXtcbiAgICAgICAgICB2YXIgeWVhck9mY2VudHVyaWVzID0gW11cbiAgICAgICAgICB2YXIgbnVtYmVyT2ZDZW50dXJpZXMgPSBbXVxuXG4gICAgICAgICAgZm9yKHZhciBjZW50dXJ5IGluIGNlbnR1cnlCeVllYXIpIHtcbiAgICAgICAgICAgIGlmKGNlbnR1cnlCeVllYXIuaGFzT3duUHJvcGVydHkoY2VudHVyeSkpIHtcbiAgICAgICAgICAgICAgeWVhck9mY2VudHVyaWVzLnB1c2goY2VudHVyeSk7XG4gICAgICAgICAgICAgIG51bWJlck9mQ2VudHVyaWVzLnB1c2goY2VudHVyeUJ5WWVhcltjZW50dXJ5XS5sZW5ndGgpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciB5ZWFyT2ZoYWxmQ2VudHVyaWVzID0gW11cbiAgICAgICAgICB2YXIgbnVtYmVyT2ZIYWxmQ2VudHVyaWVzID0gW11cblxuICAgICAgICAgIGZvcih2YXIgaGFsZkNlbnR1cnkgaW4gaGFsZkNlbnR1cnlCeVllYXIpIHtcbiAgICAgICAgICAgIGlmKGhhbGZDZW50dXJ5QnlZZWFyLmhhc093blByb3BlcnR5KGhhbGZDZW50dXJ5KSkge1xuICAgICAgICAgICAgICB5ZWFyT2ZoYWxmQ2VudHVyaWVzLnB1c2goaGFsZkNlbnR1cnkpO1xuICAgICAgICAgICAgICBudW1iZXJPZkhhbGZDZW50dXJpZXMucHVzaChoYWxmQ2VudHVyeUJ5WWVhcltoYWxmQ2VudHVyeV0ubGVuZ3RoKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgeWVhcldpdGhOb0hhbGZDZW50dXJ5ID0gXy5maWx0ZXIoeWVhck9mY2VudHVyaWVzLCBmdW5jdGlvbihlbCl7XG4gICAgICAgICAgICByZXR1cm4geWVhck9maGFsZkNlbnR1cmllcy5pbmRleE9mKGVsKSA8IDBcbiAgICAgICAgICB9KVxuICAgICAgICAgIHZhciB5ZWFyV2l0aE5vQ2VudHVyeSA9IF8uZmlsdGVyKHllYXJPZmhhbGZDZW50dXJpZXMsIGZ1bmN0aW9uKGVsKXtcbiAgICAgICAgICAgIHJldHVybiB5ZWFyT2ZjZW50dXJpZXMuaW5kZXhPZihlbCkgPCAwXG4gICAgICAgICAgfSlcbiAgICAgICAgICBjb25zb2xlLmxvZyh5ZWFyV2l0aE5vSGFsZkNlbnR1cnkpXG4gICAgICAgICAgY29uc29sZS5sb2coeWVhcldpdGhOb0NlbnR1cnkpXG4gICAgICAgICAgLy8gVGFraW5nIHVuaW9uIG9mIGJvdGggeWVhcnMgb2YgY2VudHVyaWVzIGFuZCBoYWxmIGNlbnR1cmllcywgQ0xFQU4gSVQgVVAgTEFURVJcbiAgICAgICAgICB2YXIgYWxsWWVhcnNGb3JEYXRhID0gXy51bmlvbih5ZWFyT2ZjZW50dXJpZXMseWVhck9maGFsZkNlbnR1cmllcykuc29ydCgpXG4gICAgICAgICAgdmFyIGluZGV4T2ZOb0hhbGZjZW50dXJ5ID0geWVhcldpdGhOb0hhbGZDZW50dXJ5Lm1hcChmdW5jdGlvbihyZXMpe1xuICAgICAgICAgICAgICByZXR1cm4gYWxsWWVhcnNGb3JEYXRhLmluZGV4T2YocmVzKVxuICAgICAgICAgIH0pXG4gICAgICAgICAgdmFyIGluZGV4T2ZOb0NlbnR1cnkgPSB5ZWFyV2l0aE5vQ2VudHVyeS5tYXAoZnVuY3Rpb24ocmVzKXtcbiAgICAgICAgICAgICAgcmV0dXJuIGFsbFllYXJzRm9yRGF0YS5pbmRleE9mKHJlcylcbiAgICAgICAgICB9KSAgICAgICAgICBcbiAgICAgICAgICAvL0FkZCBpbnNlcnQgbWV0aG9kIGFkZCBwcm90b3R5cGUgbGV2ZWwgbGF0ZXJcbiAgICAgICAgICBpbmRleE9mTm9DZW50dXJ5Lm1hcChmdW5jdGlvbihyZXMpe1xuICAgICAgICAgICAgcmV0dXJuIG51bWJlck9mQ2VudHVyaWVzLnNwbGljZShyZXMsIDAsIDApO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgaW5kZXhPZk5vSGFsZmNlbnR1cnkubWFwKGZ1bmN0aW9uKHJlcyl7XG4gICAgICAgICAgICByZXR1cm4gbnVtYmVyT2ZIYWxmQ2VudHVyaWVzLnNwbGljZShyZXMsIDAsIDApO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgJHNjb3BlLmxpbmVEYXRhID0ge1xuICAgICAgICAgIGxhYmVsczogYWxsWWVhcnNGb3JEYXRhLFxuICAgICAgICAgIGRhdGFzZXRzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGxhYmVsOiAnSGFsZiBDZW50dXJpZXMgb3ZlciB0aGUgeWVhcnMnLFxuICAgICAgICAgICAgICBmaWxsQ29sb3I6IFsncmdiYSgxMjAsMjAsMjIwLDAuNCknXSxcbiAgICAgICAgICAgICAgc3Ryb2tlQ29sb3I6ICdyZ2JhKDIyMCwyMjAsMjIwLDEpJyxcbiAgICAgICAgICAgICAgcG9pbnRDb2xvcjogJ3JnYmEoMjIwLDIyMCwyMjAsMSknLFxuICAgICAgICAgICAgICBwb2ludFN0cm9rZUNvbG9yOiAnI2ZmZicsXG4gICAgICAgICAgICAgIHBvaW50SGlnaGxpZ2h0RmlsbDogJyNmZmYnLFxuICAgICAgICAgICAgICBwb2ludEhpZ2hsaWdodFN0cm9rZTogJ3JnYmEoMjIwLDIyMCwyMjAsMSknLFxuICAgICAgICAgICAgICBkYXRhOiBudW1iZXJPZkhhbGZDZW50dXJpZXNcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGxhYmVsOiAnQ2VudHVyaWVzJyxcbiAgICAgICAgICAgICAgZmlsbENvbG9yOiBbJ3JnYmEoMjIwLDIyMCwyMjAsMC42KSddLFxuICAgICAgICAgICAgICBzdHJva2VDb2xvcjogJ3JnYmEoMjIwLDIyMCwyMjAsMSknLFxuICAgICAgICAgICAgICBwb2ludENvbG9yOiAncmdiYSgyMjAsMjIwLDIyMCwxKScsXG4gICAgICAgICAgICAgIHBvaW50U3Ryb2tlQ29sb3I6ICcjZmZmJyxcbiAgICAgICAgICAgICAgcG9pbnRIaWdobGlnaHRGaWxsOiAnI2ZmZicsXG4gICAgICAgICAgICAgIHBvaW50SGlnaGxpZ2h0U3Ryb2tlOiAncmdiYSgyMjAsMjIwLDIyMCwxKScsXG4gICAgICAgICAgICAgIGRhdGE6IG51bWJlck9mQ2VudHVyaWVzXG4gICAgICAgICAgICB9XG4gICAgICAgICAgXVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIENoYXJ0LmpzIE9wdGlvbnNcbiAgICAgICAgJHNjb3BlLmxpbmVPcHRpb25zID0gIHtcblxuICAgICAgICAgIC8vIFNldHMgdGhlIGNoYXJ0IHRvIGJlIHJlc3BvbnNpdmVcbiAgICAgICAgICByZXNwb25zaXZlOiB0cnVlLFxuXG4gICAgICAgICAgLy8vQm9vbGVhbiAtIFdoZXRoZXIgZ3JpZCBsaW5lcyBhcmUgc2hvd24gYWNyb3NzIHRoZSBjaGFydFxuICAgICAgICAgIHNjYWxlU2hvd0dyaWRMaW5lcyA6IHRydWUsXG5cbiAgICAgICAgICAvL1N0cmluZyAtIENvbG91ciBvZiB0aGUgZ3JpZCBsaW5lc1xuICAgICAgICAgIHNjYWxlR3JpZExpbmVDb2xvciA6IFwicmdiYSgwLDAsMCwuMDUpXCIsXG5cbiAgICAgICAgICAvL051bWJlciAtIFdpZHRoIG9mIHRoZSBncmlkIGxpbmVzXG4gICAgICAgICAgc2NhbGVHcmlkTGluZVdpZHRoIDogMSxcblxuICAgICAgICAgIC8vQm9vbGVhbiAtIFdoZXRoZXIgdGhlIGxpbmUgaXMgY3VydmVkIGJldHdlZW4gcG9pbnRzXG4gICAgICAgICAgYmV6aWVyQ3VydmUgOiB0cnVlLFxuXG4gICAgICAgICAgLy9OdW1iZXIgLSBUZW5zaW9uIG9mIHRoZSBiZXppZXIgY3VydmUgYmV0d2VlbiBwb2ludHNcbiAgICAgICAgICBiZXppZXJDdXJ2ZVRlbnNpb24gOiAwLjQsXG5cbiAgICAgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIHRvIHNob3cgYSBkb3QgZm9yIGVhY2ggcG9pbnRcbiAgICAgICAgICBwb2ludERvdCA6IHRydWUsXG5cbiAgICAgICAgICAvL051bWJlciAtIFJhZGl1cyBvZiBlYWNoIHBvaW50IGRvdCBpbiBwaXhlbHNcbiAgICAgICAgICBwb2ludERvdFJhZGl1cyA6IDQsXG5cbiAgICAgICAgICAvL051bWJlciAtIFBpeGVsIHdpZHRoIG9mIHBvaW50IGRvdCBzdHJva2VcbiAgICAgICAgICBwb2ludERvdFN0cm9rZVdpZHRoIDogMSxcblxuICAgICAgICAgIC8vTnVtYmVyIC0gYW1vdW50IGV4dHJhIHRvIGFkZCB0byB0aGUgcmFkaXVzIHRvIGNhdGVyIGZvciBoaXQgZGV0ZWN0aW9uIG91dHNpZGUgdGhlIGRyYXduIHBvaW50XG4gICAgICAgICAgcG9pbnRIaXREZXRlY3Rpb25SYWRpdXMgOiAyMCxcblxuICAgICAgICAgIC8vQm9vbGVhbiAtIFdoZXRoZXIgdG8gc2hvdyBhIHN0cm9rZSBmb3IgZGF0YXNldHNcbiAgICAgICAgICBkYXRhc2V0U3Ryb2tlIDogdHJ1ZSxcblxuICAgICAgICAgIC8vTnVtYmVyIC0gUGl4ZWwgd2lkdGggb2YgZGF0YXNldCBzdHJva2VcbiAgICAgICAgICBkYXRhc2V0U3Ryb2tlV2lkdGggOiAyLFxuXG4gICAgICAgICAgLy9Cb29sZWFuIC0gV2hldGhlciB0byBmaWxsIHRoZSBkYXRhc2V0IHdpdGggYSBjb2xvdXJcbiAgICAgICAgICBkYXRhc2V0RmlsbCA6IHRydWUsXG5cbiAgICAgICAgICAvLyBGdW5jdGlvbiAtIG9uIGFuaW1hdGlvbiBwcm9ncmVzc1xuICAgICAgICAgIG9uQW5pbWF0aW9uUHJvZ3Jlc3M6IGZ1bmN0aW9uKCl7fSxcblxuICAgICAgICAgIC8vIEZ1bmN0aW9uIC0gb24gYW5pbWF0aW9uIGNvbXBsZXRlXG4gICAgICAgICAgb25BbmltYXRpb25Db21wbGV0ZTogZnVuY3Rpb24oKXt9LFxuXG4gICAgICAgICAgLy9TdHJpbmcgLSBBIGxlZ2VuZCB0ZW1wbGF0ZVxuICAgICAgICAgIGxlZ2VuZFRlbXBsYXRlIDogJzx1bCBjbGFzcz1cInRjLWNoYXJ0LWpzLWxlZ2VuZFwiPjwlIGZvciAodmFyIGk9MDsgaTxkYXRhc2V0cy5sZW5ndGg7IGkrKyl7JT48bGk+PHNwYW4gc3R5bGU9XCJiYWNrZ3JvdW5kLWNvbG9yOjwlPWRhdGFzZXRzW2ldLnN0cm9rZUNvbG9yJT5cIj48L3NwYW4+PCVpZihkYXRhc2V0c1tpXS5sYWJlbCl7JT48JT1kYXRhc2V0c1tpXS5sYWJlbCU+PCV9JT48L2xpPjwlfSU+PC91bD4nXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICAkc2NvcGUucHJlcGFyZURvdWdobnV0Q2hhcnQgPSBmdW5jdGlvbih3b24sIGxvc3QsIHRpZWQsIG5vcmVzdWx0KXtcbiAgICAgICAgJHNjb3BlLnJlc291cmNlcyA9IFt7XG4gICAgICAgICAgICAgICB2YWx1ZTogd29uLFxuICAgICAgICAgICAgICAgY29sb3I6ICcjRkZGRjAwJyxcbiAgICAgICAgICAgICAgIGhpZ2hsaWdodDogJyNlNWU1MDAnLFxuICAgICAgICAgICAgICAgbGFiZWw6ICdXaW4nXG4gICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgIHZhbHVlOiBsb3N0LFxuICAgICAgICAgICAgICAgY29sb3I6ICcjNDZCRkJEJyxcbiAgICAgICAgICAgICAgIGhpZ2hsaWdodDogJyM1QUQzRDEnLFxuICAgICAgICAgICAgICAgbGFiZWw6ICdMb3NzJ1xuICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICB2YWx1ZTogdGllZCxcbiAgICAgICAgICAgICAgIGNvbG9yOiAnI0Y3NDY0QScsXG4gICAgICAgICAgICAgICBoaWdobGlnaHQ6ICcjRkY1QTVFJyxcbiAgICAgICAgICAgICAgIGxhYmVsOiAnVGllJ1xuICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICB2YWx1ZTogbm9yZXN1bHQsXG4gICAgICAgICAgICAgICBjb2xvcjogJyNGNzQ2NEEnLFxuICAgICAgICAgICAgICAgaGlnaGxpZ2h0OiAnI0VGNUE1RScsXG4gICAgICAgICAgICAgICBsYWJlbDogJ05vIFJlc3VsdCdcbiAgICAgICAgICAgfVxuICAgICAgICAgXTtcblxuICAgICAgICAgICAvLyBDaGFydC5qcyBPcHRpb25zXG4gICAgICAgICAgICRzY29wZS5vcHRpb25zID0ge1xuXG4gICAgICAgICAgICAgICAvLyBTZXRzIHRoZSBjaGFydCB0byBiZSByZXNwb25zaXZlXG4gICAgICAgICAgICAgICByZXNwb25zaXZlOiB0cnVlLFxuXG4gICAgICAgICAgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIHdlIHNob3VsZCBzaG93IGEgc3Ryb2tlIG9uIGVhY2ggc2VnbWVudFxuICAgICAgICAgICAgICAgc2VnbWVudFNob3dTdHJva2U6IHRydWUsXG5cbiAgICAgICAgICAgICAgIC8vU3RyaW5nIC0gVGhlIGNvbG91ciBvZiBlYWNoIHNlZ21lbnQgc3Ryb2tlXG4gICAgICAgICAgICAgICBzZWdtZW50U3Ryb2tlQ29sb3I6ICcjZmZmJyxcblxuICAgICAgICAgICAgICAgLy9OdW1iZXIgLSBUaGUgd2lkdGggb2YgZWFjaCBzZWdtZW50IHN0cm9rZVxuICAgICAgICAgICAgICAgc2VnbWVudFN0cm9rZVdpZHRoOiAyLFxuXG4gICAgICAgICAgICAgICAvL051bWJlciAtIFRoZSBwZXJjZW50YWdlIG9mIHRoZSBjaGFydCB0aGF0IHdlIGN1dCBvdXQgb2YgdGhlIG1pZGRsZVxuICAgICAgICAgICAgICAgcGVyY2VudGFnZUlubmVyQ3V0b3V0OiA1MCwgLy8gVGhpcyBpcyAwIGZvciBQaWUgY2hhcnRzXG5cbiAgICAgICAgICAgICAgIC8vTnVtYmVyIC0gQW1vdW50IG9mIGFuaW1hdGlvbiBzdGVwc1xuICAgICAgICAgICAgICAgYW5pbWF0aW9uU3RlcHM6IDEwMCxcblxuICAgICAgICAgICAgICAgLy9TdHJpbmcgLSBBbmltYXRpb24gZWFzaW5nIGVmZmVjdFxuICAgICAgICAgICAgICAgYW5pbWF0aW9uRWFzaW5nOiAnZWFzZU91dEJvdW5jZScsXG5cbiAgICAgICAgICAgICAgIC8vQm9vbGVhbiAtIFdoZXRoZXIgd2UgYW5pbWF0ZSB0aGUgcm90YXRpb24gb2YgdGhlIERvdWdobnV0XG4gICAgICAgICAgICAgICBhbmltYXRlUm90YXRlOiB0cnVlLFxuXG4gICAgICAgICAgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIHdlIGFuaW1hdGUgc2NhbGluZyB0aGUgRG91Z2hudXQgZnJvbSB0aGUgY2VudHJlXG4gICAgICAgICAgICAgICBhbmltYXRlU2NhbGU6IGZhbHNlLFxuXG4gICAgICAgICAgICAgICAvL1N0cmluZyAtIEEgbGVnZW5kIHRlbXBsYXRlXG4gICAgICAgICAgICAgICBsZWdlbmRUZW1wbGF0ZTogJzx1bCBjbGFzcz1cInRjLWNoYXJ0LWpzLWxlZ2VuZFwiPjwlIGZvciAodmFyIGk9MDsgaTxzZWdtZW50cy5sZW5ndGg7IGkrKyl7JT48bGk+PHNwYW4gc3R5bGU9XCJiYWNrZ3JvdW5kLWNvbG9yOjwlPXNlZ21lbnRzW2ldLmZpbGxDb2xvciU+XCI+PC9zcGFuPjwlaWYoc2VnbWVudHNbaV0ubGFiZWwpeyU+PCU9c2VnbWVudHNbaV0ubGFiZWwlPjwlfSU+PC9saT48JX0lPjwvdWw+J1xuXG4gICAgICAgICAgIH07XG5cbiAgICAgIH1cblxuICAgICAgJHNjb3BlLnByZXBhcmVDb252ZXJzaW9uUmF0ZVBpZUNoYXJ0ID0gZnVuY3Rpb24oZmlmdHksaHVuZHJlZCl7XG4gICAgICAgICAgICAkc2NvcGUuY29udmVyc2lvbkRhdGEgPSBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgdmFsdWU6IGZpZnR5LFxuICAgICAgICAgICAgY29sb3I6JyNGNzQ2NEEnLFxuICAgICAgICAgICAgaGlnaGxpZ2h0OiAnI0ZGNUE1RScsXG4gICAgICAgICAgICBsYWJlbDogJ0hhbGYgQ2VudHVyaWVzJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgdmFsdWU6IGh1bmRyZWQsXG4gICAgICAgICAgICBjb2xvcjogJyNGREI0NUMnLFxuICAgICAgICAgICAgaGlnaGxpZ2h0OiAnI0ZGQzg3MCcsXG4gICAgICAgICAgICBsYWJlbDogJ0NlbnR1cmllcydcbiAgICAgICAgICB9XG4gICAgICAgIF07XG5cbiAgICAgICAgLy8gQ2hhcnQuanMgT3B0aW9uc1xuICAgICAgICAkc2NvcGUuY29udmVyc2lvbk9wdGlvbnMgPSAge1xuXG4gICAgICAgICAgLy8gU2V0cyB0aGUgY2hhcnQgdG8gYmUgcmVzcG9uc2l2ZVxuICAgICAgICAgIHJlc3BvbnNpdmU6IHRydWUsXG5cbiAgICAgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIHdlIHNob3VsZCBzaG93IGEgc3Ryb2tlIG9uIGVhY2ggc2VnbWVudFxuICAgICAgICAgIHNlZ21lbnRTaG93U3Ryb2tlIDogdHJ1ZSxcblxuICAgICAgICAgIC8vU3RyaW5nIC0gVGhlIGNvbG91ciBvZiBlYWNoIHNlZ21lbnQgc3Ryb2tlXG4gICAgICAgICAgc2VnbWVudFN0cm9rZUNvbG9yIDogJyNmZmYnLFxuXG4gICAgICAgICAgLy9OdW1iZXIgLSBUaGUgd2lkdGggb2YgZWFjaCBzZWdtZW50IHN0cm9rZVxuICAgICAgICAgIHNlZ21lbnRTdHJva2VXaWR0aCA6IDIsXG5cbiAgICAgICAgICAvL051bWJlciAtIFRoZSBwZXJjZW50YWdlIG9mIHRoZSBjaGFydCB0aGF0IHdlIGN1dCBvdXQgb2YgdGhlIG1pZGRsZVxuICAgICAgICAgIHBlcmNlbnRhZ2VJbm5lckN1dG91dCA6IDAsIC8vIFRoaXMgaXMgMCBmb3IgUGllIGNoYXJ0c1xuXG4gICAgICAgICAgLy9OdW1iZXIgLSBBbW91bnQgb2YgYW5pbWF0aW9uIHN0ZXBzXG4gICAgICAgICAgYW5pbWF0aW9uU3RlcHMgOiAxMDAsXG5cbiAgICAgICAgICAvL1N0cmluZyAtIEFuaW1hdGlvbiBlYXNpbmcgZWZmZWN0XG4gICAgICAgICAgYW5pbWF0aW9uRWFzaW5nIDogJ2Vhc2VPdXRCb3VuY2UnLFxuXG4gICAgICAgICAgLy9Cb29sZWFuIC0gV2hldGhlciB3ZSBhbmltYXRlIHRoZSByb3RhdGlvbiBvZiB0aGUgRG91Z2hudXRcbiAgICAgICAgICBhbmltYXRlUm90YXRlIDogdHJ1ZSxcblxuICAgICAgICAgIC8vQm9vbGVhbiAtIFdoZXRoZXIgd2UgYW5pbWF0ZSBzY2FsaW5nIHRoZSBEb3VnaG51dCBmcm9tIHRoZSBjZW50cmVcbiAgICAgICAgICBhbmltYXRlU2NhbGUgOiBmYWxzZSxcblxuICAgICAgICAgIC8vU3RyaW5nIC0gQSBsZWdlbmQgdGVtcGxhdGVcbiAgICAgICAgICBsZWdlbmRUZW1wbGF0ZSA6ICc8dWwgY2xhc3M9XCJ0Yy1jaGFydC1qcy1sZWdlbmRcIj48JSBmb3IgKHZhciBpPTA7IGk8c2VnbWVudHMubGVuZ3RoOyBpKyspeyU+PGxpPjxzcGFuIHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjo8JT1zZWdtZW50c1tpXS5maWxsQ29sb3IlPlwiPjwvc3Bhbj48JWlmKHNlZ21lbnRzW2ldLmxhYmVsKXslPjwlPXNlZ21lbnRzW2ldLmxhYmVsJT48JX0lPjwvbGk+PCV9JT48L3VsPidcblxuICAgICAgICB9O1xuICAgICAgfVxuXG5cbiAgICB9KVxuIiwiYW5ndWxhci5tb2R1bGUoJ2FwcCcpXG4gICAgLmNvbnRyb2xsZXIoJ3J1bnNTdGF0c0N0cmwnLCBmdW5jdGlvbigkc2NvcGUpIHtcbiAgICAgICRzY29wZS4kd2F0Y2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgcmV0dXJuICRzY29wZS5ydW5zU3RhdHM7XG4gICAgICAgICAgIH0sIGZ1bmN0aW9uKG4pIHtcbiAgICAgICAgICAgICAgIGlmKCFuKXJldHVyblxuICAgICAgICAgICAgICAgJHNjb3BlLmFuYWx5emVJbm5pbmdzKCRzY29wZS5ydW5zU3RhdHMpXG4gICAgICAgICAgIH0pO1xuXG5cbiAgICAgICRzY29wZS5hbmFseXplSW5uaW5ncyA9IGZ1bmN0aW9uKHJ1bnNTdGF0cyl7XG4gICAgICAgIC8vUnVucyBvdmVyIHRoZSB5ZWFyc1xuICAgICAgICB2YXIgcnVuc0J5WWVhciA9IFtdO1xuICAgICAgICB2YXIgcnVuc0FnYWluc3RUZWFtcyA9IFtdO1xuICAgICAgICB2YXIgZmlyc3RJbm5pbmdzID0gMDtcbiAgICAgICAgdmFyIHNlY29uZElubmluZ3MgPSAwO1xuICAgICAgICB2YXIgcnVuc0ZpcnN0SW5uaW5ncyA9IDA7XG4gICAgICAgIHZhciBydW5zU2Vjb25kSW5uaW5ncyA9IDA7XG4gICAgICAgIHJ1bnNTdGF0cy5hbGxJbm5pbmdzLm1hcChmdW5jdGlvbihyZXMpe1xuICAgICAgICAgIC8vY2FsY3VsYXRlIG51bWJlciBvZiBmaXJzdCBpbm5pbmdzIGFuZCBzZWNvbmQgaW5uaW5ncyBwbGF5ZWQgYW5kIHJ1biBzY29yZWQgaW4gdGhlbVxuICAgICAgICAgIGlmKHJlcy5pbm5pbmdzID09IFwiMXN0XCIpe1xuICAgICAgICAgICAgZmlyc3RJbm5pbmdzKys7XG4gICAgICAgICAgICBydW5zRmlyc3RJbm5pbmdzICs9IHJlcy5ydW5zO1xuICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgc2Vjb25kSW5uaW5ncysrO1xuICAgICAgICAgICAgcnVuc1NlY29uZElubmluZ3MgKz0gcmVzLnJ1bnM7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy9nZXQgcnVucyBvbiB5ZWFybHkgYmFzaXNcbiAgICAgICAgICB2YXIgeWVhciA9IHJlcy55ZWFyO1xuICAgICAgICAgIHZhciB0ZWFtID0gcmVzLmFnYWluc3Q7XG4gICAgICAgICAgaWYodHlwZW9mKHJ1bnNCeVllYXJbeWVhcl0pID09IFwidW5kZWZpbmVkXCIpe1xuICAgICAgICAgICAgICBydW5zQnlZZWFyW3llYXJdID0gW11cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYodHlwZW9mKHJ1bnNCeVllYXJbeWVhcl0pID09IFwibnVtYmVyXCIpe1xuICAgICAgICAgICAgICBydW5zQnlZZWFyW3llYXJdICs9IHBhcnNlSW50KHJlcy5ydW5zKVxuICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgcnVuc0J5WWVhclt5ZWFyXSA9IHBhcnNlSW50KHJlcy5ydW5zKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vZ2V0IHJ1bnMgYWdhaW5zdCB0ZWFtc1xuICAgICAgICAgIGlmKHR5cGVvZihydW5zQWdhaW5zdFRlYW1zW3RlYW1dKSA9PSBcInVuZGVmaW5lZFwiKXtcbiAgICAgICAgICAgICAgcnVuc0FnYWluc3RUZWFtc1t0ZWFtXSA9IFtdXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmKHR5cGVvZihydW5zQWdhaW5zdFRlYW1zW3RlYW1dKSA9PSBcIm51bWJlclwiKXtcbiAgICAgICAgICAgICAgcmV0dXJuIHJ1bnNBZ2FpbnN0VGVhbXNbdGVhbV0gKz0gcGFyc2VJbnQocmVzLnJ1bnMpXG4gICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICByZXR1cm4gcnVuc0FnYWluc3RUZWFtc1t0ZWFtXSA9IHBhcnNlSW50KHJlcy5ydW5zKVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgJHNjb3BlLnByZXBhcmVSdW5zQnlZZWFyR3JhcGgocnVuc0J5WWVhcilcbiAgICAgICAgJHNjb3BlLnByZXBhcmVSdW5zQnlUZWFtR3JhcGgocnVuc0FnYWluc3RUZWFtcylcbiAgICAgICAgJHNjb3BlLnByZXBhcmVSdW5zQnlJbm5pbmdzR3JhcGgocnVuc0ZpcnN0SW5uaW5ncywgcnVuc1NlY29uZElubmluZ3MpXG4gICAgICAgICRzY29wZS5wcmVwYXJlQXZlcmFnZUJ5SW5uaW5nc0dyYXBoKHJ1bnNGaXJzdElubmluZ3MsZmlyc3RJbm5pbmdzLHJ1bnNTdGF0cy5maXJzdElubmluZ3NOb3RvdXRzLHJ1bnNTZWNvbmRJbm5pbmdzLCBzZWNvbmRJbm5pbmdzLHJ1bnNTdGF0cy5zZWNvbmRJbm5pbmdzTm90b3V0cylcblxuICAgICAgfVxuXG5cbiAgICAgICRzY29wZS5wcmVwYXJlUnVuc0J5WWVhckdyYXBoID0gZnVuY3Rpb24gKHJ1bnNCeVllYXIpe1xuICAgICAgICB2YXIgeWVhcnMgPSBbXVxuICAgICAgICB2YXIgcnVucyA9IFtdXG4gICAgICAgIGZvcih2YXIgeWVhciBpbiBydW5zQnlZZWFyKSB7XG4gICAgICAgICAgaWYocnVuc0J5WWVhci5oYXNPd25Qcm9wZXJ0eSh5ZWFyKSkge1xuICAgICAgICAgICAgeWVhcnMucHVzaCh5ZWFyKTtcbiAgICAgICAgICAgIHJ1bnMucHVzaChydW5zQnlZZWFyW3llYXJdKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgY29sb3JzID0gW107XG4gICAgICAgIHJ1bnMubWFwKGZ1bmN0aW9uKHJlcywga2V5KXtcbiAgICAgICAgICBpZihyZXMgPj0gMTAwMCl7XG4gICAgICAgICAgICByZXR1cm4gY29sb3JzW2tleV0gPSBcInllbGxvd1wiXG4gICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICByZXR1cm4gY29sb3JzW2tleV0gPSBcImJsdWVcIlxuICAgICAgICAgIH1cbiAgICAgICAgfSlcblxuICAgICAgICAkc2NvcGUueWVhckJhcmRhdGEgPSB7XG4gICAgICAgICAgICAgICBsYWJlbHM6IHllYXJzLFxuICAgICAgICAgICAgICAgZGF0YXNldHM6IFt7XG4gICAgICAgICAgICAgICAgICAgbGFiZWw6ICdSdW5zIE92ZXIgdGhlIHllYXJzJyxcbiAgICAgICAgICAgICAgICAgICBmaWxsQ29sb3I6IGNvbG9ycyxcbiAgICAgICAgICAgICAgICAgICBzdHJva2VDb2xvcjogJ3JnYmEoMjIwLDIyMCwyMjAsMSknLFxuICAgICAgICAgICAgICAgICAgIHBvaW50Q29sb3I6ICdyZ2JhKDIyMCwyMjAsMjIwLDEpJyxcbiAgICAgICAgICAgICAgICAgICBwb2ludFN0cm9rZUNvbG9yOiAnI2ZmZicsXG4gICAgICAgICAgICAgICAgICAgcG9pbnRIaWdobGlnaHRGaWxsOiAnI2ZmZicsXG4gICAgICAgICAgICAgICAgICAgcG9pbnRIaWdobGlnaHRTdHJva2U6ICdyZ2JhKDIyMCwyMjAsMjIwLDEpJyxcbiAgICAgICAgICAgICAgICAgICBkYXRhOiBydW5zXG4gICAgICAgICAgICAgICB9XVxuICAgICAgICAgICB9O1xuXG4gICAgICAgICAgIC8vIENoYXJ0LmpzIE9wdGlvbnNcbiAgICAgICAgICAgJHNjb3BlLnllYXJCYXJvcHRpb25zID0ge1xuXG4gICAgICAgICAgICAgICAvLyBTZXRzIHRoZSBjaGFydCB0byBiZSByZXNwb25zaXZlXG4gICAgICAgICAgICAgICByZXNwb25zaXZlOiB0cnVlLFxuXG4gICAgICAgICAgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIHRoZSBzY2FsZSBzaG91bGQgc3RhcnQgYXQgemVybywgb3IgYW4gb3JkZXIgb2YgbWFnbml0dWRlIGRvd24gZnJvbSB0aGUgbG93ZXN0IHZhbHVlXG4gICAgICAgICAgICAgICBzY2FsZUJlZ2luQXRaZXJvOiB0cnVlLFxuXG4gICAgICAgICAgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIGdyaWQgbGluZXMgYXJlIHNob3duIGFjcm9zcyB0aGUgY2hhcnRcbiAgICAgICAgICAgICAgIHNjYWxlU2hvd0dyaWRMaW5lczogdHJ1ZSxcblxuICAgICAgICAgICAgICAgLy9TdHJpbmcgLSBDb2xvdXIgb2YgdGhlIGdyaWQgbGluZXNcbiAgICAgICAgICAgICAgIHNjYWxlR3JpZExpbmVDb2xvcjogXCJyZ2JhKDAsMCwwLC4wNSlcIixcblxuICAgICAgICAgICAgICAgLy9OdW1iZXIgLSBXaWR0aCBvZiB0aGUgZ3JpZCBsaW5lc1xuICAgICAgICAgICAgICAgc2NhbGVHcmlkTGluZVdpZHRoOiAxLFxuXG4gICAgICAgICAgICAgICAvL0Jvb2xlYW4gLSBJZiB0aGVyZSBpcyBhIHN0cm9rZSBvbiBlYWNoIGJhclxuICAgICAgICAgICAgICAgYmFyU2hvd1N0cm9rZTogdHJ1ZSxcblxuICAgICAgICAgICAgICAgLy9OdW1iZXIgLSBQaXhlbCB3aWR0aCBvZiB0aGUgYmFyIHN0cm9rZVxuICAgICAgICAgICAgICAgYmFyU3Ryb2tlV2lkdGg6IDIsXG5cbiAgICAgICAgICAgICAgIC8vTnVtYmVyIC0gU3BhY2luZyBiZXR3ZWVuIGVhY2ggb2YgdGhlIFggdmFsdWUgc2V0c1xuICAgICAgICAgICAgICAgYmFyVmFsdWVTcGFjaW5nOiA1LFxuXG4gICAgICAgICAgICAgICAvL051bWJlciAtIFNwYWNpbmcgYmV0d2VlbiBkYXRhIHNldHMgd2l0aGluIFggdmFsdWVzXG4gICAgICAgICAgICAgICBiYXJEYXRhc2V0U3BhY2luZzogMSxcblxuICAgICAgICAgICAgICAgLy9TdHJpbmcgLSBBIGxlZ2VuZCB0ZW1wbGF0ZVxuICAgICAgICAgICAgICAgbGVnZW5kVGVtcGxhdGU6ICc8dWwgY2xhc3M9XCJ0Yy1jaGFydC1qcy1sZWdlbmRcIj48JSBmb3IgKHZhciBpPTA7IGk8ZGF0YXNldHMubGVuZ3RoOyBpKyspeyU+PGxpPjxzcGFuIHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjo8JT1kYXRhc2V0c1tpXS5maWxsQ29sb3IlPlwiPjwvc3Bhbj48JWlmKGRhdGFzZXRzW2ldLmxhYmVsKXslPjwlPWRhdGFzZXRzW2ldLmxhYmVsJT48JX0lPjwvbGk+PCV9JT48L3VsPidcbiAgICAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgICRzY29wZS5wcmVwYXJlUnVuc0J5VGVhbUdyYXBoID0gZnVuY3Rpb24gKHJ1bnNBZ2FpbnN0VGVhbXMpe1xuICAgICAgICB2YXIgdGVhbXMgPSBbXVxuICAgICAgICB2YXIgcnVucyA9IFtdXG4gICAgICAgIGZvcih2YXIgdGVhbSBpbiBydW5zQWdhaW5zdFRlYW1zKSB7XG4gICAgICAgICAgaWYocnVuc0FnYWluc3RUZWFtcy5oYXNPd25Qcm9wZXJ0eSh0ZWFtKSkge1xuICAgICAgICAgICAgdGVhbXMucHVzaCh0ZWFtKTtcbiAgICAgICAgICAgIHJ1bnMucHVzaChydW5zQWdhaW5zdFRlYW1zW3RlYW1dKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAkc2NvcGUudGVhbUJhcmRhdGEgPSB7XG4gICAgICAgICAgICAgICBsYWJlbHM6IHRlYW1zLFxuICAgICAgICAgICAgICAgZGF0YXNldHM6IFt7XG4gICAgICAgICAgICAgICAgICAgbGFiZWw6ICdSdW5zIE92ZXIgdGhlIHllYXJzJyxcbiAgICAgICAgICAgICAgICAgICBmaWxsQ29sb3I6IFsnYmx1ZSddLFxuICAgICAgICAgICAgICAgICAgIHN0cm9rZUNvbG9yOiAncmdiYSgyMjAsMjIwLDIyMCwxKScsXG4gICAgICAgICAgICAgICAgICAgcG9pbnRDb2xvcjogJ3JnYmEoMjIwLDIyMCwyMjAsMSknLFxuICAgICAgICAgICAgICAgICAgIHBvaW50U3Ryb2tlQ29sb3I6ICcjZmZmJyxcbiAgICAgICAgICAgICAgICAgICBwb2ludEhpZ2hsaWdodEZpbGw6ICcjZmZmJyxcbiAgICAgICAgICAgICAgICAgICBwb2ludEhpZ2hsaWdodFN0cm9rZTogJ3JnYmEoMjIwLDIyMCwyMjAsMSknLFxuICAgICAgICAgICAgICAgICAgIGRhdGE6IHJ1bnNcbiAgICAgICAgICAgICAgIH1dXG4gICAgICAgICAgIH07XG5cbiAgICAgICAgICAgLy8gQ2hhcnQuanMgT3B0aW9uc1xuICAgICAgICAgICAkc2NvcGUudGVhbUJhcm9wdGlvbnMgPSB7XG5cbiAgICAgICAgICAgICAgIC8vIFNldHMgdGhlIGNoYXJ0IHRvIGJlIHJlc3BvbnNpdmVcbiAgICAgICAgICAgICAgIHJlc3BvbnNpdmU6IHRydWUsXG5cbiAgICAgICAgICAgICAgIC8vQm9vbGVhbiAtIFdoZXRoZXIgdGhlIHNjYWxlIHNob3VsZCBzdGFydCBhdCB6ZXJvLCBvciBhbiBvcmRlciBvZiBtYWduaXR1ZGUgZG93biBmcm9tIHRoZSBsb3dlc3QgdmFsdWVcbiAgICAgICAgICAgICAgIHNjYWxlQmVnaW5BdFplcm86IHRydWUsXG5cbiAgICAgICAgICAgICAgIC8vQm9vbGVhbiAtIFdoZXRoZXIgZ3JpZCBsaW5lcyBhcmUgc2hvd24gYWNyb3NzIHRoZSBjaGFydFxuICAgICAgICAgICAgICAgc2NhbGVTaG93R3JpZExpbmVzOiB0cnVlLFxuXG4gICAgICAgICAgICAgICAvL1N0cmluZyAtIENvbG91ciBvZiB0aGUgZ3JpZCBsaW5lc1xuICAgICAgICAgICAgICAgc2NhbGVHcmlkTGluZUNvbG9yOiBcInJnYmEoMCwwLDAsLjA1KVwiLFxuXG4gICAgICAgICAgICAgICAvL051bWJlciAtIFdpZHRoIG9mIHRoZSBncmlkIGxpbmVzXG4gICAgICAgICAgICAgICBzY2FsZUdyaWRMaW5lV2lkdGg6IDEsXG5cbiAgICAgICAgICAgICAgIC8vQm9vbGVhbiAtIElmIHRoZXJlIGlzIGEgc3Ryb2tlIG9uIGVhY2ggYmFyXG4gICAgICAgICAgICAgICBiYXJTaG93U3Ryb2tlOiB0cnVlLFxuXG4gICAgICAgICAgICAgICAvL051bWJlciAtIFBpeGVsIHdpZHRoIG9mIHRoZSBiYXIgc3Ryb2tlXG4gICAgICAgICAgICAgICBiYXJTdHJva2VXaWR0aDogMixcblxuICAgICAgICAgICAgICAgLy9OdW1iZXIgLSBTcGFjaW5nIGJldHdlZW4gZWFjaCBvZiB0aGUgWCB2YWx1ZSBzZXRzXG4gICAgICAgICAgICAgICBiYXJWYWx1ZVNwYWNpbmc6IDUsXG5cbiAgICAgICAgICAgICAgIC8vTnVtYmVyIC0gU3BhY2luZyBiZXR3ZWVuIGRhdGEgc2V0cyB3aXRoaW4gWCB2YWx1ZXNcbiAgICAgICAgICAgICAgIGJhckRhdGFzZXRTcGFjaW5nOiAxLFxuXG4gICAgICAgICAgICAgICAvL1N0cmluZyAtIEEgbGVnZW5kIHRlbXBsYXRlXG4gICAgICAgICAgICAgICBsZWdlbmRUZW1wbGF0ZTogJzx1bCBjbGFzcz1cInRjLWNoYXJ0LWpzLWxlZ2VuZFwiPjwlIGZvciAodmFyIGk9MDsgaTxkYXRhc2V0cy5sZW5ndGg7IGkrKyl7JT48bGk+PHNwYW4gc3R5bGU9XCJiYWNrZ3JvdW5kLWNvbG9yOjwlPWRhdGFzZXRzW2ldLmZpbGxDb2xvciU+XCI+PC9zcGFuPjwlaWYoZGF0YXNldHNbaV0ubGFiZWwpeyU+PCU9ZGF0YXNldHNbaV0ubGFiZWwlPjwlfSU+PC9saT48JX0lPjwvdWw+J1xuICAgICAgICAgICB9O1xuICAgICAgfVxuICAgICAgJHNjb3BlLnByZXBhcmVSdW5zQnlJbm5pbmdzR3JhcGggPSBmdW5jdGlvbihmaXJzdElubmluZ3MsIHNlY29uZElubmluZ3Mpe1xuICAgICAgICAkc2NvcGUuaW5uaW5pbmdzUnVuc3Jlc291cmNlcyA9IFt7XG4gICAgICAgICAgICAgICB2YWx1ZTogZmlyc3RJbm5pbmdzLFxuICAgICAgICAgICAgICAgY29sb3I6ICcjRkZGRjAwJyxcbiAgICAgICAgICAgICAgIGhpZ2hsaWdodDogJyNlNWU1MDAnLFxuICAgICAgICAgICAgICAgbGFiZWw6ICdGaXJzdCBJbm5pbmdzJ1xuICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICB2YWx1ZTogc2Vjb25kSW5uaW5ncyxcbiAgICAgICAgICAgICAgIGNvbG9yOiAnIzQ2QkZCRCcsXG4gICAgICAgICAgICAgICBoaWdobGlnaHQ6ICcjNUFEM0QxJyxcbiAgICAgICAgICAgICAgIGxhYmVsOiAnU2Vjb25kIElubmluZ3MnXG4gICAgICAgICAgIH1dO1xuXG4gICAgICAgICAgIC8vIENoYXJ0LmpzIE9wdGlvbnNcbiAgICAgICAgICAgJHNjb3BlLmlubmluaW5nc1J1bnNvcHRpb25zID0ge1xuXG4gICAgICAgICAgICAgICAvLyBTZXRzIHRoZSBjaGFydCB0byBiZSByZXNwb25zaXZlXG4gICAgICAgICAgICAgICByZXNwb25zaXZlOiB0cnVlLFxuXG4gICAgICAgICAgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIHdlIHNob3VsZCBzaG93IGEgc3Ryb2tlIG9uIGVhY2ggc2VnbWVudFxuICAgICAgICAgICAgICAgc2VnbWVudFNob3dTdHJva2U6IHRydWUsXG5cbiAgICAgICAgICAgICAgIC8vU3RyaW5nIC0gVGhlIGNvbG91ciBvZiBlYWNoIHNlZ21lbnQgc3Ryb2tlXG4gICAgICAgICAgICAgICBzZWdtZW50U3Ryb2tlQ29sb3I6ICcjZmZmJyxcblxuICAgICAgICAgICAgICAgLy9OdW1iZXIgLSBUaGUgd2lkdGggb2YgZWFjaCBzZWdtZW50IHN0cm9rZVxuICAgICAgICAgICAgICAgc2VnbWVudFN0cm9rZVdpZHRoOiAyLFxuXG4gICAgICAgICAgICAgICAvL051bWJlciAtIFRoZSBwZXJjZW50YWdlIG9mIHRoZSBjaGFydCB0aGF0IHdlIGN1dCBvdXQgb2YgdGhlIG1pZGRsZVxuICAgICAgICAgICAgICAgcGVyY2VudGFnZUlubmVyQ3V0b3V0OiA1MCwgLy8gVGhpcyBpcyAwIGZvciBQaWUgY2hhcnRzXG5cbiAgICAgICAgICAgICAgIC8vTnVtYmVyIC0gQW1vdW50IG9mIGFuaW1hdGlvbiBzdGVwc1xuICAgICAgICAgICAgICAgYW5pbWF0aW9uU3RlcHM6IDEwMCxcblxuICAgICAgICAgICAgICAgLy9TdHJpbmcgLSBBbmltYXRpb24gZWFzaW5nIGVmZmVjdFxuICAgICAgICAgICAgICAgYW5pbWF0aW9uRWFzaW5nOiAnZWFzZU91dEJvdW5jZScsXG5cbiAgICAgICAgICAgICAgIC8vQm9vbGVhbiAtIFdoZXRoZXIgd2UgYW5pbWF0ZSB0aGUgcm90YXRpb24gb2YgdGhlIERvdWdobnV0XG4gICAgICAgICAgICAgICBhbmltYXRlUm90YXRlOiB0cnVlLFxuXG4gICAgICAgICAgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIHdlIGFuaW1hdGUgc2NhbGluZyB0aGUgRG91Z2hudXQgZnJvbSB0aGUgY2VudHJlXG4gICAgICAgICAgICAgICBhbmltYXRlU2NhbGU6IGZhbHNlLFxuXG4gICAgICAgICAgICAgICAvL1N0cmluZyAtIEEgbGVnZW5kIHRlbXBsYXRlXG4gICAgICAgICAgICAgICBsZWdlbmRUZW1wbGF0ZTogJzx1bCBjbGFzcz1cInRjLWNoYXJ0LWpzLWxlZ2VuZFwiPjwlIGZvciAodmFyIGk9MDsgaTxzZWdtZW50cy5sZW5ndGg7IGkrKyl7JT48bGk+PHNwYW4gc3R5bGU9XCJiYWNrZ3JvdW5kLWNvbG9yOjwlPXNlZ21lbnRzW2ldLmZpbGxDb2xvciU+XCI+PC9zcGFuPjwlaWYoc2VnbWVudHNbaV0ubGFiZWwpeyU+PCU9c2VnbWVudHNbaV0ubGFiZWwlPjwlfSU+PC9saT48JX0lPjwvdWw+J1xuXG4gICAgICAgICAgIH07XG5cbiAgICAgIH1cblxuICAgICAgJHNjb3BlLnByZXBhcmVBdmVyYWdlQnlJbm5pbmdzR3JhcGggPSBmdW5jdGlvbihydW5zRmlyc3RJbm5pbmdzLGZpcnN0SW5uaW5ncyxmaXJzdElubmluZ3NOb3RvdXRzLHJ1bnNTZWNvbmRJbm5pbmdzLCBzZWNvbmRJbm5pbmdzLHNlY29uZElubmluZ3NOb3RvdXRzKXtcbiAgICAgICAgdmFyIGZpcnN0SW5uaW5nc0F2ZXJhZ2UgPSBydW5zRmlyc3RJbm5pbmdzIC8gKGZpcnN0SW5uaW5ncyAtIGZpcnN0SW5uaW5nc05vdG91dHMpO1xuICAgICAgICB2YXIgc2Vjb25kSW5uaW5nc0F2ZXJhZ2UgPSBydW5zU2Vjb25kSW5uaW5ncyAvIChzZWNvbmRJbm5pbmdzIC0gc2Vjb25kSW5uaW5nc05vdG91dHMpO1xuXG4gICAgICAgICRzY29wZS5hdmVyYWdlRGF0YSA9IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICB2YWx1ZTogZmlyc3RJbm5pbmdzQXZlcmFnZS50b0ZpeGVkKDIpLFxuICAgICAgICAgICAgY29sb3I6JyNGNzQ2NEEnLFxuICAgICAgICAgICAgaGlnaGxpZ2h0OiAnI0ZGNUE1RScsXG4gICAgICAgICAgICBsYWJlbDogJ0F2ZXJhZ2UgaW4gRmlyc3QgSW5uaW5ncydcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHZhbHVlOiBzZWNvbmRJbm5pbmdzQXZlcmFnZS50b0ZpeGVkKDIpLFxuICAgICAgICAgICAgY29sb3I6ICcjRkRCNDVDJyxcbiAgICAgICAgICAgIGhpZ2hsaWdodDogJyNGRkM4NzAnLFxuICAgICAgICAgICAgbGFiZWw6ICdBdmVyYWdlIGluIFNlY29uZCBJbm5pbmdzJ1xuICAgICAgICAgIH1cbiAgICAgICAgXTtcblxuICAgICAgICAvLyBDaGFydC5qcyBPcHRpb25zXG4gICAgICAgICRzY29wZS5hdmVyYWdlT3B0aW9ucyA9ICB7XG5cbiAgICAgICAgICAvLyBTZXRzIHRoZSBjaGFydCB0byBiZSByZXNwb25zaXZlXG4gICAgICAgICAgcmVzcG9uc2l2ZTogdHJ1ZSxcblxuICAgICAgICAgIC8vQm9vbGVhbiAtIFdoZXRoZXIgd2Ugc2hvdWxkIHNob3cgYSBzdHJva2Ugb24gZWFjaCBzZWdtZW50XG4gICAgICAgICAgc2VnbWVudFNob3dTdHJva2UgOiB0cnVlLFxuXG4gICAgICAgICAgLy9TdHJpbmcgLSBUaGUgY29sb3VyIG9mIGVhY2ggc2VnbWVudCBzdHJva2VcbiAgICAgICAgICBzZWdtZW50U3Ryb2tlQ29sb3IgOiAnI2ZmZicsXG5cbiAgICAgICAgICAvL051bWJlciAtIFRoZSB3aWR0aCBvZiBlYWNoIHNlZ21lbnQgc3Ryb2tlXG4gICAgICAgICAgc2VnbWVudFN0cm9rZVdpZHRoIDogMixcblxuICAgICAgICAgIC8vTnVtYmVyIC0gVGhlIHBlcmNlbnRhZ2Ugb2YgdGhlIGNoYXJ0IHRoYXQgd2UgY3V0IG91dCBvZiB0aGUgbWlkZGxlXG4gICAgICAgICAgcGVyY2VudGFnZUlubmVyQ3V0b3V0IDogMCwgLy8gVGhpcyBpcyAwIGZvciBQaWUgY2hhcnRzXG5cbiAgICAgICAgICAvL051bWJlciAtIEFtb3VudCBvZiBhbmltYXRpb24gc3RlcHNcbiAgICAgICAgICBhbmltYXRpb25TdGVwcyA6IDEwMCxcblxuICAgICAgICAgIC8vU3RyaW5nIC0gQW5pbWF0aW9uIGVhc2luZyBlZmZlY3RcbiAgICAgICAgICBhbmltYXRpb25FYXNpbmcgOiAnZWFzZU91dEJvdW5jZScsXG5cbiAgICAgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIHdlIGFuaW1hdGUgdGhlIHJvdGF0aW9uIG9mIHRoZSBEb3VnaG51dFxuICAgICAgICAgIGFuaW1hdGVSb3RhdGUgOiB0cnVlLFxuXG4gICAgICAgICAgLy9Cb29sZWFuIC0gV2hldGhlciB3ZSBhbmltYXRlIHNjYWxpbmcgdGhlIERvdWdobnV0IGZyb20gdGhlIGNlbnRyZVxuICAgICAgICAgIGFuaW1hdGVTY2FsZSA6IGZhbHNlLFxuXG4gICAgICAgICAgLy9TdHJpbmcgLSBBIGxlZ2VuZCB0ZW1wbGF0ZVxuICAgICAgICAgIGxlZ2VuZFRlbXBsYXRlIDogJzx1bCBjbGFzcz1cInRjLWNoYXJ0LWpzLWxlZ2VuZFwiPjwlIGZvciAodmFyIGk9MDsgaTxzZWdtZW50cy5sZW5ndGg7IGkrKyl7JT48bGk+PHNwYW4gc3R5bGU9XCJiYWNrZ3JvdW5kLWNvbG9yOjwlPXNlZ21lbnRzW2ldLmZpbGxDb2xvciU+XCI+PC9zcGFuPjwlaWYoc2VnbWVudHNbaV0ubGFiZWwpeyU+PCU9c2VnbWVudHNbaV0ubGFiZWwlPjwlfSU+PC9saT48JX0lPjwvdWw+J1xuXG4gICAgICAgIH07XG4gICAgICB9XG5cblxuXG5cbn0pXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
