describe("InputMaskModule", function() {

	var module, element, input;

	beforeEach(function() {
		element = document.createElement("div");
		element.style.position = "absolute";
		element.style.height = "0";
		element.style.width = "0";
		element.style.overflow = "hidden";
		document.body.appendChild(element);
		module = new InputMaskModule().init(element);
	});

	afterEach(function() {
		document.body.removeChild(element);
	});

	describe("_removeCharacter", function() {

		describe("when pressing the DELETE key", function() {

			beforeEach(function() {
				element.innerHTML = '<input type="text" data-mask="(###) ###-####">';
				input = element.firstChild;
				input.focus();
			});

			xit("should be tested");

		});

	});

});
