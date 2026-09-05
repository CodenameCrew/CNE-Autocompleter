import * as vscode from 'vscode';
import * as CNECallbacks from './data/callbacks.json';
import * as CNEVariables from './data/variables.json';
import * as path from 'path';
import * as fs from 'fs';

const preImportedLibraries = [
    // haxe stuff
    "Std", "Math", "Reflect", "StringTools", "haxe.Json", "Xml", "Type", "Date", "Lambda", "Sys",

    // openfl & lime
    "openfl.display.BlendMode", "openfl.utils.Assets", "lime.app.Application", "funkin.backend.system.Main",

    // flixel
    "flixel.FlxG", "flixel.FlxSprite", "flixel.FlxBasic", "flixel.FlxCamera", "flixel.tweens.FlxEase",
    "flixel.tweens.FlxTween", "flixel.sound.FlxSound", "flixel.system.FlxAssets", "flixel.math.FlxMath",
    "flixel.group.FlxGroup", "flixel.group.FlxGroup.FlxTypedGroup", "flixel.group.FlxSpriteGroup",
    "flixel.addons.text.FlxTypeText", "flixel.text.FlxText", "flixel.util.FlxTimer", "flixel.math.FlxPoint",
    "flixel.util.FlxAxes", "flixel.util.FlxColor",

    // foxlite (only under THREE_D_SUPPORT && foxlite btw)
    "foxlite.FoxScene", "foxlite.FoxCamera", "foxlite.extras.FoxFPSCamera", "foxlite.renderer.FoxRenderer",
    "foxlite.loaders.FoxLoaderUtil", "foxlite.FoxModel", "foxlite.mesh.FoxQuadMesh", "foxlite.mesh.FoxCubeMesh",
    "foxlite.material.FoxMaterial", "foxlite.FoxShader", "foxlite.texture.FoxTexture", "foxlite.FoxCache",
    "foxlite.flixel.FoxRenderMetrics", "foxlite.funkin.FoxFunkinSprite", "foxlite.flixel.FoxFlxSprite",
    "foxlite.sky.FoxPanoramaSky", "foxlite.stencil.FoxStencilAction", "foxlite.loaders.FoxOBJLoader",
    "foxlite.loaders.FoxMTLLoader", "foxlite.lights.FoxDirectionalLight", "foxlite.FoxLayer",
    "foxlite.animation.FoxEaseType", "foxlite.instancing.FoxInstanceUpdateMode", "foxlite.lights.FoxAreaLightShape",
    "foxlite.lights.FoxLightType", "foxlite.material.FoxBlendMode", "foxlite.material.FoxDepthCompareMode",
    "foxlite.stencil.FoxStencilCompareMode", "foxlite.material.FoxTriangleFace", "foxlite.mesh.FoxMeshBufferType",
    "foxlite.mesh.FoxQuadFace", "foxlite.stencil.FoxStencilActionType", "foxlite.texture.FoxCubemapSide",
    "foxlite.texture.FoxMipFilter", "foxlite.texture.FoxTextureFilter", "foxlite.texture.FoxWrapMode",

    // engine
    "funkin.backend.scripting.ModState", "funkin.backend.scripting.ModSubState", "funkin.game.PlayState",
    "funkin.game.GameOverSubstate", "funkin.game.HealthIcon", "funkin.game.HudCamera", "funkin.game.Note",
    "funkin.game.Strum", "funkin.game.StrumLine", "funkin.game.Character", "funkin.menus.PauseSubState",
    "funkin.menus.FreeplayState", "funkin.menus.MainMenuState", "funkin.menus.StoryMenuState",
    "funkin.menus.TitleState", "funkin.options.Options", "funkin.backend.assets.Paths",
    "funkin.backend.system.Conductor", "funkin.backend.shaders.FunkinShader", "funkin.backend.shaders.CustomShader",
    "funkin.backend.FunkinText", "animate.FlxAnimate", "funkin.backend.FunkinSprite", "funkin.menus.ui.Alphabet",
    "funkin.backend.system.Flags",

    // utils
    "funkin.backend.utils.CoolUtil", "funkin.backend.utils.IniUtil", "funkin.backend.utils.XMLUtil",
    "funkin.backend.utils.ZipUtil", "funkin.backend.utils.MarkdownUtil", "funkin.backend.utils.EngineUtil",
    "funkin.backend.utils.ThreadUtil", "funkin.backend.utils.MemoryUtil", "funkin.backend.utils.BitmapUtil",
    "funkin.backend.utils.TranslationUtil"
];

const XML_STAGE_SNIPPETS: [string, string, string][] = [
    ["Create Stage", "Creates an empty stage for Codename Engine", '<!DOCTYPE codename-engine-stage>\n<stage zoom="1" startCamPosX="0" startCamPosY="0" folder="stages/(your stage folder name in images/stage/)/">\n\t$0\n</stage>'],
    ["High Memory Block", "Creates an element that doesn't show on low memory mode", '<high-memory>\n\t$0\n</high-memory>'],
    ["Static Sprite", "Creates a sprite element", '<sprite x="0" y="0" alpha="1" scroll="1" antialiasing="true" scale="1" flipX="false" flipY="false" updateHitbox="true" zoomfactor="1" sprite="mySillyImage" name="sillySprite"/>$0'],
    ["Static Sprite (Compact)", "Creates a sprite element but removes the usually unused properties", '<sprite x="0" y="0" alpha="1" scale="1" sprite="mySillyImage" name="sillySprite"/>$0'],
    ["Animated Sprite", "Creates an animated sprite element that uses sparrow", '<sprite x="0" y="0" alpha="1" scroll="1" antialiasing="true" scale="1" flipX="false" flipY="false" updateHitbox="true" zoomfactor="1" type="(either none, beat or loop)" sprite="mySillyImage" name="sillySprite">\n\t$0\n</sprite>'],
    ["Animated Sprite (Compact)", "Creates an animated sprite element but removes the usually unused properties", '<sprite x="0" y="0" alpha="1" scale="1" type="loop" sprite="mySillyImage" name="sillySprite">\n\t$0\n</sprite>'],
    ["Sprite Animation", "Creates a sprite animation element", '<anim name="idle" anim="mysprite idle0000" loop="false"/>\n\t$0'],
    ["Sprite Animation With Indices", "Creates a sprite animation element with indices", '<anim name="idle" anim="mysprite idle0000" loop="false" indices="0..14"/>\n$0'],
    ["Solid Sprite", "Creates a solid sprite element", '<solid x="0" y="0" width="50" height="50" color="#FFFFFF"/>$0'],
];

const XML_CHARACTER_ENTRIES: [string, string][] = [
    ["bf", "Player"],
    ["gf", "Spectator"],
    ["dad", "Opponent"],
];

interface ClassArg {
    name: string;
    type: string;
    optional: boolean;
}

interface ClassFunction {
    name: string;
    args: ClassArg[];
    returns: string;
    description: string;
}

interface ClassStatic {
    name: string;
    type: string;
    description: string;
}

interface ClassData {
    extends?: string;
    statics: ClassStatic[];
    members: ClassStatic[];
    functions: ClassFunction[];
}

const classCache = new Map<string, ClassData>();
let classDirs: string[] | null = null;

const OTHER_HAXE_EXT: vscode.DocumentSelector = [
    { language: 'haxe' },
    { pattern: '**/*.hxs' },
    { pattern: '**/*.hsc' },
    { pattern: '**/*.hscript' },
    { pattern: '**/*.pack' }
];

const MODPACK_INI_SELECTOR: vscode.DocumentSelector = [
    { pattern: '**/modpack.ini' },
    { pattern: '**/.modpack.ini' },
];

function getClassDirs(extensionPath: string): string[] {
    if (classDirs) return classDirs;
    const classesRoot = path.join(extensionPath, 'data', 'classes');
    let dirs: string[];
    try {
        dirs = fs.readdirSync(classesRoot, { withFileTypes: true })
            .filter((entry: fs.Dirent) => entry.isDirectory())
            .map((entry: fs.Dirent) => path.join(classesRoot, entry.name));
    } catch { dirs = []; }
    if (dirs.length === 0) dirs = [classesRoot];
    classDirs = dirs;
    return dirs;
}

// Classes are grouped into subfolders under data/classes (e.g. codename/, foxlite/) by source library
// but are looked up by bare filename regardless of which subfolder they are in.
function findClassFile(extensionPath: string, fileName: string): string | null {
    for (const dir of getClassDirs(extensionPath)) {
        const filePath = path.join(dir, fileName);
        if (fs.existsSync(filePath)) return filePath;
    }
    return null;
}

function loadClassData(extensionPath: string, className: string): ClassData | null {
    if (classCache.has(className)) return classCache.get(className)!;
    const filePath = findClassFile(extensionPath, `${className}.json`);
    if (!filePath) return null;
    try {
        const data: ClassData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        if (data.extends) {
            const parent = loadClassData(extensionPath, data.extends);
            if (parent) {
                data.statics = [...(parent.statics ?? []), ...(data.statics ?? [])];
                data.members = [...(parent.members ?? []), ...(data.members ?? [])];
                data.functions = [...(parent.functions ?? []), ...(data.functions ?? [])];
            }
        }

        classCache.set(className, data);
        return data;
    } catch { return null; }
}

function loadFlags(extensionPath: string): ClassStatic[] {
    const filePath = findClassFile(extensionPath, 'Flags.json');
    if (!filePath) return [];
    try {
        const data: ClassData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        return data.statics ?? [];
    } catch { return []; }
}

function formatSignature(fn: Pick<ClassFunction, 'name' | 'args' | 'returns'>): string {
    const args = fn.args.map(a => `${a.optional ? '?' : ''}${a.name}:${a.type}`).join(', ');
    return `${fn.name}(${args}):${fn.returns}`;
}


function splitTopLevel(str: string, sep: string): string[] {
    const result: string[] = [];
    let depth = 0, current = '';
    for (const ch of str) {
        if ('([{<'.includes(ch)) depth++;
        else if (')]}>'.includes(ch)) depth--;
        if (ch === sep && depth === 0) {
            result.push(current);
            current = '';
        } else {
            current += ch;
        }
    }
    if (current.trim().length > 0 || result.length > 0) result.push(current);
    return result;
}

function parseArgList(argsStr: string): ClassArg[] {
    return splitTopLevel(argsStr, ',')
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map(part => {
            const optional = part.startsWith('?');
            if (optional) part = part.slice(1).trim();

            const eqIdx = part.indexOf('=');
            const withoutDefault = (eqIdx === -1 ? part : part.slice(0, eqIdx)).trim();
            const colonIdx = withoutDefault.indexOf(':');
            const name = (colonIdx === -1 ? withoutDefault : withoutDefault.slice(0, colonIdx)).trim();
            const type = colonIdx === -1 ? 'Dynamic' : withoutDefault.slice(colonIdx + 1).trim();
            return { name, type, optional };
        });
}

type LocalFunctionInfo = Pick<ClassFunction, 'name' | 'args' | 'returns'>;

function findLocalFunction(document: vscode.TextDocument, name: string): LocalFunctionInfo | null {
    const regex = new RegExp(`(?:(?:public|private|static|override|inline)\\s+)*function\\s+${name}\\s*(?:<[^>]*>)?\\s*\\(([^)]*)\\)\\s*(?::\\s*([\\w.<>,\\s]+?))?\\s*[{;]`);
    const match = regex.exec(document.getText());
    if (!match) return null;
    return { name, args: parseArgList(match[1]), returns: (match[2] ?? 'Void').trim() };
}

function findLocalVariable(document: vscode.TextDocument, name: string): { type: string } | null {
    const regex = new RegExp(`\\bvar\\s+${name}\\b\\s*(?::\\s*([\\w.<>,\\s]+?))?\\s*(?:=|;)`);
    const match = regex.exec(document.getText());
    if (!match) return null;
    return { type: (match[1] ?? 'Dynamic').trim() };
}

function findEnclosingFunctionParam(document: vscode.TextDocument, position: vscode.Position, name: string): ClassArg | null {
    const text = document.getText();
    const offset = document.offsetAt(position);
    const regex = /function\s+\w+\s*(?:<[^>]*>)?\s*\(([^)]*)\)\s*(?::\s*[\w.<>,\s]+?)?\s*\{/g;

    let match: RegExpExecArray | null;
    let bestArgs: ClassArg[] | null = null;
    let bestStart = -1;

    while ((match = regex.exec(text)) !== null) {
        const openBraceIdx = match.index + match[0].length - 1;
        let depth = 1, i = openBraceIdx + 1;
        for (; i < text.length && depth > 0; i++) {
            if (text[i] === '{') depth++;
            else if (text[i] === '}') depth--;
        }
        if (offset > openBraceIdx && offset < i && openBraceIdx > bestStart) {
            bestArgs = parseArgList(match[1]);
            bestStart = openBraceIdx;
        }
    }

    return bestArgs?.find(a => a.name === name) ?? null;
}

function buildLocalFunctionHover(fn: LocalFunctionInfo): vscode.MarkdownString {
    const md = new vscode.MarkdownString();
    md.appendCodeblock(formatSignature(fn), 'haxe');
    return md;
}

function buildLocalVariableHover(name: string, type: string): vscode.MarkdownString {
    const md = new vscode.MarkdownString();
    md.appendCodeblock(`${name}:${type}`, 'haxe');
    return md;
}

function buildClassHover(className: string, data: ClassData): vscode.MarkdownString {
    const md = new vscode.MarkdownString();
    md.isTrusted = true;
    md.appendCodeblock(`class ${className}${data.extends ? ` extends ${data.extends}` : ''}`, 'haxe');

    if (data.statics?.length > 0) {
        md.appendMarkdown(`\n### Statics\n`);
        for (const s of data.statics) {
            md.appendCodeblock(`static ${s.name}:${s.type}`, 'haxe');
            if (s.description) md.appendMarkdown(`*${s.description}*\n`);
        }
    }

    if (data.members?.length > 0) {
        md.appendMarkdown(`\n### Members\n`);
        for (const m of data.members) {
            md.appendCodeblock(`${m.name}:${m.type}`, 'haxe');
            if (m.description) md.appendMarkdown(`*${m.description}*\n`);
        }
    }

    if (data.functions?.length > 0) {
        md.appendMarkdown(`\n### Functions\n`);
        for (const fn of data.functions) {
            md.appendCodeblock(formatSignature(fn), 'haxe');
            if (fn.description) md.appendMarkdown(`*${fn.description}*\n`);
        }
    }

    return md;
}

function makeCompletionFromClass(data: ClassData): vscode.CompletionItem[] {
    const items: vscode.CompletionItem[] = [];

    for (const s of data.statics ?? []) {
        const item = new vscode.CompletionItem(s.name, vscode.CompletionItemKind.Variable);
        item.detail = `static ${s.type}`;
        item.documentation = new vscode.MarkdownString(s.description);
        items.push(item);
    }

    for (const m of data.members ?? []) {
        const item = new vscode.CompletionItem(m.name, vscode.CompletionItemKind.Field);
        item.detail = m.type;
        item.documentation = new vscode.MarkdownString(m.description);
        items.push(item);
    }

    for (const fn of data.functions ?? []) {
        const item = new vscode.CompletionItem(fn.name, vscode.CompletionItemKind.Function);
        item.detail = `(${fn.args.map(a => `${a.optional ? '?' : ''}${a.name}:${a.type}`).join(', ')}):${fn.returns}`;
        item.documentation = new vscode.MarkdownString(fn.description);
        item.insertText = new vscode.SnippetString(
            fn.args.length === 0 ? `${fn.name}()` : `${fn.name}(${fn.args.map((a, i) => `\${${i + 1}:${a.name}}`).join(', ')})`
        );
        items.push(item);
    }

    return items;
}

function buildMemberHover(className: string, memberName: string, data: ClassData): vscode.MarkdownString | null {
    const fn = data.functions.find(f => f.name === memberName);
    if (fn) {
        const md = new vscode.MarkdownString();
        md.isTrusted = true;
        md.appendCodeblock(`${className}.${formatSignature(fn)}`, 'haxe');
        if (fn.description) md.appendMarkdown(`\n${fn.description}\n`);
        if (fn.args.length > 0) {
            md.appendMarkdown(`\n**Parameters:**\n`);
            for (const a of fn.args)
                md.appendMarkdown(`- \`${a.optional ? '?' : ''}${a.name}\`: \`${a.type}\`\n`);
        }
        md.appendMarkdown(`\n**Returns:** \`${fn.returns}\``);
        return md;
    }

    const stat = data.statics.find(s => s.name === memberName);
    if (stat) {
        const md = new vscode.MarkdownString();
        md.isTrusted = true;
        md.appendCodeblock(`${className}.static ${stat.name}:${stat.type}`, 'haxe');
        if (stat.description) md.appendMarkdown(`\n${stat.description}`);
        return md;
    }

    const member = data.members.find(m => m.name === memberName);
    if (member) {
        const md = new vscode.MarkdownString();
        md.isTrusted = true;
        md.appendCodeblock(`${className}.${member.name}:${member.type}`, 'haxe');
        if (member.description) md.appendMarkdown(`\n${member.description}`);
        return md;
    }

    return null;
}

function buildFlagHover(flag: ClassStatic): vscode.MarkdownString {
    const md = new vscode.MarkdownString();
    md.isTrusted = true;
    md.appendCodeblock(`Flags.${flag.name}:${flag.type}`, 'haxe');
    if (flag.description) md.appendMarkdown(`\n${flag.description}`);
    return md;
}

function findActiveCall(document: vscode.TextDocument, position: vscode.Position): { preceding: string | null, funcName: string, argIndex: number } | null {
    const textBefore = document.getText(new vscode.Range(new vscode.Position(0, 0), position));

    const parenStack: { pos: number, commas: number }[] = [];
    for (let i = 0; i < textBefore.length; i++) {
        const ch = textBefore[i];
        if (ch === '(') parenStack.push({ pos: i, commas: 0 });
        else if (ch === ')') parenStack.pop();
        else if (ch === ',' && parenStack.length > 0) parenStack[parenStack.length - 1].commas++;
    }
    if (parenStack.length === 0) return null;

    const top = parenStack[parenStack.length - 1];
    const beforeParen = textBefore.slice(0, top.pos);
    const match = /(?:(\w+)\s*\.\s*)?(\w+)\s*$/.exec(beforeParen);
    if (!match || !match[2]) return null;

    return { preceding: match[1] ?? null, funcName: match[2], argIndex: top.commas };
}

function buildSignatureHelp(className: string | null, fn: ClassFunction, argIndex: number): vscode.SignatureHelp {
    const label = className ? `${className}.${formatSignature(fn)}` : formatSignature(fn);
    const info = new vscode.SignatureInformation(label, fn.description ? new vscode.MarkdownString(fn.description) : undefined);
    info.parameters = fn.args.map(a => new vscode.ParameterInformation(`${a.optional ? '?' : ''}${a.name}:${a.type}`));

    const help = new vscode.SignatureHelp();
    help.signatures = [info];
    help.activeSignature = 0;
    help.activeParameter = fn.args.length === 0 ? 0 : Math.max(0, Math.min(argIndex, fn.args.length - 1));
    return help;
}

function workspaceHasModpack(): boolean {
    return (vscode.workspace.workspaceFolders ?? []).some(folder => {
        const base = folder.uri.fsPath;
        const variants = ['data/config/modpack.ini', 'Data/config/modpack.ini', 'data/Config/modpack.ini', 'Data/Config/modpack.ini'];
        return variants.some(p => fs.existsSync(path.join(base, p)));
    });
}

function makeXmlSnippet(name: string, description: string, code: string): vscode.CompletionItem {
    const item = new vscode.CompletionItem(`[CNE Stage] ${name}`);
    item.documentation = new vscode.MarkdownString(description);
    item.detail = "Codename Engine Stage XML Snippet";
    item.kind = vscode.CompletionItemKind.Snippet;
    item.insertText = new vscode.SnippetString(code);
    return item;
}

function makeHaxeSnippet(name: string, description: string | null, code: string, kind: vscode.CompletionItemKind, command?: vscode.Command): vscode.CompletionItem {
    const kindLabel = kind === vscode.CompletionItemKind.Event ? "Event Function" : kind === vscode.CompletionItemKind.Function ? "Callback Function" : "Snippet";
    const item = new vscode.CompletionItem(`[CNE] ${kindLabel}: ${name}`);
    item.documentation = description ?? undefined;
    item.detail = `Codename Engine Haxe ${kind === vscode.CompletionItemKind.Event ? "Event" : kind === vscode.CompletionItemKind.Function ? "Callback" : "Snippet"}`;
    item.kind = kind;
    item.insertText = new vscode.SnippetString(code);
    if (command) item.command = command;
    return item;
}

function checkIfInFunction(document: vscode.TextDocument, position: vscode.Position): boolean {
    const fullText = document.getText();
    const currentLine = position.line;
    const lines = fullText.split('\n');

    const functionRegexes = [
        /(public|private|static|override)?\s*function\s+\w+\s*(<[^>]*>)?\s*\([^)]*\)(\s*:\s*[^{]*?)?\s*{/g,
        /(public|private|static|override)?\s*function\s+\w+\s*(<[^>]*>)?\s*\([^)]*\)(\s*:\s*[^{]*?)?\s*\n\s*{/g,
        /\([^)]*\)(\s*:\s*[^\-]*?)?\s*->\s*{/g,
    ];

    for (const regex of functionRegexes) {
        let match;
        while ((match = regex.exec(fullText)) !== null) {
            const startLine = document.positionAt(match.index).line;
            let open = 0, close = 0, endLine = -1;

            for (let i = startLine; i < lines.length; i++) {
                for (const ch of lines[i]) {
                    if (ch === '{') open++;
                    if (ch === '}') { close++; if (open === close) { endLine = i; break; } }
                }
                if (endLine !== -1) break;
            }

            if (currentLine > startLine && currentLine < endLine) return true;
        }
    }
    return false;
}

function getWordAndPreceding(document: vscode.TextDocument, position: vscode.Position): { word: string, preceding: string | null } {
    const range = document.getWordRangeAtPosition(position);
    if (!range) return { word: '', preceding: null };

    const word = document.getText(range);
    const lineText = document.lineAt(position.line).text;
    const wordStart = range.start.character;

    if (wordStart >= 2 && lineText[wordStart - 1] === '.') {
        const precedingRange = document.getWordRangeAtPosition(new vscode.Position(position.line, wordStart - 2));
        if (precedingRange) return { word, preceding: document.getText(precedingRange) };
    }

    return { word, preceding: null };
}

export function activate(context: vscode.ExtensionContext) {
    vscode.window.showInformationMessage('Codename Autocomplete is Running! | VSCode Version: ' + vscode.version);

    const diagnosticCollection = vscode.languages.createDiagnosticCollection('cneextension');
    context.subscriptions.push(diagnosticCollection);

    context.subscriptions.push(vscode.languages.registerCompletionItemProvider("xml", {
        provideCompletionItems(document) {
            if (!workspaceHasModpack()) return;

            const items: vscode.CompletionItem[] = XML_STAGE_SNIPPETS.map(([name, desc, code]) =>
                makeXmlSnippet(name, desc, code)
            );

            for (const [tag, label] of XML_CHARACTER_ENTRIES) {
                items.push(makeXmlSnippet(`${label} Character Position`, `Sets the position for the ${label.toLowerCase()} in the stage`, `<${tag} x="0" y="0" alpha="1" scale="1" camxoffset="0" camyoffset="0" flipX="false" scroll="1"/>$0`));
            }

            return new vscode.CompletionList(items, false);
        },
    }));

    context.subscriptions.push(vscode.languages.registerHoverProvider(MODPACK_INI_SELECTOR, {
        provideHover(document, position) {
            const line = document.lineAt(position.line).text.trim();
            if (line.startsWith(';') || line.startsWith('#') || line.startsWith('[')) return;

            const eqIdx = line.indexOf('=');
            if (eqIdx === -1) return;

            const key = line.slice(0, eqIdx).trim();
            const keyEnd = document.lineAt(position.line).text.indexOf('=');
            if (position.character > keyEnd) return;

            const flags = loadFlags(context.extensionPath);
            const flag = flags.find(f => f.name === key);
            if (!flag) return;

            return new vscode.Hover(buildFlagHover(flag));
        }
    }));

    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(MODPACK_INI_SELECTOR, {
        provideCompletionItems(document, position) {
            const line = document.lineAt(position.line).text;
            if (line.trim().startsWith(';') || line.trim().startsWith('#') || line.trim().startsWith('[')) return;

            const eqIdx = line.indexOf('=');
            if (eqIdx !== -1 && position.character > eqIdx) return;

            const flags = loadFlags(context.extensionPath);
            const items: vscode.CompletionItem[] = flags.map(flag => {
                const item = new vscode.CompletionItem(flag.name, vscode.CompletionItemKind.Property);
                item.detail = flag.type;
                item.documentation = new vscode.MarkdownString(flag.description ?? '');

                let defaultVal = '';
                if (flag.type === 'Bool') defaultVal = 'false';
                else if (flag.type === 'Int') defaultVal = '0';
                else if (flag.type === 'Float') defaultVal = '0.0';

                item.insertText = new vscode.SnippetString(`${flag.name} = \${1:${defaultVal}}`);
                item.filterText = flag.name;
                return item;
            });

            return new vscode.CompletionList(items, false);
        }
    }));

    context.subscriptions.push(vscode.languages.registerHoverProvider(OTHER_HAXE_EXT, {
        provideHover(document, position) {
            const { word, preceding } = getWordAndPreceding(document, position);
            if (!word) return;

            if (preceding) {
                let className = preceding;
                let data = loadClassData(context.extensionPath, className);
                if (!data) {
                    const inferredType = inferVariableType(document, preceding);
                    if (inferredType) {
                        data = loadClassData(context.extensionPath, inferredType);
                        className = inferredType;
                    }
                }
                if (!data) {
                    const param = findEnclosingFunctionParam(document, position, preceding);
                    if (param && param.type !== 'Dynamic') {
                        data = loadClassData(context.extensionPath, param.type);
                        className = param.type;
                    }
                }
                if (data) {
                    const memberHover = buildMemberHover(className, word, data);
                    if (memberHover) return new vscode.Hover(memberHover);
                }
            }

            const data = loadClassData(context.extensionPath, word);
            if (data) return new vscode.Hover(buildClassHover(word, data));

            if (!preceding) {
                const localFn = findLocalFunction(document, word);
                if (localFn) return new vscode.Hover(buildLocalFunctionHover(localFn));

                const param = findEnclosingFunctionParam(document, position, word);
                if (param) return new vscode.Hover(buildLocalVariableHover(param.name, param.type));

                const localVar = findLocalVariable(document, word);
                if (localVar) return new vscode.Hover(buildLocalVariableHover(word, localVar.type));
            }

            return;
        }
    }));

    context.subscriptions.push(vscode.languages.registerSignatureHelpProvider(OTHER_HAXE_EXT, {
        provideSignatureHelp(document, position) {
            const call = findActiveCall(document, position);
            if (!call) return;

            let className = call.preceding;
            let data: ClassData | null = null;
            if (className) {
                data = loadClassData(context.extensionPath, className);
                if (!data) {
                    const inferredType = inferVariableType(document, className);
                    if (inferredType) {
                        data = loadClassData(context.extensionPath, inferredType);
                        className = inferredType;
                    }
                }
            }
            if (!data) return;

            const fn = data.functions.find(f => f.name === call.funcName);
            if (!fn) return;

            return buildSignatureHelp(className, fn, call.argIndex);
        }
    }, '(', ','));

    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(OTHER_HAXE_EXT, {
        provideCompletionItems(document, position) {
            const inSongs = document.fileName.includes("songs");
            const isGlobal = document.fileName.includes("global");
            const inFunction = checkIfInFunction(document, position);
            const items: vscode.CompletionItem[] = [];

            const linePrefix = document.lineAt(position).text.slice(0, position.character);
            const dotMatch = linePrefix.match(/\b(\w+)\.\s*$/);
            if (dotMatch) {
                const word = dotMatch[1];
                // try direct class name first (like FunkinSave.)
                let data = loadClassData(context.extensionPath, word);
                // if not found, try to infer type from variable declaration (like... dih = new FunkinSprite())
                if (!data) {
                    const inferredType = inferVariableType(document, word);
                    if (inferredType) data = loadClassData(context.extensionPath, inferredType);
                }
                // if still not found, maybe it's a function parameter (like function foo(cam:FoxCamera))
                if (!data) {
                    const param = findEnclosingFunctionParam(document, position, word);
                    if (param && param.type !== 'Dynamic') data = loadClassData(context.extensionPath, param.type);
                }
                if (data)
                    return new vscode.CompletionList(makeCompletionFromClass(data), false);
            }

            if (!inFunction) {
                if (isGlobal) {
                    items.push(makeHaxeSnippet("State Replacement", "Snippet for replacing normal states by your ModState", "var stateRedirection:Map<FlxState, String> = [\n\t$0\n];\n\nfunction preStateSwitch() {\n\tfor (defaultState => replacedState in stateRedirection)\n\t\tif (FlxG.game._requestedState is defaultState)\n\t\t\tFlxG.game._requestedState = new ModState(replacedState);\n}", vscode.CompletionItemKind.Snippet));
                }

                for (const event of CNECallbacks.events as any[]) {
                    if (inSongs === event.isGlobal) continue;
                    items.push(makeHaxeSnippet(event.name, event.description ?? null, `function ${event.name}(event:${event.type}) {\n\t$0\n}`, vscode.CompletionItemKind.Event, { command: 'cneextension.addCallbackImport', title: 'Add Callback Import', arguments: [document.uri, event.type, event.type] }));
                }

                for (const callback of CNECallbacks.callbacks as any[]) {
                    if (inSongs === callback.isGlobal) continue;
                    const argString = callback.args.map((a: any) => `${a.name}:${a.type}`).join(', ');
                    const importArg = callback.args.find((a: any) => a.typePath);
                    items.push(makeHaxeSnippet(callback.name, callback.description ?? null, `function ${callback.name}(${argString}) {\n\t$0\n}`, vscode.CompletionItemKind.Function, importArg ? { command: 'cneextension.addCallbackImport', title: 'Add Callback Import', arguments: [document.uri, importArg.type, { path: importArg.typePath }] } : undefined));
                }

                for (const variable of CNEVariables.variables as any[]) {
                    const desc = variable.description ?? "";
                    const makeVar = (label: string, insert: string) => {
                        const item = new vscode.CompletionItem(`[CNE Variable] ${label}`);
                        item.documentation = new vscode.MarkdownString(desc);
                        item.detail = `Codename Engine Variable: ${variable.type}`;
                        item.kind = vscode.CompletionItemKind.Variable;
                        item.insertText = new vscode.SnippetString(insert);
                        return item;
                    };
                    items.push(makeVar(variable.name, variable.name));
                    if (variable.type === "Bool") {
                        items.push(makeVar(`${variable.name} = true`, `${variable.name} = true`));
                        items.push(makeVar(`${variable.name} = false`, `${variable.name} = false`));
                    }
                }
            }

            const text = document.getText();
            const diagnostics: vscode.Diagnostic[] = [];
            for (const lib of preImportedLibraries) {
                const regex = new RegExp(`import\\s+${lib.replace(/\./g, '\\.')}(?=[;\\s])`, 'g');
                let match;
                while ((match = regex.exec(text)) !== null) diagnostics.push(new vscode.Diagnostic(new vscode.Range(document.positionAt(match.index), document.positionAt(match.index + match[0].length)), `The library '${lib}' is already pre-imported, No need to import it in.`, vscode.DiagnosticSeverity.Warning));
            }
            diagnosticCollection.set(document.uri, diagnostics);

            return new vscode.CompletionList(items, false);
        }
    }, '.'));

    context.subscriptions.push(vscode.commands.registerCommand('cneextension.addCallbackImport', async (uri, type, event) => {
        const callbackType = typeof event === 'string' ? `import ${event};` : `import ${event.path ? `${event.typePath ?? ''}.${event.path}` : ''}${type};`.replace('..', '.');

        const doc = await vscode.workspace.openTextDocument(uri);
        if (!doc.getText().includes(callbackType)) {
            const edit = new vscode.WorkspaceEdit();
            edit.insert(uri, new vscode.Position(0, 0), `${callbackType}\n`);
            await vscode.workspace.applyEdit(edit);
        }
    }));
}

function inferVariableType(document: vscode.TextDocument, varName: string): string | null {
    const text = document.getText();
    const patterns = [
        new RegExp(`var\\s+${varName}\\s*(?::\\s*(\\w+))?\\s*=\\s*new\\s+(\\w+)\\s*\\(`),
        new RegExp(`var\\s+${varName}\\s*:\\s*(\\w+)`),
    ];

    for (const pattern of patterns) {
        const match = pattern.exec(text);
        if (match) return match[2] ?? match[1];
    }
    return null;
}


export function deactivate() {}
