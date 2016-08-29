angular.module('app')
    .directive('centuryStats', function() {
        return {
            restrict: 'E',
            scope: {
                centuryStats: '=item',
            },
            templateUrl: 'partials/centuryStats.html',
            controller: 'centuryStatsCtrl'
        };
    });
