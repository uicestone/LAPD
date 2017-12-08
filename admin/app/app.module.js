(function () {
    'use strict';

    angular.module('app', [
        // Core modules
         'app.core'
        
        // Custom Feature modules
        ,'app.page'
        ,'app.qa'
        ,'app.user'
        ,'app.dashboard'
        
        // 3rd party feature modules
        ,'md.data.table'
    ]);

})();

