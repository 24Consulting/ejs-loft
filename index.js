var ejs = require('ejs'),
	fs = require('fs'),
	path = require('path'),
	debug = require('debug')('ejs-loft'),
	exists = fs.existsSync || path.existsSync;

// TODO: fix tests
// TODO: static files last edited timestamps
module.exports = function renderFile(file,options,fn){
	if(!options.blocks){
		options.blocks = {};
		options.block = block.bind(options.blocks);
		options.scripts = new Block();
		options.js = js.bind(options.scripts);
		options.stylesheets = new Block();
		options.css = css.bind(options.stylesheets);
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
			renderFile(layout,options,fn);
		}else{
			fn(null,html);
		}
	});
};

var cache = {},
	resolveObjectName = view => 
		cache[view] || (cache[view] = view
			.split('/')
			.slice(-1)[0]
			.split('.')[0]
			.replace(/^_/,'')
			.replace(/[^a-zA-Z0-9 ]+/g,' ')
			.split(/ +/).map((word,i) => i ? word[0].toUpperCase() + word.substr(1) : word)
			.join('')),
	
	lookup = (root,partial,options) => {
		var ext = path.extname(partial) || `.${options.settings['view engine'] || 'ejs'}`,
			key = `${root}-${partial}-${ext}`;
		
		if(options.cache && cache[key]) return cache[key];

		var dir = path.dirname(partial),
			base = path.basename(partial,ext);

		partial = path.resolve(root,dir,base + ext);
		if(exists(partial)) return options.cache ? cache[key] = partial : partial;
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
	this._layoutFile = view;
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
	},
	replace: function(instead){
		this.html = [instead];
	}
};

function block(name,html){
	var blk = this[name];
	
	if(!blk) blk = this[name] = new Block();
	if(html) blk.append(html);
	
	return blk;
}

function attributes(obj){
	return Object
		.keys(obj)
		.map(k => obj[k] === null ? k : `${k}="${obj[k]}"`)
		.join(' ');
}

function css(){
	for(var style of arguments){
		if(typeof style == 'string') style = {href:style};
		style.rel = style.rel || 'stylesheet';
		style.type = style.type || 'text/css';
		this.append(`<link ${attributes(style)} />`);
	}
	
	return this;
}

function js(){
	for(var script of arguments){
		if(typeof script == 'string') script = {src:script};
		this.append(`<script ${attributes(script)}></script>`);
	}
}

