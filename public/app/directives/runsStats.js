angular.module('app')
    .directive('runsStats', function() {
        return {
            restrict: 'E',
            scope: {
                runsStats: '=item',
            },
            templateUrl: 'partials/runsStats.html',
            controller: 'runsStatsCtrl'
        };
    });
