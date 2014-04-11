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

	destructor: function() {
		if (this.element) {
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
		console.log("handleFocusIn");
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
		event = event || window.event;

		if (event.keyCode === this.KEYCODE_CONTROL) {
			this._controlKeyDown = true;
		}
		else if (this._isMaskable(event.target)) {
			var keyCode = event.keyCode,
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

			if (selection) {
				event.preventDefault();
				element.value = selection.text;
				element.setSelectionRange(selection.start, selection.end);
			}
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

		var charCode = event.charCode,
		    element = event.target,
		    start = element.selectionStart,
		    value = element.value,
		    template = this._getTemplate(element),
		    selection = null;

		if (charCode > 0) {
			selection = template.addCharacter(start, String.fromCharCode(charCode), value);
			element.value = selection.text;
			element.setSelectionRange(selection.start, selection.end);
		}
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

		var clipboard = event.clipboardData || null,
		    element = event.target,
		    self = this,
		    template, selection;

		if (!clipboard) {
			waitForPaste(element);
		}
		else {
			// Chrome: clipboard.types is an Array
			// Firefox: clipboard.types is a different class
			if (Array.prototype.indexOf.call(clipboard.types, "text/plain") > -1) {
				event.preventDefault();
				processPaste(clipboard.getData("text/plain"));
			}
		}

		function processPaste(pastedText) {
			template = self._getTemplate(element);
			selection = template.addCharacters(element.selectionStart, pastedText, element.value);
			element.value = selection.text;
			element.setSelectionRange(selection.start, selection.end);
		}

		function waitForPaste(element) {
			var start = element.selectionStart,
			    end = element.selectionEnd,
			    value = element.value,
			    pastedText = "",
			    calls = 0,
			    maxCalls = 100;

			var detectPaste = function() {
				if (++calls === maxCalls) {
					// We've waited 1 second for pasted text. Assume failure.
					return;
				}
				else if (!element.value) {
					setTimeout(detectPaste, 10);
				}
				else {
					pastedText = element.value;
					element.value = value;
					element.setSelectionRange(start, end);
					processPaste(pastedText);
				}
			};

			element.value = "";

			detectPaste();
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
