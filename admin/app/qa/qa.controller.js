(function () {
    'use strict';

    angular.module('app.qa')
    .controller('qaListCtrl', ['$scope', '$location', '$route', '$mdBottomSheet', 'qaService', qaListCtrl])
    .controller('qaDetailCtrl', ['$scope', '$location', '$route', '$mdBottomSheet', 'qaService', qaDetailCtrl]);

    function qaListCtrl($scope, $location, $route, $mdBottomSheet, qaService) {

        $scope.query = angular.extend({page:1, limit: 20}, $location.search());

        $scope.getQas = function() {
            $scope.promise = qaService.query($scope.query).$promise.then(function(qas) {
                $scope.qas = qas;
            });
        };

        $scope.getQas();

        $scope.search = function () {
            // delete $scope.query.page;
            // delete $scope.query.limit;
            $location.search($scope.query);
        }

        $scope.showDetail = function (qa) {
            $location.url('qa/' + qa._id);
        }

        $scope.saveQa = function (qa) {
            qa.$save();
        }
    }

    function qaDetailCtrl($scope, $location, $route, $mdBottomSheet, qaService) {
        $scope.qa = qaService.get({id: $route.current.params.id});
        
        $scope.saveQa = function () {
            $scope.qa.$save();
        }

        $scope.$watch('qa', function (newValue, oldValue) {
            if (oldValue.$resolved) {
                $scope.qaChanged = true;
            }
        }, true)
    }

})(); 



