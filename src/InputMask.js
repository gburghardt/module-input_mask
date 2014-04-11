var InputMask = {

	getTemplateByElement: function(element) {
		return InputMask.Template.getByElement(element);
	},

	register: function(name, mask) {
		InputMask.Template.register(name, mask);
	},

	setDefaultGrammar: function(grammar) {
		InputMask.Template.defaultGrammar = grammar;
	}

};
