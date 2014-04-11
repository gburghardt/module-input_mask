(function(InputMask) {

var _id = 0,
    _templates = {};

function Template() {

	var DIRECTION_BACKWARDS = -1,
	    DIRECTION_FORWARDS = 1;

	var _emptyValue,
	    _grammar,
	    _mask,
	    _maskChars,
	    _name;

	function initialize(grammar, mask, name) {
		_grammar = grammar || null;

		if (mask) {
			setMask(mask);
		}

		_name = name || String(++_id);
	}

	function addCharacter(start, newChar, text) {
		var chars = text.split(""),
		    type = _grammar.anyOrPlaceholder,
		    actualStart = nextCharIndex(start, DIRECTION_FORWARDS, type, chars),
		    i = actualStart,
		    charCount = chars.length,
		    selection = new Selection(actualStart, actualStart, text);

		if (actualStart < 0) {
			selection.setRange(start);
		}
		else if (isValidCharAt(newChar, actualStart)) {
			chars[actualStart] = newChar;
			i = nextCharIndex(actualStart + 1, DIRECTION_FORWARDS, type, chars);

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
	}

	function addCharacters(start, newChars, text) {
		var i = 0,
		    chars = text.split(""),
		    type = _grammar.anyOrPlaceholder,
		    index, selection, c;

		if (start >= chars.length) {
			selection = new Selection(start, start, text);
		}
		else {
			index = nextCharIndex(start, DIRECTION_FORWARDS, type, chars);
			selection = new Selection(index, index);

			while (c = newChars.charAt(i++)) {
				if (isValidCharAt(c, index)) {
					chars[index] = c;
					index = nextCharIndex(index + 1, DIRECTION_FORWARDS, type, chars);
					selection.setRange((index > -1) ? index : chars.length);
				}
			}

			selection.text = chars.join("");
		}

		return selection;
	}

	function getEmptyValue() {
		var c, i = 0, chars = [];

		while (c = _mask.charAt(i++)) {
			if (c === _grammar.digitMarker || c === _grammar.charMarker) {
				chars.push(_grammar.placeholder);
			}
			else {
				chars.push(c);
			}
		}

		return chars.join("");
	}

	function getMaskedValue(value) {
		return addCharacters(0, value, _emptyValue).text;
	}

	function getPlaceholder() {
		return _grammar.placeholder;
	}

	function isEmptyValue(value) {
		var emptyValue = _mask.replace(new RegExp("[" + _grammar.digitMarker + _grammar.charMarker + "]+", "g"),
			_grammar.placeholder);

		return emptyValue === value;
	}

	function isValidCharAt(c, index) {
		if (index < 0 || index >= _maskChars.length) {
			return false;
		}
		else {
			return _maskChars[index].test(c);
		}
	}

	function nextCharIndex(start, direction, type, chars) {
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
	}

	function removeNextChar(start, text) {
		return removeChars(start, 0, DIRECTION_FORWARDS, text);
	}

	function removePrevChar(start, text) {
		return removeChars(start, 0, DIRECTION_BACKWARDS, text);
	}

	function removeCharRange(start, end, text) {
		return removeChars(start, end - start, DIRECTION_FORWARDS, text);
	}

	function removeChars(start, count, direction, text) {
		start = (start < 0) ? 0 : start;
		count = (count < 0) ? 0 : count;
		direction = direction < 0 ? -1 : 1;

		var selection = new Selection(start, start),
		    chars = text.split("");

		if (count === 0) {
			shiftCharacters(selection, start, direction, chars);
		}
		else {
			removeCharacterRange(selection, start, count, chars);
		}

		selection.text = chars.join("");

		return selection;
	}

	function removeCharacterRange(selection, start, count, chars) {
		var actualStart = nextCharIndex(start, 1, _grammar.any, chars),
		    i = actualStart,
		    charCount = chars.length,
		    length = (i + count > charCount)
		           ? charCount
		           : i + count,
		    type = _grammar.any;

		if (i < 0 || i >= charCount - 1) {
			return;
		}

		for (i; i < length; i++) {
			if (type.test(chars[i])) {
				chars[i] = _grammar.placeholder;
			}
		}

		selection.start = selection.end = actualStart;
	}

	function shiftCharacters(selection, start, direction, chars) {
		var count = 1,
		    actualStart = nextCharIndex(start, direction, _grammar.any, chars),
		    i = actualStart,
		    type = _maskChars[i],
		    shiftIndex = -1,
		    charCount = chars.length;

		if (i < 0 || i >= charCount) {
			return;
		}

		for (i; i < charCount; i++) {
			if (type.test(chars[i])) {
				shiftIndex = (shiftIndex === -1)
				           ? nextCharIndex(i + count, DIRECTION_FORWARDS, type, chars)
				           : nextCharIndex(shiftIndex + 1, DIRECTION_FORWARDS, type, chars);

				if (shiftIndex > -1 && shiftIndex < charCount && type.test(chars[shiftIndex])) {
					chars[i] = chars[shiftIndex];
				}
				else {
					chars[i] = _grammar.placeholder;
				}
			}
		}

		selection.start = selection.end = actualStart;
	}

	function setMask(mask) {
		if (!_grammar) {
			throw new Error("Cannot set mask without a grammar object");
		}

		_mask = mask;
		_maskChars = _grammar.compile(mask);
		_emptyValue = getEmptyValue();
	}

	function test(value) {
		var chars = value.split(""),
		    i = 0,
		    length = chars.length,
		    valid = true,
		    totalMaskChars = _maskChars.length,
		    c;

		if (length != totalMaskChars) {
			valid = false;
		}
		else {
			for (i; i < length; i++) {
				c = chars[i];

				if (c === _grammar.placeholder) {
					continue;
				}
				else if (i >= totalMaskChars || !_maskChars[i].test(c)) {
					valid = false;
					break;
				}
			}
		}

		return valid;
	}

	// Public interface
	this.addCharacter = addCharacter;
	this.addCharacters = addCharacters;
	this.getEmptyValue = getEmptyValue;
	this.getMaskedValue = getMaskedValue;
	this.getPlaceholder = getPlaceholder;
	this.isEmptyValue = isEmptyValue;
	this.removeNextChar = removeNextChar;
	this.removePrevChar = removePrevChar;
	this.removeCharRange = removeCharRange;
	this.setMask = setMask;
	this.test = test;

	// "Private" interface
	this._isValidCharAt = isValidCharAt;
	this._nextCharIndex = nextCharIndex;
	this._removeChars = removeChars;
	this._removeCharacterRange = removeCharacterRange;
	this._shiftCharacters = shiftCharacters;

	initialize.apply(this, arguments);
}

Template.defaultGrammar = (InputMask.Grammar) ? new InputMask.Grammar() : null;

Template.getByElement = function(element) {
	var name = element.getAttribute("data-mask-name"),
	    mask = element.getAttribute("data-mask");

	if (name) {
		if (_templates[name]) {
			return _templates[name];
		}
		else {
			throw new Error("No instance of InputMask.Template found for name: " + name);
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

InputMask.Selection = Selection;
InputMask.Template = Template;

})(InputMask);
