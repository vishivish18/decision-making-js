angular.module('app',[
  'ngRoute','ui.router','tc.chartjs'
])

angular.module('app')
    .controller('homeCtrl', ["$scope", "$http", "dataMutator", function($scope, $http, dataMutator) {
        $scope.setup = function() {
          dataMutator.getData()
          .then(function(response) {
                dataMutator.csvToJSON(response.data, function(csv){
                    dataMutator.getCareerStats(csv, function(stats){
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
            angular.forEach(data, function(value) {
              var inningsDetail = {};
              var centuryDetail = {};
              var halfCenturyDetail = {};

              //Batting stats

              //check to see if the score contains a * in the end which dentoes NotOuts, if yes remove for calculations
              if(value.batting_score.indexOf("*") > -1){
                value.batting_score = value.batting_score.replace('*','');
                notOuts++;
              }
              //if the value of score is Not a number , it means it could be DNB(did not bat) or TDNB (team did not bat)
              if(isNaN(value.batting_score)){
                didNotBat++;
              }else{
                //Converting the string to integers to do calculations
                value.batting_score = parseInt(value.batting_score)
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
            allInnings: allInnings
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
            if(centuryByYear.hasOwnProperty(halfCentury)) {
              yearOfhalfCenturies.push(halfCentury);
              numberOfHalfCenturies.push(halfCenturyByYear[halfCentury].length)
            }
          }
          $scope.lineData = {
          labels: yearOfhalfCenturies,
          datasets: [
            {
              label: 'My First dataset',
              fillColor: ['rgba(120,20,220,0.4)'],
              strokeColor: 'rgba(220,220,220,1)',
              pointColor: 'rgba(220,220,220,1)',
              pointStrokeColor: '#fff',
              pointHighlightFill: '#fff',
              pointHighlightStroke: 'rgba(220,220,220,1)',
              data: numberOfHalfCenturies
            },
            {
              label: 'My First dataset',
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


      $scope.analyzeInnings = function(allInnings){
        //Runs over the years
        var runsByYear = [];
        allInnings.map(function(res){
          var year = res.year;
          if(typeof(runsByYear[year]) == "undefined"){
              runsByYear[year] = []
          }
          if(typeof(runsByYear[year]) == "number"){
              return runsByYear[year] += parseInt(res.runs)
          }else{
            return runsByYear[year] = parseInt(res.runs)
          }
        })
        $scope.prepareRunsByYearGraph(runsByYear)

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


}])

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZHVsZS5qcyIsImNvbnRyb2xsZXJzL2hvbWVDdHJsLmpzIiwiY29udHJvbGxlcnMvbWFzdGVyQ3RybC5qcyIsImNvbnRyb2xsZXJzL3JvdXRlcy5qcyIsImRpcmVjdGl2ZXMvY2FyZWVyU3RhdHMuanMiLCJkaXJlY3RpdmVzL2NlbnR1cnlTdGF0cy5qcyIsImRpcmVjdGl2ZXMvcGVyc29uYWxJbmZvLmpzIiwiZGlyZWN0aXZlcy9ydW5zU3RhdHMuanMiLCJzZXJ2aWNlcy9kYXRhTXV0YXRvci5qcyIsImNvbnRyb2xsZXJzL3BhcnRpYWxzL2NlbnR1cnlTdGF0c0N0cmwuanMiLCJjb250cm9sbGVycy9wYXJ0aWFscy9ydW5zU3RhdHNDdHJsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFFBQUEsT0FBQSxNQUFBO0VBQ0EsVUFBQSxZQUFBOzs7QUNEQSxRQUFBLE9BQUE7S0FDQSxXQUFBLCtDQUFBLFNBQUEsUUFBQSxPQUFBLGFBQUE7UUFDQSxPQUFBLFFBQUEsV0FBQTtVQUNBLFlBQUE7V0FDQSxLQUFBLFNBQUEsVUFBQTtnQkFDQSxZQUFBLFVBQUEsU0FBQSxNQUFBLFNBQUEsSUFBQTtvQkFDQSxZQUFBLGVBQUEsS0FBQSxTQUFBLE1BQUE7c0JBQ0EsUUFBQSxJQUFBO3NCQUNBLE9BQUEsUUFBQTs7O2FBR0EsU0FBQSxLQUFBO2dCQUNBLFFBQUEsSUFBQTs7O1FBR0EsT0FBQTs7O0FDZkEsUUFBQSxPQUFBO0tBQ0EsV0FBQSx1Q0FBQSxTQUFBLFFBQUEsWUFBQTtRQUNBLFFBQUEsSUFBQTs7O0FDRkEsUUFBQSxPQUFBO0tBQ0EscUVBQUEsU0FBQSxnQkFBQSxvQkFBQSxtQkFBQTs7UUFFQSxtQkFBQSxVQUFBOztRQUVBO2FBQ0EsTUFBQSxPQUFBO2dCQUNBLEtBQUE7Z0JBQ0EsT0FBQTtvQkFDQSxVQUFBO3dCQUNBLGFBQUE7O29CQUVBLFdBQUE7d0JBQ0EsYUFBQTt3QkFDQSxZQUFBOzs7Ozs7O1NBT0EsTUFBQSxZQUFBO1lBQ0EsS0FBQTtZQUNBLE9BQUE7Z0JBQ0EsWUFBQTtvQkFDQSxhQUFBO29CQUNBLFlBQUE7Ozs7Ozs7OztRQVNBLGtCQUFBLFVBQUE7Ozs7QUNuQ0EsUUFBQSxPQUFBO0tBQ0EsVUFBQSxlQUFBLFdBQUE7UUFDQSxNQUFBO1lBQ0EsVUFBQTtZQUNBLE9BQUE7Z0JBQ0EsT0FBQTs7WUFFQSxhQUFBOzs7OztBQ1BBLFFBQUEsT0FBQTtLQUNBLFVBQUEsZ0JBQUEsV0FBQTtRQUNBLE1BQUE7WUFDQSxVQUFBO1lBQ0EsT0FBQTtnQkFDQSxjQUFBOztZQUVBLGFBQUE7WUFDQSxZQUFBOzs7O0FDUkEsUUFBQSxPQUFBO0tBQ0EsVUFBQSxnQkFBQSxXQUFBO1FBQ0EsTUFBQTtZQUNBLFVBQUE7WUFDQSxhQUFBOzs7O0FDSkEsUUFBQSxPQUFBO0tBQ0EsVUFBQSxhQUFBLFdBQUE7UUFDQSxNQUFBO1lBQ0EsVUFBQTtZQUNBLE9BQUE7Z0JBQ0EsV0FBQTs7WUFFQSxhQUFBO1lBQ0EsWUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNvQkEsUUFBQSxPQUFBO0tBQ0EsUUFBQSx5QkFBQSxTQUFBLE9BQUE7UUFDQSxNQUFBO1lBQ0EsU0FBQTtZQUNBLFdBQUE7WUFDQSxnQkFBQTs7OztRQUlBLFNBQUEsVUFBQTtZQUNBLE9BQUEsTUFBQSxJQUFBOzs7UUFHQSxTQUFBLFVBQUEsS0FBQSxVQUFBO1lBQ0EsSUFBQSxNQUFBLElBQUEsTUFBQTtZQUNBLElBQUEsU0FBQTtZQUNBLElBQUEsUUFBQSxNQUFBLEdBQUEsTUFBQTtZQUNBLElBQUEsSUFBQSxFQUFBLEVBQUEsRUFBQSxNQUFBLFFBQUEsRUFBQSxJQUFBO2dCQUNBLElBQUEsTUFBQTtnQkFDQSxJQUFBLFlBQUEsTUFBQSxHQUFBLE1BQUE7Z0JBQ0EsSUFBQSxJQUFBLEVBQUEsRUFBQSxFQUFBLFFBQUEsT0FBQSxJQUFBO2tCQUNBLElBQUEsUUFBQSxNQUFBLFlBQUE7O2dCQUVBLE9BQUEsS0FBQTs7WUFFQSxRQUFBLElBQUE7WUFDQSxHQUFBLGFBQUEsT0FB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QUFBOzs7ZUFHQSxlQUFBOzs7ZUFHQSxnQkFBQTs7O2VBR0EsaUJBQUE7OztlQUdBLG1CQUFBOzs7ZUFHQSxnQkFBQTs7Ozs7O0FBTUEiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiYW5ndWxhci5tb2R1bGUoJ2FwcCcsW1xuICAnbmdSb3V0ZScsJ3VpLnJvdXRlcicsJ3RjLmNoYXJ0anMnXG5dKVxuIiwiYW5ndWxhci5tb2R1bGUoJ2FwcCcpXG4gICAgLmNvbnRyb2xsZXIoJ2hvbWVDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCAkaHR0cCwgZGF0YU11dGF0b3IpIHtcbiAgICAgICAgJHNjb3BlLnNldHVwID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgZGF0YU11dGF0b3IuZ2V0RGF0YSgpXG4gICAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBkYXRhTXV0YXRvci5jc3ZUb0pTT04ocmVzcG9uc2UuZGF0YSwgZnVuY3Rpb24oY3N2KXtcbiAgICAgICAgICAgICAgICAgICAgZGF0YU11dGF0b3IuZ2V0Q2FyZWVyU3RhdHMoY3N2LCBmdW5jdGlvbihzdGF0cyl7XG4gICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coc3RhdHMpXG4gICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnN0YXRzID0gc3RhdHNcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgIH0sIGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycilcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICAkc2NvcGUuc2V0dXAoKTsgICAgICAgIFxuICAgIH0pXG4iLCJhbmd1bGFyLm1vZHVsZSgnYXBwJylcbiAgICAuY29udHJvbGxlcignbWFzdGVyQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJHJvb3RTY29wZSkge1xuICAgICAgICBjb25zb2xlLmxvZyhcIm1hc3RlckN0cmxcIik7XG4gICAgfSlcbiIsImFuZ3VsYXIubW9kdWxlKCdhcHAnKVxuICAgIC5jb25maWcoZnVuY3Rpb24oJHN0YXRlUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIpIHtcblxuICAgICAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvJyk7XG5cbiAgICAgICAgJHN0YXRlUHJvdmlkZXJcbiAgICAgICAgICAgIC5zdGF0ZSgnYXBwJywge1xuICAgICAgICAgICAgICAgIHVybDogJy8nLFxuICAgICAgICAgICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAgICAgICAgICdoZWFkZXInOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy9uYXYuaHRtbCcsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICdjb250ZW50Jzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvaG9tZS5odG1sJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdob21lQ3RybCdcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG5cblxuXG4gICAgICAgIC5zdGF0ZSgnYXBwLmhvbWUnLCB7XG4gICAgICAgICAgICB1cmw6ICdob21lJyxcbiAgICAgICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAgICAgJ2NvbnRlbnRAJzoge1xuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3VzZXJzL2hvbWUuaHRtbCcsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdob21lQ3RybCdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSlcblxuXG5cblxuICAgICAgICAkbG9jYXRpb25Qcm92aWRlci5odG1sNU1vZGUodHJ1ZSlcblxuICAgIH0pO1xuIiwiYW5ndWxhci5tb2R1bGUoJ2FwcCcpXG4gICAgLmRpcmVjdGl2ZSgnY2FyZWVyU3RhdHMnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJue1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgc3RhdHM6ICc9aXRlbScsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdwYXJ0aWFscy9jYXJlZXJTdGF0cy5odG1sJ1xuICAgICAgICAgICAgICAgIC8vY29udHJvbGxlcjogJ2FwcC5wYXJ0aWFscy52ZW51ZXMudmVudWVJdGVtQ3RybCdcbiAgICAgICAgfVxuICAgIH0pXG4iLCJhbmd1bGFyLm1vZHVsZSgnYXBwJylcbiAgICAuZGlyZWN0aXZlKCdjZW50dXJ5U3RhdHMnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJue1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgY2VudHVyeVN0YXRzOiAnPWl0ZW0nLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAncGFydGlhbHMvY2VudHVyeVN0YXRzLmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ2NlbnR1cnlTdGF0c0N0cmwnXG4gICAgICAgIH1cbiAgICB9KVxuIiwiYW5ndWxhci5tb2R1bGUoJ2FwcCcpXG4gICAgLmRpcmVjdGl2ZSgncGVyc29uYWxJbmZvJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybntcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsICAgICAgICAgICAgXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3BhcnRpYWxzL3BlcnNvbmFsSW5mby5odG1sJ1xuICAgICAgICB9XG4gICAgfSlcbiIsImFuZ3VsYXIubW9kdWxlKCdhcHAnKVxuICAgIC5kaXJlY3RpdmUoJ3J1bnNTdGF0cycsIGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm57XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHtcbiAgICAgICAgICAgICAgICBydW5zU3RhdHM6ICc9aXRlbScsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdwYXJ0aWFscy9ydW5zU3RhdHMuaHRtbCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiAncnVuc1N0YXRzQ3RybCdcbiAgICAgICAgfVxuICAgIH0pXG4iLCIvL1RoaW5ncyB3ZSBjYW4gZ2V0IGZyb20gdGhlIGRhdGEgOiAtXG4vL1RvdGFsIG1hdGNoZXMgcGxheWVkIC1kb25lXG4vL1RvdGFsIGNlbnR1cmllcyBzY29yZWQgLSBkb25lXG4vL3J1bnMgc2NvcmVkIGluIGEgeWVhclxuLy9jZW50dXJpZXMgc2NvcmVkIGluIGEgeWVhciAtIGRvbmVcbi8vaGFsZiBjZW50dXJpZXMgc2NvcmVkIGluIGEgeWVhciAtIGRvbmVcbi8vaGFsZiBjZW50dXJpZXMgY292ZXJ0ZWQgaW50byBjZW50dXJ5IC0gZG9uZVxuLy9zY29yZSBhZ2FpbnN0IHRoZSB0ZWFtc1xuLy9zY29yZSBpbiB0aGUgd2lubmluZyBjYXVzZSAtIGRvbmVcbi8vYm93bGluZyBmaWd1cmVzLSBkb25lXG4vL3BlcmZvcm1hbmNlIGluIGNsb3NlIG1hdGNoZXNcbi8vYmF0dGluZyBmaXJzdCBwZXJmb3JtYW5jZVxuLy9tb3ZpbmcgYXZlcmFnZSwgbG9uZ2l0dWRhbmFsIGNhcmVlciBncm93dGhcbi8vMTAwMCBSdW5zIGluIG9uZSBjYWxlbmRhciB5ZWFyXG4vL2JhdHRpbmcgc2Vjb25kIHBlcmZvcm1hbmNlICh3aGlsZSBjaGFzaW5nKVxuXG4vL1RPRE86XG4vL0dldCBjZW50dXJpZXMgYnkgY291bnRyeS1kb25lXG4vL0dldCBjZW50dXJpZXMgYnkgeWVhci1kb25lXG4vL0dldCBydW5zIGJ5IGNvdW50cnlcbi8vR2V0IHJ1bnMgYnkgeWVhclxuLy9HZXQgcnVucyBieSB3aW5uaW5nXG4vL0dldCBydW5zIGJ5IGxvb3Npbmdcbi8vR2V0IGNlbnR1cmllcyBpbiB3aW5uaW5nIGNhdXNlLWRvbmVcblxuXG5cbi8vTk9URTogT25jZSBhbGwgZGF0YSBpcyBjb2xsZWN0ZWQgY2xlYW4gb3V0IHRoZSBjYWxsYmFjayBoZWxsIDpQXG5hbmd1bGFyLm1vZHVsZSgnYXBwJylcbiAgICAuc2VydmljZSgnZGF0YU11dGF0b3InLCBmdW5jdGlvbigkaHR0cCkge1xuICAgICAgICByZXR1cm57XG4gICAgICAgICAgICBnZXREYXRhOiBnZXREYXRhLFxuICAgICAgICAgICAgY3N2VG9KU09OOiBjc3ZUb0pTT04sXG4gICAgICAgICAgICBnZXRDYXJlZXJTdGF0czogZ2V0Q2FyZWVyU3RhdHNcblxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZ2V0RGF0YSgpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9kYXRhL3NhY2hpbi5jc3YnKVxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gY3N2VG9KU09OKGNzdiwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHZhciBsaW5lcz1jc3Yuc3BsaXQoXCJcXG5cIik7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgICAgICAgICB2YXIgaGVhZGVycz1saW5lc1swXS5zcGxpdChcIixcIik7XG4gICAgICAgICAgICBmb3IodmFyIGk9MTtpPGxpbmVzLmxlbmd0aCAtMTtpKyspe1xuICAgICAgICAgICAgICAgIHZhciBvYmogPSB7fTtcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudGxpbmU9bGluZXNbaV0uc3BsaXQoXCIsXCIpO1xuICAgICAgICAgICAgICAgIGZvcih2YXIgaj0wO2o8aGVhZGVycy5sZW5ndGg7aisrKXtcbiAgICAgICAgICAgICAgICAgIG9ialtoZWFkZXJzW2pdXSA9IGN1cnJlbnRsaW5lW2pdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChvYmopO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc29sZS5sb2cocmVzdWx0KVxuICAgICAgICAgICAgaWYoY2FsbGJhY2sgJiYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2socmVzdWx0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZ2V0Q2FyZWVyU3RhdHMoZGF0YSwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHZhciB0b3RhbE1hdGNoZXMgPSBkYXRhLmxlbmd0aDtcbiAgICAgICAgICAgIHZhciB0b3RhbFJ1bnMgPSAwO1xuICAgICAgICAgICAgdmFyIGNlbnR1cmllc1Njb3JlZCA9IFtdO1xuICAgICAgICAgICAgdmFyIGhhbGZDZW50dXJpZXNTY29yZWQgPSBbXTtcbiAgICAgICAgICAgIHZhciBhbGxJbm5pbmdzID0gW107XG4gICAgICAgICAgICB2YXIgbm90T3V0cyA9IDA7XG4gICAgICAgICAgICB2YXIgZGlkTm90QmF0ID0gMDtcbiAgICAgICAgICAgIHZhciB3aWNrZXRzVGFrZW4gPSAwO1xuICAgICAgICAgICAgdmFyIHJ1bnNDb25jZWRlZCA9IDA7XG4gICAgICAgICAgICB2YXIgY2F0Y2hlcyA9IDA7XG4gICAgICAgICAgICBhbmd1bGFyLmZvckVhY2goZGF0YSwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgICAgdmFyIGlubmluZ3NEZXRhaWwgPSB7fTtcbiAgICAgICAgICAgICAgdmFyIGNlbnR1cnlEZXRhaWwgPSB7fTtcbiAgICAgICAgICAgICAgdmFyIGhhbGZDZW50dXJ5RGV0YWlsID0ge307XG5cbiAgICAgICAgICAgICAgLy9CYXR0aW5nIHN0YXRzXG5cbiAgICAgICAgICAgICAgLy9jaGVjayB0byBzZWUgaWYgdGhlIHNjb3JlIGNvbnRhaW5zIGEgKiBpbiB0aGUgZW5kIHdoaWNoIGRlbnRvZXMgTm90T3V0cywgaWYgeWVzIHJlbW92ZSBmb3IgY2FsY3VsYXRpb25zXG4gICAgICAgICAgICAgIGlmKHZhbHVlLmJhdHRpbmdfc2NvcmUuaW5kZXhPZihcIipcIikgPiAtMSl7XG4gICAgICAgICAgICAgICAgdmFsdWUuYmF0dGluZ19zY29yZSA9IHZhbHVlLmJhdHRpbmdfc2NvcmUucmVwbGFjZSgnKicsJycpO1xuICAgICAgICAgICAgICAgIG5vdE91dHMrKztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAvL2lmIHRoZSB2YWx1ZSBvZiBzY29yZSBpcyBOb3QgYSBudW1iZXIgLCBpdCBtZWFucyBpdCBjb3VsZCBiZSBETkIoZGlkIG5vdCBiYXQpIG9yIFRETkIgKHRlYW0gZGlkIG5vdCBiYXQpXG4gICAgICAgICAgICAgIGlmKGlzTmFOKHZhbHVlLmJhdHRpbmdfc2NvcmUpKXtcbiAgICAgICAgICAgICAgICBkaWROb3RCYXQrKztcbiAgICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICAgLy9Db252ZXJ0aW5nIHRoZSBzdHJpbmcgdG8gaW50ZWdlcnMgdG8gZG8gY2FsY3VsYXRpb25zXG4gICAgICAgICAgICAgICAgdmFsdWUuYmF0dGluZ19zY29yZSA9IHBhcnNlSW50KHZhbHVlLmJhdHRpbmdfc2NvcmUpXG4gICAgICAgICAgICAgICAgaW5uaW5nc0RldGFpbC5ydW5zID0gdmFsdWUuYmF0dGluZ19zY29yZVxuICAgICAgICAgICAgICAgIGlubmluZ3NEZXRhaWwuYWdhaW5zdCA9IHZhbHVlLm9wcG9zaXRpb25cbiAgICAgICAgICAgICAgICBpbm5pbmdzRGV0YWlsLnJlc3VsdCA9IHZhbHVlLm1hdGNoX3Jlc3VsdFxuICAgICAgICAgICAgICAgIGlubmluZ3NEZXRhaWwuaW5uaW5ncyA9IHZhbHVlLmJhdHRpbmdfaW5uaW5nc1xuICAgICAgICAgICAgICAgIGlubmluZ3NEZXRhaWwueWVhciA9IChuZXcgRGF0ZShEYXRlLnBhcnNlKHZhbHVlLmRhdGUpKSkuZ2V0RnVsbFllYXIoKVxuICAgICAgICAgICAgICAgIGFsbElubmluZ3MucHVzaChpbm5pbmdzRGV0YWlsKVxuICAgICAgICAgICAgICAgIC8vQ2hlY2tpbmcgdG8gc2VlIGlmIHRoZSBzY29yZSB3YXMgYSBoYWxmIGNlbnR1cnkgb3IgY2VudHVyeVxuICAgICAgICAgICAgICAgIGlmKHZhbHVlLmJhdHRpbmdfc2NvcmUgPj0gNTAgJiYgdmFsdWUuYmF0dGluZ19zY29yZSA8IDEwMCl7XG4gICAgICAgICAgICAgICAgICBoYWxmQ2VudHVyeURldGFpbC5ydW5zID0gdmFsdWUuYmF0dGluZ19zY29yZVxuICAgICAgICAgICAgICAgICAgaGFsZkNlbnR1cnlEZXRhaWwuYWdhaW5zdCA9IHZhbHVlLm9wcG9zaXRpb25cbiAgICAgICAgICAgICAgICAgIGhhbGZDZW50dXJ5RGV0YWlsLnJlc3VsdCA9IHZhbHVlLm1hdGNoX3Jlc3VsdFxuICAgICAgICAgICAgICAgICAgaGFsZkNlbnR1cnlEZXRhaWwuaW5uaW5ncyA9IHZhbHVlLmJhdHRpbmdfaW5uaW5nc1xuICAgICAgICAgICAgICAgICAgaGFsZkNlbnR1cnlEZXRhaWwueWVhciA9IChuZXcgRGF0ZShEYXRlLnBhcnNlKHZhbHVlLmRhdGUpKSkuZ2V0RnVsbFllYXIoKVxuICAgICAgICAgICAgICAgICAgaGFsZkNlbnR1cmllc1Njb3JlZC5wdXNoKGhhbGZDZW50dXJ5RGV0YWlsKVxuICAgICAgICAgICAgICAgIH1lbHNlIGlmKHZhbHVlLmJhdHRpbmdfc2NvcmUgPj0gMTAwKXtcbiAgICAgICAgICAgICAgICAgIGNlbnR1cnlEZXRhaWwucnVucyA9IHZhbHVlLmJhdHRpbmdfc2NvcmVcbiAgICAgICAgICAgICAgICAgIGNlbnR1cnlEZXRhaWwuYWdhaW5zdCA9IHZhbHVlLm9wcG9zaXRpb25cbiAgICAgICAgICAgICAgICAgIGNlbnR1cnlEZXRhaWwucmVzdWx0ID0gdmFsdWUubWF0Y2hfcmVzdWx0XG4gICAgICAgICAgICAgICAgICBjZW50dXJ5RGV0YWlsLmlubmluZ3MgPSB2YWx1ZS5iYXR0aW5nX2lubmluZ3NcbiAgICAgICAgICAgICAgICAgIGNlbnR1cnlEZXRhaWwueWVhciA9IChuZXcgRGF0ZShEYXRlLnBhcnNlKHZhbHVlLmRhdGUpKSkuZ2V0RnVsbFllYXIoKVxuICAgICAgICAgICAgICAgICAgY2VudHVyaWVzU2NvcmVkLnB1c2goY2VudHVyeURldGFpbClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy9TYXZpbmcgdG90YWwgcnVuc1xuICAgICAgICAgICAgICAgIHRvdGFsUnVucyArPSB2YWx1ZS5iYXR0aW5nX3Njb3JlO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgLy9Cb3dsaW5nIHN0YXRzXG4gICAgICAgICAgICAgIGlmKCFpc05hTih2YWx1ZS53aWNrZXRzKSAmJiBwYXJzZUludCh2YWx1ZS53aWNrZXRzKSA+IDApe1xuICAgICAgICAgICAgICAgIHZhbHVlLndpY2tldHMgPSBwYXJzZUludCh2YWx1ZS53aWNrZXRzKVxuICAgICAgICAgICAgICAgIHdpY2tldHNUYWtlbiArPSB2YWx1ZS53aWNrZXRzXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYoIWlzTmFOKHZhbHVlLmNhdGNoZXMpICYmIHBhcnNlSW50KHZhbHVlLmNhdGNoZXMpID4gMCl7XG4gICAgICAgICAgICAgICAgdmFsdWUuY2F0Y2hlcyA9IHBhcnNlSW50KHZhbHVlLmNhdGNoZXMpXG4gICAgICAgICAgICAgICAgY2F0Y2hlcyArPSB2YWx1ZS5jYXRjaGVzXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYoIWlzTmFOKHZhbHVlLnJ1bnNfY29uY2VkZWQpKXtcbiAgICAgICAgICAgICAgICB2YWx1ZS5ydW5zX2NvbmNlZGVkID0gcGFyc2VJbnQodmFsdWUucnVuc19jb25jZWRlZClcbiAgICAgICAgICAgICAgICBydW5zQ29uY2VkZWQgKz0gdmFsdWUucnVuc19jb25jZWRlZDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICB2YXIgdG90YWxJbm5pbmdzID0gdG90YWxNYXRjaGVzIC0gZGlkTm90QmF0XG4gICAgICAgICAgdmFyIHN0YXRzID0ge1xuICAgICAgICAgICAgdG90YWxNYXRjaGVzIDogdG90YWxNYXRjaGVzLFxuICAgICAgICAgICAgdG90YWxSdW5zOiB0b3RhbFJ1bnMsXG4gICAgICAgICAgICBoYWxmQ2VudHVyaWVzU2NvcmVkOiBoYWxmQ2VudHVyaWVzU2NvcmVkLmxlbmd0aCxcbiAgICAgICAgICAgIGNlbnR1cmllc1Njb3JlZDogY2VudHVyaWVzU2NvcmVkLmxlbmd0aCxcbiAgICAgICAgICAgIGhpZ2hlc3RTY29yZTogIE1hdGgubWF4LmFwcGx5KG51bGwsY2VudHVyaWVzU2NvcmVkLm1hcChmdW5jdGlvbihpbmRleCl7cmV0dXJuIGluZGV4LnJ1bnN9KSksXG4gICAgICAgICAgICBub3RPdXRzOiBub3RPdXRzLFxuICAgICAgICAgICAgdG90YWxJbm5pbmdzOiB0b3RhbElubmluZ3MsXG4gICAgICAgICAgICBiYXR0aW5nQXZlcmFnZTogKHRvdGFsUnVucyAvICh0b3RhbElubmluZ3MgLSBub3RPdXRzKSkudG9GaXhlZCgyKSxcbiAgICAgICAgICAgIHdpY2tldHNUYWtlbjogd2lja2V0c1Rha2VuLFxuICAgICAgICAgICAgcnVuc0NvbmNlZGVkOiBydW5zQ29uY2VkZWQsXG4gICAgICAgICAgICBib3dsaW5nQXZlcmFnZTogKHJ1bnNDb25jZWRlZCAvIHdpY2tldHNUYWtlbikudG9GaXhlZCgyKSxcbiAgICAgICAgICAgIGNhdGNoZXM6IGNhdGNoZXMsXG4gICAgICAgICAgICBhbGxDZW50dXJpZXM6IHtjZW50dXJpZXNTY29yZWQsaGFsZkNlbnR1cmllc1Njb3JlZH0sXG4gICAgICAgICAgICBhbGxJbm5pbmdzOiBhbGxJbm5pbmdzXG4gICAgICAgICAgfTtcbiAgICAgICAgICBpZihjYWxsYmFjayAmJiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSkge1xuICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soc3RhdHMpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gc3RhdHNcbiAgICAgICAgfVxuXG5cbiAgICB9KVxuIiwiYW5ndWxhci5tb2R1bGUoJ2FwcCcpXG4gICAgLmNvbnRyb2xsZXIoJ2NlbnR1cnlTdGF0c0N0cmwnLCBmdW5jdGlvbigkc2NvcGUpIHtcbiAgICAgICRzY29wZS4kd2F0Y2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgcmV0dXJuICRzY29wZS5jZW50dXJ5U3RhdHM7XG4gICAgICAgICAgIH0sIGZ1bmN0aW9uKG4pIHtcbiAgICAgICAgICAgICAgIGlmKCFuKXJldHVyblxuICAgICAgICAgICAgICAgJHNjb3BlLmFuYWx5emVDZW50dXJpZXMoJHNjb3BlLmNlbnR1cnlTdGF0cylcbiAgICAgICAgICAgfSk7XG5cbiAgICAgICRzY29wZS5hbmFseXplQ2VudHVyaWVzID0gZnVuY3Rpb24oY2VudHVyeVN0YXRzKXtcbiAgICAgICAgdmFyIHNjb3JlcyA9IF8ucGx1Y2soY2VudHVyeVN0YXRzLmNlbnR1cmllc1Njb3JlZCwgJ3J1bnMnKVxuICAgICAgICB2YXIgYWdhaW5zdCA9IF8ucGx1Y2soY2VudHVyeVN0YXRzLmNlbnR1cmllc1Njb3JlZCwgJ2FnYWluc3QnKVxuXG4gICAgICAgIHZhciB0b3RhbEZpZnRpZXMgPSBjZW50dXJ5U3RhdHMuaGFsZkNlbnR1cmllc1Njb3JlZC5sZW5ndGhcbiAgICAgICAgdmFyIHRvdGFsSHVuZHJlZHMgPSBjZW50dXJ5U3RhdHMuY2VudHVyaWVzU2NvcmVkLmxlbmd0aFxuICAgICAgICAvL1NlbmQgYXJyYXkgb2YgY29sb3JzIHRvIGNoYXJ0anNcbiAgICAgICAgdmFyIGNvbG9ycyA9IFtdO1xuICAgICAgICBjZW50dXJ5U3RhdHMuY2VudHVyaWVzU2NvcmVkLm1hcChmdW5jdGlvbihyZXMsIGtleSl7XG4gICAgICAgICAgaWYocmVzLnJlc3VsdCA9PSBcIndvblwiKXtcbiAgICAgICAgICAgIGNvbG9yc1trZXldID0gXCJyZ2JhKDAsMTMyLDI1NSwwLjgpXCJcbiAgICAgICAgICB9ZWxzZSBpZihyZXMucmVzdWx0ID09IFwibG9zdFwiKXtcbiAgICAgICAgICAgIGNvbG9yc1trZXldID0gXCJyZ2JhKDIzNyw2Myw0NywwLjgpXCJcbiAgICAgICAgICB9ZWxzZSBpZihyZXMucmVzdWx0ID09IFwidGllZFwiKXtcbiAgICAgICAgICAgIGNvbG9yc1trZXldID0gXCJibGFja1wiXG4gICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBjb2xvcnNba2V5XSA9IFwieWVsbG93XCJcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGNvbG9yc1xuICAgICAgICB9KVxuICAgICAgICB2YXIgd29uID0gXy5maWx0ZXIoY2VudHVyeVN0YXRzLmNlbnR1cmllc1Njb3JlZCwgZnVuY3Rpb24oY2VudCl7XG4gICAgICAgICAgcmV0dXJuIGNlbnQucmVzdWx0ID09IFwid29uXCJcbiAgICAgICAgfSlcbiAgICAgICAgLy8gdmFyIGxvc3QgPSBfLmZpbHRlcihjZW50dXJ5U3RhdHMuY2VudHVyaWVzU2NvcmVkLCBmdW5jdGlvbihjZW50KXtcbiAgICAgICAgLy8gICByZXR1cm4gY2VudC5yZXN1bHQgPT09IFwibG9zdFwiXG4gICAgICAgIC8vIH0pXG4gICAgICAgIC8vIHZhciB0aWVkID0gXy5maWx0ZXIoY2VudHVyeVN0YXRzLmNlbnR1cmllc1Njb3JlZCwgZnVuY3Rpb24oY2VudCl7XG4gICAgICAgIC8vICAgcmV0dXJuIGNlbnQucmVzdWx0ID09PSBcInRpZWRcIlxuICAgICAgICAvLyB9KVxuICAgICAgICAvLyB2YXIgbm9yZXN1bHQgPSBfLmZpbHRlcihjZW50dXJ5U3RhdHMuY2VudHVyaWVzU2NvcmVkLCBmdW5jdGlvbihjZW50KXtcbiAgICAgICAgLy8gICByZXR1cm4gY2VudC5yZXN1bHQgPT09IFwibi9yXCJcbiAgICAgICAgLy8gfSlcblxuICAgICAgICAvL0NlbnR1cnkgd2hpbGUgY2hhc2luZ1xuICAgICAgICB2YXIgY2hhc2luZ0NlbnR1cmllcyA9IF8uZmlsdGVyKGNlbnR1cnlTdGF0cy5jZW50dXJpZXNTY29yZWQsIGZ1bmN0aW9uKGNlbnQpe1xuICAgICAgICAgIHJldHVybiBjZW50LmlubmluZ3MgPT0gXCIybmRcIlxuICAgICAgICB9KVxuICAgICAgICB2YXIgd2luY2hhc2luZ0NlbnR1cmllcyA9IF8uZmlsdGVyKGNoYXNpbmdDZW50dXJpZXMsIGZ1bmN0aW9uKGNlbnQpe1xuICAgICAgICAgIHJldHVybiBjZW50LnJlc3VsdCA9PSBcIndvblwiXG4gICAgICAgIH0pXG4gICAgICAgIHZhciBsb3N0Y2hhc2luZ0NlbnR1cmllcyA9IF8uZmlsdGVyKGNoYXNpbmdDZW50dXJpZXMsIGZ1bmN0aW9uKGNlbnQpe1xuICAgICAgICAgIHJldHVybiBjZW50LnJlc3VsdCA9PT0gXCJsb3N0XCJcbiAgICAgICAgfSlcbiAgICAgICAgdmFyIHRpZWRjaGFzaW5nQ2VudHVyaWVzID0gXy5maWx0ZXIoY2hhc2luZ0NlbnR1cmllcywgZnVuY3Rpb24oY2VudCl7XG4gICAgICAgICAgcmV0dXJuIGNlbnQucmVzdWx0ID09PSBcInRpZWRcIlxuICAgICAgICB9KVxuICAgICAgICB2YXIgbm9yZXN1bHRjaGFzaW5nQ2VudHVyaWVzID0gXy5maWx0ZXIoY2hhc2luZ0NlbnR1cmllcywgZnVuY3Rpb24oY2VudCl7XG4gICAgICAgICAgcmV0dXJuIGNlbnQucmVzdWx0ID09PSBcIm4vclwiXG4gICAgICAgIH0pXG5cbiAgICAgICAgLy9DZW50dXJ5IGFnYWluc3QgdGVhbXNcbiAgICAgICAgdmFyIGNlbnR1cnlBZ2FpbnN0VGVhbXMgPSBbXTtcbiAgICAgICAgY2VudHVyeVN0YXRzLmNlbnR1cmllc1Njb3JlZC5tYXAoZnVuY3Rpb24ocmVzKXtcbiAgICAgICAgICB2YXIgdGVhbSA9IHJlcy5hZ2FpbnN0O1xuICAgICAgICAgIHZhciBjZW50dXJ5ID0ge1xuICAgICAgICAgICAgc2NvcmU6IHJlcy5ydW5zXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmKHR5cGVvZihjZW50dXJ5QWdhaW5zdFRlYW1zW3RlYW1dKSA9PSBcInVuZGVmaW5lZFwiKVxuICAgICAgICAgICAgICAgICAgY2VudHVyeUFnYWluc3RUZWFtc1t0ZWFtXSA9IFtdXG4gICAgICAgICAgcmV0dXJuIGNlbnR1cnlBZ2FpbnN0VGVhbXNbdGVhbV0ucHVzaChjZW50dXJ5KVxuICAgICAgICB9KVxuXG4gICAgICAgIC8vQ2VudHVyeSBvdmVyIHRoZSB5ZWFyc1xuICAgICAgICB2YXIgY2VudHVyeUJ5WWVhciA9IFtdO1xuICAgICAgICBjZW50dXJ5U3RhdHMuY2VudHVyaWVzU2NvcmVkLm1hcChmdW5jdGlvbihyZXMpe1xuICAgICAgICAgIHZhciB5ZWFyID0gcmVzLnllYXI7XG4gICAgICAgICAgdmFyIGNlbnR1cnkgPSB7XG4gICAgICAgICAgICBzY29yZTogcmVzLnJ1bnNcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYodHlwZW9mKGNlbnR1cnlCeVllYXJbeWVhcl0pID09IFwidW5kZWZpbmVkXCIpXG4gICAgICAgICAgICAgICAgICBjZW50dXJ5QnlZZWFyW3llYXJdID0gW11cbiAgICAgICAgICByZXR1cm4gY2VudHVyeUJ5WWVhclt5ZWFyXS5wdXNoKGNlbnR1cnkpXG4gICAgICAgIH0pXG5cbiAgICAgICAgdmFyIGhhbGZDZW50dXJ5QnlZZWFyID0gW107XG4gICAgICAgIGNlbnR1cnlTdGF0cy5oYWxmQ2VudHVyaWVzU2NvcmVkLm1hcChmdW5jdGlvbihyZXMpe1xuICAgICAgICAgIHZhciB5ZWFyID0gcmVzLnllYXI7XG4gICAgICAgICAgdmFyIGhhbGZDZW50dXJ5ID0ge1xuICAgICAgICAgICAgc2NvcmU6IHJlcy5ydW5zXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmKHR5cGVvZihoYWxmQ2VudHVyeUJ5WWVhclt5ZWFyXSkgPT0gXCJ1bmRlZmluZWRcIilcbiAgICAgICAgICAgICAgICAgIGhhbGZDZW50dXJ5QnlZZWFyW3llYXJdID0gW11cbiAgICAgICAgICByZXR1cm4gaGFsZkNlbnR1cnlCeVllYXJbeWVhcl0ucHVzaChoYWxmQ2VudHVyeSlcbiAgICAgICAgfSlcblxuICAgICAgICBjb25zb2xlLmxvZyhjZW50dXJ5QnlZZWFyLGhhbGZDZW50dXJ5QnlZZWFyKVxuXG5cbiAgICAgICAgJHNjb3BlLndpbm5pbmdSYXRpbyA9ICh3b24ubGVuZ3RoL2NlbnR1cnlTdGF0cy5jZW50dXJpZXNTY29yZWQubGVuZ3RoKS50b0ZpeGVkKDIpICogMTA7XG4gICAgICAgICRzY29wZS5wcmVwYXJlQmFyR3JhcGgoc2NvcmVzLCBhZ2FpbnN0LCBjb2xvcnMpXG4gICAgICAgICRzY29wZS5wcmVwYXJlQmFyR3JhcGhBZ2FpbnN0VGVhbShjZW50dXJ5QWdhaW5zdFRlYW1zKVxuICAgICAgICAkc2NvcGUucHJlcGFyZUxpbmVHcmFwaChjZW50dXJ5QnlZZWFyLGhhbGZDZW50dXJ5QnlZZWFyKTtcbiAgICAgICAgJHNjb3BlLnByZXBhcmVEb3VnaG51dENoYXJ0KHdpbmNoYXNpbmdDZW50dXJpZXMubGVuZ3RoLGxvc3RjaGFzaW5nQ2VudHVyaWVzLmxlbmd0aCx0aWVkY2hhc2luZ0NlbnR1cmllcy5sZW5ndGgsbm9yZXN1bHRjaGFzaW5nQ2VudHVyaWVzLmxlbmd0aClcbiAgICAgICAgJHNjb3BlLnByZXBhcmVDb252ZXJzaW9uUmF0ZVBpZUNoYXJ0KHRvdGFsRmlmdGllcyx0b3RhbEh1bmRyZWRzKVxuICAgICAgfVxuXG5cblxuXG5cblxuXG5cbiAgICAgICRzY29wZS5wcmVwYXJlQmFyR3JhcGggPSBmdW5jdGlvbiAoc2NvcmVzLGFnYWluc3QsIGNvbG9ycyl7XG4gICAgICAgICRzY29wZS5iYXJkYXRhID0ge1xuICAgICAgICAgICAgICAgbGFiZWxzOiBhZ2FpbnN0LFxuICAgICAgICAgICAgICAgZGF0YXNldHM6IFt7XG4gICAgICAgICAgICAgICAgICAgbGFiZWw6ICdDZW50dXJpZXMnLFxuICAgICAgICAgICAgICAgICAgIGZpbGxDb2xvcjogY29sb3JzLFxuICAgICAgICAgICAgICAgICAgIHN0cm9rZUNvbG9yOiAncmdiYSgyMjAsMjIwLDIyMCwxKScsXG4gICAgICAgICAgICAgICAgICAgcG9pbnRDb2xvcjogJ3JnYmEoMjIwLDIyMCwyMjAsMSknLFxuICAgICAgICAgICAgICAgICAgIHBvaW50U3Ryb2tlQ29sb3I6ICcjZmZmJyxcbiAgICAgICAgICAgICAgICAgICBwb2ludEhpZ2hsaWdodEZpbGw6ICcjZmZmJyxcbiAgICAgICAgICAgICAgICAgICBwb2ludEhpZ2hsaWdodFN0cm9rZTogJ3JnYmEoMjIwLDIyMCwyMjAsMSknLFxuICAgICAgICAgICAgICAgICAgIGRhdGE6IHNjb3Jlc1xuICAgICAgICAgICAgICAgfV1cbiAgICAgICAgICAgfTtcblxuICAgICAgICAgICAvLyBDaGFydC5qcyBPcHRpb25zXG4gICAgICAgICAgICRzY29wZS5iYXJvcHRpb25zID0ge1xuXG4gICAgICAgICAgICAgICAvLyBTZXRzIHRoZSBjaGFydCB0byBiZSByZXNwb25zaXZlXG4gICAgICAgICAgICAgICByZXNwb25zaXZlOiB0cnVlLFxuXG4gICAgICAgICAgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIHRoZSBzY2FsZSBzaG91bGQgc3RhcnQgYXQgemVybywgb3IgYW4gb3JkZXIgb2YgbWFnbml0dWRlIGRvd24gZnJvbSB0aGUgbG93ZXN0IHZhbHVlXG4gICAgICAgICAgICAgICBzY2FsZUJlZ2luQXRaZXJvOiB0cnVlLFxuXG4gICAgICAgICAgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIGdyaWQgbGluZXMgYXJlIHNob3duIGFjcm9zcyB0aGUgY2hhcnRcbiAgICAgICAgICAgICAgIHNjYWxlU2hvd0dyaWRMaW5lczogdHJ1ZSxcblxuICAgICAgICAgICAgICAgLy9TdHJpbmcgLSBDb2xvdXIgb2YgdGhlIGdyaWQgbGluZXNcbiAgICAgICAgICAgICAgIHNjYWxlR3JpZExpbmVDb2xvcjogXCJyZ2JhKDAsMCwwLC4wNSlcIixcblxuICAgICAgICAgICAgICAgLy9OdW1iZXIgLSBXaWR0aCBvZiB0aGUgZ3JpZCBsaW5lc1xuICAgICAgICAgICAgICAgc2NhbGVHcmlkTGluZVdpZHRoOiAxLFxuXG4gICAgICAgICAgICAgICAvL0Jvb2xlYW4gLSBJZiB0aGVyZSBpcyBhIHN0cm9rZSBvbiBlYWNoIGJhclxuICAgICAgICAgICAgICAgYmFyU2hvd1N0cm9rZTogdHJ1ZSxcblxuICAgICAgICAgICAgICAgLy9OdW1iZXIgLSBQaXhlbCB3aWR0aCBvZiB0aGUgYmFyIHN0cm9rZVxuICAgICAgICAgICAgICAgYmFyU3Ryb2tlV2lkdGg6IDIsXG5cbiAgICAgICAgICAgICAgIC8vTnVtYmVyIC0gU3BhY2luZyBiZXR3ZWVuIGVhY2ggb2YgdGhlIFggdmFsdWUgc2V0c1xuICAgICAgICAgICAgICAgYmFyVmFsdWVTcGFjaW5nOiA1LFxuXG4gICAgICAgICAgICAgICAvL051bWJlciAtIFNwYWNpbmcgYmV0d2VlbiBkYXRhIHNldHMgd2l0aGluIFggdmFsdWVzXG4gICAgICAgICAgICAgICBiYXJEYXRhc2V0U3BhY2luZzogMSxcblxuICAgICAgICAgICAgICAgLy9TdHJpbmcgLSBBIGxlZ2VuZCB0ZW1wbGF0ZVxuICAgICAgICAgICAgICAgbGVnZW5kVGVtcGxhdGU6ICc8dWwgY2xhc3M9XCJ0Yy1jaGFydC1qcy1sZWdlbmRcIj48JSBmb3IgKHZhciBpPTA7IGk8ZGF0YXNldHMubGVuZ3RoOyBpKyspeyU+PGxpPjxzcGFuIHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjo8JT1kYXRhc2V0c1tpXS5maWxsQ29sb3IlPlwiPjwvc3Bhbj48JWlmKGRhdGFzZXRzW2ldLmxhYmVsKXslPjwlPWRhdGFzZXRzW2ldLmxhYmVsJT48JX0lPjwvbGk+PCV9JT48L3VsPidcbiAgICAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgJHNjb3BlLnByZXBhcmVCYXJHcmFwaEFnYWluc3RUZWFtID0gZnVuY3Rpb24gKGNlbnR1cnlBZ2FpbnN0VGVhbXMpe1xuICAgICAgICB2YXIgYWdhaW5zdEZvckNlbnR1cmllcyA9IFtdXG4gICAgICAgIHZhciBudW1iZXJPZkNlbnR1cmllcyA9IFtdXG4gICAgICAgIGZvcih2YXIgY2VudHVyeUtleSBpbiBjZW50dXJ5QWdhaW5zdFRlYW1zKSB7XG4gICAgICAgICAgaWYoY2VudHVyeUFnYWluc3RUZWFtcy5oYXNPd25Qcm9wZXJ0eShjZW50dXJ5S2V5KSkge1xuICAgICAgICAgICAgYWdhaW5zdEZvckNlbnR1cmllcy5wdXNoKGNlbnR1cnlLZXkpO1xuICAgICAgICAgICAgbnVtYmVyT2ZDZW50dXJpZXMucHVzaChjZW50dXJ5QWdhaW5zdFRlYW1zW2NlbnR1cnlLZXldLmxlbmd0aClcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgJHNjb3BlLmJhcmRhdGFBZ2FpbnN0VGVhbSA9IHtcbiAgICAgICAgICAgICAgIGxhYmVsczogYWdhaW5zdEZvckNlbnR1cmllcyxcbiAgICAgICAgICAgICAgIGRhdGFzZXRzOiBbe1xuICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnQ2VudHVyaWVzJyxcbiAgICAgICAgICAgICAgICAgICBmaWxsQ29sb3I6IFsnYmx1ZSddLFxuICAgICAgICAgICAgICAgICAgIHN0cm9rZUNvbG9yOiAncmdiYSgyMjAsMjIwLDIyMCwxKScsXG4gICAgICAgICAgICAgICAgICAgcG9pbnRDb2xvcjogJ3JnYmEoMjIwLDIyMCwyMjAsMSknLFxuICAgICAgICAgICAgICAgICAgIHBvaW50U3Ryb2tlQ29sb3I6ICcjZmZmJyxcbiAgICAgICAgICAgICAgICAgICBwb2ludEhpZ2hsaWdodEZpbGw6ICcjZmZmJyxcbiAgICAgICAgICAgICAgICAgICBwb2ludEhpZ2hsaWdodFN0cm9rZTogJ3JnYmEoMjIwLDIyMCwyMjAsMSknLFxuICAgICAgICAgICAgICAgICAgIGRhdGE6IG51bWJlck9mQ2VudHVyaWVzXG4gICAgICAgICAgICAgICB9XVxuICAgICAgICAgICB9O1xuXG4gICAgICAgICAgIC8vIENoYXJ0LmpzIE9wdGlvbnNcbiAgICAgICAgICAgJHNjb3BlLmJhcm9wdGlvbnNBZ2FpbnN0VGVhbSA9IHtcblxuICAgICAgICAgICAgICAgLy8gU2V0cyB0aGUgY2hhcnQgdG8gYmUgcmVzcG9uc2l2ZVxuICAgICAgICAgICAgICAgcmVzcG9uc2l2ZTogdHJ1ZSxcblxuICAgICAgICAgICAgICAgLy9Cb29sZWFuIC0gV2hldGhlciB0aGUgc2NhbGUgc2hvdWxkIHN0YXJ0IGF0IHplcm8sIG9yIGFuIG9yZGVyIG9mIG1hZ25pdHVkZSBkb3duIGZyb20gdGhlIGxvd2VzdCB2YWx1ZVxuICAgICAgICAgICAgICAgc2NhbGVCZWdpbkF0WmVybzogdHJ1ZSxcblxuICAgICAgICAgICAgICAgLy9Cb29sZWFuIC0gV2hldGhlciBncmlkIGxpbmVzIGFyZSBzaG93biBhY3Jvc3MgdGhlIGNoYXJ0XG4gICAgICAgICAgICAgICBzY2FsZVNob3dHcmlkTGluZXM6IHRydWUsXG5cbiAgICAgICAgICAgICAgIC8vU3RyaW5nIC0gQ29sb3VyIG9mIHRoZSBncmlkIGxpbmVzXG4gICAgICAgICAgICAgICBzY2FsZUdyaWRMaW5lQ29sb3I6IFwicmdiYSgwLDAsMCwuMDUpXCIsXG5cbiAgICAgICAgICAgICAgIC8vTnVtYmVyIC0gV2lkdGggb2YgdGhlIGdyaWQgbGluZXNcbiAgICAgICAgICAgICAgIHNjYWxlR3JpZExpbmVXaWR0aDogMSxcblxuICAgICAgICAgICAgICAgLy9Cb29sZWFuIC0gSWYgdGhlcmUgaXMgYSBzdHJva2Ugb24gZWFjaCBiYXJcbiAgICAgICAgICAgICAgIGJhclNob3dTdHJva2U6IHRydWUsXG5cbiAgICAgICAgICAgICAgIC8vTnVtYmVyIC0gUGl4ZWwgd2lkdGggb2YgdGhlIGJhciBzdHJva2VcbiAgICAgICAgICAgICAgIGJhclN0cm9rZVdpZHRoOiAyLFxuXG4gICAgICAgICAgICAgICAvL051bWJlciAtIFNwYWNpbmcgYmV0d2VlbiBlYWNoIG9mIHRoZSBYIHZhbHVlIHNldHNcbiAgICAgICAgICAgICAgIGJhclZhbHVlU3BhY2luZzogNSxcblxuICAgICAgICAgICAgICAgLy9OdW1iZXIgLSBTcGFjaW5nIGJldHdlZW4gZGF0YSBzZXRzIHdpdGhpbiBYIHZhbHVlc1xuICAgICAgICAgICAgICAgYmFyRGF0YXNldFNwYWNpbmc6IDEsXG5cbiAgICAgICAgICAgICAgIC8vU3RyaW5nIC0gQSBsZWdlbmQgdGVtcGxhdGVcbiAgICAgICAgICAgICAgIGxlZ2VuZFRlbXBsYXRlOiAnPHVsIGNsYXNzPVwidGMtY2hhcnQtanMtbGVnZW5kXCI+PCUgZm9yICh2YXIgaT0wOyBpPGRhdGFzZXRzLmxlbmd0aDsgaSsrKXslPjxsaT48c3BhbiBzdHlsZT1cImJhY2tncm91bmQtY29sb3I6PCU9ZGF0YXNldHNbaV0uZmlsbENvbG9yJT5cIj48L3NwYW4+PCVpZihkYXRhc2V0c1tpXS5sYWJlbCl7JT48JT1kYXRhc2V0c1tpXS5sYWJlbCU+PCV9JT48L2xpPjwlfSU+PC91bD4nXG4gICAgICAgICAgIH07XG4gICAgICB9XG5cblxuICAgICAgJHNjb3BlLnByZXBhcmVMaW5lR3JhcGggPSBmdW5jdGlvbihjZW50dXJ5QnlZZWFyLGhhbGZDZW50dXJ5QnlZZWFyKXtcbiAgICAgICAgICB2YXIgeWVhck9mY2VudHVyaWVzID0gW11cbiAgICAgICAgICB2YXIgbnVtYmVyT2ZDZW50dXJpZXMgPSBbXVxuXG4gICAgICAgICAgZm9yKHZhciBjZW50dXJ5IGluIGNlbnR1cnlCeVllYXIpIHtcbiAgICAgICAgICAgIGlmKGNlbnR1cnlCeVllYXIuaGFzT3duUHJvcGVydHkoY2VudHVyeSkpIHtcbiAgICAgICAgICAgICAgeWVhck9mY2VudHVyaWVzLnB1c2goY2VudHVyeSk7XG4gICAgICAgICAgICAgIG51bWJlck9mQ2VudHVyaWVzLnB1c2goY2VudHVyeUJ5WWVhcltjZW50dXJ5XS5sZW5ndGgpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciB5ZWFyT2ZoYWxmQ2VudHVyaWVzID0gW11cbiAgICAgICAgICB2YXIgbnVtYmVyT2ZIYWxmQ2VudHVyaWVzID0gW11cblxuICAgICAgICAgIGZvcih2YXIgaGFsZkNlbnR1cnkgaW4gaGFsZkNlbnR1cnlCeVllYXIpIHtcbiAgICAgICAgICAgIGlmKGNlbnR1cnlCeVllYXIuaGFzT3duUHJvcGVydHkoaGFsZkNlbnR1cnkpKSB7XG4gICAgICAgICAgICAgIHllYXJPZmhhbGZDZW50dXJpZXMucHVzaChoYWxmQ2VudHVyeSk7XG4gICAgICAgICAgICAgIG51bWJlck9mSGFsZkNlbnR1cmllcy5wdXNoKGhhbGZDZW50dXJ5QnlZZWFyW2hhbGZDZW50dXJ5XS5sZW5ndGgpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgICRzY29wZS5saW5lRGF0YSA9IHtcbiAgICAgICAgICBsYWJlbHM6IHllYXJPZmhhbGZDZW50dXJpZXMsXG4gICAgICAgICAgZGF0YXNldHM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgbGFiZWw6ICdNeSBGaXJzdCBkYXRhc2V0JyxcbiAgICAgICAgICAgICAgZmlsbENvbG9yOiBbJ3JnYmEoMTIwLDIwLDIyMCwwLjQpJ10sXG4gICAgICAgICAgICAgIHN0cm9rZUNvbG9yOiAncmdiYSgyMjAsMjIwLDIyMCwxKScsXG4gICAgICAgICAgICAgIHBvaW50Q29sb3I6ICdyZ2JhKDIyMCwyMjAsMjIwLDEpJyxcbiAgICAgICAgICAgICAgcG9pbnRTdHJva2VDb2xvcjogJyNmZmYnLFxuICAgICAgICAgICAgICBwb2ludEhpZ2hsaWdodEZpbGw6ICcjZmZmJyxcbiAgICAgICAgICAgICAgcG9pbnRIaWdobGlnaHRTdHJva2U6ICdyZ2JhKDIyMCwyMjAsMjIwLDEpJyxcbiAgICAgICAgICAgICAgZGF0YTogbnVtYmVyT2ZIYWxmQ2VudHVyaWVzXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBsYWJlbDogJ015IEZpcnN0IGRhdGFzZXQnLFxuICAgICAgICAgICAgICBmaWxsQ29sb3I6IFsncmdiYSgyMjAsMjIwLDIyMCwwLjYpJ10sXG4gICAgICAgICAgICAgIHN0cm9rZUNvbG9yOiAncmdiYSgyMjAsMjIwLDIyMCwxKScsXG4gICAgICAgICAgICAgIHBvaW50Q29sb3I6ICdyZ2JhKDIyMCwyMjAsMjIwLDEpJyxcbiAgICAgICAgICAgICAgcG9pbnRTdHJva2VDb2xvcjogJyNmZmYnLFxuICAgICAgICAgICAgICBwb2ludEhpZ2hsaWdodEZpbGw6ICcjZmZmJyxcbiAgICAgICAgICAgICAgcG9pbnRIaWdobGlnaHRTdHJva2U6ICdyZ2JhKDIyMCwyMjAsMjIwLDEpJyxcbiAgICAgICAgICAgICAgZGF0YTogbnVtYmVyT2ZDZW50dXJpZXNcbiAgICAgICAgICAgIH1cbiAgICAgICAgICBdXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gQ2hhcnQuanMgT3B0aW9uc1xuICAgICAgICAkc2NvcGUubGluZU9wdGlvbnMgPSAge1xuXG4gICAgICAgICAgLy8gU2V0cyB0aGUgY2hhcnQgdG8gYmUgcmVzcG9uc2l2ZVxuICAgICAgICAgIHJlc3BvbnNpdmU6IHRydWUsXG5cbiAgICAgICAgICAvLy9Cb29sZWFuIC0gV2hldGhlciBncmlkIGxpbmVzIGFyZSBzaG93biBhY3Jvc3MgdGhlIGNoYXJ0XG4gICAgICAgICAgc2NhbGVTaG93R3JpZExpbmVzIDogdHJ1ZSxcblxuICAgICAgICAgIC8vU3RyaW5nIC0gQ29sb3VyIG9mIHRoZSBncmlkIGxpbmVzXG4gICAgICAgICAgc2NhbGVHcmlkTGluZUNvbG9yIDogXCJyZ2JhKDAsMCwwLC4wNSlcIixcblxuICAgICAgICAgIC8vTnVtYmVyIC0gV2lkdGggb2YgdGhlIGdyaWQgbGluZXNcbiAgICAgICAgICBzY2FsZUdyaWRMaW5lV2lkdGggOiAxLFxuXG4gICAgICAgICAgLy9Cb29sZWFuIC0gV2hldGhlciB0aGUgbGluZSBpcyBjdXJ2ZWQgYmV0d2VlbiBwb2ludHNcbiAgICAgICAgICBiZXppZXJDdXJ2ZSA6IHRydWUsXG5cbiAgICAgICAgICAvL051bWJlciAtIFRlbnNpb24gb2YgdGhlIGJlemllciBjdXJ2ZSBiZXR3ZWVuIHBvaW50c1xuICAgICAgICAgIGJlemllckN1cnZlVGVuc2lvbiA6IDAuNCxcblxuICAgICAgICAgIC8vQm9vbGVhbiAtIFdoZXRoZXIgdG8gc2hvdyBhIGRvdCBmb3IgZWFjaCBwb2ludFxuICAgICAgICAgIHBvaW50RG90IDogdHJ1ZSxcblxuICAgICAgICAgIC8vTnVtYmVyIC0gUmFkaXVzIG9mIGVhY2ggcG9pbnQgZG90IGluIHBpeGVsc1xuICAgICAgICAgIHBvaW50RG90UmFkaXVzIDogNCxcblxuICAgICAgICAgIC8vTnVtYmVyIC0gUGl4ZWwgd2lkdGggb2YgcG9pbnQgZG90IHN0cm9rZVxuICAgICAgICAgIHBvaW50RG90U3Ryb2tlV2lkdGggOiAxLFxuXG4gICAgICAgICAgLy9OdW1iZXIgLSBhbW91bnQgZXh0cmEgdG8gYWRkIHRvIHRoZSByYWRpdXMgdG8gY2F0ZXIgZm9yIGhpdCBkZXRlY3Rpb24gb3V0c2lkZSB0aGUgZHJhd24gcG9pbnRcbiAgICAgICAgICBwb2ludEhpdERldGVjdGlvblJhZGl1cyA6IDIwLFxuXG4gICAgICAgICAgLy9Cb29sZWFuIC0gV2hldGhlciB0byBzaG93IGEgc3Ryb2tlIGZvciBkYXRhc2V0c1xuICAgICAgICAgIGRhdGFzZXRTdHJva2UgOiB0cnVlLFxuXG4gICAgICAgICAgLy9OdW1iZXIgLSBQaXhlbCB3aWR0aCBvZiBkYXRhc2V0IHN0cm9rZVxuICAgICAgICAgIGRhdGFzZXRTdHJva2VXaWR0aCA6IDIsXG5cbiAgICAgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIHRvIGZpbGwgdGhlIGRhdGFzZXQgd2l0aCBhIGNvbG91clxuICAgICAgICAgIGRhdGFzZXRGaWxsIDogdHJ1ZSxcblxuICAgICAgICAgIC8vIEZ1bmN0aW9uIC0gb24gYW5pbWF0aW9uIHByb2dyZXNzXG4gICAgICAgICAgb25BbmltYXRpb25Qcm9ncmVzczogZnVuY3Rpb24oKXt9LFxuXG4gICAgICAgICAgLy8gRnVuY3Rpb24gLSBvbiBhbmltYXRpb24gY29tcGxldGVcbiAgICAgICAgICBvbkFuaW1hdGlvbkNvbXBsZXRlOiBmdW5jdGlvbigpe30sXG5cbiAgICAgICAgICAvL1N0cmluZyAtIEEgbGVnZW5kIHRlbXBsYXRlXG4gICAgICAgICAgbGVnZW5kVGVtcGxhdGUgOiAnPHVsIGNsYXNzPVwidGMtY2hhcnQtanMtbGVnZW5kXCI+PCUgZm9yICh2YXIgaT0wOyBpPGRhdGFzZXRzLmxlbmd0aDsgaSsrKXslPjxsaT48c3BhbiBzdHlsZT1cImJhY2tncm91bmQtY29sb3I6PCU9ZGF0YXNldHNbaV0uc3Ryb2tlQ29sb3IlPlwiPjwvc3Bhbj48JWlmKGRhdGFzZXRzW2ldLmxhYmVsKXslPjwlPWRhdGFzZXRzW2ldLmxhYmVsJT48JX0lPjwvbGk+PCV9JT48L3VsPidcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgICRzY29wZS5wcmVwYXJlRG91Z2hudXRDaGFydCA9IGZ1bmN0aW9uKHdvbiwgbG9zdCwgdGllZCwgbm9yZXN1bHQpe1xuICAgICAgICAkc2NvcGUucmVzb3VyY2VzID0gW3tcbiAgICAgICAgICAgICAgIHZhbHVlOiB3b24sXG4gICAgICAgICAgICAgICBjb2xvcjogJyNGRkZGMDAnLFxuICAgICAgICAgICAgICAgaGlnaGxpZ2h0OiAnI2U1ZTUwMCcsXG4gICAgICAgICAgICAgICBsYWJlbDogJ1dpbidcbiAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgdmFsdWU6IGxvc3QsXG4gICAgICAgICAgICAgICBjb2xvcjogJyM0NkJGQkQnLFxuICAgICAgICAgICAgICAgaGlnaGxpZ2h0OiAnIzVBRDNEMScsXG4gICAgICAgICAgICAgICBsYWJlbDogJ0xvc3MnXG4gICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgIHZhbHVlOiB0aWVkLFxuICAgICAgICAgICAgICAgY29sb3I6ICcjRjc0NjRBJyxcbiAgICAgICAgICAgICAgIGhpZ2hsaWdodDogJyNGRjVBNUUnLFxuICAgICAgICAgICAgICAgbGFiZWw6ICdUaWUnXG4gICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgIHZhbHVlOiBub3Jlc3VsdCxcbiAgICAgICAgICAgICAgIGNvbG9yOiAnI0Y3NDY0QScsXG4gICAgICAgICAgICAgICBoaWdobGlnaHQ6ICcjRUY1QTVFJyxcbiAgICAgICAgICAgICAgIGxhYmVsOiAnTm8gUmVzdWx0J1xuICAgICAgICAgICB9XG4gICAgICAgICBdO1xuXG4gICAgICAgICAgIC8vIENoYXJ0LmpzIE9wdGlvbnNcbiAgICAgICAgICAgJHNjb3BlLm9wdGlvbnMgPSB7XG5cbiAgICAgICAgICAgICAgIC8vIFNldHMgdGhlIGNoYXJ0IHRvIGJlIHJlc3BvbnNpdmVcbiAgICAgICAgICAgICAgIHJlc3BvbnNpdmU6IHRydWUsXG5cbiAgICAgICAgICAgICAgIC8vQm9vbGVhbiAtIFdoZXRoZXIgd2Ugc2hvdWxkIHNob3cgYSBzdHJva2Ugb24gZWFjaCBzZWdtZW50XG4gICAgICAgICAgICAgICBzZWdtZW50U2hvd1N0cm9rZTogdHJ1ZSxcblxuICAgICAgICAgICAgICAgLy9TdHJpbmcgLSBUaGUgY29sb3VyIG9mIGVhY2ggc2VnbWVudCBzdHJva2VcbiAgICAgICAgICAgICAgIHNlZ21lbnRTdHJva2VDb2xvcjogJyNmZmYnLFxuXG4gICAgICAgICAgICAgICAvL051bWJlciAtIFRoZSB3aWR0aCBvZiBlYWNoIHNlZ21lbnQgc3Ryb2tlXG4gICAgICAgICAgICAgICBzZWdtZW50U3Ryb2tlV2lkdGg6IDIsXG5cbiAgICAgICAgICAgICAgIC8vTnVtYmVyIC0gVGhlIHBlcmNlbnRhZ2Ugb2YgdGhlIGNoYXJ0IHRoYXQgd2UgY3V0IG91dCBvZiB0aGUgbWlkZGxlXG4gICAgICAgICAgICAgICBwZXJjZW50YWdlSW5uZXJDdXRvdXQ6IDUwLCAvLyBUaGlzIGlzIDAgZm9yIFBpZSBjaGFydHNcblxuICAgICAgICAgICAgICAgLy9OdW1iZXIgLSBBbW91bnQgb2YgYW5pbWF0aW9uIHN0ZXBzXG4gICAgICAgICAgICAgICBhbmltYXRpb25TdGVwczogMTAwLFxuXG4gICAgICAgICAgICAgICAvL1N0cmluZyAtIEFuaW1hdGlvbiBlYXNpbmcgZWZmZWN0XG4gICAgICAgICAgICAgICBhbmltYXRpb25FYXNpbmc6ICdlYXNlT3V0Qm91bmNlJyxcblxuICAgICAgICAgICAgICAgLy9Cb29sZWFuIC0gV2hldGhlciB3ZSBhbmltYXRlIHRoZSByb3RhdGlvbiBvZiB0aGUgRG91Z2hudXRcbiAgICAgICAgICAgICAgIGFuaW1hdGVSb3RhdGU6IHRydWUsXG5cbiAgICAgICAgICAgICAgIC8vQm9vbGVhbiAtIFdoZXRoZXIgd2UgYW5pbWF0ZSBzY2FsaW5nIHRoZSBEb3VnaG51dCBmcm9tIHRoZSBjZW50cmVcbiAgICAgICAgICAgICAgIGFuaW1hdGVTY2FsZTogZmFsc2UsXG5cbiAgICAgICAgICAgICAgIC8vU3RyaW5nIC0gQSBsZWdlbmQgdGVtcGxhdGVcbiAgICAgICAgICAgICAgIGxlZ2VuZFRlbXBsYXRlOiAnPHVsIGNsYXNzPVwidGMtY2hhcnQtanMtbGVnZW5kXCI+PCUgZm9yICh2YXIgaT0wOyBpPHNlZ21lbnRzLmxlbmd0aDsgaSsrKXslPjxsaT48c3BhbiBzdHlsZT1cImJhY2tncm91bmQtY29sb3I6PCU9c2VnbWVudHNbaV0uZmlsbENvbG9yJT5cIj48L3NwYW4+PCVpZihzZWdtZW50c1tpXS5sYWJlbCl7JT48JT1zZWdtZW50c1tpXS5sYWJlbCU+PCV9JT48L2xpPjwlfSU+PC91bD4nXG5cbiAgICAgICAgICAgfTtcblxuICAgICAgfVxuXG4gICAgICAkc2NvcGUucHJlcGFyZUNvbnZlcnNpb25SYXRlUGllQ2hhcnQgPSBmdW5jdGlvbihmaWZ0eSxodW5kcmVkKXtcbiAgICAgICAgICAgICRzY29wZS5jb252ZXJzaW9uRGF0YSA9IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICB2YWx1ZTogZmlmdHksXG4gICAgICAgICAgICBjb2xvcjonI0Y3NDY0QScsXG4gICAgICAgICAgICBoaWdobGlnaHQ6ICcjRkY1QTVFJyxcbiAgICAgICAgICAgIGxhYmVsOiAnSGFsZiBDZW50dXJpZXMnXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICB2YWx1ZTogaHVuZHJlZCxcbiAgICAgICAgICAgIGNvbG9yOiAnI0ZEQjQ1QycsXG4gICAgICAgICAgICBoaWdobGlnaHQ6ICcjRkZDODcwJyxcbiAgICAgICAgICAgIGxhYmVsOiAnQ2VudHVyaWVzJ1xuICAgICAgICAgIH1cbiAgICAgICAgXTtcblxuICAgICAgICAvLyBDaGFydC5qcyBPcHRpb25zXG4gICAgICAgICRzY29wZS5jb252ZXJzaW9uT3B0aW9ucyA9ICB7XG5cbiAgICAgICAgICAvLyBTZXRzIHRoZSBjaGFydCB0byBiZSByZXNwb25zaXZlXG4gICAgICAgICAgcmVzcG9uc2l2ZTogdHJ1ZSxcblxuICAgICAgICAgIC8vQm9vbGVhbiAtIFdoZXRoZXIgd2Ugc2hvdWxkIHNob3cgYSBzdHJva2Ugb24gZWFjaCBzZWdtZW50XG4gICAgICAgICAgc2VnbWVudFNob3dTdHJva2UgOiB0cnVlLFxuXG4gICAgICAgICAgLy9TdHJpbmcgLSBUaGUgY29sb3VyIG9mIGVhY2ggc2VnbWVudCBzdHJva2VcbiAgICAgICAgICBzZWdtZW50U3Ryb2tlQ29sb3IgOiAnI2ZmZicsXG5cbiAgICAgICAgICAvL051bWJlciAtIFRoZSB3aWR0aCBvZiBlYWNoIHNlZ21lbnQgc3Ryb2tlXG4gICAgICAgICAgc2VnbWVudFN0cm9rZVdpZHRoIDogMixcblxuICAgICAgICAgIC8vTnVtYmVyIC0gVGhlIHBlcmNlbnRhZ2Ugb2YgdGhlIGNoYXJ0IHRoYXQgd2UgY3V0IG91dCBvZiB0aGUgbWlkZGxlXG4gICAgICAgICAgcGVyY2VudGFnZUlubmVyQ3V0b3V0IDogMCwgLy8gVGhpcyBpcyAwIGZvciBQaWUgY2hhcnRzXG5cbiAgICAgICAgICAvL051bWJlciAtIEFtb3VudCBvZiBhbmltYXRpb24gc3RlcHNcbiAgICAgICAgICBhbmltYXRpb25TdGVwcyA6IDEwMCxcblxuICAgICAgICAgIC8vU3RyaW5nIC0gQW5pbWF0aW9uIGVhc2luZyBlZmZlY3RcbiAgICAgICAgICBhbmltYXRpb25FYXNpbmcgOiAnZWFzZU91dEJvdW5jZScsXG5cbiAgICAgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIHdlIGFuaW1hdGUgdGhlIHJvdGF0aW9uIG9mIHRoZSBEb3VnaG51dFxuICAgICAgICAgIGFuaW1hdGVSb3RhdGUgOiB0cnVlLFxuXG4gICAgICAgICAgLy9Cb29sZWFuIC0gV2hldGhlciB3ZSBhbmltYXRlIHNjYWxpbmcgdGhlIERvdWdobnV0IGZyb20gdGhlIGNlbnRyZVxuICAgICAgICAgIGFuaW1hdGVTY2FsZSA6IGZhbHNlLFxuXG4gICAgICAgICAgLy9TdHJpbmcgLSBBIGxlZ2VuZCB0ZW1wbGF0ZVxuICAgICAgICAgIGxlZ2VuZFRlbXBsYXRlIDogJzx1bCBjbGFzcz1cInRjLWNoYXJ0LWpzLWxlZ2VuZFwiPjwlIGZvciAodmFyIGk9MDsgaTxzZWdtZW50cy5sZW5ndGg7IGkrKyl7JT48bGk+PHNwYW4gc3R5bGU9XCJiYWNrZ3JvdW5kLWNvbG9yOjwlPXNlZ21lbnRzW2ldLmZpbGxDb2xvciU+XCI+PC9zcGFuPjwlaWYoc2VnbWVudHNbaV0ubGFiZWwpeyU+PCU9c2VnbWVudHNbaV0ubGFiZWwlPjwlfSU+PC9saT48JX0lPjwvdWw+J1xuXG4gICAgICAgIH07XG4gICAgICB9XG5cblxuICAgIH0pXG4iLCJhbmd1bGFyLm1vZHVsZSgnYXBwJylcbiAgICAuY29udHJvbGxlcigncnVuc1N0YXRzQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSkge1xuICAgICAgJHNjb3BlLiR3YXRjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICByZXR1cm4gJHNjb3BlLnJ1bnNTdGF0cztcbiAgICAgICAgICAgfSwgZnVuY3Rpb24obikge1xuICAgICAgICAgICAgICAgaWYoIW4pcmV0dXJuXG4gICAgICAgICAgICAgICAkc2NvcGUuYW5hbHl6ZUlubmluZ3MoJHNjb3BlLnJ1bnNTdGF0cylcbiAgICAgICAgICAgfSk7XG5cblxuICAgICAgJHNjb3BlLmFuYWx5emVJbm5pbmdzID0gZnVuY3Rpb24oYWxsSW5uaW5ncyl7XG4gICAgICAgIC8vUnVucyBvdmVyIHRoZSB5ZWFyc1xuICAgICAgICB2YXIgcnVuc0J5WWVhciA9IFtdO1xuICAgICAgICBhbGxJbm5pbmdzLm1hcChmdW5jdGlvbihyZXMpe1xuICAgICAgICAgIHZhciB5ZWFyID0gcmVzLnllYXI7XG4gICAgICAgICAgaWYodHlwZW9mKHJ1bnNCeVllYXJbeWVhcl0pID09IFwidW5kZWZpbmVkXCIpe1xuICAgICAgICAgICAgICBydW5zQnlZZWFyW3llYXJdID0gW11cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYodHlwZW9mKHJ1bnNCeVllYXJbeWVhcl0pID09IFwibnVtYmVyXCIpe1xuICAgICAgICAgICAgICByZXR1cm4gcnVuc0J5WWVhclt5ZWFyXSArPSBwYXJzZUludChyZXMucnVucylcbiAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIHJldHVybiBydW5zQnlZZWFyW3llYXJdID0gcGFyc2VJbnQocmVzLnJ1bnMpXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAkc2NvcGUucHJlcGFyZVJ1bnNCeVllYXJHcmFwaChydW5zQnlZZWFyKVxuXG4gICAgICB9XG5cblxuICAgICAgJHNjb3BlLnByZXBhcmVSdW5zQnlZZWFyR3JhcGggPSBmdW5jdGlvbiAocnVuc0J5WWVhcil7XG4gICAgICAgIHZhciB5ZWFycyA9IFtdXG4gICAgICAgIHZhciBydW5zID0gW11cbiAgICAgICAgZm9yKHZhciB5ZWFyIGluIHJ1bnNCeVllYXIpIHtcbiAgICAgICAgICBpZihydW5zQnlZZWFyLmhhc093blByb3BlcnR5KHllYXIpKSB7XG4gICAgICAgICAgICB5ZWFycy5wdXNoKHllYXIpO1xuICAgICAgICAgICAgcnVucy5wdXNoKHJ1bnNCeVllYXJbeWVhcl0pXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhciBjb2xvcnMgPSBbXTtcbiAgICAgICAgcnVucy5tYXAoZnVuY3Rpb24ocmVzLCBrZXkpe1xuICAgICAgICAgIGlmKHJlcyA+PSAxMDAwKXtcbiAgICAgICAgICAgIHJldHVybiBjb2xvcnNba2V5XSA9IFwieWVsbG93XCJcbiAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIHJldHVybiBjb2xvcnNba2V5XSA9IFwiYmx1ZVwiXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuXG4gICAgICAgICRzY29wZS55ZWFyQmFyZGF0YSA9IHtcbiAgICAgICAgICAgICAgIGxhYmVsczogeWVhcnMsXG4gICAgICAgICAgICAgICBkYXRhc2V0czogW3tcbiAgICAgICAgICAgICAgICAgICBsYWJlbDogJ1J1bnMgT3ZlciB0aGUgeWVhcnMnLFxuICAgICAgICAgICAgICAgICAgIGZpbGxDb2xvcjogY29sb3JzLFxuICAgICAgICAgICAgICAgICAgIHN0cm9rZUNvbG9yOiAncmdiYSgyMjAsMjIwLDIyMCwxKScsXG4gICAgICAgICAgICAgICAgICAgcG9pbnRDb2xvcjogJ3JnYmEoMjIwLDIyMCwyMjAsMSknLFxuICAgICAgICAgICAgICAgICAgIHBvaW50U3Ryb2tlQ29sb3I6ICcjZmZmJyxcbiAgICAgICAgICAgICAgICAgICBwb2ludEhpZ2hsaWdodEZpbGw6ICcjZmZmJyxcbiAgICAgICAgICAgICAgICAgICBwb2ludEhpZ2hsaWdodFN0cm9rZTogJ3JnYmEoMjIwLDIyMCwyMjAsMSknLFxuICAgICAgICAgICAgICAgICAgIGRhdGE6IHJ1bnNcbiAgICAgICAgICAgICAgIH1dXG4gICAgICAgICAgIH07XG5cbiAgICAgICAgICAgLy8gQ2hhcnQuanMgT3B0aW9uc1xuICAgICAgICAgICAkc2NvcGUueWVhckJhcm9wdGlvbnMgPSB7XG5cbiAgICAgICAgICAgICAgIC8vIFNldHMgdGhlIGNoYXJ0IHRvIGJlIHJlc3BvbnNpdmVcbiAgICAgICAgICAgICAgIHJlc3BvbnNpdmU6IHRydWUsXG5cbiAgICAgICAgICAgICAgIC8vQm9vbGVhbiAtIFdoZXRoZXIgdGhlIHNjYWxlIHNob3VsZCBzdGFydCBhdCB6ZXJvLCBvciBhbiBvcmRlciBvZiBtYWduaXR1ZGUgZG93biBmcm9tIHRoZSBsb3dlc3QgdmFsdWVcbiAgICAgICAgICAgICAgIHNjYWxlQmVnaW5BdFplcm86IHRydWUsXG5cbiAgICAgICAgICAgICAgIC8vQm9vbGVhbiAtIFdoZXRoZXIgZ3JpZCBsaW5lcyBhcmUgc2hvd24gYWNyb3NzIHRoZSBjaGFydFxuICAgICAgICAgICAgICAgc2NhbGVTaG93R3JpZExpbmVzOiB0cnVlLFxuXG4gICAgICAgICAgICAgICAvL1N0cmluZyAtIENvbG91ciBvZiB0aGUgZ3JpZCBsaW5lc1xuICAgICAgICAgICAgICAgc2NhbGVHcmlkTGluZUNvbG9yOiBcInJnYmEoMCwwLDAsLjA1KVwiLFxuXG4gICAgICAgICAgICAgICAvL051bWJlciAtIFdpZHRoIG9mIHRoZSBncmlkIGxpbmVzXG4gICAgICAgICAgICAgICBzY2FsZUdyaWRMaW5lV2lkdGg6IDEsXG5cbiAgICAgICAgICAgICAgIC8vQm9vbGVhbiAtIElmIHRoZXJlIGlzIGEgc3Ryb2tlIG9uIGVhY2ggYmFyXG4gICAgICAgICAgICAgICBiYXJTaG93U3Ryb2tlOiB0cnVlLFxuXG4gICAgICAgICAgICAgICAvL051bWJlciAtIFBpeGVsIHdpZHRoIG9mIHRoZSBiYXIgc3Ryb2tlXG4gICAgICAgICAgICAgICBiYXJTdHJva2VXaWR0aDogMixcblxuICAgICAgICAgICAgICAgLy9OdW1iZXIgLSBTcGFjaW5nIGJldHdlZW4gZWFjaCBvZiB0aGUgWCB2YWx1ZSBzZXRzXG4gICAgICAgICAgICAgICBiYXJWYWx1ZVNwYWNpbmc6IDUsXG5cbiAgICAgICAgICAgICAgIC8vTnVtYmVyIC0gU3BhY2luZyBiZXR3ZWVuIGRhdGEgc2V0cyB3aXRoaW4gWCB2YWx1ZXNcbiAgICAgICAgICAgICAgIGJhckRhdGFzZXRTcGFjaW5nOiAxLFxuXG4gICAgICAgICAgICAgICAvL1N0cmluZyAtIEEgbGVnZW5kIHRlbXBsYXRlXG4gICAgICAgICAgICAgICBsZWdlbmRUZW1wbGF0ZTogJzx1bCBjbGFzcz1cInRjLWNoYXJ0LWpzLWxlZ2VuZFwiPjwlIGZvciAodmFyIGk9MDsgaTxkYXRhc2V0cy5sZW5ndGg7IGkrKyl7JT48bGk+PHNwYW4gc3R5bGU9XCJiYWNrZ3JvdW5kLWNvbG9yOjwlPWRhdGFzZXRzW2ldLmZpbGxDb2xvciU+XCI+PC9zcGFuPjwlaWYoZGF0YXNldHNbaV0ubGFiZWwpeyU+PCU9ZGF0YXNldHNbaV0ubGFiZWwlPjwlfSU+PC9saT48JX0lPjwvdWw+J1xuICAgICAgICAgICB9O1xuICAgICAgfVxuXG5cbn0pXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
