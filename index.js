var ejs = require('ejs'),
	fs = require('fs'),
	path = require('path'),
	util = require('util'),
	url = require('url'),
	debug = require('debug')('ejs-loft'),
	exists = fs.existsSync || path.existsSync;

// TODO: fix tests
// TODO: in old tests there's no all these newlines, check how it works.
// TODO: include should include templates with default extension, not only ejs
// TODO: static files last edited timestamps
// TODO: location of properties right inside options create problems, i can't use reserved names inside templates.
module.exports = function renderFile(file,options,fn){
	
	if(!options.blocks){
		var ph = options.settings['view options'].public_html;
		options.blocks = {};
		options.block = block.bind(options.blocks);
		options.scripts = new ScriptsBlock(ph);
		options.script = options.js = js.bind(options.scripts);
		options.stylesheets = new StylesBlock(ph);
		options.stylesheet = options.css = css.bind(options.stylesheets);
		options.layout = layout.bind(options);
		options.partial = partial.bind(options);
	}
	
	options.filename = file;
	
	ejs.renderFile(file,options,function rf(err,html){
		debug(file,options,html);
		
		if(err) return fn(err,html);
		
		var layout = options._layoutFile;
		
		if(layout){
			delete options._layoutFile;
			delete options.filename;
			
			layout = findProcess([options.settings.views,path.dirname(file)],p => lookup(p,layout,options));
			
			options.body = html;
			
			return Promise
				.all([
					options.scripts.statFiles(),
					options.stylesheets.statFiles()
				])
				.then(n => renderFile(layout,options,fn))
				.catch(err => fn(err,null));
		}else{
			fn(null,html);
		}
	});
};

var cache = {},
	resolveObjectName = view => cache[view]
		|| (cache[view] = view
			.split('/')
			.slice(-1)[0]
			.split('.')[0]
			.replace(/^_/,'')
			.replace(/[^a-zA-Z0-9 ]+/g,' ')
			.split(/ +/).map((word,i) => i ? word[0].toUpperCase() + word.substr(1) : word)
			.join('')),
	
	lookup = (root,partial,options) => {
		var ext = path.extname(partial) || `.${options.settings['view engine'] || 'html'}`,
			key = `${root}-${partial}-${ext}`;
		
		if(options.cache && cache[key]) return cache[key];

		var dir = path.dirname(partial),
			base = path.basename(partial,ext);

		if(
			exists(partial = path.resolve(root,dir,base + ext))
			|| exists(partial = path.resolve(root,dir,base,'index'+ext))
		) return options.cache ? cache[key] = partial : partial;
	};

function partial(view,options){
	var collection,object,name;
	
	if(options){
		if(options.collection){
			collection = options.collection;
			delete options.collection;
		}else if('length' in options){
			collection = options;
			options = {};
		}
		
		if('Object' != options.constructor.name){
			object = options;
			options = {};
		}else if(options.object){
			object = options.object;
			delete options.object;
		}
	}else{
		options = {};
	}
	
	for(var k in this)
		if(this.hasOwnProperty(k))
			options[k] = options[k] || this[k];
	
	name = options.as || resolveObjectName(view);
	
	var file;
	
	if(![options.settings.views,path.dirname(options.filename)].find(r => file = lookup(r,view,options)))
		throw new Error(`Could not find partial ${view}`);
	var key = `${file}:string`;
	
	var source = options.cache ? cache[key] || (cache[key] = fs.readFileSync(file,'utf8')) : fs.readFileSync(file,'utf8');
	
	options.filename = file;
	
	options.partial = partial.bind(options);
	
	function render(){
		if(object && 'string' == typeof name) options[name] = object;
		return ejs.render(source,options);
	}
	
	if(collection){
		var len = collection.length,
			buf = '',
			keys,prop,val,i;
		
		if('number' == typeof len || Array.isArray(collection)){
			options.collectionLength = len;
			for(i = 0; i < len; ++i){
				val = collection[i];
				options.firstInCollection = i === 0;
				options.indexInCollection = i;
				options.lastInCollection = i === len - 1;
				object = val;
				buf += render();
			}
		}else{
			keys = Object.keys(collection);
			len = keys.length;
			options.collectionLength = len;
			options.collectionKeys = keys;
			for(i = 0; i < len; ++i){
				prop = keys[i];
				val = collection[prop];
				options.keyInCollection = prop;
				options.firstInCollection = i === 0;
				options.indexInCollection = i;
				options.lastInCollection = i === len - 1;
				object = val;
				buf += render();
			}
		}
		
		return buf;
	}else{
		return render();
	}
}

function findProcess(list,cb){
	var res;
	list.find(i => res = cb(i));
	return res;
}

function layout(view){
	var l = this._layoutFile;
	if(l !== false)
		this._layoutFile = l || view;
}

function Block(){
	this.html = [];
}

Block.prototype = {
	toString: function(){
		return this.html.join('\n');
	},
	append: function(more){
		this.html.push(more);
	}
};

function CachableBlock(public_html){
	this.public_html = public_html;
	this.files = {};
}

function ScriptsBlock(){
	return ScriptsBlock.super_.apply(this,arguments);
}

function StylesBlock(public_html){
	return StylesBlock.super_.apply(this,arguments);
}

util.inherits(ScriptsBlock,CachableBlock);
util.inherits(StylesBlock,CachableBlock);
Object.defineProperties(CachableBlock.prototype,{
	statFiles: {
		enumerable: false,
		value: function(){
			return new Promise((resolve,reject) => {
				var n = 0,
					files = Object.keys(this.files);
				
				if(!files.length) resolve();
					// .filter(f => !f.lastmod) // TODO: cache files
				files.forEach(f => {
					n++;
					fs.stat(this.public_html+f,(err,stat) => {
						if(err) return reject(err);
						this.files[f].lastmod = Date.parse(stat.mtime) / 1000;
						if(!--n) resolve();
					});
				});
			});
		}
	},
	toString: {
		enumerable: false,
		value: function(){
			return Object
				.keys(this.files)
				.map(f => this.html(f))
				.join('');
		}
	},
	appendVersion: {
		enumerable: false,
		value: function(href,lastmod){
			if(lastmod){
				var u = url.parse(href,true);
				u.query.v = u.query.v || lastmod;
				u.search = null;
				href = url.format(u);
			}
			return href;
		}
	}
});

Object.defineProperties(ScriptsBlock.prototype,{
	html: {
		enumerable: false,
		value: function(f){
			var d = this.files[f];
			d.src = this.appendVersion(d.src,d.lastmod);
			delete d.lastmod;
			return `<script ${attributes(d)}></script>`;
		}
	}
});

Object.defineProperties(StylesBlock.prototype,{
	html: {
		enumerable: false,
		value: function(f){
			var d = this.files[f];
			d.href = this.appendVersion(d.href,d.lastmod);
			delete d.lastmod;
			return `<link ${attributes(d)} />`;
		}
	}
});


function block(name,html){
	var blk = this[name];
	
	if(!blk) blk = this[name] = new Block();
	if(html) blk.append(html);
	
	return blk;
}

function attributes(obj){
	return Object
		.keys(obj)
		.sort()
		.map(k => obj[k] === null ? k : `${k}="${obj[k]}"`)
		.join(' ');
}

function css(){
	for(var style of arguments){
		if(typeof style === 'string') style = {href:style};
		style.rel = style.rel || 'stylesheet';
		style.type = style.type || 'text/css';
		style.lastmod = null;
		this.files[style.href] = style;
	}
	
	return this;
}

function js(){
	for(var script of arguments){
		if(typeof script === 'string') script = {src:script};
		script.lastmod = null;
		this.files[script.src] = script;
	}
}
