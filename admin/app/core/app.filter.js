(function () {
    'use strict';

    angular.module('app')
        .filter('friendlyDisplay', friendlyDisplay)
        .filter('htmlToPlainText', htmlToPlainText)
        .filter('select', select);

    function friendlyDisplay() {
        return function(input) {
            if (typeof input === 'boolean') {
                return input ? '是' : '否';
            }
            if (angular.isArray(input)) {
                return input.join(', ');
            }
            return input;
        }
    }


    function htmlToPlainText () {
        return function(text) {
            return  text ? String(text).replace(/<[^>]+>/gm, '') : '';
        };
    }
 
    function select () {
        return function(array, key) {
            return array.map(function (item) {
                return item[key];
            });
        };
    }

})(); 


