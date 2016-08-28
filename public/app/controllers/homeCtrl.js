angular.module('app')
    .controller('homeCtrl', function($scope, $http, dataMutator) {
        $scope.setup = function() {
          dataMutator.getData()
          .then(function(response) {
                dataMutator.csvToJSON(response.data, function(json){
                    dataMutator.getCareerStats(json, function(stats){
                      $scope.stats = stats
                    })
                })
          }, function(err) {
                console.error(err)
          });
        }
        $scope.setup();
    })
