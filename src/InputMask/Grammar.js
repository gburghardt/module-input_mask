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