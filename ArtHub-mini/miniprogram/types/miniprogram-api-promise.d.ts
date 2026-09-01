// types/miniprogram-api-promise.d.ts

declare module 'miniprogram-api-promise' {
	// 定义 promisifyAll 函数的类型
	export function promisifyAll(wx: any, wxp: any): void;

	// （可选）扩展其他 API 类型（如 promisify 函数）
	export function promisify(api: Function): Function;
}