angular.module('app')
    .directive('legends', function() {
        return {
            restrict: 'EA',
            scope: {
                description: '@',
                color: '@'
            },
            templateUrl: 'partials/legends.html'
        };
    });
