## InputMask

InputMask is an easy to use JavaScript library for enforcing formatting on
`INPUT`s. It does not require any external dependencies and works with any
library or framework.

### Features

- Uses event delegation so only one instance of `InputMask.Module` is required
  for the whole page
- Text fields created via Ajax or dynamically after page load are picked up
  automatically.
- No need to detach event handlers when removing masked text fields
- Specify a mask pattern for any text input
- Register common patterns and refer to them by name
- Globally disable the input masks with `InputMask.disableAll()` and re-enable
  them again via `InputMask.enableAll()`
- Optionally disable individual masks using `InputMask.disable(element)`. Masks
  can be re-enabled using `InputMask.enable(element)`
- Hooks into the `paste` event in the browser to apply masks

### Downloading InputMask

InputMask can be downloaded from [GitHub](https://github.com/gburghardt/input_mask_module/archive/master.zip)
or installed via Bower: `bower install input_mask_module`.

### Browser Support

Only modern browsers are supported. Internet Explorer versions 9 and newer will
work, as will Firefox, Chrome and Safari.

- Internet Explorer 9+
- Firefox
- Chrome
- Safari

### Getting Started

It's easy to start using InputMask. First, include the following files in your
Web page:

    <script type="text/javascript" src="src/InputMask.js"></script>
    <script type="text/javascript" src="src/InputMask/Grammar.js"></script>
    <script type="text/javascript" src="src/InputMask/Template.js"></script>
    <script type="text/javascript" src="src/InputMask/Module.js"></script>

Next, at any point in the page lifecycle or anywhere in your HTML document add
this snippet of code:

    <script type="text/javascript">
        var masks = new InputMask.Module().init(document.documentElement);
    </script>

Now you can start creating masked inputs.

### Creating Masked Inputs

The easiest way to create masked inputs is to use the `data-mask` HTML
attribute. The example below shows you how to create a masked input for a USA
telephone number:

    <input type="text" data-mask="(###) ###-####">

That's all you need!

In an effort to DRY (Don't Repeat Yourself) up your input masks, you can
register common masks and refer to them by name.

    <script type="text/javascript">
        // Register a common format for all telephone numbers, called "telephone"
        InputMask.register("telephone", "(###) ###-####");
    </script>

    <!-- Multiple text fields formatted with the "telephone" mask -->
    Phone:  <input type="text" data-mask-name="telephone" name="contact[telephone]"><br>
    Fax:    <input type="text" data-mask-name="telephone" name="contact[fax]"><br>
    Mobile: <input type="text" data-mask-name="telephone" name="contact[mobile]"><br>
    Work:   <input type="text" data-mask-name="telephone" name="contact[work]"><br>

Now it becomes easy to change a mask format globally. Just change the call to
`InputMask.register(...)`

    <script type="text/javascript">
        // Redefine the "telephone" format in a single line for the whole page
        InputMask.register("telephone", "###-###-####");
    </script>

### Disabling Masked Inputs

There are two ways to disabled masked inputs. First, you can disable the masks
for specific text fields, and then there is the "kill switch" for all masked
inputs.

To disable a single masked input:

    var input = document.querySelector("input[type=text]");

    InputMask.disable(input);

You can enable the masked input again using:

    InputMask.enable(input);

The global "kill switch" will prevent masking of existing inputs, as well as
dynamically created inputs:

    InputMask.disableAll();

Then to re-enable at any time:

    InputMask.enableAll();

### Integration With Existing Frameworks

Since InputMask has no external depedencies, you can use this with any existing
JavaScript framework.

#### Integration With Foundry

The `InputMask.Module` class was written to support the Module.IModule interface
so that [Module Manager](https://github.com/gburghardt/module-manager) in
[Foundry](https://github.com/gburghardt/foundry) can create this module
automatically. Just add a `data-modules` attribute to the `html` tag:

    <!DOCTYPE HTML>
    <html data-modules="InputMask.Module">
        ...
    </html>

The Foundry framework does the rest for you.

### Developing and Contributing to InputMask

1. Install [NodeJS](http://nodejs.org/)
2. Install [Bower](http://bower.io/)
3. Fork https://github.com/gburghardt/input_mask_module.git and clone it
4. From the home directory for input_mask_module:
        cd path/to/input_mask_module
        npm install
        bower install
5. Create a new branch for your feature or bug fix
6. Edit and commit files **(Do not run `grunt`)**
7. Push your commits.
8. Submit a pull request via GitHub
