module.exports = function() {
    var admin = 'admin',
        adminApp = 'admin/app'
        adminDist = 'admin/dist',
        tmp = '.tmp';
    var config = {
        admin: admin,
        adminDist: adminDist,
        tmp: tmp,
        adminIndex: admin + "/index.html",
        alljs: [
            admin + "/app/**/*.js",
            './*.js'
        ],
        adminAssetsToCopy: [
            tmp + "/bower_components/font-awesome/css/*", 
            tmp + "/bower_components/font-awesome/fonts/*", 
            tmp + '/bower_components/webfontloader/webfontloader.js',
            admin + "/app/**/*.html",
            admin + '/assets/**/*',
            admin + '/data/**/*',
            admin + '/vendors/**/*',
            admin + "/styles/loader.css", 
            admin + "/styles/ui/images/*", 
            admin + "/favicon.ico"
        ],
        less: [],
        sass: [
            admin + "/styles/**/*.scss"
        ],
        adminJs: [
            adminApp + "/**/*.module.js",
            adminApp + "/**/*.js",
            '!' + adminApp + "/**/*.spec.js"
        ],
        allToClean: [
            tmp, 
            ".DS_Store",
            ".sass-cache",
            "node_modules",
            ".git",
            tmp + "/bower_components",
            "readme.md"
        ]
    };

    return config;
};