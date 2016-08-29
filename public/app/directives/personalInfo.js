angular.module('app')
    .directive('personalInfo', function() {
        return {
            restrict: 'E',
            templateUrl: 'partials/personalInfo.html'
        };
    });
