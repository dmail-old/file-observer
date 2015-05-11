/*


*/

var proto = include('@dmail/proto');
var Notifier = include('@dmail/notifier');

var FileNotifier = proto.extend.call(Notifier, {
	fileSystem: require('fs'),

	path: null,
	watcher: null,
	lastChangeTime: null,
	changeInterval: 100,

	constructor: function(path){
		this.path = path;
		FileNotifier.super.constructor.call(this);
	},

	toString: function(){
		return '[FileNotifier ' + this.path + ']';
	},

	handleEvent: function(){
		var now = Number(new Date());

		if( now - this.lastChangeTime > this.changeInterval ){
			this.lastChangeTime = now;
			this.notify(this.path);
		}
	},

	open: function(){
		this.lastChangeTime = Number(new Date()) - this.changeInterval;
		this.watcher = this.fileSystem.watch(this.path, {persistent: false}, this.handleEvent.bind(this));
	},

	close: function(){
		this.watcher.close();
		this.watcher = null;
	},
});

var FileObserver = proto.extend({
	FileNotifier: FileNotifier,
	resolvePath: require('path').normalize,
	resolvedPaths: {},
	cache: {},

	resolve: function(path){
		var resolvedPath;

		if( path in this.resolvedPaths ){
			resolvedPath = this.resolvedPaths[path];
		}
		else{
			resolvedPath = this.resolvePath(path);
			this.resolvedPaths[path] = resolvedPath;
		}

		return resolvedPath;
	},

	getNotifier: function(path){
		path = this.resolve(path);
		return path in this.cache ? this.cache[path] : null;
	},

	constructor: function(path){
		path = this.resolve(path);
		var notifier = this.getNotifier(path);
		if( !notifier ){
			notifier = this.FileNotifier.create(path);
			this.cache[path] = this;
		}

		return notifier;
	},

	toString: function(){
		return '[FileObserver]';
	},

	observe: function(path, listener, bind){
		return this.create(path).add(listener, bind);
	},

	unobserve: function(path, listener, bind){
		return this.create(path).remove(listener, bind);
	}
});

return FileObserver;