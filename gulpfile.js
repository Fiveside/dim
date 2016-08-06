const gulp = require("gulp");
const ts = require("gulp-typescript");
const del = require("del");
const sourcemaps = require("gulp-sourcemaps");
const runElectron = require("gulp-run-electron");

gulp.task("default", ["launch"]);
gulp.task("dev", ["clean"], () => gulp.run(["watch", "launch"]));
gulp.task("package", ["clean"], () => gulp.run(["static", "compile"]));

const PATHS = {
  static: [
    "package.json",
    "index.html",
    "main.js",
  ],
  project: "tsconfig.json",
  src: "src/**/*",
  build: "build",
};

gulp.task("clean", () => {
  return del("build");
});

gulp.task("static", () => {
  return gulp.src(PATHS.static)
  .pipe(gulp.dest(PATHS.build));
});

gulp.task("watch", ["static", "compile"], () => {
  gulp.watch(PATHS.static, ["static"]);
  gulp.watch(PATHS.src, ["compile"]);
});

const tsProject = ts.createProject(PATHS.project, {
  // Required because we're using pre-release versions of typescript here
  typescript: require("typescript"),
});

gulp.task("compile", () => {
  return tsProject.src()
  .pipe(sourcemaps.init())
  .pipe(ts(tsProject)).js
  .pipe(sourcemaps.write())
  .pipe(gulp.dest(PATHS.build));
});

gulp.task("launch", ["static", "compile"], () => {
  return gulp.src(PATHS.build)
  .pipe(runElectron([], {cwd: PATHS.build}));
});
