const gulp = require('gulp');
const args = require('yargs').argv;
const browserSync = require('browser-sync');
const config = require('./gulp.config')();
const del = require('del');
const $ = require('gulp-load-plugins')({lazy: true});
const env = require('node-env-file');
const merge = require('merge-stream');

env(`${__dirname}/.env`);

gulp.task('help', $.taskListing);
gulp.task('default', ['help']);

gulp.task('vet', function() {
    log('Analyzing source with JSHint and JSCS');

    return gulp
        .src(config.alljs)
        .pipe($.if(args.verbose, $.print()))
        .pipe($.jscs())
        .pipe($.jshint())
        .pipe($.jshint.reporter('jshint-stylish', {verbose: true}))
        .pipe($.jshint.reporter('fail'));
});

gulp.task('clean-tmp', function(done) {
    const files = config.tmp;
    clean(files, done);
});

gulp.task('clean', function(done) {
    const delconfig = [].concat(config.adminDist, config.appDist, config.tmp);
    log('Cleaning ' + $.util.colors.blue(delconfig));
    del(delconfig, done);
});

gulp.task('clean-all', function(done) {
    const delconfig = config.allToClean;
    log('Cleaning ' + $.util.colors.blue(delconfig));
    clean(delconfig, done);
});

gulp.task('jade-docs', function() {
    log('Compiling docs jade --> html');

    const options = {
        pretty: false
    }

    return gulp
        .src(config.docsJade)
        .pipe($.plumber({errorHandler: swallowError}))
        .pipe($.jade(options))
        .pipe(gulp.dest(config.docs));
});

gulp.task('less', function() {
    log('Compiling Less --> CSS');

    return gulp
        .src(config.less)
        .pipe($.plumber({errorHandler: swallowError}))
        .pipe($.less())
        .pipe($.autoprefixer())
        .pipe(gulp.dest(config.tmp));
});

gulp.task('less-watcher', function() {
    gulp.watch([config.less], {interval: 500}, ['less']);
});

gulp.task('sass', function() {
    log('Compiling Sass --> CSS');

    const sassOptions = {
        outputStyle: 'compressed' // nested, expanded, compact, compressed
    };

    return gulp
        .src(config.sass)
        .pipe($.plumber({errorHandler: swallowError}))
        .pipe($.sourcemaps.init())
        .pipe($.sass(sassOptions))
        .pipe($.autoprefixer())
        .pipe($.sourcemaps.write())
        .pipe(gulp.dest(config.tmp + '/styles'));
});

gulp.task('sass-min', function() {
    log('Compiling Sass --> minified CSS');

    const sassOptions = {
        outputStyle: 'nested' // nested, expanded, compact, compressed
    };

    return gulp
        .src(config.sass)
        .pipe($.plumber({errorHandler: swallowError}))
        .pipe($.sass(sassOptions))
        .pipe($.autoprefixer())
        .pipe(gulp.dest(config.tmp + '/styles'));    
})

gulp.task('sass-watcher', function() {
    gulp.watch([config.sass], {interval: 500}, ['sass']);
});

gulp.task('inject-admin', function() {
    log('Injecting admin custom scripts to index.html');

    return gulp
        .src(config.adminIndex)
        .pipe( $.inject(gulp.src(config.adminJs), {relative: true}) )
        .pipe(gulp.dest(config.admin));
});

gulp.task('copy-admin', function() {
    log('Copying admin assets');

    const adminAssets = [].concat(config.adminAssetsToCopy);
    
    const copyAdminAssetsTmp = gulp
        .src(adminAssets.filter(path => path.indexOf(config.tmp) === 0), {base: config.tmp})
        .pipe(gulp.dest(config.adminDist + '/'));
    
    const copyAdminAssetsAdmin = gulp
        .src(adminAssets.filter(path => path.indexOf(config.admin) === 0), {base: config.admin})
        .pipe(gulp.dest(config.adminDist + '/'));

    return merge(copyAdminAssetsAdmin, copyAdminAssetsTmp);
});

gulp.task('optimize-admin', ['inject-admin', 'sass-min'], function() {
    log('Optimizing admin js, css, html');

    const adminJsFilter = $.filter('admin/scripts/*.js', { restore: true });
    const adminIndexHtmlFilter = $.filter(['admin/scripts/*.js', 'admin/styles/*.css', '!**/index.html'], { restore: true });

    return gulp
        .src(config.adminIndex)
        .pipe($.plumber({errorHandler: swallowError}))
        .pipe($.useref())
        .pipe(adminJsFilter)
        .pipe($.if('scripts/app.js', $.uglify()))
        .pipe($.replace(/http:\/\/localhost:8082\/api\//g, process.env.API_BASE))
        .pipe(adminJsFilter.restore)
        .pipe($.replace(/\.html(?=[\'\"])/g, '.html?v=' + (new Date()).getTime()))
        .pipe($.replace(/\.json(?=[\'\"])/g, '.json?v=' + (new Date()).getTime()))
        .pipe(adminIndexHtmlFilter)
        .pipe($.rev())                // Rename the concatenated files (but not index.html)
        .pipe(adminIndexHtmlFilter.restore)
        .pipe($.revReplace())         // Substitute in new filenames
        .pipe(gulp.dest( config.adminDist ));
});

gulp.task('build-admin', ['optimize-admin', 'copy-admin']);

gulp.task('serve-admin', ['inject-admin', 'sass'], function() {
    startBrowserSync('admin');
});


function clean(path, done) {
    log('Cleaning: ' + $.util.colors.blue(path));
    del(path, done);
}

function log(msg) {
    if (typeof(msg) === 'object') {
        for (const item in msg) {
            if (msg.hasOwnProperty(item)) {
                $.util.log($.util.colors.green(msg[item]));
            }
        }
    } else {
        $.util.log($.util.colors.green(msg));
    }
}

function swallowError (error) {
    // If you want details of the error in the console
    console.log(error.toString());

    this.emit('end');
}

function startBrowserSync(opt) {
    if (args.nosync || browserSync.active) {
        return;
    }

    let options = {
        port: 3000,
        ghostMode: {
            clicks: false,
            location: false,
            forms: false,
            scroll: true
        },
        injectChanges: true,
        logFileChanges: true,
        logLevel: 'debug',
        logPrefix: 'gulp-patterns',
        notify: true,
        reloadDelay: 0, //1000,
        online: false
    };

    switch(opt) {
        case 'admin':
            log('Serving admin');
            serveAdmin();
            break;
        default:
            log('Serving app');
            serveApp();
            break;
    }

    function serveAdmin() {
        gulp.watch([config.sass], {interval: 500}, ['sass']);

        options.server = {
            baseDir: [
                config.admin,
                config.tmp
            ]
        };
        options.files = [
            config.admin + '/**/*.*',
            '!' + config.sass,
            config.tmp + '/**/*.css'
        ];
        options.open = false;

        browserSync(options);
    }

    function serveApp() {
        gulp.watch([config.sass], {interval: 500}, ['sass']);

        options.server = {
            baseDir: [
                config.app,
                config.tmp
            ]
        };
        options.files = [
            config.app + '/**/*.*',
            '!' + config.sass,
            config.tmp + '/**/*.css'
        ];
        options.open = false;

        browserSync(options);
    }
}


