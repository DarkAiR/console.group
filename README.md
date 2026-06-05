<h1 align="center">console.group</h1>

<p align="center">Buffered, styled, and isolated console logging</p>

<p align="center">
	<a href="https://github.com/DarkAiR/console.group/blob/main/LICENSE" target="_blank"><img alt="📝 License: MIT" src="https://img.shields.io/badge/%F0%9F%93%9D_license-MIT-21bb42.svg" /></a>
    <a href="https://npmjs.com/package/@darkair/console.group" target="_blank" rel="noopener noreferrer">
        <img alt="npm version" src="https://badgen.net/npm/v/@darkair/console.group?color=21bb42&label=%F0%9F%93%A6%20npm" />
    </a>
    <img alt="💪 TypeScript: Strict" src="https://img.shields.io/badge/%F0%9F%92%AA_typescript-strict-21bb42.svg" />
</p>

---

A lightweight utility for buffering console messages with support for prefixes and custom styling. Collect logs into isolated groups and output them atomically when the group is closed — ideal for debugging asynchronous operations, tests, or complex streaming output.

## Features

- 📦 **Buffering**: Messages aren't output immediately; they're accumulated in a group until `groupEnd()` is called
- 🎨 **Styling**: Automatic color-coded output (`log`/`warn`/`error`) with optional custom styles
- 🔌 **Safe Patching**: Global `console` is overridden and restored without side effects
- 🛡️ **TypeScript**: Full type safety out of the box
- 🎯 **Native `%c` Support**: Works seamlessly with browser's native `%c` formatting
- 🌍 **Universal**: Works in browser, Node.js

## Installation

```bash
npm install console.group
# or
yarn add console.group
# or
pnpm add console.group
```

## Quick start

```ts
import { patchConsole, unpatchConsole } from "console.group";

// 1. Activate console patching (optional: set global default styles)
patchConsole({
	logStyle: "color: #333",
	warnStyle: "color: #cc0",
	errorStyle: "color: #c00",
	prefixStyle: "color: #666; font-weight: bold",
});

// 2. Create a group (returns a unique ID for buffering)
const groupId = console.group("My Group");

// 3. Regular log — outputs immediately with global styling
// → "This message appears immediately" (styled with logStyle: #333)
console.log("This message appears immediately");

// 4. Log with prefix — adds styled prefix before message
// → "[API] API response received" (prefix in prefixStyle, text in logStyle)
console.log("API response received", { prefix: "[API] " });

// 5. Log with group — buffered (not visible until groupEnd)
console.log("Step 1: Connecting...", { groupId });
console.log("Step 2: Authenticating...", { groupId, prefix: "→ " });
console.error("Step 3: Failed", { groupId, prefix: "✖ " });

// 6. Close group — all buffered messages are output atomically
// → Console shows collapsible group "My Group" containing:
//     Step 1: Connecting...
//     → Step 2: Authenticating...
//     ✖ Step 3: Failed (in red)
console.groupEnd(groupId);

// 7. Native %c formatting still works — styles are automatically shifted
// → "ℹ️ Bold Normal" where:
//     ℹ️ is styled with prefixStyle,
//     Bold is styled with 'font-weight: bold',
//     Normal is styled with 'font-weight: normal'
console.log(
	"%cBold%cNormal",
	{ prefix: "ℹ️ " },
	"font-weight: bold",
	"font-weight: normal",
);

// 8. (Optional) Restore original console behavior
unpatchConsole();
```

## API Reference

#### patchConsole(options?: PatchOptions): void

Overrides the global console to add buffering and styling support.

**PatchOptions:**

| Option      | Type   | Description                              | Default         |
| :---------- | :----- | :--------------------------------------- | :-------------- |
| prefixStyle | string | CSS style for prefixes                   | 'color: grey'   |
| logStyle    | string | Default style for console.log messages   | 'color: black'  |
| warnStyle   | string | Default style for console.warn messages  | 'color: orange' |
| errorStyle  | string | Default style for console.error messages | 'color: red'    |

### Example:

```ts
patchConsole({
	logStyle: "color: cyan",
	prefixStyle: "font-weight: bold",
});
```

---

#### unpatchConsole(): void

Restores the original `console` object and clears internal buffers. Recommended to call in test `afterEach` hooks or during module teardown.

---

#### console.group(label: string): string

Creates a new message group.

- **Returns:** `string` — unique group ID (used for `groupId` option)
- **Behavior:** Group is created in buffer but not displayed until `groupEnd`

---

#### console.groupCollapsed(label: string): string

Same as `group`, but creates a collapsed group in the console upon flush.

---

#### console.groupEnd(id?: string): void

- **With `id`**: Flushes all buffered messages for the group, then closes it in the console
- **Without `id`**: Simply closes the current group in the original console (standard behavior)

---

#### console.log(str: string, options?: LoggerOptions, ...args: unknown[]): void

**LoggerOptions:**

| Option  | Type   | Description                                     |
| :------ | :----- | :---------------------------------------------- |
| prefix  | string | Text prefix (styled with `prefixStyle`)         |
| groupId | string | Group ID for buffering (from `console.group()`) |

### Example:

```ts
// Basic log
console.log("Simple message");

// With prefix
console.log("Message", { prefix: "[API]" });

// With group (buffered)
console.log("Buffered", { groupId: myGroupId });

// With prefix + group + extra args
console.log("User logged in", { groupId, prefix: "🔐 " }, { userId: 123 });

// Native %c formatting (still works!)
console.log("%cBold%cNormal", "font-weight: bold", "font-weight: normal");

// Prefix + native %c (styles are shifted correctly)
console.log("%cImportant", { prefix: "⚠️ " }, "color: red");
```

---

#### console.warn() / console.error()

Work identically to `console.log()` but with different default colors (orange for `warn`, red for `error`).

## Type Definitions

**Note:** These instructions assume your source files are located in the `/src` directory relative to your project root.

### Option 1: Via Import

Import the type definitions in any TypeScript file (e.g., `src/main.ts`, `src/global.d.ts`, or a dedicated types file):

```ts
import "@darkair/console.group/lib/global";
```

This is the modern approach and avoids ESLint warnings about triple-slash references.

### Option 2: Via Triple-Slash Reference

**In a Global Declaration File**

Create or open `src/global.d.ts` in your project and add the following line:

```ts
/// <reference path="../node_modules/@darkair/console.group/lib/global.d.ts" />
```

**In a Main File**

Add the following line at the very top of any TypeScript file (e.g., `src/main.ts`):

```ts
/// <reference path="../node_modules/@darkair/console.group/lib/global.d.ts" />
```

**Notes**

- Make sure the `src/` directory is listed in the `include` section of your `tsconfig.json`.
- You might need to disable the ESLint rule `@typescript-eslint/triple-slash-reference` for these lines if using ESLint.

### Restart TypeScript

After adding the reference, restart the TypeScript Language Service in your IDE (VS Code, WebStorm, etc.).

## ⚠️ Important Notes

### Argument Order

Options (`{ prefix, groupId }`) must always come immediately after the message string, before any other data:

```ts
// ✅ Correct
console.log("Message", { groupId, prefix: "X" }, data, 123);

// ❌ Incorrect: data object will be parsed as options
console.log("Message", data, { groupId });
```

### Native `%c` compatibility

Your `%c` placeholders and style arguments work as expected. When a `prefix` is added, one extra `%c` is prepended internally, so your style arguments shift by one position automatically.

### Buffered Messages & Styles

When messages are buffered inside a group, only the `prefix` is preserved. Custom styles passed to individual log calls are not stored in the buffer — upon flush, messages use the global styles from `patchConsole()`.

### Custom Styling

```ts
// Global defaults
patchConsole({
	prefixStyle: "font-weight: bold; color: #666",
	logStyle: "color: #333",
	errorStyle: "color: #c00",
});

// Per-call prefix
// Output: ❌ Request failed (with styled prefix)
console.log("Request failed", { prefix: "❌ " });
```

### Nested Groups

```ts
const outer = console.group("Outer");
console.log("Outer message"); // Immediate

const inner = console.group("Inner");
console.log("Inner 1", { groupId: inner }); // Buffered
console.log("Inner 2", { groupId: inner, prefix: "→ " }); // Buffered
console.groupEnd(inner); // Flush inner group

console.groupEnd(outer); // Close outer
```

## License

MIT © Dmitry DarkAiR Romanov
