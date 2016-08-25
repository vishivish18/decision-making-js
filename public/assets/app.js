angular.module('app',[
  'ngRoute','ui.router'
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
        function drawChart() {
      // Define the chart to be drawn.
      var data = new google.visualization.DataTable();
      data.addColumn('string', 'Element');
      data.addColumn('number', 'Percentage');
      data.addRows([
        ['Nitrogen', 0.78],
        ['Oxygen', 0.21],
        ['Other', 0.01]
      ]);

      // Instantiate and draw the chart.
      var chart = new google.visualization.PieChart(document.getElementById('myPieChart'));
      chart.draw(data, null);
    }
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
            catches: catches
          };
          if(callback && (typeof callback === 'function')) {
              return callback(stats);
          }
          return stats
        }


    }])

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZHVsZS5qcyIsImNvbnRyb2xsZXJzL2hvbWVDdHJsLmpzIiwiY29udHJvbGxlcnMvbWFzdGVyQ3RybC5qcyIsImNvbnRyb2xsZXJzL3JvdXRlcy5qcyIsImRpcmVjdGl2ZXMvY2FyZWVyU3RhdHMuanMiLCJkaXJlY3RpdmVzL3BlcnNvbmFsSW5mby5qcyIsInNlcnZpY2VzL2RhdGFNdXRhdG9yLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFFBQUEsT0FBQSxNQUFBO0VBQ0EsVUFBQTs7O0FDREEsUUFBQSxPQUFBO0tBQ0EsV0FBQSwrQ0FBQSxTQUFBLFFBQUEsT0FBQSxhQUFBO1FBQ0EsT0FBQSxRQUFBLFdBQUE7VUFDQSxZQUFBO1dBQ0EsS0FBQSxTQUFBLFVBQUE7Z0JBQ0EsWUFBQSxVQUFBLFNBQUEsTUFBQSxTQUFBLElBQUE7b0JBQ0EsWUFBQSxlQUFBLEtBQUEsU0FBQSxNQUFBO3NCQUNBLFFBQUEsSUFBQTtzQkFDQSxPQUFBLFFBQUE7OzthQUdBLFNBQUEsS0FBQTtnQkFDQSxRQUFBLElBQUE7OztRQUdBLE9BQUE7UUFDQSxTQUFBLFlBQUE7O01BRUEsSUFBQSxPQUFBLElBQUEsT0FBQSxjQUFBO01BQ0EsS0FBQSxVQUFBLFVBQUE7TUFDQSxLQUFBLFVBQUEsVUFBQTtNQUNBLEtBQUEsUUFBQTtRQUNBLENBQUEsWUFBQTtRQUNBLENBQUEsVUFBQTtRQUNBLENBQUEsU0FBQTs7OztNQUlBLElBQUEsUUFBQSxJQUFBLE9BQUEsY0FBQSxTQUFBLFNBQUEsZUFBQTtNQUNBLE1BQUEsS0FBQSxNQUFBOzs7O0FDN0JBLFFBQUEsT0FBQTtLQUNBLFdBQUEsdUNBQUEsU0FBQSxRQUFBLFlBQUE7UUFDQSxRQUFBLElBQUE7OztBQ0ZBLFFBQUEsT0FBQTtLQUNBLHFFQUFBLFNBQUEsZ0JBQUEsb0JBQUEsbUJBQUE7O1FBRUEsbUJBQUEsVUFBQTs7UUFFQTthQUNBLE1BQUEsT0FBQTtnQkFDQSxLQUFBO2dCQUNBLE9BQUE7b0JBQ0EsVUFBQTt3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QUFBO1lBQ0EsV0FBQTtZQUNBLHFCQUFBLG9CQUFBO1lBQ0EsaUJBQUEsZ0JBQUE7WUFDQSxlQUFBLEtBQUEsSUFBQSxNQUFBLEtBQUEsZ0JBQUEsSUFBQSxTQUFBLE1BQUEsQ0FBQSxPQUFBLE1BQUE7WUFDQSxTQUFBO1lBQ0EsY0FBQTtZQUNBLGdCQUFBLENBQUEsYUFBQSxlQUFBLFVBQUEsUUFBQTtZQUNBLGNBQUE7WUFDQSxjQUFBO1lBQ0EsZ0JBQUEsQ0FBQSxlQUFBLGNBQUEsUUFBQTtZQUNBLFNBQUE7O1VBRUEsR0FBQSxhQUFBLE9BQUEsYUFBQSxhQUFBO2NBQ0EsT0FBQSxTQUFBOztVQUVBLE9BQUE7Ozs7O0FBS0EiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiYW5ndWxhci5tb2R1bGUoJ2FwcCcsW1xuICAnbmdSb3V0ZScsJ3VpLnJvdXRlcidcbl0pXG4iLCJhbmd1bGFyLm1vZHVsZSgnYXBwJylcbiAgICAuY29udHJvbGxlcignaG9tZUN0cmwnLCBmdW5jdGlvbigkc2NvcGUsICRodHRwLCBkYXRhTXV0YXRvcikge1xuICAgICAgICAkc2NvcGUuc2V0dXAgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICBkYXRhTXV0YXRvci5nZXREYXRhKClcbiAgICAgICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIGRhdGFNdXRhdG9yLmNzdlRvSlNPTihyZXNwb25zZS5kYXRhLCBmdW5jdGlvbihjc3Ype1xuICAgICAgICAgICAgICAgICAgICBkYXRhTXV0YXRvci5nZXRDYXJlZXJTdGF0cyhjc3YsIGZ1bmN0aW9uKHN0YXRzKXtcbiAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhzdGF0cylcbiAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc3RhdHMgPSBzdGF0c1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgfSwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgICRzY29wZS5zZXR1cCgpO1xuICAgICAgICBmdW5jdGlvbiBkcmF3Q2hhcnQoKSB7XG4gICAgICAvLyBEZWZpbmUgdGhlIGNoYXJ0IHRvIGJlIGRyYXduLlxuICAgICAgdmFyIGRhdGEgPSBuZXcgZ29vZ2xlLnZpc3VhbGl6YXRpb24uRGF0YVRhYmxlKCk7XG4gICAgICBkYXRhLmFkZENvbHVtbignc3RyaW5nJywgJ0VsZW1lbnQnKTtcbiAgICAgIGRhdGEuYWRkQ29sdW1uKCdudW1iZXInLCAnUGVyY2VudGFnZScpO1xuICAgICAgZGF0YS5hZGRSb3dzKFtcbiAgICAgICAgWydOaXRyb2dlbicsIDAuNzhdLFxuICAgICAgICBbJ094eWdlbicsIDAuMjFdLFxuICAgICAgICBbJ090aGVyJywgMC4wMV1cbiAgICAgIF0pO1xuXG4gICAgICAvLyBJbnN0YW50aWF0ZSBhbmQgZHJhdyB0aGUgY2hhcnQuXG4gICAgICB2YXIgY2hhcnQgPSBuZXcgZ29vZ2xlLnZpc3VhbGl6YXRpb24uUGllQ2hhcnQoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ215UGllQ2hhcnQnKSk7XG4gICAgICBjaGFydC5kcmF3KGRhdGEsIG51bGwpO1xuICAgIH1cbiAgICB9KVxuIiwiYW5ndWxhci5tb2R1bGUoJ2FwcCcpXG4gICAgLmNvbnRyb2xsZXIoJ21hc3RlckN0cmwnLCBmdW5jdGlvbigkc2NvcGUsICRyb290U2NvcGUpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJtYXN0ZXJDdHJsXCIpO1xuICAgIH0pXG4iLCJhbmd1bGFyLm1vZHVsZSgnYXBwJylcbiAgICAuY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyKSB7XG5cbiAgICAgICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnLycpO1xuXG4gICAgICAgICRzdGF0ZVByb3ZpZGVyXG4gICAgICAgICAgICAuc3RhdGUoJ2FwcCcsIHtcbiAgICAgICAgICAgICAgICB1cmw6ICcvJyxcbiAgICAgICAgICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgICAgICAgICAnaGVhZGVyJzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvbmF2Lmh0bWwnLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAnY29udGVudCc6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL2hvbWUuaHRtbCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnaG9tZUN0cmwnXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuXG5cblxuICAgICAgICAuc3RhdGUoJ2FwcC5ob21lJywge1xuICAgICAgICAgICAgdXJsOiAnaG9tZScsXG4gICAgICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgICAgICdjb250ZW50QCc6IHtcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd1c2Vycy9ob21lLmh0bWwnLFxuICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnaG9tZUN0cmwnXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0pXG5cblxuXG5cbiAgICAgICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpXG5cbiAgICB9KTtcbiIsImFuZ3VsYXIubW9kdWxlKCdhcHAnKVxuICAgIC5kaXJlY3RpdmUoJ2NhcmVlclN0YXRzJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybntcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge1xuICAgICAgICAgICAgICAgIHN0YXRzOiAnPWl0ZW0nLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAncGFydGlhbHMvY2FyZWVyU3RhdHMuaHRtbCdcbiAgICAgICAgICAgICAgICAvL2NvbnRyb2xsZXI6ICdhcHAucGFydGlhbHMudmVudWVzLnZlbnVlSXRlbUN0cmwnXG4gICAgICAgIH1cbiAgICB9KVxuIiwiYW5ndWxhci5tb2R1bGUoJ2FwcCcpXG4gICAgLmRpcmVjdGl2ZSgncGVyc29uYWxJbmZvJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybntcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsICAgICAgICAgICAgXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3BhcnRpYWxzL3BlcnNvbmFsSW5mby5odG1sJ1xuICAgICAgICB9XG4gICAgfSlcbiIsIi8vVGhpbmdzIHdlIGNhbiBnZXQgZnJvbSB0aGUgZGF0YSA6IC1cbi8vVG90YWwgbWF0Y2hlcyBwbGF5ZWRcbi8vVG90YWwgY2VudHVyaWVzIHNjb3JlZFxuLy9ydW5zIHNjb3JlZCBpbiBhIHllYXJcbi8vY2VudHVyaWVzIHNjb3JlZCBpbiBhIHllYXJcbi8vaGFsZiBjZW50dXJpZXMgc2NvcmVkIGluIGEgeWVhclxuLy9oYWxmIGNlbnR1cmllcyBjb3ZlcnRlZCBpbnRvIGNlbnR1cnlcbi8vbmVydm91cyBuaW5ldGllc1xuLy9zY29yZSBhZ2FpbnN0IHRoZSB0ZWFtc1xuLy9zY29yZSBpbiB0aGUgd2lubmluZyBjYXVzZVxuLy9ib3dsaW5nIGZpZ3VyZXNcbi8vcGVyZm9ybWFuY2UgaW4gY2xvc2UgbWF0Y2hlc1xuLy9iYXR0aW5nIGZpcnN0IHBlcmZvcm1hbmNlXG4vL21vdmluZyBhdmVyYWdlLCBsb25naXR1ZGFuYWwgY2FyZWVyIGdyb3d0aFxuLy8xMDAwIFJ1bnMgaW4gb25lIGNhbGVuZGFyIHllYXJcbi8vYmF0dGluZyBzZWNvbmQgcGVyZm9ybWFuY2UgKHdoaWxlIGNoYXNpbmcpXG5cbi8vVE9ETzpcbi8vR2V0IGNlbnR1cmllcyBieSBjb3VudHJ5XG4vL0dldCBjZW50dXJpZXMgYnkgeWVhclxuLy9HZXQgcnVucyBieSBjb3VudHJ5XG4vL0dldCBydW5zIGJ5IHllYXJcbi8vR2V0IHJ1bnMgYnkgd2lubmluZ1xuLy9HZXQgcnVucyBieSBsb29zaW5nXG4vL0dldCBjZW50dXJpZXMgaW4gd2lubmluZyBjYXVzZVxuXG5cblxuLy9OT1RFOiBPbmNlIGFsbCBkYXRhIGlzIGNvbGxlY3RlZCBjbGVhbiBvdXQgdGhlIGNhbGxiYWNrIGhlbGwgOlBcbmFuZ3VsYXIubW9kdWxlKCdhcHAnKVxuICAgIC5zZXJ2aWNlKCdkYXRhTXV0YXRvcicsIGZ1bmN0aW9uKCRodHRwKSB7XG4gICAgICAgIHJldHVybntcbiAgICAgICAgICAgIGdldERhdGE6IGdldERhdGEsXG4gICAgICAgICAgICBjc3ZUb0pTT046IGNzdlRvSlNPTixcbiAgICAgICAgICAgIGdldENhcmVlclN0YXRzOiBnZXRDYXJlZXJTdGF0c1xuXG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBnZXREYXRhKCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2RhdGEvc2FjaGluLmNzdicpXG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBjc3ZUb0pTT04oY3N2LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgdmFyIGxpbmVzPWNzdi5zcGxpdChcIlxcblwiKTtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICAgICAgICAgIHZhciBoZWFkZXJzPWxpbmVzWzBdLnNwbGl0KFwiLFwiKTtcbiAgICAgICAgICAgIGZvcih2YXIgaT0xO2k8bGluZXMubGVuZ3RoIC0xO2krKyl7XG4gICAgICAgICAgICAgICAgdmFyIG9iaiA9IHt9O1xuICAgICAgICAgICAgICAgIHZhciBjdXJyZW50bGluZT1saW5lc1tpXS5zcGxpdChcIixcIik7XG4gICAgICAgICAgICAgICAgZm9yKHZhciBqPTA7ajxoZWFkZXJzLmxlbmd0aDtqKyspe1xuICAgICAgICAgICAgICAgICAgb2JqW2hlYWRlcnNbal1dID0gY3VycmVudGxpbmVbal07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKG9iaik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhyZXN1bHQpXG4gICAgICAgICAgICBpZihjYWxsYmFjayAmJiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhyZXN1bHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBnZXRDYXJlZXJTdGF0cyhkYXRhLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgdmFyIHRvdGFsTWF0Y2hlcyA9IGRhdGEubGVuZ3RoO1xuICAgICAgICAgICAgdmFyIHRvdGFsUnVucyA9IDA7XG4gICAgICAgICAgICB2YXIgY2VudHVyaWVzU2NvcmVkID0gW107XG4gICAgICAgICAgICB2YXIgaGFsZkNlbnR1cmllc1Njb3JlZCA9IFtdO1xuICAgICAgICAgICAgdmFyIG5vdE91dHMgPSAwO1xuICAgICAgICAgICAgdmFyIGRpZE5vdEJhdCA9IDA7XG4gICAgICAgICAgICB2YXIgd2lja2V0c1Rha2VuID0gMDtcbiAgICAgICAgICAgIHZhciBydW5zQ29uY2VkZWQgPSAwO1xuICAgICAgICAgICAgdmFyIGNhdGNoZXMgPSAwO1xuICAgICAgICAgICAgYW5ndWxhci5mb3JFYWNoKGRhdGEsIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICAgIHZhciBjZW50dXJ5RGV0YWlsID0ge307XG4gICAgICAgICAgICAgIHZhciBoYWxmQ2VudHVyeURldGFpbCA9IHt9O1xuXG4gICAgICAgICAgICAgIC8vQmF0dGluZyBzdGF0c1xuXG4gICAgICAgICAgICAgIC8vY2hlY2sgdG8gc2VlIGlmIHRoZSBzY29yZSBjb250YWlucyBhICogaW4gdGhlIGVuZCB3aGljaCBkZW50b2VzIE5vdE91dHMsIGlmIHllcyByZW1vdmUgZm9yIGNhbGN1bGF0aW9uc1xuICAgICAgICAgICAgICBpZih2YWx1ZS5iYXR0aW5nX3Njb3JlLmluZGV4T2YoXCIqXCIpID4gLTEpe1xuICAgICAgICAgICAgICAgIHZhbHVlLmJhdHRpbmdfc2NvcmUgPSB2YWx1ZS5iYXR0aW5nX3Njb3JlLnJlcGxhY2UoJyonLCcnKTtcbiAgICAgICAgICAgICAgICBub3RPdXRzKys7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgLy9pZiB0aGUgdmFsdWUgb2Ygc2NvcmUgaXMgTm90IGEgbnVtYmVyICwgaXQgbWVhbnMgaXQgY291bGQgYmUgRE5CKGRpZCBub3QgYmF0KSBvciBURE5CICh0ZWFtIGRpZCBub3QgYmF0KVxuICAgICAgICAgICAgICBpZihpc05hTih2YWx1ZS5iYXR0aW5nX3Njb3JlKSl7XG4gICAgICAgICAgICAgICAgZGlkTm90QmF0Kys7XG4gICAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgIC8vQ29udmVydGluZyB0aGUgc3RyaW5nIHRvIGludGVnZXJzIHRvIGRvIGNhbGN1bGF0aW9uc1xuICAgICAgICAgICAgICAgIHZhbHVlLmJhdHRpbmdfc2NvcmUgPSBwYXJzZUludCh2YWx1ZS5iYXR0aW5nX3Njb3JlKVxuICAgICAgICAgICAgICAgIC8vQ2hlY2tpbmcgdG8gc2VlIGlmIHRoZSBzY29yZSB3YXMgYSBoYWxmIGNlbnR1cnkgb3IgY2VudHVyeVxuICAgICAgICAgICAgICAgIGlmKHZhbHVlLmJhdHRpbmdfc2NvcmUgPj0gNTAgJiYgdmFsdWUuYmF0dGluZ19zY29yZSA8IDEwMCl7XG4gICAgICAgICAgICAgICAgICBoYWxmQ2VudHVyeURldGFpbC5ydW5zID0gdmFsdWUuYmF0dGluZ19zY29yZVxuICAgICAgICAgICAgICAgICAgaGFsZkNlbnR1cnlEZXRhaWwuYWdhaW5zdCA9IHZhbHVlLm9wcG9zaXRpb25cbiAgICAgICAgICAgICAgICAgIGhhbGZDZW50dXJ5RGV0YWlsLnJlc3VsdCA9IHZhbHVlLm1hdGNoX3Jlc3VsdFxuICAgICAgICAgICAgICAgICAgaGFsZkNlbnR1cnlEZXRhaWwueWVhciA9IHZhbHVlLmRhdGVcbiAgICAgICAgICAgICAgICAgIGhhbGZDZW50dXJpZXNTY29yZWQucHVzaChoYWxmQ2VudHVyeURldGFpbClcbiAgICAgICAgICAgICAgICB9ZWxzZSBpZih2YWx1ZS5iYXR0aW5nX3Njb3JlID49IDEwMCl7XG4gICAgICAgICAgICAgICAgICBjZW50dXJ5RGV0YWlsLnJ1bnMgPSB2YWx1ZS5iYXR0aW5nX3Njb3JlXG4gICAgICAgICAgICAgICAgICBjZW50dXJ5RGV0YWlsLmFnYWluc3QgPSB2YWx1ZS5vcHBvc2l0aW9uXG4gICAgICAgICAgICAgICAgICBjZW50dXJ5RGV0YWlsLnJlc3VsdCA9IHZhbHVlLm1hdGNoX3Jlc3VsdFxuICAgICAgICAgICAgICAgICAgY2VudHVyeURldGFpbC55ZWFyID0gdmFsdWUuZGF0ZVxuICAgICAgICAgICAgICAgICAgY2VudHVyaWVzU2NvcmVkLnB1c2goY2VudHVyeURldGFpbClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy9TYXZpbmcgdG90YWwgcnVuc1xuICAgICAgICAgICAgICAgIHRvdGFsUnVucyArPSB2YWx1ZS5iYXR0aW5nX3Njb3JlO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgLy9Cb3dsaW5nIHN0YXRzXG4gICAgICAgICAgICAgIGlmKCFpc05hTih2YWx1ZS53aWNrZXRzKSAmJiBwYXJzZUludCh2YWx1ZS53aWNrZXRzKSA+IDApe1xuICAgICAgICAgICAgICAgIHZhbHVlLndpY2tldHMgPSBwYXJzZUludCh2YWx1ZS53aWNrZXRzKVxuICAgICAgICAgICAgICAgIHdpY2tldHNUYWtlbiArPSB2YWx1ZS53aWNrZXRzXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYoIWlzTmFOKHZhbHVlLmNhdGNoZXMpICYmIHBhcnNlSW50KHZhbHVlLmNhdGNoZXMpID4gMCl7XG4gICAgICAgICAgICAgICAgdmFsdWUuY2F0Y2hlcyA9IHBhcnNlSW50KHZhbHVlLmNhdGNoZXMpXG4gICAgICAgICAgICAgICAgY2F0Y2hlcyArPSB2YWx1ZS5jYXRjaGVzXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYoIWlzTmFOKHZhbHVlLnJ1bnNfY29uY2VkZWQpKXtcbiAgICAgICAgICAgICAgICB2YWx1ZS5ydW5zX2NvbmNlZGVkID0gcGFyc2VJbnQodmFsdWUucnVuc19jb25jZWRlZClcbiAgICAgICAgICAgICAgICBydW5zQ29uY2VkZWQgKz0gdmFsdWUucnVuc19jb25jZWRlZDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICB2YXIgdG90YWxJbm5pbmdzID0gdG90YWxNYXRjaGVzIC0gZGlkTm90QmF0XG4gICAgICAgICAgdmFyIHN0YXRzID0ge1xuICAgICAgICAgICAgdG90YWxNYXRjaGVzIDogdG90YWxNYXRjaGVzLFxuICAgICAgICAgICAgdG90YWxSdW5zOiB0b3RhbFJ1bnMsXG4gICAgICAgICAgICBoYWxmQ2VudHVyaWVzU2NvcmVkOiBoYWxmQ2VudHVyaWVzU2NvcmVkLmxlbmd0aCxcbiAgICAgICAgICAgIGNlbnR1cmllc1Njb3JlZDogY2VudHVyaWVzU2NvcmVkLmxlbmd0aCxcbiAgICAgICAgICAgIGhpZ2hlc3RTY29yZTogIE1hdGgubWF4LmFwcGx5KG51bGwsY2VudHVyaWVzU2NvcmVkLm1hcChmdW5jdGlvbihpbmRleCl7cmV0dXJuIGluZGV4LnJ1bnN9KSksXG4gICAgICAgICAgICBub3RPdXRzOiBub3RPdXRzLFxuICAgICAgICAgICAgdG90YWxJbm5pbmdzOiB0b3RhbElubmluZ3MsXG4gICAgICAgICAgICBiYXR0aW5nQXZlcmFnZTogKHRvdGFsUnVucyAvICh0b3RhbElubmluZ3MgLSBub3RPdXRzKSkudG9GaXhlZCgyKSxcbiAgICAgICAgICAgIHdpY2tldHNUYWtlbjogd2lja2V0c1Rha2VuLFxuICAgICAgICAgICAgcnVuc0NvbmNlZGVkOiBydW5zQ29uY2VkZWQsXG4gICAgICAgICAgICBib3dsaW5nQXZlcmFnZTogKHJ1bnNDb25jZWRlZCAvIHdpY2tldHNUYWtlbikudG9GaXhlZCgyKSxcbiAgICAgICAgICAgIGNhdGNoZXM6IGNhdGNoZXNcbiAgICAgICAgICB9O1xuICAgICAgICAgIGlmKGNhbGxiYWNrICYmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhzdGF0cyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBzdGF0c1xuICAgICAgICB9XG5cblxuICAgIH0pXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
