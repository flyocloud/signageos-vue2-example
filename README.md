# Vue 2 SOS Applet

## Development:

+ For local development, uncomment sos code then `npm run serve`
+ For preview in emulator use `npm run dev` and `npm run start` afterwards. Each change requires you to restart the applet

## Setup (Once)

> This step must be done once after cloning (setting up) your signageos applet repository.

+ Ensure you have an active https://box.signageos.io account!
+ `npm install @signageos/cli -g` now the `sos` is gloabally available
+ `sos login`
+ `sos organization set-default`

## Important Notes

+ use es5 check `"es5": "npx es-check es5 dist/**/*.js"` via `npm run es5`
+ test the applet with browser stack chromium version 60
+ don't use vue3
+ box applet error `entry file not found` "solution": add or remove a space at the end of any line in the package.json file then build and reuoload again.