angular.module('app')
    .controller('centuryStatsCtrl', function($scope) {
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


    })
