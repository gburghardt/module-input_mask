describe("InputMask.Module", function() {

	var module, input;

	describe("_isMaskable", function() {

		beforeEach(function() {
			module = new InputMask.Module();
			input = document.createElement("input");
			input.type = "text";
		});

		it("returns true if a data-mask attribute exists", function() {
			input.setAttribute("data-mask", "###-###");

			expect(module._isMaskable(input)).toBe(true);
		});

		it("returns true if a data-mask-name attribute exists", function() {
			input.setAttribute("data-mask-name", "test");

			expect(module._isMaskable(input)).toBe(true);
		});

		describe("when a data-mask-disabled attribute exists", function() {

			beforeEach(function() {
				input.setAttribute("data-mask-disabled", "true");
			});

			it("returns false with data-mask", function() {
				input.setAttribute("data-mask", "###-###");

				expect(module._isMaskable(input)).toBe(false);
			});

			it("returns false with data-mask-name", function() {
				input.setAttribute("data-mask-name", "test");

				expect(module._isMaskable(input)).toBe(false);
			});

		});

		describe("when InputMask.disabled is true", function() {

			beforeEach(function() {
				InputMask.disableAll();
			});

			afterEach(function() {
				InputMask.enableAll();
			});

			it("returns false with data-mask", function() {
				input.setAttribute("data-mask", "###-###");

				expect(module._isMaskable(input)).toBe(false);
			});

			it("returns false with data-mask-name", function() {
				input.setAttribute("data-mask-name", "test");

				expect(module._isMaskable(input)).toBe(false);
			});

		});

	});

});
