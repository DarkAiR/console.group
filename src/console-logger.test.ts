// logger.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { patchConsole, unpatchConsole } from "./console-logger";
import type { LoggerOptions, PatchOptions } from "./types";
import { isOptions } from "./includes";

// Мокаем globalThis.console для каждого теста
const mockOriginalConsole = {
	log: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
	group: vi.fn(),
	groupCollapsed: vi.fn(),
	groupEnd: vi.fn(),
	info: vi.fn(),
	table: vi.fn(),
};

describe("Console Patcher", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		globalThis.console = { ...mockOriginalConsole } as typeof console;
	});

	afterEach(() => {
		unpatchConsole();
	});

	describe("patchConsole / unpatchConsole", () => {
		it("should replace global console methods", () => {
			const originalLog = globalThis.console.log;
			patchConsole();
			expect(globalThis.console.log).not.toBe(originalLog);
			expect(globalThis.console.log).toBeInstanceOf(Function);
		});

		it("should be idempotent (calling twice does not break)", () => {
			patchConsole();
			const firstPatched = globalThis.console.log;
			patchConsole();
			expect(globalThis.console.log).toBe(firstPatched);
		});

		it("should restore original console on unpatch", () => {
			const originalLog = globalThis.console.log;
			patchConsole();
			unpatchConsole();
			expect(globalThis.console.log).toBe(originalLog);
		});

		it("should handle unpatch without prior patch gracefully", () => {
			expect(() => unpatchConsole()).not.toThrow();
		});
	});

	describe("console.log", () => {
		beforeEach(() => {
			patchConsole();
		});

		it("should pass through simple log call with styling", () => {
			globalThis.console.log("Hello world");
			expect(mockOriginalConsole.log).toHaveBeenCalledWith(
				"%cHello world",
				"color: black",
			);
		});

		it("should handle additional args", () => {
			const obj = { foo: "bar" };
			globalThis.console.log("Message", obj, 123);
			expect(mockOriginalConsole.log).toHaveBeenCalledWith(
				"%cMessage",
				"color: black",
				obj,
				123,
			);
		});

		it("should apply prefix when provided", () => {
			globalThis.console.log(
				"Body",
				{ prefix: "[API]" } as LoggerOptions,
				"arg1",
			);
			expect(mockOriginalConsole.log).toHaveBeenCalledWith(
				"%c[API]%cBody",
				"color: grey",
				"color: black",
				"arg1",
			);
		});

		it("should NOT treat first arg as options if it is not an object", () => {
			globalThis.console.log("Message", "arg1", "arg2");
			expect(mockOriginalConsole.log).toHaveBeenCalledWith(
				"%cMessage",
				"color: black",
				"arg1",
				"arg2",
			);
		});

		it("should NOT treat array as options", () => {
			const arr = [1, 2, 3];
			globalThis.console.log("Message", arr);
			expect(mockOriginalConsole.log).toHaveBeenCalledWith(
				"%cMessage",
				"color: black",
				arr,
			);
		});

		it("should buffer message when groupId is provided", () => {
			const groupId = globalThis.console.group("Test Group");
			globalThis.console.log("Buffered message", { groupId });
			expect(mockOriginalConsole.log).not.toHaveBeenCalledWith(
				expect.stringContaining("Buffered message"),
			);
		});
	});

	describe("console.log with native %c formatting", () => {
		beforeEach(() => {
			patchConsole();
			mockOriginalConsole.log.mockClear();
		});

		it("should pass through native %c styles without prefix", () => {
			globalThis.console.log("%cMyMessage", "color: blue");
			expect(mockOriginalConsole.log).toHaveBeenCalledWith(
				"%c%cMyMessage", // ← Ведущий %c от обёртки
				"color: black",
				"color: blue",
			);
		});

		it("should handle multiple %c placeholders without prefix", () => {
			globalThis.console.log("%cHello%cWorld", "color:blue", "color:red");
			expect(mockOriginalConsole.log).toHaveBeenCalledWith(
				"%c%cHello%cWorld", // ← Ведущий %c от обёртки
				"color: black",
				"color:blue",
				"color:red",
			);
		});

		it("should prepend prefix and shift user styles correctly", () => {
			globalThis.console.log(
				"%cMyMessage",
				{ prefix: "[LOG]" } as LoggerOptions,
				"color:blue",
			);
			expect(mockOriginalConsole.log).toHaveBeenCalledWith(
				"%c[LOG]%c%cMyMessage", // prefix + %c для тела + %c пользователя
				"color: grey", // prefix style
				"color: black", // body default style
				"color:blue", // user style
			);
		});

		it("should handle prefix + multiple %c placeholders", () => {
			globalThis.console.log(
				"%cA%cB",
				{ prefix: "[X]" } as LoggerOptions,
				"color:blue",
				"color:red",
			);
			expect(mockOriginalConsole.log).toHaveBeenCalledWith(
				"%c[X]%c%cA%cB",
				"color: grey",
				"color: black",
				"color:blue",
				"color:red",
			);
		});

		it("should buffer messages with native %c and flush with correct styles", () => {
			const groupId = globalThis.console.group("Style Test");
			globalThis.console.log("%cColored", { groupId }, "color:purple");

			mockOriginalConsole.log.mockClear();
			globalThis.console.groupEnd(groupId);

			expect(mockOriginalConsole.log).toHaveBeenCalledWith(
				"%c%cColored", // ← Ведущий %c от обёртки при флеше
				"color: black",
				"color:purple",
			);
		});

		it("should handle prefix + groupId + native %c together", () => {
			const groupId = globalThis.console.group("Complex");
			globalThis.console.log(
				"%cImportant",
				{ groupId, prefix: "⚠️" },
				"color:orange",
			);

			mockOriginalConsole.log.mockClear();
			globalThis.console.groupEnd(groupId);

			expect(mockOriginalConsole.log).toHaveBeenCalledWith(
				"%c⚠️%c%cImportant",
				"color: grey",
				"color: black",
				"color:orange",
			);
		});
	});

	describe("console.warn", () => {
		beforeEach(() => {
			patchConsole();
		});

		it("should log warn with orange color", () => {
			globalThis.console.warn("Warning");
			expect(mockOriginalConsole.warn).toHaveBeenCalledWith(
				"%cWarning",
				"color: orange",
			);
		});

		it("should apply prefix with orange color", () => {
			globalThis.console.warn("Alert", { prefix: "[!]" } as LoggerOptions);
			expect(mockOriginalConsole.warn).toHaveBeenCalledWith(
				"%c[!]%cAlert",
				"color: grey",
				"color: orange",
			);
		});

		it("should support native %c with warn", () => {
			globalThis.console.warn(
				"%cBold%cNormal",
				"font-weight:bold",
				"font-weight:normal",
			);
			expect(mockOriginalConsole.warn).toHaveBeenCalledWith(
				"%c%cBold%cNormal", // ← ведущий %c от обёртки
				"color: orange",
				"font-weight:bold",
				"font-weight:normal",
			);
		});
	});

	describe("console.error", () => {
		beforeEach(() => {
			patchConsole();
		});

		it("should log error with red color", () => {
			globalThis.console.error("Error occurred");
			expect(mockOriginalConsole.error).toHaveBeenCalledWith(
				"%cError occurred",
				"color: red",
			);
		});

		it("should apply prefix with red color", () => {
			globalThis.console.error("Fail", { prefix: "[ERR]" } as LoggerOptions);
			expect(mockOriginalConsole.error).toHaveBeenCalledWith(
				"%c[ERR]%cFail",
				"color: grey",
				"color: red",
			);
		});

		it("should buffer error messages", () => {
			const groupId = globalThis.console.group("Errors");
			globalThis.console.error("Critical", { groupId });
			expect(mockOriginalConsole.error).not.toHaveBeenCalledWith(
				expect.stringContaining("Critical"),
			);
		});

		it("should support native %c with error", () => {
			globalThis.console.error(
				"%cFatal%cRecoverable",
				"color:white;background:red",
				"color:orange",
			);
			expect(mockOriginalConsole.error).toHaveBeenCalledWith(
				"%c%cFatal%cRecoverable", // ← ведущий %c от обёртки
				"color: red",
				"color:white;background:red",
				"color:orange",
			);
		});
	});

	describe("console.group / groupCollapsed / groupEnd", () => {
		beforeEach(() => {
			patchConsole();
		});

		it("should create group and return ID", () => {
			const id = globalThis.console.group("My Group");
			expect(id).toBeDefined();
			expect(typeof id).toBe("string");
			expect(id.length).toBe(16);
		});

		it("should create collapsed group", () => {
			const id = globalThis.console.groupCollapsed("Hidden");
			expect(id).toBeDefined();
		});

		it("should flush buffered messages on groupEnd", () => {
			const groupId = globalThis.console.group("Flush Test");
			globalThis.console.log("Msg 1", { groupId });
			globalThis.console.log("Msg 2", { groupId, prefix: "[X]" });

			mockOriginalConsole.log.mockClear();
			globalThis.console.groupEnd(groupId);

			expect(mockOriginalConsole.log).toHaveBeenNthCalledWith(
				1,
				"%cMsg 1",
				"color: black",
			);
			expect(mockOriginalConsole.log).toHaveBeenNthCalledWith(
				2,
				"%c[X]%cMsg 2",
				"color: grey",
				"color: black",
			);
		});

		it("should respect collapsed state when flushing", () => {
			const collapsedId = globalThis.console.groupCollapsed("Collapsed");
			globalThis.console.log("Inside collapsed", { groupId: collapsedId });
			globalThis.console.groupEnd(collapsedId);
			expect(mockOriginalConsole.groupCollapsed).toHaveBeenCalledWith(
				"Collapsed",
			);
			expect(mockOriginalConsole.group).not.toHaveBeenCalledWith("Collapsed");
		});

		it("should clean buffer after groupEnd", () => {
			const groupId = globalThis.console.group("Cleanup");
			globalThis.console.log("Temp", { groupId });
			globalThis.console.groupEnd(groupId);
			mockOriginalConsole.log.mockClear();
			globalThis.console.groupEnd(groupId);
			expect(mockOriginalConsole.log).not.toHaveBeenCalledWith(
				expect.stringContaining("Temp"),
			);
		});

		it("should pass through groupEnd without id", () => {
			globalThis.console.groupEnd();
			expect(mockOriginalConsole.groupEnd).toHaveBeenCalled();
		});

		it("should flush buffered messages with native %c styles preserved", () => {
			const groupId = globalThis.console.group("Style Flush");
			globalThis.console.log(
				"%cRed%cBlue",
				{ groupId },
				"color:red",
				"color:blue",
			);

			mockOriginalConsole.log.mockClear();
			globalThis.console.groupEnd(groupId);

			expect(mockOriginalConsole.log).toHaveBeenCalledWith(
				"%c%cRed%cBlue", // ← Ведущий %c от обёртки
				"color: black",
				"color:red",
				"color:blue",
			);
		});
	});

	describe("Global styles via patchConsole options", () => {
		it("should apply custom default styles from patchConsole", () => {
			patchConsole({
				logStyle: "color: cyan",
				warnStyle: "color: magenta",
				errorStyle: "color: white;background:black",
				prefixStyle: "font-weight:bold",
			});

			globalThis.console.log("Test");
			expect(mockOriginalConsole.log).toHaveBeenCalledWith(
				"%cTest",
				"color: cyan",
			);

			globalThis.console.warn("Warn");
			expect(mockOriginalConsole.warn).toHaveBeenCalledWith(
				"%cWarn",
				"color: magenta",
			);

			globalThis.console.error("Err");
			expect(mockOriginalConsole.error).toHaveBeenCalledWith(
				"%cErr",
				"color: white;background:black",
			);

			globalThis.console.log("With prefix", { prefix: "[X]" });
			expect(mockOriginalConsole.log).toHaveBeenCalledWith(
				"%c[X]%cWith prefix",
				"font-weight:bold", // custom prefix style
				"color: cyan", // custom log style
			);
		});
	});

	describe("Edge cases", () => {
		it("should not crash if console methods called before patch", () => {
			expect(() => {
				globalThis.console.log("Before patch");
			}).not.toThrow();
		});

		it("should handle null/undefined args gracefully", () => {
			patchConsole();
			expect(() => {
				globalThis.console.log("Test", null, undefined);
			}).not.toThrow();
			expect(mockOriginalConsole.log).toHaveBeenCalledWith(
				"%cTest",
				"color: black",
				null,
				undefined,
			);
		});

		it("should handle empty string prefix", () => {
			patchConsole();
			mockOriginalConsole.log.mockClear();
			globalThis.console.log("Msg", { prefix: "" } as LoggerOptions);
			expect(mockOriginalConsole.log).toHaveBeenCalledWith(
				"%cMsg",
				"color: black",
			);
		});

		it("should handle %c at start of message without prefix", () => {
			patchConsole();
			globalThis.console.log("%cStart", "color:green");
			expect(mockOriginalConsole.log).toHaveBeenCalledWith(
				"%c%cStart", // ← ведущий %c от обёртки
				"color: black",
				"color:green",
			);
		});
	});

	describe("Integration: Full workflow", () => {
		it("should handle nested groups with mixed content", () => {
			patchConsole();
			const outerId = globalThis.console.group("Outer");
			globalThis.console.log("Outer message");

			const innerId = globalThis.console.groupCollapsed("Inner");
			globalThis.console.log("Inner buffered", { groupId: innerId });
			globalThis.console.error("Inner error", { groupId: innerId });

			globalThis.console.groupEnd(innerId);
			globalThis.console.groupEnd(outerId);

			expect(mockOriginalConsole.log).toHaveBeenNthCalledWith(
				1,
				"%cOuter message",
				"color: black",
			);
			expect(mockOriginalConsole.log).toHaveBeenCalledWith(
				"%cInner buffered",
				"color: black",
			);
			expect(mockOriginalConsole.error).toHaveBeenCalledWith(
				"%cInner error",
				"color: red",
			);
		});

		it("should handle native %c styles in full workflow with groups", () => {
			patchConsole({ prefixStyle: "font-weight:bold" });

			const groupId = globalThis.console.group("Styled Group");

			// Сообщение с нативными %c и префиксом
			globalThis.console.log(
				"%cImportant%cNote",
				{ groupId, prefix: "🔔" },
				"color:blue",
				"color:red",
			);

			mockOriginalConsole.log.mockClear();
			globalThis.console.groupEnd(groupId);

			// Ожидаем: префикс (bold) + body default (black) + user styles (blue, red)
			expect(mockOriginalConsole.log).toHaveBeenCalledWith(
				"%c🔔%c%cImportant%cNote",
				"font-weight:bold", // global prefixStyle
				"color: black", // default body style
				"color:blue", // user style 1
				"color:red", // user style 2
			);
		});
	});
});

describe("isOptions Type Guard", () => {
	describe("Should return TRUE for valid options", () => {
		it("should recognize object with prefix", () => {
			expect(isOptions({ prefix: "[API]" })).toBe(true);
		});

		it("should recognize object with groupId", () => {
			expect(isOptions({ groupId: "123" })).toBe(true);
		});

		it("should recognize object with both prefix and groupId", () => {
			expect(isOptions({ prefix: "[X]", groupId: "abc" })).toBe(true);
		});

		it("should recognize empty object {} (for style-only passing)", () => {
			// Критичный кейс: console.log('%cHi', {}, 'color: green')
			expect(isOptions({})).toBe(true);
		});

		it("should recognize object with style fields (if they were added to interface later)", () => {
			// Даже если полей нет в текущей проверке 'prefix/groupId',
			// но объект пустой или имеет их, он пройдет.
			// Если вы добавите проверку стилей в будущем, этот тест защитит логику.
			const opts = { prefix: "", groupId: "" };
			expect(isOptions(opts)).toBe(true);
		});
	});

	describe("Should return FALSE for user data", () => {
		it("should reject plain objects with unknown keys", () => {
			// Это данные пользователя, они не должны считаться опциями
			expect(isOptions({ foo: "bar" })).toBe(false);
			expect(isOptions({ id: 1, name: "Test" })).toBe(false);
			expect(isOptions({ data: [1, 2, 3] })).toBe(false);
		});

		it("should reject objects that look like config but have extra data keys only", () => {
			// Если пользователь передаст { msg: 'hello' }, это не должно стать опциями
			expect(isOptions({ msg: "hello" })).toBe(false);
		});
	});

	describe("Should return FALSE for non-objects", () => {
		it("should reject primitives", () => {
			expect(isOptions("string")).toBe(false);
			expect(isOptions(123)).toBe(false);
			expect(isOptions(true)).toBe(false);
			expect(isOptions(undefined)).toBe(false);
		});

		it("should reject null", () => {
			expect(isOptions(null)).toBe(false);
		});

		it("should reject arrays", () => {
			expect(isOptions([])).toBe(false);
			expect(isOptions([1, 2, 3])).toBe(false);
			expect(isOptions(["prefix"])).toBe(false);
		});

		it("should reject functions", () => {
			expect(isOptions(() => {})).toBe(false);
		});
	});

	describe("Type Narrowing Verification", () => {
		it("should allow access to LoggerOptions properties after check", () => {
			const input: unknown = { prefix: "Test" };

			if (isOptions(input)) {
				// TypeScript должен понять, что input здесь - LoggerOptions
				expect(typeof input.prefix).toBe("string");
				// @ts-expect-error - groupId может не быть, но тип позволяет проверить наличие
				if (input.groupId) {
					expect(typeof input.groupId).toBe("string");
				}
			}
		});
	});
});
