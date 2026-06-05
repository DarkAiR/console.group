import { LoggerOptions } from "../types";

export function isOptions(options: unknown): options is LoggerOptions {
	// Не обьект или массив - это не конфиг
	if (
		typeof options !== "object" ||
		options === null ||
		Array.isArray(options)
	) {
		return false;
	}

	// Если есть наши поля - это конфиг
	if ("prefix" in options || "groupId" in options) {
		return true;
	}

	// Если это пустой объект {} — считаем конфигом (для передачи только стилей/аргументов)
	if (Object.keys(options).length === 0) {
		return true;
	}

	return false;
}
