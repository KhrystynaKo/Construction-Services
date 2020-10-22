const dist = "dist";
const source = "src";

const path = {
  build: {
    html: dist + "/",
    css: dist + "/css/",
    js: dist + "/js/",
    img: dist + "/img/",
  },
  src: {
    html: [source + "/*.html", "!" + source + "/_*.html"],
    css: source + "/assets/scss/style.scss",
    js: source + "/js/index.js",
    img: source + "/assets/img/**/*.{jpg,png,svg,gif,ico,webp}",
  },
  watching: {
    html: source + "/**/*.html",
    css: source + "/assets/scss/**/*.scss",
    js: source + "/js/**/*.js",
    img: source + "/assets/img/**/*.{jpg,png,svg,gif,ico,webp}",
  },
  clean: "./" + dist + "/",
};

const { watch, src, dest, parallel, series } = require("gulp");
const gulp = require("gulp");
const browsersync = require("browser-sync").create();
const fileinclude = require("gulp-file-include");
const del = require("del");
const scss = require("gulp-sass");
const autoprefixer = require("gulp-autoprefixer");
const sortCSSmq = require("gulp-group-css-media-queries");
const cleanCSS = require("gulp-clean-css");
const rename = require("gulp-rename");
const csscomb = require("gulp-csscomb");
const webpack = require("webpack-stream");
const imagemin = require("gulp-imagemin");

function browserSync(params) {
  browsersync.init({
    server: {
      baseDir: "./" + dist + "/",
    },
    port: 3000,
    notify: false,
  });
}

function html() {
  return src(path.src.html)
    .pipe(fileinclude())
    .pipe(dest(path.build.html))
    .pipe(browsersync.stream());
}

function js() {
  return src(path.src.js)
    .pipe(fileinclude())
    .pipe(
      webpack({
        mode: "development",
        output: {
          filename: "index.js",
        },
        watch: false,
        devtool: "source-map",
        module: {
          rules: [
            {
              test: /\.m?js$/,
              exclude: /(node_modules|bower_components)/,
              use: {
                loader: "babel-loader",
                options: {
                  presets: [
                    [
                      "@babel/preset-env",
                      {
                        debug: true,
                        corejs: 3,
                        useBuiltIns: "usage",
                      },
                    ],
                  ],
                },
              },
            },
          ],
        },
      })
    )
    .pipe(dest(path.build.js))
    .pipe(browsersync.stream());
}

function css() {
  return src(path.src.css)
    .pipe(
      scss({
        outputStyle: "expanded",
      }).on("error", scss.logError)
    )
    .pipe(sortCSSmq())
    .pipe(
      autoprefixer({
        overrideBrowserslist: ["last 5 versions", "> 1%"],
        cascade: true,
      })
    )
    .pipe(csscomb())
    .pipe(dest(path.build.css))
    .pipe(cleanCSS())
    .pipe(
      rename({
        extname: ".min.css",
      })
    )
    .pipe(dest(path.build.css))
    .pipe(browsersync.stream());
}

function images() {
  return src(path.src.img)
    .pipe(dest(path.build.img))
    .pipe(src(path.src.img))
    .pipe(
      imagemin({
        progressive: true,
        svgoPlugins: [{ removeViewBox: false }],
        optimizationLevel: 3,
        interlaced: true,
      })
    )
    .pipe(dest(path.build.img))
    .pipe(browsersync.stream());
}

function watchFiles(params) {
  watch([path.watching.html], html);
  watch([path.watching.css], css);
  watch([path.watching.js], js);
  watch([path.watching.img], images);
}

function clean(params) {
  return del(path.clean);
}

let build = series(clean, parallel(css, html, js, images));
let watching = parallel(build, watchFiles, browserSync);

exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watching = watching;
exports.default = watching;

// exports.default = series(html, parallel(browserSync));
