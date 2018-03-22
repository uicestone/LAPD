(function () {
    'use strict';

    var api = 'http://localhost:8082/api/';

    // add raw response as an attribute of resource,
    // so that we can get http status, header etc from resource in controllers
    var responseInterceptor = function (response) {
        response.resource.$total = Number(response.headers('items-total'));
        response.resource.$start = Number(response.headers('items-start'));
        response.resource.$end = Number(response.headers('items-end'));
        return response.resource;
    };

    angular.module('app')
        .service('socketIoService', socketIoService)
        .service('httpInterceptorService', ['$q', '$window', '$location', '$injector', httpInterceptorService])
        .service('authService', ['$window', 'userService', authService])
        .service('qaService', ['$resource', 'Upload', qaService])
        .service('sessionService', ['$resource', sessionService])
        .service('userService', ['$resource', 'userRolesConstant', userService])
        .service('wechatService', ['$http', wechatService])
        .constant('userRolesConstant', [
            {name: 'admin', label: '管理员', abilities: ['list-user']}
        ]);

    function socketIoService () {
        var socket = new io(api.replace('/api/', ''));
        return socket;
    }

    function httpInterceptorService($q, $window, $location, $injector) {
        return {
            request: function(config) {

                if(config && config.cache === undefined){

                    var token = $window.localStorage.getItem('token');

                    if(token) {
                        config.headers['Authorization'] = token;
                    }

                    return config;
                }

                return config || $q.when(config);
            },
            requestError: function(rejection) {
                return $q.reject(rejection);
            },
            response: function(response) {
                return response || $q.when(response);
            },
            responseError: function(rejection) {

                if(rejection.status === 401){
                    $window.localStorage.removeItem('token');
                    $location.path('/signin');
                }

                var $mdToast = $injector.get('$mdToast');

                if(rejection.data && rejection.data.message) {
                    $mdToast.showSimple(rejection.data.message);
                }
                else {
                    $mdToast.showSimple('网络错误');
                }

                return $q.reject(rejection);
            }
        };
    }

    function authService($window, userService) {

        var user = new userService();

        this.login = function(username, password) {
            return userService.login({username: username, password: password}, function(user) {
                $window.localStorage.setItem('token', user.token);
            });
        };

        this.logout = function() {
            return userService.logout();
        };

        this.user = function() {
            if(!$window.localStorage.getItem('token')) {
                user.$resolved = true;
                return user;
            }

            return userService.auth();
        }
    }

    function qaService($resource, Upload) {

        var qa = $resource(api + 'qa/:id', {id: '@_id'}, {
            get: {method: 'GET'},
            query: {method: 'GET', isArray: true, interceptor: {response: responseInterceptor}},
            create: {method: 'POST'},
            update: {method: 'PUT'}
        });
        
        // Angular mix PUT and POST methot to $save,
        // we seperate them to $create and $update here
        qa.prototype.$save = function (a, b, c, d) {
            if (this._id) {
                return this.$update(a, b, c, d);
            }
            else {
                return this.$create(a, b, c, d);
            }
        }

        qa.import = function (file, data) {

            if (!data) {
                data = {};
            }

            data.file = file;
            
            return Upload.upload({
                url: api + 'qa',
                data: data
            })
        };

        return qa;
    }

    function sessionService($resource, Upload) {

        var session = $resource(api + 'session/:id', {id: '@_id'}, {
            get: {method: 'GET'},
            query: {method: 'GET', isArray: true, interceptor: {response: responseInterceptor}},
            create: {method: 'POST'},
            update: {method: 'PUT'}
        });
        
        // Angular mix PUT and POST methot to $save,
        // we seperate them to $create and $update here
        session.prototype.$save = function (a, b, c, d) {
            if (this._id) {
                return this.$update(a, b, c, d);
            }
            else {
                return this.$create(a, b, c, d);
            }
        }

        return session;
    }

    function userService($resource, userRolesConstant) {

        var user = $resource(api + 'user/:id', {id: '@_id'}, {
            query: {method: 'GET', isArray: true, interceptor: {response: responseInterceptor}},
            create: {method: 'POST'},
            update: {method: 'PUT'},
            auth: {method: 'GET', url: api + 'auth/user'},
            login: {method: 'POST', url: api + 'auth/login'},
            logout: {method: 'GET', 'url': api + 'auth/logout'}
        });
        
        // Angular mix PUT and POST methot to $save,
        // we seperate them to $create and $update here
        user.prototype.$save = function (a, b, c, d) {
            if (this._id) {
                return this.$update(a, b, c, d);
            }
            else {
                return this.$create(a, b, c, d);
            }
        }

        var roles = userRolesConstant;

        user.prototype.can = function(ability) {
            
            var abilities;
            var _self = this;

            if(!this.roles) {
                return false;
            }

            abilities = roles.filter(function(role) {
                return _self.roles.indexOf(role.name) > -1;
            }).reduce(function(previous, current) {
                return previous.concat(current.abilities);
            }, []);

            return abilities.indexOf(ability) > -1;
        }
        
        return user;
    }

    function wechatService($http) {
        this.inviteKf = function (wxAccount, kfAccount) {
            console.log(wxAccount, kfAccount);
            $http.post(api + 'wechat/customservice/invite', {
                kfAccount: kfAccount,
                wxAccount: wxAccount
            });
        }
    }   

})(); 