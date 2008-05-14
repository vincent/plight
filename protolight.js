/**
 * Loading scripts
 *  - Prototype
 */
var __Protolight__bootstrap = {
	
	/**
	 * You probably have to change this, to point to your install of Protolight
	 */
	config: {
		'baseurl': 'http://localhost:8080/plight/'
	},
	/** Finished, quite simple, isn't it ? */
	
	'loader': {
		'prefix': 'javascript:',
		'func'	: "function loadScript(scriptURL){var scriptElem=document.createElement('SCRIPT'); scriptElem.setAttribute('language','JavaScript');scriptElem.setAttribute('src',scriptURL);document.body.insertBefore(scriptElem, document.body.firstChild);}loadScript('%SCRIPT_URL%');",
		'regexp': new RegExp('(%SCRIPT_URL%)', 'g')
	},
	
	loadScript: function(url) {
		eval(this.loader.func.replace(this.loader.regexp, url));
	},

	waitForObjectToDo: function(object, callback) {
		try { eval(object); callback(); }
		catch(e) {
			window.setTimeout(function(){__Protolight__bootstrap.waitForObjectToDo(object, callback);}, 100);
		}
	},

	init: function() {
		var Protolight = null;
		if (typeof(Prototype) == 'undefined') {
			this.loadScript('http://prototypejs.org/assets/2008/1/25/prototype-1.6.0.2.js');
		}
	}
}; __Protolight__bootstrap.init();

/**
 * ProtoLight, a small Javascript Spotlight-like app
 * 
 * Make your own Engines to custom it
 * 
 * TODO:
 *  refactor preferences and preferences storage backend (GoogleGears, Flash, ... ?)
 * 
 */
function doProtoLight(){
var __Protolight = Class.create();
__Protolight.prototype = {

	Version: '0.1',
	
	Backend: 'protolight',
	
	BaseURLLauncher: __Protolight__bootstrap.loader.func.replace(__Protolight__bootstrap.loader.regexp, __Protolight__bootstrap.config.baseurl+'protolight.js'),
	
	BaseURLRes: __Protolight__bootstrap.config.baseurl,
	
	prefsInputs: $H({
		'lang': {
			'label':'Language',
			'type': 'select',
			'choices': [
				{ 'label':'English', 'value':'en' },
				{ 'label':'Fran&ccedil;ais', 'value':'fr' },
				{ 'label':'Deutsch', 'value':'de' }
			],
			'value': 'en'
		},
		'test': {
			'label':'Super test',
			'type': 'checkbox',
			'value': 0
		}
	}),

	initialize:function() {
		
		this.engines = [];
		
		this.cache = {
			'_cache': $H(),
			'promote': function(data) {
				if (typeof(data)=='string' && this.cache._cache.get(data)==null) {
					this.cache._cache.set(data, []);
				}
				else {
					this.cache._cache.get(string).push(data);
				}
			}.bind(this)
		},
	
		// Put our CSS
		$$('head')[0].insert({'Bottom':new Element('link', { 'type':'text/css', 'rel':'stylesheet', 'href':this.BaseURLRes+'protolight.css' })});
	
		// Put our container in a div#protolight
		this.dom_container = new Element('div', { 'id':'protolight' });
		this.dom_container.setStyle({ 'background': 'url('+this.BaseURLRes+'img/bgheader.png)' });
		$$('body')[0].insert({'Bottom':this.dom_container});
		
		this.dom_header = new Element('div', { 'id':'pl_header' });
		this.dom_header.setStyle({ 'background': 'url('+this.BaseURLRes+'img/bgquery.png) no-repeat 0 0' });
		this.dom_container.insert({'Top':this.dom_header});

		this.dom_data = new Element('div', { 'id':'pl_data' });
		this.dom_container.insert({'Bottom':this.dom_data});

		this.dom_results = new Element('div', { 'id':'pl_results' });
		this.dom_container.insert({'Bottom':this.dom_results});

		// Then the info button
		this.dom_info = new Element('div', { 'id':'pl_info', 'style':'background-image: url(http://192.168.0.12/protolight/img/info.png)' })
		this.dom_info.observe('mouseover',function(e){Event.element(e).addClassName('hover')}).observe('mouseout',function(e){Event.element(e).removeClassName('hover')});
		//this.dom_info.setStyle({ 'background-color':'transparent' });
		//this.dom_info.setStyle({ 'background-attachment':'scroll' });
		//this.dom_info.setStyle({ 'background-repeat':'no-repeat' });
		this.dom_info.setStyle({ 'background-image': 'url(http://192.168.0.12/protolight/img/info.png)' });
		//this.dom_info.setStyle({ 'background-color':'transparent', 'background-attachment':'scroll', 'background-repeat':'no-repeat', 'background-image': 'url(http://192.168.0.12/protolight/img/info.png)' });
		this.dom_info.observe('click', function(){ this.prefsPanel.toggle(); }.bind(this));
		this.dom_header.insert({'Bottom':this.dom_info});

		// Then the main input
		this.dom_input = new Element('input', { 'id':'pl_main_input', 'type':'text' }).observe('keypress', this.onKeyPress.bindAsEventListener(this));
		this.dom_header.insert({'Bottom':this.dom_input});

		// Then the main input
		this.dom_clear = new Element('div', { 'id':'pl_clear' }).observe('click', this.clear.bind(this));
		this.dom_header.insert({'Bottom':this.dom_clear});

		this.dom_input.focus();

		this.prefsPanel = new Element('div', { 'id':'pl_prefspanel' });
		this.prefsPanel.setStyle({'display':'none'});
		this.dom_data.insert({'top':this.prefsPanel});
		this.reloadPrefs();
	},
	
	setPrefs: function(prefs) {
		prefs.each(function(myPref) {
			this.prefsInputs.get(myPref.name).value = myPref.value;
			var el = $('pl_prefs_input_'+myPref.name);
			if (el) {
				el.value = myPref.value;
				if (el.tagName == 'INPUT' && el.type == 'checkbox') {
					el.checked = myPref.value;
				}
			}
		}.bind(this));
		$('pl_prefs_saveurl').href = __Protolight__bootstrap.loader.prefix+encodeURIComponent(this.BaseURLLauncher + " (function(){window.setTimeout(function(){ Protolight.setPrefs("+this.getPrefs().toJSON()+"); }, 10000); })();");
	},
	
	getPrefs: function() {
		var p = this.prefsInputs.map(function(myPref) {
			return {'name':myPref.key, 'value':myPref.value.value};
		}.bind(this));
		return p;
	},
	
	reloadPrefs: function() {
		// Delete olf stuff (a bit rude, isn't it ?)
		this.prefsPanel = new Element('div', { 'id':'pl_prefspanel' });
		this.prefsPanel.setStyle({'display':'none'});
		this.dom_data.insert({'top':this.prefsPanel});
		
		this.prefsPanel.insert(new Element('h1').update('Welcome to Protolight !'));
		this.prefsInputs.map(function(input) {
			var label = new Element('label', { 'for':'pl_prefs_input_'+input.key }).update(input.value.label.capitalize());
			var el = null
			if (input.value.type == 'select') {
				el = new Element(input.value.type, { 'id':'pl_prefs_input_'+input.key, 'name':input.key, 'value':input.value.value });
				input.value.choices.each(function(choice) {
					var opt = new Element('option', { 'value':choice.value }).update(choice.label);
					if (input.value.value == choice.value) opt.setAttribute('selected', 'selected');
					el.insert(opt);
				});
			}
			else {
				el = new Element('input', { 'id':'pl_prefs_input_'+input.key, 'name':input.key, 'type':input.value.type, 'value':input.value.value });
			
				if (input.value.type == 'checkbox' && !!input.value.value) {
					el.setAttribute('checked', 'checked');
				}
			}
			
			if (label && el) {
				this.prefsPanel.insert(label);
				this.prefsPanel.insert(el.observe('change', function(event){
					var el = event.element();
					this.setPrefs([{ 'name':el.name, 'value':(el.getValue()!=null) }]);
				}.bind(this)));
				this.prefsPanel.insert(new Element('br'));
			}
		}.bind(this));

		var footer = new Element('div', { 'class':'pl_prefs_footer' })
		footer.insert(new Element('br'));
		footer.insert(new Element('a', { 'id':'pl_prefs_saveurl', 'title':'Drag url to save :/' }).update('Protolight'));
		this.prefsPanel.insert({'Bottom': footer});
	},
	
	togglePrefsMenu: function() {
		this.dom_data.childElements().invoke('hide');
		this.prefsPanel.toggle();
	},
	
	insertScript: function(url, text) {
		var js = new Element('script', { 'src':url, 'type':'text/javascript', 'defer':'defer' });
		if (text != null) js.update(text);
		$$('body')[0].insert({'Bottom': js});
	},
	
	insertSlylesheet: function(url, text) {
		var ss = new Element('link', { 'type':'text/css', 'rel':'stylesheet' });
		if (typeof(text) != 'undefined') ss.update(text);
		if (typeof(url) != 'undefined') ss.href = url;
		$$('head')[0].insert({'Bottom': ss});
	},
	
	onKeyPress: function(event) {
		var s = this.dom_input.getValue();
		
		// Complete the string if needed
		if (event.charCode != 0) s += String.fromCharCode(event.charCode);

		if (event.keyCode == Event.KEY_RETURN) {
			this.cache.promote(s, s);
			this.doSearch(s);
		}
		else if (event.keyCode == Event.KEY_UP) {
		}
		else if (event.keyCode == Event.KEY_DOWN) {
		}
		else if (event.keyCode == Event.KEY_ESC) {
			this.clear();
		}
		else if (event.charCode != 0 || event.keyCode == Event.KEY_BACKSPACE){
			this.clear();
			if (s.length > 0) {
				this.doSearch(s);
			}
		}
	},
	
	registerEngine: function(engine) {
		engine.setParent(this);
		engine.pl_init();
		this.prefsInputs.set('engine-'+engine.name, {
			'label': 'Activate '+engine.name,
			'type': 'checkbox',
			'value': 0
		});
		this.engines.push(engine);
		this.reloadPrefs();
	},
	
	clear: function() {
		this.dom_results.childElements().invoke('remove');
	},
	
	doSearch: function(string) {
		this.engines.each(function(engine) {
			if (this.prefsInputs.get('engine-'+engine.name).value) engine.doSearch(string);
		}.bind(this));
	},
	
	addCategory: function(categoryName, categoryImage) {
		var header = new Element('h2').update('.');
		if (!!categoryImage) {
			header.setStyle({'background':'url('+categoryImage+')', 'background-repeat':'no-repeat'});
		}
		else {
			header.update(categoryName.capitalize());
		}
		this.dom_results.insert({'Bottom': header});
		var dom_category = new Element('ul', { 'id':'pl_results_category'+categoryName, 'class':'pl_results_category' });
		this.dom_results.insert({'Bottom': dom_category});
		return dom_category;
	},
	
	addResult: function(result) {
		if (!result) return;
		var category = $('pl_results_category'+result.categoryName);
		if (!category) category = this.addCategory(result.categoryName, result.categoryImage);
		var resultItem = new Element('li', { 'class':'pl_result_item' }).update(result.label).observe('click', result.action);
		if (Prototype.Browser.IE) resultItem.observe('mouseover', function(){ this.addClassName('hover'); })..observe('mouseout', function(){ this.removeClassName('hover'); });
		category.insert({'Bottom':resultItem});
	},
	addResults: function(results) {
		results.each(function(res){this.addResult(res);}.bind(this));
	},
	
	redirect: function(location) {
		// TODO: implement a way to put the redirect doc in an iframe of the current doc
		window.location = location;
	}
	
}
//overwrite the class variable...
Protolight = new __Protolight();

/**
 * A simple plugin interface, extends to make your own :)
 */
var PL_Engine = Class.create();
PL_Engine.prototype = {
	parent: null,
	initialize:function() {
	},
	pl_init: function() {
	},
	setParent: function(newParent) {
		this.parent = newParent;
	},
	doSearch: Prototype.K
}
var PL_Engine = new PL_Engine();

/**
 * A simple eval() Engine
 */
var PL_EvalEngine = Class.create();
Object.extend(PL_EvalEngine.prototype, PL_Engine);
Object.extend(PL_EvalEngine.prototype, {

	name: 'SimpleEval',

	initialize:function() {
	},
	
	pl_init: function() {
	},
	
	doSearch: function(string) {
		var r = [];
		
		r.push({
				'categoryName':'General',
				'label':'Eval "'+string+'"',
				'action':function(){alert(''+eval(string));}
		});
		
		if (string.startsWith('http') || string.startsWith('www.')) r.push({
				'categoryName':'General',
				'label':'Goto '+string,
				'action':function(){this.redirect(string);}.bind(this.parent)
		});
		
		if (string.startsWith('man ')) {
			var s = string.match(/^man ([\w\-_]*)$/)[1];
			r.push({
				'categoryName':'General',
				'label':'Unix man '+s,
				'action':function(){this.redirect('http://compute.cnr.berkeley.edu/cgi-bin/man-cgi?'+s); }.bind(this.parent)
			});
		}

		this.parent.addResults(r);
	}

});
Protolight.registerEngine( new PL_EvalEngine() );

/**
 * A simple eval() Engine
 */
var PL_DeliciousEngine = Class.create();
Object.extend(PL_DeliciousEngine.prototype, PL_Engine);
Object.extend(PL_DeliciousEngine.prototype, {

	name: 'Delicious',

	categoryImage: Protolight.BaseURLRes+'img/delicious.png',
	
	initialize:function() {
	},
	
	pl_init: function() {
	},
	
	doSearch: function(string) {
		var r = [];
		
		r.push({
				'categoryName':'Delicious',
				'categoryImage':this.categoryImage,
				'label':'Search "'+string+'" in my bookmarks',
				'action':function(){this.redirect('http://del.icio.us/search/?fr=del_icio_us&p='+string+'&type=user');}.bind(this.parent)
		});
		
		r.push({
				'categoryName':'Delicious',
				'categoryImage':this.categoryImage,
				'label':'Search "'+string+'" in all bookmarks',
				'action':function(){this.redirect('http://del.icio.us/search/?fr=del_icio_us&p='+string+'&type=all');}.bind(this.parent)
		});
		
		this.parent.addResults(r);
	}

});
Protolight.registerEngine( new PL_DeliciousEngine() );

/**
 * A Google Engine
 */
var PL_GoogleEngine = Class.create();
Object.extend(PL_GoogleEngine.prototype, PL_Engine);
Object.extend(PL_GoogleEngine.prototype, {

	name: 'Google',

	initialize:function() {
	},
	
	pl_init: function() {
	},
	
	getLang: function() {
		return this.parent.prefsInputs.get('lang').value;
	},
	
	categoryImage: Protolight.BaseURLRes+'img/google.png',
	
	doSearch: function(string) {
		this.parent.addResults([
			{
				'categoryName':'Google',
				'categoryImage':this.categoryImage,
				'label':'Search "'+string+'" in Google',
				'action':function(){this.googleSearch({'q':string});}.bind(this)
			},
			{
				'categoryName':'Google',
				'categoryImage':this.categoryImage,
				'label':'Search "'+string+'" in Google Images',
				'action':function(){this.googleSearchImages({'q':string});}.bind(this)
			},
			{
				'categoryName':'Google',
				'categoryImage':this.categoryImage,
				'label':'Search in GMail',
				'action':function(){this.googleSearchMails({'q':string});}.bind(this)
			}
		]);
	},

	googleSearch: function(result) {
		this.parent.redirect('http://www.google.fr/search?hl='+this.getLang()+'&q='+result.q);
	},
	googleSearchImages: function(result) {
		this.parent.redirect('http://images.google.fr/images?hl='+this.getLang()+'&q='+result.q);
	},
	googleSearchMails: function(result) {
		this.parent.redirect('https://mail.google.com/mail/#search/'+result.q);
	}
	
});
Protolight.registerEngine( new PL_GoogleEngine() );


/**
 * PL_GotApiEngine, a try to plug gotapi.com
 */
var PL_GotApiEngine = Class.create();
Object.extend(PL_GotApiEngine.prototype, PL_Engine);
Object.extend(PL_GotApiEngine.prototype, {
	
	name: 'GotApi',

	initialize: function() {
	},
	
	pl_init: function() {
		//this.parent.insertSlylesheet('', "gaMenu{border:1px solid #505050;background-color:#FAFAFA;padding:0px 5px 0px 5px;}.gaHeaderRow{font:bold 8pt Arial;color:#359155;border-top:1px solid #C0C0C0;width:250px;}.gaRegularRow,.gaFooterRow{font:8pt Arial;cursor:pointer;}.gaSelectedRow{font:8pt Arial;background-color:#c1e0e6;cursor:pointer;}");
		//this.parent.insertScript('', "gaMod='module_jsdomw3s.js';gaTitle='JavaScript DOM';updateWhenLoaded=false;var gaL=false;function gaInit(){if(gaL)return;gaL=true;var s=document.createElement('script');s.type='text/javascript';s.src='http://www.gotapi.com/widgets/compiled/c1_module_jsdomw3s.js.jsz';s.defer='defer';s.defered='yes';document.getElementById('gaInfo').parentNode.appendChild(s)}function gaSearching(){document.getElementById('gaWait').style.display='';updateWhenLoaded=true;document.getElementById('gaInfo').style.display='none'}");
	},
	
	doSearch: function(string) {
		this.parent.addResults([
			{
				'categoryName':'General',
				'categoryImage':this.categoryImage,
				'label':'Search in GotApi',
				'action':function(){this.manageInput();}.bind(this)
			}
		]);
	},
	
	manageInput: function() {
		//this.parent.toggleAutocomplete(false);
		this.parent.dom_input.observe('keydown', gaSearching);
		gaInit();
	}
	
});
Protolight.registerEngine( new PL_GotApiEngine() );

/**
 * PL_TracsEngine
 */
var PL_TracsEngine = Class.create();
Object.extend(PL_TracsEngine.prototype, PL_Engine);
Object.extend(PL_TracsEngine.prototype, {

	name: 'Tracs',

	tracs: $H({
		'jamendo': {
				'name': 'Jamendo',
				'base': 'http://trac.jamendo.com/tracjamendo',
				'user': 'USER',
				'pass': 'PASSWORD',
				'connected':false
		}
	}),
	
	initialize: function() {
	},
	
	pl_init: function() {

	},
	
	doSearch: function(string) {
		//this.parent.prefsInputs.get('tracs').each(function(trac){
		this.tracs.each(function(trac){
			var r = [];
			var matches = string.match(/^[\[|#]*(\d+)$/);
			if (matches) {
				if (matches[0]==matches[1] || matches[0].startsWith('#')) r.push({
					'categoryName':'Trac - '+trac.value.name,
					'label':'Goto ticket '+matches[1],
					'action':function(){this.goTicket(trac.key, matches[1]);}.bind(this)
				});
				
				if (matches[0]==matches[1] || matches[0].startsWith('[')) r.push({
					'categoryName':'Trac - '+trac.value.name,
					'label':'Goto changeset '+matches[1],
					'action':function(){this.goChangeset(trac.key, matches[1]);}.bind(this)
				});
			}			
			r.push({
				'categoryName':'Trac - '+trac.value.name,
				'label':'Search '+string,
				'action':function(){this.goSearch(trac.key, string);}.bind(this)
			});
			
			this.parent.addResults(r);
		}.bind(this));
	},
	
	make_base_auth: function(user, password) {
		var tok = user + ':' + password;
		var hash = Base64.encode(tok);
		return "Basic " + hash;
	},

	ensureConnected: function(tracKey) {
		/**
		 * We need cross domain folks, here, but ... 
		 *
		if (this.tracs.get(tracKey).connected) return true;
		var test = this.make_base_auth(this.tracs.get(tracKey).user,this.tracs.get(tracKey).pass);

		new Ajax.Request(this.tracs.get(tracKey).base+'/login', {
			//'requestHeaders': { 'Authorization':this.make_base_auth(this.tracs.get(tracKey).user,this.tracs.get(tracKey).pass) },
			'onComplete': function(){ this.tracs.get(tracKey).connected = true; }
		});
		*/
	},
	
	goTicket: function(tracKey, data) {
		this.ensureConnected(tracKey);
		this.parent.redirect(this.tracs.get(tracKey).base+'/ticket/'+data);
	},
		
	goChangeset: function(tracKey, data) {
		this.ensureConnected(tracKey);
		this.parent.redirect(this.tracs.get(tracKey).base+'/changeset/'+data);
	},
		
	goSearch: function(tracKey, data) {
		this.ensureConnected(tracKey);
		this.parent.redirect(this.tracs.get(tracKey).base+'/search?q='+data);
	},
		
});
Protolight.registerEngine( new PL_TracsEngine() );
}
__Protolight__bootstrap.waitForObjectToDo('Prototype', doProtoLight)
