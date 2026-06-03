/// <reference types="node" />

declare global {
	interface Console {
		group(label: string): string;
		groupCollapsed(label: string): string;
	}
}
export {};
