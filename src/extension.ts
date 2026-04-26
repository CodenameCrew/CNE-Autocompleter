import * as vscode from 'vscode';
import * as CNECallbacks from './data/callbacks.json';
import * as CNEVariables from './data/variables.json';
import * as path from 'path';
import * as fs from 'fs';

const preImportedLibraries = [
    "Std", "Math", "Reflect", "StringTools", "haxe.Json",
    "openfl.utils.Assets", "lime.app.Application", "funkin.backend.system.Main", "lime.app.Application.current.window",
    "flixel.FlxG", "flixel.FlxSprite", "flixel.FlxBasic", "flixel.FlxCamera", "flixel.FlxG.state", "flixel.tweens.FlxEase",
    "flixel.tweens.FlxTween", "flixel.sound.FlxSound", "flixel.system.FlxAssets", "flixel.math.FlxMath", "flixel.group.FlxGroup",
    "flixel.group.FlxGroup.FlxTypedGroup", "flixel.group.FlxSpriteGroup", "flixel.addons.text.FlxTypeText", "flixel.text.FlxText",
    "flixel.util.FlxTimer", "flixel.math.FlxPoint", "flixel.util.FlxAxes", "flixel.util.FlxColor",
    "funkin.backend.system.macros.GitCommitMacro.commitNumber", "funkin.backend.system.macros.GitCommitMacro.commitHash",
    "funkin.backend.scripting.ModState", "funkin.backend.scripting.ModSubState", "funkin.game.PlayState",
    "funkin.game.GameOverSubstate", "funkin.game.HealthIcon", "funkin.game.HudCamera", "funkin.game.Note",
    "funkin.game.Strum", "funkin.game.StrumLine", "funkin.game.Character", "funkin.menus.PauseSubState",
    "funkin.menus.FreeplayState", "funkin.menus.MainMenuState", "funkin.menus.StoryMenuState", "funkin.menus.TitleState",
    "funkin.options.Options", "funkin.backend.assets.Paths", "funkin.backend.system.Conductor",
    "funkin.backend.shaders.FunkinShader", "funkin.backend.shaders.CustomShader", "funkin.backend.FunkinText",
    "funkin.backend.FlxAnimate", "funkin.backend.FunkinSprite", "funkin.menus.ui.Alphabet",
    "funkin.backend.utils.CoolUtil", "funkin.backend.utils.IniUtil", "funkin.backend.utils.XMLUtil",
    "funkin.backend.utils.ZipUtil", "funkin.backend.utils.MarkdownUtil", "funkin.backend.utils.EngineUtil",
    "funkin.backend.utils.MemoryUtil", "funkin.backend.utils.BitmapUtil"
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

function loadClassData(extensionPath: string, className: string): ClassData | null {
    if (classCache.has(className)) return classCache.get(className)!;
    const filePath = path.join(extensionPath, 'data', 'classes', `${className}.json`);
    if (!fs.existsSync(filePath)) return null;
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
    const filePath = path.join(extensionPath, 'data', 'classes', 'Flags.json');
    if (!fs.existsSync(filePath)) return [];
    try {
        const data: ClassData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        return data.statics ?? [];
    } catch { return []; }
}

function formatSignature(fn: ClassFunction): string {
    const args = fn.args.map(a => `${a.optional ? '?' : ''}${a.name}:${a.type}`).join(', ');
    return `${fn.name}(${args}):${fn.returns}`;
}

function buildClassHover(className: string, data: ClassData): vscode.MarkdownString {
    const md = new vscode.MarkdownString();
    md.isTrusted = true;
    md.appendMarkdown(`## \`${className}\`${data.extends ? ` extends \`${data.extends}\`` : ''}\n\n`);

    if (data.statics?.length > 0) {
        md.appendMarkdown(`### Statics\n`);
        for (const s of data.statics) md.appendMarkdown(`- \`static ${s.name}:${s.type}\`${s.description ? ` - ${s.description}` : ''}\n`);
        md.appendMarkdown('\n');
    }

    if (data.members?.length > 0) {
        md.appendMarkdown(`### Members\n`);
        for (const m of data.members) md.appendMarkdown(`- \`${m.name}:${m.type}\`${m.description ? ` - ${m.description}` : ''}\n`);
        md.appendMarkdown('\n');
    }

    if (data.functions?.length > 0) {
        md.appendMarkdown(`### Functions\n`);
        for (const fn of data.functions) md.appendMarkdown(`- \`${formatSignature(fn)}\`${fn.description ? ` - ${fn.description}` : ''}\n`);
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
        md.appendMarkdown(`### \`${className}.${formatSignature(fn)}\`\n\n`);
        if (fn.description) md.appendMarkdown(`${fn.description}\n\n`);
        if (fn.args.length > 0) {
            md.appendMarkdown(`**Parameters:**\n`);
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
        md.appendMarkdown(`### \`${className}.${stat.name}:${stat.type}\`\n\n`);
        if (stat.description) md.appendMarkdown(stat.description);
        return md;
    }

    return null;
}

function buildFlagHover(flag: ClassStatic): vscode.MarkdownString {
    const md = new vscode.MarkdownString();
    md.isTrusted = true;
    md.appendMarkdown(`### \`Flags.${flag.name}\`\n\n`);
    md.appendMarkdown(`**Type:** \`${flag.type}\`\n\n`);
    if (flag.description) md.appendMarkdown(flag.description);
    return md;
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
                const data = loadClassData(context.extensionPath, preceding);
                if (data) {
                    const memberHover = buildMemberHover(preceding, word, data);
                    if (memberHover) return new vscode.Hover(memberHover);
                }
            }

            const data = loadClassData(context.extensionPath, word);
            if (data) return new vscode.Hover(buildClassHover(word, data));

            return;
        }
    }));

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
                let data = loadClassData(context.extensionPath, word);
                if (!data) {
                    const inferredType = inferVariableType(document, word);
                    if (inferredType) data = loadClassData(context.extensionPath, inferredType);
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
                    const importArg = callback.args.find((a: any) => a.typePath !== null);
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
                const regex = new RegExp(`import\\s+${lib.replace('.', '\\.')}`, 'g');
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

export function deactivate() {}