(function () {
    'use strict';

    angular.module('app.user')
    .controller('userListCtrl', ['$scope', '$location', '$route', '$mdBottomSheet', 'userService', 'userRolesConstant', userListCtrl])
    .controller('userDetailCtrl', ['$scope', '$route', 'userService', 'userRolesConstant', userDetailCtrl])
    .controller('userBottomSheetCtrl', ['$scope', '$route', '$mdBottomSheet', 'userService', 'userRolesConstant', 'user', 'users', 'roleLabels', userBottomSheetCtrl]);

    function userListCtrl($scope, $location, $route, $mdBottomSheet, userService, userRolesConstant) {

        $scope.query = angular.extend({page:1, limit: 20}, $location.search());

        $scope.roleLabels = {};

        userRolesConstant.forEach(function (role) {
            $scope.roleLabels[role.name] = role.label;
        });

        $scope.userType = $location.search().roles ? $scope.roleLabels[$location.search().roles] : '所有用户';

        $scope.getUsers = function() {
            $scope.promise = userService.query($scope.query).$promise.then(function(users) {
                $scope.users = users;
            });
        };

        $scope.getUsers();

        $scope.showUserDetail = function (user) {
            $location.url('/user/' + user._id);
        };

        $scope.editUser = function (user) {
            if(!user) {
                user = new userService();
                user.roles = [$route.current.params.roles];
                user.institution = $scope.institution;
            }

            $mdBottomSheet.show({
                templateUrl: 'app/user/user-bottom-sheet.html',
                controller: 'userBottomSheetCtrl',
                locals: {user: user, users: $scope.users, roleLabels: $scope.roleLabels}
            });
        };

    }

    function userDetailCtrl($scope, $route, userService, userRolesConstant) {

        $scope.user = userService.get({id:$route.current.params.id});

        $scope.roles = userRolesConstant;

        $scope.$watch('user', function (newValue, oldValue) {
            if (oldValue.$resolved) {
                $scope.userChanged = true;
            }
        }, true);

        $scope.roleLabels = {};

        userRolesConstant.forEach(function (role) {
            $scope.roleLabels[role.name] = role.label;
        });
        
        $scope.updateUser = function (user) {
            user.$save();
        };

        $scope.editLog = function (log) {
            if(!log) {
                log = new logService();
                log.user = $scope.user;
            }

            $scope.log = log;

            $mdBottomSheet.show({
                templateUrl: 'app/user/log-bottom-sheet.html',
                scope: $scope,
                preserveScope: true
            });
        };

        $scope.updateLog = function (log) {
            $mdBottomSheet.hide();
            log.$save();
            if(!log._id) {
                $scope.logs.push(log);
            }
        };
    }

    function userBottomSheetCtrl ($scope, $route, $mdBottomSheet, userService, userRolesConstant, user, users, roleLabels) {
        $scope.user = user;
        $scope.users = users;
        $scope.roles = userRolesConstant;
        $scope.roleLabels = roleLabels;

        $scope.$watch('user', function (newUser, oldUser) {
            if (!angular.equals(newUser, oldUser)) {
                $scope.userChanged = true;
            }
        }, true);

        $scope.updateUser = function (user) {
            $mdBottomSheet.hide();
            user.$save();
            if(!user._id) {
                $scope.users.push(user);
            }
        };

    }

})(); 



