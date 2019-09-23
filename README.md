# Dim
Some sort of image viewer


To launch in development mode, run these commands:

```bash
# Only need to run this once.
$ npm run setup

# Only re-run this to restart the application.
$ npm run dev
```

## Building for production
This is mostly just for reference so that it can be added to gulp later
```bash
$ gulp package
$ cd build
$ npm i --production
$ cd ..
$ electron-packager build Dim --asar --platform=win32 --arch=x64 --out=dist
```
