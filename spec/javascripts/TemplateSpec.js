describe("InputMaskModule.Template", function() {

	var grammar, template;

	beforeEach(function() {
		grammar = new InputMaskModule.Grammar();
		template = new InputMaskModule.Template(grammar);
	});

	describe("getMaskedValue", function() {

		beforeEach(function() {
			template.setMask("###-####");
		});

		it("returns the original string for valid values", function() {
			expect(template.getMaskedValue("123-3344")).toBe("123-3344");
		});

		all("incomplete values are padded with placeholders", [
			["12",    "12_-____"],
			["123-",  "123-____"],
			["123-4", "123-4___"]
		], function(value, maskedValue) {
			expect(template.getMaskedValue(value)).toBe(maskedValue);
		});

	});

	describe("removeNextChar", function() {

		describe("with homogenous types", function() {

			beforeEach(function() {
				template.setMask("(###) ###-####");
			});

			it("leaves default values alone", function() {
				var text = "(___) ___-____";
				var selection = template.removeNextChar(3, text);

				expect(selection.text).toBe(text);
				expect(selection.start).toBe(3);
				expect(selection.end).toBe(3);
				expect(selection.length).toBe(0);
			});

			it("shifts everything to the left", function() {
				var text = "(123) 456-7890";
				var selection = template.removeNextChar(0, text);

				expect(selection.text).toBe("(234) 567-890_");
				expect(selection.start).toBe(1);
				expect(selection.end).toBe(1);
				expect(selection.length).toBe(0);
			});

			it("skips filler characters", function() {
				var text = "(123) 456-7890";
				var selection = template.removeNextChar(4, text);

				expect(selection.text).toBe("(123) 567-890_");
				expect(selection.start).toBe(6);
				expect(selection.end).toBe(6);
				expect(selection.length).toBe(0);
			});

			it("leaves the text unchanged when at the end of the text", function() {
				var text = "(123) 456-7890";
				var selection = template.removeNextChar(14, text);

				expect(selection.text).toBe(text);
				expect(selection.start).toBe(14);
				expect(selection.end).toBe(14);
				expect(selection.length).toBe(0);
			});

		});

		describe("with mixed types", function() {

			beforeEach(function() {
				template.setMask("###-AAA");
			});

			it("skips filler characters", function() {
				var text = "123-ABC";
				var selection = template.removeNextChar(3, text);

				expect(selection.text).toBe("123-BC_");
			});

			it("skips characters of a different type", function() {
				var text = "123-ABC";
				var selection = template.removeNextChar(0, text);

				expect(selection.text).toBe("23_-ABC");
			});

			it("removes the next available character when on a placeholder", function() {
				var text = "___-ABC";
				var selection = template.removeNextChar(1, text);

				expect(selection.text).toBe("___-BC_");
				expect(selection.start).toBe(4);
				expect(selection.end).toBe(4);
			});

		});

	});

	describe("removePrevChar", function() {

		describe("with homogenous types", function() {

			beforeEach(function() {
				template.setMask("(###) ###-####");
			});

			it("leaves the text unchanged when the cursor is at the first character", function() {
				var text = "(123) 456-7890";
				var selection = template.removePrevChar(0, text);

				expect(selection.text).toBe(text);
				expect(selection.start).toBe(0);
				expect(selection.end).toBe(0);
				expect(selection.length).toBe(0);
			});

			it("leaves default values alone", function() {
				var text = "(___) ___-____";
				var selection = template.removePrevChar(2, text);

				expect(selection.text).toBe(text);
				expect(selection.start).toBe(2);
				expect(selection.end).toBe(2);
				expect(selection.length).toBe(0);
			});

			it("is the same when removing previous or next", function() {
				var text = "(123) 456-7890",
				    s1 = template.removePrevChar(3, text),
				    s2 = template.removeNextChar(2, text),
				    expectedText = "(134) 567-890_";

				expect(s1.text).toBe(expectedText);
				expect(s2.text).toBe(expectedText);
			});

			it("removes the previous character", function() {
				//            ><
				var text = "(123) 456-7890";
				var selection = template.removePrevChar(3, text);

				expect(selection.text).toBe("(134) 567-890_");
				expect(selection.start).toBe(2);
				expect(selection.end).toBe(2);
				expect(selection.length).toBe(0);
			});

			it("skips filler characters", function() {
				//               ><
				var text = "(123) 456-7890";
				var selection = template.removePrevChar(6, text);

				expect(selection.text).toBe("(124) 567-890_");
				expect(selection.start).toBe(3);
				expect(selection.end).toBe(3);
				expect(selection.length).toBe(0);
			});

		});

		describe("with mixed types", function() {

			beforeEach(function() {
				template.setMask("###-AAA");
			});

		});

	});

	describe("removeChars", function() {

		describe("with homogenous types", function() {

			beforeEach(function() {
				template.setMask("(###) ###-####");
			});

			all("default values remain unchanged", [ 0, 14, 1, 5, 6 ], function(start) {
				var text = "(___) ___-____";
				var selection = template.removeChars(start, 1, template.DIRECTION_FORWARDS, text);

				expect(selection.text).toBe("(___) ___-____");
				expect(selection.start).toBe(start);
				expect(selection.end).toBe(start);
				expect(selection.length).toBe(0);
			});

			it("shifts one character to the left when the cursor is at the beginning", function() {
				var text = "(123) 456-7890";
				var selection = template.removeChars(0, 0, template.DIRECTION_FORWARDS, text);

				expect(selection.text).toBe("(234) 567-890_");
				expect(selection.start).toBe(1);
				expect(selection.end).toBe(1);
				expect(selection.length).toBe(0);
			});

			it("backspaces the last character when the cursor is at the end", function() {
				var text = "(123) 456-7890";
				var selection = template.removeChars(10, 0, template.DIRECTION_BACKWARDS, text);
			});

			it("does nothing if the cursor is at the end", function() {
				var text = "(123) 456-7890";
				var selection = template.removeChars(14, 0, template.DIRECTION_FORWARDS, text);

				expect(selection.text).toBe("(123) 456-7890");
				expect(selection.start).toBe(14);
				expect(selection.end).toBe(14);
				expect(selection.length).toBe(0);
			});

			it("deletes a character when the cursor is on the last non filler character", function() {
				var text = "(123) 456-7890";
				var selection = template.removeChars(13, 0, template.DIRECTION_FORWARDS, text);

				expect(selection.text).toBe("(123) 456-789_");
				expect(selection.start).toBe(13);
				expect(selection.end).toBe(13);
				expect(selection.length).toBe(0);
			});

			it("shifts one character to the left when the cursor is at a filler character", function() {
				var text = "(123) 4__-____";
				var selection = template.removeChars(4, 0, template.DIRECTION_FORWARDS, text);

				expect(selection.text).toBe("(123) ___-____");
				expect(selection.start).toBe(6);
				expect(selection.end).toBe(6);
				expect(selection.length).toBe(0);
			});

			it("shifts one character to the left", function() {
				var text = "(123) 4__-____";
				var selection = template.removeChars(2, 0, template.DIRECTION_FORWARDS, text);

				expect(selection.text).toBe("(134) ___-____");
				expect(selection.start).toBe(2);
				expect(selection.end).toBe(2);
				expect(selection.length).toBe(0);
			});

			it("removes multiple characters", function() {
				//           __
				var text = "(123) 4__-____";
				var selection = template.removeChars(1, 2, template.DIRECTION_FORWARDS, text);

				expect(selection.text).toBe("(__3) 4__-____");
				expect(selection.start).toBe(1);
				expect(selection.end).toBe(1);
				expect(selection.length).toBe(0);
			});

		});

		describe("with mixed types", function() {

			beforeEach(function() {
				template.setMask("###-AAA");
			});

			it("removes characters from multiple types", function() {
				//           ____
				var text = "123-CDH";
				var selection = template.removeChars(1, 4, template.DIRECTION_FORWARDS, text);

				expect(selection.text).toBe("1__-_DH");
				expect(selection.start).toBe(1);
				expect(selection.end).toBe(1);
				expect(selection.length).toBe(0);
			});

		});

	});

	describe("test", function() {

		describe("digits", function() {

			beforeEach(function() {
				template.setMask("####");
			});

			it("returns true for all placeholders", function() {
				expect(template.test("____")).toBe(true);
			});

			it("returns true for exact digit matches", function() {
				expect(template.test("1234")).toBe(true);
			});

			all("partial digit matches return true", [
				"_123",
				"__23",
				"___3",
				"1___",
				"12__",
				"123_",
				"_23_",
				"_2_4",
				"1__4"
			], function(value) {
				expect(template.test(value)).toBe(true);
			});

		});

		describe("letters", function() {

			beforeEach(function() {
				template.setMask("AAAA");
			});

			it("returns true for all placeholders", function() {
				expect(template.test("____")).toBe(true);
			});

			it("returns true for exact letter matches", function() {
				expect(template.test("abcd")).toBe(true);
			});

			all("partial matches return true", [
				"_bcd",
				"__cd",
				"___d",
				"abc_",
				"ab__",
				"a___",
				"a__d",
				"a_cd",
				"ab_d",
				"_b_d"
			], function(value) {
				expect(template.test(value)).toBe(true);
			});

		});

		it("returns false when the value is too long", function() {
			template.setMask("###");
			expect(template.test("1234")).toBe(false);
		});

		it("returns false when the value is too short", function() {
			template.setMask("###");
			expect(template.test("12")).toBe(false);
		});

		it("returns false when the value is not padded with placeholders", function() {
			template.setMask("###");
			expect(template.test("12 ")).toBe(false);
		});

		all("mixed digits and letters return true", [
			"12__-v8",
			"12Gh-_0",
			"__t_-__",
			"48iQ-U5"
		], function(value) {
			template.setMask("##AA-A#");
			expect(template.test(value)).toBe(true);
		});

	});

});
