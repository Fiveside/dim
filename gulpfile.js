const gulp = require("gulp");
const ts = require("gulp-typescript");
const del = require("del");
const sourcemaps = require("gulp-sourcemaps");
const runElectron = require("gulp-run-electron");

gulp.task("default", ["launch"]);
gulp.task("dev", ["clean"], () => gulp.run(["watch", "launch"]));
gulp.task("package", ["clean"], () => gulp.run(["static", "compile"]));

const PATHS = {
  staticSrc: [
    "package.json",
    "index.html",
    "test.html",
    "app.css",
  ],
  build: "build",
  staticDest: "build",
  vendorSrc: ["src/vendor/**/*.js"],
  vendorDest: "build/vendor",
  project: "tsconfig.json",
};

gulp.task("clean", () => {
  return del("build");
});

gulp.task("static", ["static:assets", "static:vendor"]);
gulp.task("static:assets", () => {
  return gulp.src(PATHS.staticSrc)
  .pipe(gulp.dest(PATHS.staticDest));
});
gulp.task("static:vendor", () => {
  return gulp.src(PATHS.vendorSrc)
  .pipe(gulp.dest(PATHS.vendorDest));
});

gulp.task("watch", ["static", "compile"], () => {
  gulp.watch(PATHS.staticSrc, ["static:assets"]);
  gulp.watch(PATHS.vendorSrc, ["static:vendor"]);
  gulp.watch("src/**/*", ["compile"]);
});

const tsOptions = {typescript: require("typescript")};
const tsProject = ts.createProject(PATHS.project, tsOptions);

gulp.task("compile", () => {
  return tsProject.src("src")
    .pipe(sourcemaps.init())
    .pipe(ts(tsProject)).js
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(PATHS.build));
});

gulp.task("launch", ["static", "compile"], () => {
  return gulp.src(PATHS.build)
  .pipe(runElectron([], {cwd: PATHS.build}));
});
