// 扩展小程序组件选项类型，添加 storeBindings 支持
import { IObservableObject } from 'mobx-miniprogram';

// 定义 storeBindings 的类型结构
interface StoreBindingsConfig {
	store: IObservableObject; // MobX 的可观察对象
	fields: Record<string, string | ((store: any) => any)>; // 状态映射规则
	actions?: Record<string, string>; // 方法映射规则
}

// 扩展组件选项接口，加入 storeBindings 属性
declare global {
	namespace wx {
		interface ComponentOptions<
			P = {},
			D = {},
			M = {},
			C extends string = string,
			B extends boolean = boolean
			> {
			storeBindings?: StoreBindingsConfig | StoreBindingsConfig[];
		}
	}
}