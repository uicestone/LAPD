(function () {
    'use strict';

    angular.module('app.qa')
    .controller('qaListCtrl', ['$scope', '$location', '$route', '$mdBottomSheet', 'qaService', qaListCtrl]);

    function qaListCtrl($scope, $location, $route, $mdBottomSheet, qaService) {

        $scope.query = angular.extend({page:1, limit: 20}, $location.search());

        $scope.getQas = function() {
            $scope.promise = qaService.query($scope.query).$promise.then(function(qas) {
                $scope.qas = qas;
            });
        };

        $scope.getQas();
    }

})(); 



