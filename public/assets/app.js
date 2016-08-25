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
//centuries scored in a year
//half centuries scored in a year
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
                  halfCenturyDetail.year = (new Date(Date.parse(value.date))).getFullYear()
                  halfCenturiesScored.push(halfCenturyDetail)
                }else if(value.batting_score >= 100){
                  centuryDetail.runs = value.batting_score
                  centuryDetail.against = value.opposition
                  centuryDetail.result = value.match_result
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
            allCenturies: centuriesScored
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
        var scores = _.pluck(centuryStats, 'runs')
        var against = _.pluck(centuryStats, 'against')
        //Send array of colors to chartjs
        var colors = [];
        centuryStats.map(function(res, key){
          if(res.result == "won"){
            colors[key] = "#0084FF"
          }else if(res.result == "lost"){
            colors[key] = "#ED3F2F"
          }else if(res.result == "tied"){
            colors[key] = "black"
          }else{
            colors[key] = "yellow"
          }
        })
        var won = _.filter(centuryStats, function(cent){
          return cent.result == "won"
        })
        var lost = _.filter(centuryStats, function(cent){
          return cent.result === "lost"
        })
        var tied = _.filter(centuryStats, function(cent){
          return cent.result === "tied"
        })
        var noresult = _.filter(centuryStats, function(cent){
          return cent.result === "n/r"
        })
        $scope.winningRatio = (won.length/centuryStats.length).toFixed(2) * 10;
        $scope.prepareBarGraph(scores, against, colors)
        $scope.prepareDoughnutChart(won.length, lost.length, tied.length, noresult.length)
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZHVsZS5qcyIsImNvbnRyb2xsZXJzL2hvbWVDdHJsLmpzIiwiY29udHJvbGxlcnMvbWFzdGVyQ3RybC5qcyIsImNvbnRyb2xsZXJzL3JvdXRlcy5qcyIsImRpcmVjdGl2ZXMvY2FyZWVyU3RhdHMuanMiLCJkaXJlY3RpdmVzL2NlbnR1cnlTdGF0cy5qcyIsImRpcmVjdGl2ZXMvcGVyc29uYWxJbmZvLmpzIiwic2VydmljZXMvZGF0YU11dGF0b3IuanMiLCJjb250cm9sbGVycy9wYXJ0aWFscy9jZW50dXJ5U3RhdHNDdHJsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFFBQUEsT0FBQSxNQUFBO0VBQ0EsVUFBQSxZQUFBOzs7QUNEQSxRQUFBLE9BQUE7S0FDQSxXQUFBLCtDQUFBLFNBQUEsUUFBQSxPQUFBLGFBQUE7UUFDQSxPQUFBLFFBQUEsV0FBQTtVQUNBLFlBQUE7V0FDQSxLQUFBLFNBQUEsVUFBQTtnQkFDQSxZQUFBLFVBQUEsU0FBQSxNQUFBLFNBQUEsSUFBQTtvQkFDQSxZQUFBLGVBQUEsS0FBQSxTQUFBLE1BQUE7c0JBQ0EsUUFBQSxJQUFBO3NCQUNBLE9BQUEsUUFBQTs7O2FBR0EsU0FBQSxLQUFBO2dCQUNBLFFBQUEsSUFBQTs7O1FBR0EsT0FBQTs7O0FDZkEsUUFBQSxPQUFBO0tBQ0EsV0FBQSx1Q0FBQSxTQUFBLFFBQUEsWUFBQTtRQUNBLFFBQUEsSUFBQTs7O0FDRkEsUUFBQSxPQUFBO0tBQ0EscUVBQUEsU0FBQSxnQkFBQSxvQkFBQSxtQkFBQTs7UUFFQSxtQkFBQSxVQUFBOztRQUVBO2FBQ0EsTUFBQSxPQUFBO2dCQUNBLEtBQUE7Z0JBQ0EsT0FBQTtvQkFDQSxVQUFBO3dCQUNBLGFBQUE7O29CQUVBLFdBQUE7d0JBQ0EsYUFBQTt3QkFDQSxZQUFBOzs7Ozs7O1NBT0EsTUFBQSxZQUFBO1lBQ0EsS0FBQTtZQUNBLE9BQUE7Z0JBQ0EsWUFBQTtvQkFDQSxhQUFBO29CQUNBLFlBQUE7Ozs7Ozs7OztRQVNBLGtCQUFBLFVBQUE7Ozs7QUNuQ0EsUUFBQSxPQUFBO0tBQ0EsVUFBQSxlQUFBLFdBQUE7UUFDQSxNQUFBO1lBQ0EsVUFBQTtZQUNBLE9BQUE7Z0JBQ0EsT0FBQTs7WUFFQSxhQUFBOzs7OztBQ1BBLFFBQUEsT0FBQTtLQUNBLFVBQUEsZ0JBQUEsV0FBQTtRQUNBLE1BQUE7WUFDQSxVQUFBO1lBQ0EsT0FBQTtnQkFDQSxjQUFBOztZQUVBLGFBQUE7WUFDQSxZQUFBOzs7O0FDUkEsUUFBQSxPQUFBO0tBQ0EsVUFBQSxnQkFBQSxXQUFBO1FBQ0EsTUFBQTtZQUNBLFVBQUE7WUFDQSxhQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUN5QkEsUUFBQSxPQUFBO0tBQ0EsUUFBQSx5QkFBQSxTQUFBLE9BQUE7UUFDQSxNQUFBO1lBQ0EsU0FBQTtZQUNBLFdBQUE7WUFDQSxnQkFBQTs7OztRQUlBLFNBQUEsVUFBQTtZQUNBLE9BQUEsTUFBQSxJQUFBOzs7UUFHQSxTQUFBLFVBQUEsS0FBQSxVQUFBO1lBQ0EsSUFBQSxNQUFBLElBQUEsTUFBQTtZQUNBLElBQUEsU0FBQTtZQUNBLElBQUEsUUFBQSxNQUFBLEdBQUEsTUFBQTtZQUNBLElBQUEsSUFBQSxFQUFBLEVBQUEsRUFBQSxNQUFBLFFBQUEsRUFBQSxJQUFBO2dCQUNBLElBQUEsTUFBQTtnQkFDQSxJQUFBLFlBQUEsTUFBQSxHQUFBLE1BQUE7Z0JBQ0EsSUFBQSxJQUFBLEVBQUEsRUFBQSxFQUFBLFFBQUEsT0FBQSxJQUFBO2tCQUNBLElBQUEsUUFBQSxNQUFBLFlBQUE7O2dCQUVBLE9BQUEsS0FBQTs7WUFFQSxRQUFBLElBQUE7WUFDQSxHQUFBLGFBQUEsT0FBQSxhQUFBLGFBQUE7Z0JBQ0EsT0FBQSxTQUFBOztVQUVBLE9BQUE7OztRQUdBLFNBQUEsZUFBQSxNQUFBLFVBQUE7WUFDQSxJQUFBLGVBQUEsS0FBQTtZQUNBLElBQUEsWUFBQTtZQUNBLElBQUEsa0JBQUE7WUFDQSxJQUFBLHNCQUFBO1lBQ0EsSUFBQSxVQUFBO1lBQ0EsSUFBQSxZQUFBO1lBQ0EsSUFBQSxlQUFBO1lBQ0EsSUFBQSxlQUFBO1lBQ0EsSUFBQSxVQUFBO1lBQ0EsUUFBQSxRQUFBLE1BQUEsU0FBQSxPQUFBO2NBQ0EsSUFBQSxnQkFBQTtjQUNBLElBQUEsb0JBQUE7Ozs7O2NBS0EsR0FBQSxNQUFBLGNBQUEsUUFBQSxPQUFBLENBQUEsRUFBQTtnQkFDQSxNQUFBLGdCQUFBLE1BQUEsY0FBQSxRQUFBLElBQUE7Z0JBQ0E7OztjQUdBLEdBQUEsTUFBQSxNQUFBLGVBQUE7Z0JBQ0E7bUJBQ0E7O2dCQUVBLE1BQUEsZ0JBQUEsU0FBQSxNQUFBOztnQkFFQSxHQUFBLE1BQUEsaUJBQUEsTUFBQSxNQUFBLGdCQUFBLElBQUE7a0JBQ0Esa0JBQUEsT0FBQSxNQUFBO2tCQUNBLGtCQUFBLFVBQUEsTUFBQTtrQkFDQSxrQkFBQSxTQUFBLE1BQUE7a0JBQ0Esa0JBQUEsT0FBQSxDQUFBLElBQUEsS0FBQSxLQUFBLE1BQUEsTUFBQSxRQUFBO2tCQUNBLG9CQUFBLEtBQUE7c0JBQ0EsR0FBQSxNQUFBLGlCQUFBLElBQUE7a0JBQ0EsY0FBQSxPQUFBLE1BQUE7a0JBQ0EsY0FBQSxVQUFBLE1BQUE7a0JBQ0EsY0FBQSxTQUFBLE1BQUE7a0JBQ0EsY0FBQSxPQUFBLENBQUEsSUFBQSxLQUFBLEtBQUEsTUFBQSxNQUFBLFFBQUE7a0JBQ0EsZ0JBQUEsS0FBQTs7O2dCQUdBLGFBQUEsTUFBQTs7OztjQUlBLEdBQUEsQ0FBQSxNQUFBLE1BQUEsWUFBQSxTQUFBLE1BQUEsV0FBQSxFQUFBO2dCQUNBLE1BQUEsVUFBQSxTQUFBLE1BQUE7Z0JBQ0EsZ0JBQUEsTUFBQTs7Y0FFQSxHQUFBLENBQUEsTUFBQSxNQUFBLFlBQUEsU0FBQSxNQUFBLFdBQUEsRUFBQTtnQkFDQSxNQUFBLFVBQUEsU0FBQSxNQUFBO2dCQUNBLFdBQUEsTUFBQTs7Y0FFQSxHQUFBLENBQUEsTUFBQSxNQUFBLGVBQUE7Z0JBQ0EsTUFBQSxnQkFBQSxTQUFBLE1BQUE7Z0JBQ0EsZ0JBQUEsTUFBQTs7OztVQUlBLElBQUEsZUFBQSxlQUFBO1VBQ0EsSUFBQSxRQUFBO1lBQ0EsZUFBQTtZQUNBLFdBQUE7WUFDQSxxQkFBQSxvQkFBQTtZQUNBLGlCQUFBLGdCQUFBO1lBQ0EsZUFBQSxLQUFBLElBQUEsTUFBQSxLQUFBLGdCQUFBLElBQUEsU0FBQSxNQUFBLENBQUEsT0FBQSxNQUFBO1lBQ0EsU0FBQTtZQUNBLGNBQUE7WUFDQSxnQkFBQSxDQUFBLGFBQUEsZUFBQSxVQUFBLFFBQUE7WUFDQSxjQUFBO1lBQ0EsY0FBQTtZQUNBLGdCQUFBLENBQUEsZUFBQSxjQUFBLFFBQUE7WUFDQSxTQUFBO1lBQ0EsY0FBQTs7VUFFQSxHQUFBLGFBQUEsT0FBQSxhQUFBLGFBQUE7Y0FDQSxPQUFBLFNBQUE7O1VBRUEsT0FBQTs7Ozs7O0FDNUlBLFFBQUEsT0FBQTtLQUNBLFdBQUEsK0JBQUEsU0FBQSxRQUFBO01BQ0EsT0FBQSxPQUFBLFdBQUE7YUFDQSxPQUFBLE9BQUE7Y0FDQSxTQUFBLEdBQUE7ZUFDQSxHQUFBLENBQUEsRUFBQTtlQUNBLE9BQUEsaUJBQUEsT0FBQTs7O01BR0EsT0FBQSxtQkFBQSxTQUFBLGFBQUE7UUFDQSxJQUFBLFNBQUEsRUFBQSxNQUFBLGNBQUE7UUFDQSxJQUFBLFVBQUEsRUFBQSxNQUFBLGNBQUE7O1FBRUEsSUFBQSxTQUFBO1FBQ0EsYUFBQSxJQUFBLFNBQUEsS0FBQSxJQUFBO1VBQ0EsR0FBQSxJQUFBLFVBQUEsTUFBQTtZQUNBLE9BQUEsT0FBQTtnQkFDQSxHQUFBLElBQUEsVUFBQSxPQUFBO1lBQ0EsT0FBQSxPQUFBO2dCQUNBLEdBQUEsSUFBQSxVQUFBLE9BQUE7WUFDQSxPQUFBLE9BQUE7ZUFDQTtZQUNBLE9BQUEsT0FBQTs7O1FBR0EsSUFBQSxNQUFBLEVBQUEsT0FBQSxjQUFBLFNBQUEsS0FBQTtVQUNBLE9BQUEsS0FBQSxVQUFBOztRQUVBLElBQUEsT0FBQSxFQUFBLE9BQUEsY0FBQSxTQUFBLEtBQUE7VUFDQSxPQUFBLEtBQUEsV0FBQTs7UUFFQSxJQUFBLE9BQUEsRUFBQSxPQUFBLGNBQUEsU0FBQSxLQUFBO1VBQ0EsT0FBQSxLQUFBLFdBQUE7O1FBRUEsSUFBQSxXQUFBLEVBQUEsT0FBQSxjQUFBLFNBQUEsS0FBQTtVQUNBLE9BQUEsS0FBQSxXQUFBOztRQUVBLE9BQUEsZUFBQSxDQUFBLElBQUEsT0FBQSxhQUFBLFFBQUEsUUFBQSxLQUFBO1FBQ0EsT0FBQSxnQkFBQSxRQUFBLFNBQUE7UUFDQSxPQUFBLHFCQUFBLElBQUEsUUFBQSxLQUFBLFFBQUEsS0FBQSxRQUFBLFNBQUE7O01BRUEsT0FBQSxrQkFBQSxVQUFBLE9BQUEsU0FBQSxPQUFBO1FBQ0EsT0FBQSxVQUFBO2VBQ0EsUUFBQTtlQUNBLFVBQUEsQ0FBQTttQkFDQSxPQUFBO21CQUNBLFdBQUE7bUJBQ0EsYUFBQTttQkFDQSxZQUFBO21CQUNBLGtCQUFBO21CQUNBLG9CQUFBO21CQUNBLHNCQUFBO21CQUNBLE1BQUE7Ozs7O1dBS0EsT0FBQSxhQUFBOzs7ZUFHQSxZQUFBOzs7ZUFHQSxrQkFBQTs7O2VBR0Esb0JBQUE7OztlQUdBLG9CQUFBOzs7ZUFHQSxvQkFBQTs7O2VBR0EsZUFBQTs7O2VBR0EsZ0JBQUE7OztlQUdBLGlCQUFBOzs7ZUFHQSxtQkFBQTs7O2VBR0EsZ0JBQUE7Ozs7TUFJQSxPQUFBLHVCQUFBLFNBQUEsS0FBQSxNQUFBLE1BQUEsU0FBQTtRQUNBLE9BQUEsWUFBQSxDQUFBO2VBQ0EsT0FBQTtlQUNBLE9BQUE7ZUFDQSxXQUFBO2VBQ0EsT0FBQTtjQUNBO2VBQ0EsT0FBQTtlQUNBLE9BQUE7ZUFDQSxXQUFBO2VBQ0EsT0FBQTtjQUNBO2VBQ0EsT0FBQTtlQUNBLE9BQUE7ZUFDQSxXQUFBO2VBQ0EsT0FBQTtjQUNBO2VBQ0EsT0FBQTtlQUNBLE9BQUE7ZUFDQSxXQUFBO2VBQ0EsT0FBQTs7Ozs7V0FLQSxPQUFBLFVBQUE7OztlQUdBLFlBQUE7OztlQUdBLG1CQUFBOzs7ZUFHQSxvQkFBQTs7O2VBR0Esb0JBQUE7OztlQUdBLHVCQUFBOzs7ZUFHQSxnQkFBQTs7O2VBR0EsaUJBQUE7OztlQUdBLGVBQUE7OztlQUdBLGNBQUE7OztlQUdBLGdCQUFBOzs7Ozs7OztBQVFBIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbImFuZ3VsYXIubW9kdWxlKCdhcHAnLFtcbiAgJ25nUm91dGUnLCd1aS5yb3V0ZXInLCd0Yy5jaGFydGpzJ1xuXSlcbiIsImFuZ3VsYXIubW9kdWxlKCdhcHAnKVxuICAgIC5jb250cm9sbGVyKCdob21lQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJGh0dHAsIGRhdGFNdXRhdG9yKSB7XG4gICAgICAgICRzY29wZS5zZXR1cCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGRhdGFNdXRhdG9yLmdldERhdGEoKVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgZGF0YU11dGF0b3IuY3N2VG9KU09OKHJlc3BvbnNlLmRhdGEsIGZ1bmN0aW9uKGNzdil7XG4gICAgICAgICAgICAgICAgICAgIGRhdGFNdXRhdG9yLmdldENhcmVlclN0YXRzKGNzdiwgZnVuY3Rpb24oc3RhdHMpe1xuICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHN0YXRzKVxuICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zdGF0cyA9IHN0YXRzXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICB9LCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgJHNjb3BlLnNldHVwKCk7ICAgICAgICBcbiAgICB9KVxuIiwiYW5ndWxhci5tb2R1bGUoJ2FwcCcpXG4gICAgLmNvbnRyb2xsZXIoJ21hc3RlckN0cmwnLCBmdW5jdGlvbigkc2NvcGUsICRyb290U2NvcGUpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJtYXN0ZXJDdHJsXCIpO1xuICAgIH0pXG4iLCJhbmd1bGFyLm1vZHVsZSgnYXBwJylcbiAgICAuY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyKSB7XG5cbiAgICAgICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnLycpO1xuXG4gICAgICAgICRzdGF0ZVByb3ZpZGVyXG4gICAgICAgICAgICAuc3RhdGUoJ2FwcCcsIHtcbiAgICAgICAgICAgICAgICB1cmw6ICcvJyxcbiAgICAgICAgICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgICAgICAgICAnaGVhZGVyJzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvbmF2Lmh0bWwnLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAnY29udGVudCc6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL2hvbWUuaHRtbCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnaG9tZUN0cmwnXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuXG5cblxuICAgICAgICAuc3RhdGUoJ2FwcC5ob21lJywge1xuICAgICAgICAgICAgdXJsOiAnaG9tZScsXG4gICAgICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgICAgICdjb250ZW50QCc6IHtcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd1c2Vycy9ob21lLmh0bWwnLFxuICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnaG9tZUN0cmwnXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0pXG5cblxuXG5cbiAgICAgICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpXG5cbiAgICB9KTtcbiIsImFuZ3VsYXIubW9kdWxlKCdhcHAnKVxuICAgIC5kaXJlY3RpdmUoJ2NhcmVlclN0YXRzJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybntcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge1xuICAgICAgICAgICAgICAgIHN0YXRzOiAnPWl0ZW0nLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAncGFydGlhbHMvY2FyZWVyU3RhdHMuaHRtbCdcbiAgICAgICAgICAgICAgICAvL2NvbnRyb2xsZXI6ICdhcHAucGFydGlhbHMudmVudWVzLnZlbnVlSXRlbUN0cmwnXG4gICAgICAgIH1cbiAgICB9KVxuIiwiYW5ndWxhci5tb2R1bGUoJ2FwcCcpXG4gICAgLmRpcmVjdGl2ZSgnY2VudHVyeVN0YXRzJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybntcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge1xuICAgICAgICAgICAgICAgIGNlbnR1cnlTdGF0czogJz1pdGVtJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3BhcnRpYWxzL2NlbnR1cnlTdGF0cy5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdjZW50dXJ5U3RhdHNDdHJsJ1xuICAgICAgICB9XG4gICAgfSlcbiIsImFuZ3VsYXIubW9kdWxlKCdhcHAnKVxuICAgIC5kaXJlY3RpdmUoJ3BlcnNvbmFsSW5mbycsIGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm57XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLCAgICAgICAgICAgIFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdwYXJ0aWFscy9wZXJzb25hbEluZm8uaHRtbCdcbiAgICAgICAgfVxuICAgIH0pXG4iLCIvL1RoaW5ncyB3ZSBjYW4gZ2V0IGZyb20gdGhlIGRhdGEgOiAtXG4vL1RvdGFsIG1hdGNoZXMgcGxheWVkIC1kb25lXG4vL1RvdGFsIGNlbnR1cmllcyBzY29yZWQgLSBkb25lXG4vL3J1bnMgc2NvcmVkIGluIGEgeWVhclxuLy9jZW50dXJpZXMgc2NvcmVkIGluIGEgeWVhclxuLy9oYWxmIGNlbnR1cmllcyBzY29yZWQgaW4gYSB5ZWFyXG4vL2hhbGYgY2VudHVyaWVzIGNvdmVydGVkIGludG8gY2VudHVyeVxuLy9uZXJ2b3VzIG5pbmV0aWVzXG4vL3Njb3JlIGFnYWluc3QgdGhlIHRlYW1zXG4vL3Njb3JlIGluIHRoZSB3aW5uaW5nIGNhdXNlIC0gZG9uZVxuLy9ib3dsaW5nIGZpZ3VyZXMtIGRvbmVcbi8vcGVyZm9ybWFuY2UgaW4gY2xvc2UgbWF0Y2hlc1xuLy9iYXR0aW5nIGZpcnN0IHBlcmZvcm1hbmNlXG4vL21vdmluZyBhdmVyYWdlLCBsb25naXR1ZGFuYWwgY2FyZWVyIGdyb3d0aFxuLy8xMDAwIFJ1bnMgaW4gb25lIGNhbGVuZGFyIHllYXJcbi8vYmF0dGluZyBzZWNvbmQgcGVyZm9ybWFuY2UgKHdoaWxlIGNoYXNpbmcpXG5cbi8vVE9ETzpcbi8vR2V0IGNlbnR1cmllcyBieSBjb3VudHJ5XG4vL0dldCBjZW50dXJpZXMgYnkgeWVhclxuLy9HZXQgcnVucyBieSBjb3VudHJ5XG4vL0dldCBydW5zIGJ5IHllYXJcbi8vR2V0IHJ1bnMgYnkgd2lubmluZ1xuLy9HZXQgcnVucyBieSBsb29zaW5nXG4vL0dldCBjZW50dXJpZXMgaW4gd2lubmluZyBjYXVzZVxuXG5cblxuLy9OT1RFOiBPbmNlIGFsbCBkYXRhIGlzIGNvbGxlY3RlZCBjbGVhbiBvdXQgdGhlIGNhbGxiYWNrIGhlbGwgOlBcbmFuZ3VsYXIubW9kdWxlKCdhcHAnKVxuICAgIC5zZXJ2aWNlKCdkYXRhTXV0YXRvcicsIGZ1bmN0aW9uKCRodHRwKSB7XG4gICAgICAgIHJldHVybntcbiAgICAgICAgICAgIGdldERhdGE6IGdldERhdGEsXG4gICAgICAgICAgICBjc3ZUb0pTT046IGNzdlRvSlNPTixcbiAgICAgICAgICAgIGdldENhcmVlclN0YXRzOiBnZXRDYXJlZXJTdGF0c1xuXG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBnZXREYXRhKCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2RhdGEvc2FjaGluLmNzdicpXG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBjc3ZUb0pTT04oY3N2LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgdmFyIGxpbmVzPWNzdi5zcGxpdChcIlxcblwiKTtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICAgICAgICAgIHZhciBoZWFkZXJzPWxpbmVzWzBdLnNwbGl0KFwiLFwiKTtcbiAgICAgICAgICAgIGZvcih2YXIgaT0xO2k8bGluZXMubGVuZ3RoIC0xO2krKyl7XG4gICAgICAgICAgICAgICAgdmFyIG9iaiA9IHt9O1xuICAgICAgICAgICAgICAgIHZhciBjdXJyZW50bGluZT1saW5lc1tpXS5zcGxpdChcIixcIik7XG4gICAgICAgICAgICAgICAgZm9yKHZhciBqPTA7ajxoZWFkZXJzLmxlbmd0aDtqKyspe1xuICAgICAgICAgICAgICAgICAgb2JqW2hlYWRlcnNbal1dID0gY3VycmVudGxpbmVbal07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKG9iaik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhyZXN1bHQpXG4gICAgICAgICAgICBpZihjYWxsYmFjayAmJiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhyZXN1bHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBnZXRDYXJlZXJTdGF0cyhkYXRhLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgdmFyIHRvdGFsTWF0Y2hlcyA9IGRhdGEubGVuZ3RoO1xuICAgICAgICAgICAgdmFyIHRvdGFsUnVucyA9IDA7XG4gICAgICAgICAgICB2YXIgY2VudHVyaWVzU2NvcmVkID0gW107XG4gICAgICAgICAgICB2YXIgaGFsZkNlbnR1cmllc1Njb3JlZCA9IFtdO1xuICAgICAgICAgICAgdmFyIG5vdE91dHMgPSAwO1xuICAgICAgICAgICAgdmFyIGRpZE5vdEJhdCA9IDA7XG4gICAgICAgICAgICB2YXIgd2lja2V0c1Rha2VuID0gMDtcbiAgICAgICAgICAgIHZhciBydW5zQ29uY2VkZWQgPSAwO1xuICAgICAgICAgICAgdmFyIGNhdGNoZXMgPSAwO1xuICAgICAgICAgICAgYW5ndWxhci5mb3JFYWNoKGRhdGEsIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICAgIHZhciBjZW50dXJ5RGV0YWlsID0ge307XG4gICAgICAgICAgICAgIHZhciBoYWxmQ2VudHVyeURldGFpbCA9IHt9O1xuXG4gICAgICAgICAgICAgIC8vQmF0dGluZyBzdGF0c1xuXG4gICAgICAgICAgICAgIC8vY2hlY2sgdG8gc2VlIGlmIHRoZSBzY29yZSBjb250YWlucyBhICogaW4gdGhlIGVuZCB3aGljaCBkZW50b2VzIE5vdE91dHMsIGlmIHllcyByZW1vdmUgZm9yIGNhbGN1bGF0aW9uc1xuICAgICAgICAgICAgICBpZih2YWx1ZS5iYXR0aW5nX3Njb3JlLmluZGV4T2YoXCIqXCIpID4gLTEpe1xuICAgICAgICAgICAgICAgIHZhbHVlLmJhdHRpbmdfc2NvcmUgPSB2YWx1ZS5iYXR0aW5nX3Njb3JlLnJlcGxhY2UoJyonLCcnKTtcbiAgICAgICAgICAgICAgICBub3RPdXRzKys7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgLy9pZiB0aGUgdmFsdWUgb2Ygc2NvcmUgaXMgTm90IGEgbnVtYmVyICwgaXQgbWVhbnMgaXQgY291bGQgYmUgRE5CKGRpZCBub3QgYmF0KSBvciBURE5CICh0ZWFtIGRpZCBub3QgYmF0KVxuICAgICAgICAgICAgICBpZihpc05hTih2YWx1ZS5iYXR0aW5nX3Njb3JlKSl7XG4gICAgICAgICAgICAgICAgZGlkTm90QmF0Kys7XG4gICAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgIC8vQ29udmVydGluZyB0aGUgc3RyaW5nIHRvIGludGVnZXJzIHRvIGRvIGNhbGN1bGF0aW9uc1xuICAgICAgICAgICAgICAgIHZhbHVlLmJhdHRpbmdfc2NvcmUgPSBwYXJzZUludCh2YWx1ZS5iYXR0aW5nX3Njb3JlKVxuICAgICAgICAgICAgICAgIC8vQ2hlY2tpbmcgdG8gc2VlIGlmIHRoZSBzY29yZSB3YXMgYSBoYWxmIGNlbnR1cnkgb3IgY2VudHVyeVxuICAgICAgICAgICAgICAgIGlmKHZhbHVlLmJhdHRpbmdfc2NvcmUgPj0gNTAgJiYgdmFsdWUuYmF0dGluZ19zY29yZSA8IDEwMCl7XG4gICAgICAgICAgICAgICAgICBoYWxmQ2VudHVyeURldGFpbC5ydW5zID0gdmFsdWUuYmF0dGluZ19zY29yZVxuICAgICAgICAgICAgICAgICAgaGFsZkNlbnR1cnlEZXRhaWwuYWdhaW5zdCA9IHZhbHVlLm9wcG9zaXRpb25cbiAgICAgICAgICAgICAgICAgIGhhbGZDZW50dXJ5RGV0YWlsLnJlc3VsdCA9IHZhbHVlLm1hdGNoX3Jlc3VsdFxuICAgICAgICAgICAgICAgICAgaGFsZkNlbnR1cnlEZXRhaWwueWVhciA9IChuZXcgRGF0ZShEYXRlLnBhcnNlKHZhbHVlLmRhdGUpKSkuZ2V0RnVsbFllYXIoKVxuICAgICAgICAgICAgICAgICAgaGFsZkNlbnR1cmllc1Njb3JlZC5wdXNoKGhhbGZDZW50dXJ5RGV0YWlsKVxuICAgICAgICAgICAgICAgIH1lbHNlIGlmKHZhbHVlLmJhdHRpbmdfc2NvcmUgPj0gMTAwKXtcbiAgICAgICAgICAgICAgICAgIGNlbnR1cnlEZXRhaWwucnVucyA9IHZhbHVlLmJhdHRpbmdfc2NvcmVcbiAgICAgICAgICAgICAgICAgIGNlbnR1cnlEZXRhaWwuYWdhaW5zdCA9IHZhbHVlLm9wcG9zaXRpb25cbiAgICAgICAgICAgICAgICAgIGNlbnR1cnlEZXRhaWwucmVzdWx0ID0gdmFsdWUubWF0Y2hfcmVzdWx0XG4gICAgICAgICAgICAgICAgICBjZW50dXJ5RGV0YWlsLnllYXIgPSAobmV3IERhdGUoRGF0ZS5wYXJzZSh2YWx1ZS5kYXRlKSkpLmdldEZ1bGxZZWFyKClcbiAgICAgICAgICAgICAgICAgIGNlbnR1cmllc1Njb3JlZC5wdXNoKGNlbnR1cnlEZXRhaWwpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vU2F2aW5nIHRvdGFsIHJ1bnNcbiAgICAgICAgICAgICAgICB0b3RhbFJ1bnMgKz0gdmFsdWUuYmF0dGluZ19zY29yZTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIC8vQm93bGluZyBzdGF0c1xuICAgICAgICAgICAgICBpZighaXNOYU4odmFsdWUud2lja2V0cykgJiYgcGFyc2VJbnQodmFsdWUud2lja2V0cykgPiAwKXtcbiAgICAgICAgICAgICAgICB2YWx1ZS53aWNrZXRzID0gcGFyc2VJbnQodmFsdWUud2lja2V0cylcbiAgICAgICAgICAgICAgICB3aWNrZXRzVGFrZW4gKz0gdmFsdWUud2lja2V0c1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmKCFpc05hTih2YWx1ZS5jYXRjaGVzKSAmJiBwYXJzZUludCh2YWx1ZS5jYXRjaGVzKSA+IDApe1xuICAgICAgICAgICAgICAgIHZhbHVlLmNhdGNoZXMgPSBwYXJzZUludCh2YWx1ZS5jYXRjaGVzKVxuICAgICAgICAgICAgICAgIGNhdGNoZXMgKz0gdmFsdWUuY2F0Y2hlc1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmKCFpc05hTih2YWx1ZS5ydW5zX2NvbmNlZGVkKSl7XG4gICAgICAgICAgICAgICAgdmFsdWUucnVuc19jb25jZWRlZCA9IHBhcnNlSW50KHZhbHVlLnJ1bnNfY29uY2VkZWQpXG4gICAgICAgICAgICAgICAgcnVuc0NvbmNlZGVkICs9IHZhbHVlLnJ1bnNfY29uY2VkZWQ7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgdmFyIHRvdGFsSW5uaW5ncyA9IHRvdGFsTWF0Y2hlcyAtIGRpZE5vdEJhdFxuICAgICAgICAgIHZhciBzdGF0cyA9IHtcbiAgICAgICAgICAgIHRvdGFsTWF0Y2hlcyA6IHRvdGFsTWF0Y2hlcyxcbiAgICAgICAgICAgIHRvdGFsUnVuczogdG90YWxSdW5zLFxuICAgICAgICAgICAgaGFsZkNlbnR1cmllc1Njb3JlZDogaGFsZkNlbnR1cmllc1Njb3JlZC5sZW5ndGgsXG4gICAgICAgICAgICBjZW50dXJpZXNTY29yZWQ6IGNlbnR1cmllc1Njb3JlZC5sZW5ndGgsXG4gICAgICAgICAgICBoaWdoZXN0U2NvcmU6ICBNYXRoLm1heC5hcHBseShudWxsLGNlbnR1cmllc1Njb3JlZC5tYXAoZnVuY3Rpb24oaW5kZXgpe3JldHVybiBpbmRleC5ydW5zfSkpLFxuICAgICAgICAgICAgbm90T3V0czogbm90T3V0cyxcbiAgICAgICAgICAgIHRvdGFsSW5uaW5nczogdG90YWxJbm5pbmdzLFxuICAgICAgICAgICAgYmF0dGluZ0F2ZXJhZ2U6ICh0b3RhbFJ1bnMgLyAodG90YWxJbm5pbmdzIC0gbm90T3V0cykpLnRvRml4ZWQoMiksXG4gICAgICAgICAgICB3aWNrZXRzVGFrZW46IHdpY2tldHNUYWtlbixcbiAgICAgICAgICAgIHJ1bnNDb25jZWRlZDogcnVuc0NvbmNlZGVkLFxuICAgICAgICAgICAgYm93bGluZ0F2ZXJhZ2U6IChydW5zQ29uY2VkZWQgLyB3aWNrZXRzVGFrZW4pLnRvRml4ZWQoMiksXG4gICAgICAgICAgICBjYXRjaGVzOiBjYXRjaGVzLFxuICAgICAgICAgICAgYWxsQ2VudHVyaWVzOiBjZW50dXJpZXNTY29yZWRcbiAgICAgICAgICB9O1xuICAgICAgICAgIGlmKGNhbGxiYWNrICYmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhzdGF0cyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBzdGF0c1xuICAgICAgICB9XG5cblxuICAgIH0pXG4iLCJhbmd1bGFyLm1vZHVsZSgnYXBwJylcbiAgICAuY29udHJvbGxlcignY2VudHVyeVN0YXRzQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSkge1xuICAgICAgJHNjb3BlLiR3YXRjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICByZXR1cm4gJHNjb3BlLmNlbnR1cnlTdGF0cztcbiAgICAgICAgICAgfSwgZnVuY3Rpb24obikge1xuICAgICAgICAgICAgICAgaWYoIW4pcmV0dXJuXG4gICAgICAgICAgICAgICAkc2NvcGUuYW5hbHl6ZUNlbnR1cmllcygkc2NvcGUuY2VudHVyeVN0YXRzKVxuICAgICAgICAgICB9KTtcblxuICAgICAgJHNjb3BlLmFuYWx5emVDZW50dXJpZXMgPSBmdW5jdGlvbihjZW50dXJ5U3RhdHMpe1xuICAgICAgICB2YXIgc2NvcmVzID0gXy5wbHVjayhjZW50dXJ5U3RhdHMsICdydW5zJylcbiAgICAgICAgdmFyIGFnYWluc3QgPSBfLnBsdWNrKGNlbnR1cnlTdGF0cywgJ2FnYWluc3QnKVxuICAgICAgICAvL1NlbmQgYXJyYXkgb2YgY29sb3JzIHRvIGNoYXJ0anNcbiAgICAgICAgdmFyIGNvbG9ycyA9IFtdO1xuICAgICAgICBjZW50dXJ5U3RhdHMubWFwKGZ1bmN0aW9uKHJlcywga2V5KXtcbiAgICAgICAgICBpZihyZXMucmVzdWx0ID09IFwid29uXCIpe1xuICAgICAgICAgICAgY29sb3JzW2tleV0gPSBcIiMwMDg0RkZcIlxuICAgICAgICAgIH1lbHNlIGlmKHJlcy5yZXN1bHQgPT0gXCJsb3N0XCIpe1xuICAgICAgICAgICAgY29sb3JzW2tleV0gPSBcIiNFRDNGMkZcIlxuICAgICAgICAgIH1lbHNlIGlmKHJlcy5yZXN1bHQgPT0gXCJ0aWVkXCIpe1xuICAgICAgICAgICAgY29sb3JzW2tleV0gPSBcImJsYWNrXCJcbiAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIGNvbG9yc1trZXldID0gXCJ5ZWxsb3dcIlxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgdmFyIHdvbiA9IF8uZmlsdGVyKGNlbnR1cnlTdGF0cywgZnVuY3Rpb24oY2VudCl7XG4gICAgICAgICAgcmV0dXJuIGNlbnQucmVzdWx0ID09IFwid29uXCJcbiAgICAgICAgfSlcbiAgICAgICAgdmFyIGxvc3QgPSBfLmZpbHRlcihjZW50dXJ5U3RhdHMsIGZ1bmN0aW9uKGNlbnQpe1xuICAgICAgICAgIHJldHVybiBjZW50LnJlc3VsdCA9PT0gXCJsb3N0XCJcbiAgICAgICAgfSlcbiAgICAgICAgdmFyIHRpZWQgPSBfLmZpbHRlcihjZW50dXJ5U3RhdHMsIGZ1bmN0aW9uKGNlbnQpe1xuICAgICAgICAgIHJldHVybiBjZW50LnJlc3VsdCA9PT0gXCJ0aWVkXCJcbiAgICAgICAgfSlcbiAgICAgICAgdmFyIG5vcmVzdWx0ID0gXy5maWx0ZXIoY2VudHVyeVN0YXRzLCBmdW5jdGlvbihjZW50KXtcbiAgICAgICAgICByZXR1cm4gY2VudC5yZXN1bHQgPT09IFwibi9yXCJcbiAgICAgICAgfSlcbiAgICAgICAgJHNjb3BlLndpbm5pbmdSYXRpbyA9ICh3b24ubGVuZ3RoL2NlbnR1cnlTdGF0cy5sZW5ndGgpLnRvRml4ZWQoMikgKiAxMDtcbiAgICAgICAgJHNjb3BlLnByZXBhcmVCYXJHcmFwaChzY29yZXMsIGFnYWluc3QsIGNvbG9ycylcbiAgICAgICAgJHNjb3BlLnByZXBhcmVEb3VnaG51dENoYXJ0KHdvbi5sZW5ndGgsIGxvc3QubGVuZ3RoLCB0aWVkLmxlbmd0aCwgbm9yZXN1bHQubGVuZ3RoKVxuICAgICAgfVxuICAgICAgJHNjb3BlLnByZXBhcmVCYXJHcmFwaCA9IGZ1bmN0aW9uIChzY29yZXMsYWdhaW5zdCwgY29sb3JzKXtcbiAgICAgICAgJHNjb3BlLmJhcmRhdGEgPSB7XG4gICAgICAgICAgICAgICBsYWJlbHM6IGFnYWluc3QsXG4gICAgICAgICAgICAgICBkYXRhc2V0czogW3tcbiAgICAgICAgICAgICAgICAgICBsYWJlbDogJ0NlbnR1cmllcycsXG4gICAgICAgICAgICAgICAgICAgZmlsbENvbG9yOiBjb2xvcnMsXG4gICAgICAgICAgICAgICAgICAgc3Ryb2tlQ29sb3I6ICdyZ2JhKDIyMCwyMjAsMjIwLDEpJyxcbiAgICAgICAgICAgICAgICAgICBwb2ludENvbG9yOiAncmdiYSgyMjAsMjIwLDIyMCwxKScsXG4gICAgICAgICAgICAgICAgICAgcG9pbnRTdHJva2VDb2xvcjogJyNmZmYnLFxuICAgICAgICAgICAgICAgICAgIHBvaW50SGlnaGxpZ2h0RmlsbDogJyNmZmYnLFxuICAgICAgICAgICAgICAgICAgIHBvaW50SGlnaGxpZ2h0U3Ryb2tlOiAncmdiYSgyMjAsMjIwLDIyMCwxKScsXG4gICAgICAgICAgICAgICAgICAgZGF0YTogc2NvcmVzXG4gICAgICAgICAgICAgICB9XVxuICAgICAgICAgICB9O1xuXG4gICAgICAgICAgIC8vIENoYXJ0LmpzIE9wdGlvbnNcbiAgICAgICAgICAgJHNjb3BlLmJhcm9wdGlvbnMgPSB7XG5cbiAgICAgICAgICAgICAgIC8vIFNldHMgdGhlIGNoYXJ0IHRvIGJlIHJlc3BvbnNpdmVcbiAgICAgICAgICAgICAgIHJlc3BvbnNpdmU6IHRydWUsXG5cbiAgICAgICAgICAgICAgIC8vQm9vbGVhbiAtIFdoZXRoZXIgdGhlIHNjYWxlIHNob3VsZCBzdGFydCBhdCB6ZXJvLCBvciBhbiBvcmRlciBvZiBtYWduaXR1ZGUgZG93biBmcm9tIHRoZSBsb3dlc3QgdmFsdWVcbiAgICAgICAgICAgICAgIHNjYWxlQmVnaW5BdFplcm86IHRydWUsXG5cbiAgICAgICAgICAgICAgIC8vQm9vbGVhbiAtIFdoZXRoZXIgZ3JpZCBsaW5lcyBhcmUgc2hvd24gYWNyb3NzIHRoZSBjaGFydFxuICAgICAgICAgICAgICAgc2NhbGVTaG93R3JpZExpbmVzOiB0cnVlLFxuXG4gICAgICAgICAgICAgICAvL1N0cmluZyAtIENvbG91ciBvZiB0aGUgZ3JpZCBsaW5lc1xuICAgICAgICAgICAgICAgc2NhbGVHcmlkTGluZUNvbG9yOiBcInJnYmEoMCwwLDAsLjA1KVwiLFxuXG4gICAgICAgICAgICAgICAvL051bWJlciAtIFdpZHRoIG9mIHRoZSBncmlkIGxpbmVzXG4gICAgICAgICAgICAgICBzY2FsZUdyaWRMaW5lV2lkdGg6IDEsXG5cbiAgICAgICAgICAgICAgIC8vQm9vbGVhbiAtIElmIHRoZXJlIGlzIGEgc3Ryb2tlIG9uIGVhY2ggYmFyXG4gICAgICAgICAgICAgICBiYXJTaG93U3Ryb2tlOiB0cnVlLFxuXG4gICAgICAgICAgICAgICAvL051bWJlciAtIFBpeGVsIHdpZHRoIG9mIHRoZSBiYXIgc3Ryb2tlXG4gICAgICAgICAgICAgICBiYXJTdHJva2VXaWR0aDogMixcblxuICAgICAgICAgICAgICAgLy9OdW1iZXIgLSBTcGFjaW5nIGJldHdlZW4gZWFjaCBvZiB0aGUgWCB2YWx1ZSBzZXRzXG4gICAgICAgICAgICAgICBiYXJWYWx1ZVNwYWNpbmc6IDUsXG5cbiAgICAgICAgICAgICAgIC8vTnVtYmVyIC0gU3BhY2luZyBiZXR3ZWVuIGRhdGEgc2V0cyB3aXRoaW4gWCB2YWx1ZXNcbiAgICAgICAgICAgICAgIGJhckRhdGFzZXRTcGFjaW5nOiAxLFxuXG4gICAgICAgICAgICAgICAvL1N0cmluZyAtIEEgbGVnZW5kIHRlbXBsYXRlXG4gICAgICAgICAgICAgICBsZWdlbmRUZW1wbGF0ZTogJzx1bCBjbGFzcz1cInRjLWNoYXJ0LWpzLWxlZ2VuZFwiPjwlIGZvciAodmFyIGk9MDsgaTxkYXRhc2V0cy5sZW5ndGg7IGkrKyl7JT48bGk+PHNwYW4gc3R5bGU9XCJiYWNrZ3JvdW5kLWNvbG9yOjwlPWRhdGFzZXRzW2ldLmZpbGxDb2xvciU+XCI+PC9zcGFuPjwlaWYoZGF0YXNldHNbaV0ubGFiZWwpeyU+PCU9ZGF0YXNldHNbaV0ubGFiZWwlPjwlfSU+PC9saT48JX0lPjwvdWw+J1xuICAgICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICAkc2NvcGUucHJlcGFyZURvdWdobnV0Q2hhcnQgPSBmdW5jdGlvbih3b24sIGxvc3QsIHRpZWQsIG5vcmVzdWx0KXtcbiAgICAgICAgJHNjb3BlLnJlc291cmNlcyA9IFt7XG4gICAgICAgICAgICAgICB2YWx1ZTogd29uLFxuICAgICAgICAgICAgICAgY29sb3I6ICcjRkZGRjAwJyxcbiAgICAgICAgICAgICAgIGhpZ2hsaWdodDogJyNlNWU1MDAnLFxuICAgICAgICAgICAgICAgbGFiZWw6ICdXaW4nXG4gICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgIHZhbHVlOiBsb3N0LFxuICAgICAgICAgICAgICAgY29sb3I6ICcjNDZCRkJEJyxcbiAgICAgICAgICAgICAgIGhpZ2hsaWdodDogJyM1QUQzRDEnLFxuICAgICAgICAgICAgICAgbGFiZWw6ICdMb3NzJ1xuICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICB2YWx1ZTogdGllZCxcbiAgICAgICAgICAgICAgIGNvbG9yOiAnI0Y3NDY0QScsXG4gICAgICAgICAgICAgICBoaWdobGlnaHQ6ICcjRkY1QTVFJyxcbiAgICAgICAgICAgICAgIGxhYmVsOiAnVGllJ1xuICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICB2YWx1ZTogbm9yZXN1bHQsXG4gICAgICAgICAgICAgICBjb2xvcjogJyNGNzQ2NEEnLFxuICAgICAgICAgICAgICAgaGlnaGxpZ2h0OiAnI0VGNUE1RScsXG4gICAgICAgICAgICAgICBsYWJlbDogJ05vIFJlc3VsdCdcbiAgICAgICAgICAgfVxuICAgICAgICAgXTtcblxuICAgICAgICAgICAvLyBDaGFydC5qcyBPcHRpb25zXG4gICAgICAgICAgICRzY29wZS5vcHRpb25zID0ge1xuXG4gICAgICAgICAgICAgICAvLyBTZXRzIHRoZSBjaGFydCB0byBiZSByZXNwb25zaXZlXG4gICAgICAgICAgICAgICByZXNwb25zaXZlOiB0cnVlLFxuXG4gICAgICAgICAgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIHdlIHNob3VsZCBzaG93IGEgc3Ryb2tlIG9uIGVhY2ggc2VnbWVudFxuICAgICAgICAgICAgICAgc2VnbWVudFNob3dTdHJva2U6IHRydWUsXG5cbiAgICAgICAgICAgICAgIC8vU3RyaW5nIC0gVGhlIGNvbG91ciBvZiBlYWNoIHNlZ21lbnQgc3Ryb2tlXG4gICAgICAgICAgICAgICBzZWdtZW50U3Ryb2tlQ29sb3I6ICcjZmZmJyxcblxuICAgICAgICAgICAgICAgLy9OdW1iZXIgLSBUaGUgd2lkdGggb2YgZWFjaCBzZWdtZW50IHN0cm9rZVxuICAgICAgICAgICAgICAgc2VnbWVudFN0cm9rZVdpZHRoOiAyLFxuXG4gICAgICAgICAgICAgICAvL051bWJlciAtIFRoZSBwZXJjZW50YWdlIG9mIHRoZSBjaGFydCB0aGF0IHdlIGN1dCBvdXQgb2YgdGhlIG1pZGRsZVxuICAgICAgICAgICAgICAgcGVyY2VudGFnZUlubmVyQ3V0b3V0OiA1MCwgLy8gVGhpcyBpcyAwIGZvciBQaWUgY2hhcnRzXG5cbiAgICAgICAgICAgICAgIC8vTnVtYmVyIC0gQW1vdW50IG9mIGFuaW1hdGlvbiBzdGVwc1xuICAgICAgICAgICAgICAgYW5pbWF0aW9uU3RlcHM6IDEwMCxcblxuICAgICAgICAgICAgICAgLy9TdHJpbmcgLSBBbmltYXRpb24gZWFzaW5nIGVmZmVjdFxuICAgICAgICAgICAgICAgYW5pbWF0aW9uRWFzaW5nOiAnZWFzZU91dEJvdW5jZScsXG5cbiAgICAgICAgICAgICAgIC8vQm9vbGVhbiAtIFdoZXRoZXIgd2UgYW5pbWF0ZSB0aGUgcm90YXRpb24gb2YgdGhlIERvdWdobnV0XG4gICAgICAgICAgICAgICBhbmltYXRlUm90YXRlOiB0cnVlLFxuXG4gICAgICAgICAgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIHdlIGFuaW1hdGUgc2NhbGluZyB0aGUgRG91Z2hudXQgZnJvbSB0aGUgY2VudHJlXG4gICAgICAgICAgICAgICBhbmltYXRlU2NhbGU6IGZhbHNlLFxuXG4gICAgICAgICAgICAgICAvL1N0cmluZyAtIEEgbGVnZW5kIHRlbXBsYXRlXG4gICAgICAgICAgICAgICBsZWdlbmRUZW1wbGF0ZTogJzx1bCBjbGFzcz1cInRjLWNoYXJ0LWpzLWxlZ2VuZFwiPjwlIGZvciAodmFyIGk9MDsgaTxzZWdtZW50cy5sZW5ndGg7IGkrKyl7JT48bGk+PHNwYW4gc3R5bGU9XCJiYWNrZ3JvdW5kLWNvbG9yOjwlPXNlZ21lbnRzW2ldLmZpbGxDb2xvciU+XCI+PC9zcGFuPjwlaWYoc2VnbWVudHNbaV0ubGFiZWwpeyU+PCU9c2VnbWVudHNbaV0ubGFiZWwlPjwlfSU+PC9saT48JX0lPjwvdWw+J1xuXG4gICAgICAgICAgIH07XG5cbiAgICAgIH1cblxuXG4gICAgfSlcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
