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
	var app = new Augmented.Presentation.Application("Example");
    // async calls to inject CSS and Fonts
    app.registerStylesheet("https://fonts.googleapis.com/css?family=Roboto:400,300,100");
    // get history going
	app.start();

    var logger = Augmented.Logger.LoggerFactory.getLogger(Augmented.Logger.Type.console, Augmented.Logger.Level.debug);

    var mainView = Augmented.Presentation.Mediator.extend({
        el: "#main",
        //template: "<div id=\"logo\"></div><h1>Augmented Automatic Table</h1><h2><em>JSON-Schema</em> powered presentation</h2><div id=\"container\"><div id=\"autoTable\"></div><div id=\"viewer\"></div><div id=\"controlPanel\"><div></div>",
        template: "<div id=\"container\"><div id=\"autoTable\"></div><div id=\"viewer\"></div><div id=\"controlPanel\"><div></div>",
        events: {
            "click div#logo": function() {
                window.location = "http://www.augmentedjs.com";
            }
        },
        init: function() {
            this.on('bubbaEvent',
                function(data) {
                    logger.debug("EXAMPLE: MainView - Publishing to \"view\" channel");
                    this.publish("view", "bubbaEvent", data);
                }
            );

            this.on('tableEvent',
                function(data) {
                    logger.debug("EXAMPLE: MainView - Publishing to \"table\" channel");
                    this.publish("table", "tableEvent", data);
                }
            );
        },
        render: function() {
            logger.debug("EXAMPLE: MainView - I got to render - " + this.$el + ", " + this.el);
            if (this.el) {
                logger.debug("EXAMPLE: MainView - native");
                var e = Augmented.isString(this.el) ? document.querySelector(this.el) : this.el;
                if (e) {
                    e.innerHTML = this.template;
                }
            } else if (this.$el) {
                logger.debug("EXAMPLE: MainView - jquery");
                this.$el.html(this.template);
            } else {
                logger.debug("EXAMPLE: MainView - no element anchor");
            }
            return this;
        }
    });

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
                "type" : "string",
                "format": "email"
            },
            "Role" : {
                "description": "The role of the user",
                "type": "string",
                "enum": [null, "Architect", "Developer", "Tech Lead", "Product Owner", "UX Designer", "QE", "Operations"]
            },
            "Active" : {
                "description": "Is the user Active",
                "type" : "boolean"
            }
        },
        "required": ["Name", "ID"]
    };

    var at = new myAt({
        schema: schema,//"/autotable/data/tableSchema.json",
        el: "#autoTable",
        crossOrigin: false,
        sortable: true,
        lineNumbers: true,
        editable: true,
        uri: "/autotable/data/table.json"
    });


    var view = new mainView();
    view.render(); // need to render so the subviews have something to anchor off of

    app.registerMediator(view);

    view.observeColleague(
        at, // colleague view
        function() {
            logger.debug("EXAMPLE: MainView - the table");
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
            logger.debug("EXAMPLE: JSONView - Mediator says: \"" + data + "\"");
            alert("Mediator says: \"" + data + "\"");
        },
        render: function() {
            logger.debug("EXAMPLE: JSONView - I got to render - " + this.$el + ", " + this.el);
            if (this.el) {
                logger.debug("EXAMPLE: JSONView - native");
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
                logger.debug("EXAMPLE: JSONView - jquery");
                var h = "<p>Main View (Mediator) is observing in these channels: <ul>";
                var i = 0, l = this.data.length;
                for(i=0;i < l; i++) {
                    h = h + "<li>" + this.data[i] + "</li>";
                }
                h = h + "</ul></p>";
                this.$el.html(h);
            } else {
                logger.debug("EXAMPLE: JSONView - no element anchor");
            }
            return this;
        }
    });

    var jv = new jsonView();

    view.observeColleague(
        jv, // colleague view
        function() {
            logger.debug("EXAMPLE: MainView - the jsonView - " + JSON.stringify(arguments));
            jv.trigger(arguments[0], arguments[1]);
        }, // callback
        "view" // channel
    );

    var controlPanelView = Augmented.Presentation.Colleague.extend({
        el: "#controlPanel",
        template: "<button id=\"ping\">Ping Mediator</button><button id=\"clear\">Clear Table</button><button id=\"fetch\">Fetch Table</button><button id=\"validate\">Validate Table</button>",
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
                this.sendMessage("bubbaEvent", "Hello!");
            },
            "click button#validate": function() {
                this.sendMessage("tableEvent", "validate");
            }
        },
        render: function() {
            logger.debug("EXAMPLE: ControlPanel - I got to render - " + this.$el + ", " + this.el);
            if (this.el) {
                logger.debug("EXAMPLE: ControlPanel - native");
                var e = Augmented.isString(this.el) ? document.querySelector(this.el) : this.el;
                if (e) {
                    e.innerHTML = this.template;
                }
            } else if (this.$el) {
                logger.debug("EXAMPLE: ControlPanel - jquery");
                this.$el.html(this.template);
            } else {
                logger.debug("EXAMPLE: ControlPanel - no element anchor");
            }
            return this;
        }
    });
    var cp = new controlPanelView();

    view.observeColleague(
        cp, // colleague view
        function() {
            logger.debug("EXAMPLE: MainView - the control panel");
        }, // callback
        "control" // channel
    );

    var c = Object.keys(view.getChannels());
    jv.data = c;
    logger.debug("EXAMPLE: Main View (Mediator) is observing in these channels: " + c);

    at.render();

    at.setTheme("material");
    at.fetch();
    jv.render();
    cp.render();

    /*var asyncQueue = new Augmented.Utility.AsynchronousQueue(1000);
    asyncQueue.process(

    );*/
});
