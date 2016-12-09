var express = require('express'),
	request = require('./support/http'),
	
// Test application
	app = express(),
	engine = require('..');

app
	.engine('html',engine)
	.set('view engine','html')
	.set('views',__dirname + '/fixtures')
	.set('view options',{views:__dirname+'/fixtures'});

// Test app routing
app.get('/',(req,res,next) => res.render('index'));

app.get('/blog',(req,res,next) => {
	res.render('blog/home',{
		user: {name:'Tom'},
		posts: [
			{text:'1',comments:[{text:'1.1'},{text:'1.2'}]},
			{text:'2',comments:[{text:'2.1'},{text:'2.2'},{text:'2.3'}]}
		]
	});
});

app.get('/no-layout',(req,res,next) => {
	res.render('index.ejs',{
		_layoutFile: false
	});
});

app.get('/res-locals',(req,res,next) => {
	res.render('locals.ejs',{
		hello: 'here'
	});
});

app.get('/app-locals',(req,res,next) => {
	res.render('locals.ejs');
});

app.get('/mobile',(req,res,next) => {
	res.render('index.ejs',{_layoutFile:'mobile'});
});

app.get('/mobile.ejs',(req,res,next) => {
	res.render('index.ejs',{_layoutFile:'mobile.ejs'});
});

app.get('/collection/_entry',(req,res,next) => {
	res.render('collection.ejs',{
		name: 'entry',
		list: [{name:'one'},{name:'two'}]
	});
});

app.get('/collection/thing',(req,res,next) => {
	res.render('collection.ejs',{
		name: 'thing',
		list: [{name:'one'},{name:'two'}]
	});
});

app.get('/collection/thing-path',(req,res,next) => {
	res.render('collection.ejs',{
		name: 'path/to/thing',
		list: [{name:'one'},{name:'two'}]
	});
});

app.get('/with-layout',(req,res,next) => {
	res.render('with-layout.ejs');
});

app.get('/with-layout-override',(req,res,next) => {
	res.render('with-layout.ejs',{_layoutFile:false});
});

app.get('/with-include-here',(req,res,next) => {
	res.render('with-include.ejs',{_layoutFile:false,hello:'here'});
});

app.get('/with-include-chain',(req,res,next) => {
	res.render('with-include-chain.ejs',{_layoutFile:false,hello:'chain'});
});

app.get('/with-include-chain-subfolder',(req,res,next) => {
	res.render('with-include-chain-subfolder.ejs',{_layoutFile:false,hello:'subchain'});
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
	res.render('with-include.ejs',{
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
	describe('GET /',n => {
		it('should render with layout - layout.html',done => request(app)
			.get('/')
			.end(res => {
				res.statusCode.should.equal(200);
				res.body.should.equal('<html><head><title>ejs-loft</title></head><body><h1>HTMLIndex</h1>\n</body></html>\n');
				done();
			}));
		it('one more time',done => request(app)
			.get('/')
			.end(res => {
				res.statusCode.should.equal(200);
				res.body.should.equal('<html><head><title>ejs-loft</title></head><body><h1>HTMLIndex</h1>\n</body></html>\n');
				done();
			}));
	});
	
	describe('GET /blog',n => {
		it('should render all the fiddly partials',done => request(app)
			.get('/blog')
			.end(res => {
				res.statusCode.should.equal(200);
				res.body.should.equal('<h1>Tom</h1>\n<ul>\n<li>1<ul>\n<li>1.1</li>\n<li>1.2</li>\n</ul>\n</li>\n<li>2<ul>\n<li>2.1</li>\n<li>2.2</li>\n<li>2.3</li>\n</ul>\n</li>\n</ul>\n\n');
				done();
			}));
		it('One more time:: ',done => request(app)
			.get('/blog')
			.end(res => {
				res.statusCode.should.equal(200);
				res.body.should.equal('<h1>Tom</h1>\n<ul>\n<li>1<ul>\n<li>1.1</li>\n<li>1.2</li>\n</ul>\n</li>\n<li>2<ul>\n<li>2.1</li>\n<li>2.2</li>\n<li>2.3</li>\n</ul>\n</li>\n</ul>\n\n');
				done();
			}));
	});

	/*
	describe('GET /no-layout',n => {
		it('should render without layout',done => {
			request(app)
				.get('/no-layout')
				.end(res => {
					res.should.have.status(200);
					res.body.should.equal('<h1>Index</h1>');
					done();
				});
		});
	});

	describe('GET /res-locals',n => {
		it('should render "here"',done => {
			request(app)
				.get('/res-locals')
				.end(res => {
					res.should.have.status(200);
					res.body.should.equal('<html><head><title>ejs-locals</title></head><body><h1>here</h1></body></html>');
					done();
				});
		});
	});

	describe('GET /app-locals',n => {
		it('should render "there"',done => {
			request(app)
				.get('/app-locals')
				.end(res => {
					res.should.have.status(200);
					res.body.should.equal('<html><head><title>ejs-locals</title></head><body><h1>there</h1></body></html>');
					done();
				});
		});
	});

	describe('GET /mobile',n => {
		it('should render with mobile.ejs as layout',done => {
			request(app)
				.get('/mobile')
				.end(res => {
					res.should.have.status(200);
					res.body.should.equal('<html><head><title>ejs-locals mobile</title></head><body><h1>Index</h1></body></html>');
					done();
				});
		});
	});

	describe('GET /mobile.ejs',n => {
		it('should render with mobile.ejs as layout',done => {
			request(app)
				.get('/mobile.ejs')
				.end(res => {
					res.should.have.status(200);
					res.body.should.equal('<html><head><title>ejs-locals mobile</title></head><body><h1>Index</h1></body></html>');
					done();
				});
		});
	});

	describe('GET /collection/_entry',n => {
		it('should render _entry.ejs for every item with layout.ejs as layout',done => {
			request(app)
				.get('/collection/_entry')
				.end(res => {
					res.should.have.status(200);
					res.body.should.equal('<html><head><title>ejs-locals</title></head><body><ul><li>one</li><li>two</li></ul></body></html>');
					done();
				});
		});
	});

	describe('GET /collection/thing-path',n => {
		it('should render thing/index.ejs for every item with layout.ejs as layout',done => {
			request(app)
				.get('/collection/thing-path')
				.end(res => {
					res.should.have.status(200);
					res.body.should.equal('<html><head><title>ejs-locals</title></head><body><ul><li>one</li><li>two</li></ul></body></html>');
					done();
				});
		});
	});

	describe('GET /collection/thing',n => {
		it('should render thing/index.ejs for every item with layout.ejs as layout',done => {
			request(app)
				.get('/collection/thing')
				.end(res => {
					res.should.have.status(200);
					res.body.should.equal('<html><head><title>ejs-locals</title></head><body><ul><li>one</li><li>two</li></ul></body></html>');
					done();
				});
		});
	});

	describe('GET /with-layout',n => {
		it('should use layout.ejs when rendering with-layout.ejs',done => {
			request(app)
				.get('/with-layout')
				.end(res => {
					res.should.have.status(200);
					res.body.should.equal('<html><head><title>ejs-locals</title></head><body><h1>Index</h1></body></html>');
					done();
				});
		});
	});

	describe('GET /with-layout-override',n => {
		it('should use layout.ejs when rendering with-layout.ejs, even if layout=false in options',done => {
			request(app)
				.get('/with-layout-override')
				.end(res => {
					res.should.have.status(200);
					res.body.should.equal('<html><head><title>ejs-locals</title></head><body><h1>Index</h1></body></html>');
					done();
				});
		});
	});

	describe('GET /with-include-here',n => {
		it('should include and interpolate locals.ejs when rendering with-include.ejs',done => {
			request(app)
				.get('/with-include-here')
				.end(res => {
					res.should.have.status(200);
					res.body.should.equal('<html><head><title>ejs-locals</title></head><body><h1>here</h1></body></html>');
					done();
				});
		});
	});

	describe('GET /with-include-there',n => {
		it('should include and interpolate locals.ejs when rendering with-include.ejs',done => {
			request(app)
				.get('/with-include-there')
				.end(res => {
					res.should.have.status(200);
					res.body.should.equal('<html><head><title>ejs-locals</title></head><body><h1>there</h1></body></html>');
					done();
				});
		});
	});

	describe('GET /with-include-chain',n => {
		it('should include and interpolate include-chain-2.ejs when rendering with-include-chain.ejs',done => {
			request(app)
				.get('/with-include-chain')
				.end(res => {
					res.should.have.status(200);
					res.body.should.equal('<html><head><title>ejs-locals-include</title></head><body><h1>chain</h1></body></html>');
					done();
				});
		});
	});

	describe('GET /with-include-chain-subfolder',n => {
		it('should include and interpolate parent-include-chain.ejs when rendering with-include-chain-subfolder.ejs',done => {
			request(app)
				.get('/with-include-chain-subfolder')
				.end(res => {
					res.should.have.status(200);
					res.body.should.equal('<html><head><title>ejs-locals-include-sub</title></head><body><h1>subchain</h1></body></html>');
					done();
				});
		});
	});

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
