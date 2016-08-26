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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZHVsZS5qcyIsImNvbnRyb2xsZXJzL2hvbWVDdHJsLmpzIiwiY29udHJvbGxlcnMvbWFzdGVyQ3RybC5qcyIsImNvbnRyb2xsZXJzL3JvdXRlcy5qcyIsImRpcmVjdGl2ZXMvY2FyZWVyU3RhdHMuanMiLCJkaXJlY3RpdmVzL2NlbnR1cnlTdGF0cy5qcyIsImRpcmVjdGl2ZXMvcGVyc29uYWxJbmZvLmpzIiwic2VydmljZXMvZGF0YU11dGF0b3IuanMiLCJjb250cm9sbGVycy9wYXJ0aWFscy9jZW50dXJ5U3RhdHNDdHJsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFFBQUEsT0FBQSxNQUFBO0VBQ0EsVUFBQSxZQUFBOzs7QUNEQSxRQUFBLE9BQUE7S0FDQSxXQUFBLCtDQUFBLFNBQUEsUUFBQSxPQUFBLGFBQUE7UUFDQSxPQUFBLFFBQUEsV0FBQTtVQUNBLFlBQUE7V0FDQSxLQUFBLFNBQUEsVUFBQTtnQkFDQSxZQUFBLFVBQUEsU0FBQSxNQUFBLFNBQUEsSUFBQTtvQkFDQSxZQUFBLGVBQUEsS0FBQSxTQUFBLE1BQUE7c0JBQ0EsUUFBQSxJQUFBO3NCQUNBLE9BQUEsUUFBQTs7O2FBR0EsU0FBQSxLQUFBO2dCQUNBLFFBQUEsSUFBQTs7O1FBR0EsT0FBQTs7O0FDZkEsUUFBQSxPQUFBO0tBQ0EsV0FBQSx1Q0FBQSxTQUFBLFFBQUEsWUFBQTtRQUNBLFFBQUEsSUFBQTs7O0FDRkEsUUFBQSxPQUFBO0tBQ0EscUVBQUEsU0FBQSxnQkFBQSxvQkFBQSxtQkFBQTs7UUFFQSxtQkFBQSxVQUFBOztRQUVBO2FBQ0EsTUFBQSxPQUFBO2dCQUNBLEtBQUE7Z0JBQ0EsT0FBQTtvQkFDQSxVQUFBO3dCQUNBLGFBQUE7O29CQUVBLFdBQUE7d0JBQ0EsYUFBQTt3QkFDQSxZQUFBOzs7Ozs7O1NBT0EsTUFBQSxZQUFBO1lBQ0EsS0FBQTtZQUNBLE9BQUE7Z0JBQ0EsWUFBQTtvQkFDQSxhQUFBO29CQUNBLFlBQUE7Ozs7Ozs7OztRQVNBLGtCQUFBLFVBQUE7Ozs7QUNuQ0EsUUFBQSxPQUFBO0tBQ0EsVUFBQSxlQUFBLFdBQUE7UUFDQSxNQUFBO1lBQ0EsVUFBQTtZQUNBLE9BQUE7Z0JBQ0EsT0FBQTs7WUFFQSxhQUFBOzs7OztBQ1BBLFFBQUEsT0FBQTtLQUNBLFVBQUEsZ0JBQUEsV0FBQTtRQUNBLE1BQUE7WUFDQSxVQUFBO1lBQ0EsT0FBQTtnQkFDQSxjQUFBOztZQUVBLGFBQUE7WUFDQSxZQUFBOzs7O0FDUkEsUUFBQSxPQUFBO0tBQ0EsVUFBQSxnQkFBQSxXQUFBO1FBQ0EsTUFBQTtZQUNBLFVBQUE7WUFDQSxhQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUN5QkEsUUFBQSxPQUFBO0tBQ0EsUUFBQSx5QkFBQSxTQUFBLE9BQUE7UUFDQSxNQUFBO1lBQ0EsU0FBQTtZQUNBLFdBQUE7WUFDQSxnQkFBQTs7OztRQUlBLFNBQUEsVUFBQTtZQUNBLE9BQUEsTUFBQSxJQUFBOzs7UUFHQSxTQUFBLFVBQUEsS0FBQSxVQUFBO1lBQ0EsSUFBQSxNQUFBLElBQUEsTUFBQTtZQUNBLElBQUEsU0FBQTtZQUNBLElBQUEsUUFBQSxNQUFBLEdBQUEsTUFBQTtZQUNBLElBQUEsSUFBQSxFQUFBLEVBQUEsRUFBQSxNQUFBLFFBQUEsRUFBQSxJQUFBO2dCQUNBLElBQUEsTUFBQTtnQkFDQSxJQUFBLFlBQUEsTUFBQSxHQUFBLE1BQUE7Z0JBQ0EsSUFBQSxJQUFBLEVBQUEsRUFBQSxFQUFBLFFBQUEsT0FBQSxJQUFBO2tCQUNBLElBQUEsUUFBQSxNQUFBLFlBQUE7O2dCQUVBLE9BQUEsS0FBQTs7WUFFQSxRQUFBLElBQUE7WUFDQSxHQUFBLGFBQUEsT0FBQSxhQUFBLGFBQUE7Z0JBQ0EsT0FBQSxTQUFBOztVQUVBLE9BQUE7OztRQUdBLFNBQUEsZUFBQSxNQUFBLFVBQUE7WUFDQSxJQUFBLGVBQUEsS0FBQTtZQUNBLElBQUEsWUFBQTtZQUNBLElBQUEsa0JBQUE7WUFDQSxJQUFBLHNCQUFBO1lBQ0EsSUFBQSxVQUFBO1lBQ0EsSUFBQSxZQUFBO1lB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QTtlQUNBLE9BQUE7Y0FDQTtlQUNBLE9BQUE7ZUFDQSxPQUFBO2VBQ0EsV0FBQTtlQUNBLE9BQUE7Y0FDQTtlQUNBLE9BQUE7ZUFDQSxPQUFBO2VBQ0EsV0FBQTtlQUNBLE9BQUE7Y0FDQTtlQUNBLE9BQUE7ZUFDQSxPQUFBO2VBQ0EsV0FBQTtlQUNBLE9BQUE7Ozs7O1dBS0EsT0FBQSxVQUFBOzs7ZUFHQSxZQUFBOzs7ZUFHQSxtQkFBQTs7O2VBR0Esb0JBQUE7OztlQUdBLG9CQUFBOzs7ZUFHQSx1QkFBQTs7O2VBR0EsZ0JBQUE7OztlQUdBLGlCQUFBOzs7ZUFHQSxlQUFBOzs7ZUFHQSxjQUFBOzs7ZUFHQSxnQkFBQTs7Ozs7O01BTUEsT0FBQSxnQ0FBQSxTQUFBLE1BQUEsUUFBQTtZQUNBLE9BQUEsaUJBQUE7VUFDQTtZQUNBLE9BQUE7WUFDQSxNQUFBO1lBQ0EsV0FBQTtZQUNBLE9BQUE7O1VBRUE7WUFDQSxPQUFBO1lBQ0EsT0FBQTtZQUNBLFdBQUE7WUFDQSxPQUFBOzs7OztRQUtBLE9BQUEscUJBQUE7OztVQUdBLFlBQUE7OztVQUdBLG9CQUFBOzs7VUFHQSxxQkFBQTs7O1VBR0EscUJBQUE7OztVQUdBLHdCQUFBOzs7VUFHQSxpQkFBQTs7O1VBR0Esa0JBQUE7OztVQUdBLGdCQUFBOzs7VUFHQSxlQUFBOzs7VUFHQSxpQkFBQTs7Ozs7OztBQU9BIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbImFuZ3VsYXIubW9kdWxlKCdhcHAnLFtcbiAgJ25nUm91dGUnLCd1aS5yb3V0ZXInLCd0Yy5jaGFydGpzJ1xuXSlcbiIsImFuZ3VsYXIubW9kdWxlKCdhcHAnKVxuICAgIC5jb250cm9sbGVyKCdob21lQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJGh0dHAsIGRhdGFNdXRhdG9yKSB7XG4gICAgICAgICRzY29wZS5zZXR1cCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGRhdGFNdXRhdG9yLmdldERhdGEoKVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgZGF0YU11dGF0b3IuY3N2VG9KU09OKHJlc3BvbnNlLmRhdGEsIGZ1bmN0aW9uKGNzdil7XG4gICAgICAgICAgICAgICAgICAgIGRhdGFNdXRhdG9yLmdldENhcmVlclN0YXRzKGNzdiwgZnVuY3Rpb24oc3RhdHMpe1xuICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHN0YXRzKVxuICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zdGF0cyA9IHN0YXRzXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICB9LCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgJHNjb3BlLnNldHVwKCk7ICAgICAgICBcbiAgICB9KVxuIiwiYW5ndWxhci5tb2R1bGUoJ2FwcCcpXG4gICAgLmNvbnRyb2xsZXIoJ21hc3RlckN0cmwnLCBmdW5jdGlvbigkc2NvcGUsICRyb290U2NvcGUpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJtYXN0ZXJDdHJsXCIpO1xuICAgIH0pXG4iLCJhbmd1bGFyLm1vZHVsZSgnYXBwJylcbiAgICAuY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyKSB7XG5cbiAgICAgICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnLycpO1xuXG4gICAgICAgICRzdGF0ZVByb3ZpZGVyXG4gICAgICAgICAgICAuc3RhdGUoJ2FwcCcsIHtcbiAgICAgICAgICAgICAgICB1cmw6ICcvJyxcbiAgICAgICAgICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgICAgICAgICAnaGVhZGVyJzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvbmF2Lmh0bWwnLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAnY29udGVudCc6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL2hvbWUuaHRtbCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnaG9tZUN0cmwnXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuXG5cblxuICAgICAgICAuc3RhdGUoJ2FwcC5ob21lJywge1xuICAgICAgICAgICAgdXJsOiAnaG9tZScsXG4gICAgICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgICAgICdjb250ZW50QCc6IHtcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd1c2Vycy9ob21lLmh0bWwnLFxuICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnaG9tZUN0cmwnXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0pXG5cblxuXG5cbiAgICAgICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpXG5cbiAgICB9KTtcbiIsImFuZ3VsYXIubW9kdWxlKCdhcHAnKVxuICAgIC5kaXJlY3RpdmUoJ2NhcmVlclN0YXRzJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybntcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge1xuICAgICAgICAgICAgICAgIHN0YXRzOiAnPWl0ZW0nLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAncGFydGlhbHMvY2FyZWVyU3RhdHMuaHRtbCdcbiAgICAgICAgICAgICAgICAvL2NvbnRyb2xsZXI6ICdhcHAucGFydGlhbHMudmVudWVzLnZlbnVlSXRlbUN0cmwnXG4gICAgICAgIH1cbiAgICB9KVxuIiwiYW5ndWxhci5tb2R1bGUoJ2FwcCcpXG4gICAgLmRpcmVjdGl2ZSgnY2VudHVyeVN0YXRzJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybntcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge1xuICAgICAgICAgICAgICAgIGNlbnR1cnlTdGF0czogJz1pdGVtJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3BhcnRpYWxzL2NlbnR1cnlTdGF0cy5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdjZW50dXJ5U3RhdHNDdHJsJ1xuICAgICAgICB9XG4gICAgfSlcbiIsImFuZ3VsYXIubW9kdWxlKCdhcHAnKVxuICAgIC5kaXJlY3RpdmUoJ3BlcnNvbmFsSW5mbycsIGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm57XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLCAgICAgICAgICAgIFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdwYXJ0aWFscy9wZXJzb25hbEluZm8uaHRtbCdcbiAgICAgICAgfVxuICAgIH0pXG4iLCIvL1RoaW5ncyB3ZSBjYW4gZ2V0IGZyb20gdGhlIGRhdGEgOiAtXG4vL1RvdGFsIG1hdGNoZXMgcGxheWVkIC1kb25lXG4vL1RvdGFsIGNlbnR1cmllcyBzY29yZWQgLSBkb25lXG4vL3J1bnMgc2NvcmVkIGluIGEgeWVhclxuLy9jZW50dXJpZXMgc2NvcmVkIGluIGEgeWVhciAtIGRvbmVcbi8vaGFsZiBjZW50dXJpZXMgc2NvcmVkIGluIGEgeWVhciAtIGRvbmVcbi8vaGFsZiBjZW50dXJpZXMgY292ZXJ0ZWQgaW50byBjZW50dXJ5XG4vL25lcnZvdXMgbmluZXRpZXNcbi8vc2NvcmUgYWdhaW5zdCB0aGUgdGVhbXNcbi8vc2NvcmUgaW4gdGhlIHdpbm5pbmcgY2F1c2UgLSBkb25lXG4vL2Jvd2xpbmcgZmlndXJlcy0gZG9uZVxuLy9wZXJmb3JtYW5jZSBpbiBjbG9zZSBtYXRjaGVzXG4vL2JhdHRpbmcgZmlyc3QgcGVyZm9ybWFuY2Vcbi8vbW92aW5nIGF2ZXJhZ2UsIGxvbmdpdHVkYW5hbCBjYXJlZXIgZ3Jvd3RoXG4vLzEwMDAgUnVucyBpbiBvbmUgY2FsZW5kYXIgeWVhclxuLy9iYXR0aW5nIHNlY29uZCBwZXJmb3JtYW5jZSAod2hpbGUgY2hhc2luZylcblxuLy9UT0RPOlxuLy9HZXQgY2VudHVyaWVzIGJ5IGNvdW50cnlcbi8vR2V0IGNlbnR1cmllcyBieSB5ZWFyXG4vL0dldCBydW5zIGJ5IGNvdW50cnlcbi8vR2V0IHJ1bnMgYnkgeWVhclxuLy9HZXQgcnVucyBieSB3aW5uaW5nXG4vL0dldCBydW5zIGJ5IGxvb3Npbmdcbi8vR2V0IGNlbnR1cmllcyBpbiB3aW5uaW5nIGNhdXNlXG5cblxuXG4vL05PVEU6IE9uY2UgYWxsIGRhdGEgaXMgY29sbGVjdGVkIGNsZWFuIG91dCB0aGUgY2FsbGJhY2sgaGVsbCA6UFxuYW5ndWxhci5tb2R1bGUoJ2FwcCcpXG4gICAgLnNlcnZpY2UoJ2RhdGFNdXRhdG9yJywgZnVuY3Rpb24oJGh0dHApIHtcbiAgICAgICAgcmV0dXJue1xuICAgICAgICAgICAgZ2V0RGF0YTogZ2V0RGF0YSxcbiAgICAgICAgICAgIGNzdlRvSlNPTjogY3N2VG9KU09OLFxuICAgICAgICAgICAgZ2V0Q2FyZWVyU3RhdHM6IGdldENhcmVlclN0YXRzXG5cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGdldERhdGEoKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvZGF0YS9zYWNoaW4uY3N2JylcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGNzdlRvSlNPTihjc3YsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICB2YXIgbGluZXM9Y3N2LnNwbGl0KFwiXFxuXCIpO1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgICAgICAgICAgdmFyIGhlYWRlcnM9bGluZXNbMF0uc3BsaXQoXCIsXCIpO1xuICAgICAgICAgICAgZm9yKHZhciBpPTE7aTxsaW5lcy5sZW5ndGggLTE7aSsrKXtcbiAgICAgICAgICAgICAgICB2YXIgb2JqID0ge307XG4gICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRsaW5lPWxpbmVzW2ldLnNwbGl0KFwiLFwiKTtcbiAgICAgICAgICAgICAgICBmb3IodmFyIGo9MDtqPGhlYWRlcnMubGVuZ3RoO2orKyl7XG4gICAgICAgICAgICAgICAgICBvYmpbaGVhZGVyc1tqXV0gPSBjdXJyZW50bGluZVtqXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2gob2JqKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3VsdClcbiAgICAgICAgICAgIGlmKGNhbGxiYWNrICYmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKHJlc3VsdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGdldENhcmVlclN0YXRzKGRhdGEsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICB2YXIgdG90YWxNYXRjaGVzID0gZGF0YS5sZW5ndGg7XG4gICAgICAgICAgICB2YXIgdG90YWxSdW5zID0gMDtcbiAgICAgICAgICAgIHZhciBjZW50dXJpZXNTY29yZWQgPSBbXTtcbiAgICAgICAgICAgIHZhciBoYWxmQ2VudHVyaWVzU2NvcmVkID0gW107XG4gICAgICAgICAgICB2YXIgbm90T3V0cyA9IDA7XG4gICAgICAgICAgICB2YXIgZGlkTm90QmF0ID0gMDtcbiAgICAgICAgICAgIHZhciB3aWNrZXRzVGFrZW4gPSAwO1xuICAgICAgICAgICAgdmFyIHJ1bnNDb25jZWRlZCA9IDA7XG4gICAgICAgICAgICB2YXIgY2F0Y2hlcyA9IDA7XG4gICAgICAgICAgICBhbmd1bGFyLmZvckVhY2goZGF0YSwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgICAgdmFyIGNlbnR1cnlEZXRhaWwgPSB7fTtcbiAgICAgICAgICAgICAgdmFyIGhhbGZDZW50dXJ5RGV0YWlsID0ge307XG5cbiAgICAgICAgICAgICAgLy9CYXR0aW5nIHN0YXRzXG5cbiAgICAgICAgICAgICAgLy9jaGVjayB0byBzZWUgaWYgdGhlIHNjb3JlIGNvbnRhaW5zIGEgKiBpbiB0aGUgZW5kIHdoaWNoIGRlbnRvZXMgTm90T3V0cywgaWYgeWVzIHJlbW92ZSBmb3IgY2FsY3VsYXRpb25zXG4gICAgICAgICAgICAgIGlmKHZhbHVlLmJhdHRpbmdfc2NvcmUuaW5kZXhPZihcIipcIikgPiAtMSl7XG4gICAgICAgICAgICAgICAgdmFsdWUuYmF0dGluZ19zY29yZSA9IHZhbHVlLmJhdHRpbmdfc2NvcmUucmVwbGFjZSgnKicsJycpO1xuICAgICAgICAgICAgICAgIG5vdE91dHMrKztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAvL2lmIHRoZSB2YWx1ZSBvZiBzY29yZSBpcyBOb3QgYSBudW1iZXIgLCBpdCBtZWFucyBpdCBjb3VsZCBiZSBETkIoZGlkIG5vdCBiYXQpIG9yIFRETkIgKHRlYW0gZGlkIG5vdCBiYXQpXG4gICAgICAgICAgICAgIGlmKGlzTmFOKHZhbHVlLmJhdHRpbmdfc2NvcmUpKXtcbiAgICAgICAgICAgICAgICBkaWROb3RCYXQrKztcbiAgICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICAgLy9Db252ZXJ0aW5nIHRoZSBzdHJpbmcgdG8gaW50ZWdlcnMgdG8gZG8gY2FsY3VsYXRpb25zXG4gICAgICAgICAgICAgICAgdmFsdWUuYmF0dGluZ19zY29yZSA9IHBhcnNlSW50KHZhbHVlLmJhdHRpbmdfc2NvcmUpXG4gICAgICAgICAgICAgICAgLy9DaGVja2luZyB0byBzZWUgaWYgdGhlIHNjb3JlIHdhcyBhIGhhbGYgY2VudHVyeSBvciBjZW50dXJ5XG4gICAgICAgICAgICAgICAgaWYodmFsdWUuYmF0dGluZ19zY29yZSA+PSA1MCAmJiB2YWx1ZS5iYXR0aW5nX3Njb3JlIDwgMTAwKXtcbiAgICAgICAgICAgICAgICAgIGhhbGZDZW50dXJ5RGV0YWlsLnJ1bnMgPSB2YWx1ZS5iYXR0aW5nX3Njb3JlXG4gICAgICAgICAgICAgICAgICBoYWxmQ2VudHVyeURldGFpbC5hZ2FpbnN0ID0gdmFsdWUub3Bwb3NpdGlvblxuICAgICAgICAgICAgICAgICAgaGFsZkNlbnR1cnlEZXRhaWwucmVzdWx0ID0gdmFsdWUubWF0Y2hfcmVzdWx0XG4gICAgICAgICAgICAgICAgICBoYWxmQ2VudHVyeURldGFpbC5pbm5pbmdzID0gdmFsdWUuYmF0dGluZ19pbm5pbmdzXG4gICAgICAgICAgICAgICAgICBoYWxmQ2VudHVyeURldGFpbC55ZWFyID0gKG5ldyBEYXRlKERhdGUucGFyc2UodmFsdWUuZGF0ZSkpKS5nZXRGdWxsWWVhcigpXG4gICAgICAgICAgICAgICAgICBoYWxmQ2VudHVyaWVzU2NvcmVkLnB1c2goaGFsZkNlbnR1cnlEZXRhaWwpXG4gICAgICAgICAgICAgICAgfWVsc2UgaWYodmFsdWUuYmF0dGluZ19zY29yZSA+PSAxMDApe1xuICAgICAgICAgICAgICAgICAgY2VudHVyeURldGFpbC5ydW5zID0gdmFsdWUuYmF0dGluZ19zY29yZVxuICAgICAgICAgICAgICAgICAgY2VudHVyeURldGFpbC5hZ2FpbnN0ID0gdmFsdWUub3Bwb3NpdGlvblxuICAgICAgICAgICAgICAgICAgY2VudHVyeURldGFpbC5yZXN1bHQgPSB2YWx1ZS5tYXRjaF9yZXN1bHRcbiAgICAgICAgICAgICAgICAgIGNlbnR1cnlEZXRhaWwuaW5uaW5ncyA9IHZhbHVlLmJhdHRpbmdfaW5uaW5nc1xuICAgICAgICAgICAgICAgICAgY2VudHVyeURldGFpbC55ZWFyID0gKG5ldyBEYXRlKERhdGUucGFyc2UodmFsdWUuZGF0ZSkpKS5nZXRGdWxsWWVhcigpXG4gICAgICAgICAgICAgICAgICBjZW50dXJpZXNTY29yZWQucHVzaChjZW50dXJ5RGV0YWlsKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvL1NhdmluZyB0b3RhbCBydW5zXG4gICAgICAgICAgICAgICAgdG90YWxSdW5zICs9IHZhbHVlLmJhdHRpbmdfc2NvcmU7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAvL0Jvd2xpbmcgc3RhdHNcbiAgICAgICAgICAgICAgaWYoIWlzTmFOKHZhbHVlLndpY2tldHMpICYmIHBhcnNlSW50KHZhbHVlLndpY2tldHMpID4gMCl7XG4gICAgICAgICAgICAgICAgdmFsdWUud2lja2V0cyA9IHBhcnNlSW50KHZhbHVlLndpY2tldHMpXG4gICAgICAgICAgICAgICAgd2lja2V0c1Rha2VuICs9IHZhbHVlLndpY2tldHNcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZighaXNOYU4odmFsdWUuY2F0Y2hlcykgJiYgcGFyc2VJbnQodmFsdWUuY2F0Y2hlcykgPiAwKXtcbiAgICAgICAgICAgICAgICB2YWx1ZS5jYXRjaGVzID0gcGFyc2VJbnQodmFsdWUuY2F0Y2hlcylcbiAgICAgICAgICAgICAgICBjYXRjaGVzICs9IHZhbHVlLmNhdGNoZXNcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZighaXNOYU4odmFsdWUucnVuc19jb25jZWRlZCkpe1xuICAgICAgICAgICAgICAgIHZhbHVlLnJ1bnNfY29uY2VkZWQgPSBwYXJzZUludCh2YWx1ZS5ydW5zX2NvbmNlZGVkKVxuICAgICAgICAgICAgICAgIHJ1bnNDb25jZWRlZCArPSB2YWx1ZS5ydW5zX2NvbmNlZGVkO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgIHZhciB0b3RhbElubmluZ3MgPSB0b3RhbE1hdGNoZXMgLSBkaWROb3RCYXRcbiAgICAgICAgICB2YXIgc3RhdHMgPSB7XG4gICAgICAgICAgICB0b3RhbE1hdGNoZXMgOiB0b3RhbE1hdGNoZXMsXG4gICAgICAgICAgICB0b3RhbFJ1bnM6IHRvdGFsUnVucyxcbiAgICAgICAgICAgIGhhbGZDZW50dXJpZXNTY29yZWQ6IGhhbGZDZW50dXJpZXNTY29yZWQubGVuZ3RoLFxuICAgICAgICAgICAgY2VudHVyaWVzU2NvcmVkOiBjZW50dXJpZXNTY29yZWQubGVuZ3RoLFxuICAgICAgICAgICAgaGlnaGVzdFNjb3JlOiAgTWF0aC5tYXguYXBwbHkobnVsbCxjZW50dXJpZXNTY29yZWQubWFwKGZ1bmN0aW9uKGluZGV4KXtyZXR1cm4gaW5kZXgucnVuc30pKSxcbiAgICAgICAgICAgIG5vdE91dHM6IG5vdE91dHMsXG4gICAgICAgICAgICB0b3RhbElubmluZ3M6IHRvdGFsSW5uaW5ncyxcbiAgICAgICAgICAgIGJhdHRpbmdBdmVyYWdlOiAodG90YWxSdW5zIC8gKHRvdGFsSW5uaW5ncyAtIG5vdE91dHMpKS50b0ZpeGVkKDIpLFxuICAgICAgICAgICAgd2lja2V0c1Rha2VuOiB3aWNrZXRzVGFrZW4sXG4gICAgICAgICAgICBydW5zQ29uY2VkZWQ6IHJ1bnNDb25jZWRlZCxcbiAgICAgICAgICAgIGJvd2xpbmdBdmVyYWdlOiAocnVuc0NvbmNlZGVkIC8gd2lja2V0c1Rha2VuKS50b0ZpeGVkKDIpLFxuICAgICAgICAgICAgY2F0Y2hlczogY2F0Y2hlcyxcbiAgICAgICAgICAgIGFsbENlbnR1cmllczoge2NlbnR1cmllc1Njb3JlZCxoYWxmQ2VudHVyaWVzU2NvcmVkfVxuICAgICAgICAgIH07XG4gICAgICAgICAgaWYoY2FsbGJhY2sgJiYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKHN0YXRzKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHN0YXRzXG4gICAgICAgIH1cblxuXG4gICAgfSlcbiIsImFuZ3VsYXIubW9kdWxlKCdhcHAnKVxuICAgIC5jb250cm9sbGVyKCdjZW50dXJ5U3RhdHNDdHJsJywgZnVuY3Rpb24oJHNjb3BlKSB7XG4gICAgICAkc2NvcGUuJHdhdGNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgIHJldHVybiAkc2NvcGUuY2VudHVyeVN0YXRzO1xuICAgICAgICAgICB9LCBmdW5jdGlvbihuKSB7XG4gICAgICAgICAgICAgICBpZighbilyZXR1cm5cbiAgICAgICAgICAgICAgICRzY29wZS5hbmFseXplQ2VudHVyaWVzKCRzY29wZS5jZW50dXJ5U3RhdHMpXG4gICAgICAgICAgIH0pO1xuXG4gICAgICAkc2NvcGUuYW5hbHl6ZUNlbnR1cmllcyA9IGZ1bmN0aW9uKGNlbnR1cnlTdGF0cyl7XG4gICAgICAgIHZhciBzY29yZXMgPSBfLnBsdWNrKGNlbnR1cnlTdGF0cy5jZW50dXJpZXNTY29yZWQsICdydW5zJylcbiAgICAgICAgdmFyIGFnYWluc3QgPSBfLnBsdWNrKGNlbnR1cnlTdGF0cy5jZW50dXJpZXNTY29yZWQsICdhZ2FpbnN0JylcblxuICAgICAgICB2YXIgdG90YWxGaWZ0aWVzID0gY2VudHVyeVN0YXRzLmhhbGZDZW50dXJpZXNTY29yZWQubGVuZ3RoXG4gICAgICAgIHZhciB0b3RhbEh1bmRyZWRzID0gY2VudHVyeVN0YXRzLmNlbnR1cmllc1Njb3JlZC5sZW5ndGhcbiAgICAgICAgLy9TZW5kIGFycmF5IG9mIGNvbG9ycyB0byBjaGFydGpzXG4gICAgICAgIHZhciBjb2xvcnMgPSBbXTtcbiAgICAgICAgY2VudHVyeVN0YXRzLmNlbnR1cmllc1Njb3JlZC5tYXAoZnVuY3Rpb24ocmVzLCBrZXkpe1xuICAgICAgICAgIGlmKHJlcy5yZXN1bHQgPT0gXCJ3b25cIil7XG4gICAgICAgICAgICBjb2xvcnNba2V5XSA9IFwicmdiYSgwLDEzMiwyNTUsMC44KVwiXG4gICAgICAgICAgfWVsc2UgaWYocmVzLnJlc3VsdCA9PSBcImxvc3RcIil7XG4gICAgICAgICAgICBjb2xvcnNba2V5XSA9IFwicmdiYSgyMzcsNjMsNDcsMC44KVwiXG4gICAgICAgICAgfWVsc2UgaWYocmVzLnJlc3VsdCA9PSBcInRpZWRcIil7XG4gICAgICAgICAgICBjb2xvcnNba2V5XSA9IFwiYmxhY2tcIlxuICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgY29sb3JzW2tleV0gPSBcInllbGxvd1wiXG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBjb2xvcnNcbiAgICAgICAgfSlcbiAgICAgICAgdmFyIHdvbiA9IF8uZmlsdGVyKGNlbnR1cnlTdGF0cy5jZW50dXJpZXNTY29yZWQsIGZ1bmN0aW9uKGNlbnQpe1xuICAgICAgICAgIHJldHVybiBjZW50LnJlc3VsdCA9PSBcIndvblwiXG4gICAgICAgIH0pXG4gICAgICAgIC8vIHZhciBsb3N0ID0gXy5maWx0ZXIoY2VudHVyeVN0YXRzLmNlbnR1cmllc1Njb3JlZCwgZnVuY3Rpb24oY2VudCl7XG4gICAgICAgIC8vICAgcmV0dXJuIGNlbnQucmVzdWx0ID09PSBcImxvc3RcIlxuICAgICAgICAvLyB9KVxuICAgICAgICAvLyB2YXIgdGllZCA9IF8uZmlsdGVyKGNlbnR1cnlTdGF0cy5jZW50dXJpZXNTY29yZWQsIGZ1bmN0aW9uKGNlbnQpe1xuICAgICAgICAvLyAgIHJldHVybiBjZW50LnJlc3VsdCA9PT0gXCJ0aWVkXCJcbiAgICAgICAgLy8gfSlcbiAgICAgICAgLy8gdmFyIG5vcmVzdWx0ID0gXy5maWx0ZXIoY2VudHVyeVN0YXRzLmNlbnR1cmllc1Njb3JlZCwgZnVuY3Rpb24oY2VudCl7XG4gICAgICAgIC8vICAgcmV0dXJuIGNlbnQucmVzdWx0ID09PSBcIm4vclwiXG4gICAgICAgIC8vIH0pXG5cbiAgICAgICAgLy9DZW50dXJ5IHdoaWxlIGNoYXNpbmdcbiAgICAgICAgdmFyIGNoYXNpbmdDZW50dXJpZXMgPSBfLmZpbHRlcihjZW50dXJ5U3RhdHMuY2VudHVyaWVzU2NvcmVkLCBmdW5jdGlvbihjZW50KXtcbiAgICAgICAgICByZXR1cm4gY2VudC5pbm5pbmdzID09IFwiMm5kXCJcbiAgICAgICAgfSlcbiAgICAgICAgdmFyIHdpbmNoYXNpbmdDZW50dXJpZXMgPSBfLmZpbHRlcihjaGFzaW5nQ2VudHVyaWVzLCBmdW5jdGlvbihjZW50KXtcbiAgICAgICAgICByZXR1cm4gY2VudC5yZXN1bHQgPT0gXCJ3b25cIlxuICAgICAgICB9KVxuICAgICAgICB2YXIgbG9zdGNoYXNpbmdDZW50dXJpZXMgPSBfLmZpbHRlcihjaGFzaW5nQ2VudHVyaWVzLCBmdW5jdGlvbihjZW50KXtcbiAgICAgICAgICByZXR1cm4gY2VudC5yZXN1bHQgPT09IFwibG9zdFwiXG4gICAgICAgIH0pXG4gICAgICAgIHZhciB0aWVkY2hhc2luZ0NlbnR1cmllcyA9IF8uZmlsdGVyKGNoYXNpbmdDZW50dXJpZXMsIGZ1bmN0aW9uKGNlbnQpe1xuICAgICAgICAgIHJldHVybiBjZW50LnJlc3VsdCA9PT0gXCJ0aWVkXCJcbiAgICAgICAgfSlcbiAgICAgICAgdmFyIG5vcmVzdWx0Y2hhc2luZ0NlbnR1cmllcyA9IF8uZmlsdGVyKGNoYXNpbmdDZW50dXJpZXMsIGZ1bmN0aW9uKGNlbnQpe1xuICAgICAgICAgIHJldHVybiBjZW50LnJlc3VsdCA9PT0gXCJuL3JcIlxuICAgICAgICB9KVxuXG4gICAgICAgIC8vQ2VudHVyeSBhZ2FpbnN0IHRlYW1zXG4gICAgICAgIHZhciBjZW50dXJ5QWdhaW5zdFRlYW1zID0gW107XG4gICAgICAgIGNlbnR1cnlTdGF0cy5jZW50dXJpZXNTY29yZWQubWFwKGZ1bmN0aW9uKHJlcyl7XG4gICAgICAgICAgdmFyIHRlYW0gPSByZXMuYWdhaW5zdDtcbiAgICAgICAgICB2YXIgY2VudHVyeSA9IHtcbiAgICAgICAgICAgIHNjb3JlOiByZXMucnVuc1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZih0eXBlb2YoY2VudHVyeUFnYWluc3RUZWFtc1t0ZWFtXSkgPT0gXCJ1bmRlZmluZWRcIilcbiAgICAgICAgICAgICAgICAgIGNlbnR1cnlBZ2FpbnN0VGVhbXNbdGVhbV0gPSBbXVxuICAgICAgICAgIHJldHVybiBjZW50dXJ5QWdhaW5zdFRlYW1zW3RlYW1dLnB1c2goY2VudHVyeSlcbiAgICAgICAgfSlcblxuICAgICAgICAvL0NlbnR1cnkgb3ZlciB0aGUgeWVhcnNcbiAgICAgICAgdmFyIGNlbnR1cnlCeVllYXIgPSBbXTtcbiAgICAgICAgY2VudHVyeVN0YXRzLmNlbnR1cmllc1Njb3JlZC5tYXAoZnVuY3Rpb24ocmVzKXtcbiAgICAgICAgICB2YXIgeWVhciA9IHJlcy55ZWFyO1xuICAgICAgICAgIHZhciBjZW50dXJ5ID0ge1xuICAgICAgICAgICAgc2NvcmU6IHJlcy5ydW5zXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmKHR5cGVvZihjZW50dXJ5QnlZZWFyW3llYXJdKSA9PSBcInVuZGVmaW5lZFwiKVxuICAgICAgICAgICAgICAgICAgY2VudHVyeUJ5WWVhclt5ZWFyXSA9IFtdXG4gICAgICAgICAgcmV0dXJuIGNlbnR1cnlCeVllYXJbeWVhcl0ucHVzaChjZW50dXJ5KVxuICAgICAgICB9KVxuXG4gICAgICAgIHZhciBoYWxmQ2VudHVyeUJ5WWVhciA9IFtdO1xuICAgICAgICBjZW50dXJ5U3RhdHMuaGFsZkNlbnR1cmllc1Njb3JlZC5tYXAoZnVuY3Rpb24ocmVzKXtcbiAgICAgICAgICB2YXIgeWVhciA9IHJlcy55ZWFyO1xuICAgICAgICAgIHZhciBoYWxmQ2VudHVyeSA9IHtcbiAgICAgICAgICAgIHNjb3JlOiByZXMucnVuc1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZih0eXBlb2YoaGFsZkNlbnR1cnlCeVllYXJbeWVhcl0pID09IFwidW5kZWZpbmVkXCIpXG4gICAgICAgICAgICAgICAgICBoYWxmQ2VudHVyeUJ5WWVhclt5ZWFyXSA9IFtdXG4gICAgICAgICAgcmV0dXJuIGhhbGZDZW50dXJ5QnlZZWFyW3llYXJdLnB1c2goaGFsZkNlbnR1cnkpXG4gICAgICAgIH0pXG5cbiAgICAgICAgY29uc29sZS5sb2coY2VudHVyeUJ5WWVhcixoYWxmQ2VudHVyeUJ5WWVhcilcblxuXG4gICAgICAgICRzY29wZS53aW5uaW5nUmF0aW8gPSAod29uLmxlbmd0aC9jZW50dXJ5U3RhdHMuY2VudHVyaWVzU2NvcmVkLmxlbmd0aCkudG9GaXhlZCgyKSAqIDEwO1xuICAgICAgICAkc2NvcGUucHJlcGFyZUJhckdyYXBoKHNjb3JlcywgYWdhaW5zdCwgY29sb3JzKVxuICAgICAgICAkc2NvcGUucHJlcGFyZUJhckdyYXBoQWdhaW5zdFRlYW0oY2VudHVyeUFnYWluc3RUZWFtcylcbiAgICAgICAgJHNjb3BlLnByZXBhcmVMaW5lR3JhcGgoY2VudHVyeUJ5WWVhcixoYWxmQ2VudHVyeUJ5WWVhcik7XG4gICAgICAgICRzY29wZS5wcmVwYXJlRG91Z2hudXRDaGFydCh3aW5jaGFzaW5nQ2VudHVyaWVzLmxlbmd0aCxsb3N0Y2hhc2luZ0NlbnR1cmllcy5sZW5ndGgsdGllZGNoYXNpbmdDZW50dXJpZXMubGVuZ3RoLG5vcmVzdWx0Y2hhc2luZ0NlbnR1cmllcy5sZW5ndGgpXG4gICAgICAgICRzY29wZS5wcmVwYXJlQ29udmVyc2lvblJhdGVQaWVDaGFydCh0b3RhbEZpZnRpZXMsdG90YWxIdW5kcmVkcylcbiAgICAgIH1cblxuXG5cblxuXG5cblxuXG4gICAgICAkc2NvcGUucHJlcGFyZUJhckdyYXBoID0gZnVuY3Rpb24gKHNjb3JlcyxhZ2FpbnN0LCBjb2xvcnMpe1xuICAgICAgICAkc2NvcGUuYmFyZGF0YSA9IHtcbiAgICAgICAgICAgICAgIGxhYmVsczogYWdhaW5zdCxcbiAgICAgICAgICAgICAgIGRhdGFzZXRzOiBbe1xuICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnQ2VudHVyaWVzJyxcbiAgICAgICAgICAgICAgICAgICBmaWxsQ29sb3I6IGNvbG9ycyxcbiAgICAgICAgICAgICAgICAgICBzdHJva2VDb2xvcjogJ3JnYmEoMjIwLDIyMCwyMjAsMSknLFxuICAgICAgICAgICAgICAgICAgIHBvaW50Q29sb3I6ICdyZ2JhKDIyMCwyMjAsMjIwLDEpJyxcbiAgICAgICAgICAgICAgICAgICBwb2ludFN0cm9rZUNvbG9yOiAnI2ZmZicsXG4gICAgICAgICAgICAgICAgICAgcG9pbnRIaWdobGlnaHRGaWxsOiAnI2ZmZicsXG4gICAgICAgICAgICAgICAgICAgcG9pbnRIaWdobGlnaHRTdHJva2U6ICdyZ2JhKDIyMCwyMjAsMjIwLDEpJyxcbiAgICAgICAgICAgICAgICAgICBkYXRhOiBzY29yZXNcbiAgICAgICAgICAgICAgIH1dXG4gICAgICAgICAgIH07XG5cbiAgICAgICAgICAgLy8gQ2hhcnQuanMgT3B0aW9uc1xuICAgICAgICAgICAkc2NvcGUuYmFyb3B0aW9ucyA9IHtcblxuICAgICAgICAgICAgICAgLy8gU2V0cyB0aGUgY2hhcnQgdG8gYmUgcmVzcG9uc2l2ZVxuICAgICAgICAgICAgICAgcmVzcG9uc2l2ZTogdHJ1ZSxcblxuICAgICAgICAgICAgICAgLy9Cb29sZWFuIC0gV2hldGhlciB0aGUgc2NhbGUgc2hvdWxkIHN0YXJ0IGF0IHplcm8sIG9yIGFuIG9yZGVyIG9mIG1hZ25pdHVkZSBkb3duIGZyb20gdGhlIGxvd2VzdCB2YWx1ZVxuICAgICAgICAgICAgICAgc2NhbGVCZWdpbkF0WmVybzogdHJ1ZSxcblxuICAgICAgICAgICAgICAgLy9Cb29sZWFuIC0gV2hldGhlciBncmlkIGxpbmVzIGFyZSBzaG93biBhY3Jvc3MgdGhlIGNoYXJ0XG4gICAgICAgICAgICAgICBzY2FsZVNob3dHcmlkTGluZXM6IHRydWUsXG5cbiAgICAgICAgICAgICAgIC8vU3RyaW5nIC0gQ29sb3VyIG9mIHRoZSBncmlkIGxpbmVzXG4gICAgICAgICAgICAgICBzY2FsZUdyaWRMaW5lQ29sb3I6IFwicmdiYSgwLDAsMCwuMDUpXCIsXG5cbiAgICAgICAgICAgICAgIC8vTnVtYmVyIC0gV2lkdGggb2YgdGhlIGdyaWQgbGluZXNcbiAgICAgICAgICAgICAgIHNjYWxlR3JpZExpbmVXaWR0aDogMSxcblxuICAgICAgICAgICAgICAgLy9Cb29sZWFuIC0gSWYgdGhlcmUgaXMgYSBzdHJva2Ugb24gZWFjaCBiYXJcbiAgICAgICAgICAgICAgIGJhclNob3dTdHJva2U6IHRydWUsXG5cbiAgICAgICAgICAgICAgIC8vTnVtYmVyIC0gUGl4ZWwgd2lkdGggb2YgdGhlIGJhciBzdHJva2VcbiAgICAgICAgICAgICAgIGJhclN0cm9rZVdpZHRoOiAyLFxuXG4gICAgICAgICAgICAgICAvL051bWJlciAtIFNwYWNpbmcgYmV0d2VlbiBlYWNoIG9mIHRoZSBYIHZhbHVlIHNldHNcbiAgICAgICAgICAgICAgIGJhclZhbHVlU3BhY2luZzogNSxcblxuICAgICAgICAgICAgICAgLy9OdW1iZXIgLSBTcGFjaW5nIGJldHdlZW4gZGF0YSBzZXRzIHdpdGhpbiBYIHZhbHVlc1xuICAgICAgICAgICAgICAgYmFyRGF0YXNldFNwYWNpbmc6IDEsXG5cbiAgICAgICAgICAgICAgIC8vU3RyaW5nIC0gQSBsZWdlbmQgdGVtcGxhdGVcbiAgICAgICAgICAgICAgIGxlZ2VuZFRlbXBsYXRlOiAnPHVsIGNsYXNzPVwidGMtY2hhcnQtanMtbGVnZW5kXCI+PCUgZm9yICh2YXIgaT0wOyBpPGRhdGFzZXRzLmxlbmd0aDsgaSsrKXslPjxsaT48c3BhbiBzdHlsZT1cImJhY2tncm91bmQtY29sb3I6PCU9ZGF0YXNldHNbaV0uZmlsbENvbG9yJT5cIj48L3NwYW4+PCVpZihkYXRhc2V0c1tpXS5sYWJlbCl7JT48JT1kYXRhc2V0c1tpXS5sYWJlbCU+PCV9JT48L2xpPjwlfSU+PC91bD4nXG4gICAgICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgICRzY29wZS5wcmVwYXJlQmFyR3JhcGhBZ2FpbnN0VGVhbSA9IGZ1bmN0aW9uIChjZW50dXJ5QWdhaW5zdFRlYW1zKXtcbiAgICAgICAgdmFyIGFnYWluc3RGb3JDZW50dXJpZXMgPSBbXVxuICAgICAgICB2YXIgbnVtYmVyT2ZDZW50dXJpZXMgPSBbXVxuICAgICAgICBmb3IodmFyIGNlbnR1cnlLZXkgaW4gY2VudHVyeUFnYWluc3RUZWFtcykge1xuICAgICAgICAgIGlmKGNlbnR1cnlBZ2FpbnN0VGVhbXMuaGFzT3duUHJvcGVydHkoY2VudHVyeUtleSkpIHtcbiAgICAgICAgICAgIGFnYWluc3RGb3JDZW50dXJpZXMucHVzaChjZW50dXJ5S2V5KTtcbiAgICAgICAgICAgIG51bWJlck9mQ2VudHVyaWVzLnB1c2goY2VudHVyeUFnYWluc3RUZWFtc1tjZW50dXJ5S2V5XS5sZW5ndGgpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgICRzY29wZS5iYXJkYXRhQWdhaW5zdFRlYW0gPSB7XG4gICAgICAgICAgICAgICBsYWJlbHM6IGFnYWluc3RGb3JDZW50dXJpZXMsXG4gICAgICAgICAgICAgICBkYXRhc2V0czogW3tcbiAgICAgICAgICAgICAgICAgICBsYWJlbDogJ0NlbnR1cmllcycsXG4gICAgICAgICAgICAgICAgICAgZmlsbENvbG9yOiBbJ2JsdWUnXSxcbiAgICAgICAgICAgICAgICAgICBzdHJva2VDb2xvcjogJ3JnYmEoMjIwLDIyMCwyMjAsMSknLFxuICAgICAgICAgICAgICAgICAgIHBvaW50Q29sb3I6ICdyZ2JhKDIyMCwyMjAsMjIwLDEpJyxcbiAgICAgICAgICAgICAgICAgICBwb2ludFN0cm9rZUNvbG9yOiAnI2ZmZicsXG4gICAgICAgICAgICAgICAgICAgcG9pbnRIaWdobGlnaHRGaWxsOiAnI2ZmZicsXG4gICAgICAgICAgICAgICAgICAgcG9pbnRIaWdobGlnaHRTdHJva2U6ICdyZ2JhKDIyMCwyMjAsMjIwLDEpJyxcbiAgICAgICAgICAgICAgICAgICBkYXRhOiBudW1iZXJPZkNlbnR1cmllc1xuICAgICAgICAgICAgICAgfV1cbiAgICAgICAgICAgfTtcblxuICAgICAgICAgICAvLyBDaGFydC5qcyBPcHRpb25zXG4gICAgICAgICAgICRzY29wZS5iYXJvcHRpb25zQWdhaW5zdFRlYW0gPSB7XG5cbiAgICAgICAgICAgICAgIC8vIFNldHMgdGhlIGNoYXJ0IHRvIGJlIHJlc3BvbnNpdmVcbiAgICAgICAgICAgICAgIHJlc3BvbnNpdmU6IHRydWUsXG5cbiAgICAgICAgICAgICAgIC8vQm9vbGVhbiAtIFdoZXRoZXIgdGhlIHNjYWxlIHNob3VsZCBzdGFydCBhdCB6ZXJvLCBvciBhbiBvcmRlciBvZiBtYWduaXR1ZGUgZG93biBmcm9tIHRoZSBsb3dlc3QgdmFsdWVcbiAgICAgICAgICAgICAgIHNjYWxlQmVnaW5BdFplcm86IHRydWUsXG5cbiAgICAgICAgICAgICAgIC8vQm9vbGVhbiAtIFdoZXRoZXIgZ3JpZCBsaW5lcyBhcmUgc2hvd24gYWNyb3NzIHRoZSBjaGFydFxuICAgICAgICAgICAgICAgc2NhbGVTaG93R3JpZExpbmVzOiB0cnVlLFxuXG4gICAgICAgICAgICAgICAvL1N0cmluZyAtIENvbG91ciBvZiB0aGUgZ3JpZCBsaW5lc1xuICAgICAgICAgICAgICAgc2NhbGVHcmlkTGluZUNvbG9yOiBcInJnYmEoMCwwLDAsLjA1KVwiLFxuXG4gICAgICAgICAgICAgICAvL051bWJlciAtIFdpZHRoIG9mIHRoZSBncmlkIGxpbmVzXG4gICAgICAgICAgICAgICBzY2FsZUdyaWRMaW5lV2lkdGg6IDEsXG5cbiAgICAgICAgICAgICAgIC8vQm9vbGVhbiAtIElmIHRoZXJlIGlzIGEgc3Ryb2tlIG9uIGVhY2ggYmFyXG4gICAgICAgICAgICAgICBiYXJTaG93U3Ryb2tlOiB0cnVlLFxuXG4gICAgICAgICAgICAgICAvL051bWJlciAtIFBpeGVsIHdpZHRoIG9mIHRoZSBiYXIgc3Ryb2tlXG4gICAgICAgICAgICAgICBiYXJTdHJva2VXaWR0aDogMixcblxuICAgICAgICAgICAgICAgLy9OdW1iZXIgLSBTcGFjaW5nIGJldHdlZW4gZWFjaCBvZiB0aGUgWCB2YWx1ZSBzZXRzXG4gICAgICAgICAgICAgICBiYXJWYWx1ZVNwYWNpbmc6IDUsXG5cbiAgICAgICAgICAgICAgIC8vTnVtYmVyIC0gU3BhY2luZyBiZXR3ZWVuIGRhdGEgc2V0cyB3aXRoaW4gWCB2YWx1ZXNcbiAgICAgICAgICAgICAgIGJhckRhdGFzZXRTcGFjaW5nOiAxLFxuXG4gICAgICAgICAgICAgICAvL1N0cmluZyAtIEEgbGVnZW5kIHRlbXBsYXRlXG4gICAgICAgICAgICAgICBsZWdlbmRUZW1wbGF0ZTogJzx1bCBjbGFzcz1cInRjLWNoYXJ0LWpzLWxlZ2VuZFwiPjwlIGZvciAodmFyIGk9MDsgaTxkYXRhc2V0cy5sZW5ndGg7IGkrKyl7JT48bGk+PHNwYW4gc3R5bGU9XCJiYWNrZ3JvdW5kLWNvbG9yOjwlPWRhdGFzZXRzW2ldLmZpbGxDb2xvciU+XCI+PC9zcGFuPjwlaWYoZGF0YXNldHNbaV0ubGFiZWwpeyU+PCU9ZGF0YXNldHNbaV0ubGFiZWwlPjwlfSU+PC9saT48JX0lPjwvdWw+J1xuICAgICAgICAgICB9O1xuICAgICAgfVxuXG5cbiAgICAgICRzY29wZS5wcmVwYXJlTGluZUdyYXBoID0gZnVuY3Rpb24oY2VudHVyeUJ5WWVhcixoYWxmQ2VudHVyeUJ5WWVhcil7XG4gICAgICAgICAgdmFyIHllYXJPZmNlbnR1cmllcyA9IFtdXG4gICAgICAgICAgdmFyIG51bWJlck9mQ2VudHVyaWVzID0gW11cblxuICAgICAgICAgIGZvcih2YXIgY2VudHVyeSBpbiBjZW50dXJ5QnlZZWFyKSB7XG4gICAgICAgICAgICBpZihjZW50dXJ5QnlZZWFyLmhhc093blByb3BlcnR5KGNlbnR1cnkpKSB7XG4gICAgICAgICAgICAgIHllYXJPZmNlbnR1cmllcy5wdXNoKGNlbnR1cnkpO1xuICAgICAgICAgICAgICBudW1iZXJPZkNlbnR1cmllcy5wdXNoKGNlbnR1cnlCeVllYXJbY2VudHVyeV0ubGVuZ3RoKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgeWVhck9maGFsZkNlbnR1cmllcyA9IFtdXG4gICAgICAgICAgdmFyIG51bWJlck9mSGFsZkNlbnR1cmllcyA9IFtdXG5cbiAgICAgICAgICBmb3IodmFyIGhhbGZDZW50dXJ5IGluIGhhbGZDZW50dXJ5QnlZZWFyKSB7XG4gICAgICAgICAgICBpZihjZW50dXJ5QnlZZWFyLmhhc093blByb3BlcnR5KGhhbGZDZW50dXJ5KSkge1xuICAgICAgICAgICAgICB5ZWFyT2ZoYWxmQ2VudHVyaWVzLnB1c2goaGFsZkNlbnR1cnkpO1xuICAgICAgICAgICAgICBudW1iZXJPZkhhbGZDZW50dXJpZXMucHVzaChoYWxmQ2VudHVyeUJ5WWVhcltoYWxmQ2VudHVyeV0ubGVuZ3RoKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICAkc2NvcGUubGluZURhdGEgPSB7XG4gICAgICAgICAgbGFiZWxzOiB5ZWFyT2ZoYWxmQ2VudHVyaWVzLFxuICAgICAgICAgIGRhdGFzZXRzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGxhYmVsOiAnTXkgRmlyc3QgZGF0YXNldCcsXG4gICAgICAgICAgICAgIGZpbGxDb2xvcjogWydyZ2JhKDEyMCwyMCwyMjAsMC40KSddLFxuICAgICAgICAgICAgICBzdHJva2VDb2xvcjogJ3JnYmEoMjIwLDIyMCwyMjAsMSknLFxuICAgICAgICAgICAgICBwb2ludENvbG9yOiAncmdiYSgyMjAsMjIwLDIyMCwxKScsXG4gICAgICAgICAgICAgIHBvaW50U3Ryb2tlQ29sb3I6ICcjZmZmJyxcbiAgICAgICAgICAgICAgcG9pbnRIaWdobGlnaHRGaWxsOiAnI2ZmZicsXG4gICAgICAgICAgICAgIHBvaW50SGlnaGxpZ2h0U3Ryb2tlOiAncmdiYSgyMjAsMjIwLDIyMCwxKScsXG4gICAgICAgICAgICAgIGRhdGE6IG51bWJlck9mSGFsZkNlbnR1cmllc1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgbGFiZWw6ICdNeSBGaXJzdCBkYXRhc2V0JyxcbiAgICAgICAgICAgICAgZmlsbENvbG9yOiBbJ3JnYmEoMjIwLDIyMCwyMjAsMC42KSddLFxuICAgICAgICAgICAgICBzdHJva2VDb2xvcjogJ3JnYmEoMjIwLDIyMCwyMjAsMSknLFxuICAgICAgICAgICAgICBwb2ludENvbG9yOiAncmdiYSgyMjAsMjIwLDIyMCwxKScsXG4gICAgICAgICAgICAgIHBvaW50U3Ryb2tlQ29sb3I6ICcjZmZmJyxcbiAgICAgICAgICAgICAgcG9pbnRIaWdobGlnaHRGaWxsOiAnI2ZmZicsXG4gICAgICAgICAgICAgIHBvaW50SGlnaGxpZ2h0U3Ryb2tlOiAncmdiYSgyMjAsMjIwLDIyMCwxKScsXG4gICAgICAgICAgICAgIGRhdGE6IG51bWJlck9mQ2VudHVyaWVzXG4gICAgICAgICAgICB9XG4gICAgICAgICAgXVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIENoYXJ0LmpzIE9wdGlvbnNcbiAgICAgICAgJHNjb3BlLmxpbmVPcHRpb25zID0gIHtcblxuICAgICAgICAgIC8vIFNldHMgdGhlIGNoYXJ0IHRvIGJlIHJlc3BvbnNpdmVcbiAgICAgICAgICByZXNwb25zaXZlOiB0cnVlLFxuXG4gICAgICAgICAgLy8vQm9vbGVhbiAtIFdoZXRoZXIgZ3JpZCBsaW5lcyBhcmUgc2hvd24gYWNyb3NzIHRoZSBjaGFydFxuICAgICAgICAgIHNjYWxlU2hvd0dyaWRMaW5lcyA6IHRydWUsXG5cbiAgICAgICAgICAvL1N0cmluZyAtIENvbG91ciBvZiB0aGUgZ3JpZCBsaW5lc1xuICAgICAgICAgIHNjYWxlR3JpZExpbmVDb2xvciA6IFwicmdiYSgwLDAsMCwuMDUpXCIsXG5cbiAgICAgICAgICAvL051bWJlciAtIFdpZHRoIG9mIHRoZSBncmlkIGxpbmVzXG4gICAgICAgICAgc2NhbGVHcmlkTGluZVdpZHRoIDogMSxcblxuICAgICAgICAgIC8vQm9vbGVhbiAtIFdoZXRoZXIgdGhlIGxpbmUgaXMgY3VydmVkIGJldHdlZW4gcG9pbnRzXG4gICAgICAgICAgYmV6aWVyQ3VydmUgOiB0cnVlLFxuXG4gICAgICAgICAgLy9OdW1iZXIgLSBUZW5zaW9uIG9mIHRoZSBiZXppZXIgY3VydmUgYmV0d2VlbiBwb2ludHNcbiAgICAgICAgICBiZXppZXJDdXJ2ZVRlbnNpb24gOiAwLjQsXG5cbiAgICAgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIHRvIHNob3cgYSBkb3QgZm9yIGVhY2ggcG9pbnRcbiAgICAgICAgICBwb2ludERvdCA6IHRydWUsXG5cbiAgICAgICAgICAvL051bWJlciAtIFJhZGl1cyBvZiBlYWNoIHBvaW50IGRvdCBpbiBwaXhlbHNcbiAgICAgICAgICBwb2ludERvdFJhZGl1cyA6IDQsXG5cbiAgICAgICAgICAvL051bWJlciAtIFBpeGVsIHdpZHRoIG9mIHBvaW50IGRvdCBzdHJva2VcbiAgICAgICAgICBwb2ludERvdFN0cm9rZVdpZHRoIDogMSxcblxuICAgICAgICAgIC8vTnVtYmVyIC0gYW1vdW50IGV4dHJhIHRvIGFkZCB0byB0aGUgcmFkaXVzIHRvIGNhdGVyIGZvciBoaXQgZGV0ZWN0aW9uIG91dHNpZGUgdGhlIGRyYXduIHBvaW50XG4gICAgICAgICAgcG9pbnRIaXREZXRlY3Rpb25SYWRpdXMgOiAyMCxcblxuICAgICAgICAgIC8vQm9vbGVhbiAtIFdoZXRoZXIgdG8gc2hvdyBhIHN0cm9rZSBmb3IgZGF0YXNldHNcbiAgICAgICAgICBkYXRhc2V0U3Ryb2tlIDogdHJ1ZSxcblxuICAgICAgICAgIC8vTnVtYmVyIC0gUGl4ZWwgd2lkdGggb2YgZGF0YXNldCBzdHJva2VcbiAgICAgICAgICBkYXRhc2V0U3Ryb2tlV2lkdGggOiAyLFxuXG4gICAgICAgICAgLy9Cb29sZWFuIC0gV2hldGhlciB0byBmaWxsIHRoZSBkYXRhc2V0IHdpdGggYSBjb2xvdXJcbiAgICAgICAgICBkYXRhc2V0RmlsbCA6IHRydWUsXG5cbiAgICAgICAgICAvLyBGdW5jdGlvbiAtIG9uIGFuaW1hdGlvbiBwcm9ncmVzc1xuICAgICAgICAgIG9uQW5pbWF0aW9uUHJvZ3Jlc3M6IGZ1bmN0aW9uKCl7fSxcblxuICAgICAgICAgIC8vIEZ1bmN0aW9uIC0gb24gYW5pbWF0aW9uIGNvbXBsZXRlXG4gICAgICAgICAgb25BbmltYXRpb25Db21wbGV0ZTogZnVuY3Rpb24oKXt9LFxuXG4gICAgICAgICAgLy9TdHJpbmcgLSBBIGxlZ2VuZCB0ZW1wbGF0ZVxuICAgICAgICAgIGxlZ2VuZFRlbXBsYXRlIDogJzx1bCBjbGFzcz1cInRjLWNoYXJ0LWpzLWxlZ2VuZFwiPjwlIGZvciAodmFyIGk9MDsgaTxkYXRhc2V0cy5sZW5ndGg7IGkrKyl7JT48bGk+PHNwYW4gc3R5bGU9XCJiYWNrZ3JvdW5kLWNvbG9yOjwlPWRhdGFzZXRzW2ldLnN0cm9rZUNvbG9yJT5cIj48L3NwYW4+PCVpZihkYXRhc2V0c1tpXS5sYWJlbCl7JT48JT1kYXRhc2V0c1tpXS5sYWJlbCU+PCV9JT48L2xpPjwlfSU+PC91bD4nXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICAkc2NvcGUucHJlcGFyZURvdWdobnV0Q2hhcnQgPSBmdW5jdGlvbih3b24sIGxvc3QsIHRpZWQsIG5vcmVzdWx0KXtcbiAgICAgICAgJHNjb3BlLnJlc291cmNlcyA9IFt7XG4gICAgICAgICAgICAgICB2YWx1ZTogd29uLFxuICAgICAgICAgICAgICAgY29sb3I6ICcjRkZGRjAwJyxcbiAgICAgICAgICAgICAgIGhpZ2hsaWdodDogJyNlNWU1MDAnLFxuICAgICAgICAgICAgICAgbGFiZWw6ICdXaW4nXG4gICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgIHZhbHVlOiBsb3N0LFxuICAgICAgICAgICAgICAgY29sb3I6ICcjNDZCRkJEJyxcbiAgICAgICAgICAgICAgIGhpZ2hsaWdodDogJyM1QUQzRDEnLFxuICAgICAgICAgICAgICAgbGFiZWw6ICdMb3NzJ1xuICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICB2YWx1ZTogdGllZCxcbiAgICAgICAgICAgICAgIGNvbG9yOiAnI0Y3NDY0QScsXG4gICAgICAgICAgICAgICBoaWdobGlnaHQ6ICcjRkY1QTVFJyxcbiAgICAgICAgICAgICAgIGxhYmVsOiAnVGllJ1xuICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICB2YWx1ZTogbm9yZXN1bHQsXG4gICAgICAgICAgICAgICBjb2xvcjogJyNGNzQ2NEEnLFxuICAgICAgICAgICAgICAgaGlnaGxpZ2h0OiAnI0VGNUE1RScsXG4gICAgICAgICAgICAgICBsYWJlbDogJ05vIFJlc3VsdCdcbiAgICAgICAgICAgfVxuICAgICAgICAgXTtcblxuICAgICAgICAgICAvLyBDaGFydC5qcyBPcHRpb25zXG4gICAgICAgICAgICRzY29wZS5vcHRpb25zID0ge1xuXG4gICAgICAgICAgICAgICAvLyBTZXRzIHRoZSBjaGFydCB0byBiZSByZXNwb25zaXZlXG4gICAgICAgICAgICAgICByZXNwb25zaXZlOiB0cnVlLFxuXG4gICAgICAgICAgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIHdlIHNob3VsZCBzaG93IGEgc3Ryb2tlIG9uIGVhY2ggc2VnbWVudFxuICAgICAgICAgICAgICAgc2VnbWVudFNob3dTdHJva2U6IHRydWUsXG5cbiAgICAgICAgICAgICAgIC8vU3RyaW5nIC0gVGhlIGNvbG91ciBvZiBlYWNoIHNlZ21lbnQgc3Ryb2tlXG4gICAgICAgICAgICAgICBzZWdtZW50U3Ryb2tlQ29sb3I6ICcjZmZmJyxcblxuICAgICAgICAgICAgICAgLy9OdW1iZXIgLSBUaGUgd2lkdGggb2YgZWFjaCBzZWdtZW50IHN0cm9rZVxuICAgICAgICAgICAgICAgc2VnbWVudFN0cm9rZVdpZHRoOiAyLFxuXG4gICAgICAgICAgICAgICAvL051bWJlciAtIFRoZSBwZXJjZW50YWdlIG9mIHRoZSBjaGFydCB0aGF0IHdlIGN1dCBvdXQgb2YgdGhlIG1pZGRsZVxuICAgICAgICAgICAgICAgcGVyY2VudGFnZUlubmVyQ3V0b3V0OiA1MCwgLy8gVGhpcyBpcyAwIGZvciBQaWUgY2hhcnRzXG5cbiAgICAgICAgICAgICAgIC8vTnVtYmVyIC0gQW1vdW50IG9mIGFuaW1hdGlvbiBzdGVwc1xuICAgICAgICAgICAgICAgYW5pbWF0aW9uU3RlcHM6IDEwMCxcblxuICAgICAgICAgICAgICAgLy9TdHJpbmcgLSBBbmltYXRpb24gZWFzaW5nIGVmZmVjdFxuICAgICAgICAgICAgICAgYW5pbWF0aW9uRWFzaW5nOiAnZWFzZU91dEJvdW5jZScsXG5cbiAgICAgICAgICAgICAgIC8vQm9vbGVhbiAtIFdoZXRoZXIgd2UgYW5pbWF0ZSB0aGUgcm90YXRpb24gb2YgdGhlIERvdWdobnV0XG4gICAgICAgICAgICAgICBhbmltYXRlUm90YXRlOiB0cnVlLFxuXG4gICAgICAgICAgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIHdlIGFuaW1hdGUgc2NhbGluZyB0aGUgRG91Z2hudXQgZnJvbSB0aGUgY2VudHJlXG4gICAgICAgICAgICAgICBhbmltYXRlU2NhbGU6IGZhbHNlLFxuXG4gICAgICAgICAgICAgICAvL1N0cmluZyAtIEEgbGVnZW5kIHRlbXBsYXRlXG4gICAgICAgICAgICAgICBsZWdlbmRUZW1wbGF0ZTogJzx1bCBjbGFzcz1cInRjLWNoYXJ0LWpzLWxlZ2VuZFwiPjwlIGZvciAodmFyIGk9MDsgaTxzZWdtZW50cy5sZW5ndGg7IGkrKyl7JT48bGk+PHNwYW4gc3R5bGU9XCJiYWNrZ3JvdW5kLWNvbG9yOjwlPXNlZ21lbnRzW2ldLmZpbGxDb2xvciU+XCI+PC9zcGFuPjwlaWYoc2VnbWVudHNbaV0ubGFiZWwpeyU+PCU9c2VnbWVudHNbaV0ubGFiZWwlPjwlfSU+PC9saT48JX0lPjwvdWw+J1xuXG4gICAgICAgICAgIH07XG5cbiAgICAgIH1cblxuICAgICAgJHNjb3BlLnByZXBhcmVDb252ZXJzaW9uUmF0ZVBpZUNoYXJ0ID0gZnVuY3Rpb24oZmlmdHksaHVuZHJlZCl7XG4gICAgICAgICAgICAkc2NvcGUuY29udmVyc2lvbkRhdGEgPSBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgdmFsdWU6IGZpZnR5LFxuICAgICAgICAgICAgY29sb3I6JyNGNzQ2NEEnLFxuICAgICAgICAgICAgaGlnaGxpZ2h0OiAnI0ZGNUE1RScsXG4gICAgICAgICAgICBsYWJlbDogJ0hhbGYgQ2VudHVyaWVzJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgdmFsdWU6IGh1bmRyZWQsXG4gICAgICAgICAgICBjb2xvcjogJyNGREI0NUMnLFxuICAgICAgICAgICAgaGlnaGxpZ2h0OiAnI0ZGQzg3MCcsXG4gICAgICAgICAgICBsYWJlbDogJ0NlbnR1cmllcydcbiAgICAgICAgICB9XG4gICAgICAgIF07XG5cbiAgICAgICAgLy8gQ2hhcnQuanMgT3B0aW9uc1xuICAgICAgICAkc2NvcGUuY29udmVyc2lvbk9wdGlvbnMgPSAge1xuXG4gICAgICAgICAgLy8gU2V0cyB0aGUgY2hhcnQgdG8gYmUgcmVzcG9uc2l2ZVxuICAgICAgICAgIHJlc3BvbnNpdmU6IHRydWUsXG5cbiAgICAgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIHdlIHNob3VsZCBzaG93IGEgc3Ryb2tlIG9uIGVhY2ggc2VnbWVudFxuICAgICAgICAgIHNlZ21lbnRTaG93U3Ryb2tlIDogdHJ1ZSxcblxuICAgICAgICAgIC8vU3RyaW5nIC0gVGhlIGNvbG91ciBvZiBlYWNoIHNlZ21lbnQgc3Ryb2tlXG4gICAgICAgICAgc2VnbWVudFN0cm9rZUNvbG9yIDogJyNmZmYnLFxuXG4gICAgICAgICAgLy9OdW1iZXIgLSBUaGUgd2lkdGggb2YgZWFjaCBzZWdtZW50IHN0cm9rZVxuICAgICAgICAgIHNlZ21lbnRTdHJva2VXaWR0aCA6IDIsXG5cbiAgICAgICAgICAvL051bWJlciAtIFRoZSBwZXJjZW50YWdlIG9mIHRoZSBjaGFydCB0aGF0IHdlIGN1dCBvdXQgb2YgdGhlIG1pZGRsZVxuICAgICAgICAgIHBlcmNlbnRhZ2VJbm5lckN1dG91dCA6IDAsIC8vIFRoaXMgaXMgMCBmb3IgUGllIGNoYXJ0c1xuXG4gICAgICAgICAgLy9OdW1iZXIgLSBBbW91bnQgb2YgYW5pbWF0aW9uIHN0ZXBzXG4gICAgICAgICAgYW5pbWF0aW9uU3RlcHMgOiAxMDAsXG5cbiAgICAgICAgICAvL1N0cmluZyAtIEFuaW1hdGlvbiBlYXNpbmcgZWZmZWN0XG4gICAgICAgICAgYW5pbWF0aW9uRWFzaW5nIDogJ2Vhc2VPdXRCb3VuY2UnLFxuXG4gICAgICAgICAgLy9Cb29sZWFuIC0gV2hldGhlciB3ZSBhbmltYXRlIHRoZSByb3RhdGlvbiBvZiB0aGUgRG91Z2hudXRcbiAgICAgICAgICBhbmltYXRlUm90YXRlIDogdHJ1ZSxcblxuICAgICAgICAgIC8vQm9vbGVhbiAtIFdoZXRoZXIgd2UgYW5pbWF0ZSBzY2FsaW5nIHRoZSBEb3VnaG51dCBmcm9tIHRoZSBjZW50cmVcbiAgICAgICAgICBhbmltYXRlU2NhbGUgOiBmYWxzZSxcblxuICAgICAgICAgIC8vU3RyaW5nIC0gQSBsZWdlbmQgdGVtcGxhdGVcbiAgICAgICAgICBsZWdlbmRUZW1wbGF0ZSA6ICc8dWwgY2xhc3M9XCJ0Yy1jaGFydC1qcy1sZWdlbmRcIj48JSBmb3IgKHZhciBpPTA7IGk8c2VnbWVudHMubGVuZ3RoOyBpKyspeyU+PGxpPjxzcGFuIHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjo8JT1zZWdtZW50c1tpXS5maWxsQ29sb3IlPlwiPjwvc3Bhbj48JWlmKHNlZ21lbnRzW2ldLmxhYmVsKXslPjwlPXNlZ21lbnRzW2ldLmxhYmVsJT48JX0lPjwvbGk+PCV9JT48L3VsPidcblxuICAgICAgICB9O1xuICAgICAgfVxuXG5cbiAgICB9KVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
