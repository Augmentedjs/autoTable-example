({
    baseUrl: ".",
    paths: {
        backbone: "../lib/backbone-min",
        underscore: "../lib/lodash.min",
        jquery: "../lib/jquery.min",
        handlebars: "../lib/handlebars.runtime.min",
        augmented: "../lib/augmented",
        augmentedPresentation: "../lib/augmentedPresentation"
    },
    include: [],
    name: "betterExampleRequire",
    out: "betterExampleRequire-built.js",
    optimize: "uglify2",
    preserveLicenseComments: false,
    generateSourceMaps: true,
    useStrict: true
})
