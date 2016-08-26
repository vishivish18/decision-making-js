angular.module('app')
    .controller('runsStatsCtrl', function($scope) {
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


})
