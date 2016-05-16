var ejs = require('ejs'),
	fs = require('fs'),
	path = require('path'),
	exists = fs.existsSync || path.existsSync,
	resolve = path.resolve,
	extname = path.extname,
	dirname = path.dirname,
	join = path.join,
	basename = path.basename;

module.exports = function renderFile(file, options, fn){
	if(!options.blocks){
		var blocks = {
			scripts: new Block(),
			stylesheets: new Block()
		};
		
		options.blocks = blocks;
		options.scripts = blocks.scripts;
		options.stylesheets = blocks.stylesheets;
		options.block = block.bind(blocks);
		options.stylesheet = stylesheet.bind(blocks.stylesheets);
		options.script = script.bind(blocks.scripts);
	}
	
	options.layout = layout.bind(options);
	options.partial = partial.bind(options);
	
	ejs.renderFile(file, options, function rf(err, html){
		if(err) return fn(err, html);
		
		var layout = options._layoutFile;
		
		if(layout){
			var desiredExt = `.${options.settings['view engine'] || 'ejs'}`;

			if(layout === true) layout = `${path.sep}layout${desiredExt}`;
			if(extname(layout) !== desiredExt) layout += desiredExt;

			delete options._layoutFile;
			delete options.filename;

			if(layout.length > 0 && layout[0] === path.sep){
				layout = join(options.settings.views, layout.slice(1));
			}else{
				layout = resolve(dirname(file), layout);
			}

			options.body = html;
			renderFile(layout, options, fn);
		}else{
			fn(null, html);
		}
	});
};

var cache = {};


function resolveObjectName(view){
	return cache[view] || (cache[view] = view
		.split('/')
		.slice(-1)[0]
		.split('.')[0]
		.replace(/^_/, '')
		.replace(/[^a-zA-Z0-9 ]+/g, ' ')
		.split(/ +/).map(function(word, i){
			return i ? word[0].toUpperCase() + word.substr(1) : word;
		}).join(''));
}

function lookup(root, partial, options){
	var desiredExt = `.${options.settings['view engine'] || 'ejs'}`,
		ext = extname(partial) || desiredExt,
		key = [root, partial, ext].join('-');

	if(options.cache && cache[key])return cache[key];

	var dir = dirname(partial),
		base = basename(partial, ext);

	partial = resolve(root, dir, `_${base}${ext}`);
	if(exists(partial))return options.cache ? cache[key] = partial : partial;

	partial = resolve(root, dir, base + ext);
	if(exists(partial))return options.cache ? cache[key] = partial : partial;

	partial = resolve(root, dir, base, 'index' + ext);
	partial = resolve(root, dir, base, `index${ext}`);
	if(exists(partial))return options.cache ? cache[key] = partial : partial;

	return null;
}


function partial(view, options){
	var collection, object, name;

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
		}else if(options.object !== undefined){
			object = options.object;
			delete options.object;
		}
	}else{
		options = {};
	}

	for(var k in this)
		options[k] = options[k] || this[k];

	name = options.as || resolveObjectName(view);

	var root = dirname(options.filename),
		file = lookup(root, view, options),
		key = `${file}:string`;
	
	if(!file) throw new Error(`Could not find partial ${view}`);

	var source = options.cache ? cache[key] || (cache[key] = fs.readFileSync(file, 'utf8')) : fs.readFileSync(file, 'utf8');

	options.filename = file;

	options.partial = partial.bind(options);

	function render(){
		if(object && 'string' == typeof name) options[name] = object;
		
		return ejs.render(source, options);
	}

	if(collection){
		var len = collection.length,
			buf = '',
			keys, prop, val, i;

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
	prepend: function(more){
		this.html.unshift(more);
	},
	replace: function(instead){
		this.html = [instead];
	}
};

function block(name, html){
	var blk = this[name];
	
	if(!blk) blk = this[name] = new Block();
	if(html) blk.append(html);
	
	return blk;
}

function script(path, type){
	if(path){
		this.append('<script src="' + path + '"' + (type ? 'type="' + type + '"' : '') + '></script>');
	}
	return this;
}

function stylesheet(path, media){
	if(path){
		this.append('<link rel="stylesheet" href="' + path + '"' + (media ? 'media="' + media + '"' : '') + ' />');
	}
	return this;
}

