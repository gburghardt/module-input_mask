(function(InputMaskModule) {

var _id = 0,
    _templates = {};

function Template(grammar, mask, name) {
	this.grammar = grammar || null;

	if (mask) {
		this.setMask(mask);
	}

	this.name = name || String(++_id);
}

Template.defaultGrammar = new InputMaskModule.Grammar();

Template.getByElement = function(element) {
	var name = element.getAttribute("data-mask-name"),
	    mask = element.getAttribute("data-mask");

	if (name) {
		if (_templates[name]) {
			return _templates[name];
		}
		else {
			throw new Error("No instance of InputMaskModule.Template found for name: " + name);
		}
	}
	else if (mask) {
		if (!_templates[mask]) {
			_templates[mask] = new Template(Template.defaultGrammar, mask);
		}

		return _templates[mask];
	}
	else {
		throw new Error("Missing one of data-mask or data-mask-name on " + element.nodeName);
	}
};

Template.register = function(name, mask) {
	if (_templates[name]) {
		throw new Error("A template named '" + name + "' has already been registered");
	}

	_templates[name] = new Template(Template.defaultGrammar, mask, name);

	return _templates[name];
};

Template.prototype = {

	grammar: null,

	mask: "",

	maskChars: null,

	name: null,

	constructor: Template,

	getMaskedValue: function(value) {
		var maskChars = this.mask.split(""),
		    valueChars = value.split(""),
		    i = 0, length = maskChars.length,
		    mc, vc, maskedValue = "",
		    grammar = this.grammar,
		    placeholder = grammar.placeholder;

		for (i; i < length; i++) {
			mc = maskChars[i];
			vc = valueChars[i] || "";

			if (mc === grammar.charMarker) {
				maskedValue += grammar.chars.test(vc) ? vc : placeholder;
			}
			else if (mc === grammar.digitMarker) {
				maskedValue += grammar.digits.test(vc) ? vc : placeholder;
			}
			else {
				maskedValue += vc || mc;
			}
		}

		return maskedValue;
	},

	getPlaceholder: function() {
		return this.grammar.placeholder;
	},

	isEmptyValue: function(value) {
		var emptyValue = this.mask
			.replace(new RegExp(this.grammar.digitMarker, "g"), this.grammar.placeholder)
			.replace(new RegExp(this.grammar.charMarker, "g"), this.grammar.placeholder);

		return emptyValue === value;
	},

	isNonFiller: function(c) {
		return this.grammar.any.test(c);
	},

	isChar: function(c) {
		return this.grammar.chars.test(c);
	},

	isDigit: function(c) {
		return this.grammar.digits.test(c);
	},

	isFiller: function(c) {
		return this.grammar.filler.test(c);
	},

	isPlaceholder: function(c) {
		return this.grammar.placeholder === c;
	},

	isSameCharClass: function(a, b) {
		return (a >= 0 && b < this.maskChars.length)
		       ? this.maskChars[a] === this.maskChars[b]
		       : false;
	},

	isValidCharAt: function(c, index) {
		if (index < 0 || index >= this.maskChars.length) {
			return false;
		}
		else {
			return this.maskChars[index].test(c);
		}
	},

	_nextCharIndex: function(start, type, chars) {
		var index = -1,
		    i = start,
		    length = chars.length;

		for (i; i < length; i++) {
			if (type.test(chars[i])) {
				index = i;
				break;
			}
		}

		return index;
	},

	// removeNextChar: function(start, text) {
	// 	var chars = text.split("");

	// 	if (start < 0) {
	// 		return {
	// 			text: text,
	// 			start: 0,
	// 			end: 0,
	// 			length: 0
	// 		};
	// 	}

	// 	var actualStart = this._nextCharIndex(start, this.grammar.any, chars),
	// 	    i = actualStart,
	// 	    type,
	// 	    shiftIndex = -1,
	// 	    charCount = chars.length,
	// 	    direction = 1;

	// 	if (actualStart > -1) {
	// 		type = this.maskChars[i];

	// 		var callback = function(x) { return x < charCount; };

	// 		//for (i; i < charCount; i++) {
	// 		while (callback(i)) {
	// 			if (type.test(chars[i])) {
	// 				shiftIndex = (shiftIndex === -1)
	// 				           ? this._nextCharIndex(i + 1, type, chars)
	// 				           : this._nextCharIndex(shiftIndex + 1, type, chars);

	// 				if (shiftIndex > -1 && shiftIndex < charCount && type.test(chars[shiftIndex])) {
	// 					chars[i] = chars[shiftIndex];
	// 				}
	// 				else {
	// 					chars[i] = this.grammar.placeholder;
	// 				}
	// 			}

	// 			i += direction;
	// 		}
	// 	}
	// 	else {
	// 		actualStart = start;
	// 	}

	// 	return {
	// 		text: chars.join(""),
	// 		start: actualStart,
	// 		end: actualStart,
	// 		length: 0
	// 	};
	// },

	removeNextChar: function(start, text) {
		return this.removeChars(start, 1, 1, text);
	},

	removePrevChar: function(start, text) {
		throw new Error("Not Implemented!");
	},

	removeChars: function(start, count, direction, text) {
		start = (start < 0) ? 0 : start;
		count = (count <= 0) ? 1 : count;
		direction = direction < 0 ? -1 : 1;

		var chars = text.split(""),
		    actualStart = this._nextCharIndex(start, this.grammar.any, chars),
		    i = actualStart,
		    type, condition,
		    shiftIndex = -1,
		    charCount = chars.length;

		if (actualStart > -1) {
			if (count === 1) {
				// TODO: Put this into a function: _shiftCharacters(...)
				type = this.maskChars[i];
				condition = (direction === 1)
			          ? function(x) { return x < charCount; }
			          : function(x) { return x >= 0 };

				while (condition(i)) {
					if (type.test(chars[i])) {
						shiftIndex = (shiftIndex === -1)
						           ? this._nextCharIndex(i + count, type, chars)
						           : this._nextCharIndex(shiftIndex + 1, type, chars);

						if (shiftIndex > -1 && shiftIndex < charCount && type.test(chars[shiftIndex])) {
							chars[i] = chars[shiftIndex];
						}
						else {
							chars[i] = this.grammar.placeholder;
						}
					}

					i += direction;
				}
			}
			else {
				// TODO: Put this into a function: _removeRange(...)
				var length = (i + count > charCount)
				           ? charCount
				           : i + count;

				type = this.grammar.any;

				for (i; i < length; i++) {
					if (type.test(chars[i])) {
						chars[i] = this.grammar.placeholder;
					}
				}
			}
		}
		else {
			actualStart = start;
		}

		return {
			text: chars.join(""),
			start: actualStart,
			end: actualStart,
			length: 0
		};
	},

	// TODO: Is this the same as removeNextChar with count = 1?
	// removeChars: function(start, count, chars) {
	// 	if (start < 0) {
	// 		return chars;
	// 	}

	// 	var i = this._nextCharIndex(start, this.grammar.any, chars),
	// 	    charCount = chars.length,
	// 	    shiftIndex = i + count - 1,
	// 	    type;

	// 	if (i > -1 && i < this.maskChars.length) {
	// 		type = this.maskChars[i] || null;

	// 		for (i; i < charCount; i++) {
	// 			if (type.test(chars[i])) {
	// 				shiftIndex = (shiftIndex === -1)
	// 				           ? this._nextCharIndex(i + count, type, chars)
	// 				           : this._nextCharIndex(shiftIndex + 1, type, chars);

	// 				if (shiftIndex > -1 && shiftIndex < charCount && type.test(chars[shiftIndex])) {
	// 					chars[i] = chars[shiftIndex];
	// 				}
	// 				else {
	// 					chars[i] = this.grammar.placeholder;
	// 				}
	// 			}
	// 		}
	// 	}

	// 	return chars;
	// },

	setMask: function(mask) {
		if (!this.grammar) {
			throw new Error("Cannot set mask without a grammar object");
		}

		this.mask = mask;
		this.maskChars = this.grammar.compile(mask);
	},

	test: function(value) {
		var chars = value.split(""),
		    i = 0,
		    length = chars.length,
		    valid = true,
		    totalMaskChars = this.maskChars.length,
		    c;

		if (length != totalMaskChars) {
			valid = false;
		}
		else {
			for (i; i < length; i++) {
				c = chars[i];

				if (c === this.grammar.placeholder) {
					continue;
				}
				else if (i >= totalMaskChars || !this.maskChars[i].test(c)) {
					valid = false;
					break;
				}
			}
		}

		return valid;
	}

};

InputMaskModule.Template = Template;

})(InputMaskModule);
