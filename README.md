# Vue 2 SOS Applet

## Development:

+ For local development, [uncomment SOS code](https://github.com/flyocloud/signageos-vue2-example/pull/1/files) then `npm run serve`
+ For preview in emulator use `npm run dev` and run `npm run start` afterwards. Each change requires you to restart the applet

## Setup (Once)

> This step must be done once after cloning (setting up) your signageos applet repository.

+ Ensure you have an active https://box.signageos.io account!
+ `npm install @signageos/cli -g` now the `sos` is gloabally available
+ `sos login`
+ `sos organization set-default`

## Important Notes

+ Use es5 check `"es5": "npx es-check es5 dist/**/*.js"` via `npm run es5` (build the project first using `npm run build` otherwise the dist folder is empty)
+ Don't use vue3
+ Remove `type="module"` from index.html if present in dist or public folder
+ When having problems with preview emulator, log in into the box and remove all applets from the emulator first, then run `npm run dev` and `npm run start` afterwards.
+ (Seems to be fixed) Box applet error `entry file not found` "solution": add or remove a space at the end of any line in the package.json file then build and reuoload again.
