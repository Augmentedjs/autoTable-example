require.config({
	'baseUrl': 'scripts/',

    'paths': {
		'jquery': 'lib/jquery-2.1.4.min',
		'underscore': 'lib/lodash.min',
		'backbone': 'lib/backbone-min',

        // hosted version
		'augmented': '/augmented/scripts/core/augmented',
        'augmentedPresentation': '/augmented/scripts/presentation/augmentedPresentation'

        // local version
		//'augmented': 'lib/augmented/augmented-min',
        //'augmentedPresentation': 'lib/augmented/augmentedPresentation-min'
	}
});

require(['augmented', 'augmentedPresentation'], function(Augmented) {
    /*var schema = null;
    Augmented.ajax({
        url: "/example/data/tableSchema.json",
        contentType: 'application/json',
        dataType: 'json',
        async: false,
        parse: true,
        success: function(data, status) {
            if (typeof data === "string") {
                schema = JSON.parse(data);
            } else {
                schema = data;
            }
        },
        failure: function(data, status) { logger.error("Failed to fetch schema!"); }
    });*/

	var app = new Augmented.Presentation.Application("Example");
    // async calls to inject CSS and Fonts
    app.registerStylesheet("https://fonts.googleapis.com/css?family=Work+Sans:300,400");
    app.registerStylesheet("styles/main.css");
    app.registerStylesheet("styles/table.css");
    // get history going
	app.start();

    var logger = Augmented.Logger.LoggerFactory.getLogger(Augmented.Logger.Type.console, Augmented.Logger.Level.debug);

    var mainView = Augmented.Presentation.Mediator.extend({
        el: "#main",
        template: "<h1>Simple Example</h1><h2><em>Slightly</em> better hello world!</h2><hr/><div id=\"autoTable\"></div><div id=\"viewer\"></div><div id=\"controlPanel\"><div>",
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

    /*var schema = {
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
            "Active" : {
                "description": "Is the user Active",
                "type" : "boolean"
            }
        },
        "required": ["ID", "Name"]
    };*/

    var myAt = Augmented.Presentation.DirectDOMAutomaticTable.extend({
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
        schema: "/example/data/tableSchema.json",
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
            logger.debug("EXAMPLE: JSONView - Bubba proclaims: \"" + data + "\"");
            alert("Bubba proclaims: \"" + data + "\"");
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

    var asyncQueue = new Augmented.Utility.AsynchronousQueue(1000);
    asyncQueue.process(
        //at.render(),
        at.fetch(),
        jv.render(),
        cp.render()
    );
});
