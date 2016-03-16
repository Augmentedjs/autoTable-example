require.config({
	'baseUrl': 'scripts/',

    'paths': {
		'jquery': 'lib/jquery-2.1.4.min',
		'underscore': 'lib/lodash.min',
		'backbone': 'lib/backbone-min',

        // hosted version at context /augmented
        'augmented': '/augmented/scripts/core/augmented',
        'augmentedPresentation': '/augmented/scripts/presentation/augmentedPresentation'

        // local version
		//'augmented': 'lib/augmented/augmented',
        //'augmentedPresentation': 'lib/augmented/augmentedPresentation'
	},
	'shim': {
		/*jquery: {
			'exports': '$'
		},
		backbone: {
		    'deps': ['jquery', 'underscore'],
			'exports': 'Backbone'
		},*/
		underscore: {
			'exports': '_'
		}
        /*
		augmented: {
			'deps': ['backbone'],
			'exports': 'Augmented'
		},
        augmentedPresentation: {
			'deps': ['underscore','augmented'],
			'exports': 'Augmented'
		}*/
	}
});

require(['augmented', 'augmentedPresentation'], function(Augmented) {
		var app = new Augmented.Presentation.Application("Example");
        app.registerStylesheet("styles/main.css");
		app.start();

        var logger = Augmented.Logger.LoggerFactory.getLogger(Augmented.Logger.Type.console, Augmented.Logger.Level.debug);

        var mainView = Augmented.Presentation.Mediator.extend({
            el: "#main",
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
                    var e = Augmented.isString(this.el) ? document.querySelector(this.el) : this.el;
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

        var data = [ { "Name": "Bob", "ID": 123, "Email": "bob@augmentedjs.com" },
                     { "Name": "Jonathan", "ID": 234, "Email": "jonathon@augmentedjs.com" },
                     { "Name": "Corey", "ID": 345, "Email": "corey@augmentedjs.com" },
                     { "Name": "Seema", "ID": 456, "Email": "seema@augmentedjs.com" },
                     { "Name": "Jasmine", "ID": 567, "Email": "jasmine@augmentedjs.com" }
                    ];

        var myAt = Augmented.Presentation.
        //AutomaticTable.extend({
        DirectDOMAutomaticTable.extend({
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
            //data: data,
            crossOrigin: false,
            sortable: true,
            lineNumbers: true,
            editable: true,
            uri: "/example/data/table.json"
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
                    var e = Augmented.isString(this.el) ? document.querySelector(this.el) : this.el;
                    if (e) {
                        var h = "<p>Main View (Mediator) is observing in these channels: <ul>";
                        var i = 0, l = this.data.length;
                        for(i=0;i < l; i++) {
                            h = h + "<li>" + this.data[i] + "</li>";
                        }
                        h = h + "</ul></p>";
                        e.innerHTML = h;
                    }
                } else if (this.$el) {
                    logger.debug("jquery");
                    var h = "<p>Main View (Mediator) is observing in these channels: <ul>";
                    var i = 0, l = this.data.length;
                    for(i=0;i < l; i++) {
                        h = h + "<li>" + this.data[i] + "</li>";
                    }
                    h = h + "</ul></p>";
                    this.$el.html(h);
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

        var controlPanelView = Augmented.Presentation.Colleague.extend({
            el: "#controlPanel",
            template: "<button id=\"ping\">Ping Bubba</button><button id=\"clear\">Clear Table</button><button id=\"fetch\">Fetch Table</button><button id=\"validate\">Validate Table</button>",
            events: {
                "click button#clear": function() {
                    this.sendMessage("tableEvent", "clear");
                    this.sendMessage("tableEvent", "refresh");
                },
                "click button#fetch": function() {
                    this.sendMessage("tableEvent", "fetch");
                    //this.sendMessage("tableEvent", "refresh");
                },
                "click button#ping": function() {
                    this.sendMessage("bubbaEvent", "Ping!");
                },
                "click button#validate": function() {
                    this.sendMessage("tableEvent", "validate");
                }
            },
            render: function() {
                logger.debug("I got to render - " + this.$el + ", " + this.el);
                if (this.el) {
                    logger.debug("native");
                    var e = Augmented.isString(this.el) ? document.querySelector(this.el) : this.el;
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

        var c = Object.keys(view.getChannels());
        jv.data = c;
        logger.debug("Main View (Mediator) is observing in these channels: " + c);

        var asyncQueue = new Augmented.Utility.AsynchronousQueue(1000);
        asyncQueue.process(
            at.render(),
            at.fetch(),
            jv.render(),
            cp.render()
        );
    }
);
