InputMask.Module = function Module() {

	var KEYCODE_BACKSPACE = 8,
	    KEYCODE_CONTROL = 17,
	    KEYCODE_DELETE = 46;

	var self = this,
	    _filteredKeys = [9, 13, 35, 36, 37, 38, 39, 40],
	    _controlKeyDown = false,
	    _element,
	    _document,
	    _window;

	function init(element) {
		if (element) {
			setElement(element);
		}

		_element.addEventListener("focus", handleFocusIn, true);
		_element.addEventListener("blur", handleFocusOut, true);
		_element.addEventListener("keydown", handleKeyDown, false);
		_element.addEventListener("keypress", handleKeyPress, false);
		_element.addEventListener("keyup", handleKeyUp, false);
		_element.addEventListener("paste", handlePaste, false);

		return self;
	}

	function destructor() {
		if (_element) {
			_element.removeEventListener("focus", handleFocusIn, true);
			_element.removeEventListener("blur", handleFocusOut, true);
			_element.removeEventListener("keydown", handleKeyDown, false);
			_element.removeEventListener("keypress", handleKeyPress, false);
			_element.removeEventListener("keyup", handleKeyUp, false);
			_element.removeEventListener("paste", handlePaste, false);
		}

		_element = _document = _window = null;
	}

	function getTemplate(element) {
		return InputMask.getTemplateByElement(element);
	}

	function handleFocusIn(event) {
		event = event || window.event;

		if (isMaskable(event.target)) {
			showMask(event.target);
		}
	}

	function handleFocusOut(event) {
		event = event || window.event;

		if (isMaskable(event.target)) {
			hideMask(event.target);
		}
	}

	function handleKeyDown(event) {
		event = event || window.event;

		if (event.keyCode === KEYCODE_CONTROL) {
			_controlKeyDown = true;
		}
		else if (isMaskable(event.target)) {
			var keyCode = event.keyCode,
			    element = event.target,
			    start = element.selectionStart,
			    end = element.selectionEnd,
			    value = element.value,
		        template = getTemplate(element),
			    selection = null;

			if (KEYCODE_BACKSPACE === keyCode) {
				selection = (start === end)
				          ? template.removePrevChar(start, value)
				          : template.removeCharRange(start, end, value);
			}
			else if (KEYCODE_DELETE === keyCode) {
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
	}

	function handleKeyPress(event) {
		event = event || window.event;

		if (!isMaskable(event.target)
			|| _filteredKeys.indexOf(event.keyCode) > -1
			|| _controlKeyDown) {
			return;
		}

		event.preventDefault();

		var charCode = event.charCode,
		    element = event.target,
		    start = element.selectionStart,
		    value = element.value,
		    template = getTemplate(element),
		    selection = null;

		if (charCode > 0) {
			selection = template.addCharacter(start, String.fromCharCode(charCode), value);
			element.value = selection.text;
			element.setSelectionRange(selection.start, selection.end);
		}
	}

	function handleKeyUp(event) {
		if ((event || window.event).keyCode === KEYCODE_CONTROL) {
			_controlKeyDown = false;
		}
	}

	function handlePaste(event) {
		event = event || window.event;

		if (!isMaskable(event.target)) {
			return;
		}

		var clipboard = event.clipboardData || null,
		    element = event.target,
		    template, selection;

		var processPaste = function(pastedText) {
			template = getTemplate(element);
			selection = template.addCharacters(element.selectionStart, pastedText, element.value);
			element.value = selection.text;
			element.setSelectionRange(selection.start, selection.end);
		};

		var waitForPaste = function(element) {
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
		};

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
	}

	function hideMask(element) {
		if (getTemplate(element).isEmptyValue(element.value)) {
			element.value = "";
		}
	}

	function isMaskable(element) {
		return (element.getAttribute("data-mask") || element.getAttribute("data-mask-name"))
			&& !element.getAttribute("data-mask-disabled") && !InputMask.disabled ? true : false;
	}

	function setElement(element) {
		_element = typeof element === "string"
		         ? document.getElementById(element)
		         : element;
		_document = _element.ownerDocument;
		_window = _document.defaultView;
	}

	function setOptions(options) {
	}

	function showMask(element) {
		var template = getTemplate(element),
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

	// Public interface
	this.init = init;
	this.destructor = destructor;
	this.setElement = setElement;
	this.setOptions = setOptions;

	// "Private" interface
	this._getTemplate = getTemplate;
	this._hideMask = hideMask;
	this._isMaskable = isMaskable;
	this._showMask = showMask;
}
