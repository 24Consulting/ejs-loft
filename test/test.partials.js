var express = require('express'),
	request = require('./support/http'),
	
// Test application
	log = res => (err,html) => {
		if(err){
			console.log(err);
			res.status(500);
		}
		res.end(html || 'ERROR');
	},
	app = express(),
	engine = require('..');

app
	.engine('html',engine)
	.set('view engine','html')
	.set('views',__dirname + '/fixtures')
	.set('view options',{views:__dirname+'/fixtures'});

app.locals.hello = 'there';
app.locals._layoutFile = 'layout';

// Test app routing
app.get('/',(req,res,next) => res.render('index'));

app.get('/blog',(req,res,next) => res.render('blog/home',{
	_layoutFile: false,
	user: {name:'Tom'},
	posts: [
		{text:'1',comments:[{text:'1.1'},{text:'1.2'}]},
		{text:'2',comments:[{text:'2.1'},{text:'2.2'},{text:'2.3'}]}
	]
}));

app.get('/res-locals',(req,res,next) => res.render('locals',{hello:'here',_layoutFile:'layout'}));

app.get('/app-locals',(req,res,next) => res.render('locals',log(res)));

app.get('/mobile',(req,res,next) => {
	res.render('index',{_layoutFile:'mobile'});
});

app.get('/collection/_entry',(req,res,next) => {
	res.render('collection',{
		name: '_entry',
		list: [{name:'one'},{name:'two'}]
	},log(res));
});

app.get('/collection/thing',(req,res,next) => {
	res.render('collection.html',{
		name: 'thing',
		list: [{name:'one'},{name:'two'}]
	});
});

app.get('/collection/thing-path',(req,res,next) => res.render('collection.html',{
	name: 'path/to/thing',
	list: [{name:'one'},{name:'two'}]
},log(res)));

app.get('/with-layout',(req,res,next) => {
	res.render('with-layout');
});

app.get('/with-layout-override',(req,res,next) => {
	res.render('with-layout',{_layoutFile:false});
});

app.get('/with-include-here',(req,res,next) => {
	res.render('with-include',{_layoutFile:false,hello:'here'});
});

app.get('/with-include-chain',(req,res,next) => {
	res.render('with-include-chain',{_layoutFile:false,hello:'chain'});
});

app.get('/with-include-chain-subfolder',(req,res,next) => {
	res.render('with-include-chain-subfolder.html',{_layoutFile:false,hello:'subchain'});
});

app.get('/with-two-includes',(req,res,next) => {
	res.render('with-two-includes.ejs',{
		_layoutFile: false,
		hello: 'hello'
	});
});

app.get('/with-absolute-include',(req,res,next) => {
	res.render('with-absolute-include.ejs',{
		_layoutFile: false,
		hello: 'hello'
	});
});

app.get('/with-absolute-sub-include',(req,res,next) => {
	res.render('with-absolute-sub-include.ejs',{
		_layoutFile: false,
		hello: 'hello'
	});
});

app.get('/with-include-there',(req,res,next) => {
	res.render('with-include',{
		_layoutFile: false
	});
});

app.get('/with-blocks',(req,res,next) => {
	res.render('with-blocks.ejs',{
		_layoutFile: false
	});
});

app.get('/deep-inheritance',(req,res,next) => {
	res.render('inherit-grandchild.ejs');
});

app.get('/deep-inheritance-blocks',(req,res,next) => {
	res.render('inherit-grandchild-blocks.ejs');
});

app.get('/subfolder/subitem',(req,res,next) => {
	res.render('subfolder/subitem.ejs');
});

app.get('/subfolder/subitem-with-layout',(req,res,next) => {
	res.render('subfolder/subitem-with-layout.ejs');
});

app.get('/non-existent-partial',(req,res,next) => {
	res.render('non-existent-partial.ejs');
});

app.get('/filters',(req,res,next) => {
	res.render('filters.ejs',{
		hello: 'hello'
	});
});

// since ejs 2.0 filters is not there anymore
// ejs.filters.embrace = s => `(${s})`;

app.get('/filters-custom',(req,res,next) => {
	res.render('filters-custom.ejs',{
		hello: 'hello'
	});
});

app.use((err,req,res,next) => {
	res.status(500).send(err.stack);
});


/*global describe it */
describe('app',n => {
	describe('Render template. Layout specified in code.',n => {
		var check = '<html><head><title>ejs-loft</title></head><body><h1>HTMLIndex</h1>\n</body></html>\n';
		it('Should render with layout - layout.html',done => request(app)
			.get('/')
			.end(res => {
				res.statusCode.should.equal(200);
				res.body.should.equal(check);
				done();
			}));
		it('one more time',done => request(app)
			.get('/')
			.end(res => {
				res.statusCode.should.equal(200);
				res.body.should.equal(check);
				done();
			}));
	});
	
	describe('Render partials',n => {
		var check = '<h1>Tom</h1>\n<ul>\n<li>1<ul>\n<li>1.1</li>\n<li>1.2</li>\n</ul>\n</li>\n<li>2<ul>\n<li>2.1</li>\n<li>2.2</li>\n<li>2.3</li>\n</ul>\n</li>\n</ul>\n\n';
		it('should render all the fiddly partials',done => request(app)
			.get('/blog')
			.end(res => {
				res.statusCode.should.equal(200);
				res.body.should.equal(check);
				done();
			}));
		it('one more time',done => request(app)
			.get('/blog')
			.end(res => {
				res.statusCode.should.equal(200);
				res.body.should.equal(check);
				done();
			}));
	});
	
	describe('Render template. Layout specified in options.',n => {
		var check = '<html><head><title>ejs-loft</title></head><body><h1>here</h1>\n</body></html>\n';
		it('should render "here"',done => request(app)
			.get('/res-locals')
			.end(res => {
				res.statusCode.should.equal(200);
				res.body.should.equal(check);
				done();
			}));
		
		it('one more time',done => request(app)
			.get('/res-locals')
			.end(res => {
				res.statusCode.should.equal(200);
				res.body.should.equal(check);
				done();
			}));
	});
	
	describe('Render template. Layout set in app.locals',n => {
		var check = '<html><head><title>ejs-loft</title></head><body><h1>there</h1>\n</body></html>\n';
		it('should render "there"',done => request(app)
			.get('/app-locals')
			.end(res => {
				res.statusCode.should.equal(200);
				res.body.should.equal(check);
				done();
			}));
		
		it('one more time',done => request(app)
			.get('/app-locals')
			.end(res => {
				res.statusCode.should.equal(200);
				res.body.should.equal(check);
				done();
			}));
	});
	
	describe('Render template. Overwrite layout in options.',n => {
		var check = '<html><head><title>ejs-loft mobile</title></head><body><h1>HTMLIndex</h1>\n</body></html>\n';
		it('should render with mobile.html as layout',done => request(app)
			.get('/mobile')
			.end(res => {
				res.statusCode.should.equal(200);
				res.body.should.equal(check);
				done();
			}));
		it('one more time',done => request(app)
			.get('/mobile')
			.end(res => {
				res.statusCode.should.equal(200);
				res.body.should.equal(check);
				done();
			}));
	});
	
	describe('GET /collection/_entry',n => {
		var check = '<html><head><title>ejs-loft</title></head><body><ul>\n<li>one</li>\n<li>two</li>\n</ul>\n</body></html>\n';
		it('should render _entry.ejs for every item with layout.ejs as layout',done => {
			request(app)
				.get('/collection/_entry')
				.end(res => {
					res.statusCode.should.equal(200);
					res.body.should.equal(check);
					done();
				});
		});
		it('one more time',done => {
			request(app)
				.get('/collection/_entry')
				.end(res => {
					res.statusCode.should.equal(200);
					res.body.should.equal(check);
					done();
				});
		});
	});
	
	describe('GET /collection/thing-path',n => {
		var check = '<html><head><title>ejs-loft</title></head><body><ul>\n<li>one</li>\n<li>two</li>\n</ul>\n</body></html>\n';
		it('should render thing/index.ejs for every item with layout.ejs as layout',done => request(app)
			.get('/collection/thing-path')
			.end(res => {
				res.statusCode.should.equal(200);
				res.body.should.equal(check);
				done();
			}));
		it('one more time',done => request(app)
			.get('/collection/thing-path')
			.end(res => {
				res.statusCode.should.equal(200);
				res.body.should.equal(check);
				done();
			}));
	});
	
	describe('GET /collection/thing',n => {
		var check = '<html><head><title>ejs-loft</title></head><body><ul>\n<li>one</li>\n<li>two</li>\n</ul>\n</body></html>\n';
		it('should render thing/index.ejs for every item with layout.ejs as layout',done => {
			request(app)
				.get('/collection/thing')
				.end(res => {
					res.statusCode.should.equal(200);
					res.body.should.equal(check);
					done();
				});
		});
		it('one more time',done => {
			request(app)
				.get('/collection/thing')
				.end(res => {
					res.statusCode.should.equal(200);
					res.body.should.equal(check);
					done();
				});
		});
	});
	
	describe('GET /with-layout',n => {
		var check = '<html><head><title>ejs-loft</title></head><body><h1>Index</h1>\n</body></html>\n';
		it('should use layout.html when rendering with-layout.html',done => {
			request(app)
				.get('/with-layout')
				.end(res => {
					res.statusCode.should.equal(200);
					res.body.should.equal(check);
					done();
				});
		});
		
		it('one more time',done => {
			request(app)
				.get('/with-layout')
				.end(res => {
					res.statusCode.should.equal(200);
					res.body.should.equal(check);
					done();
				});
		});
	});
	
	describe('GET /with-layout-override',n => {
		// this test and functionality differs from original ejs-locals.
		// I believe options should be preferred instead of template layout when layout settings passed
		var check = '<h1>Index</h1>\n';
		it('should not use layout when rendering with-layout.html, even if template has layout specified in code',done => {
			request(app)
				.get('/with-layout-override')
				.end(res => {
					res.statusCode.should.equal(200);
					res.body.should.equal(check);
					done();
				});
		});
		
		it('one more time',done => {
			request(app)
				.get('/with-layout-override')
				.end(res => {
					res.statusCode.should.equal(200);
					res.body.should.equal(check);
					done();
				});
		});
	});

	describe('GET /with-include-here',n => {
		var check = '<html><head><title>ejs-loft</title></head><body><h1>here</h1></body></html>\n';
		it('should include and interpolate locals.html when rendering with-include.html',done => {
			request(app)
				.get('/with-include-here')
				.end(res => {
					res.statusCode.should.equal(200);
					res.body.should.equal(check);
					done();
				});
		});
		
		it('one more time',done => {
			request(app)
				.get('/with-include-here')
				.end(res => {
					res.statusCode.should.equal(200);
					res.body.should.equal(check);
					done();
				});
		});
	});
	
	describe('GET /with-include-there',n => {
		var check = '<html><head><title>ejs-loft</title></head><body><h1>there</h1></body></html>\n';
		it('should include and interpolate locals.html when rendering with-include.html',done => {
			request(app)
				.get('/with-include-there')
				.end(res => {
					res.statusCode.should.equal(200);
					res.body.should.equal(check);
					done();
				});
		});
		it('one more time',done => {
			request(app)
				.get('/with-include-there')
				.end(res => {
					res.statusCode.should.equal(200);
					res.body.should.equal(check);
					done();
				});
		});
	});
	
	describe('GET /with-include-chain',n => {
		var check = '<html><head><title>ejs-loft-include</title></head><body><h1>chain</h1></body></html>\n';
		it('should include and interpolate include-chain-2.html when rendering with-include-chain.html',done => {
			request(app)
				.get('/with-include-chain')
				.end(res => {
					res.statusCode.should.equal(200);
					res.body.should.equal(check);
					done();
				});
		});
		it('one more time',done => {
			request(app)
				.get('/with-include-chain')
				.end(res => {
					res.statusCode.should.equal(200);
					res.body.should.equal(check);
					done();
				});
		});
	});
	
	describe('GET /with-include-chain-subfolder',n => {
		var check = '<html><head><title>ejs-loft-include-sub</title></head><body><h1>subchain</h1></body></html>\n';
		it('should include and interpolate parent-include-chain.html when rendering with-include-chain-subfolder.html',done => {
			request(app)
				.get('/with-include-chain-subfolder')
				.end(res => {
					res.statusCode.should.equal(200);
					res.body.should.equal(check);
					done();
				});
		});
	});
	
	/*
	describe('GET /with-two-includes',n => {
		it('should include both files and interpolate the same data',done => {
			request(app)
				.get('/with-two-includes')
				.end(res => {
					res.should.have.status(200);
					res.body.should.equal('<html><head><title>ejs-locals-two-includes</title></head><body><h1>hello</h1><h1>Index</h1></body></html>');
					done();
				});
		});
	});

	describe('GET /with-absolute-include',n => {
		it('should include locals.ejs and interpolate the data correctly',done => {
			request(app)
				.get('/with-absolute-include')
				.end(res => {
					res.should.have.status(200);
					res.body.should.equal('<html><head><title>ejs-locals-abs</title></head><body><h1>hello</h1></body></html>');
					done();
				});
		});
	});

	describe('GET /with-absolute-sub-include',n => {
		it('should include subfolder/sublocals.ejs and include subfolder/subitem.ejs correctly',done => {
			request(app)
				.get('/with-absolute-sub-include')
				.end(res => {
					res.should.have.status(200);
					res.body.should.equal('<html><head><title>ejs-locals-abs-sub</title></head><body><h1>Index</h1></body></html>');
					done();
				});
		});
	});

	describe('GET /with-blocks',n => {
		it('should arrange blocks into layout-with-blocks.ejs when rendering with-blocks.ejs',done => {
			request(app)
				.get('/with-blocks')
				.end(res => {
					res.should.have.status(200);
					res.body.should.equal('<li><a href="hello.html">there</a></li><p>What\'s up?</p>© 2012');
					done();
				});
		});
	});

	describe('GET /deep-inheritance',n => {
		it('should recurse and keep applying layouts until done',done => {
			request(app)
				.get('/deep-inheritance')
				.end(res => {
					res.should.have.status(200);
					res.body.should.equal('<html><head><title>ejs-locals</title></head><body><i>I am grandchild content.</i><b>I am child content.</b><u>I am parent content.</u></body></html>');
					done();
				});
		});
	});

	describe('GET /deep-inheritance-blocks',n => {
		it('should recurse and keep applying blocks to layouts until done',done => {
			request(app)
				.get('/deep-inheritance-blocks')
				.end(res => {
					res.should.have.status(200);
					res.body.should.equal('<html><head><title>ejs-locals</title><script src="gc.js"></script>\n<script src="c.js"></script><link rel="stylesheet" href="gc.css" />\n<link rel="stylesheet" href="c.css" /></head><body><i>I am grandchild content.</i><b>I am child content.</b><u>I am parent content.</u></body></html>');
					done();
				});
		});
	});

	describe('GET /subfolder/subitem',n => {
		it('should render subfolder/subitem.ejs and still use layout.ejs',done => {
			request(app)
				.get('/subfolder/subitem')
				.end(res => {
					res.should.have.status(200);
					res.body.should.equal('<html><head><title>ejs-locals</title></head><body><h1>Index</h1></body></html>');
					done();
				});
		});
	});

	describe('GET /subfolder/subitem-with-layout',n => {
		it('should render subitem-with-layout.ejs using sub-layout.ejs',done => {
			request(app)
				.get('/subfolder/subitem-with-layout')
				.end(res => {
					res.should.have.status(200);
					res.body.should.equal('<html><head><title>ejs-locals sub-layout</title></head><body><h1>Index</h1></body></html>');
					done();
				});
		});
	});

	describe('GET /non-existent-partial',n => {
		it('should send 500 and error saying a partial was not found',done => {
			request(app)
				.get('/non-existent-partial')
				.end(res => {
					res.should.have.status(500);
					res.body.should.include('Could not find partial non-existent');
					done();
				});
		});
	});

	describe('GET /filters',n => {
		it('should allow use of default ejs filters like upcase',done => {
			request(app)
				.get('/filters')
				.end(res => {
					res.should.have.status(200);
					res.body.should.equal('<html><head><title>ejs-locals</title></head><body><h1>HELLO</h1></body></html>');
					done();
				});
		});
	});

	describe('GET /filters-custom',n => {
		it('should allow use of custom ejs filters like embrace',done => {
			request(app)
				.get('/filters-custom')
				.end(res => {
					res.should.have.status(200);
					res.body.should.equal('<html><head><title>ejs-locals</title></head><body><h1>HELLO</h1><h1>(hello)</h1></body></html>');
					done();
				});
		});
	});
	*/
});
