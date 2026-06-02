// eslint-disable @typescript-eslint/no-unnecessary-condition

import {LoggerOptions, PatchOptions} from "./types";

interface LoggerGroupItem {
    str: string;
    prefix?: string;
    args: unknown[];
    type: 'log' | 'warn' | 'error';
}

interface LoggerGroup {
    label: string;
    data: LoggerGroupItem[];
    collapsed: boolean;
}

interface FinalOptions extends LoggerOptions, PatchOptions {}

function generateUid(len = 16): string {
    return new Array(len).fill(0).map(() => ~~(Math.random() * 10)).join('');
}

function isOptions(options: unknown): options is LoggerOptions {
    // не null, не массив, объект
    return typeof options === 'object' &&
        options !== null &&
        !Array.isArray(options) &&
        ('prefix' in options || 'groupId' in options);
}

let originalConsole: typeof console | null = null;
const buffer = new Map<string, LoggerGroup>();

/**
 * Закрываем проблему ESLint: Unnecessary conditional, value is always truthy. (@typescript-eslint/no-unnecessary-condition)
 * для кода if (originalConsole) { ... }
 */
let isPatched = false;

function getPrefixStyle(options: FinalOptions | null): string {
    return options?.prefixStyle ?? 'color: grey';
}

function getLogStyle(options: FinalOptions | null): string {
    return options?.logStyle ?? 'color: grey';
}

function getWarnStyle(options: FinalOptions | null): string {
    return options?.warnStyle ?? 'color: yellow';
}

function getErrorStyle(options: FinalOptions | null): string {
    return options?.errorStyle ?? 'color: red';
}

/**
 * Patch function
 */
export function patchConsole(patchOptions: PatchOptions = {}): void {
    if (isPatched) {
        return;
    }

    originalConsole = globalThis.console;
    isPatched = true;

    const outputStr = (str: string, options: FinalOptions, textStyle: string, ...args: unknown[]) => {
        if (options.prefix) {
            originalConsole?.log(`%c${options.prefix}%c${str}`, getPrefixStyle(options), textStyle, ...args);
        } else {
            originalConsole?.log(`%c${str}`, textStyle, ...args);
        }
    }

    const outputLog = (str: string, options: FinalOptions, ...args: unknown[]) => {
        outputStr(str, options, getLogStyle(options), ...args);
    }

    const outputWarn = (str: string, options: FinalOptions, ...args: unknown[]) => {
        outputStr(str, options, getWarnStyle(options), ...args);
    }

    const outputError = (str: string, options: FinalOptions, ...args: unknown[]) => {
        outputStr(str, options, getErrorStyle(options), ...args);
    }

    globalThis.console = {
        ...originalConsole,

        log(str: string, ...args: unknown[]) {
            const options: FinalOptions = {
                ...patchOptions,
                ...(isOptions(args[0]) ? args.shift() as LoggerOptions : {})
            };

            if (options.groupId) {
                const group = buffer.get(options.groupId);
                if (group) {
                    group.data.push({
                        str,
                        ...(options.prefix && {prefix: options.prefix}),
                        args: [...args],
                        type: 'log',
                    });
                    return;
                }
            }

            outputLog(str, options, ...args);
        },

        warn(str: string, ...args: unknown[]) {
            const options: FinalOptions = {
                ...patchOptions,
                ...(isOptions(args[0]) ? args.shift() as LoggerOptions : {})
            };

            if (options.groupId) {
                const group = buffer.get(options.groupId);
                if (group) {
                    group.data.push({
                        str,
                        ...(options.prefix && {prefix: options.prefix}),
                        args: [...args],
                        type: 'warn',
                    });
                    return;
                }
            }

            outputWarn(str, options, ...args);
        },

        error(str: string, ...args: unknown[]) {
            const options: FinalOptions = {
                ...patchOptions,
                ...(isOptions(args[0]) ? args.shift() as LoggerOptions : {})
            };

            if (options.groupId) {
                const group = buffer.get(options.groupId);
                if (group) {
                    group.data.push({
                        str,
                        ...(options.prefix && {prefix: options.prefix}),
                        args: [...args],
                        type: 'error',
                    });
                    return;
                }
            }

            outputError(str, options, ...args);
        },

        group(label: string) {
            const id = generateUid();
            buffer.set(id, {
                label,
                data: [],
                collapsed: false,
            });
            return id; // Возвращаем ID для передачи в сообщения
        },

        groupCollapsed(label: string) {
            const id = generateUid();
            buffer.set(id, {
                label,
                data: [],
                collapsed: true,
            });
            return id;
        },

        groupEnd(id?: string) {
            if (id && buffer.has(id)) {
                const group = buffer.get(id);
                if (group) {
                    if (group.collapsed) {
                        originalConsole?.groupCollapsed(group.label);
                    } else {
                        originalConsole?.group(group.label);
                    }
                    group.data.forEach(item => {
                        const options: FinalOptions = {...patchOptions, prefix: item.prefix };

                        switch (item.type) {
                            case 'log':
                                outputLog(item.str, options, ...item.args);
                                break;

                            case 'warn':
                                outputWarn(item.str, options, ...item.args);
                                break;

                            case 'error':
                                outputError(item.str, options, ...item.args);
                                break;
                        }
                    });
                }
                originalConsole?.groupEnd();
                buffer.delete(id);
            } else {
                originalConsole?.groupEnd(); // Стандартное поведение
            }
        }
    };
}

export function unpatchConsole() {
    if (isPatched && originalConsole) {
        globalThis.console = originalConsole;
        originalConsole = null;
        isPatched = false;
        buffer.clear();
    }
}
