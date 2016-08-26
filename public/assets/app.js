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

//Things we can get from the data : -
//Total matches played -done
//Total centuries scored - done
//runs scored in a year
//centuries scored in a year - done
//half centuries scored in a year - done
//half centuries coverted into century
//nervous nineties
//score against the teams
//score in the winning cause - done
//bowling figures- done
//performance in close matches
//batting first performance
//moving average, longitudanal career growth
//1000 Runs in one calendar year
//batting second performance (while chasing)

//TODO:
//Get centuries by country
//Get centuries by year
//Get runs by country
//Get runs by year
//Get runs by winning
//Get runs by loosing
//Get centuries in winning cause



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
            var notOuts = 0;
            var didNotBat = 0;
            var wicketsTaken = 0;
            var runsConceded = 0;
            var catches = 0;
            angular.forEach(data, function(value) {
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
            allCenturies: {centuriesScored,halfCenturiesScored}
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
        //Send array of colors to chartjs
        var colors = [];
        centuryStats.centuriesScored.map(function(res, key){
          if(res.result == "won"){
            colors[key] = "#0084FF"
          }else if(res.result == "lost"){
            colors[key] = "#ED3F2F"
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
        //$scope.prepareDoughnutChart(won.length, lost.length, tied.length, noresult.length)
        $scope.prepareLineGraph(centuryByYear,halfCenturyByYear);
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


    }])

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZHVsZS5qcyIsImNvbnRyb2xsZXJzL2hvbWVDdHJsLmpzIiwiY29udHJvbGxlcnMvbWFzdGVyQ3RybC5qcyIsImNvbnRyb2xsZXJzL3JvdXRlcy5qcyIsImRpcmVjdGl2ZXMvY2FyZWVyU3RhdHMuanMiLCJkaXJlY3RpdmVzL2NlbnR1cnlTdGF0cy5qcyIsImRpcmVjdGl2ZXMvcGVyc29uYWxJbmZvLmpzIiwic2VydmljZXMvZGF0YU11dGF0b3IuanMiLCJjb250cm9sbGVycy9wYXJ0aWFscy9jZW50dXJ5U3RhdHNDdHJsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFFBQUEsT0FBQSxNQUFBO0VBQ0EsVUFBQSxZQUFBOzs7QUNEQSxRQUFBLE9BQUE7S0FDQSxXQUFBLCtDQUFBLFNBQUEsUUFBQSxPQUFBLGFBQUE7UUFDQSxPQUFBLFFBQUEsV0FBQTtVQUNBLFlBQUE7V0FDQSxLQUFBLFNBQUEsVUFBQTtnQkFDQSxZQUFBLFVBQUEsU0FBQSxNQUFBLFNBQUEsSUFBQTtvQkFDQSxZQUFBLGVBQUEsS0FBQSxTQUFBLE1BQUE7c0JBQ0EsUUFBQSxJQUFBO3NCQUNBLE9BQUEsUUFBQTs7O2FBR0EsU0FBQSxLQUFBO2dCQUNBLFFBQUEsSUFBQTs7O1FBR0EsT0FBQTs7O0FDZkEsUUFBQSxPQUFBO0tBQ0EsV0FBQSx1Q0FBQSxTQUFBLFFBQUEsWUFBQTtRQUNBLFFBQUEsSUFBQTs7O0FDRkEsUUFBQSxPQUFBO0tBQ0EscUVBQUEsU0FBQSxnQkFBQSxvQkFBQSxtQkFBQTs7UUFFQSxtQkFBQSxVQUFBOztRQUVBO2FBQ0EsTUFBQSxPQUFBO2dCQUNBLEtBQUE7Z0JBQ0EsT0FBQTtvQkFDQSxVQUFBO3dCQUNBLGFBQUE7O29CQUVBLFdBQUE7d0JBQ0EsYUFBQTt3QkFDQSxZQUFBOzs7Ozs7O1NBT0EsTUFBQSxZQUFBO1lBQ0EsS0FBQTtZQUNBLE9BQUE7Z0JBQ0EsWUFBQTtvQkFDQSxhQUFBO29CQUNBLFlBQUE7Ozs7Ozs7OztRQVNBLGtCQUFBLFVBQUE7Ozs7QUNuQ0EsUUFBQSxPQUFBO0tBQ0EsVUFBQSxlQUFBLFdBQUE7UUFDQSxNQUFBO1lBQ0EsVUFBQTtZQUNBLE9BQUE7Z0JBQ0EsT0FBQTs7WUFFQSxhQUFBOzs7OztBQ1BBLFFBQUEsT0FBQTtLQUNBLFVBQUEsZ0JBQUEsV0FBQTtRQUNBLE1BQUE7WUFDQSxVQUFBO1lBQ0EsT0FBQTtnQkFDQSxjQUFBOztZQUVBLGFBQUE7WUFDQSxZQUFBOzs7O0FDUkEsUUFBQSxPQUFBO0tBQ0EsVUFBQSxnQkFBQSxXQUFBO1FBQ0EsTUFBQTtZQUNBLFVBQUE7WUFDQSxhQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUN5QkEsUUFBQSxPQUFBO0tBQ0EsUUFBQSx5QkFBQSxTQUFBLE9BQUE7UUFDQSxNQUFBO1lBQ0EsU0FBQTtZQUNBLFdBQUE7WUFDQSxnQkFBQTs7OztRQUlBLFNBQUEsVUFBQTtZQUNBLE9BQUEsTUFBQSxJQUFBOzs7UUFHQSxTQUFBLFVBQUEsS0FBQSxVQUFBO1lBQ0EsSUFBQSxNQUFBLElBQUEsTUFBQTtZQUNBLElBQUEsU0FBQTtZQUNBLElBQUEsUUFBQSxNQUFBLEdBQUEsTUFBQTtZQUNBLElBQUEsSUFBQSxFQUFBLEVBQUEsRUFBQSxNQUFBLFFBQUEsRUFBQSxJQUFBO2dCQUNBLElBQUEsTUFBQTtnQkFDQSxJQUFBLFlBQUEsTUFBQSxHQUFBLE1BQUE7Z0JBQ0EsSUFBQSxJQUFBLEVBQUEsRUFBQSxFQUFBLFFBQUEsT0FBQSxJQUFBO2tCQUNBLElBQUEsUUFBQSxNQUFBLFlBQUE7O2dCQUVBLE9BQUEsS0FBQTs7WUFFQSxRQUFBLElBQUE7WUFDQSxHQUFBLGFBQUEsT0FBQSxhQUFBLGFBQUE7Z0JBQ0EsT0FBQSxTQUFBOztVQUVBLE9BQUE7OztRQUdBLFNBQUEsZUFBQSxNQUFBLFVBQUE7WUFDQSxJQUFBLGVBQUEsS0FBQTtZQUNBLElBQUEsWUFBQTtZQUNBLElBQUEsa0JBQUE7WUFDQSxJQUFBLHNCQUFBO1lBQ0EsSUFBQSxVQUFBO1lBQ0EsSUFBQSxZQUFBO1lB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Q0Esb0JBQUE7Y0FDQSxzQkFBQTtjQUNBLE1BQUE7O1lBRUE7Y0FDQSxPQUFBO2NBQ0EsV0FBQSxDQUFBO2NBQ0EsYUFBQTtjQUNBLFlBQUE7Y0FDQSxrQkFBQTtjQUNBLG9CQUFBO2NBQ0Esc0JBQUE7Y0FDQSxNQUFBOzs7Ozs7UUFNQSxPQUFBLGVBQUE7OztVQUdBLFlBQUE7OztVQUdBLHFCQUFBOzs7VUFHQSxxQkFBQTs7O1VBR0EscUJBQUE7OztVQUdBLGNBQUE7OztVQUdBLHFCQUFBOzs7VUFHQSxXQUFBOzs7VUFHQSxpQkFBQTs7O1VBR0Esc0JBQUE7OztVQUdBLDBCQUFBOzs7VUFHQSxnQkFBQTs7O1VBR0EscUJBQUE7OztVQUdBLGNBQUE7OztVQUdBLHFCQUFBLFVBQUE7OztVQUdBLHFCQUFBLFVBQUE7OztVQUdBLGlCQUFBOzs7TUFHQSxPQUFBLHVCQUFBLFNBQUEsS0FBQSxNQUFBLE1BQUEsU0FBQTtRQUNBLE9BQUEsWUFBQSxDQUFBO2VBQ0EsT0FBQTtlQUNBLE9BQUE7ZUFDQSxXQUFBO2VBQ0EsT0FBQTtjQUNBO2VBQ0EsT0FBQTtlQUNBLE9BQUE7ZUFDQSxXQUFBO2VBQ0EsT0FBQTtjQUNBO2VBQ0EsT0FBQTtlQUNBLE9BQUE7ZUFDQSxXQUFBO2VBQ0EsT0FBQTtjQUNBO2VBQ0EsT0FBQTtlQUNBLE9BQUE7ZUFDQSxXQUFBO2VBQ0EsT0FBQTs7Ozs7V0FLQSxPQUFBLFVBQUE7OztlQUdBLFlBQUE7OztlQUdBLG1CQUFBOzs7ZUFHQSxvQkFBQTs7O2VBR0Esb0JBQUE7OztlQUdBLHVCQUFBOzs7ZUFHQSxnQkFBQTs7O2VBR0EsaUJBQUE7OztlQUdBLGVBQUE7OztlQUdBLGNBQUE7OztlQUdBLGdCQUFBOzs7Ozs7OztBQVFBIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbImFuZ3VsYXIubW9kdWxlKCdhcHAnLFtcbiAgJ25nUm91dGUnLCd1aS5yb3V0ZXInLCd0Yy5jaGFydGpzJ1xuXSlcbiIsImFuZ3VsYXIubW9kdWxlKCdhcHAnKVxuICAgIC5jb250cm9sbGVyKCdob21lQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJGh0dHAsIGRhdGFNdXRhdG9yKSB7XG4gICAgICAgICRzY29wZS5zZXR1cCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGRhdGFNdXRhdG9yLmdldERhdGEoKVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgZGF0YU11dGF0b3IuY3N2VG9KU09OKHJlc3BvbnNlLmRhdGEsIGZ1bmN0aW9uKGNzdil7XG4gICAgICAgICAgICAgICAgICAgIGRhdGFNdXRhdG9yLmdldENhcmVlclN0YXRzKGNzdiwgZnVuY3Rpb24oc3RhdHMpe1xuICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHN0YXRzKVxuICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zdGF0cyA9IHN0YXRzXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICB9LCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgJHNjb3BlLnNldHVwKCk7ICAgICAgICBcbiAgICB9KVxuIiwiYW5ndWxhci5tb2R1bGUoJ2FwcCcpXG4gICAgLmNvbnRyb2xsZXIoJ21hc3RlckN0cmwnLCBmdW5jdGlvbigkc2NvcGUsICRyb290U2NvcGUpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJtYXN0ZXJDdHJsXCIpO1xuICAgIH0pXG4iLCJhbmd1bGFyLm1vZHVsZSgnYXBwJylcbiAgICAuY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyKSB7XG5cbiAgICAgICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnLycpO1xuXG4gICAgICAgICRzdGF0ZVByb3ZpZGVyXG4gICAgICAgICAgICAuc3RhdGUoJ2FwcCcsIHtcbiAgICAgICAgICAgICAgICB1cmw6ICcvJyxcbiAgICAgICAgICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgICAgICAgICAnaGVhZGVyJzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvbmF2Lmh0bWwnLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAnY29udGVudCc6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL2hvbWUuaHRtbCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnaG9tZUN0cmwnXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuXG5cblxuICAgICAgICAuc3RhdGUoJ2FwcC5ob21lJywge1xuICAgICAgICAgICAgdXJsOiAnaG9tZScsXG4gICAgICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgICAgICdjb250ZW50QCc6IHtcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd1c2Vycy9ob21lLmh0bWwnLFxuICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnaG9tZUN0cmwnXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0pXG5cblxuXG5cbiAgICAgICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpXG5cbiAgICB9KTtcbiIsImFuZ3VsYXIubW9kdWxlKCdhcHAnKVxuICAgIC5kaXJlY3RpdmUoJ2NhcmVlclN0YXRzJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybntcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge1xuICAgICAgICAgICAgICAgIHN0YXRzOiAnPWl0ZW0nLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAncGFydGlhbHMvY2FyZWVyU3RhdHMuaHRtbCdcbiAgICAgICAgICAgICAgICAvL2NvbnRyb2xsZXI6ICdhcHAucGFydGlhbHMudmVudWVzLnZlbnVlSXRlbUN0cmwnXG4gICAgICAgIH1cbiAgICB9KVxuIiwiYW5ndWxhci5tb2R1bGUoJ2FwcCcpXG4gICAgLmRpcmVjdGl2ZSgnY2VudHVyeVN0YXRzJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybntcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge1xuICAgICAgICAgICAgICAgIGNlbnR1cnlTdGF0czogJz1pdGVtJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3BhcnRpYWxzL2NlbnR1cnlTdGF0cy5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdjZW50dXJ5U3RhdHNDdHJsJ1xuICAgICAgICB9XG4gICAgfSlcbiIsImFuZ3VsYXIubW9kdWxlKCdhcHAnKVxuICAgIC5kaXJlY3RpdmUoJ3BlcnNvbmFsSW5mbycsIGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm57XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLCAgICAgICAgICAgIFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdwYXJ0aWFscy9wZXJzb25hbEluZm8uaHRtbCdcbiAgICAgICAgfVxuICAgIH0pXG4iLCIvL1RoaW5ncyB3ZSBjYW4gZ2V0IGZyb20gdGhlIGRhdGEgOiAtXG4vL1RvdGFsIG1hdGNoZXMgcGxheWVkIC1kb25lXG4vL1RvdGFsIGNlbnR1cmllcyBzY29yZWQgLSBkb25lXG4vL3J1bnMgc2NvcmVkIGluIGEgeWVhclxuLy9jZW50dXJpZXMgc2NvcmVkIGluIGEgeWVhciAtIGRvbmVcbi8vaGFsZiBjZW50dXJpZXMgc2NvcmVkIGluIGEgeWVhciAtIGRvbmVcbi8vaGFsZiBjZW50dXJpZXMgY292ZXJ0ZWQgaW50byBjZW50dXJ5XG4vL25lcnZvdXMgbmluZXRpZXNcbi8vc2NvcmUgYWdhaW5zdCB0aGUgdGVhbXNcbi8vc2NvcmUgaW4gdGhlIHdpbm5pbmcgY2F1c2UgLSBkb25lXG4vL2Jvd2xpbmcgZmlndXJlcy0gZG9uZVxuLy9wZXJmb3JtYW5jZSBpbiBjbG9zZSBtYXRjaGVzXG4vL2JhdHRpbmcgZmlyc3QgcGVyZm9ybWFuY2Vcbi8vbW92aW5nIGF2ZXJhZ2UsIGxvbmdpdHVkYW5hbCBjYXJlZXIgZ3Jvd3RoXG4vLzEwMDAgUnVucyBpbiBvbmUgY2FsZW5kYXIgeWVhclxuLy9iYXR0aW5nIHNlY29uZCBwZXJmb3JtYW5jZSAod2hpbGUgY2hhc2luZylcblxuLy9UT0RPOlxuLy9HZXQgY2VudHVyaWVzIGJ5IGNvdW50cnlcbi8vR2V0IGNlbnR1cmllcyBieSB5ZWFyXG4vL0dldCBydW5zIGJ5IGNvdW50cnlcbi8vR2V0IHJ1bnMgYnkgeWVhclxuLy9HZXQgcnVucyBieSB3aW5uaW5nXG4vL0dldCBydW5zIGJ5IGxvb3Npbmdcbi8vR2V0IGNlbnR1cmllcyBpbiB3aW5uaW5nIGNhdXNlXG5cblxuXG4vL05PVEU6IE9uY2UgYWxsIGRhdGEgaXMgY29sbGVjdGVkIGNsZWFuIG91dCB0aGUgY2FsbGJhY2sgaGVsbCA6UFxuYW5ndWxhci5tb2R1bGUoJ2FwcCcpXG4gICAgLnNlcnZpY2UoJ2RhdGFNdXRhdG9yJywgZnVuY3Rpb24oJGh0dHApIHtcbiAgICAgICAgcmV0dXJue1xuICAgICAgICAgICAgZ2V0RGF0YTogZ2V0RGF0YSxcbiAgICAgICAgICAgIGNzdlRvSlNPTjogY3N2VG9KU09OLFxuICAgICAgICAgICAgZ2V0Q2FyZWVyU3RhdHM6IGdldENhcmVlclN0YXRzXG5cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGdldERhdGEoKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvZGF0YS9zYWNoaW4uY3N2JylcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGNzdlRvSlNPTihjc3YsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICB2YXIgbGluZXM9Y3N2LnNwbGl0KFwiXFxuXCIpO1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgICAgICAgICAgdmFyIGhlYWRlcnM9bGluZXNbMF0uc3BsaXQoXCIsXCIpO1xuICAgICAgICAgICAgZm9yKHZhciBpPTE7aTxsaW5lcy5sZW5ndGggLTE7aSsrKXtcbiAgICAgICAgICAgICAgICB2YXIgb2JqID0ge307XG4gICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRsaW5lPWxpbmVzW2ldLnNwbGl0KFwiLFwiKTtcbiAgICAgICAgICAgICAgICBmb3IodmFyIGo9MDtqPGhlYWRlcnMubGVuZ3RoO2orKyl7XG4gICAgICAgICAgICAgICAgICBvYmpbaGVhZGVyc1tqXV0gPSBjdXJyZW50bGluZVtqXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2gob2JqKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3VsdClcbiAgICAgICAgICAgIGlmKGNhbGxiYWNrICYmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKHJlc3VsdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGdldENhcmVlclN0YXRzKGRhdGEsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICB2YXIgdG90YWxNYXRjaGVzID0gZGF0YS5sZW5ndGg7XG4gICAgICAgICAgICB2YXIgdG90YWxSdW5zID0gMDtcbiAgICAgICAgICAgIHZhciBjZW50dXJpZXNTY29yZWQgPSBbXTtcbiAgICAgICAgICAgIHZhciBoYWxmQ2VudHVyaWVzU2NvcmVkID0gW107XG4gICAgICAgICAgICB2YXIgbm90T3V0cyA9IDA7XG4gICAgICAgICAgICB2YXIgZGlkTm90QmF0ID0gMDtcbiAgICAgICAgICAgIHZhciB3aWNrZXRzVGFrZW4gPSAwO1xuICAgICAgICAgICAgdmFyIHJ1bnNDb25jZWRlZCA9IDA7XG4gICAgICAgICAgICB2YXIgY2F0Y2hlcyA9IDA7XG4gICAgICAgICAgICBhbmd1bGFyLmZvckVhY2goZGF0YSwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgICAgdmFyIGNlbnR1cnlEZXRhaWwgPSB7fTtcbiAgICAgICAgICAgICAgdmFyIGhhbGZDZW50dXJ5RGV0YWlsID0ge307XG5cbiAgICAgICAgICAgICAgLy9CYXR0aW5nIHN0YXRzXG5cbiAgICAgICAgICAgICAgLy9jaGVjayB0byBzZWUgaWYgdGhlIHNjb3JlIGNvbnRhaW5zIGEgKiBpbiB0aGUgZW5kIHdoaWNoIGRlbnRvZXMgTm90T3V0cywgaWYgeWVzIHJlbW92ZSBmb3IgY2FsY3VsYXRpb25zXG4gICAgICAgICAgICAgIGlmKHZhbHVlLmJhdHRpbmdfc2NvcmUuaW5kZXhPZihcIipcIikgPiAtMSl7XG4gICAgICAgICAgICAgICAgdmFsdWUuYmF0dGluZ19zY29yZSA9IHZhbHVlLmJhdHRpbmdfc2NvcmUucmVwbGFjZSgnKicsJycpO1xuICAgICAgICAgICAgICAgIG5vdE91dHMrKztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAvL2lmIHRoZSB2YWx1ZSBvZiBzY29yZSBpcyBOb3QgYSBudW1iZXIgLCBpdCBtZWFucyBpdCBjb3VsZCBiZSBETkIoZGlkIG5vdCBiYXQpIG9yIFRETkIgKHRlYW0gZGlkIG5vdCBiYXQpXG4gICAgICAgICAgICAgIGlmKGlzTmFOKHZhbHVlLmJhdHRpbmdfc2NvcmUpKXtcbiAgICAgICAgICAgICAgICBkaWROb3RCYXQrKztcbiAgICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICAgLy9Db252ZXJ0aW5nIHRoZSBzdHJpbmcgdG8gaW50ZWdlcnMgdG8gZG8gY2FsY3VsYXRpb25zXG4gICAgICAgICAgICAgICAgdmFsdWUuYmF0dGluZ19zY29yZSA9IHBhcnNlSW50KHZhbHVlLmJhdHRpbmdfc2NvcmUpXG4gICAgICAgICAgICAgICAgLy9DaGVja2luZyB0byBzZWUgaWYgdGhlIHNjb3JlIHdhcyBhIGhhbGYgY2VudHVyeSBvciBjZW50dXJ5XG4gICAgICAgICAgICAgICAgaWYodmFsdWUuYmF0dGluZ19zY29yZSA+PSA1MCAmJiB2YWx1ZS5iYXR0aW5nX3Njb3JlIDwgMTAwKXtcbiAgICAgICAgICAgICAgICAgIGhhbGZDZW50dXJ5RGV0YWlsLnJ1bnMgPSB2YWx1ZS5iYXR0aW5nX3Njb3JlXG4gICAgICAgICAgICAgICAgICBoYWxmQ2VudHVyeURldGFpbC5hZ2FpbnN0ID0gdmFsdWUub3Bwb3NpdGlvblxuICAgICAgICAgICAgICAgICAgaGFsZkNlbnR1cnlEZXRhaWwucmVzdWx0ID0gdmFsdWUubWF0Y2hfcmVzdWx0XG4gICAgICAgICAgICAgICAgICBoYWxmQ2VudHVyeURldGFpbC5pbm5pbmdzID0gdmFsdWUuYmF0dGluZ19pbm5pbmdzXG4gICAgICAgICAgICAgICAgICBoYWxmQ2VudHVyeURldGFpbC55ZWFyID0gKG5ldyBEYXRlKERhdGUucGFyc2UodmFsdWUuZGF0ZSkpKS5nZXRGdWxsWWVhcigpXG4gICAgICAgICAgICAgICAgICBoYWxmQ2VudHVyaWVzU2NvcmVkLnB1c2goaGFsZkNlbnR1cnlEZXRhaWwpXG4gICAgICAgICAgICAgICAgfWVsc2UgaWYodmFsdWUuYmF0dGluZ19zY29yZSA+PSAxMDApe1xuICAgICAgICAgICAgICAgICAgY2VudHVyeURldGFpbC5ydW5zID0gdmFsdWUuYmF0dGluZ19zY29yZVxuICAgICAgICAgICAgICAgICAgY2VudHVyeURldGFpbC5hZ2FpbnN0ID0gdmFsdWUub3Bwb3NpdGlvblxuICAgICAgICAgICAgICAgICAgY2VudHVyeURldGFpbC5yZXN1bHQgPSB2YWx1ZS5tYXRjaF9yZXN1bHRcbiAgICAgICAgICAgICAgICAgIGNlbnR1cnlEZXRhaWwuaW5uaW5ncyA9IHZhbHVlLmJhdHRpbmdfaW5uaW5nc1xuICAgICAgICAgICAgICAgICAgY2VudHVyeURldGFpbC55ZWFyID0gKG5ldyBEYXRlKERhdGUucGFyc2UodmFsdWUuZGF0ZSkpKS5nZXRGdWxsWWVhcigpXG4gICAgICAgICAgICAgICAgICBjZW50dXJpZXNTY29yZWQucHVzaChjZW50dXJ5RGV0YWlsKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvL1NhdmluZyB0b3RhbCBydW5zXG4gICAgICAgICAgICAgICAgdG90YWxSdW5zICs9IHZhbHVlLmJhdHRpbmdfc2NvcmU7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAvL0Jvd2xpbmcgc3RhdHNcbiAgICAgICAgICAgICAgaWYoIWlzTmFOKHZhbHVlLndpY2tldHMpICYmIHBhcnNlSW50KHZhbHVlLndpY2tldHMpID4gMCl7XG4gICAgICAgICAgICAgICAgdmFsdWUud2lja2V0cyA9IHBhcnNlSW50KHZhbHVlLndpY2tldHMpXG4gICAgICAgICAgICAgICAgd2lja2V0c1Rha2VuICs9IHZhbHVlLndpY2tldHNcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZighaXNOYU4odmFsdWUuY2F0Y2hlcykgJiYgcGFyc2VJbnQodmFsdWUuY2F0Y2hlcykgPiAwKXtcbiAgICAgICAgICAgICAgICB2YWx1ZS5jYXRjaGVzID0gcGFyc2VJbnQodmFsdWUuY2F0Y2hlcylcbiAgICAgICAgICAgICAgICBjYXRjaGVzICs9IHZhbHVlLmNhdGNoZXNcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZighaXNOYU4odmFsdWUucnVuc19jb25jZWRlZCkpe1xuICAgICAgICAgICAgICAgIHZhbHVlLnJ1bnNfY29uY2VkZWQgPSBwYXJzZUludCh2YWx1ZS5ydW5zX2NvbmNlZGVkKVxuICAgICAgICAgICAgICAgIHJ1bnNDb25jZWRlZCArPSB2YWx1ZS5ydW5zX2NvbmNlZGVkO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgIHZhciB0b3RhbElubmluZ3MgPSB0b3RhbE1hdGNoZXMgLSBkaWROb3RCYXRcbiAgICAgICAgICB2YXIgc3RhdHMgPSB7XG4gICAgICAgICAgICB0b3RhbE1hdGNoZXMgOiB0b3RhbE1hdGNoZXMsXG4gICAgICAgICAgICB0b3RhbFJ1bnM6IHRvdGFsUnVucyxcbiAgICAgICAgICAgIGhhbGZDZW50dXJpZXNTY29yZWQ6IGhhbGZDZW50dXJpZXNTY29yZWQubGVuZ3RoLFxuICAgICAgICAgICAgY2VudHVyaWVzU2NvcmVkOiBjZW50dXJpZXNTY29yZWQubGVuZ3RoLFxuICAgICAgICAgICAgaGlnaGVzdFNjb3JlOiAgTWF0aC5tYXguYXBwbHkobnVsbCxjZW50dXJpZXNTY29yZWQubWFwKGZ1bmN0aW9uKGluZGV4KXtyZXR1cm4gaW5kZXgucnVuc30pKSxcbiAgICAgICAgICAgIG5vdE91dHM6IG5vdE91dHMsXG4gICAgICAgICAgICB0b3RhbElubmluZ3M6IHRvdGFsSW5uaW5ncyxcbiAgICAgICAgICAgIGJhdHRpbmdBdmVyYWdlOiAodG90YWxSdW5zIC8gKHRvdGFsSW5uaW5ncyAtIG5vdE91dHMpKS50b0ZpeGVkKDIpLFxuICAgICAgICAgICAgd2lja2V0c1Rha2VuOiB3aWNrZXRzVGFrZW4sXG4gICAgICAgICAgICBydW5zQ29uY2VkZWQ6IHJ1bnNDb25jZWRlZCxcbiAgICAgICAgICAgIGJvd2xpbmdBdmVyYWdlOiAocnVuc0NvbmNlZGVkIC8gd2lja2V0c1Rha2VuKS50b0ZpeGVkKDIpLFxuICAgICAgICAgICAgY2F0Y2hlczogY2F0Y2hlcyxcbiAgICAgICAgICAgIGFsbENlbnR1cmllczoge2NlbnR1cmllc1Njb3JlZCxoYWxmQ2VudHVyaWVzU2NvcmVkfVxuICAgICAgICAgIH07XG4gICAgICAgICAgaWYoY2FsbGJhY2sgJiYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKHN0YXRzKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHN0YXRzXG4gICAgICAgIH1cblxuXG4gICAgfSlcbiIsImFuZ3VsYXIubW9kdWxlKCdhcHAnKVxuICAgIC5jb250cm9sbGVyKCdjZW50dXJ5U3RhdHNDdHJsJywgZnVuY3Rpb24oJHNjb3BlKSB7XG4gICAgICAkc2NvcGUuJHdhdGNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgIHJldHVybiAkc2NvcGUuY2VudHVyeVN0YXRzO1xuICAgICAgICAgICB9LCBmdW5jdGlvbihuKSB7XG4gICAgICAgICAgICAgICBpZighbilyZXR1cm5cbiAgICAgICAgICAgICAgICRzY29wZS5hbmFseXplQ2VudHVyaWVzKCRzY29wZS5jZW50dXJ5U3RhdHMpXG4gICAgICAgICAgIH0pO1xuXG4gICAgICAkc2NvcGUuYW5hbHl6ZUNlbnR1cmllcyA9IGZ1bmN0aW9uKGNlbnR1cnlTdGF0cyl7XG4gICAgICAgIHZhciBzY29yZXMgPSBfLnBsdWNrKGNlbnR1cnlTdGF0cy5jZW50dXJpZXNTY29yZWQsICdydW5zJylcbiAgICAgICAgdmFyIGFnYWluc3QgPSBfLnBsdWNrKGNlbnR1cnlTdGF0cy5jZW50dXJpZXNTY29yZWQsICdhZ2FpbnN0JylcbiAgICAgICAgLy9TZW5kIGFycmF5IG9mIGNvbG9ycyB0byBjaGFydGpzXG4gICAgICAgIHZhciBjb2xvcnMgPSBbXTtcbiAgICAgICAgY2VudHVyeVN0YXRzLmNlbnR1cmllc1Njb3JlZC5tYXAoZnVuY3Rpb24ocmVzLCBrZXkpe1xuICAgICAgICAgIGlmKHJlcy5yZXN1bHQgPT0gXCJ3b25cIil7XG4gICAgICAgICAgICBjb2xvcnNba2V5XSA9IFwiIzAwODRGRlwiXG4gICAgICAgICAgfWVsc2UgaWYocmVzLnJlc3VsdCA9PSBcImxvc3RcIil7XG4gICAgICAgICAgICBjb2xvcnNba2V5XSA9IFwiI0VEM0YyRlwiXG4gICAgICAgICAgfWVsc2UgaWYocmVzLnJlc3VsdCA9PSBcInRpZWRcIil7XG4gICAgICAgICAgICBjb2xvcnNba2V5XSA9IFwiYmxhY2tcIlxuICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgY29sb3JzW2tleV0gPSBcInllbGxvd1wiXG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBjb2xvcnNcbiAgICAgICAgfSlcbiAgICAgICAgdmFyIHdvbiA9IF8uZmlsdGVyKGNlbnR1cnlTdGF0cy5jZW50dXJpZXNTY29yZWQsIGZ1bmN0aW9uKGNlbnQpe1xuICAgICAgICAgIHJldHVybiBjZW50LnJlc3VsdCA9PSBcIndvblwiXG4gICAgICAgIH0pXG4gICAgICAgIC8vIHZhciBsb3N0ID0gXy5maWx0ZXIoY2VudHVyeVN0YXRzLmNlbnR1cmllc1Njb3JlZCwgZnVuY3Rpb24oY2VudCl7XG4gICAgICAgIC8vICAgcmV0dXJuIGNlbnQucmVzdWx0ID09PSBcImxvc3RcIlxuICAgICAgICAvLyB9KVxuICAgICAgICAvLyB2YXIgdGllZCA9IF8uZmlsdGVyKGNlbnR1cnlTdGF0cy5jZW50dXJpZXNTY29yZWQsIGZ1bmN0aW9uKGNlbnQpe1xuICAgICAgICAvLyAgIHJldHVybiBjZW50LnJlc3VsdCA9PT0gXCJ0aWVkXCJcbiAgICAgICAgLy8gfSlcbiAgICAgICAgLy8gdmFyIG5vcmVzdWx0ID0gXy5maWx0ZXIoY2VudHVyeVN0YXRzLmNlbnR1cmllc1Njb3JlZCwgZnVuY3Rpb24oY2VudCl7XG4gICAgICAgIC8vICAgcmV0dXJuIGNlbnQucmVzdWx0ID09PSBcIm4vclwiXG4gICAgICAgIC8vIH0pXG5cbiAgICAgICAgLy9DZW50dXJ5IGFnYWluc3QgdGVhbXNcbiAgICAgICAgdmFyIGNlbnR1cnlBZ2FpbnN0VGVhbXMgPSBbXTtcbiAgICAgICAgY2VudHVyeVN0YXRzLmNlbnR1cmllc1Njb3JlZC5tYXAoZnVuY3Rpb24ocmVzKXtcbiAgICAgICAgICB2YXIgdGVhbSA9IHJlcy5hZ2FpbnN0O1xuICAgICAgICAgIHZhciBjZW50dXJ5ID0ge1xuICAgICAgICAgICAgc2NvcmU6IHJlcy5ydW5zXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmKHR5cGVvZihjZW50dXJ5QWdhaW5zdFRlYW1zW3RlYW1dKSA9PSBcInVuZGVmaW5lZFwiKVxuICAgICAgICAgICAgICAgICAgY2VudHVyeUFnYWluc3RUZWFtc1t0ZWFtXSA9IFtdXG4gICAgICAgICAgcmV0dXJuIGNlbnR1cnlBZ2FpbnN0VGVhbXNbdGVhbV0ucHVzaChjZW50dXJ5KVxuICAgICAgICB9KVxuXG4gICAgICAgIC8vQ2VudHVyeSBvdmVyIHRoZSB5ZWFyc1xuICAgICAgICB2YXIgY2VudHVyeUJ5WWVhciA9IFtdO1xuICAgICAgICBjZW50dXJ5U3RhdHMuY2VudHVyaWVzU2NvcmVkLm1hcChmdW5jdGlvbihyZXMpe1xuICAgICAgICAgIHZhciB5ZWFyID0gcmVzLnllYXI7XG4gICAgICAgICAgdmFyIGNlbnR1cnkgPSB7XG4gICAgICAgICAgICBzY29yZTogcmVzLnJ1bnNcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYodHlwZW9mKGNlbnR1cnlCeVllYXJbeWVhcl0pID09IFwidW5kZWZpbmVkXCIpXG4gICAgICAgICAgICAgICAgICBjZW50dXJ5QnlZZWFyW3llYXJdID0gW11cbiAgICAgICAgICByZXR1cm4gY2VudHVyeUJ5WWVhclt5ZWFyXS5wdXNoKGNlbnR1cnkpXG4gICAgICAgIH0pXG5cbiAgICAgICAgdmFyIGhhbGZDZW50dXJ5QnlZZWFyID0gW107XG4gICAgICAgIGNlbnR1cnlTdGF0cy5oYWxmQ2VudHVyaWVzU2NvcmVkLm1hcChmdW5jdGlvbihyZXMpe1xuICAgICAgICAgIHZhciB5ZWFyID0gcmVzLnllYXI7XG4gICAgICAgICAgdmFyIGhhbGZDZW50dXJ5ID0ge1xuICAgICAgICAgICAgc2NvcmU6IHJlcy5ydW5zXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmKHR5cGVvZihoYWxmQ2VudHVyeUJ5WWVhclt5ZWFyXSkgPT0gXCJ1bmRlZmluZWRcIilcbiAgICAgICAgICAgICAgICAgIGhhbGZDZW50dXJ5QnlZZWFyW3llYXJdID0gW11cbiAgICAgICAgICByZXR1cm4gaGFsZkNlbnR1cnlCeVllYXJbeWVhcl0ucHVzaChoYWxmQ2VudHVyeSlcbiAgICAgICAgfSlcblxuICAgICAgICBjb25zb2xlLmxvZyhjZW50dXJ5QnlZZWFyLGhhbGZDZW50dXJ5QnlZZWFyKVxuXG5cbiAgICAgICAgJHNjb3BlLndpbm5pbmdSYXRpbyA9ICh3b24ubGVuZ3RoL2NlbnR1cnlTdGF0cy5jZW50dXJpZXNTY29yZWQubGVuZ3RoKS50b0ZpeGVkKDIpICogMTA7XG4gICAgICAgICRzY29wZS5wcmVwYXJlQmFyR3JhcGgoc2NvcmVzLCBhZ2FpbnN0LCBjb2xvcnMpXG4gICAgICAgICRzY29wZS5wcmVwYXJlQmFyR3JhcGhBZ2FpbnN0VGVhbShjZW50dXJ5QWdhaW5zdFRlYW1zKVxuICAgICAgICAvLyRzY29wZS5wcmVwYXJlRG91Z2hudXRDaGFydCh3b24ubGVuZ3RoLCBsb3N0Lmxlbmd0aCwgdGllZC5sZW5ndGgsIG5vcmVzdWx0Lmxlbmd0aClcbiAgICAgICAgJHNjb3BlLnByZXBhcmVMaW5lR3JhcGgoY2VudHVyeUJ5WWVhcixoYWxmQ2VudHVyeUJ5WWVhcik7XG4gICAgICB9XG5cblxuXG5cblxuXG5cblxuICAgICAgJHNjb3BlLnByZXBhcmVCYXJHcmFwaCA9IGZ1bmN0aW9uIChzY29yZXMsYWdhaW5zdCwgY29sb3JzKXtcbiAgICAgICAgJHNjb3BlLmJhcmRhdGEgPSB7XG4gICAgICAgICAgICAgICBsYWJlbHM6IGFnYWluc3QsXG4gICAgICAgICAgICAgICBkYXRhc2V0czogW3tcbiAgICAgICAgICAgICAgICAgICBsYWJlbDogJ0NlbnR1cmllcycsXG4gICAgICAgICAgICAgICAgICAgZmlsbENvbG9yOiBjb2xvcnMsXG4gICAgICAgICAgICAgICAgICAgc3Ryb2tlQ29sb3I6ICdyZ2JhKDIyMCwyMjAsMjIwLDEpJyxcbiAgICAgICAgICAgICAgICAgICBwb2ludENvbG9yOiAncmdiYSgyMjAsMjIwLDIyMCwxKScsXG4gICAgICAgICAgICAgICAgICAgcG9pbnRTdHJva2VDb2xvcjogJyNmZmYnLFxuICAgICAgICAgICAgICAgICAgIHBvaW50SGlnaGxpZ2h0RmlsbDogJyNmZmYnLFxuICAgICAgICAgICAgICAgICAgIHBvaW50SGlnaGxpZ2h0U3Ryb2tlOiAncmdiYSgyMjAsMjIwLDIyMCwxKScsXG4gICAgICAgICAgICAgICAgICAgZGF0YTogc2NvcmVzXG4gICAgICAgICAgICAgICB9XVxuICAgICAgICAgICB9O1xuXG4gICAgICAgICAgIC8vIENoYXJ0LmpzIE9wdGlvbnNcbiAgICAgICAgICAgJHNjb3BlLmJhcm9wdGlvbnMgPSB7XG5cbiAgICAgICAgICAgICAgIC8vIFNldHMgdGhlIGNoYXJ0IHRvIGJlIHJlc3BvbnNpdmVcbiAgICAgICAgICAgICAgIHJlc3BvbnNpdmU6IHRydWUsXG5cbiAgICAgICAgICAgICAgIC8vQm9vbGVhbiAtIFdoZXRoZXIgdGhlIHNjYWxlIHNob3VsZCBzdGFydCBhdCB6ZXJvLCBvciBhbiBvcmRlciBvZiBtYWduaXR1ZGUgZG93biBmcm9tIHRoZSBsb3dlc3QgdmFsdWVcbiAgICAgICAgICAgICAgIHNjYWxlQmVnaW5BdFplcm86IHRydWUsXG5cbiAgICAgICAgICAgICAgIC8vQm9vbGVhbiAtIFdoZXRoZXIgZ3JpZCBsaW5lcyBhcmUgc2hvd24gYWNyb3NzIHRoZSBjaGFydFxuICAgICAgICAgICAgICAgc2NhbGVTaG93R3JpZExpbmVzOiB0cnVlLFxuXG4gICAgICAgICAgICAgICAvL1N0cmluZyAtIENvbG91ciBvZiB0aGUgZ3JpZCBsaW5lc1xuICAgICAgICAgICAgICAgc2NhbGVHcmlkTGluZUNvbG9yOiBcInJnYmEoMCwwLDAsLjA1KVwiLFxuXG4gICAgICAgICAgICAgICAvL051bWJlciAtIFdpZHRoIG9mIHRoZSBncmlkIGxpbmVzXG4gICAgICAgICAgICAgICBzY2FsZUdyaWRMaW5lV2lkdGg6IDEsXG5cbiAgICAgICAgICAgICAgIC8vQm9vbGVhbiAtIElmIHRoZXJlIGlzIGEgc3Ryb2tlIG9uIGVhY2ggYmFyXG4gICAgICAgICAgICAgICBiYXJTaG93U3Ryb2tlOiB0cnVlLFxuXG4gICAgICAgICAgICAgICAvL051bWJlciAtIFBpeGVsIHdpZHRoIG9mIHRoZSBiYXIgc3Ryb2tlXG4gICAgICAgICAgICAgICBiYXJTdHJva2VXaWR0aDogMixcblxuICAgICAgICAgICAgICAgLy9OdW1iZXIgLSBTcGFjaW5nIGJldHdlZW4gZWFjaCBvZiB0aGUgWCB2YWx1ZSBzZXRzXG4gICAgICAgICAgICAgICBiYXJWYWx1ZVNwYWNpbmc6IDUsXG5cbiAgICAgICAgICAgICAgIC8vTnVtYmVyIC0gU3BhY2luZyBiZXR3ZWVuIGRhdGEgc2V0cyB3aXRoaW4gWCB2YWx1ZXNcbiAgICAgICAgICAgICAgIGJhckRhdGFzZXRTcGFjaW5nOiAxLFxuXG4gICAgICAgICAgICAgICAvL1N0cmluZyAtIEEgbGVnZW5kIHRlbXBsYXRlXG4gICAgICAgICAgICAgICBsZWdlbmRUZW1wbGF0ZTogJzx1bCBjbGFzcz1cInRjLWNoYXJ0LWpzLWxlZ2VuZFwiPjwlIGZvciAodmFyIGk9MDsgaTxkYXRhc2V0cy5sZW5ndGg7IGkrKyl7JT48bGk+PHNwYW4gc3R5bGU9XCJiYWNrZ3JvdW5kLWNvbG9yOjwlPWRhdGFzZXRzW2ldLmZpbGxDb2xvciU+XCI+PC9zcGFuPjwlaWYoZGF0YXNldHNbaV0ubGFiZWwpeyU+PCU9ZGF0YXNldHNbaV0ubGFiZWwlPjwlfSU+PC9saT48JX0lPjwvdWw+J1xuICAgICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICAkc2NvcGUucHJlcGFyZUJhckdyYXBoQWdhaW5zdFRlYW0gPSBmdW5jdGlvbiAoY2VudHVyeUFnYWluc3RUZWFtcyl7XG4gICAgICAgIHZhciBhZ2FpbnN0Rm9yQ2VudHVyaWVzID0gW11cbiAgICAgICAgdmFyIG51bWJlck9mQ2VudHVyaWVzID0gW11cbiAgICAgICAgZm9yKHZhciBjZW50dXJ5S2V5IGluIGNlbnR1cnlBZ2FpbnN0VGVhbXMpIHtcbiAgICAgICAgICBpZihjZW50dXJ5QWdhaW5zdFRlYW1zLmhhc093blByb3BlcnR5KGNlbnR1cnlLZXkpKSB7XG4gICAgICAgICAgICBhZ2FpbnN0Rm9yQ2VudHVyaWVzLnB1c2goY2VudHVyeUtleSk7XG4gICAgICAgICAgICBudW1iZXJPZkNlbnR1cmllcy5wdXNoKGNlbnR1cnlBZ2FpbnN0VGVhbXNbY2VudHVyeUtleV0ubGVuZ3RoKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAkc2NvcGUuYmFyZGF0YUFnYWluc3RUZWFtID0ge1xuICAgICAgICAgICAgICAgbGFiZWxzOiBhZ2FpbnN0Rm9yQ2VudHVyaWVzLFxuICAgICAgICAgICAgICAgZGF0YXNldHM6IFt7XG4gICAgICAgICAgICAgICAgICAgbGFiZWw6ICdDZW50dXJpZXMnLFxuICAgICAgICAgICAgICAgICAgIGZpbGxDb2xvcjogWydibHVlJ10sXG4gICAgICAgICAgICAgICAgICAgc3Ryb2tlQ29sb3I6ICdyZ2JhKDIyMCwyMjAsMjIwLDEpJyxcbiAgICAgICAgICAgICAgICAgICBwb2ludENvbG9yOiAncmdiYSgyMjAsMjIwLDIyMCwxKScsXG4gICAgICAgICAgICAgICAgICAgcG9pbnRTdHJva2VDb2xvcjogJyNmZmYnLFxuICAgICAgICAgICAgICAgICAgIHBvaW50SGlnaGxpZ2h0RmlsbDogJyNmZmYnLFxuICAgICAgICAgICAgICAgICAgIHBvaW50SGlnaGxpZ2h0U3Ryb2tlOiAncmdiYSgyMjAsMjIwLDIyMCwxKScsXG4gICAgICAgICAgICAgICAgICAgZGF0YTogbnVtYmVyT2ZDZW50dXJpZXNcbiAgICAgICAgICAgICAgIH1dXG4gICAgICAgICAgIH07XG5cbiAgICAgICAgICAgLy8gQ2hhcnQuanMgT3B0aW9uc1xuICAgICAgICAgICAkc2NvcGUuYmFyb3B0aW9uc0FnYWluc3RUZWFtID0ge1xuXG4gICAgICAgICAgICAgICAvLyBTZXRzIHRoZSBjaGFydCB0byBiZSByZXNwb25zaXZlXG4gICAgICAgICAgICAgICByZXNwb25zaXZlOiB0cnVlLFxuXG4gICAgICAgICAgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIHRoZSBzY2FsZSBzaG91bGQgc3RhcnQgYXQgemVybywgb3IgYW4gb3JkZXIgb2YgbWFnbml0dWRlIGRvd24gZnJvbSB0aGUgbG93ZXN0IHZhbHVlXG4gICAgICAgICAgICAgICBzY2FsZUJlZ2luQXRaZXJvOiB0cnVlLFxuXG4gICAgICAgICAgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIGdyaWQgbGluZXMgYXJlIHNob3duIGFjcm9zcyB0aGUgY2hhcnRcbiAgICAgICAgICAgICAgIHNjYWxlU2hvd0dyaWRMaW5lczogdHJ1ZSxcblxuICAgICAgICAgICAgICAgLy9TdHJpbmcgLSBDb2xvdXIgb2YgdGhlIGdyaWQgbGluZXNcbiAgICAgICAgICAgICAgIHNjYWxlR3JpZExpbmVDb2xvcjogXCJyZ2JhKDAsMCwwLC4wNSlcIixcblxuICAgICAgICAgICAgICAgLy9OdW1iZXIgLSBXaWR0aCBvZiB0aGUgZ3JpZCBsaW5lc1xuICAgICAgICAgICAgICAgc2NhbGVHcmlkTGluZVdpZHRoOiAxLFxuXG4gICAgICAgICAgICAgICAvL0Jvb2xlYW4gLSBJZiB0aGVyZSBpcyBhIHN0cm9rZSBvbiBlYWNoIGJhclxuICAgICAgICAgICAgICAgYmFyU2hvd1N0cm9rZTogdHJ1ZSxcblxuICAgICAgICAgICAgICAgLy9OdW1iZXIgLSBQaXhlbCB3aWR0aCBvZiB0aGUgYmFyIHN0cm9rZVxuICAgICAgICAgICAgICAgYmFyU3Ryb2tlV2lkdGg6IDIsXG5cbiAgICAgICAgICAgICAgIC8vTnVtYmVyIC0gU3BhY2luZyBiZXR3ZWVuIGVhY2ggb2YgdGhlIFggdmFsdWUgc2V0c1xuICAgICAgICAgICAgICAgYmFyVmFsdWVTcGFjaW5nOiA1LFxuXG4gICAgICAgICAgICAgICAvL051bWJlciAtIFNwYWNpbmcgYmV0d2VlbiBkYXRhIHNldHMgd2l0aGluIFggdmFsdWVzXG4gICAgICAgICAgICAgICBiYXJEYXRhc2V0U3BhY2luZzogMSxcblxuICAgICAgICAgICAgICAgLy9TdHJpbmcgLSBBIGxlZ2VuZCB0ZW1wbGF0ZVxuICAgICAgICAgICAgICAgbGVnZW5kVGVtcGxhdGU6ICc8dWwgY2xhc3M9XCJ0Yy1jaGFydC1qcy1sZWdlbmRcIj48JSBmb3IgKHZhciBpPTA7IGk8ZGF0YXNldHMubGVuZ3RoOyBpKyspeyU+PGxpPjxzcGFuIHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjo8JT1kYXRhc2V0c1tpXS5maWxsQ29sb3IlPlwiPjwvc3Bhbj48JWlmKGRhdGFzZXRzW2ldLmxhYmVsKXslPjwlPWRhdGFzZXRzW2ldLmxhYmVsJT48JX0lPjwvbGk+PCV9JT48L3VsPidcbiAgICAgICAgICAgfTtcbiAgICAgIH1cblxuXG4gICAgICAkc2NvcGUucHJlcGFyZUxpbmVHcmFwaCA9IGZ1bmN0aW9uKGNlbnR1cnlCeVllYXIsaGFsZkNlbnR1cnlCeVllYXIpe1xuICAgICAgICAgIHZhciB5ZWFyT2ZjZW50dXJpZXMgPSBbXVxuICAgICAgICAgIHZhciBudW1iZXJPZkNlbnR1cmllcyA9IFtdXG5cbiAgICAgICAgICBmb3IodmFyIGNlbnR1cnkgaW4gY2VudHVyeUJ5WWVhcikge1xuICAgICAgICAgICAgaWYoY2VudHVyeUJ5WWVhci5oYXNPd25Qcm9wZXJ0eShjZW50dXJ5KSkge1xuICAgICAgICAgICAgICB5ZWFyT2ZjZW50dXJpZXMucHVzaChjZW50dXJ5KTtcbiAgICAgICAgICAgICAgbnVtYmVyT2ZDZW50dXJpZXMucHVzaChjZW50dXJ5QnlZZWFyW2NlbnR1cnldLmxlbmd0aClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIHllYXJPZmhhbGZDZW50dXJpZXMgPSBbXVxuICAgICAgICAgIHZhciBudW1iZXJPZkhhbGZDZW50dXJpZXMgPSBbXVxuXG4gICAgICAgICAgZm9yKHZhciBoYWxmQ2VudHVyeSBpbiBoYWxmQ2VudHVyeUJ5WWVhcikge1xuICAgICAgICAgICAgaWYoY2VudHVyeUJ5WWVhci5oYXNPd25Qcm9wZXJ0eShoYWxmQ2VudHVyeSkpIHtcbiAgICAgICAgICAgICAgeWVhck9maGFsZkNlbnR1cmllcy5wdXNoKGhhbGZDZW50dXJ5KTtcbiAgICAgICAgICAgICAgbnVtYmVyT2ZIYWxmQ2VudHVyaWVzLnB1c2goaGFsZkNlbnR1cnlCeVllYXJbaGFsZkNlbnR1cnldLmxlbmd0aClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgJHNjb3BlLmxpbmVEYXRhID0ge1xuICAgICAgICAgIGxhYmVsczogeWVhck9maGFsZkNlbnR1cmllcyxcbiAgICAgICAgICBkYXRhc2V0czogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBsYWJlbDogJ015IEZpcnN0IGRhdGFzZXQnLFxuICAgICAgICAgICAgICBmaWxsQ29sb3I6IFsncmdiYSgxMjAsMjAsMjIwLDAuNCknXSxcbiAgICAgICAgICAgICAgc3Ryb2tlQ29sb3I6ICdyZ2JhKDIyMCwyMjAsMjIwLDEpJyxcbiAgICAgICAgICAgICAgcG9pbnRDb2xvcjogJ3JnYmEoMjIwLDIyMCwyMjAsMSknLFxuICAgICAgICAgICAgICBwb2ludFN0cm9rZUNvbG9yOiAnI2ZmZicsXG4gICAgICAgICAgICAgIHBvaW50SGlnaGxpZ2h0RmlsbDogJyNmZmYnLFxuICAgICAgICAgICAgICBwb2ludEhpZ2hsaWdodFN0cm9rZTogJ3JnYmEoMjIwLDIyMCwyMjAsMSknLFxuICAgICAgICAgICAgICBkYXRhOiBudW1iZXJPZkhhbGZDZW50dXJpZXNcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGxhYmVsOiAnTXkgRmlyc3QgZGF0YXNldCcsXG4gICAgICAgICAgICAgIGZpbGxDb2xvcjogWydyZ2JhKDIyMCwyMjAsMjIwLDAuNiknXSxcbiAgICAgICAgICAgICAgc3Ryb2tlQ29sb3I6ICdyZ2JhKDIyMCwyMjAsMjIwLDEpJyxcbiAgICAgICAgICAgICAgcG9pbnRDb2xvcjogJ3JnYmEoMjIwLDIyMCwyMjAsMSknLFxuICAgICAgICAgICAgICBwb2ludFN0cm9rZUNvbG9yOiAnI2ZmZicsXG4gICAgICAgICAgICAgIHBvaW50SGlnaGxpZ2h0RmlsbDogJyNmZmYnLFxuICAgICAgICAgICAgICBwb2ludEhpZ2hsaWdodFN0cm9rZTogJ3JnYmEoMjIwLDIyMCwyMjAsMSknLFxuICAgICAgICAgICAgICBkYXRhOiBudW1iZXJPZkNlbnR1cmllc1xuICAgICAgICAgICAgfVxuICAgICAgICAgIF1cbiAgICAgICAgfTtcblxuICAgICAgICAvLyBDaGFydC5qcyBPcHRpb25zXG4gICAgICAgICRzY29wZS5saW5lT3B0aW9ucyA9ICB7XG5cbiAgICAgICAgICAvLyBTZXRzIHRoZSBjaGFydCB0byBiZSByZXNwb25zaXZlXG4gICAgICAgICAgcmVzcG9uc2l2ZTogdHJ1ZSxcblxuICAgICAgICAgIC8vL0Jvb2xlYW4gLSBXaGV0aGVyIGdyaWQgbGluZXMgYXJlIHNob3duIGFjcm9zcyB0aGUgY2hhcnRcbiAgICAgICAgICBzY2FsZVNob3dHcmlkTGluZXMgOiB0cnVlLFxuXG4gICAgICAgICAgLy9TdHJpbmcgLSBDb2xvdXIgb2YgdGhlIGdyaWQgbGluZXNcbiAgICAgICAgICBzY2FsZUdyaWRMaW5lQ29sb3IgOiBcInJnYmEoMCwwLDAsLjA1KVwiLFxuXG4gICAgICAgICAgLy9OdW1iZXIgLSBXaWR0aCBvZiB0aGUgZ3JpZCBsaW5lc1xuICAgICAgICAgIHNjYWxlR3JpZExpbmVXaWR0aCA6IDEsXG5cbiAgICAgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIHRoZSBsaW5lIGlzIGN1cnZlZCBiZXR3ZWVuIHBvaW50c1xuICAgICAgICAgIGJlemllckN1cnZlIDogdHJ1ZSxcblxuICAgICAgICAgIC8vTnVtYmVyIC0gVGVuc2lvbiBvZiB0aGUgYmV6aWVyIGN1cnZlIGJldHdlZW4gcG9pbnRzXG4gICAgICAgICAgYmV6aWVyQ3VydmVUZW5zaW9uIDogMC40LFxuXG4gICAgICAgICAgLy9Cb29sZWFuIC0gV2hldGhlciB0byBzaG93IGEgZG90IGZvciBlYWNoIHBvaW50XG4gICAgICAgICAgcG9pbnREb3QgOiB0cnVlLFxuXG4gICAgICAgICAgLy9OdW1iZXIgLSBSYWRpdXMgb2YgZWFjaCBwb2ludCBkb3QgaW4gcGl4ZWxzXG4gICAgICAgICAgcG9pbnREb3RSYWRpdXMgOiA0LFxuXG4gICAgICAgICAgLy9OdW1iZXIgLSBQaXhlbCB3aWR0aCBvZiBwb2ludCBkb3Qgc3Ryb2tlXG4gICAgICAgICAgcG9pbnREb3RTdHJva2VXaWR0aCA6IDEsXG5cbiAgICAgICAgICAvL051bWJlciAtIGFtb3VudCBleHRyYSB0byBhZGQgdG8gdGhlIHJhZGl1cyB0byBjYXRlciBmb3IgaGl0IGRldGVjdGlvbiBvdXRzaWRlIHRoZSBkcmF3biBwb2ludFxuICAgICAgICAgIHBvaW50SGl0RGV0ZWN0aW9uUmFkaXVzIDogMjAsXG5cbiAgICAgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIHRvIHNob3cgYSBzdHJva2UgZm9yIGRhdGFzZXRzXG4gICAgICAgICAgZGF0YXNldFN0cm9rZSA6IHRydWUsXG5cbiAgICAgICAgICAvL051bWJlciAtIFBpeGVsIHdpZHRoIG9mIGRhdGFzZXQgc3Ryb2tlXG4gICAgICAgICAgZGF0YXNldFN0cm9rZVdpZHRoIDogMixcblxuICAgICAgICAgIC8vQm9vbGVhbiAtIFdoZXRoZXIgdG8gZmlsbCB0aGUgZGF0YXNldCB3aXRoIGEgY29sb3VyXG4gICAgICAgICAgZGF0YXNldEZpbGwgOiB0cnVlLFxuXG4gICAgICAgICAgLy8gRnVuY3Rpb24gLSBvbiBhbmltYXRpb24gcHJvZ3Jlc3NcbiAgICAgICAgICBvbkFuaW1hdGlvblByb2dyZXNzOiBmdW5jdGlvbigpe30sXG5cbiAgICAgICAgICAvLyBGdW5jdGlvbiAtIG9uIGFuaW1hdGlvbiBjb21wbGV0ZVxuICAgICAgICAgIG9uQW5pbWF0aW9uQ29tcGxldGU6IGZ1bmN0aW9uKCl7fSxcblxuICAgICAgICAgIC8vU3RyaW5nIC0gQSBsZWdlbmQgdGVtcGxhdGVcbiAgICAgICAgICBsZWdlbmRUZW1wbGF0ZSA6ICc8dWwgY2xhc3M9XCJ0Yy1jaGFydC1qcy1sZWdlbmRcIj48JSBmb3IgKHZhciBpPTA7IGk8ZGF0YXNldHMubGVuZ3RoOyBpKyspeyU+PGxpPjxzcGFuIHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjo8JT1kYXRhc2V0c1tpXS5zdHJva2VDb2xvciU+XCI+PC9zcGFuPjwlaWYoZGF0YXNldHNbaV0ubGFiZWwpeyU+PCU9ZGF0YXNldHNbaV0ubGFiZWwlPjwlfSU+PC9saT48JX0lPjwvdWw+J1xuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgJHNjb3BlLnByZXBhcmVEb3VnaG51dENoYXJ0ID0gZnVuY3Rpb24od29uLCBsb3N0LCB0aWVkLCBub3Jlc3VsdCl7XG4gICAgICAgICRzY29wZS5yZXNvdXJjZXMgPSBbe1xuICAgICAgICAgICAgICAgdmFsdWU6IHdvbixcbiAgICAgICAgICAgICAgIGNvbG9yOiAnI0ZGRkYwMCcsXG4gICAgICAgICAgICAgICBoaWdobGlnaHQ6ICcjZTVlNTAwJyxcbiAgICAgICAgICAgICAgIGxhYmVsOiAnV2luJ1xuICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICB2YWx1ZTogbG9zdCxcbiAgICAgICAgICAgICAgIGNvbG9yOiAnIzQ2QkZCRCcsXG4gICAgICAgICAgICAgICBoaWdobGlnaHQ6ICcjNUFEM0QxJyxcbiAgICAgICAgICAgICAgIGxhYmVsOiAnTG9zcydcbiAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgdmFsdWU6IHRpZWQsXG4gICAgICAgICAgICAgICBjb2xvcjogJyNGNzQ2NEEnLFxuICAgICAgICAgICAgICAgaGlnaGxpZ2h0OiAnI0ZGNUE1RScsXG4gICAgICAgICAgICAgICBsYWJlbDogJ1RpZSdcbiAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgdmFsdWU6IG5vcmVzdWx0LFxuICAgICAgICAgICAgICAgY29sb3I6ICcjRjc0NjRBJyxcbiAgICAgICAgICAgICAgIGhpZ2hsaWdodDogJyNFRjVBNUUnLFxuICAgICAgICAgICAgICAgbGFiZWw6ICdObyBSZXN1bHQnXG4gICAgICAgICAgIH1cbiAgICAgICAgIF07XG5cbiAgICAgICAgICAgLy8gQ2hhcnQuanMgT3B0aW9uc1xuICAgICAgICAgICAkc2NvcGUub3B0aW9ucyA9IHtcblxuICAgICAgICAgICAgICAgLy8gU2V0cyB0aGUgY2hhcnQgdG8gYmUgcmVzcG9uc2l2ZVxuICAgICAgICAgICAgICAgcmVzcG9uc2l2ZTogdHJ1ZSxcblxuICAgICAgICAgICAgICAgLy9Cb29sZWFuIC0gV2hldGhlciB3ZSBzaG91bGQgc2hvdyBhIHN0cm9rZSBvbiBlYWNoIHNlZ21lbnRcbiAgICAgICAgICAgICAgIHNlZ21lbnRTaG93U3Ryb2tlOiB0cnVlLFxuXG4gICAgICAgICAgICAgICAvL1N0cmluZyAtIFRoZSBjb2xvdXIgb2YgZWFjaCBzZWdtZW50IHN0cm9rZVxuICAgICAgICAgICAgICAgc2VnbWVudFN0cm9rZUNvbG9yOiAnI2ZmZicsXG5cbiAgICAgICAgICAgICAgIC8vTnVtYmVyIC0gVGhlIHdpZHRoIG9mIGVhY2ggc2VnbWVudCBzdHJva2VcbiAgICAgICAgICAgICAgIHNlZ21lbnRTdHJva2VXaWR0aDogMixcblxuICAgICAgICAgICAgICAgLy9OdW1iZXIgLSBUaGUgcGVyY2VudGFnZSBvZiB0aGUgY2hhcnQgdGhhdCB3ZSBjdXQgb3V0IG9mIHRoZSBtaWRkbGVcbiAgICAgICAgICAgICAgIHBlcmNlbnRhZ2VJbm5lckN1dG91dDogNTAsIC8vIFRoaXMgaXMgMCBmb3IgUGllIGNoYXJ0c1xuXG4gICAgICAgICAgICAgICAvL051bWJlciAtIEFtb3VudCBvZiBhbmltYXRpb24gc3RlcHNcbiAgICAgICAgICAgICAgIGFuaW1hdGlvblN0ZXBzOiAxMDAsXG5cbiAgICAgICAgICAgICAgIC8vU3RyaW5nIC0gQW5pbWF0aW9uIGVhc2luZyBlZmZlY3RcbiAgICAgICAgICAgICAgIGFuaW1hdGlvbkVhc2luZzogJ2Vhc2VPdXRCb3VuY2UnLFxuXG4gICAgICAgICAgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIHdlIGFuaW1hdGUgdGhlIHJvdGF0aW9uIG9mIHRoZSBEb3VnaG51dFxuICAgICAgICAgICAgICAgYW5pbWF0ZVJvdGF0ZTogdHJ1ZSxcblxuICAgICAgICAgICAgICAgLy9Cb29sZWFuIC0gV2hldGhlciB3ZSBhbmltYXRlIHNjYWxpbmcgdGhlIERvdWdobnV0IGZyb20gdGhlIGNlbnRyZVxuICAgICAgICAgICAgICAgYW5pbWF0ZVNjYWxlOiBmYWxzZSxcblxuICAgICAgICAgICAgICAgLy9TdHJpbmcgLSBBIGxlZ2VuZCB0ZW1wbGF0ZVxuICAgICAgICAgICAgICAgbGVnZW5kVGVtcGxhdGU6ICc8dWwgY2xhc3M9XCJ0Yy1jaGFydC1qcy1sZWdlbmRcIj48JSBmb3IgKHZhciBpPTA7IGk8c2VnbWVudHMubGVuZ3RoOyBpKyspeyU+PGxpPjxzcGFuIHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjo8JT1zZWdtZW50c1tpXS5maWxsQ29sb3IlPlwiPjwvc3Bhbj48JWlmKHNlZ21lbnRzW2ldLmxhYmVsKXslPjwlPXNlZ21lbnRzW2ldLmxhYmVsJT48JX0lPjwvbGk+PCV9JT48L3VsPidcblxuICAgICAgICAgICB9O1xuXG4gICAgICB9XG5cblxuICAgIH0pXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
