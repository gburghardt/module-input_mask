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

	DIRECTION_BACKWARDS: -1,
	DIRECTION_FORWARDS: 1,

	grammar: null,

	mask: "",

	maskChars: null,

	name: null,

	constructor: Template,

	addCharacter: function(start, newChar, text) {
		var chars = text.split(""),
		    type = this.grammar.anyOrPlaceholder,
		    actualStart = this._nextCharIndex(start, this.DIRECTION_FORWARDS, type, chars),
		    i = actualStart,
		    charCount = chars.length,
		    selection = new Selection(actualStart, actualStart, text);

		if (actualStart < 0) {
			selection.setRange(start);
		}
		else if (this._isValidCharAt(newChar, actualStart)) {
			chars[actualStart] = newChar;
			i = this._nextCharIndex(actualStart + 1, this.DIRECTION_FORWARDS, type, chars);

			if (i > -1) {
				selection.text = chars.join("");
				selection.setRange(i);
			}
			else if (actualStart === charCount - 1) {
				selection.text = chars.join("");
				selection.setRange(charCount);
			}
		}

		return selection;
	},

	addCharacters: function(start, newChars, text) {
		var i = 0,
		    chars = text.split(""),
		    type = this.grammar.anyOrPlaceholder,
		    index, selection, c;

		if (start >= chars.length) {
			selection = new Selection(start, start, text);
		}
		else {
			index = this._nextCharIndex(start, this.DIRECTION_FORWARDS, type, chars);
			selection = new Selection(index, index);

			while (c = newChars.charAt(i++)) {
				if (this._isValidCharAt(c, index)) {
					chars[index] = c;
					index = this._nextCharIndex(index + 1, this.DIRECTION_FORWARDS, type, chars);;
					selection.setRange((index > -1) ? index : chars.length);
				}
			}

			selection.text = chars.join("");
		}

		return selection;
	},

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

	_isValidCharAt: function(c, index) {
		if (index < 0 || index >= this.maskChars.length) {
			return false;
		}
		else {
			return this.maskChars[index].test(c);
		}
	},

	_nextCharIndex: function(start, direction, type, chars) {
		var index = -1,
		    i = start,
		    length = chars.length;

		if (direction === 1) {
			for (i; i < length; i++) {
				if (type.test(chars[i])) {
					index = i;
					break;
				}
			}
		}
		else {
			while (i--) {
				if (type.test(chars[i])) {
					index = i;
					break;
				}
			}
		}

		return index;
	},

	removeNextChar: function(start, text) {
		return this._removeChars(start, 0, this.DIRECTION_FORWARDS, text);
	},

	removePrevChar: function(start, text) {
		return this._removeChars(start, 0, this.DIRECTION_BACKWARDS, text);
	},

	removeCharRange: function(start, end, text) {
		return this._removeChars(start, end - start, this.DIRECTION_FORWARDS, text);
	},

	_removeChars: function(start, count, direction, text) {
		start = (start < 0) ? 0 : start;
		count = (count < 0) ? 0 : count;
		direction = direction < 0 ? -1 : 1;

		var selection = new Selection(start, start),
		    chars = text.split("");

		if (count === 0) {
			this._shiftCharacters(selection, start, direction, chars);
		}
		else {
			this._removeCharacterRange(selection, start, count, chars);
		}

		selection.text = chars.join("");

		return selection;
	},

	_removeCharacterRange: function(selection, start, count, chars) {
		var actualStart = this._nextCharIndex(start, 1, this.grammar.any, chars),
		    i = actualStart,
		    charCount = chars.length,
		    length = (i + count > charCount)
		           ? charCount
		           : i + count,
		    type = this.grammar.any;

		if (i < 0 || i >= charCount - 1) {
			return;
		}

		for (i; i < length; i++) {
			if (type.test(chars[i])) {
				chars[i] = this.grammar.placeholder;
			}
		}

		selection.start = selection.end = actualStart;
	},

	_shiftCharacters: function(selection, start, direction, chars) {
		var count = 1,
		    actualStart = this._nextCharIndex(start, direction, this.grammar.any, chars),
		    i = actualStart,
		    type = this.maskChars[i],
		    shiftIndex = -1,
		    charCount = chars.length;

		if (i < 0 || i >= charCount) {
			return;
		}

		for (i; i < charCount; i++) {
			if (type.test(chars[i])) {
				shiftIndex = (shiftIndex === -1)
				           ? this._nextCharIndex(i + count, this.DIRECTION_FORWARDS, type, chars)
				           : this._nextCharIndex(shiftIndex + 1, this.DIRECTION_FORWARDS, type, chars);

				if (shiftIndex > -1 && shiftIndex < charCount && type.test(chars[shiftIndex])) {
					chars[i] = chars[shiftIndex];
				}
				else {
					chars[i] = this.grammar.placeholder;
				}
			}
		}

		selection.start = selection.end = actualStart;
	},

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

function Selection(start, end, text) {
	if (typeof start === "number") {
		this.setRange(start, end);
	}

	if (text !== undefined) {
		this.text = text;
	}
}

Selection.prototype = {
	end: 0,
	length: 0,
	start: 0,
	text: null,

	constructor: Selection,

	setRange: function(start, end) {
		if (end === undefined) {
			this.start = this.end = start;
		}
		else {
			this.start = start;
			this.end = end;
		}

		this.length = this.end - this.start;
	}
};

})(InputMaskModule);
