# Codename Engine Autocomplete

Autocomplete for Codename XML Files (Only stages currently) & Haxe scripts (HScript)

## Features

- Create stage with stage snippets and code completion
- *PLANNED!* ~~Completion for other XML file types~~
- Completion for hscript callbacks, functions, and variables (global scripts have different autocomplete than normal scripts)
- Hover documentation for classes and their members
- Type inference for variable dot-completion
- Supported script file extensions: `.haxe`, `.hscript`, `.hxs`, `.hxc`, `.pack`

### Installing VSIX 
1. Download the .vsix file from the latest release
2. Open **Visual Studio Code** and select **Extensions** from the left bar
3. At the top of Extensions menu click on three dots and select "**Install From VSIX...**"
4. In the Install from VSIX window select downloaded .vsix file
5. Restart Visual Studio Code

## Release Notes

### 0.7.1
- Added `modpack.ini` Support, You can now add Flags without having to look at the API doc.
- Overhauled Extenstion Runner by Detecting `modpack.ini` in your `data/config/` folder.
**Added supported classes:**

| Class |
|---|
| `TranslationUtil` |
| `Week` |
|`Video Cutscene` |

sorry it had to be little i have other important stuff to do

### 0.7.0

- Added Class Support (on adding a new constructor OR getting a static variable/function)
- Added support for `.hscript`, `.hxs`, `.hxc`, and `.pack` file extensions, they all behave like you're coding in a `.hx` file
- Added warnings on importing pre-imported libraries like `flixel.FlxSprite`. You can check the full list [here](https://github.com/CodenameCrew/CodenameEngine/blob/main/source/funkin/backend/scripting/Script.hx)

**Added supported classes:**

| Class |
|---|
| `FunkinSprite` |
| `FunkinSave` |
|`CoolUtil` |
| `Flags` | 
|`FunkinText` | 
|`WindowUtils` |
| `MathUtil` |'
| `HttpUtil` |
| `DiscordUtil` |

### 0.6.1

- Fixed regex for arrow functions
- Removed the command example from vscode :skull: (i left it in by accident)
- Changed repo url to the CodenameCrew one

### 0.6.0

- Changed Codename Autocomplete Prefix to "CNE"
- Added the default hscript events and callbacks (no type checking) (global scripts has different autocomplete than normal scripts)

### 0.5.1

- The first release yay!

## Contributing
Any pull requests are appreciated, feel free to Pull Request any missing stuff!
NOTE : If you don't know how to install dependencies use `npm install`

## Compiling and Editing the source
1. Install [npm](https://nodejs.org/en/download/)
2. Clone this repo with ```git clone https://github.com/CodenameCrew/CNE-Autocomplete.git```
3. To install all the libraries run ```npm install```
4. And to compile run ```npm run compile``` (or press ``F5``)