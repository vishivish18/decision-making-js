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
                  secondInningsNotouts++;
                }else{
                  firstInningsNotouts++;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZHVsZS5qcyIsImNvbnRyb2xsZXJzL2hvbWVDdHJsLmpzIiwiY29udHJvbGxlcnMvbWFzdGVyQ3RybC5qcyIsImNvbnRyb2xsZXJzL3JvdXRlcy5qcyIsInNlcnZpY2VzL2RhdGFNdXRhdG9yLmpzIiwiZGlyZWN0aXZlcy9jYXJlZXJTdGF0cy5qcyIsImRpcmVjdGl2ZXMvY2VudHVyeVN0YXRzLmpzIiwiZGlyZWN0aXZlcy9wZXJzb25hbEluZm8uanMiLCJkaXJlY3RpdmVzL3J1bnNTdGF0cy5qcyIsImNvbnRyb2xsZXJzL3BhcnRpYWxzL2NlbnR1cnlTdGF0c0N0cmwuanMiLCJjb250cm9sbGVycy9wYXJ0aWFscy9ydW5zU3RhdHNDdHJsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFFBQUEsT0FBQSxNQUFBO0VBQ0EsVUFBQSxZQUFBOzs7QUNEQSxRQUFBLE9BQUE7S0FDQSxXQUFBLCtDQUFBLFNBQUEsUUFBQSxPQUFBLGFBQUE7UUFDQSxPQUFBLFFBQUEsV0FBQTtVQUNBLFlBQUE7V0FDQSxLQUFBLFNBQUEsVUFBQTtnQkFDQSxZQUFBLFVBQUEsU0FBQSxNQUFBLFNBQUEsS0FBQTtvQkFDQSxZQUFBLGVBQUEsTUFBQSxTQUFBLE1BQUE7c0JBQ0EsUUFBQSxJQUFBO3NCQUNBLE9BQUEsUUFBQTs7O2FBR0EsU0FBQSxLQUFBO2dCQUNBLFFBQUEsSUFBQTs7O1FBR0EsT0FBQTs7O0FDZkEsUUFBQSxPQUFBO0tBQ0EsV0FBQSx1Q0FBQSxTQUFBLFFBQUEsWUFBQTtRQUNBLFFBQUEsSUFBQTs7O0FDRkEsUUFBQSxPQUFBO0tBQ0EscUVBQUEsU0FBQSxnQkFBQSxvQkFBQSxtQkFBQTs7UUFFQSxtQkFBQSxVQUFBOztRQUVBO2FBQ0EsTUFBQSxPQUFBO2dCQUNBLEtBQUE7Z0JBQ0EsT0FBQTtvQkFDQSxVQUFBO3dCQUNBLGFBQUE7O29CQUVBLFdBQUE7d0JBQ0EsYUFBQTt3QkFDQSxZQUFBOzs7Ozs7O1NBT0EsTUFBQSxZQUFBO1lBQ0EsS0FBQTtZQUNBLE9BQUE7Z0JBQ0EsWUFBQTtvQkFDQSxhQUFBO29CQUNBLFlBQUE7Ozs7Ozs7OztRQVNBLGtCQUFBLFVBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDUEEsUUFBQSxPQUFBO0tBQ0EsUUFBQSx5QkFBQSxTQUFBLE9BQUE7UUFDQSxNQUFBO1lBQ0EsU0FBQTtZQUNBLFdBQUE7WUFDQSxnQkFBQTs7OztRQUlBLFNBQUEsVUFBQTtZQUNBLE9BQUEsTUFBQSxJQUFBOzs7UUFHQSxTQUFBLFVBQUEsS0FBQSxVQUFBO1lBQ0EsSUFBQSxNQUFBLElBQUEsTUFBQTtZQUNBLElBQUEsU0FBQTtZQUNBLElBQUEsUUFBQSxNQUFBLEdBQUEsTUFBQTtZQUNBLElBQUEsSUFBQSxFQUFBLEVBQUEsRUFBQSxNQUFBLFFBQUEsRUFBQSxJQUFBO2dCQUNBLElBQUEsTUFBQTtnQkFDQSxJQUFBLFlBQUEsTUFBQSxHQUFBLE1BQUE7Z0JBQ0EsSUFBQSxJQUFBLEVBQUEsRUFBQSxFQUFBLFFBQUEsT0FBQSxJQUFBO2tCQUNBLElBQUEsUUFBQSxNQUFBLFlBQUE7O2dCQUVBLE9BQUEsS0FBQTs7WUFFQSxRQUFBLElBQUE7WUFDQSxHQUFBLGFBQUEsT0FBQSxhQUFBLGFBQUE7Z0JBQ0EsT0FBQSxTQUFBOztVQUVBLE9BQUE7OztRQUdBLFNBQUEsZUFBQSxNQUFBLFVBQUE7WUFDQSxJQUFBLGVBQUEsS0FBQTtZQUNBLElBQUEsWUFBQTtZQUNBLElBQUEsa0JBQUE7WUFDQSxJQUFBLHNCQUFBO1lBQ0EsSUFBQSxhQUFBO1lBQ0EsSUFBQSxVQUFBO1lBQ0EsSUFBQSxZQUFBO1lBQ0EsSUFBQSxlQUFBO1lBQ0EsSUFBQSxlQUFBO1lBQ0EsSUFBQSxVQUFBO1lBQ0EsSUFBQSxzQkFBQTtZQUNBLElBQUEsdUJBQUE7WUFDQSxRQUFBLFFBQUEsTUFBQSxTQUFBLE9BQUE7Y0FDQSxJQUFBLGdCQUFBO2NBQ0EsSUFBQSxnQkFBQTtjQUNBLElBQUEsb0JBQUE7Ozs7O2NBS0EsR0FBQSxNQUFBLGNBQUEsUUFBQSxPQUFBLENBQUEsRUFBQTtnQkFDQSxHQUFBLE1BQUEsbUJBQUEsTUFBQTtrQkFDQTtxQkFDQTtrQkFDQTs7Z0JBRUEsTUFBQSxnQkFBQSxNQUFBLGNBQUEsUUFBQSxJQUFBO2dCQUNBOzs7Y0FHQSxHQUFBLE1BQUEsTUFBQSxlQUFBO2dCQUNBO21CQUNBOztnQkFFQSxNQUFBLGdCQUFBLFNBQUEsTUFBQTs7Z0JBRUEsY0FBQSxPQUFBLE1BQUE7Z0JBQ0EsY0FBQSxVQUFBLE1BQUE7Z0JBQ0EsY0FBQSxTQUFBLE1BQUE7Z0JBQ0EsY0FBQSxVQUFBLE1BQUE7Z0JBQ0EsY0FBQSxPQUFBLENBQUEsSUFBQSxLQUFBLEtBQUEsTUFBQSxNQUFBLFFBQUE7Z0JBQ0EsV0FBQSxLQUFBOzs7O2dCQUlBLEdBQUEsTUFBQSxpQkFBQSxNQUFBLE1BQUEsZ0JBQUEsSUFBQTtrQkFDQSxrQkFBQSxPQUFBLE1BQUE7a0JBQ0Esa0JBQUEsVUFBQSxNQUFBO2tCQUNBLGtCQUFBLFNBQUEsTUFBQTtrQkFDQSxrQkFBQSxVQUFBLE1BQUE7a0JBQ0Esa0JBQUEsT0FBQSxDQUFBLElBQUEsS0FBQSxLQUFBLE1BQUEsTUFBQSxRQUFBO2tCQUNBLG9CQUFBLEtBQUE7c0JBQ0EsR0FBQSxNQUFBLGlCQUFBLElBQUE7a0JBQ0EsY0FBQSxPQUFBLE1BQUE7a0JBQ0EsY0FBQSxVQUFBLE1BQUE7a0JBQ0EsY0FBQSxTQUFBLE1BQUE7a0JBQ0EsY0FBQSxVQUFBLE1BQUE7a0JBQ0EsY0FBQSxPQUFBLENBQUEsSUFBQSxLQUFBLEtBQUEsTUFBQSxNQUFBLFFBQUE7a0JBQ0EsZ0JBQUEsS0FBQTs7O2dCQUdBLGFBQUEsTUFBQTs7OztjQUlBLEdBQUEsQ0FBQSxNQUFBLE1BQUEsWUFBQSxTQUFBLE1BQUEsV0FBQSxFQUFBO2dCQUNBLE1BQUEsVUFBQSxTQUFBLE1BQUE7Z0JBQ0EsZ0JBQUEsTUFBQTs7Y0FFQSxHQUFBLENBQUEsTUFBQSxNQUFBLFlBQUEsU0FBQSxNQUFBLFdBQUEsRUFBQTtnQkFDQSxNQUFBLFVBQUEsU0FBQSxNQUFBO2dCQUNBLFdBQUEsTUFBQTs7Y0FFQSxHQUFBLENBQUEsTUFBQSxNQUFBLGVBQUE7Z0JBQ0EsTUFBQSxnQkFBQSxTQUFBLE1BQUE7Z0JBQ0EsZ0JBQUEsTUFBQTs7O1VBR0EsUUFBQSxJQUFBO1VBQ0EsUUFBQSxJQUFBOztVQUVBLElBQUEsZUFBQSxlQUFBO1VBQ0EsSUFBQSxRQUFBO1lBQ0EsZUFBQTtZQUNBLFdBQUE7WUFDQSxxQkFBQSxvQkFBQTtZQUNBLGlCQUFBLGdCQUFBO1lBQ0EsZUFBQSxLQUFBLElBQUEsTUFBQSxLQUFBLGdCQUFBLElBQUEsU0FBQSxNQUFBLENBQUEsT0FBQSxNQUFBO1lBQ0EsU0FBQTtZQUNBLGNBQUE7WUFDQSxnQkFBQSxDQUFBLGFBQUEsZUFBQSxVQUFBLFFBQUE7WUFDQSxjQUFBO1lBQ0EsY0FBQTtZQUNBLGdCQUFBLENBQUEsZUFBQSxjQUFBLFFBQUE7WUFDQSxTQUFBO1lBQ0EsY0FBQSxDQUFBLGdCQUFBO1lBQ0EsWUFBQSxDQUFBLFdBQUEsb0JBQUE7O1VBRUEsR0FBQSxhQUFBLE9BQUEsYUFBQSxhQUFBO2NBQ0EsT0FBQSxTQUFBOztVQUVBLE9BQUE7Ozs7OztBQ2xLQSxRQUFBLE9BQUE7S0FDQSxVQUFBLGVBQUEsV0FBQTtRQUNBLE1BQUE7WUFDQSxVQUFBO1lBQ0EsT0FBQTtnQkFDQSxPQUFBOztZQUVBLGFBQUE7Ozs7O0FDUEEsUUFBQSxPQUFBO0tBQ0EsVUFBQSxnQkFBQSxXQUFBO1FBQ0EsTUFBQTtZQUNBLFVBQUE7WUFDQSxPQUFBO2dCQUNBLGNBQUE7O1lBRUEsYUFBQTtZQUNBLFlBQUE7Ozs7QUNSQSxRQUFBLE9BQUE7S0FDQSxVQUFBLGdCQUFBLFdBQUE7UUFDQSxNQUFBO1lBQ0EsVUFBQTtZQUNBLGFBQUE7Ozs7QUNKQSxRQUFBLE9BQUE7S0FDQSxVQUFBLGFBQUEsV0FBQTtRQUNBLE1BQUE7WUFDQSxVQUFBO1lBQ0EsT0FBQTtnQkFDQSxXQUFBOztZQUVBLGFBQUE7WUFDQSxZQUFBOzs7O0FDUkEsUUFBQSxPQUFBO0tBQ0EsV0FBQSwrQkFBQSxTQUFBLFFBQUE7TUFDQSxPQUFBLE9BQUEsV0FBQTthQUNBLE9BQUEsT0FBQTtjQUNBLFNBQUEsR0FBQTtlQUNBLEdBQUEsQ0FBQSxFQUFBO2VBQ0EsT0FBQSxpQkFBQSxPQUFBOzs7TUFHQSxPQUFBLG1CQUFBLFNBQUEsYUFBQTtRQUNBLElBQUEsU0FBQSxFQUFBLE1BQUEsYUFBQSxpQkFBQTtRQUNBLElBQUEsVUFBQSxFQUFBLE1BQUEsYUFBQSxpQkFBQTs7UUFFQSxJQUFBLGVBQUEsYUFBQSxvQkFBQTtRQUNBLElBQUEsZ0JBQUEsYUFBQSxnQkFBQTs7UUFFQSxJQUFBLFNBQUE7UUFDQSxhQUFBLGdCQUFBLElBQUEsU0FBQSxLQUFBLElBQUE7VUFDQSxHQUFBLElBQUEsVUFBQSxNQUFBO1lBQ0EsT0FBQSxPQUFBO2dCQUNBLEdBQUEsSUFBQSxVQUFBLE9BQUE7WUFDQSxPQUFBLE9BQUE7Z0JBQ0EsR0FBQSxJQUFBLFVBQUEsT0FBQTtZQUNBLE9BQUEsT0FBQTtlQUNBO1lBQ0EsT0FBQSxPQUFBOztVQUVBLE9BQUE7O1FBRUEsSUFBQSxNQUFBLEVBQUEsT0FBQSxhQUFBLGlCQUFBLFNBQUEsS0FBQTtVQUNBLE9BQUEsS0FBQSxVQUFBOzs7Ozs7Ozs7Ozs7O1FBYUEsSUFBQSxtQkFBQSxFQUFBLE9BQUEsYUFBQSxpQkFBQSxTQUFBLEtBQUE7VUFDQSxPQUFBLEtBQUEsV0FBQTs7UUFFQSxJQUFBLHNCQUFBLEVBQUEsT0FBQSxrQkFBQSxTQUFBLEtBQUE7VUFDQSxPQUFBLEtBQUEsVUFBQTs7UUFFQSxJQUFBLHVCQUFBLEVBQUEsT0FBQSxrQkFBQSxTQUFBLEtBQUE7VUFDQSxPQUFBLEtBQUEsV0FBQTs7UUFFQSxJQUFBLHVCQUFBLEVBQUEsT0FBQSxrQkFBQSxTQUFBLEtBQUE7VUFDQSxPQUFBLEtBQUEsV0FBQTs7UUFFQSxJQUFBLDJCQUFBLEVBQUEsT0FBQSxrQkFBQSxTQUFBLEtBQUE7VUFDQSxPQUFBLEtBQUEsV0FBQTs7OztRQUlBLElBQUEsc0JBQUE7UUFDQSxhQUFBLGdCQUFBLElBQUEsU0FBQSxJQUFBO1VBQ0EsSUFBQSxPQUFBLElBQUE7VUFDQSxJQUFBLFVBQUE7WUFDQSxPQUFBLElBQUE7O1VBRUEsR0FBQSxPQUFBLG9CQUFBLFVBQUE7a0JBQ0Esb0JBQUEsUUFBQTtVQUNBLE9BQUEsb0JBQUEsTUFBQSxLQUFBOzs7O1FBSUEsSUFBQSxnQkFBQTtRQUNBLGFBQUEsZ0JBQUEsSUFBQSxTQUFBLElBQUE7VUFDQSxJQUFBLE9BQUEsSUFBQTtVQUNBLElBQUEsVUFBQTtZQUNBLE9BQUEsSUFBQTs7VUFFQSxHQUFBLE9BQUEsY0FBQSxVQUFBO2tCQUNBLGNBQUEsUUFBQTtVQUNBLE9BQUEsY0FBQSxNQUFBLEtBQUE7OztRQUdBLElBQUEsb0JBQUE7UUFDQSxhQUFBLG9CQUFBLElBQUEsU0FBQSxJQUFBO1VBQ0EsSUFBQSxPQUFBLElBQUE7VUFDQSxJQUFBLGNBQUE7WUFDQSxPQUFBLElBQUE7O1VBRUEsR0FBQSxPQUFBLGtCQUFBLFVBQUE7a0JBQ0Esa0JBQUEsUUFBQTtVQUNBLE9BQUEsa0JBQUEsTUFBQSxLQUFBOzs7UUFHQSxRQUFBLElBQUEsY0FBQTs7O1FBR0EsT0FBQSxlQUFBLENBQUEsSUFBQSxPQUFBLGFBQUEsZ0JBQUEsUUFBQSxRQUFBLEtBQUE7UUFDQSxPQUFBLGdCQUFBLFFBQUEsU0FBQTtRQUNBLE9BQUEsMkJBQUE7UUFDQSxPQUFBLGlCQUFBLGNBQUE7UUFDQSxPQUFBLHFCQUFBLG9CQUFBLE9BQUEscUJBQUEsT0FBQSxxQkFBQSxPQUFBLHlCQUFBO1FBQ0EsT0FBQSw4QkFBQSxhQUFBOzs7Ozs7Ozs7O01BVUEsT0FBQSxrQkFBQSxVQUFBLE9BQUEsU0FBQSxPQUFBO1FBQ0EsT0FBQSxVQUFBO2VBQ0EsUUFBQTtlQUNBLFVBQUEsQ0FBQTttQkFDQSxPQUFBO21CQUNBLFdBQUE7bUJBQ0EsYUFBQTttQkFDQSxZQUFBO21CQUNBLGtCQUFBO21CQUNBLG9CQUFBO21CQUNBLHNCQUFBO21CQUNBLE1BQUE7Ozs7O1dBS0EsT0FBQSxhQUFBOzs7ZUFHQSxZQUFBOzs7ZUFHQSxrQkFBQTs7O2VBR0Esb0JBQUE7OztlQUdBLG9CQUFBOzs7ZUFHQSxvQkFBQTs7O2VBR0EsZUFBQTs7O2VBR0EsZ0JBQUE7OztlQUdBLGlCQUFBOzs7ZUFHQSxtQkFBQTs7O2VBR0EsZ0JBQUE7Ozs7TUFJQSxPQUFBLDZCQUFBLFVBQUEsb0JBQUE7UUFDQSxJQUFBLHNCQUFBO1FBQ0EsSUFBQSxvQkFBQTtRQUNBLElBQUEsSUFBQSxjQUFBLHFCQUFBO1VBQ0EsR0FBQSxvQkFBQSxlQUFBLGFBQUE7WUFDQSxvQkFBQSxLQUFBO1lBQ0Esa0JBQUEsS0FBQSxvQkFBQSxZQUFBOzs7UUFHQSxPQUFBLHFCQUFBO2VBQ0EsUUFBQTtlQUNBLFVBQUEsQ0FBQTttQkFDQSxPQUFBO21CQUNBLFdBQUEsQ0FBQTttQkFDQSxhQUFBO21CQUNBLFlBQUE7bUJBQ0Esa0JBQUE7bUJBQ0Esb0JBQUE7bUJBQ0Esc0JBQUE7bUJBQ0EsTUFBQTs7Ozs7V0FLQSxPQUFBLHdCQUFBOzs7ZUFHQSxZQUFBOzs7ZUFHQSxrQkFBQTs7O2VBR0Esb0JBQUE7OztlQUdBLG9CQUFBOzs7ZUFHQSxvQkFBQTs7O2VBR0EsZUFBQTs7O2VBR0EsZ0JBQUE7OztlQUdBLGlCQUFBOzs7ZUFHQSxtQkFBQTs7O2VBR0EsZ0JBQUE7Ozs7O01BS0EsT0FBQSxtQkFBQSxTQUFBLGNBQUEsa0JBQUE7VUFDQSxJQUFBLGtCQUFBO1VBQ0EsSUFBQSxvQkFBQTs7VUFFQSxJQUFBLElBQUEsV0FBQSxlQUFBO1lBQ0EsR0FBQSxjQUFBLGVBQUEsVUFBQTtjQUNBLGdCQUFBLEtBQUE7Y0FDQSxrQkFBQSxLQUFBLGNBQUEsU0FBQTs7O1VBR0EsSUFBQSxzQkFBQTtVQUNBLElBQUEsd0JBQUE7O1VBRUEsSUFBQSxJQUFBLGVBQUEsbUJBQUE7WUFDQSxHQUFBLGNBQUEsZUFBQSxjQUFBO2NBQ0Esb0JBQUEsS0FBQTtjQUNBLHNCQUFBLEtBQUEsa0JBQUEsYUFBQTs7O1VBR0EsT0FBQSxXQUFBO1VBQ0EsUUFBQTtVQUNBLFVBQUE7WUFDQTtjQUNBLE9BQUE7Y0FDQSxXQUFBLENBQUE7Y0FDQSxhQUFBO2NBQ0EsWUFBQTtjQUNBLGtCQUFBO2NBQ0Esb0JBQUE7Y0FDQSxzQkFBQTtjQUNBLE1BQUE7O1lBRUE7Y0FDQSxPQUFBO2NBQ0EsV0FBQSxDQUFBO2NBQ0EsYUFBQTtjQUNBLFlBQUE7Y0FDQSxrQkFBQTtjQUNBLG9CQUFBO2NBQ0Esc0JBQUE7Y0FDQSxNQUFBOzs7Ozs7UUFNQSxPQUFBLGVBQUE7OztVQUdBLFlBQUE7OztVQUdBLHFCQUFBOzs7VUFHQSxxQkFBQTs7O1VBR0EscUJBQUE7OztVQUdBLGNBQUE7OztVQUdBLHFCQUFBOzs7VUFHQSxXQUFBOzs7VUFHQSxpQkFBQTs7O1VBR0Esc0JBQUE7OztVQUdBLDBCQUFBOzs7VUFHQSxnQkFBQTs7O1VBR0EscUJBQUE7OztVQUdBLGNBQUE7OztVQUdBLHFCQUFBLFVBQUE7OztVQUdBLHFCQUFBLFVBQUE7OztVQUdBLGlCQUFBOzs7TUFHQSxPQUFBLHVCQUFBLFNBQUEsS0FBQSxNQUFBLE1BQUEsU0FBQTtRQUNBLE9BQUEsWUFBQSxDQUFBO2VBQ0EsT0FBQTtlQUNBLE9BQUE7ZUFDQSxXQUFBO2VBQ0EsT0FBQTtjQUNBO2VBQ0EsT0FBQTtlQUNBLE9BQUE7ZUFDQSxXQUFBO2VBQ0EsT0FBQTtjQUNBO2VBQ0EsT0FBQTtlQUNBLE9BQUE7ZUFDQSxXQUFBO2VBQ0EsT0FBQTtjQUNBO2VBQ0EsT0FBQTtlQUNBLE9BQUE7ZUFDQSxXQUFBO2VBQ0EsT0FBQTs7Ozs7V0FLQSxPQUFBLFVBQUE7OztlQUdBLFlBQUE7OztlQUdBLG1CQUFBOzs7ZUFHQSxvQkFBQTs7O2VBR0Esb0JBQUE7OztlQUdBLHVCQUFBOzs7ZUFHQSxnQkFBQTs7O2VBR0EsaUJBQUE7OztlQUdBLGVBQUE7OztlQUdBLGNBQUE7OztlQUdBLGdCQUFBOzs7Ozs7TUFNQSxPQUFBLGdDQUFBLFNBQUEsTUFBQSxRQUFBO1lBQ0EsT0FBQSxpQkFBQTtVQUNBO1lBQ0EsT0FBQTtZQUNBLE1BQUE7WUFDQSxXQUFBO1lBQ0EsT0FBQTs7VUFFQTtZQUNBLE9BQUE7WUFDQSxPQUFBO1lBQ0EsV0FBQTtZQUNBLE9BQUE7Ozs7O1FBS0EsT0FBQSxxQkFBQTs7O1VBR0EsWUFBQTs7O1VBR0Esb0JBQUE7OztVQUdBLHFCQUFBOzs7VUFHQSxxQkFBQTs7O1VBR0Esd0JBQUE7OztVQUdBLGlCQUFBOzs7VUFHQSxrQkFBQTs7O1VBR0EsZ0JBQUE7OztVQUdBLGVBQUE7OztVQUdBLGlCQUFBOzs7Ozs7OztBQzFhQSxRQUFBLE9BQUE7S0FDQSxXQUFBLDRCQUFBLFNBQUEsUUFBQTtNQUNBLE9BQUEsT0FBQSxXQUFBO2FBQ0EsT0FBQSxPQUFBO2NBQ0EsU0FBQSxHQUFBO2VBQ0EsR0FBQSxDQUFBLEVBQUE7ZUFDQSxPQUFBLGVBQUEsT0FBQTs7OztNQUlBLE9BQUEsaUJBQUEsU0FBQSxVQUFBOztRQUVBLElBQUEsYUFBQTtRQUNBLElBQUEsbUJBQUE7UUFDQSxJQUFBLGVBQUE7UUFDQSxJQUFBLGdCQUFBO1FBQ0EsSUFBQSxtQkFBQTtRQUNBLElBQUEsb0JBQUE7UUFDQSxVQUFBLFdBQUEsSUFBQSxTQUFBLElBQUE7O1VBRUEsR0FBQSxJQUFBLFdBQUEsTUFBQTtZQUNBO1lBQ0Esb0JBQUEsSUFBQTtlQUNBO1lBQ0E7WUFDQSxxQkFBQSxJQUFBOzs7O1VBSUEsSUFBQSxPQUFBLElBQUE7VUFDQSxJQUFBLE9BQUEsSUFBQTtVQUNBLEdBQUEsT0FBQSxXQUFBLFVBQUEsWUFBQTtjQUNBLFdBQUEsUUFBQTs7VUFFQSxHQUFBLE9BQUEsV0FBQSxVQUFBLFNBQUE7Y0FDQSxXQUFBLFNBQUEsU0FBQSxJQUFBO2VBQ0E7WUFDQSxXQUFBLFFBQUEsU0FBQSxJQUFBOzs7O1VBSUEsR0FBQSxPQUFBLGlCQUFBLFVBQUEsWUFBQTtjQUNBLGlCQUFBLFFBQUE7O1VBRUEsR0FBQSxPQUFBLGlCQUFBLFVBQUEsU0FBQTtjQUNBLE9BQUEsaUJBQUEsU0FBQSxTQUFBLElBQUE7ZUFDQTtZQUNBLE9BQUEsaUJBQUEsUUFBQSxTQUFBLElBQUE7OztRQUdBLE9BQUEsdUJBQUE7UUFDQSxPQUFBLHVCQUFBO1FBQ0EsT0FBQSwwQkFBQSxrQkFBQTtRQUNBLE9BQUEsNkJBQUEsaUJBQUEsYUFBQSxVQUFBLG9CQUFBLG1CQUFBLGNBQUEsVUFBQTs7Ozs7TUFLQSxPQUFBLHlCQUFBLFVBQUEsV0FBQTtRQUNBLElBQUEsUUFBQTtRQUNBLElBQUEsT0FBQTtRQUNBLElBQUEsSUFBQSxRQUFBLFlBQUE7VUFDQSxHQUFBLFdBQUEsZUFBQSxPQUFBO1lBQ0EsTUFBQSxLQUFBO1lBQ0EsS0FBQSxLQUFBLFdBQUE7OztRQUdBLElBQUEsU0FBQTtRQUNBLEtBQUEsSUFBQSxTQUFBLEtBQUEsSUFBQTtVQUNBLEdBQUEsT0FBQSxLQUFBO1lBQ0EsT0FBQSxPQUFBLE9BQUE7ZUFDQTtZQUNBLE9BQUEsT0FBQSxPQUFBOzs7O1FBSUEsT0FBQSxjQUFBO2VBQ0EsUUFBQTtlQUNBLFVBQUEsQ0FBQTttQkFDQSxPQUFBO21CQUNBLFdBQUE7bUJBQ0EsYUFBQTttQkFDQSxZQUFBO21CQUNBLGtCQUFBO21CQUNBLG9CQUFBO21CQUNBLHNCQUFBO21CQUNBLE1BQUE7Ozs7O1dBS0EsT0FBQSxpQkFBQTs7O2VBR0EsWUFBQTs7O2VBR0Esa0JBQUE7OztlQUdBLG9CQUFBOzs7ZUFHQSxvQkFBQTs7O2VBR0Esb0JBQUE7OztlQUdBLGVBQUE7OztlQUdBLGdCQUFBOzs7ZUFHQSxpQkFBQTs7O2VBR0EsbUJBQUE7OztlQUdBLGdCQUFBOzs7TUFHQSxPQUFBLHlCQUFBLFVBQUEsaUJBQUE7UUFDQSxJQUFBLFFBQUE7UUFDQSxJQUFBLE9BQUE7UUFDQSxJQUFBLElBQUEsUUFBQSxrQkFBQTtVQUNBLEdBQUEsaUJBQUEsZUFBQSxPQUFBO1lBQ0EsTUFBQSxLQUFBO1lBQ0EsS0FBQSxLQUFBLGlCQUFBOzs7UUFHQSxPQUFBLGNBQUE7ZUFDQSxRQUFBO2VBQ0EsVUFBQSxDQUFBO21CQUNBLE9BQUE7bUJBQ0EsV0FBQSxDQUFBO21CQUNBLGFBQUE7bUJBQ0EsWUFBQTttQkFDQSxrQkFBQTttQkFDQSxvQkFBQTttQkFDQSxzQkFBQTttQkFDQSxNQUFBOzs7OztXQUtBLE9BQUEsaUJBQUE7OztlQUdBLFlBQUE7OztlQUdBLGtCQUFBOzs7ZUFHQSxvQkFBQTs7O2VBR0Esb0JBQUE7OztlQUdBLG9CQUFBOzs7ZUFHQSxlQUFBOzs7ZUFHQSxnQkFBQTs7O2VBR0EsaUJBQUE7OztlQUdBLG1CQUFBOzs7ZUFHQSxnQkFBQTs7O01BR0EsT0FBQSw0QkFBQSxTQUFBLGNBQUEsY0FBQTtRQUNBLE9BQUEseUJBQUEsQ0FBQTtlQUNBLE9BQUE7ZUFDQSxPQUFBO2VBQ0EsV0FBQTtlQUNBLE9BQUE7Y0FDQTtlQUNBLE9BQUE7ZUFDQSxPQUFBO2VBQ0EsV0FBQTtlQUNBLE9BQUE7Ozs7V0FJQSxPQUFBLHVCQUFBOzs7ZUFHQSxZQUFBOzs7ZUFHQSxtQkFBQTs7O2VBR0Esb0JBQUE7OztlQUdBLG9CQUFBOzs7ZUFHQSx1QkFBQTs7O2VBR0EsZ0JBQUE7OztlQUdBLGlCQUFBOzs7ZUFHQSxlQUFBOzs7ZUFHQSxjQUFBOzs7ZUFHQSxnQkFBQTs7Ozs7O01BTUEsT0FBQSwrQkFBQSxTQUFBLGlCQUFBLGFBQUEsb0JBQUEsbUJBQUEsY0FBQSxxQkFBQTtRQUNBLElBQUEsc0JBQUEsb0JBQUEsZUFBQTtRQUNBLElBQUEsdUJBQUEscUJBQUEsZ0JBQUE7O1FBRUEsT0FBQSxjQUFBO1VBQ0E7WUFDQSxPQUFBLG9CQUFBLFFBQUE7WUFDQSxNQUFBO1lBQ0EsV0FBQTtZQUNBLE9BQUE7O1VBRUE7WUFDQSxPQUFBLHFCQUFBLFFBQUE7WUFDQSxPQUFBO1lBQ0EsV0FBQTtZQUNBLE9BQUE7Ozs7O1FBS0EsT0FBQSxrQkFBQTs7O1VBR0EsWUFBQTs7O1VBR0Esb0JBQUE7OztVQUdBLHFCQUFBOzs7VUFHQSxxQkFBQTs7O1VBR0Esd0JBQUE7OztVQUdBLGlCQUFBOzs7VUFHQSxrQkFBQTs7O1VBR0EsZ0JBQUE7OztVQUdBLGVBQUE7OztVQUdBLGlCQUFBOzs7Ozs7Ozs7QUFTQSIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJhbmd1bGFyLm1vZHVsZSgnYXBwJyxbXG4gICduZ1JvdXRlJywndWkucm91dGVyJywndGMuY2hhcnRqcydcbl0pXG4iLCJhbmd1bGFyLm1vZHVsZSgnYXBwJylcbiAgICAuY29udHJvbGxlcignaG9tZUN0cmwnLCBmdW5jdGlvbigkc2NvcGUsICRodHRwLCBkYXRhTXV0YXRvcikge1xuICAgICAgICAkc2NvcGUuc2V0dXAgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICBkYXRhTXV0YXRvci5nZXREYXRhKClcbiAgICAgICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIGRhdGFNdXRhdG9yLmNzdlRvSlNPTihyZXNwb25zZS5kYXRhLCBmdW5jdGlvbihqc29uKXtcbiAgICAgICAgICAgICAgICAgICAgZGF0YU11dGF0b3IuZ2V0Q2FyZWVyU3RhdHMoanNvbiwgZnVuY3Rpb24oc3RhdHMpe1xuICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHN0YXRzKVxuICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zdGF0cyA9IHN0YXRzXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICB9LCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgJHNjb3BlLnNldHVwKCk7XG4gICAgfSlcbiIsImFuZ3VsYXIubW9kdWxlKCdhcHAnKVxuICAgIC5jb250cm9sbGVyKCdtYXN0ZXJDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCAkcm9vdFNjb3BlKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwibWFzdGVyQ3RybFwiKTtcbiAgICB9KVxuIiwiYW5ndWxhci5tb2R1bGUoJ2FwcCcpXG4gICAgLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlcikge1xuXG4gICAgICAgICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy8nKTtcblxuICAgICAgICAkc3RhdGVQcm92aWRlclxuICAgICAgICAgICAgLnN0YXRlKCdhcHAnLCB7XG4gICAgICAgICAgICAgICAgdXJsOiAnLycsXG4gICAgICAgICAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICAgICAgICAgJ2hlYWRlcic6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL25hdi5odG1sJyxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgJ2NvbnRlbnQnOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy9ob21lLmh0bWwnLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ2hvbWVDdHJsJ1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcblxuXG5cbiAgICAgICAgLnN0YXRlKCdhcHAuaG9tZScsIHtcbiAgICAgICAgICAgIHVybDogJ2hvbWUnLFxuICAgICAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICAgICAnY29udGVudEAnOiB7XG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndXNlcnMvaG9tZS5odG1sJyxcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ2hvbWVDdHJsJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9KVxuXG5cblxuXG4gICAgICAgICRsb2NhdGlvblByb3ZpZGVyLmh0bWw1TW9kZSh0cnVlKVxuXG4gICAgfSk7XG4iLCIvL1RoaW5ncyB3ZSBjYW4gZ2V0IGZyb20gdGhlIGRhdGEgOiAtXG4vL1RvdGFsIG1hdGNoZXMgcGxheWVkIC1kb25lXG4vL1RvdGFsIGNlbnR1cmllcyBzY29yZWQgLSBkb25lXG4vL3J1bnMgc2NvcmVkIGluIGEgeWVhclxuLy9jZW50dXJpZXMgc2NvcmVkIGluIGEgeWVhciAtIGRvbmVcbi8vaGFsZiBjZW50dXJpZXMgc2NvcmVkIGluIGEgeWVhciAtIGRvbmVcbi8vaGFsZiBjZW50dXJpZXMgY292ZXJ0ZWQgaW50byBjZW50dXJ5IC0gZG9uZVxuLy9zY29yZSBhZ2FpbnN0IHRoZSB0ZWFtc1xuLy9zY29yZSBpbiB0aGUgd2lubmluZyBjYXVzZSAtIGRvbmVcbi8vYm93bGluZyBmaWd1cmVzLSBkb25lXG4vL3BlcmZvcm1hbmNlIGluIGNsb3NlIG1hdGNoZXNcbi8vYmF0dGluZyBmaXJzdCBwZXJmb3JtYW5jZVxuLy9tb3ZpbmcgYXZlcmFnZSwgbG9uZ2l0dWRhbmFsIGNhcmVlciBncm93dGhcbi8vMTAwMCBSdW5zIGluIG9uZSBjYWxlbmRhciB5ZWFyXG4vL2JhdHRpbmcgc2Vjb25kIHBlcmZvcm1hbmNlICh3aGlsZSBjaGFzaW5nKVxuXG4vL1RPRE86XG4vL0dldCBjZW50dXJpZXMgYnkgY291bnRyeS1kb25lXG4vL0dldCBjZW50dXJpZXMgYnkgeWVhci1kb25lXG4vL0dldCBydW5zIGJ5IGNvdW50cnlcbi8vR2V0IHJ1bnMgYnkgeWVhclxuLy9HZXQgcnVucyBieSB3aW5uaW5nXG4vL0dldCBydW5zIGJ5IGxvb3Npbmdcbi8vR2V0IGNlbnR1cmllcyBpbiB3aW5uaW5nIGNhdXNlLWRvbmVcblxuXG5cbi8vTk9URTogT25jZSBhbGwgZGF0YSBpcyBjb2xsZWN0ZWQgY2xlYW4gb3V0IHRoZSBjYWxsYmFjayBoZWxsIDpQXG5hbmd1bGFyLm1vZHVsZSgnYXBwJylcbiAgICAuc2VydmljZSgnZGF0YU11dGF0b3InLCBmdW5jdGlvbigkaHR0cCkge1xuICAgICAgICByZXR1cm57XG4gICAgICAgICAgICBnZXREYXRhOiBnZXREYXRhLFxuICAgICAgICAgICAgY3N2VG9KU09OOiBjc3ZUb0pTT04sXG4gICAgICAgICAgICBnZXRDYXJlZXJTdGF0czogZ2V0Q2FyZWVyU3RhdHNcblxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZ2V0RGF0YSgpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9kYXRhL3NhY2hpbi5jc3YnKVxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gY3N2VG9KU09OKGNzdiwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHZhciBsaW5lcz1jc3Yuc3BsaXQoXCJcXG5cIik7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgICAgICAgICB2YXIgaGVhZGVycz1saW5lc1swXS5zcGxpdChcIixcIik7XG4gICAgICAgICAgICBmb3IodmFyIGk9MTtpPGxpbmVzLmxlbmd0aCAtMTtpKyspe1xuICAgICAgICAgICAgICAgIHZhciBvYmogPSB7fTtcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudGxpbmU9bGluZXNbaV0uc3BsaXQoXCIsXCIpO1xuICAgICAgICAgICAgICAgIGZvcih2YXIgaj0wO2o8aGVhZGVycy5sZW5ndGg7aisrKXtcbiAgICAgICAgICAgICAgICAgIG9ialtoZWFkZXJzW2pdXSA9IGN1cnJlbnRsaW5lW2pdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChvYmopO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc29sZS5sb2cocmVzdWx0KVxuICAgICAgICAgICAgaWYoY2FsbGJhY2sgJiYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2socmVzdWx0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZ2V0Q2FyZWVyU3RhdHMoZGF0YSwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHZhciB0b3RhbE1hdGNoZXMgPSBkYXRhLmxlbmd0aDtcbiAgICAgICAgICAgIHZhciB0b3RhbFJ1bnMgPSAwO1xuICAgICAgICAgICAgdmFyIGNlbnR1cmllc1Njb3JlZCA9IFtdO1xuICAgICAgICAgICAgdmFyIGhhbGZDZW50dXJpZXNTY29yZWQgPSBbXTtcbiAgICAgICAgICAgIHZhciBhbGxJbm5pbmdzID0gW107XG4gICAgICAgICAgICB2YXIgbm90T3V0cyA9IDA7XG4gICAgICAgICAgICB2YXIgZGlkTm90QmF0ID0gMDtcbiAgICAgICAgICAgIHZhciB3aWNrZXRzVGFrZW4gPSAwO1xuICAgICAgICAgICAgdmFyIHJ1bnNDb25jZWRlZCA9IDA7XG4gICAgICAgICAgICB2YXIgY2F0Y2hlcyA9IDA7XG4gICAgICAgICAgICB2YXIgZmlyc3RJbm5pbmdzTm90b3V0cyA9IDA7XG4gICAgICAgICAgICB2YXIgc2Vjb25kSW5uaW5nc05vdG91dHMgPSAwO1xuICAgICAgICAgICAgYW5ndWxhci5mb3JFYWNoKGRhdGEsIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICAgIHZhciBpbm5pbmdzRGV0YWlsID0ge307XG4gICAgICAgICAgICAgIHZhciBjZW50dXJ5RGV0YWlsID0ge307XG4gICAgICAgICAgICAgIHZhciBoYWxmQ2VudHVyeURldGFpbCA9IHt9O1xuXG4gICAgICAgICAgICAgIC8vQmF0dGluZyBzdGF0c1xuXG4gICAgICAgICAgICAgIC8vY2hlY2sgdG8gc2VlIGlmIHRoZSBzY29yZSBjb250YWlucyBhICogaW4gdGhlIGVuZCB3aGljaCBkZW50b2VzIE5vdE91dHMsIGlmIHllcyByZW1vdmUgZm9yIGNhbGN1bGF0aW9uc1xuICAgICAgICAgICAgICBpZih2YWx1ZS5iYXR0aW5nX3Njb3JlLmluZGV4T2YoXCIqXCIpID4gLTEpe1xuICAgICAgICAgICAgICAgIGlmKHZhbHVlLmJhdHRpbmdfaW5uaW5ncyA9PSBcIjFzdFwiKXtcbiAgICAgICAgICAgICAgICAgIHNlY29uZElubmluZ3NOb3RvdXRzKys7XG4gICAgICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICAgICBmaXJzdElubmluZ3NOb3RvdXRzKys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhbHVlLmJhdHRpbmdfc2NvcmUgPSB2YWx1ZS5iYXR0aW5nX3Njb3JlLnJlcGxhY2UoJyonLCcnKTtcbiAgICAgICAgICAgICAgICBub3RPdXRzKys7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgLy9pZiB0aGUgdmFsdWUgb2Ygc2NvcmUgaXMgTm90IGEgbnVtYmVyICwgaXQgbWVhbnMgaXQgY291bGQgYmUgRE5CKGRpZCBub3QgYmF0KSBvciBURE5CICh0ZWFtIGRpZCBub3QgYmF0KVxuICAgICAgICAgICAgICBpZihpc05hTih2YWx1ZS5iYXR0aW5nX3Njb3JlKSl7XG4gICAgICAgICAgICAgICAgZGlkTm90QmF0Kys7XG4gICAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgIC8vQ29udmVydGluZyB0aGUgc3RyaW5nIHRvIGludGVnZXJzIHRvIGRvIGNhbGN1bGF0aW9uc1xuICAgICAgICAgICAgICAgIHZhbHVlLmJhdHRpbmdfc2NvcmUgPSBwYXJzZUludCh2YWx1ZS5iYXR0aW5nX3Njb3JlKVxuICAgICAgICAgICAgICAgIC8vR2V0dGluZyBhbGwgaW5uaW5ncyBydW5zXG4gICAgICAgICAgICAgICAgaW5uaW5nc0RldGFpbC5ydW5zID0gdmFsdWUuYmF0dGluZ19zY29yZVxuICAgICAgICAgICAgICAgIGlubmluZ3NEZXRhaWwuYWdhaW5zdCA9IHZhbHVlLm9wcG9zaXRpb25cbiAgICAgICAgICAgICAgICBpbm5pbmdzRGV0YWlsLnJlc3VsdCA9IHZhbHVlLm1hdGNoX3Jlc3VsdFxuICAgICAgICAgICAgICAgIGlubmluZ3NEZXRhaWwuaW5uaW5ncyA9IHZhbHVlLmJhdHRpbmdfaW5uaW5nc1xuICAgICAgICAgICAgICAgIGlubmluZ3NEZXRhaWwueWVhciA9IChuZXcgRGF0ZShEYXRlLnBhcnNlKHZhbHVlLmRhdGUpKSkuZ2V0RnVsbFllYXIoKVxuICAgICAgICAgICAgICAgIGFsbElubmluZ3MucHVzaChpbm5pbmdzRGV0YWlsKVxuXG5cbiAgICAgICAgICAgICAgICAvL0NoZWNraW5nIHRvIHNlZSBpZiB0aGUgc2NvcmUgd2FzIGEgaGFsZiBjZW50dXJ5IG9yIGNlbnR1cnlcbiAgICAgICAgICAgICAgICBpZih2YWx1ZS5iYXR0aW5nX3Njb3JlID49IDUwICYmIHZhbHVlLmJhdHRpbmdfc2NvcmUgPCAxMDApe1xuICAgICAgICAgICAgICAgICAgaGFsZkNlbnR1cnlEZXRhaWwucnVucyA9IHZhbHVlLmJhdHRpbmdfc2NvcmVcbiAgICAgICAgICAgICAgICAgIGhhbGZDZW50dXJ5RGV0YWlsLmFnYWluc3QgPSB2YWx1ZS5vcHBvc2l0aW9uXG4gICAgICAgICAgICAgICAgICBoYWxmQ2VudHVyeURldGFpbC5yZXN1bHQgPSB2YWx1ZS5tYXRjaF9yZXN1bHRcbiAgICAgICAgICAgICAgICAgIGhhbGZDZW50dXJ5RGV0YWlsLmlubmluZ3MgPSB2YWx1ZS5iYXR0aW5nX2lubmluZ3NcbiAgICAgICAgICAgICAgICAgIGhhbGZDZW50dXJ5RGV0YWlsLnllYXIgPSAobmV3IERhdGUoRGF0ZS5wYXJzZSh2YWx1ZS5kYXRlKSkpLmdldEZ1bGxZZWFyKClcbiAgICAgICAgICAgICAgICAgIGhhbGZDZW50dXJpZXNTY29yZWQucHVzaChoYWxmQ2VudHVyeURldGFpbClcbiAgICAgICAgICAgICAgICB9ZWxzZSBpZih2YWx1ZS5iYXR0aW5nX3Njb3JlID49IDEwMCl7XG4gICAgICAgICAgICAgICAgICBjZW50dXJ5RGV0YWlsLnJ1bnMgPSB2YWx1ZS5iYXR0aW5nX3Njb3JlXG4gICAgICAgICAgICAgICAgICBjZW50dXJ5RGV0YWlsLmFnYWluc3QgPSB2YWx1ZS5vcHBvc2l0aW9uXG4gICAgICAgICAgICAgICAgICBjZW50dXJ5RGV0YWlsLnJlc3VsdCA9IHZhbHVlLm1hdGNoX3Jlc3VsdFxuICAgICAgICAgICAgICAgICAgY2VudHVyeURldGFpbC5pbm5pbmdzID0gdmFsdWUuYmF0dGluZ19pbm5pbmdzXG4gICAgICAgICAgICAgICAgICBjZW50dXJ5RGV0YWlsLnllYXIgPSAobmV3IERhdGUoRGF0ZS5wYXJzZSh2YWx1ZS5kYXRlKSkpLmdldEZ1bGxZZWFyKClcbiAgICAgICAgICAgICAgICAgIGNlbnR1cmllc1Njb3JlZC5wdXNoKGNlbnR1cnlEZXRhaWwpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vU2F2aW5nIHRvdGFsIHJ1bnNcbiAgICAgICAgICAgICAgICB0b3RhbFJ1bnMgKz0gdmFsdWUuYmF0dGluZ19zY29yZTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIC8vQm93bGluZyBzdGF0c1xuICAgICAgICAgICAgICBpZighaXNOYU4odmFsdWUud2lja2V0cykgJiYgcGFyc2VJbnQodmFsdWUud2lja2V0cykgPiAwKXtcbiAgICAgICAgICAgICAgICB2YWx1ZS53aWNrZXRzID0gcGFyc2VJbnQodmFsdWUud2lja2V0cylcbiAgICAgICAgICAgICAgICB3aWNrZXRzVGFrZW4gKz0gdmFsdWUud2lja2V0c1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmKCFpc05hTih2YWx1ZS5jYXRjaGVzKSAmJiBwYXJzZUludCh2YWx1ZS5jYXRjaGVzKSA+IDApe1xuICAgICAgICAgICAgICAgIHZhbHVlLmNhdGNoZXMgPSBwYXJzZUludCh2YWx1ZS5jYXRjaGVzKVxuICAgICAgICAgICAgICAgIGNhdGNoZXMgKz0gdmFsdWUuY2F0Y2hlc1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmKCFpc05hTih2YWx1ZS5ydW5zX2NvbmNlZGVkKSl7XG4gICAgICAgICAgICAgICAgdmFsdWUucnVuc19jb25jZWRlZCA9IHBhcnNlSW50KHZhbHVlLnJ1bnNfY29uY2VkZWQpXG4gICAgICAgICAgICAgICAgcnVuc0NvbmNlZGVkICs9IHZhbHVlLnJ1bnNfY29uY2VkZWQ7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIGNvbnNvbGUubG9nKGZpcnN0SW5uaW5nc05vdG91dHMpO1xuICAgICAgICAgIGNvbnNvbGUubG9nKHNlY29uZElubmluZ3NOb3RvdXRzKTtcblxuICAgICAgICAgIHZhciB0b3RhbElubmluZ3MgPSB0b3RhbE1hdGNoZXMgLSBkaWROb3RCYXRcbiAgICAgICAgICB2YXIgc3RhdHMgPSB7XG4gICAgICAgICAgICB0b3RhbE1hdGNoZXMgOiB0b3RhbE1hdGNoZXMsXG4gICAgICAgICAgICB0b3RhbFJ1bnM6IHRvdGFsUnVucyxcbiAgICAgICAgICAgIGhhbGZDZW50dXJpZXNTY29yZWQ6IGhhbGZDZW50dXJpZXNTY29yZWQubGVuZ3RoLFxuICAgICAgICAgICAgY2VudHVyaWVzU2NvcmVkOiBjZW50dXJpZXNTY29yZWQubGVuZ3RoLFxuICAgICAgICAgICAgaGlnaGVzdFNjb3JlOiAgTWF0aC5tYXguYXBwbHkobnVsbCxjZW50dXJpZXNTY29yZWQubWFwKGZ1bmN0aW9uKGluZGV4KXtyZXR1cm4gaW5kZXgucnVuc30pKSxcbiAgICAgICAgICAgIG5vdE91dHM6IG5vdE91dHMsXG4gICAgICAgICAgICB0b3RhbElubmluZ3M6IHRvdGFsSW5uaW5ncyxcbiAgICAgICAgICAgIGJhdHRpbmdBdmVyYWdlOiAodG90YWxSdW5zIC8gKHRvdGFsSW5uaW5ncyAtIG5vdE91dHMpKS50b0ZpeGVkKDIpLFxuICAgICAgICAgICAgd2lja2V0c1Rha2VuOiB3aWNrZXRzVGFrZW4sXG4gICAgICAgICAgICBydW5zQ29uY2VkZWQ6IHJ1bnNDb25jZWRlZCxcbiAgICAgICAgICAgIGJvd2xpbmdBdmVyYWdlOiAocnVuc0NvbmNlZGVkIC8gd2lja2V0c1Rha2VuKS50b0ZpeGVkKDIpLFxuICAgICAgICAgICAgY2F0Y2hlczogY2F0Y2hlcyxcbiAgICAgICAgICAgIGFsbENlbnR1cmllczoge2NlbnR1cmllc1Njb3JlZCxoYWxmQ2VudHVyaWVzU2NvcmVkfSxcbiAgICAgICAgICAgIGFsbElubmluZ3M6IHthbGxJbm5pbmdzLGZpcnN0SW5uaW5nc05vdG91dHMsc2Vjb25kSW5uaW5nc05vdG91dHN9XG4gICAgICAgICAgfTtcbiAgICAgICAgICBpZihjYWxsYmFjayAmJiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSkge1xuICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soc3RhdHMpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gc3RhdHNcbiAgICAgICAgfVxuXG5cbiAgICB9KVxuIiwiYW5ndWxhci5tb2R1bGUoJ2FwcCcpXG4gICAgLmRpcmVjdGl2ZSgnY2FyZWVyU3RhdHMnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJue1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgc3RhdHM6ICc9aXRlbScsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdwYXJ0aWFscy9jYXJlZXJTdGF0cy5odG1sJ1xuICAgICAgICAgICAgICAgIC8vY29udHJvbGxlcjogJ2FwcC5wYXJ0aWFscy52ZW51ZXMudmVudWVJdGVtQ3RybCdcbiAgICAgICAgfVxuICAgIH0pXG4iLCJhbmd1bGFyLm1vZHVsZSgnYXBwJylcbiAgICAuZGlyZWN0aXZlKCdjZW50dXJ5U3RhdHMnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJue1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgY2VudHVyeVN0YXRzOiAnPWl0ZW0nLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAncGFydGlhbHMvY2VudHVyeVN0YXRzLmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ2NlbnR1cnlTdGF0c0N0cmwnXG4gICAgICAgIH1cbiAgICB9KVxuIiwiYW5ndWxhci5tb2R1bGUoJ2FwcCcpXG4gICAgLmRpcmVjdGl2ZSgncGVyc29uYWxJbmZvJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybntcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsICAgICAgICAgICAgXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3BhcnRpYWxzL3BlcnNvbmFsSW5mby5odG1sJ1xuICAgICAgICB9XG4gICAgfSlcbiIsImFuZ3VsYXIubW9kdWxlKCdhcHAnKVxuICAgIC5kaXJlY3RpdmUoJ3J1bnNTdGF0cycsIGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm57XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHtcbiAgICAgICAgICAgICAgICBydW5zU3RhdHM6ICc9aXRlbScsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdwYXJ0aWFscy9ydW5zU3RhdHMuaHRtbCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiAncnVuc1N0YXRzQ3RybCdcbiAgICAgICAgfVxuICAgIH0pXG4iLCJhbmd1bGFyLm1vZHVsZSgnYXBwJylcbiAgICAuY29udHJvbGxlcignY2VudHVyeVN0YXRzQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSkge1xuICAgICAgJHNjb3BlLiR3YXRjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICByZXR1cm4gJHNjb3BlLmNlbnR1cnlTdGF0cztcbiAgICAgICAgICAgfSwgZnVuY3Rpb24obikge1xuICAgICAgICAgICAgICAgaWYoIW4pcmV0dXJuXG4gICAgICAgICAgICAgICAkc2NvcGUuYW5hbHl6ZUNlbnR1cmllcygkc2NvcGUuY2VudHVyeVN0YXRzKVxuICAgICAgICAgICB9KTtcblxuICAgICAgJHNjb3BlLmFuYWx5emVDZW50dXJpZXMgPSBmdW5jdGlvbihjZW50dXJ5U3RhdHMpe1xuICAgICAgICB2YXIgc2NvcmVzID0gXy5wbHVjayhjZW50dXJ5U3RhdHMuY2VudHVyaWVzU2NvcmVkLCAncnVucycpXG4gICAgICAgIHZhciBhZ2FpbnN0ID0gXy5wbHVjayhjZW50dXJ5U3RhdHMuY2VudHVyaWVzU2NvcmVkLCAnYWdhaW5zdCcpXG5cbiAgICAgICAgdmFyIHRvdGFsRmlmdGllcyA9IGNlbnR1cnlTdGF0cy5oYWxmQ2VudHVyaWVzU2NvcmVkLmxlbmd0aFxuICAgICAgICB2YXIgdG90YWxIdW5kcmVkcyA9IGNlbnR1cnlTdGF0cy5jZW50dXJpZXNTY29yZWQubGVuZ3RoXG4gICAgICAgIC8vU2VuZCBhcnJheSBvZiBjb2xvcnMgdG8gY2hhcnRqc1xuICAgICAgICB2YXIgY29sb3JzID0gW107XG4gICAgICAgIGNlbnR1cnlTdGF0cy5jZW50dXJpZXNTY29yZWQubWFwKGZ1bmN0aW9uKHJlcywga2V5KXtcbiAgICAgICAgICBpZihyZXMucmVzdWx0ID09IFwid29uXCIpe1xuICAgICAgICAgICAgY29sb3JzW2tleV0gPSBcInJnYmEoMCwxMzIsMjU1LDAuOClcIlxuICAgICAgICAgIH1lbHNlIGlmKHJlcy5yZXN1bHQgPT0gXCJsb3N0XCIpe1xuICAgICAgICAgICAgY29sb3JzW2tleV0gPSBcInJnYmEoMjM3LDYzLDQ3LDAuOClcIlxuICAgICAgICAgIH1lbHNlIGlmKHJlcy5yZXN1bHQgPT0gXCJ0aWVkXCIpe1xuICAgICAgICAgICAgY29sb3JzW2tleV0gPSBcImJsYWNrXCJcbiAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIGNvbG9yc1trZXldID0gXCJ5ZWxsb3dcIlxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gY29sb3JzXG4gICAgICAgIH0pXG4gICAgICAgIHZhciB3b24gPSBfLmZpbHRlcihjZW50dXJ5U3RhdHMuY2VudHVyaWVzU2NvcmVkLCBmdW5jdGlvbihjZW50KXtcbiAgICAgICAgICByZXR1cm4gY2VudC5yZXN1bHQgPT0gXCJ3b25cIlxuICAgICAgICB9KVxuICAgICAgICAvLyB2YXIgbG9zdCA9IF8uZmlsdGVyKGNlbnR1cnlTdGF0cy5jZW50dXJpZXNTY29yZWQsIGZ1bmN0aW9uKGNlbnQpe1xuICAgICAgICAvLyAgIHJldHVybiBjZW50LnJlc3VsdCA9PT0gXCJsb3N0XCJcbiAgICAgICAgLy8gfSlcbiAgICAgICAgLy8gdmFyIHRpZWQgPSBfLmZpbHRlcihjZW50dXJ5U3RhdHMuY2VudHVyaWVzU2NvcmVkLCBmdW5jdGlvbihjZW50KXtcbiAgICAgICAgLy8gICByZXR1cm4gY2VudC5yZXN1bHQgPT09IFwidGllZFwiXG4gICAgICAgIC8vIH0pXG4gICAgICAgIC8vIHZhciBub3Jlc3VsdCA9IF8uZmlsdGVyKGNlbnR1cnlTdGF0cy5jZW50dXJpZXNTY29yZWQsIGZ1bmN0aW9uKGNlbnQpe1xuICAgICAgICAvLyAgIHJldHVybiBjZW50LnJlc3VsdCA9PT0gXCJuL3JcIlxuICAgICAgICAvLyB9KVxuXG4gICAgICAgIC8vQ2VudHVyeSB3aGlsZSBjaGFzaW5nXG4gICAgICAgIHZhciBjaGFzaW5nQ2VudHVyaWVzID0gXy5maWx0ZXIoY2VudHVyeVN0YXRzLmNlbnR1cmllc1Njb3JlZCwgZnVuY3Rpb24oY2VudCl7XG4gICAgICAgICAgcmV0dXJuIGNlbnQuaW5uaW5ncyA9PSBcIjJuZFwiXG4gICAgICAgIH0pXG4gICAgICAgIHZhciB3aW5jaGFzaW5nQ2VudHVyaWVzID0gXy5maWx0ZXIoY2hhc2luZ0NlbnR1cmllcywgZnVuY3Rpb24oY2VudCl7XG4gICAgICAgICAgcmV0dXJuIGNlbnQucmVzdWx0ID09IFwid29uXCJcbiAgICAgICAgfSlcbiAgICAgICAgdmFyIGxvc3RjaGFzaW5nQ2VudHVyaWVzID0gXy5maWx0ZXIoY2hhc2luZ0NlbnR1cmllcywgZnVuY3Rpb24oY2VudCl7XG4gICAgICAgICAgcmV0dXJuIGNlbnQucmVzdWx0ID09PSBcImxvc3RcIlxuICAgICAgICB9KVxuICAgICAgICB2YXIgdGllZGNoYXNpbmdDZW50dXJpZXMgPSBfLmZpbHRlcihjaGFzaW5nQ2VudHVyaWVzLCBmdW5jdGlvbihjZW50KXtcbiAgICAgICAgICByZXR1cm4gY2VudC5yZXN1bHQgPT09IFwidGllZFwiXG4gICAgICAgIH0pXG4gICAgICAgIHZhciBub3Jlc3VsdGNoYXNpbmdDZW50dXJpZXMgPSBfLmZpbHRlcihjaGFzaW5nQ2VudHVyaWVzLCBmdW5jdGlvbihjZW50KXtcbiAgICAgICAgICByZXR1cm4gY2VudC5yZXN1bHQgPT09IFwibi9yXCJcbiAgICAgICAgfSlcblxuICAgICAgICAvL0NlbnR1cnkgYWdhaW5zdCB0ZWFtc1xuICAgICAgICB2YXIgY2VudHVyeUFnYWluc3RUZWFtcyA9IFtdO1xuICAgICAgICBjZW50dXJ5U3RhdHMuY2VudHVyaWVzU2NvcmVkLm1hcChmdW5jdGlvbihyZXMpe1xuICAgICAgICAgIHZhciB0ZWFtID0gcmVzLmFnYWluc3Q7XG4gICAgICAgICAgdmFyIGNlbnR1cnkgPSB7XG4gICAgICAgICAgICBzY29yZTogcmVzLnJ1bnNcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYodHlwZW9mKGNlbnR1cnlBZ2FpbnN0VGVhbXNbdGVhbV0pID09IFwidW5kZWZpbmVkXCIpXG4gICAgICAgICAgICAgICAgICBjZW50dXJ5QWdhaW5zdFRlYW1zW3RlYW1dID0gW11cbiAgICAgICAgICByZXR1cm4gY2VudHVyeUFnYWluc3RUZWFtc1t0ZWFtXS5wdXNoKGNlbnR1cnkpXG4gICAgICAgIH0pXG5cbiAgICAgICAgLy9DZW50dXJ5IG92ZXIgdGhlIHllYXJzXG4gICAgICAgIHZhciBjZW50dXJ5QnlZZWFyID0gW107XG4gICAgICAgIGNlbnR1cnlTdGF0cy5jZW50dXJpZXNTY29yZWQubWFwKGZ1bmN0aW9uKHJlcyl7XG4gICAgICAgICAgdmFyIHllYXIgPSByZXMueWVhcjtcbiAgICAgICAgICB2YXIgY2VudHVyeSA9IHtcbiAgICAgICAgICAgIHNjb3JlOiByZXMucnVuc1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZih0eXBlb2YoY2VudHVyeUJ5WWVhclt5ZWFyXSkgPT0gXCJ1bmRlZmluZWRcIilcbiAgICAgICAgICAgICAgICAgIGNlbnR1cnlCeVllYXJbeWVhcl0gPSBbXVxuICAgICAgICAgIHJldHVybiBjZW50dXJ5QnlZZWFyW3llYXJdLnB1c2goY2VudHVyeSlcbiAgICAgICAgfSlcblxuICAgICAgICB2YXIgaGFsZkNlbnR1cnlCeVllYXIgPSBbXTtcbiAgICAgICAgY2VudHVyeVN0YXRzLmhhbGZDZW50dXJpZXNTY29yZWQubWFwKGZ1bmN0aW9uKHJlcyl7XG4gICAgICAgICAgdmFyIHllYXIgPSByZXMueWVhcjtcbiAgICAgICAgICB2YXIgaGFsZkNlbnR1cnkgPSB7XG4gICAgICAgICAgICBzY29yZTogcmVzLnJ1bnNcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYodHlwZW9mKGhhbGZDZW50dXJ5QnlZZWFyW3llYXJdKSA9PSBcInVuZGVmaW5lZFwiKVxuICAgICAgICAgICAgICAgICAgaGFsZkNlbnR1cnlCeVllYXJbeWVhcl0gPSBbXVxuICAgICAgICAgIHJldHVybiBoYWxmQ2VudHVyeUJ5WWVhclt5ZWFyXS5wdXNoKGhhbGZDZW50dXJ5KVxuICAgICAgICB9KVxuXG4gICAgICAgIGNvbnNvbGUubG9nKGNlbnR1cnlCeVllYXIsaGFsZkNlbnR1cnlCeVllYXIpXG5cblxuICAgICAgICAkc2NvcGUud2lubmluZ1JhdGlvID0gKHdvbi5sZW5ndGgvY2VudHVyeVN0YXRzLmNlbnR1cmllc1Njb3JlZC5sZW5ndGgpLnRvRml4ZWQoMikgKiAxMDtcbiAgICAgICAgJHNjb3BlLnByZXBhcmVCYXJHcmFwaChzY29yZXMsIGFnYWluc3QsIGNvbG9ycylcbiAgICAgICAgJHNjb3BlLnByZXBhcmVCYXJHcmFwaEFnYWluc3RUZWFtKGNlbnR1cnlBZ2FpbnN0VGVhbXMpXG4gICAgICAgICRzY29wZS5wcmVwYXJlTGluZUdyYXBoKGNlbnR1cnlCeVllYXIsaGFsZkNlbnR1cnlCeVllYXIpO1xuICAgICAgICAkc2NvcGUucHJlcGFyZURvdWdobnV0Q2hhcnQod2luY2hhc2luZ0NlbnR1cmllcy5sZW5ndGgsbG9zdGNoYXNpbmdDZW50dXJpZXMubGVuZ3RoLHRpZWRjaGFzaW5nQ2VudHVyaWVzLmxlbmd0aCxub3Jlc3VsdGNoYXNpbmdDZW50dXJpZXMubGVuZ3RoKVxuICAgICAgICAkc2NvcGUucHJlcGFyZUNvbnZlcnNpb25SYXRlUGllQ2hhcnQodG90YWxGaWZ0aWVzLHRvdGFsSHVuZHJlZHMpXG4gICAgICB9XG5cblxuXG5cblxuXG5cblxuICAgICAgJHNjb3BlLnByZXBhcmVCYXJHcmFwaCA9IGZ1bmN0aW9uIChzY29yZXMsYWdhaW5zdCwgY29sb3JzKXtcbiAgICAgICAgJHNjb3BlLmJhcmRhdGEgPSB7XG4gICAgICAgICAgICAgICBsYWJlbHM6IGFnYWluc3QsXG4gICAgICAgICAgICAgICBkYXRhc2V0czogW3tcbiAgICAgICAgICAgICAgICAgICBsYWJlbDogJ0NlbnR1cmllcycsXG4gICAgICAgICAgICAgICAgICAgZmlsbENvbG9yOiBjb2xvcnMsXG4gICAgICAgICAgICAgICAgICAgc3Ryb2tlQ29sb3I6ICdyZ2JhKDIyMCwyMjAsMjIwLDEpJyxcbiAgICAgICAgICAgICAgICAgICBwb2ludENvbG9yOiAncmdiYSgyMjAsMjIwLDIyMCwxKScsXG4gICAgICAgICAgICAgICAgICAgcG9pbnRTdHJva2VDb2xvcjogJyNmZmYnLFxuICAgICAgICAgICAgICAgICAgIHBvaW50SGlnaGxpZ2h0RmlsbDogJyNmZmYnLFxuICAgICAgICAgICAgICAgICAgIHBvaW50SGlnaGxpZ2h0U3Ryb2tlOiAncmdiYSgyMjAsMjIwLDIyMCwxKScsXG4gICAgICAgICAgICAgICAgICAgZGF0YTogc2NvcmVzXG4gICAgICAgICAgICAgICB9XVxuICAgICAgICAgICB9O1xuXG4gICAgICAgICAgIC8vIENoYXJ0LmpzIE9wdGlvbnNcbiAgICAgICAgICAgJHNjb3BlLmJhcm9wdGlvbnMgPSB7XG5cbiAgICAgICAgICAgICAgIC8vIFNldHMgdGhlIGNoYXJ0IHRvIGJlIHJlc3BvbnNpdmVcbiAgICAgICAgICAgICAgIHJlc3BvbnNpdmU6IHRydWUsXG5cbiAgICAgICAgICAgICAgIC8vQm9vbGVhbiAtIFdoZXRoZXIgdGhlIHNjYWxlIHNob3VsZCBzdGFydCBhdCB6ZXJvLCBvciBhbiBvcmRlciBvZiBtYWduaXR1ZGUgZG93biBmcm9tIHRoZSBsb3dlc3QgdmFsdWVcbiAgICAgICAgICAgICAgIHNjYWxlQmVnaW5BdFplcm86IHRydWUsXG5cbiAgICAgICAgICAgICAgIC8vQm9vbGVhbiAtIFdoZXRoZXIgZ3JpZCBsaW5lcyBhcmUgc2hvd24gYWNyb3NzIHRoZSBjaGFydFxuICAgICAgICAgICAgICAgc2NhbGVTaG93R3JpZExpbmVzOiB0cnVlLFxuXG4gICAgICAgICAgICAgICAvL1N0cmluZyAtIENvbG91ciBvZiB0aGUgZ3JpZCBsaW5lc1xuICAgICAgICAgICAgICAgc2NhbGVHcmlkTGluZUNvbG9yOiBcInJnYmEoMCwwLDAsLjA1KVwiLFxuXG4gICAgICAgICAgICAgICAvL051bWJlciAtIFdpZHRoIG9mIHRoZSBncmlkIGxpbmVzXG4gICAgICAgICAgICAgICBzY2FsZUdyaWRMaW5lV2lkdGg6IDEsXG5cbiAgICAgICAgICAgICAgIC8vQm9vbGVhbiAtIElmIHRoZXJlIGlzIGEgc3Ryb2tlIG9uIGVhY2ggYmFyXG4gICAgICAgICAgICAgICBiYXJTaG93U3Ryb2tlOiB0cnVlLFxuXG4gICAgICAgICAgICAgICAvL051bWJlciAtIFBpeGVsIHdpZHRoIG9mIHRoZSBiYXIgc3Ryb2tlXG4gICAgICAgICAgICAgICBiYXJTdHJva2VXaWR0aDogMixcblxuICAgICAgICAgICAgICAgLy9OdW1iZXIgLSBTcGFjaW5nIGJldHdlZW4gZWFjaCBvZiB0aGUgWCB2YWx1ZSBzZXRzXG4gICAgICAgICAgICAgICBiYXJWYWx1ZVNwYWNpbmc6IDUsXG5cbiAgICAgICAgICAgICAgIC8vTnVtYmVyIC0gU3BhY2luZyBiZXR3ZWVuIGRhdGEgc2V0cyB3aXRoaW4gWCB2YWx1ZXNcbiAgICAgICAgICAgICAgIGJhckRhdGFzZXRTcGFjaW5nOiAxLFxuXG4gICAgICAgICAgICAgICAvL1N0cmluZyAtIEEgbGVnZW5kIHRlbXBsYXRlXG4gICAgICAgICAgICAgICBsZWdlbmRUZW1wbGF0ZTogJzx1bCBjbGFzcz1cInRjLWNoYXJ0LWpzLWxlZ2VuZFwiPjwlIGZvciAodmFyIGk9MDsgaTxkYXRhc2V0cy5sZW5ndGg7IGkrKyl7JT48bGk+PHNwYW4gc3R5bGU9XCJiYWNrZ3JvdW5kLWNvbG9yOjwlPWRhdGFzZXRzW2ldLmZpbGxDb2xvciU+XCI+PC9zcGFuPjwlaWYoZGF0YXNldHNbaV0ubGFiZWwpeyU+PCU9ZGF0YXNldHNbaV0ubGFiZWwlPjwlfSU+PC9saT48JX0lPjwvdWw+J1xuICAgICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICAkc2NvcGUucHJlcGFyZUJhckdyYXBoQWdhaW5zdFRlYW0gPSBmdW5jdGlvbiAoY2VudHVyeUFnYWluc3RUZWFtcyl7XG4gICAgICAgIHZhciBhZ2FpbnN0Rm9yQ2VudHVyaWVzID0gW11cbiAgICAgICAgdmFyIG51bWJlck9mQ2VudHVyaWVzID0gW11cbiAgICAgICAgZm9yKHZhciBjZW50dXJ5S2V5IGluIGNlbnR1cnlBZ2FpbnN0VGVhbXMpIHtcbiAgICAgICAgICBpZihjZW50dXJ5QWdhaW5zdFRlYW1zLmhhc093blByb3BlcnR5KGNlbnR1cnlLZXkpKSB7XG4gICAgICAgICAgICBhZ2FpbnN0Rm9yQ2VudHVyaWVzLnB1c2goY2VudHVyeUtleSk7XG4gICAgICAgICAgICBudW1iZXJPZkNlbnR1cmllcy5wdXNoKGNlbnR1cnlBZ2FpbnN0VGVhbXNbY2VudHVyeUtleV0ubGVuZ3RoKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAkc2NvcGUuYmFyZGF0YUFnYWluc3RUZWFtID0ge1xuICAgICAgICAgICAgICAgbGFiZWxzOiBhZ2FpbnN0Rm9yQ2VudHVyaWVzLFxuICAgICAgICAgICAgICAgZGF0YXNldHM6IFt7XG4gICAgICAgICAgICAgICAgICAgbGFiZWw6ICdDZW50dXJpZXMnLFxuICAgICAgICAgICAgICAgICAgIGZpbGxDb2xvcjogWydibHVlJ10sXG4gICAgICAgICAgICAgICAgICAgc3Ryb2tlQ29sb3I6ICdyZ2JhKDIyMCwyMjAsMjIwLDEpJyxcbiAgICAgICAgICAgICAgICAgICBwb2ludENvbG9yOiAncmdiYSgyMjAsMjIwLDIyMCwxKScsXG4gICAgICAgICAgICAgICAgICAgcG9pbnRTdHJva2VDb2xvcjogJyNmZmYnLFxuICAgICAgICAgICAgICAgICAgIHBvaW50SGlnaGxpZ2h0RmlsbDogJyNmZmYnLFxuICAgICAgICAgICAgICAgICAgIHBvaW50SGlnaGxpZ2h0U3Ryb2tlOiAncmdiYSgyMjAsMjIwLDIyMCwxKScsXG4gICAgICAgICAgICAgICAgICAgZGF0YTogbnVtYmVyT2ZDZW50dXJpZXNcbiAgICAgICAgICAgICAgIH1dXG4gICAgICAgICAgIH07XG5cbiAgICAgICAgICAgLy8gQ2hhcnQuanMgT3B0aW9uc1xuICAgICAgICAgICAkc2NvcGUuYmFyb3B0aW9uc0FnYWluc3RUZWFtID0ge1xuXG4gICAgICAgICAgICAgICAvLyBTZXRzIHRoZSBjaGFydCB0byBiZSByZXNwb25zaXZlXG4gICAgICAgICAgICAgICByZXNwb25zaXZlOiB0cnVlLFxuXG4gICAgICAgICAgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIHRoZSBzY2FsZSBzaG91bGQgc3RhcnQgYXQgemVybywgb3IgYW4gb3JkZXIgb2YgbWFnbml0dWRlIGRvd24gZnJvbSB0aGUgbG93ZXN0IHZhbHVlXG4gICAgICAgICAgICAgICBzY2FsZUJlZ2luQXRaZXJvOiB0cnVlLFxuXG4gICAgICAgICAgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIGdyaWQgbGluZXMgYXJlIHNob3duIGFjcm9zcyB0aGUgY2hhcnRcbiAgICAgICAgICAgICAgIHNjYWxlU2hvd0dyaWRMaW5lczogdHJ1ZSxcblxuICAgICAgICAgICAgICAgLy9TdHJpbmcgLSBDb2xvdXIgb2YgdGhlIGdyaWQgbGluZXNcbiAgICAgICAgICAgICAgIHNjYWxlR3JpZExpbmVDb2xvcjogXCJyZ2JhKDAsMCwwLC4wNSlcIixcblxuICAgICAgICAgICAgICAgLy9OdW1iZXIgLSBXaWR0aCBvZiB0aGUgZ3JpZCBsaW5lc1xuICAgICAgICAgICAgICAgc2NhbGVHcmlkTGluZVdpZHRoOiAxLFxuXG4gICAgICAgICAgICAgICAvL0Jvb2xlYW4gLSBJZiB0aGVyZSBpcyBhIHN0cm9rZSBvbiBlYWNoIGJhclxuICAgICAgICAgICAgICAgYmFyU2hvd1N0cm9rZTogdHJ1ZSxcblxuICAgICAgICAgICAgICAgLy9OdW1iZXIgLSBQaXhlbCB3aWR0aCBvZiB0aGUgYmFyIHN0cm9rZVxuICAgICAgICAgICAgICAgYmFyU3Ryb2tlV2lkdGg6IDIsXG5cbiAgICAgICAgICAgICAgIC8vTnVtYmVyIC0gU3BhY2luZyBiZXR3ZWVuIGVhY2ggb2YgdGhlIFggdmFsdWUgc2V0c1xuICAgICAgICAgICAgICAgYmFyVmFsdWVTcGFjaW5nOiA1LFxuXG4gICAgICAgICAgICAgICAvL051bWJlciAtIFNwYWNpbmcgYmV0d2VlbiBkYXRhIHNldHMgd2l0aGluIFggdmFsdWVzXG4gICAgICAgICAgICAgICBiYXJEYXRhc2V0U3BhY2luZzogMSxcblxuICAgICAgICAgICAgICAgLy9TdHJpbmcgLSBBIGxlZ2VuZCB0ZW1wbGF0ZVxuICAgICAgICAgICAgICAgbGVnZW5kVGVtcGxhdGU6ICc8dWwgY2xhc3M9XCJ0Yy1jaGFydC1qcy1sZWdlbmRcIj48JSBmb3IgKHZhciBpPTA7IGk8ZGF0YXNldHMubGVuZ3RoOyBpKyspeyU+PGxpPjxzcGFuIHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjo8JT1kYXRhc2V0c1tpXS5maWxsQ29sb3IlPlwiPjwvc3Bhbj48JWlmKGRhdGFzZXRzW2ldLmxhYmVsKXslPjwlPWRhdGFzZXRzW2ldLmxhYmVsJT48JX0lPjwvbGk+PCV9JT48L3VsPidcbiAgICAgICAgICAgfTtcbiAgICAgIH1cblxuXG4gICAgICAkc2NvcGUucHJlcGFyZUxpbmVHcmFwaCA9IGZ1bmN0aW9uKGNlbnR1cnlCeVllYXIsaGFsZkNlbnR1cnlCeVllYXIpe1xuICAgICAgICAgIHZhciB5ZWFyT2ZjZW50dXJpZXMgPSBbXVxuICAgICAgICAgIHZhciBudW1iZXJPZkNlbnR1cmllcyA9IFtdXG5cbiAgICAgICAgICBmb3IodmFyIGNlbnR1cnkgaW4gY2VudHVyeUJ5WWVhcikge1xuICAgICAgICAgICAgaWYoY2VudHVyeUJ5WWVhci5oYXNPd25Qcm9wZXJ0eShjZW50dXJ5KSkge1xuICAgICAgICAgICAgICB5ZWFyT2ZjZW50dXJpZXMucHVzaChjZW50dXJ5KTtcbiAgICAgICAgICAgICAgbnVtYmVyT2ZDZW50dXJpZXMucHVzaChjZW50dXJ5QnlZZWFyW2NlbnR1cnldLmxlbmd0aClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIHllYXJPZmhhbGZDZW50dXJpZXMgPSBbXVxuICAgICAgICAgIHZhciBudW1iZXJPZkhhbGZDZW50dXJpZXMgPSBbXVxuXG4gICAgICAgICAgZm9yKHZhciBoYWxmQ2VudHVyeSBpbiBoYWxmQ2VudHVyeUJ5WWVhcikge1xuICAgICAgICAgICAgaWYoY2VudHVyeUJ5WWVhci5oYXNPd25Qcm9wZXJ0eShoYWxmQ2VudHVyeSkpIHtcbiAgICAgICAgICAgICAgeWVhck9maGFsZkNlbnR1cmllcy5wdXNoKGhhbGZDZW50dXJ5KTtcbiAgICAgICAgICAgICAgbnVtYmVyT2ZIYWxmQ2VudHVyaWVzLnB1c2goaGFsZkNlbnR1cnlCeVllYXJbaGFsZkNlbnR1cnldLmxlbmd0aClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgJHNjb3BlLmxpbmVEYXRhID0ge1xuICAgICAgICAgIGxhYmVsczogeWVhck9maGFsZkNlbnR1cmllcyxcbiAgICAgICAgICBkYXRhc2V0czogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBsYWJlbDogJ015IEZpcnN0IGRhdGFzZXQnLFxuICAgICAgICAgICAgICBmaWxsQ29sb3I6IFsncmdiYSgxMjAsMjAsMjIwLDAuNCknXSxcbiAgICAgICAgICAgICAgc3Ryb2tlQ29sb3I6ICdyZ2JhKDIyMCwyMjAsMjIwLDEpJyxcbiAgICAgICAgICAgICAgcG9pbnRDb2xvcjogJ3JnYmEoMjIwLDIyMCwyMjAsMSknLFxuICAgICAgICAgICAgICBwb2ludFN0cm9rZUNvbG9yOiAnI2ZmZicsXG4gICAgICAgICAgICAgIHBvaW50SGlnaGxpZ2h0RmlsbDogJyNmZmYnLFxuICAgICAgICAgICAgICBwb2ludEhpZ2hsaWdodFN0cm9rZTogJ3JnYmEoMjIwLDIyMCwyMjAsMSknLFxuICAgICAgICAgICAgICBkYXRhOiBudW1iZXJPZkhhbGZDZW50dXJpZXNcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGxhYmVsOiAnTXkgRmlyc3QgZGF0YXNldCcsXG4gICAgICAgICAgICAgIGZpbGxDb2xvcjogWydyZ2JhKDIyMCwyMjAsMjIwLDAuNiknXSxcbiAgICAgICAgICAgICAgc3Ryb2tlQ29sb3I6ICdyZ2JhKDIyMCwyMjAsMjIwLDEpJyxcbiAgICAgICAgICAgICAgcG9pbnRDb2xvcjogJ3JnYmEoMjIwLDIyMCwyMjAsMSknLFxuICAgICAgICAgICAgICBwb2ludFN0cm9rZUNvbG9yOiAnI2ZmZicsXG4gICAgICAgICAgICAgIHBvaW50SGlnaGxpZ2h0RmlsbDogJyNmZmYnLFxuICAgICAgICAgICAgICBwb2ludEhpZ2hsaWdodFN0cm9rZTogJ3JnYmEoMjIwLDIyMCwyMjAsMSknLFxuICAgICAgICAgICAgICBkYXRhOiBudW1iZXJPZkNlbnR1cmllc1xuICAgICAgICAgICAgfVxuICAgICAgICAgIF1cbiAgICAgICAgfTtcblxuICAgICAgICAvLyBDaGFydC5qcyBPcHRpb25zXG4gICAgICAgICRzY29wZS5saW5lT3B0aW9ucyA9ICB7XG5cbiAgICAgICAgICAvLyBTZXRzIHRoZSBjaGFydCB0byBiZSByZXNwb25zaXZlXG4gICAgICAgICAgcmVzcG9uc2l2ZTogdHJ1ZSxcblxuICAgICAgICAgIC8vL0Jvb2xlYW4gLSBXaGV0aGVyIGdyaWQgbGluZXMgYXJlIHNob3duIGFjcm9zcyB0aGUgY2hhcnRcbiAgICAgICAgICBzY2FsZVNob3dHcmlkTGluZXMgOiB0cnVlLFxuXG4gICAgICAgICAgLy9TdHJpbmcgLSBDb2xvdXIgb2YgdGhlIGdyaWQgbGluZXNcbiAgICAgICAgICBzY2FsZUdyaWRMaW5lQ29sb3IgOiBcInJnYmEoMCwwLDAsLjA1KVwiLFxuXG4gICAgICAgICAgLy9OdW1iZXIgLSBXaWR0aCBvZiB0aGUgZ3JpZCBsaW5lc1xuICAgICAgICAgIHNjYWxlR3JpZExpbmVXaWR0aCA6IDEsXG5cbiAgICAgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIHRoZSBsaW5lIGlzIGN1cnZlZCBiZXR3ZWVuIHBvaW50c1xuICAgICAgICAgIGJlemllckN1cnZlIDogdHJ1ZSxcblxuICAgICAgICAgIC8vTnVtYmVyIC0gVGVuc2lvbiBvZiB0aGUgYmV6aWVyIGN1cnZlIGJldHdlZW4gcG9pbnRzXG4gICAgICAgICAgYmV6aWVyQ3VydmVUZW5zaW9uIDogMC40LFxuXG4gICAgICAgICAgLy9Cb29sZWFuIC0gV2hldGhlciB0byBzaG93IGEgZG90IGZvciBlYWNoIHBvaW50XG4gICAgICAgICAgcG9pbnREb3QgOiB0cnVlLFxuXG4gICAgICAgICAgLy9OdW1iZXIgLSBSYWRpdXMgb2YgZWFjaCBwb2ludCBkb3QgaW4gcGl4ZWxzXG4gICAgICAgICAgcG9pbnREb3RSYWRpdXMgOiA0LFxuXG4gICAgICAgICAgLy9OdW1iZXIgLSBQaXhlbCB3aWR0aCBvZiBwb2ludCBkb3Qgc3Ryb2tlXG4gICAgICAgICAgcG9pbnREb3RTdHJva2VXaWR0aCA6IDEsXG5cbiAgICAgICAgICAvL051bWJlciAtIGFtb3VudCBleHRyYSB0byBhZGQgdG8gdGhlIHJhZGl1cyB0byBjYXRlciBmb3IgaGl0IGRldGVjdGlvbiBvdXRzaWRlIHRoZSBkcmF3biBwb2ludFxuICAgICAgICAgIHBvaW50SGl0RGV0ZWN0aW9uUmFkaXVzIDogMjAsXG5cbiAgICAgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIHRvIHNob3cgYSBzdHJva2UgZm9yIGRhdGFzZXRzXG4gICAgICAgICAgZGF0YXNldFN0cm9rZSA6IHRydWUsXG5cbiAgICAgICAgICAvL051bWJlciAtIFBpeGVsIHdpZHRoIG9mIGRhdGFzZXQgc3Ryb2tlXG4gICAgICAgICAgZGF0YXNldFN0cm9rZVdpZHRoIDogMixcblxuICAgICAgICAgIC8vQm9vbGVhbiAtIFdoZXRoZXIgdG8gZmlsbCB0aGUgZGF0YXNldCB3aXRoIGEgY29sb3VyXG4gICAgICAgICAgZGF0YXNldEZpbGwgOiB0cnVlLFxuXG4gICAgICAgICAgLy8gRnVuY3Rpb24gLSBvbiBhbmltYXRpb24gcHJvZ3Jlc3NcbiAgICAgICAgICBvbkFuaW1hdGlvblByb2dyZXNzOiBmdW5jdGlvbigpe30sXG5cbiAgICAgICAgICAvLyBGdW5jdGlvbiAtIG9uIGFuaW1hdGlvbiBjb21wbGV0ZVxuICAgICAgICAgIG9uQW5pbWF0aW9uQ29tcGxldGU6IGZ1bmN0aW9uKCl7fSxcblxuICAgICAgICAgIC8vU3RyaW5nIC0gQSBsZWdlbmQgdGVtcGxhdGVcbiAgICAgICAgICBsZWdlbmRUZW1wbGF0ZSA6ICc8dWwgY2xhc3M9XCJ0Yy1jaGFydC1qcy1sZWdlbmRcIj48JSBmb3IgKHZhciBpPTA7IGk8ZGF0YXNldHMubGVuZ3RoOyBpKyspeyU+PGxpPjxzcGFuIHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjo8JT1kYXRhc2V0c1tpXS5zdHJva2VDb2xvciU+XCI+PC9zcGFuPjwlaWYoZGF0YXNldHNbaV0ubGFiZWwpeyU+PCU9ZGF0YXNldHNbaV0ubGFiZWwlPjwlfSU+PC9saT48JX0lPjwvdWw+J1xuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgJHNjb3BlLnByZXBhcmVEb3VnaG51dENoYXJ0ID0gZnVuY3Rpb24od29uLCBsb3N0LCB0aWVkLCBub3Jlc3VsdCl7XG4gICAgICAgICRzY29wZS5yZXNvdXJjZXMgPSBbe1xuICAgICAgICAgICAgICAgdmFsdWU6IHdvbixcbiAgICAgICAgICAgICAgIGNvbG9yOiAnI0ZGRkYwMCcsXG4gICAgICAgICAgICAgICBoaWdobGlnaHQ6ICcjZTVlNTAwJyxcbiAgICAgICAgICAgICAgIGxhYmVsOiAnV2luJ1xuICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICB2YWx1ZTogbG9zdCxcbiAgICAgICAgICAgICAgIGNvbG9yOiAnIzQ2QkZCRCcsXG4gICAgICAgICAgICAgICBoaWdobGlnaHQ6ICcjNUFEM0QxJyxcbiAgICAgICAgICAgICAgIGxhYmVsOiAnTG9zcydcbiAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgdmFsdWU6IHRpZWQsXG4gICAgICAgICAgICAgICBjb2xvcjogJyNGNzQ2NEEnLFxuICAgICAgICAgICAgICAgaGlnaGxpZ2h0OiAnI0ZGNUE1RScsXG4gICAgICAgICAgICAgICBsYWJlbDogJ1RpZSdcbiAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgdmFsdWU6IG5vcmVzdWx0LFxuICAgICAgICAgICAgICAgY29sb3I6ICcjRjc0NjRBJyxcbiAgICAgICAgICAgICAgIGhpZ2hsaWdodDogJyNFRjVBNUUnLFxuICAgICAgICAgICAgICAgbGFiZWw6ICdObyBSZXN1bHQnXG4gICAgICAgICAgIH1cbiAgICAgICAgIF07XG5cbiAgICAgICAgICAgLy8gQ2hhcnQuanMgT3B0aW9uc1xuICAgICAgICAgICAkc2NvcGUub3B0aW9ucyA9IHtcblxuICAgICAgICAgICAgICAgLy8gU2V0cyB0aGUgY2hhcnQgdG8gYmUgcmVzcG9uc2l2ZVxuICAgICAgICAgICAgICAgcmVzcG9uc2l2ZTogdHJ1ZSxcblxuICAgICAgICAgICAgICAgLy9Cb29sZWFuIC0gV2hldGhlciB3ZSBzaG91bGQgc2hvdyBhIHN0cm9rZSBvbiBlYWNoIHNlZ21lbnRcbiAgICAgICAgICAgICAgIHNlZ21lbnRTaG93U3Ryb2tlOiB0cnVlLFxuXG4gICAgICAgICAgICAgICAvL1N0cmluZyAtIFRoZSBjb2xvdXIgb2YgZWFjaCBzZWdtZW50IHN0cm9rZVxuICAgICAgICAgICAgICAgc2VnbWVudFN0cm9rZUNvbG9yOiAnI2ZmZicsXG5cbiAgICAgICAgICAgICAgIC8vTnVtYmVyIC0gVGhlIHdpZHRoIG9mIGVhY2ggc2VnbWVudCBzdHJva2VcbiAgICAgICAgICAgICAgIHNlZ21lbnRTdHJva2VXaWR0aDogMixcblxuICAgICAgICAgICAgICAgLy9OdW1iZXIgLSBUaGUgcGVyY2VudGFnZSBvZiB0aGUgY2hhcnQgdGhhdCB3ZSBjdXQgb3V0IG9mIHRoZSBtaWRkbGVcbiAgICAgICAgICAgICAgIHBlcmNlbnRhZ2VJbm5lckN1dG91dDogNTAsIC8vIFRoaXMgaXMgMCBmb3IgUGllIGNoYXJ0c1xuXG4gICAgICAgICAgICAgICAvL051bWJlciAtIEFtb3VudCBvZiBhbmltYXRpb24gc3RlcHNcbiAgICAgICAgICAgICAgIGFuaW1hdGlvblN0ZXBzOiAxMDAsXG5cbiAgICAgICAgICAgICAgIC8vU3RyaW5nIC0gQW5pbWF0aW9uIGVhc2luZyBlZmZlY3RcbiAgICAgICAgICAgICAgIGFuaW1hdGlvbkVhc2luZzogJ2Vhc2VPdXRCb3VuY2UnLFxuXG4gICAgICAgICAgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIHdlIGFuaW1hdGUgdGhlIHJvdGF0aW9uIG9mIHRoZSBEb3VnaG51dFxuICAgICAgICAgICAgICAgYW5pbWF0ZVJvdGF0ZTogdHJ1ZSxcblxuICAgICAgICAgICAgICAgLy9Cb29sZWFuIC0gV2hldGhlciB3ZSBhbmltYXRlIHNjYWxpbmcgdGhlIERvdWdobnV0IGZyb20gdGhlIGNlbnRyZVxuICAgICAgICAgICAgICAgYW5pbWF0ZVNjYWxlOiBmYWxzZSxcblxuICAgICAgICAgICAgICAgLy9TdHJpbmcgLSBBIGxlZ2VuZCB0ZW1wbGF0ZVxuICAgICAgICAgICAgICAgbGVnZW5kVGVtcGxhdGU6ICc8dWwgY2xhc3M9XCJ0Yy1jaGFydC1qcy1sZWdlbmRcIj48JSBmb3IgKHZhciBpPTA7IGk8c2VnbWVudHMubGVuZ3RoOyBpKyspeyU+PGxpPjxzcGFuIHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjo8JT1zZWdtZW50c1tpXS5maWxsQ29sb3IlPlwiPjwvc3Bhbj48JWlmKHNlZ21lbnRzW2ldLmxhYmVsKXslPjwlPXNlZ21lbnRzW2ldLmxhYmVsJT48JX0lPjwvbGk+PCV9JT48L3VsPidcblxuICAgICAgICAgICB9O1xuXG4gICAgICB9XG5cbiAgICAgICRzY29wZS5wcmVwYXJlQ29udmVyc2lvblJhdGVQaWVDaGFydCA9IGZ1bmN0aW9uKGZpZnR5LGh1bmRyZWQpe1xuICAgICAgICAgICAgJHNjb3BlLmNvbnZlcnNpb25EYXRhID0gW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHZhbHVlOiBmaWZ0eSxcbiAgICAgICAgICAgIGNvbG9yOicjRjc0NjRBJyxcbiAgICAgICAgICAgIGhpZ2hsaWdodDogJyNGRjVBNUUnLFxuICAgICAgICAgICAgbGFiZWw6ICdIYWxmIENlbnR1cmllcydcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHZhbHVlOiBodW5kcmVkLFxuICAgICAgICAgICAgY29sb3I6ICcjRkRCNDVDJyxcbiAgICAgICAgICAgIGhpZ2hsaWdodDogJyNGRkM4NzAnLFxuICAgICAgICAgICAgbGFiZWw6ICdDZW50dXJpZXMnXG4gICAgICAgICAgfVxuICAgICAgICBdO1xuXG4gICAgICAgIC8vIENoYXJ0LmpzIE9wdGlvbnNcbiAgICAgICAgJHNjb3BlLmNvbnZlcnNpb25PcHRpb25zID0gIHtcblxuICAgICAgICAgIC8vIFNldHMgdGhlIGNoYXJ0IHRvIGJlIHJlc3BvbnNpdmVcbiAgICAgICAgICByZXNwb25zaXZlOiB0cnVlLFxuXG4gICAgICAgICAgLy9Cb29sZWFuIC0gV2hldGhlciB3ZSBzaG91bGQgc2hvdyBhIHN0cm9rZSBvbiBlYWNoIHNlZ21lbnRcbiAgICAgICAgICBzZWdtZW50U2hvd1N0cm9rZSA6IHRydWUsXG5cbiAgICAgICAgICAvL1N0cmluZyAtIFRoZSBjb2xvdXIgb2YgZWFjaCBzZWdtZW50IHN0cm9rZVxuICAgICAgICAgIHNlZ21lbnRTdHJva2VDb2xvciA6ICcjZmZmJyxcblxuICAgICAgICAgIC8vTnVtYmVyIC0gVGhlIHdpZHRoIG9mIGVhY2ggc2VnbWVudCBzdHJva2VcbiAgICAgICAgICBzZWdtZW50U3Ryb2tlV2lkdGggOiAyLFxuXG4gICAgICAgICAgLy9OdW1iZXIgLSBUaGUgcGVyY2VudGFnZSBvZiB0aGUgY2hhcnQgdGhhdCB3ZSBjdXQgb3V0IG9mIHRoZSBtaWRkbGVcbiAgICAgICAgICBwZXJjZW50YWdlSW5uZXJDdXRvdXQgOiAwLCAvLyBUaGlzIGlzIDAgZm9yIFBpZSBjaGFydHNcblxuICAgICAgICAgIC8vTnVtYmVyIC0gQW1vdW50IG9mIGFuaW1hdGlvbiBzdGVwc1xuICAgICAgICAgIGFuaW1hdGlvblN0ZXBzIDogMTAwLFxuXG4gICAgICAgICAgLy9TdHJpbmcgLSBBbmltYXRpb24gZWFzaW5nIGVmZmVjdFxuICAgICAgICAgIGFuaW1hdGlvbkVhc2luZyA6ICdlYXNlT3V0Qm91bmNlJyxcblxuICAgICAgICAgIC8vQm9vbGVhbiAtIFdoZXRoZXIgd2UgYW5pbWF0ZSB0aGUgcm90YXRpb24gb2YgdGhlIERvdWdobnV0XG4gICAgICAgICAgYW5pbWF0ZVJvdGF0ZSA6IHRydWUsXG5cbiAgICAgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIHdlIGFuaW1hdGUgc2NhbGluZyB0aGUgRG91Z2hudXQgZnJvbSB0aGUgY2VudHJlXG4gICAgICAgICAgYW5pbWF0ZVNjYWxlIDogZmFsc2UsXG5cbiAgICAgICAgICAvL1N0cmluZyAtIEEgbGVnZW5kIHRlbXBsYXRlXG4gICAgICAgICAgbGVnZW5kVGVtcGxhdGUgOiAnPHVsIGNsYXNzPVwidGMtY2hhcnQtanMtbGVnZW5kXCI+PCUgZm9yICh2YXIgaT0wOyBpPHNlZ21lbnRzLmxlbmd0aDsgaSsrKXslPjxsaT48c3BhbiBzdHlsZT1cImJhY2tncm91bmQtY29sb3I6PCU9c2VnbWVudHNbaV0uZmlsbENvbG9yJT5cIj48L3NwYW4+PCVpZihzZWdtZW50c1tpXS5sYWJlbCl7JT48JT1zZWdtZW50c1tpXS5sYWJlbCU+PCV9JT48L2xpPjwlfSU+PC91bD4nXG5cbiAgICAgICAgfTtcbiAgICAgIH1cblxuXG4gICAgfSlcbiIsImFuZ3VsYXIubW9kdWxlKCdhcHAnKVxuICAgIC5jb250cm9sbGVyKCdydW5zU3RhdHNDdHJsJywgZnVuY3Rpb24oJHNjb3BlKSB7XG4gICAgICAkc2NvcGUuJHdhdGNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgIHJldHVybiAkc2NvcGUucnVuc1N0YXRzO1xuICAgICAgICAgICB9LCBmdW5jdGlvbihuKSB7XG4gICAgICAgICAgICAgICBpZighbilyZXR1cm5cbiAgICAgICAgICAgICAgICRzY29wZS5hbmFseXplSW5uaW5ncygkc2NvcGUucnVuc1N0YXRzKVxuICAgICAgICAgICB9KTtcblxuXG4gICAgICAkc2NvcGUuYW5hbHl6ZUlubmluZ3MgPSBmdW5jdGlvbihydW5zU3RhdHMpe1xuICAgICAgICAvL1J1bnMgb3ZlciB0aGUgeWVhcnNcbiAgICAgICAgdmFyIHJ1bnNCeVllYXIgPSBbXTtcbiAgICAgICAgdmFyIHJ1bnNBZ2FpbnN0VGVhbXMgPSBbXTtcbiAgICAgICAgdmFyIGZpcnN0SW5uaW5ncyA9IDA7XG4gICAgICAgIHZhciBzZWNvbmRJbm5pbmdzID0gMDtcbiAgICAgICAgdmFyIHJ1bnNGaXJzdElubmluZ3MgPSAwO1xuICAgICAgICB2YXIgcnVuc1NlY29uZElubmluZ3MgPSAwO1xuICAgICAgICBydW5zU3RhdHMuYWxsSW5uaW5ncy5tYXAoZnVuY3Rpb24ocmVzKXtcbiAgICAgICAgICAvL2NhbGN1bGF0ZSBudW1iZXIgb2YgZmlyc3QgaW5uaW5ncyBhbmQgc2Vjb25kIGlubmluZ3MgcGxheWVkIGFuZCBydW4gc2NvcmVkIGluIHRoZW1cbiAgICAgICAgICBpZihyZXMuaW5uaW5ncyA9PSBcIjFzdFwiKXtcbiAgICAgICAgICAgIGZpcnN0SW5uaW5ncysrO1xuICAgICAgICAgICAgcnVuc0ZpcnN0SW5uaW5ncyArPSByZXMucnVucztcbiAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIHNlY29uZElubmluZ3MrKztcbiAgICAgICAgICAgIHJ1bnNTZWNvbmRJbm5pbmdzICs9IHJlcy5ydW5zO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vZ2V0IHJ1bnMgb24geWVhcmx5IGJhc2lzXG4gICAgICAgICAgdmFyIHllYXIgPSByZXMueWVhcjtcbiAgICAgICAgICB2YXIgdGVhbSA9IHJlcy5hZ2FpbnN0O1xuICAgICAgICAgIGlmKHR5cGVvZihydW5zQnlZZWFyW3llYXJdKSA9PSBcInVuZGVmaW5lZFwiKXtcbiAgICAgICAgICAgICAgcnVuc0J5WWVhclt5ZWFyXSA9IFtdXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmKHR5cGVvZihydW5zQnlZZWFyW3llYXJdKSA9PSBcIm51bWJlclwiKXtcbiAgICAgICAgICAgICAgcnVuc0J5WWVhclt5ZWFyXSArPSBwYXJzZUludChyZXMucnVucylcbiAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIHJ1bnNCeVllYXJbeWVhcl0gPSBwYXJzZUludChyZXMucnVucylcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvL2dldCBydW5zIGFnYWluc3QgdGVhbXNcbiAgICAgICAgICBpZih0eXBlb2YocnVuc0FnYWluc3RUZWFtc1t0ZWFtXSkgPT0gXCJ1bmRlZmluZWRcIil7XG4gICAgICAgICAgICAgIHJ1bnNBZ2FpbnN0VGVhbXNbdGVhbV0gPSBbXVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZih0eXBlb2YocnVuc0FnYWluc3RUZWFtc1t0ZWFtXSkgPT0gXCJudW1iZXJcIil7XG4gICAgICAgICAgICAgIHJldHVybiBydW5zQWdhaW5zdFRlYW1zW3RlYW1dICs9IHBhcnNlSW50KHJlcy5ydW5zKVxuICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgcmV0dXJuIHJ1bnNBZ2FpbnN0VGVhbXNbdGVhbV0gPSBwYXJzZUludChyZXMucnVucylcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgICRzY29wZS5wcmVwYXJlUnVuc0J5WWVhckdyYXBoKHJ1bnNCeVllYXIpXG4gICAgICAgICRzY29wZS5wcmVwYXJlUnVuc0J5VGVhbUdyYXBoKHJ1bnNBZ2FpbnN0VGVhbXMpXG4gICAgICAgICRzY29wZS5wcmVwYXJlUnVuc0J5SW5uaW5nc0dyYXBoKHJ1bnNGaXJzdElubmluZ3MsIHJ1bnNTZWNvbmRJbm5pbmdzKVxuICAgICAgICAkc2NvcGUucHJlcGFyZUF2ZXJhZ2VCeUlubmluZ3NHcmFwaChydW5zRmlyc3RJbm5pbmdzLGZpcnN0SW5uaW5ncyxydW5zU3RhdHMuZmlyc3RJbm5pbmdzTm90b3V0cyxydW5zU2Vjb25kSW5uaW5ncywgc2Vjb25kSW5uaW5ncyxydW5zU3RhdHMuc2Vjb25kSW5uaW5nc05vdG91dHMpXG5cbiAgICAgIH1cblxuXG4gICAgICAkc2NvcGUucHJlcGFyZVJ1bnNCeVllYXJHcmFwaCA9IGZ1bmN0aW9uIChydW5zQnlZZWFyKXtcbiAgICAgICAgdmFyIHllYXJzID0gW11cbiAgICAgICAgdmFyIHJ1bnMgPSBbXVxuICAgICAgICBmb3IodmFyIHllYXIgaW4gcnVuc0J5WWVhcikge1xuICAgICAgICAgIGlmKHJ1bnNCeVllYXIuaGFzT3duUHJvcGVydHkoeWVhcikpIHtcbiAgICAgICAgICAgIHllYXJzLnB1c2goeWVhcik7XG4gICAgICAgICAgICBydW5zLnB1c2gocnVuc0J5WWVhclt5ZWFyXSlcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGNvbG9ycyA9IFtdO1xuICAgICAgICBydW5zLm1hcChmdW5jdGlvbihyZXMsIGtleSl7XG4gICAgICAgICAgaWYocmVzID49IDEwMDApe1xuICAgICAgICAgICAgcmV0dXJuIGNvbG9yc1trZXldID0gXCJ5ZWxsb3dcIlxuICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgcmV0dXJuIGNvbG9yc1trZXldID0gXCJibHVlXCJcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG5cbiAgICAgICAgJHNjb3BlLnllYXJCYXJkYXRhID0ge1xuICAgICAgICAgICAgICAgbGFiZWxzOiB5ZWFycyxcbiAgICAgICAgICAgICAgIGRhdGFzZXRzOiBbe1xuICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnUnVucyBPdmVyIHRoZSB5ZWFycycsXG4gICAgICAgICAgICAgICAgICAgZmlsbENvbG9yOiBjb2xvcnMsXG4gICAgICAgICAgICAgICAgICAgc3Ryb2tlQ29sb3I6ICdyZ2JhKDIyMCwyMjAsMjIwLDEpJyxcbiAgICAgICAgICAgICAgICAgICBwb2ludENvbG9yOiAncmdiYSgyMjAsMjIwLDIyMCwxKScsXG4gICAgICAgICAgICAgICAgICAgcG9pbnRTdHJva2VDb2xvcjogJyNmZmYnLFxuICAgICAgICAgICAgICAgICAgIHBvaW50SGlnaGxpZ2h0RmlsbDogJyNmZmYnLFxuICAgICAgICAgICAgICAgICAgIHBvaW50SGlnaGxpZ2h0U3Ryb2tlOiAncmdiYSgyMjAsMjIwLDIyMCwxKScsXG4gICAgICAgICAgICAgICAgICAgZGF0YTogcnVuc1xuICAgICAgICAgICAgICAgfV1cbiAgICAgICAgICAgfTtcblxuICAgICAgICAgICAvLyBDaGFydC5qcyBPcHRpb25zXG4gICAgICAgICAgICRzY29wZS55ZWFyQmFyb3B0aW9ucyA9IHtcblxuICAgICAgICAgICAgICAgLy8gU2V0cyB0aGUgY2hhcnQgdG8gYmUgcmVzcG9uc2l2ZVxuICAgICAgICAgICAgICAgcmVzcG9uc2l2ZTogdHJ1ZSxcblxuICAgICAgICAgICAgICAgLy9Cb29sZWFuIC0gV2hldGhlciB0aGUgc2NhbGUgc2hvdWxkIHN0YXJ0IGF0IHplcm8sIG9yIGFuIG9yZGVyIG9mIG1hZ25pdHVkZSBkb3duIGZyb20gdGhlIGxvd2VzdCB2YWx1ZVxuICAgICAgICAgICAgICAgc2NhbGVCZWdpbkF0WmVybzogdHJ1ZSxcblxuICAgICAgICAgICAgICAgLy9Cb29sZWFuIC0gV2hldGhlciBncmlkIGxpbmVzIGFyZSBzaG93biBhY3Jvc3MgdGhlIGNoYXJ0XG4gICAgICAgICAgICAgICBzY2FsZVNob3dHcmlkTGluZXM6IHRydWUsXG5cbiAgICAgICAgICAgICAgIC8vU3RyaW5nIC0gQ29sb3VyIG9mIHRoZSBncmlkIGxpbmVzXG4gICAgICAgICAgICAgICBzY2FsZUdyaWRMaW5lQ29sb3I6IFwicmdiYSgwLDAsMCwuMDUpXCIsXG5cbiAgICAgICAgICAgICAgIC8vTnVtYmVyIC0gV2lkdGggb2YgdGhlIGdyaWQgbGluZXNcbiAgICAgICAgICAgICAgIHNjYWxlR3JpZExpbmVXaWR0aDogMSxcblxuICAgICAgICAgICAgICAgLy9Cb29sZWFuIC0gSWYgdGhlcmUgaXMgYSBzdHJva2Ugb24gZWFjaCBiYXJcbiAgICAgICAgICAgICAgIGJhclNob3dTdHJva2U6IHRydWUsXG5cbiAgICAgICAgICAgICAgIC8vTnVtYmVyIC0gUGl4ZWwgd2lkdGggb2YgdGhlIGJhciBzdHJva2VcbiAgICAgICAgICAgICAgIGJhclN0cm9rZVdpZHRoOiAyLFxuXG4gICAgICAgICAgICAgICAvL051bWJlciAtIFNwYWNpbmcgYmV0d2VlbiBlYWNoIG9mIHRoZSBYIHZhbHVlIHNldHNcbiAgICAgICAgICAgICAgIGJhclZhbHVlU3BhY2luZzogNSxcblxuICAgICAgICAgICAgICAgLy9OdW1iZXIgLSBTcGFjaW5nIGJldHdlZW4gZGF0YSBzZXRzIHdpdGhpbiBYIHZhbHVlc1xuICAgICAgICAgICAgICAgYmFyRGF0YXNldFNwYWNpbmc6IDEsXG5cbiAgICAgICAgICAgICAgIC8vU3RyaW5nIC0gQSBsZWdlbmQgdGVtcGxhdGVcbiAgICAgICAgICAgICAgIGxlZ2VuZFRlbXBsYXRlOiAnPHVsIGNsYXNzPVwidGMtY2hhcnQtanMtbGVnZW5kXCI+PCUgZm9yICh2YXIgaT0wOyBpPGRhdGFzZXRzLmxlbmd0aDsgaSsrKXslPjxsaT48c3BhbiBzdHlsZT1cImJhY2tncm91bmQtY29sb3I6PCU9ZGF0YXNldHNbaV0uZmlsbENvbG9yJT5cIj48L3NwYW4+PCVpZihkYXRhc2V0c1tpXS5sYWJlbCl7JT48JT1kYXRhc2V0c1tpXS5sYWJlbCU+PCV9JT48L2xpPjwlfSU+PC91bD4nXG4gICAgICAgICAgIH07XG4gICAgICB9XG4gICAgICAkc2NvcGUucHJlcGFyZVJ1bnNCeVRlYW1HcmFwaCA9IGZ1bmN0aW9uIChydW5zQWdhaW5zdFRlYW1zKXtcbiAgICAgICAgdmFyIHRlYW1zID0gW11cbiAgICAgICAgdmFyIHJ1bnMgPSBbXVxuICAgICAgICBmb3IodmFyIHRlYW0gaW4gcnVuc0FnYWluc3RUZWFtcykge1xuICAgICAgICAgIGlmKHJ1bnNBZ2FpbnN0VGVhbXMuaGFzT3duUHJvcGVydHkodGVhbSkpIHtcbiAgICAgICAgICAgIHRlYW1zLnB1c2godGVhbSk7XG4gICAgICAgICAgICBydW5zLnB1c2gocnVuc0FnYWluc3RUZWFtc1t0ZWFtXSlcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgJHNjb3BlLnRlYW1CYXJkYXRhID0ge1xuICAgICAgICAgICAgICAgbGFiZWxzOiB0ZWFtcyxcbiAgICAgICAgICAgICAgIGRhdGFzZXRzOiBbe1xuICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnUnVucyBPdmVyIHRoZSB5ZWFycycsXG4gICAgICAgICAgICAgICAgICAgZmlsbENvbG9yOiBbJ2JsdWUnXSxcbiAgICAgICAgICAgICAgICAgICBzdHJva2VDb2xvcjogJ3JnYmEoMjIwLDIyMCwyMjAsMSknLFxuICAgICAgICAgICAgICAgICAgIHBvaW50Q29sb3I6ICdyZ2JhKDIyMCwyMjAsMjIwLDEpJyxcbiAgICAgICAgICAgICAgICAgICBwb2ludFN0cm9rZUNvbG9yOiAnI2ZmZicsXG4gICAgICAgICAgICAgICAgICAgcG9pbnRIaWdobGlnaHRGaWxsOiAnI2ZmZicsXG4gICAgICAgICAgICAgICAgICAgcG9pbnRIaWdobGlnaHRTdHJva2U6ICdyZ2JhKDIyMCwyMjAsMjIwLDEpJyxcbiAgICAgICAgICAgICAgICAgICBkYXRhOiBydW5zXG4gICAgICAgICAgICAgICB9XVxuICAgICAgICAgICB9O1xuXG4gICAgICAgICAgIC8vIENoYXJ0LmpzIE9wdGlvbnNcbiAgICAgICAgICAgJHNjb3BlLnRlYW1CYXJvcHRpb25zID0ge1xuXG4gICAgICAgICAgICAgICAvLyBTZXRzIHRoZSBjaGFydCB0byBiZSByZXNwb25zaXZlXG4gICAgICAgICAgICAgICByZXNwb25zaXZlOiB0cnVlLFxuXG4gICAgICAgICAgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIHRoZSBzY2FsZSBzaG91bGQgc3RhcnQgYXQgemVybywgb3IgYW4gb3JkZXIgb2YgbWFnbml0dWRlIGRvd24gZnJvbSB0aGUgbG93ZXN0IHZhbHVlXG4gICAgICAgICAgICAgICBzY2FsZUJlZ2luQXRaZXJvOiB0cnVlLFxuXG4gICAgICAgICAgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIGdyaWQgbGluZXMgYXJlIHNob3duIGFjcm9zcyB0aGUgY2hhcnRcbiAgICAgICAgICAgICAgIHNjYWxlU2hvd0dyaWRMaW5lczogdHJ1ZSxcblxuICAgICAgICAgICAgICAgLy9TdHJpbmcgLSBDb2xvdXIgb2YgdGhlIGdyaWQgbGluZXNcbiAgICAgICAgICAgICAgIHNjYWxlR3JpZExpbmVDb2xvcjogXCJyZ2JhKDAsMCwwLC4wNSlcIixcblxuICAgICAgICAgICAgICAgLy9OdW1iZXIgLSBXaWR0aCBvZiB0aGUgZ3JpZCBsaW5lc1xuICAgICAgICAgICAgICAgc2NhbGVHcmlkTGluZVdpZHRoOiAxLFxuXG4gICAgICAgICAgICAgICAvL0Jvb2xlYW4gLSBJZiB0aGVyZSBpcyBhIHN0cm9rZSBvbiBlYWNoIGJhclxuICAgICAgICAgICAgICAgYmFyU2hvd1N0cm9rZTogdHJ1ZSxcblxuICAgICAgICAgICAgICAgLy9OdW1iZXIgLSBQaXhlbCB3aWR0aCBvZiB0aGUgYmFyIHN0cm9rZVxuICAgICAgICAgICAgICAgYmFyU3Ryb2tlV2lkdGg6IDIsXG5cbiAgICAgICAgICAgICAgIC8vTnVtYmVyIC0gU3BhY2luZyBiZXR3ZWVuIGVhY2ggb2YgdGhlIFggdmFsdWUgc2V0c1xuICAgICAgICAgICAgICAgYmFyVmFsdWVTcGFjaW5nOiA1LFxuXG4gICAgICAgICAgICAgICAvL051bWJlciAtIFNwYWNpbmcgYmV0d2VlbiBkYXRhIHNldHMgd2l0aGluIFggdmFsdWVzXG4gICAgICAgICAgICAgICBiYXJEYXRhc2V0U3BhY2luZzogMSxcblxuICAgICAgICAgICAgICAgLy9TdHJpbmcgLSBBIGxlZ2VuZCB0ZW1wbGF0ZVxuICAgICAgICAgICAgICAgbGVnZW5kVGVtcGxhdGU6ICc8dWwgY2xhc3M9XCJ0Yy1jaGFydC1qcy1sZWdlbmRcIj48JSBmb3IgKHZhciBpPTA7IGk8ZGF0YXNldHMubGVuZ3RoOyBpKyspeyU+PGxpPjxzcGFuIHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjo8JT1kYXRhc2V0c1tpXS5maWxsQ29sb3IlPlwiPjwvc3Bhbj48JWlmKGRhdGFzZXRzW2ldLmxhYmVsKXslPjwlPWRhdGFzZXRzW2ldLmxhYmVsJT48JX0lPjwvbGk+PCV9JT48L3VsPidcbiAgICAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgICRzY29wZS5wcmVwYXJlUnVuc0J5SW5uaW5nc0dyYXBoID0gZnVuY3Rpb24oZmlyc3RJbm5pbmdzLCBzZWNvbmRJbm5pbmdzKXtcbiAgICAgICAgJHNjb3BlLmlubmluaW5nc1J1bnNyZXNvdXJjZXMgPSBbe1xuICAgICAgICAgICAgICAgdmFsdWU6IGZpcnN0SW5uaW5ncyxcbiAgICAgICAgICAgICAgIGNvbG9yOiAnI0ZGRkYwMCcsXG4gICAgICAgICAgICAgICBoaWdobGlnaHQ6ICcjZTVlNTAwJyxcbiAgICAgICAgICAgICAgIGxhYmVsOiAnRmlyc3QgSW5uaW5ncydcbiAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgdmFsdWU6IHNlY29uZElubmluZ3MsXG4gICAgICAgICAgICAgICBjb2xvcjogJyM0NkJGQkQnLFxuICAgICAgICAgICAgICAgaGlnaGxpZ2h0OiAnIzVBRDNEMScsXG4gICAgICAgICAgICAgICBsYWJlbDogJ1NlY29uZCBJbm5pbmdzJ1xuICAgICAgICAgICB9XTtcblxuICAgICAgICAgICAvLyBDaGFydC5qcyBPcHRpb25zXG4gICAgICAgICAgICRzY29wZS5pbm5pbmluZ3NSdW5zb3B0aW9ucyA9IHtcblxuICAgICAgICAgICAgICAgLy8gU2V0cyB0aGUgY2hhcnQgdG8gYmUgcmVzcG9uc2l2ZVxuICAgICAgICAgICAgICAgcmVzcG9uc2l2ZTogdHJ1ZSxcblxuICAgICAgICAgICAgICAgLy9Cb29sZWFuIC0gV2hldGhlciB3ZSBzaG91bGQgc2hvdyBhIHN0cm9rZSBvbiBlYWNoIHNlZ21lbnRcbiAgICAgICAgICAgICAgIHNlZ21lbnRTaG93U3Ryb2tlOiB0cnVlLFxuXG4gICAgICAgICAgICAgICAvL1N0cmluZyAtIFRoZSBjb2xvdXIgb2YgZWFjaCBzZWdtZW50IHN0cm9rZVxuICAgICAgICAgICAgICAgc2VnbWVudFN0cm9rZUNvbG9yOiAnI2ZmZicsXG5cbiAgICAgICAgICAgICAgIC8vTnVtYmVyIC0gVGhlIHdpZHRoIG9mIGVhY2ggc2VnbWVudCBzdHJva2VcbiAgICAgICAgICAgICAgIHNlZ21lbnRTdHJva2VXaWR0aDogMixcblxuICAgICAgICAgICAgICAgLy9OdW1iZXIgLSBUaGUgcGVyY2VudGFnZSBvZiB0aGUgY2hhcnQgdGhhdCB3ZSBjdXQgb3V0IG9mIHRoZSBtaWRkbGVcbiAgICAgICAgICAgICAgIHBlcmNlbnRhZ2VJbm5lckN1dG91dDogNTAsIC8vIFRoaXMgaXMgMCBmb3IgUGllIGNoYXJ0c1xuXG4gICAgICAgICAgICAgICAvL051bWJlciAtIEFtb3VudCBvZiBhbmltYXRpb24gc3RlcHNcbiAgICAgICAgICAgICAgIGFuaW1hdGlvblN0ZXBzOiAxMDAsXG5cbiAgICAgICAgICAgICAgIC8vU3RyaW5nIC0gQW5pbWF0aW9uIGVhc2luZyBlZmZlY3RcbiAgICAgICAgICAgICAgIGFuaW1hdGlvbkVhc2luZzogJ2Vhc2VPdXRCb3VuY2UnLFxuXG4gICAgICAgICAgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIHdlIGFuaW1hdGUgdGhlIHJvdGF0aW9uIG9mIHRoZSBEb3VnaG51dFxuICAgICAgICAgICAgICAgYW5pbWF0ZVJvdGF0ZTogdHJ1ZSxcblxuICAgICAgICAgICAgICAgLy9Cb29sZWFuIC0gV2hldGhlciB3ZSBhbmltYXRlIHNjYWxpbmcgdGhlIERvdWdobnV0IGZyb20gdGhlIGNlbnRyZVxuICAgICAgICAgICAgICAgYW5pbWF0ZVNjYWxlOiBmYWxzZSxcblxuICAgICAgICAgICAgICAgLy9TdHJpbmcgLSBBIGxlZ2VuZCB0ZW1wbGF0ZVxuICAgICAgICAgICAgICAgbGVnZW5kVGVtcGxhdGU6ICc8dWwgY2xhc3M9XCJ0Yy1jaGFydC1qcy1sZWdlbmRcIj48JSBmb3IgKHZhciBpPTA7IGk8c2VnbWVudHMubGVuZ3RoOyBpKyspeyU+PGxpPjxzcGFuIHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjo8JT1zZWdtZW50c1tpXS5maWxsQ29sb3IlPlwiPjwvc3Bhbj48JWlmKHNlZ21lbnRzW2ldLmxhYmVsKXslPjwlPXNlZ21lbnRzW2ldLmxhYmVsJT48JX0lPjwvbGk+PCV9JT48L3VsPidcblxuICAgICAgICAgICB9O1xuXG4gICAgICB9XG5cbiAgICAgICRzY29wZS5wcmVwYXJlQXZlcmFnZUJ5SW5uaW5nc0dyYXBoID0gZnVuY3Rpb24ocnVuc0ZpcnN0SW5uaW5ncyxmaXJzdElubmluZ3MsZmlyc3RJbm5pbmdzTm90b3V0cyxydW5zU2Vjb25kSW5uaW5ncywgc2Vjb25kSW5uaW5ncyxzZWNvbmRJbm5pbmdzTm90b3V0cyl7XG4gICAgICAgIHZhciBmaXJzdElubmluZ3NBdmVyYWdlID0gcnVuc0ZpcnN0SW5uaW5ncyAvIChmaXJzdElubmluZ3MgLSBmaXJzdElubmluZ3NOb3RvdXRzKTtcbiAgICAgICAgdmFyIHNlY29uZElubmluZ3NBdmVyYWdlID0gcnVuc1NlY29uZElubmluZ3MgLyAoc2Vjb25kSW5uaW5ncyAtIHNlY29uZElubmluZ3NOb3RvdXRzKTtcblxuICAgICAgICAkc2NvcGUuYXZlcmFnZURhdGEgPSBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgdmFsdWU6IGZpcnN0SW5uaW5nc0F2ZXJhZ2UudG9GaXhlZCgyKSxcbiAgICAgICAgICAgIGNvbG9yOicjRjc0NjRBJyxcbiAgICAgICAgICAgIGhpZ2hsaWdodDogJyNGRjVBNUUnLFxuICAgICAgICAgICAgbGFiZWw6ICdBdmVyYWdlIGluIEZpcnN0IElubmluZ3MnXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICB2YWx1ZTogc2Vjb25kSW5uaW5nc0F2ZXJhZ2UudG9GaXhlZCgyKSxcbiAgICAgICAgICAgIGNvbG9yOiAnI0ZEQjQ1QycsXG4gICAgICAgICAgICBoaWdobGlnaHQ6ICcjRkZDODcwJyxcbiAgICAgICAgICAgIGxhYmVsOiAnQXZlcmFnZSBpbiBTZWNvbmQgSW5uaW5ncydcbiAgICAgICAgICB9XG4gICAgICAgIF07XG5cbiAgICAgICAgLy8gQ2hhcnQuanMgT3B0aW9uc1xuICAgICAgICAkc2NvcGUuYXZlcmFnZU9wdGlvbnMgPSAge1xuXG4gICAgICAgICAgLy8gU2V0cyB0aGUgY2hhcnQgdG8gYmUgcmVzcG9uc2l2ZVxuICAgICAgICAgIHJlc3BvbnNpdmU6IHRydWUsXG5cbiAgICAgICAgICAvL0Jvb2xlYW4gLSBXaGV0aGVyIHdlIHNob3VsZCBzaG93IGEgc3Ryb2tlIG9uIGVhY2ggc2VnbWVudFxuICAgICAgICAgIHNlZ21lbnRTaG93U3Ryb2tlIDogdHJ1ZSxcblxuICAgICAgICAgIC8vU3RyaW5nIC0gVGhlIGNvbG91ciBvZiBlYWNoIHNlZ21lbnQgc3Ryb2tlXG4gICAgICAgICAgc2VnbWVudFN0cm9rZUNvbG9yIDogJyNmZmYnLFxuXG4gICAgICAgICAgLy9OdW1iZXIgLSBUaGUgd2lkdGggb2YgZWFjaCBzZWdtZW50IHN0cm9rZVxuICAgICAgICAgIHNlZ21lbnRTdHJva2VXaWR0aCA6IDIsXG5cbiAgICAgICAgICAvL051bWJlciAtIFRoZSBwZXJjZW50YWdlIG9mIHRoZSBjaGFydCB0aGF0IHdlIGN1dCBvdXQgb2YgdGhlIG1pZGRsZVxuICAgICAgICAgIHBlcmNlbnRhZ2VJbm5lckN1dG91dCA6IDAsIC8vIFRoaXMgaXMgMCBmb3IgUGllIGNoYXJ0c1xuXG4gICAgICAgICAgLy9OdW1iZXIgLSBBbW91bnQgb2YgYW5pbWF0aW9uIHN0ZXBzXG4gICAgICAgICAgYW5pbWF0aW9uU3RlcHMgOiAxMDAsXG5cbiAgICAgICAgICAvL1N0cmluZyAtIEFuaW1hdGlvbiBlYXNpbmcgZWZmZWN0XG4gICAgICAgICAgYW5pbWF0aW9uRWFzaW5nIDogJ2Vhc2VPdXRCb3VuY2UnLFxuXG4gICAgICAgICAgLy9Cb29sZWFuIC0gV2hldGhlciB3ZSBhbmltYXRlIHRoZSByb3RhdGlvbiBvZiB0aGUgRG91Z2hudXRcbiAgICAgICAgICBhbmltYXRlUm90YXRlIDogdHJ1ZSxcblxuICAgICAgICAgIC8vQm9vbGVhbiAtIFdoZXRoZXIgd2UgYW5pbWF0ZSBzY2FsaW5nIHRoZSBEb3VnaG51dCBmcm9tIHRoZSBjZW50cmVcbiAgICAgICAgICBhbmltYXRlU2NhbGUgOiBmYWxzZSxcblxuICAgICAgICAgIC8vU3RyaW5nIC0gQSBsZWdlbmQgdGVtcGxhdGVcbiAgICAgICAgICBsZWdlbmRUZW1wbGF0ZSA6ICc8dWwgY2xhc3M9XCJ0Yy1jaGFydC1qcy1sZWdlbmRcIj48JSBmb3IgKHZhciBpPTA7IGk8c2VnbWVudHMubGVuZ3RoOyBpKyspeyU+PGxpPjxzcGFuIHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjo8JT1zZWdtZW50c1tpXS5maWxsQ29sb3IlPlwiPjwvc3Bhbj48JWlmKHNlZ21lbnRzW2ldLmxhYmVsKXslPjwlPXNlZ21lbnRzW2ldLmxhYmVsJT48JX0lPjwvbGk+PCV9JT48L3VsPidcblxuICAgICAgICB9O1xuICAgICAgfVxuXG5cblxuXG59KVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
