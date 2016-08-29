angular.module('app')
    .directive('careerStats', function() {
        return {
            restrict: 'E',
            scope: {
                stats: '=item',
            },
            templateUrl: 'partials/careerStats.html'
        };
    });
