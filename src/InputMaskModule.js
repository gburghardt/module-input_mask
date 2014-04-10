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
		    element = event.target,
		    start = element.selectionStart,
		    end = element.selectionEnd,
		    value = element.value,
		    template = InputMaskModule.Template.getByElement(element),
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

	_hideMask: function(element) {
		var template = InputMaskModule.Template.getByElement(element);

		if (template.isEmptyValue(element.value)) {
			element.value = "";
		}
	},

	_isMaskable: function(element) {
		return element.getAttribute("data-mask") || element.getAttribute("data-mask-name") ? true : false;
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
		var template = InputMaskModule.Template.getByElement(element),
		    index = -1;

		element.value = template.getMaskedValue(element.value);
		index = element.value.indexOf(template.getPlaceholder());
		element.setSelectionRange(index, index);
	}

};
