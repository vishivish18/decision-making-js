angular.module('app')
    .controller('homeCtrl', function($scope, $http, dataMutator) {
        $scope.setup = function() {
            // get the csv data from dataMutator service
            dataMutator.getData()
                .then(function(response) {
                    // convert the csv data to JSON
                    dataMutator.csvToJSON(response.data, function(json) {
                        // pass the converted JSON data to getCareerStats function for manipulation
                        dataMutator.getCareerStats(json, function(stats) {
                            $scope.stats = stats;
                        });
                    });
                }, function(err) {
                    console.error(err);
                });
        };
        $scope.setup();
    });
