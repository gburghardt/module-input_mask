function InputMaskModule() {
	this.options = {};
	this.handleFocusIn = this.handleFocusIn.bind(this);
	this.handleFocusOut = this.handleFocusOut.bind(this);
	this.handleKeyPress = this.handleKeyPress.bind(this);
}

InputMaskModule.prototype = {

	KEYCODE_BACKSPACE: 8,
	KEYCODE_DELETE: 46,

	document: null,

	element: null,

	_filteredKeys: [9, 13, 35, 36, 37, 38, 39, 40],

	options: null,

	window: null,

	constructor: InputMaskModule,

	init: function(element) {
		if (element) {
			this.setElement(element);
		}

		this.element.addEventListener("focus", this.handleFocusIn, true);
		this.element.addEventListener("blur", this.handleFocusOut, true);
		this.element.addEventListener("keypress", this.handleKeyPress, false);

		return this;
	},

	destructor: function(keepElement) {
		if (this.element) {
			if (!keepElement) {
				this.element.parentNode.removeChild(this.element);
			}

			this.element.removeEventListener("focus", this.handleFocusIn, true);
			this.element.removeEventListener("keypress", this.handleKeyPress, false);
		}

		this.element = this.document = this.window = null;
	},

	_addCharacter: function(element, newChar) {
		var template = InputMaskModule.Template.getByElement(element),
		    start = element.selectionStart,
		    chars = element.value.split(""),
		    c;

		if (template.isValidCharAt(newChar, start)) {
			chars[start] = newChar;

			while (start < chars.length) {
				c = chars[++start];

				if (template.isNonFiller(c) || template.isPlaceholder(c)) {
					break;
				}
			}

			element.value = chars.join("");
			element.setSelectionRange(start, start);
		}
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

	handleKeyPress: function(event) {
		event = event || window.event;

		if (!this._isMaskable(event.target) || this._filteredKeys.indexOf(event.keyCode) > -1) {
			return;
		}

		event.preventDefault();

		var keyCode = event.keyCode,
		    charCode = event.charCode,
		    element = event.target;

		if (keyCode === this.KEYCODE_BACKSPACE) {
			this._removeCharacter(element, -1);
		}
		else if (keyCode === this.KEYCODE_DELETE) {
			this._removeCharacter(element, 1);
		}
		else {
			this._addCharacter(element, String.fromCharCode(charCode));
		}
	},

	_hideMask: function(element) {
		var template = InputMaskModule.Template.getByElement(element);

		if (template.isEmptyValue(element.value)) {
			element.value = "";
		}
	},

	_isMaskable: function(element) {
		return element.getAttribute("data-mask") || element.getAttribute("data-mask-name") ? true : false;
	},

	_removeCharacter: function(element, offset) {
		offset = offset > 0 ? 1 : -1;

		var template = InputMaskModule.Template.getByElement(element);

		if (template.isEmptyValue(element.value)) {
			return;
		}
		else if (element.selectionStart === element.value.length && element.selectionEnd === element.value.length) {
			return;
		}

		var start = element.selectionStart,
		    removeStart = start,
		    removeEnd = -1,
		    newStart = start,
		    chars = element.value.split(""),
		    charCount = chars.length,
		    c = chars[newStart],
		    i;

		if (offset > 0) {
			// Find first removable char
			for (i = start; i < charCount; i++) {
				if (template.isNonFiller(chars[i])) {
					removeStart = i;
					break;
				}
			}

			// from removeStart, shift characters in the same class to the LEFT until end of string or different char class
			for (i = removeStart; i < charCount; i++) {
				if (template.isNonFiller(chars[i]) &&
					template.isSameCharClass(removeStart, i) &&
					template.isNonFiller(chars[i + 1]) &&
					template.isSameCharClass(removeStart, i + 1)
				) {
					chars[i] = chars[i + 1];
					removeEnd = i + 1;
				}
			}

			if (removeEnd > -1) {
				chars[removeEnd] = template.getPlaceholder();
			}

			element.value = chars.join("");
			element.setSelectionRange(removeStart, removeStart);
		}

		// while (newStart > 0 && newStart < charCount) {
		// 	if (template.isNonFiller(c) || template.isPlaceholder(c)) {
		// 		break;
		// 	}

		// 	newStart += offset;
		// 	c = chars[newStart];
		// }

		// if (newStart > 0 && newStart < charCount) {
		// 	chars[newStart] = template.getPlaceholder();
		// 	element.value = chars.join("");
		// 	element.setSelectionRange(newStart, newStart);
		// }
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
		var template = InputMaskModule.Template.getByElement(element);

		element.value = template.getMaskedValue(element.value);
		element.selectionStart = element.selectionEnd = element.value.indexOf(template.grammar.placeholder)
	}

};
