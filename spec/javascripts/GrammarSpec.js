describe("InputMaskModule.Grammar", function() {

	var grammar;

	beforeEach(function() {
		grammar = new InputMaskModule.Grammar();
	});

	describe("compile", function() {
		it("detects numbers", function() {
			var pieces = grammar.compile("###");

			expect(pieces.length).toBe(3);
			expect(pieces[0]).toBe(grammar.digits);
			expect(pieces[1]).toBe(grammar.digits);
			expect(pieces[2]).toBe(grammar.digits);
		});

		it("detects characters", function() {
			var pieces = grammar.compile("AAA");

			expect(pieces.length).toBe(3);
			expect(pieces[0]).toBe(grammar.chars);
			expect(pieces[1]).toBe(grammar.chars);
			expect(pieces[2]).toBe(grammar.chars);
		});

		it("detects filler characters", function() {
			var pieces = grammar.compile("(##)");

			expect(pieces.length).toBe(4);
			expect(pieces[0]).toBe(grammar.filler);
			expect(pieces[1]).toBe(grammar.digits);
			expect(pieces[2]).toBe(grammar.digits);
			expect(pieces[3]).toBe(grammar.filler);
		});

		it("detects multiple filler characters", function() {
			var pieces = grammar.compile("( # )");

			expect(pieces.length).toBe(5);
			expect(pieces[0]).toBe(grammar.filler);
			expect(pieces[1]).toBe(grammar.filler);
			expect(pieces[2]).toBe(grammar.digits);
			expect(pieces[3]).toBe(grammar.filler);
			expect(pieces[4]).toBe(grammar.filler);
		});
	});

});