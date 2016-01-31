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
        'augmentedPresentation': '/augmented/scripts/presentation/augmentedPresentation'

		//'augmented': 'lib/augmented/augmented',
        //'augmentedPresentation': 'lib/augmented/augmentedPresentation'
	},
	'shim': {
		jquery: {
			'exports': '$'
		},
		backbone: {
		    'deps': ['jquery','underscore'],//, 'handlebars'],
			'exports': 'Backbone'
		},
		underscore: {
			'exports': '_'
		},
		/*handlebars: {
			'exports': 'Handlebars'
		},*/

		augmented: {
			'deps': ['backbone'],
			'exports': 'Augmented'
		},
        augmentedPresentation: {
			'deps': ['underscore','augmented'],
			'exports': 'Augmented'
		}
	}
});

require(['augmented', 'augmentedPresentation'], function(Augmented) {
		var app = new Augmented.Presentation.Application("Example");
        app.registerStylesheet("styles/main.css");
		app.start();

        var logger = Augmented.Logger.LoggerFactory.getLogger(Augmented.Logger.Type.console, Augmented.Logger.Level.debug);

        var mainView = Augmented.Presentation.Mediator.extend({
            el: "#main",
            events: {
                "click button#ping": function() { this.trigger("bubbaEvent", "Ping!"); },
                "click button#clear": function() {
                    this.trigger("tableEvent", "clear");
                    this.trigger("tableEvent", "refresh");
                },
                "click button#fetch": function() {
                    this.trigger("tableEvent", "publish");
                    this.trigger("tableEvent", "refresh");
                }
            },
            template: "<h1>Simple Example</h1><h4><em>Slightly</em> better hello world!</h4><hr/><div id=\"autoTable\"></div><div id=\"viewer\"></div><div id=\"controlPanel\"><div>",
            init: function() {
                this.on('bubbaEvent',
                    function(data) {
                        logger.debug("Publishing to \"view\" channel");
                        this.publish("view", "bubbaEvent", data);
                    }
                );

                this.on('tableEvent',
                    function(data) {
                        logger.debug("Publishing to \"table\" channel");
                        this.publish("table", "tableEvent", data);
                    }
                );
            },
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

        var schema = {
            "$schema": "http://json-schema.org/draft-04/schema#",
            "title": "User",
            "description": "A list of users",
            "type": "object",
            "properties": {
                "Name" : {
                    "description": "Name of the user",
                    "type" : "string"
                },
                "ID" : {
                    "description": "The unique identifier for a user",
                    "type" : "integer"
                },
                "Email" : {
                    "description": "The email of the user",
                    "type" : "string"
                }
            },
            "required": ["ID", "Name"]
        };

        var data = [ { "Name": "Bob", "ID": 123, "Email": "bob@augmentedjs.org" },
                     { "Name": "Jonathan", "ID": 234, "Email": "jonathon@augmentedjs.org" },
                     { "Name": "Corey", "ID": 345, "Email": "corey@augmentedjs.org" },
                     { "Name": "Seema", "ID": 456, "Email": "seema@augmentedjs.org" },
                     { "Name": "Jasmine", "ID": 567, "Email": "jasmine@augmentedjs.org" }
                    ];

        var myAt = Augmented.Presentation.AutomaticTable.extend({
            init: function() {
                this.on('tableEvent', this.fireMethod);
            },
            fireMethod: function(event) {
                this[event]();
            },
            publish: function() {
                this.populate(data);
            }
        });
        var at = new myAt({
            schema : schema,
            el: "#autoTable",
            data: data
        });

        var view = new mainView();
        view.render(); // need to render so the subviews have something to anchor off of

        app.registerMediator(view);

        view.observeColleague(
            at, // colleague view
            function() {
                logger.debug("the table");
                at.trigger(arguments[0], arguments[1]);
                }, // callback
            "table" // channel
        );

        var jsonView = Augmented.Presentation.Colleague.extend({
            el: "#viewer",
            data: "",
            /*events: {   Don't listen here!!! :)
                "click #p": function() { this.trigger("bubbaEvent", "Ping!"); }
            },*/
            init: function() {
                this.on('bubbaEvent', this.bubba);
            },
            bubba: function(data) {
                logger.debug("Bubba proclaims: \"" + data + "\"");
                alert("Bubba proclaims: \"" + data + "\"");
            },
            render: function() {
                logger.debug("I got to render - " + this.$el + ", " + this.el);
                if (this.el) {
                    logger.debug("native");
                    var e = Augmented.Utility.isString(this.el) ? document.querySelector(this.el) : this.el;
                    if (e) {
                        e.innerHTML = "<p>Main View (Mediator) is observing in these channels: <strong>" + this.data + "</strong></p>";
                    }
                } else if (this.$el) {
                    logger.debug("jquery");
                    this.$el.html("<p>Main View (Mediator) is observing in these channels: <strong>" + this.data + "</strong></p>");
                } else {
                    logger.debug("no element anchor");
                }
                return this;
            }
        });

        var jv = new jsonView();

        view.observeColleague(
            jv, // colleague view
            function() {
                logger.debug("the jsonView - " + JSON.stringify(arguments));
                jv.trigger(arguments[0], arguments[1]);
            }, // callback
            "view" // channel
        );

        var c = JSON.stringify(Object.keys(view.getChannels()));
        jv.data = c;
        logger.debug("Main View (Mediator) is observing in these channels: " + c);

        var controlPanelView = Augmented.Presentation.Colleague.extend({
            el: "#controlPanel",
            template: "<button id=\"ping\">Ping Bubba</button><button id=\"clear\">Clear Table</button><button id=\"fetch\">Fetch Table</button>",
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
        var cp = new controlPanelView();

        view.observeColleague(
            cp, // colleague view
            function() {
                logger.debug("the control panel");
            }, // callback
            "control" // channel
        );

        var asyncQueue = new Augmented.Utility.AsynchronousQueue(1000);
        asyncQueue.process(
            at.render(),
            jv.render(),
            cp.render()
        );
    }
);
