require.config({
	'baseUrl': 'scripts/',

    'paths': {
		'jquery': 'lib/jquery-2.1.4.min',
		'underscore': 'lib/lodash.min',
		'backbone': 'lib/backbone-min',
		'handlebars': 'lib/handlebars-v4.0.2',
		'text': 'lib/text',
		'json': 'lib/json',

        'augmented': '/augmented/scripts/core/augmented',

		//'augmented': 'lib/augmented/augmented',
        //'augmentedPresentation': 'lib/augmented/augmentedPresentation'
	},
	'shim': {
		jquery: {
			'exports': '$'
		},
		backbone: {
		    'deps': ['jquery', 'underscore', 'handlebars'],
			'exports': 'Backbone'
		},
		underscore: {
			'exports': '_'
		},
		handlebars: {
			'exports': 'Handlebars'
		},

		augmented: {
			'deps': ['backbone'],
			'exports': 'Augmented'
		}
        /*,
        augmentedPresentation: {
			'deps': ['underscore','augmented'],
			'exports': 'Augmented'
		}
        */
	}
});

require(['augmented'], function(Augmented) {
		var app = new Augmented.Application("Example");
		app.start();

        var logger = Augmented.Logger.LoggerFactory.getLogger(Augmented.Logger.Type.console);

        var mainView = Augmented.View.extend({
            el: "#main",
            template: "<h1>Hello</h1>",
            render: function() {
                logger.debug("I got to render - " + this.$el + ", " + this.el);
                if (this.el) {
                    logger.debug("native");
                    var e = Augmented.Utility.isString(this.el) ? document.querySelector(this.el) : this.el;
                    if (e) {
                        e.innerHTML = this.template;
                    }
                } else if (this.$el) {
                    logger.debug("jquery");
                    this.$el.html(this.template);
                } else {
                    logger.debug("no element anchor");
                }
                return this;
            }
        });

        var view = new mainView();
        view.render();
    }
);
