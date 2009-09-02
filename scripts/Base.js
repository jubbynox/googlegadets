/*
	Base.js, version 1.1
	Copyright 2006-2007, Dean Edwards
	License: http://www.opensource.org/licenses/mit-license.php
	
	Extended - JAL - to have a method to help with callbacks.
*/

/**
 * Regular expression to count function arguments. Over complicated to avoid using non-greedy operator that may not be supported.
 */
var COUNT_FUNCTION_ARGS = new RegExp(/function\s*\(([^\)]*)\)/);

var Base = function() {
	// dummy
};

Base.extend = function(_instance, _static) { // subclass
	var extend = Base.prototype.extend;
	
	// build the prototype
	Base._prototyping = true;
	var proto = new this;
	extend.call(proto, _instance);
	delete Base._prototyping;
	
	// create th wrapper for the constructor function
	//var constructor = proto.constructor.valueOf(); //-dean
	var constructor = proto.constructor;
	var klass = proto.constructor = function() {
		if (!Base._prototyping) {
			if (this._constructing || this.constructor == klass) { // instantiation
				this._constructing = true;
				constructor.apply(this, arguments);
				delete this._constructing;
			} else if (arguments[0] != null) { // casting
				return (arguments[0].extend || extend).call(arguments[0], proto);
			}
		}
	};
	
	// build the class interface
	klass.ancestor = this;
	klass.extend = this.extend;
	klass.forEach = this.forEach;
	klass.implement = this.implement;
	klass.prototype = proto;
	klass.toString = this.toString;
	klass.valueOf = function(type) {
		//return (type == "object") ? klass : constructor; //-dean
		return (type == "object") ? klass : constructor.valueOf();
	};
	extend.call(klass, _static);
	// class initialisation
	if (typeof klass.init == "function") klass.init();
	return klass;
};

Base.prototype = {	
	extend: function(source, value) {
		if (arguments.length > 1) { // extending with a name/value pair
			var ancestor = this[source];
			if (ancestor && (typeof value == "function") && // overriding a method?
				// the valueOf() comparison is to avoid circular references
				(!ancestor.valueOf || ancestor.valueOf() != value.valueOf()) &&
				/\bbase\b/.test(value)) {
				// get the underlying method
				var method = value.valueOf();
				// override
				value = function() {
					var previous = this.base || Base.prototype.base;
					this.base = ancestor;
					var returnValue = method.apply(this, arguments);
					this.base = previous;
					return returnValue;
				};
				// point to the underlying method
				value.valueOf = function(type) {
					return (type == "object") ? value : method;
				};
				value.toString = Base.toString;
			}
			this[source] = value;
			// Add 'getForCallback' functionality.
			// Add 'name' to functions.
			if (typeof value == "function")
			{
				this[source].fnName = source;
			}
		} else if (source) { // extending with an object literal
			var extend = Base.prototype.extend;
			// if this object has a customised extend method then use it
			if (!Base._prototyping && typeof this != "function") {
				extend = this.extend || extend;
			}
			var proto = {toSource: null};
			// do the "toString" and other methods manually
			var hidden = ["constructor", "toString", "valueOf"];
			// if we are prototyping then include the constructor
			var i = Base._prototyping ? 0 : 1;
			while (key = hidden[i++]) {
				if (source[key] != proto[key]) {
					extend.call(this, key, source[key]);

				}
			}
			// copy each of the source object's properties to this object
			for (var key in source) {
				if (!proto[key]) extend.call(this, key, source[key]);
			}
		}
		return this;
	},

	base: function() {
		// call this method from any other method to invoke that method's ancestor
	},
	
	/**
	 * Gets the number of arguments in a function definition.
	 *
	 * @param functionSource The function source.
	 *
	 * @return The number of arguments.
	 */
	__getNumberOfArguments: function(functionSource)
	{
		var argsMatch = COUNT_FUNCTION_ARGS.exec(functionSource);
		if (!argsMatch || argsMatch.length < 1)
		{
			return 0;
		}
		
		var matchedArgs = argsMatch[1].split(',');
		
		// Test for 0 arguments.
		if (matchedArgs[0].length == 0)
		{
			return 0;
		}
		else
		{
			return matchedArgs.length;
		}
	},

	/**
	 * Creates an argument list.
	 *
	 * @param numArgs The number of arguments.
	 *
	 * @return The argument list.
	 */
	__createArgumentList: function(numArgs)
	{
		var argString = '';
		if (numArgs == 0)
		{
			return argString;
		}
		
		var argNum = 0;
		argString += 'arg' + argNum;
		while (++argNum < numArgs)
		{
			argString += ',arg' + argNum;
		}
		return argString;
	},
	
	/**
	 * Returns a function to be used in callback routines.
	 *
	 * @param callingContext The calling context to execute the function from.
	 * @param theFunction The function to execute.
	 *
	 * @return The callback function.
	 */
	getForCallback: function(callingContext, theFunction)
	{
		var callbackFunction;
		var argList = this.__createArgumentList(this.__getNumberOfArguments(theFunction));
		
		var functionCreateStr = 'callbackFunction = function(' + argList + ')';
		functionCreateStr += '{callingContext.' + theFunction.fnName + '(' + argList + ');';
		functionCreateStr += '};';
		return eval(functionCreateStr);
	}
};

// initialise
Base = Base.extend({
	constructor: function() {
		this.extend(arguments[0]);
	}
}, {
	ancestor: Object,
	version: "1.1",
	
	forEach: function(object, block, context) {
		for (var key in object) {
			if (this.prototype[key] === undefined) {
				block.call(context, object[key], key, object);
			}
		}
	},
		
	implement: function() {
		for (var i = 0; i < arguments.length; i++) {
			if (typeof arguments[i] == "function") {
				// if it's a function, call it
				arguments[i](this.prototype);
			} else {
				// add the interface using the extend method
				this.prototype.extend(arguments[i]);
			}
		}
		return this;
	},
	
	toString: function() {
		return String(this.valueOf());
	}
});