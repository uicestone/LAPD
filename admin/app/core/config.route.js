(function () {
    'use strict';

    angular.module('app')
        .config(['$routeProvider',
            function($routeProvider) {
                
                $routeProvider
                    .when('/', {redirectTo: '/welcome'})
                    .when('/welcome', {
                        templateUrl: 'app/page/welcome.html'
                    })
                    .when('/dashboard', {
                        templateUrl: 'app/dashboard/dashboard.html'
                    })
                    .when('/signin', {
                        templateUrl: 'app/user/signin.html'
                    })
                    .when('/profile', {
                        templateUrl: 'app/user/profile.html'
                    })
                    .when('/user/list', {
                        templateUrl: 'app/user/list.html'
                    })
                    .when('/user/:id', {
                        templateUrl: 'app/user/detail.html'
                    })
                    .when('/qa/list', {
                        templateUrl: 'app/qa/list.html'
                    })
                    .when('/qa/:id', {
                        templateUrl: 'app/qa/detail.html'
                    })
                    .when('/session/list', {
                        templateUrl: 'app/session/list.html'
                    })
                    .when('/session/:id', {
                        templateUrl: 'app/session/detail.html'
                    })
                    .when('/404', {
                        templateUrl: 'app/page/404.html'
                    })
                    .when('/500', {
                        templateUrl: 'app/page/500.html'
                    })
                    .otherwise('/404');
                    
            }
        ]);

})(); 