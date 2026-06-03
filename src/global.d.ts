/// <reference types="node" />

// Для Node.js проектов (если есть @types/node)
declare module "node:console" {
	interface Console {
		group(label: string): string;
		groupCollapsed(label: string): string;
		groupEnd(id?: string);
	}
}

declare module "console" {
	interface Console {
		group(label: string): string;
		groupCollapsed(label: string): string;
		groupEnd(id?: string);
	}
}

declare global {
	interface Console {
		group(label: string): string;
		groupCollapsed(label: string): string;
		groupEnd(id?: string);
	}
}

export {};
