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
//Total matches played
//Total centuries scored
//runs scored in a year
//centuries scored in a year
//half centuries scored in a year
//half centuries coverted into century
//nervous nineties
//score against the teams
//score in the winning cause
//bowling figures
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
                  halfCenturyDetail.year = value.date
                  halfCenturiesScored.push(halfCenturyDetail)
                }else if(value.batting_score >= 100){
                  centuryDetail.runs = value.batting_score
                  centuryDetail.against = value.opposition
                  centuryDetail.result = value.match_result
                  centuryDetail.year = value.date
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
      console.log($scope.centuryStats)
      console.log($scope)
        $scope.bardata = {
               labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
               datasets: [{
                   label: 'My First dataset',
                   fillColor: 'rgba(220,220,220,0.5)',
                   strokeColor: 'rgba(220,220,220,0.8)',
                   highlightFill: 'rgba(220,220,220,0.75)',
                   highlightStroke: 'rgba(220,220,220,1)',
                   data: [65, 59, 80, 81, 56, 55, 40]
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



    }])

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZHVsZS5qcyIsImNvbnRyb2xsZXJzL2hvbWVDdHJsLmpzIiwiY29udHJvbGxlcnMvbWFzdGVyQ3RybC5qcyIsImNvbnRyb2xsZXJzL3JvdXRlcy5qcyIsImRpcmVjdGl2ZXMvY2FyZWVyU3RhdHMuanMiLCJkaXJlY3RpdmVzL2NlbnR1cnlTdGF0cy5qcyIsImRpcmVjdGl2ZXMvcGVyc29uYWxJbmZvLmpzIiwic2VydmljZXMvZGF0YU11dGF0b3IuanMiLCJjb250cm9sbGVycy9wYXJ0aWFscy9jZW50dXJ5U3RhdHNDdHJsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFFBQUEsT0FBQSxNQUFBO0VBQ0EsVUFBQSxZQUFBOzs7QUNEQSxRQUFBLE9BQUE7S0FDQSxXQUFBLCtDQUFBLFNBQUEsUUFBQSxPQUFBLGFBQUE7UUFDQSxPQUFBLFFBQUEsV0FBQTtVQUNBLFlBQUE7V0FDQSxLQUFBLFNBQUEsVUFBQTtnQkFDQSxZQUFBLFVBQUEsU0FBQSxNQUFBLFNBQUEsSUFBQTtvQkFDQSxZQUFBLGVBQUEsS0FBQSxTQUFBLE1BQUE7c0JBQ0EsUUFBQSxJQUFBO3NCQUNBLE9BQUEsUUFBQTs7O2FBR0EsU0FBQSxLQUFBO2dCQUNBLFFBQUEsSUFBQTs7O1FBR0EsT0FBQTs7O0FDZkEsUUFBQSxPQUFBO0tBQ0EsV0FBQSx1Q0FBQSxTQUFBLFFBQUEsWUFBQTtRQUNBLFFBQUEsSUFBQTs7O0FDRkEsUUFBQSxPQUFBO0tBQ0EscUVBQUEsU0FBQSxnQkFBQSxvQkFBQSxtQkFBQTs7UUFFQSxtQkFBQSxVQUFBOztRQUVBO2FBQ0EsTUFBQSxPQUFBO2dCQUNBLEtBQUE7Z0JBQ0EsT0FBQTtvQkFDQSxVQUFBO3dCQUNBLGFBQUE7O29CQUVBLFdBQUE7d0JBQ0EsYUFBQTt3QkFDQSxZQUFBOzs7Ozs7O1NBT0EsTUFBQSxZQUFBO1lBQ0EsS0FBQTtZQUNBLE9BQUE7Z0JBQ0EsWUFBQTtvQkFDQSxhQUFBO29CQUNBLFlBQUE7Ozs7Ozs7OztRQVNBLGtCQUFBLFVBQUE7Ozs7QUNuQ0EsUUFBQSxPQUFBO0tBQ0EsVUFBQSxlQUFBLFdBQUE7UUFDQSxNQUFBO1lBQ0EsVUFBQTtZQUNBLE9BQUE7Z0JBQ0EsT0FBQTs7WUFFQSxhQUFBOzs7OztBQ1BBLFFBQUEsT0FBQTtLQUNBLFVBQUEsZ0JBQUEsV0FBQTtRQUNBLE1BQUE7WUFDQSxVQUFBO1lBQ0EsT0FBQTtnQkFDQSxjQUFBOztZQUVBLGFBQUE7WUFDQSxZQUFBOzs7O0FDUkEsUUFBQSxPQUFBO0tBQ0EsVUFBQSxnQkFBQSxXQUFBO1FBQ0EsTUFBQTtZQUNBLFVBQUE7WUFDQSxhQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUN5QkEsUUFBQSxPQUFBO0tBQ0EsUUFBQSx5QkFBQSxTQUFBLE9BQUE7UUFDQSxNQUFBO1lBQ0EsU0FBQTtZQUNBLFdBQUE7WUFDQSxnQkFBQTs7OztRQUlBLFNBQUEsVUFBQTtZQUNBLE9BQUEsTUFBQSxJQUFBOzs7UUFHQSxTQUFBLFVBQUEsS0FBQSxVQUFBO1lBQ0EsSUFBQSxNQUFBLElBQUEsTUFBQTtZQUNBLElBQUEsU0FBQTtZQUNBLElBQUEsUUFBQSxNQUFBLEdBQUEsTUFBQTtZQUNBLElBQUEsSUFBQSxFQUFBLEVBQUEsRUFBQSxNQUFBLFFBQUEsRUFBQSxJQUFBO2dCQUNBLElBQUEsTUFBQTtnQkFDQSxJQUFBLFlBQUEsTUFBQSxHQUFBLE1BQUE7Z0JBQ0EsSUFBQSxJQUFBLEVBQUEsRUFBQSxFQUFBLFFBQUEsT0FBQSxJQUFBO2tCQUNBLElBQUEsUUFBQSxNQUFBLFlBQUE7O2dCQUVBLE9BQUEsS0FBQTs7WUFFQSxRQUFBLElBQUE7WUFDQSxHQUFBLGFBQUEsT0FBQSxhQUFBLGFBQUE7Z0JBQ0EsT0FBQSxTQUFBOztVQUVBLE9BQUE7OztRQUdBLFNBQUEsZUFBQSxNQUFBLFVBQUE7WUFDQSxJQUFBLGVBQUEsS0FBQTtZQUNBLElBQUEsWUFBQTtZQUNBLElBQUEsa0JBQUE7WUFDQSxJQUFBLHNCQUFBO1lBQ0EsSUFBQSxVQUFBO1lBQ0EsSUFBQSxZQUFBO1lBQ0EsSUFBQSxlQUFBO1lBQ0EsSUFBQSxlQUFBO1lBQ0EsSUFBQSxVQUFBO1lBQ0EsUUFBQSxRQUFBLE1BQUEsU0FBQSxPQUFBO2NBQ0EsSUFBQSxnQkFBQTtjQUNBLElBQUEsb0JBQUE7Ozs7O2NBS0EsR0FBQSxNQUFBLGNBQUEsUUFBQSxPQUFBLENBQUEsRUFBQTtnQkFDQSxNQUFBLGdCQUFBLE1BQUEsY0FBQSxRQUFBLElBQUE7Z0JBQ0E7OztjQUdBLEdBQUEsTUFBQSxNQUFBLGVBQUE7Z0JBQ0E7bUJBQ0E7O2dCQUVBLE1BQUEsZ0JBQUEsU0FBQSxNQUFBOztnQkFFQSxHQUFBLE1BQUEsaUJBQUEsTUFBQSxNQUFBLGdCQUFBLElBQUE7a0JBQ0Esa0JBQUEsT0FBQSxNQUFBO2tCQUNBLGtCQUFBLFVBQUEsTUFBQTtrQkFDQSxrQkFBQSxTQUFBLE1BQUE7a0JBQ0Esa0JBQUEsT0FBQSxNQUFBO2tCQUNBLG9CQUFBLEtBQUE7c0JBQ0EsR0FBQSxNQUFBLGlCQUFBLElBQUE7a0JBQ0EsY0FBQSxPQUFBLE1BQUE7a0JBQ0EsY0FBQSxVQUFBLE1BQUE7a0JBQ0EsY0FBQSxTQUFBLE1BQUE7a0JBQ0EsY0FBQSxPQUFBLE1BQUE7a0JBQ0EsZ0JBQUEsS0FBQTs7O2dCQUdBLGFBQUEsTUFBQTs7OztjQUlBLEdBQUEsQ0FBQSxNQUFBLE1BQUEsWUFBQSxTQUFBLE1BQUEsV0FBQSxFQUFBO2dCQUNBLE1BQUEsVUFBQSxTQUFBLE1BQUE7Z0JBQ0EsZ0JBQUEsTUFBQTs7Y0FFQSxHQUFBLENBQUEsTUFBQSxNQUFBLFlBQUEsU0FBQSxNQUFBLFdBQUEsRUFBQTtnQkFDQSxNQUFBLFVBQUEsU0FBQSxNQUFBO2dCQUNBLFdBQUEsTUFBQTs7Y0FFQSxHQUFBLENBQUEsTUFBQSxNQUFBLGVBQUE7Z0JBQ0EsTUFBQSxnQkFBQSxTQUFBLE1BQUE7Z0JBQ0EsZ0JBQUEsTUFBQTs7OztVQUlBLElBQUEsZUFBQSxlQUFBO1VBQ0EsSUFBQSxRQUFBO1lBQ0EsZUFBQTtZQUNBLFdBQUE7WUFDQSxxQkFBQSxvQkFBQTtZQUNBLGlCQUFBLGdCQUFBO1lBQ0EsZUFBQSxLQUFBLElBQUEsTUFBQSxLQUFBLGdCQUFBLElBQUEsU0FBQSxNQUFBLENBQUEsT0FBQSxNQUFBO1lBQ0EsU0FBQTtZQUNBLGNBQUE7WUFDQSxnQkFBQSxDQUFBLGFBQUEsZUFBQSxVQUFBLFFBQUE7WUFDQSxjQUFBO1lBQ0EsY0FBQTtZQUNBLGdCQUFBLENBQUEsZUFBQSxjQUFBLFFBQUE7WUFDQSxTQUFBO1lBQ0EsY0FBQTs7VUFFQSxHQUFBLGFBQUEsT0FBQSxhQUFBLGFBQUE7Y0FDQSxPQUFBLFNBQUE7O1VBRUEsT0FBQTs7Ozs7O0FDNUlBLFFBQUEsT0FBQTtLQUNBLFdBQUEsK0JBQUEsU0FBQSxRQUFBO01BQ0EsUUFBQSxJQUFBLE9BQUE7TUFDQSxRQUFBLElBQUE7UUFDQSxPQUFBLFVBQUE7ZUFDQSxRQUFBLENBQUEsV0FBQSxZQUFBLFNBQUEsU0FBQSxPQUFBLFFBQUE7ZUFDQSxVQUFBLENBQUE7bUJBQ0EsT0FBQTttQkFDQSxXQUFBO21CQUNBLGFBQUE7bUJBQ0EsZUFBQTttQkFDQSxpQkFBQTttQkFDQSxNQUFBLENBQUEsSUFBQSxJQUFBLElBQUEsSUFBQSxJQUFBLElBQUE7Ozs7O1dBS0EsT0FBQSxhQUFBOzs7ZUFHQSxZQUFBOzs7ZUFHQSxrQkFBQTs7O2VBR0Esb0JBQUE7OztlQUdBLG9CQUFBOzs7ZUFHQSxvQkFBQTs7O2VBR0EsZUFBQTs7O2VBR0EsZ0JBQUE7OztlQUdBLGlCQUFBOzs7ZUFHQSxtQkFBQTs7O2VBR0EsZ0JBQUE7Ozs7OztBQU1BIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbImFuZ3VsYXIubW9kdWxlKCdhcHAnLFtcbiAgJ25nUm91dGUnLCd1aS5yb3V0ZXInLCd0Yy5jaGFydGpzJ1xuXSlcbiIsImFuZ3VsYXIubW9kdWxlKCdhcHAnKVxuICAgIC5jb250cm9sbGVyKCdob21lQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJGh0dHAsIGRhdGFNdXRhdG9yKSB7XG4gICAgICAgICRzY29wZS5zZXR1cCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGRhdGFNdXRhdG9yLmdldERhdGEoKVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgZGF0YU11dGF0b3IuY3N2VG9KU09OKHJlc3BvbnNlLmRhdGEsIGZ1bmN0aW9uKGNzdil7XG4gICAgICAgICAgICAgICAgICAgIGRhdGFNdXRhdG9yLmdldENhcmVlclN0YXRzKGNzdiwgZnVuY3Rpb24oc3RhdHMpe1xuICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHN0YXRzKVxuICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zdGF0cyA9IHN0YXRzXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICB9LCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgJHNjb3BlLnNldHVwKCk7ICAgICAgICBcbiAgICB9KVxuIiwiYW5ndWxhci5tb2R1bGUoJ2FwcCcpXG4gICAgLmNvbnRyb2xsZXIoJ21hc3RlckN0cmwnLCBmdW5jdGlvbigkc2NvcGUsICRyb290U2NvcGUpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJtYXN0ZXJDdHJsXCIpO1xuICAgIH0pXG4iLCJhbmd1bGFyLm1vZHVsZSgnYXBwJylcbiAgICAuY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyKSB7XG5cbiAgICAgICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnLycpO1xuXG4gICAgICAgICRzdGF0ZVByb3ZpZGVyXG4gICAgICAgICAgICAuc3RhdGUoJ2FwcCcsIHtcbiAgICAgICAgICAgICAgICB1cmw6ICcvJyxcbiAgICAgICAgICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgICAgICAgICAnaGVhZGVyJzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvbmF2Lmh0bWwnLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAnY29udGVudCc6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL2hvbWUuaHRtbCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnaG9tZUN0cmwnXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuXG5cblxuICAgICAgICAuc3RhdGUoJ2FwcC5ob21lJywge1xuICAgICAgICAgICAgdXJsOiAnaG9tZScsXG4gICAgICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgICAgICdjb250ZW50QCc6IHtcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd1c2Vycy9ob21lLmh0bWwnLFxuICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnaG9tZUN0cmwnXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0pXG5cblxuXG5cbiAgICAgICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpXG5cbiAgICB9KTtcbiIsImFuZ3VsYXIubW9kdWxlKCdhcHAnKVxuICAgIC5kaXJlY3RpdmUoJ2NhcmVlclN0YXRzJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybntcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge1xuICAgICAgICAgICAgICAgIHN0YXRzOiAnPWl0ZW0nLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAncGFydGlhbHMvY2FyZWVyU3RhdHMuaHRtbCdcbiAgICAgICAgICAgICAgICAvL2NvbnRyb2xsZXI6ICdhcHAucGFydGlhbHMudmVudWVzLnZlbnVlSXRlbUN0cmwnXG4gICAgICAgIH1cbiAgICB9KVxuIiwiYW5ndWxhci5tb2R1bGUoJ2FwcCcpXG4gICAgLmRpcmVjdGl2ZSgnY2VudHVyeVN0YXRzJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybntcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge1xuICAgICAgICAgICAgICAgIGNlbnR1cnlTdGF0czogJz1pdGVtJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3BhcnRpYWxzL2NlbnR1cnlTdGF0cy5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdjZW50dXJ5U3RhdHNDdHJsJ1xuICAgICAgICB9XG4gICAgfSlcbiIsImFuZ3VsYXIubW9kdWxlKCdhcHAnKVxuICAgIC5kaXJlY3RpdmUoJ3BlcnNvbmFsSW5mbycsIGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm57XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLCAgICAgICAgICAgIFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdwYXJ0aWFscy9wZXJzb25hbEluZm8uaHRtbCdcbiAgICAgICAgfVxuICAgIH0pXG4iLCIvL1RoaW5ncyB3ZSBjYW4gZ2V0IGZyb20gdGhlIGRhdGEgOiAtXG4vL1RvdGFsIG1hdGNoZXMgcGxheWVkXG4vL1RvdGFsIGNlbnR1cmllcyBzY29yZWRcbi8vcnVucyBzY29yZWQgaW4gYSB5ZWFyXG4vL2NlbnR1cmllcyBzY29yZWQgaW4gYSB5ZWFyXG4vL2hhbGYgY2VudHVyaWVzIHNjb3JlZCBpbiBhIHllYXJcbi8vaGFsZiBjZW50dXJpZXMgY292ZXJ0ZWQgaW50byBjZW50dXJ5XG4vL25lcnZvdXMgbmluZXRpZXNcbi8vc2NvcmUgYWdhaW5zdCB0aGUgdGVhbXNcbi8vc2NvcmUgaW4gdGhlIHdpbm5pbmcgY2F1c2Vcbi8vYm93bGluZyBmaWd1cmVzXG4vL3BlcmZvcm1hbmNlIGluIGNsb3NlIG1hdGNoZXNcbi8vYmF0dGluZyBmaXJzdCBwZXJmb3JtYW5jZVxuLy9tb3ZpbmcgYXZlcmFnZSwgbG9uZ2l0dWRhbmFsIGNhcmVlciBncm93dGhcbi8vMTAwMCBSdW5zIGluIG9uZSBjYWxlbmRhciB5ZWFyXG4vL2JhdHRpbmcgc2Vjb25kIHBlcmZvcm1hbmNlICh3aGlsZSBjaGFzaW5nKVxuXG4vL1RPRE86XG4vL0dldCBjZW50dXJpZXMgYnkgY291bnRyeVxuLy9HZXQgY2VudHVyaWVzIGJ5IHllYXJcbi8vR2V0IHJ1bnMgYnkgY291bnRyeVxuLy9HZXQgcnVucyBieSB5ZWFyXG4vL0dldCBydW5zIGJ5IHdpbm5pbmdcbi8vR2V0IHJ1bnMgYnkgbG9vc2luZ1xuLy9HZXQgY2VudHVyaWVzIGluIHdpbm5pbmcgY2F1c2VcblxuXG5cbi8vTk9URTogT25jZSBhbGwgZGF0YSBpcyBjb2xsZWN0ZWQgY2xlYW4gb3V0IHRoZSBjYWxsYmFjayBoZWxsIDpQXG5hbmd1bGFyLm1vZHVsZSgnYXBwJylcbiAgICAuc2VydmljZSgnZGF0YU11dGF0b3InLCBmdW5jdGlvbigkaHR0cCkge1xuICAgICAgICByZXR1cm57XG4gICAgICAgICAgICBnZXREYXRhOiBnZXREYXRhLFxuICAgICAgICAgICAgY3N2VG9KU09OOiBjc3ZUb0pTT04sXG4gICAgICAgICAgICBnZXRDYXJlZXJTdGF0czogZ2V0Q2FyZWVyU3RhdHNcblxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZ2V0RGF0YSgpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9kYXRhL3NhY2hpbi5jc3YnKVxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gY3N2VG9KU09OKGNzdiwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHZhciBsaW5lcz1jc3Yuc3BsaXQoXCJcXG5cIik7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgICAgICAgICB2YXIgaGVhZGVycz1saW5lc1swXS5zcGxpdChcIixcIik7XG4gICAgICAgICAgICBmb3IodmFyIGk9MTtpPGxpbmVzLmxlbmd0aCAtMTtpKyspe1xuICAgICAgICAgICAgICAgIHZhciBvYmogPSB7fTtcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudGxpbmU9bGluZXNbaV0uc3BsaXQoXCIsXCIpO1xuICAgICAgICAgICAgICAgIGZvcih2YXIgaj0wO2o8aGVhZGVycy5sZW5ndGg7aisrKXtcbiAgICAgICAgICAgICAgICAgIG9ialtoZWFkZXJzW2pdXSA9IGN1cnJlbnRsaW5lW2pdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChvYmopO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc29sZS5sb2cocmVzdWx0KVxuICAgICAgICAgICAgaWYoY2FsbGJhY2sgJiYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2socmVzdWx0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZ2V0Q2FyZWVyU3RhdHMoZGF0YSwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHZhciB0b3RhbE1hdGNoZXMgPSBkYXRhLmxlbmd0aDtcbiAgICAgICAgICAgIHZhciB0b3RhbFJ1bnMgPSAwO1xuICAgICAgICAgICAgdmFyIGNlbnR1cmllc1Njb3JlZCA9IFtdO1xuICAgICAgICAgICAgdmFyIGhhbGZDZW50dXJpZXNTY29yZWQgPSBbXTtcbiAgICAgICAgICAgIHZhciBub3RPdXRzID0gMDtcbiAgICAgICAgICAgIHZhciBkaWROb3RCYXQgPSAwO1xuICAgICAgICAgICAgdmFyIHdpY2tldHNUYWtlbiA9IDA7XG4gICAgICAgICAgICB2YXIgcnVuc0NvbmNlZGVkID0gMDtcbiAgICAgICAgICAgIHZhciBjYXRjaGVzID0gMDtcbiAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChkYXRhLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgICB2YXIgY2VudHVyeURldGFpbCA9IHt9O1xuICAgICAgICAgICAgICB2YXIgaGFsZkNlbnR1cnlEZXRhaWwgPSB7fTtcblxuICAgICAgICAgICAgICAvL0JhdHRpbmcgc3RhdHNcblxuICAgICAgICAgICAgICAvL2NoZWNrIHRvIHNlZSBpZiB0aGUgc2NvcmUgY29udGFpbnMgYSAqIGluIHRoZSBlbmQgd2hpY2ggZGVudG9lcyBOb3RPdXRzLCBpZiB5ZXMgcmVtb3ZlIGZvciBjYWxjdWxhdGlvbnNcbiAgICAgICAgICAgICAgaWYodmFsdWUuYmF0dGluZ19zY29yZS5pbmRleE9mKFwiKlwiKSA+IC0xKXtcbiAgICAgICAgICAgICAgICB2YWx1ZS5iYXR0aW5nX3Njb3JlID0gdmFsdWUuYmF0dGluZ19zY29yZS5yZXBsYWNlKCcqJywnJyk7XG4gICAgICAgICAgICAgICAgbm90T3V0cysrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIC8vaWYgdGhlIHZhbHVlIG9mIHNjb3JlIGlzIE5vdCBhIG51bWJlciAsIGl0IG1lYW5zIGl0IGNvdWxkIGJlIEROQihkaWQgbm90IGJhdCkgb3IgVEROQiAodGVhbSBkaWQgbm90IGJhdClcbiAgICAgICAgICAgICAgaWYoaXNOYU4odmFsdWUuYmF0dGluZ19zY29yZSkpe1xuICAgICAgICAgICAgICAgIGRpZE5vdEJhdCsrO1xuICAgICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICAvL0NvbnZlcnRpbmcgdGhlIHN0cmluZyB0byBpbnRlZ2VycyB0byBkbyBjYWxjdWxhdGlvbnNcbiAgICAgICAgICAgICAgICB2YWx1ZS5iYXR0aW5nX3Njb3JlID0gcGFyc2VJbnQodmFsdWUuYmF0dGluZ19zY29yZSlcbiAgICAgICAgICAgICAgICAvL0NoZWNraW5nIHRvIHNlZSBpZiB0aGUgc2NvcmUgd2FzIGEgaGFsZiBjZW50dXJ5IG9yIGNlbnR1cnlcbiAgICAgICAgICAgICAgICBpZih2YWx1ZS5iYXR0aW5nX3Njb3JlID49IDUwICYmIHZhbHVlLmJhdHRpbmdfc2NvcmUgPCAxMDApe1xuICAgICAgICAgICAgICAgICAgaGFsZkNlbnR1cnlEZXRhaWwucnVucyA9IHZhbHVlLmJhdHRpbmdfc2NvcmVcbiAgICAgICAgICAgICAgICAgIGhhbGZDZW50dXJ5RGV0YWlsLmFnYWluc3QgPSB2YWx1ZS5vcHBvc2l0aW9uXG4gICAgICAgICAgICAgICAgICBoYWxmQ2VudHVyeURldGFpbC5yZXN1bHQgPSB2YWx1ZS5tYXRjaF9yZXN1bHRcbiAgICAgICAgICAgICAgICAgIGhhbGZDZW50dXJ5RGV0YWlsLnllYXIgPSB2YWx1ZS5kYXRlXG4gICAgICAgICAgICAgICAgICBoYWxmQ2VudHVyaWVzU2NvcmVkLnB1c2goaGFsZkNlbnR1cnlEZXRhaWwpXG4gICAgICAgICAgICAgICAgfWVsc2UgaWYodmFsdWUuYmF0dGluZ19zY29yZSA+PSAxMDApe1xuICAgICAgICAgICAgICAgICAgY2VudHVyeURldGFpbC5ydW5zID0gdmFsdWUuYmF0dGluZ19zY29yZVxuICAgICAgICAgICAgICAgICAgY2VudHVyeURldGFpbC5hZ2FpbnN0ID0gdmFsdWUub3Bwb3NpdGlvblxuICAgICAgICAgICAgICAgICAgY2VudHVyeURldGFpbC5yZXN1bHQgPSB2YWx1ZS5tYXRjaF9yZXN1bHRcbiAgICAgICAgICAgICAgICAgIGNlbnR1cnlEZXRhaWwueWVhciA9IHZhbHVlLmRhdGVcbiAgICAgICAgICAgICAgICAgIGNlbnR1cmllc1Njb3JlZC5wdXNoKGNlbnR1cnlEZXRhaWwpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vU2F2aW5nIHRvdGFsIHJ1bnNcbiAgICAgICAgICAgICAgICB0b3RhbFJ1bnMgKz0gdmFsdWUuYmF0dGluZ19zY29yZTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIC8vQm93bGluZyBzdGF0c1xuICAgICAgICAgICAgICBpZighaXNOYU4odmFsdWUud2lja2V0cykgJiYgcGFyc2VJbnQodmFsdWUud2lja2V0cykgPiAwKXtcbiAgICAgICAgICAgICAgICB2YWx1ZS53aWNrZXRzID0gcGFyc2VJbnQodmFsdWUud2lja2V0cylcbiAgICAgICAgICAgICAgICB3aWNrZXRzVGFrZW4gKz0gdmFsdWUud2lja2V0c1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmKCFpc05hTih2YWx1ZS5jYXRjaGVzKSAmJiBwYXJzZUludCh2YWx1ZS5jYXRjaGVzKSA+IDApe1xuICAgICAgICAgICAgICAgIHZhbHVlLmNhdGNoZXMgPSBwYXJzZUludCh2YWx1ZS5jYXRjaGVzKVxuICAgICAgICAgICAgICAgIGNhdGNoZXMgKz0gdmFsdWUuY2F0Y2hlc1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmKCFpc05hTih2YWx1ZS5ydW5zX2NvbmNlZGVkKSl7XG4gICAgICAgICAgICAgICAgdmFsdWUucnVuc19jb25jZWRlZCA9IHBhcnNlSW50KHZhbHVlLnJ1bnNfY29uY2VkZWQpXG4gICAgICAgICAgICAgICAgcnVuc0NvbmNlZGVkICs9IHZhbHVlLnJ1bnNfY29uY2VkZWQ7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgdmFyIHRvdGFsSW5uaW5ncyA9IHRvdGFsTWF0Y2hlcyAtIGRpZE5vdEJhdFxuICAgICAgICAgIHZhciBzdGF0cyA9IHtcbiAgICAgICAgICAgIHRvdGFsTWF0Y2hlcyA6IHRvdGFsTWF0Y2hlcyxcbiAgICAgICAgICAgIHRvdGFsUnVuczogdG90YWxSdW5zLFxuICAgICAgICAgICAgaGFsZkNlbnR1cmllc1Njb3JlZDogaGFsZkNlbnR1cmllc1Njb3JlZC5sZW5ndGgsXG4gICAgICAgICAgICBjZW50dXJpZXNTY29yZWQ6IGNlbnR1cmllc1Njb3JlZC5sZW5ndGgsXG4gICAgICAgICAgICBoaWdoZXN0U2NvcmU6ICBNYXRoLm1heC5hcHBseShudWxsLGNlbnR1cmllc1Njb3JlZC5tYXAoZnVuY3Rpb24oaW5kZXgpe3JldHVybiBpbmRleC5ydW5zfSkpLFxuICAgICAgICAgICAgbm90T3V0czogbm90T3V0cyxcbiAgICAgICAgICAgIHRvdGFsSW5uaW5nczogdG90YWxJbm5pbmdzLFxuICAgICAgICAgICAgYmF0dGluZ0F2ZXJhZ2U6ICh0b3RhbFJ1bnMgLyAodG90YWxJbm5pbmdzIC0gbm90T3V0cykpLnRvRml4ZWQoMiksXG4gICAgICAgICAgICB3aWNrZXRzVGFrZW46IHdpY2tldHNUYWtlbixcbiAgICAgICAgICAgIHJ1bnNDb25jZWRlZDogcnVuc0NvbmNlZGVkLFxuICAgICAgICAgICAgYm93bGluZ0F2ZXJhZ2U6IChydW5zQ29uY2VkZWQgLyB3aWNrZXRzVGFrZW4pLnRvRml4ZWQoMiksXG4gICAgICAgICAgICBjYXRjaGVzOiBjYXRjaGVzLFxuICAgICAgICAgICAgYWxsQ2VudHVyaWVzOiBjZW50dXJpZXNTY29yZWRcbiAgICAgICAgICB9O1xuICAgICAgICAgIGlmKGNhbGxiYWNrICYmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhzdGF0cyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBzdGF0c1xuICAgICAgICB9XG5cblxuICAgIH0pXG4iLCJhbmd1bGFyLm1vZHVsZSgnYXBwJylcbiAgICAuY29udHJvbGxlcignY2VudHVyeVN0YXRzQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSkge1xuICAgICAgY29uc29sZS5sb2coJHNjb3BlLmNlbnR1cnlTdGF0cylcbiAgICAgIGNvbnNvbGUubG9nKCRzY29wZSlcbiAgICAgICAgJHNjb3BlLmJhcmRhdGEgPSB7XG4gICAgICAgICAgICAgICBsYWJlbHM6IFsnSmFudWFyeScsICdGZWJydWFyeScsICdNYXJjaCcsICdBcHJpbCcsICdNYXknLCAnSnVuZScsICdKdWx5J10sXG4gICAgICAgICAgICAgICBkYXRhc2V0czogW3tcbiAgICAgICAgICAgICAgICAgICBsYWJlbDogJ015IEZpcnN0IGRhdGFzZXQnLFxuICAgICAgICAgICAgICAgICAgIGZpbGxDb2xvcjogJ3JnYmEoMjIwLDIyMCwyMjAsMC41KScsXG4gICAgICAgICAgICAgICAgICAgc3Ryb2tlQ29sb3I6ICdyZ2JhKDIyMCwyMjAsMjIwLDAuOCknLFxuICAgICAgICAgICAgICAgICAgIGhpZ2hsaWdodEZpbGw6ICdyZ2JhKDIyMCwyMjAsMjIwLDAuNzUpJyxcbiAgICAgICAgICAgICAgICAgICBoaWdobGlnaHRTdHJva2U6ICdyZ2JhKDIyMCwyMjAsMjIwLDEpJyxcbiAgICAgICAgICAgICAgICAgICBkYXRhOiBbNjUsIDU5LCA4MCwgODEsIDU2LCA1NSwgNDBdXG4gICAgICAgICAgICAgICB9XVxuICAgICAgICAgICB9O1xuXG4gICAgICAgICAgIC8vIENoYXJ0LmpzIE9wdGlvbnNcbiAgICAgICAgICAgJHNjb3BlLmJhcm9wdGlvbnMgPSB7XG5cbiAgICAgICAgICAgICAgIC8vIFNldHMgdGhlIGNoYXJ0IHRvIGJlIHJlc3BvbnNpdmVcbiAgICAgICAgICAgICAgIHJlc3BvbnNpdmU6IHRydWUsXG5cbiAgICAgICAgICAgICAgIC8vQm9vbGVhbiAtIFdoZXRoZXIgdGhlIHNjYWxlIHNob3VsZCBzdGFydCBhdCB6ZXJvLCBvciBhbiBvcmRlciBvZiBtYWduaXR1ZGUgZG93biBmcm9tIHRoZSBsb3dlc3QgdmFsdWVcbiAgICAgICAgICAgICAgIHNjYWxlQmVnaW5BdFplcm86IHRydWUsXG5cbiAgICAgICAgICAgICAgIC8vQm9vbGVhbiAtIFdoZXRoZXIgZ3JpZCBsaW5lcyBhcmUgc2hvd24gYWNyb3NzIHRoZSBjaGFydFxuICAgICAgICAgICAgICAgc2NhbGVTaG93R3JpZExpbmVzOiB0cnVlLFxuXG4gICAgICAgICAgICAgICAvL1N0cmluZyAtIENvbG91ciBvZiB0aGUgZ3JpZCBsaW5lc1xuICAgICAgICAgICAgICAgc2NhbGVHcmlkTGluZUNvbG9yOiBcInJnYmEoMCwwLDAsLjA1KVwiLFxuXG4gICAgICAgICAgICAgICAvL051bWJlciAtIFdpZHRoIG9mIHRoZSBncmlkIGxpbmVzXG4gICAgICAgICAgICAgICBzY2FsZUdyaWRMaW5lV2lkdGg6IDEsXG5cbiAgICAgICAgICAgICAgIC8vQm9vbGVhbiAtIElmIHRoZXJlIGlzIGEgc3Ryb2tlIG9uIGVhY2ggYmFyXG4gICAgICAgICAgICAgICBiYXJTaG93U3Ryb2tlOiB0cnVlLFxuXG4gICAgICAgICAgICAgICAvL051bWJlciAtIFBpeGVsIHdpZHRoIG9mIHRoZSBiYXIgc3Ryb2tlXG4gICAgICAgICAgICAgICBiYXJTdHJva2VXaWR0aDogMixcblxuICAgICAgICAgICAgICAgLy9OdW1iZXIgLSBTcGFjaW5nIGJldHdlZW4gZWFjaCBvZiB0aGUgWCB2YWx1ZSBzZXRzXG4gICAgICAgICAgICAgICBiYXJWYWx1ZVNwYWNpbmc6IDUsXG5cbiAgICAgICAgICAgICAgIC8vTnVtYmVyIC0gU3BhY2luZyBiZXR3ZWVuIGRhdGEgc2V0cyB3aXRoaW4gWCB2YWx1ZXNcbiAgICAgICAgICAgICAgIGJhckRhdGFzZXRTcGFjaW5nOiAxLFxuXG4gICAgICAgICAgICAgICAvL1N0cmluZyAtIEEgbGVnZW5kIHRlbXBsYXRlXG4gICAgICAgICAgICAgICBsZWdlbmRUZW1wbGF0ZTogJzx1bCBjbGFzcz1cInRjLWNoYXJ0LWpzLWxlZ2VuZFwiPjwlIGZvciAodmFyIGk9MDsgaTxkYXRhc2V0cy5sZW5ndGg7IGkrKyl7JT48bGk+PHNwYW4gc3R5bGU9XCJiYWNrZ3JvdW5kLWNvbG9yOjwlPWRhdGFzZXRzW2ldLmZpbGxDb2xvciU+XCI+PC9zcGFuPjwlaWYoZGF0YXNldHNbaV0ubGFiZWwpeyU+PCU9ZGF0YXNldHNbaV0ubGFiZWwlPjwlfSU+PC9saT48JX0lPjwvdWw+J1xuICAgICAgICAgICB9O1xuXG5cblxuICAgIH0pXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
