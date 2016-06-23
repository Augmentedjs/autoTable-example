require.config({
	'baseUrl': 'scripts/',

    'paths': {
		'jquery': 'lib/jquery.min',
		'underscore': 'lib/lodash.min',
		'backbone': 'lib/backbone-min',

        // hosted version
		//'augmented': '/augmented/scripts/core/augmented',
        //'augmentedPresentation': '/augmented/scripts/presentation/augmentedPresentation'

        // local version
		'augmented': 'lib/augmented',
        'augmentedPresentation': 'lib/augmentedPresentation'
	}
});

require(['augmented', 'augmentedPresentation'], function(Augmented) {
	var app = new Augmented.Presentation.Application("Spreadsheet");
    // async calls to inject CSS and Fonts
    app.registerStylesheet("https://fonts.googleapis.com/css?family=Roboto:400,300,100");
    // get history going
	app.start();

    var myAt = Augmented.Presentation.Spreadsheet.extend({
    });

    var at = new myAt({
        el: "#main"
    });

    at.render();
    at.setTheme("material");
});
