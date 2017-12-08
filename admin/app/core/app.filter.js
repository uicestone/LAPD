(function () {
    'use strict';

    angular.module('app')
        .filter('friendlyDisplay', friendlyDisplay)
        .filter('htmlToPlainText', htmlToPlainText);

    function friendlyDisplay() {
        return function(input) {
            if(typeof input === 'boolean') {
                return input ? '是' : '否';
            }
            else {
                return input;
            }
        }
    }


    function htmlToPlainText () {
        return function(text) {
            return  text ? String(text).replace(/<[^>]+>/gm, '') : '';
        };
    }
 
})(); 


