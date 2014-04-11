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
