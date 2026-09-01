// types/mobx-miniprogram-bindings.d.ts
declare module 'mobx-miniprogram-bindings' {
	// 若需更精确类型，可补充函数/导出类型（示例仅声明模块）
	export function createStoreBindings(...args: any[]): any;
	export const storeBindingsBehavior: any;
	// 其他需要导出的内容可类似声明，或简单用 `export * from '...'`（需结合库源码）
}