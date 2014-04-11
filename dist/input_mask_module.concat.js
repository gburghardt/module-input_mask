/*! input_mask_module 2014-04-11 */
var InputMask = {

	disabled: false,

	disable: function(element) {
		element.setAttribute("data-mask-disabled", "true");
	},

	disableAll: function() {
		this.disabled = true;
	},

	enable: function(element) {
		element.removeAttribute("data-mask-disabled");
	},

	enableAll: function() {
		this.disabled = false;
	},

	getTemplateByElement: function(element) {
		return InputMask.Template.getByElement(element);
	},

	register: function(name, mask) {
		return InputMask.Template.register(name, mask);
	},

	setDefaultGrammar: function(grammar) {
		InputMask.Template.defaultGrammar = grammar;
	}

};

(function(InputMask) {

function Grammar() {
}

Grammar.prototype = {

	digits: /[0-9]/,
	chars: /[a-zA-Z]/,
	any: /[a-zA-Z0-9]/,
	anyOrPlaceholder: /[_a-zA-Z0-9]/,
	placeholder: "_",
	filler: /[^#A]/,
	charMarker: "A",
	digitMarker: "#",

	constructor: Grammar,

	compile: function(mask) {
		var pieces = [],
		    length = mask.length,
		    c, i;

		for (i = 0; i < length; i++) {
			c = mask.charAt(i);

			if (c == this.digitMarker) {
				pieces.push(this.digits);
			}
			else if (c == this.charMarker) {
				pieces.push(this.chars);
			}
			else {
				pieces.push(this.filler);
			}
		}

		return pieces;
	}

};

InputMask.Grammar = Grammar;

})(InputMask);
(function(InputMask) {

var _id = 0,
    _templates = {};

function Template(grammar, mask, name) {
	this.grammar = grammar || null;

	if (mask) {
		this.setMask(mask);
	}

	this.name = name || String(++_id);
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

Template.prototype = {

	DIRECTION_BACKWARDS: -1,
	DIRECTION_FORWARDS: 1,

	emptyValue: null,

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

	getEmptyValue: function() {
		var c, i = 0, chars = [];

		while (c = this.mask.charAt(i++)) {
			if (c === this.grammar.digitMarker || c === this.grammar.charMarker) {
				chars.push(this.grammar.placeholder);
			}
			else {
				chars.push(c);
			}
		}

		return chars.join("");
	},

	getMaskedValue: function(value) {
		return this.addCharacters(0, value, this.emptyValue).text;
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
		this.emptyValue = this.getEmptyValue();
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

InputMask.Module = function Module() {
	this.options = {};
	this.handleFocusIn = this.handleFocusIn.bind(this);
	this.handleFocusOut = this.handleFocusOut.bind(this);
	this.handleKeyDown = this.handleKeyDown.bind(this);
	this.handleKeyPress = this.handleKeyPress.bind(this);
	this.handleKeyUp = this.handleKeyUp.bind(this);
	this.handlePaste = this.handlePaste.bind(this);
};

InputMask.Module.prototype = {

	KEYCODE_BACKSPACE: 8,
	KEYCODE_CONTROL: 17,
	KEYCODE_DELETE: 46,

	_controlKeyDown: false,

	document: null,

	element: null,

	_filteredKeys: [9, 13, 35, 36, 37, 38, 39, 40],

	options: null,

	window: null,

	constructor: InputMask.Module,

	init: function(element) {
		if (element) {
			this.setElement(element);
		}

		this.element.addEventListener("focus", this.handleFocusIn, true);
		this.element.addEventListener("blur", this.handleFocusOut, true);
		this.element.addEventListener("keydown", this.handleKeyDown, false);
		this.element.addEventListener("keypress", this.handleKeyPress, false);
		this.element.addEventListener("keyup", this.handleKeyUp, false);
		this.element.addEventListener("paste", this.handlePaste, false);

		return this;
	},

	destructor: function(keepElement) {
		if (this.element) {
			if (!keepElement) {
				this.element.parentNode.removeChild(this.element);
			}

			this.element.removeEventListener("focus", this.handleFocusIn, true);
			this.element.removeEventListener("blur", this.handleFocusOut, true);
			this.element.removeEventListener("keydown", this.handleKeyDown, false);
			this.element.removeEventListener("keypress", this.handleKeyPress, false);
			this.element.removeEventListener("keyup", this.handleKeyUp, false);
			this.element.removeEventListener("paste", this.handlePaste, false);
		}

		this.element = this.document = this.window = null;
	},

	_getTemplate: function(element) {
		return InputMask.getTemplateByElement(element);
	},

	handleFocusIn: function(event) {
		event = event || window.event;

		if (this._isMaskable(event.target)) {
			this._showMask(event.target);
		}
	},

	handleFocusOut: function(event) {
		event = event || window.event;

		if (this._isMaskable(event.target)) {
			this._hideMask(event.target);
		}
	},

	handleKeyDown: function(event) {
		if ((event || window.event).keyCode === this.KEYCODE_CONTROL) {
			this._controlKeyDown = true;
		}
	},

	handleKeyPress: function(event) {
		event = event || window.event;

		if (!this._isMaskable(event.target)
			|| this._filteredKeys.indexOf(event.keyCode) > -1
			|| this._controlKeyDown) {
			return;
		}

		event.preventDefault();

		var keyCode = event.keyCode,
		    charCode = event.charCode,
		    element = event.target,
		    start = element.selectionStart,
		    end = element.selectionEnd,
		    value = element.value,
		    template = this._getTemplate(element),
		    selection = null;

		if (this.KEYCODE_BACKSPACE === keyCode) {
			selection = (start === end)
			          ? template.removePrevChar(start, value)
			          : template.removeCharRange(start, end, value);
		}
		else if (this.KEYCODE_DELETE === keyCode) {
			selection = (start === end)
			          ? template.removeNextChar(start, value)
			          : template.removeCharRange(start, end, value);
		}
		else {
			selection = template.addCharacter(start, String.fromCharCode(charCode), value);
		}

		element.value = selection.text;
		element.setSelectionRange(selection.start, selection.end);
	},

	handleKeyUp: function(event) {
		if ((event || window.event).keyCode === this.KEYCODE_CONTROL) {
			this._controlKeyDown = false;
		}
	},

	handlePaste: function(event) {
		event = event || window.event;

		if (!this._isMaskable(event.target)) {
			return;
		}

		event.preventDefault();

		var clipboard = event.clipboardData,
		    element = event.target,
		    template, selection;

		if (clipboard.types.contains("text/plain")) {
			template = this._getTemplate(element);
			selection = template.addCharacters(element.selectionStart, clipboard.getData("text/plain"), element.value);
			element.value = selection.text;
			element.setSelectionRange(selection.start, selection.end);
		}
	},

	_hideMask: function(element) {
		if (this._getTemplate(element).isEmptyValue(element.value)) {
			element.value = "";
		}
	},

	_isMaskable: function(element) {
		return (element.getAttribute("data-mask") || element.getAttribute("data-mask-name"))
			&& !element.getAttribute("data-mask-disabled") && !InputMask.disabled ? true : false;
	},

	setElement: function(element) {
		this.element = typeof element === "string"
		             ? document.getElementById(element)
		             : element;
		this.document = this.element.ownerDocument;
		this.window = this.document.defaultView;
	},

	setOptions: function(options) {
	},

	_showMask: function(element) {
		var template = this._getTemplate(element),
		    index = -1;

		element.value = template.getMaskedValue(element.value);
		index = element.value.indexOf(template.getPlaceholder());

		if (index > -1) {
			// Chrome won't allow you to set the selection when the focus event
			// is triggered by a click, so we wait and then set the selection.
			setTimeout(function() {
				element.setSelectionRange(index, index);
			}, 10);
		}
	}

};
