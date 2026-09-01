/**
 * 表单通用验证工具
 * 所有函数返回真实错误字符串，验证通过返回 null
 */

// --------------- 基础校验 ---------------

/** 邮箱格式 */
export const isValidEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

/** 中国手机号格式（宽松匹配） */
export const isValidPhone = (value: string): boolean =>
  /^1[3-9]\d{9}$/.test(value);

/** 纯中文昵称（2-20个字符，允许字母数字下划线） */
export const isValidNickname = (value: string): boolean =>
  /^[\u4e00-\u9fa5a-zA-Z0-9_]{2,20}$/.test(value);

/** 密码强度：至少6位 */
export const isValidPassword = (value: string): boolean =>
  value.length >= 6;

/** 非空字符串 */
export const isNotEmpty = (value: string | undefined | null): boolean =>
  (value ?? '').trim().length > 0;

/** 正数（可带小数） */
export const isPositiveNumber = (value: string | number): boolean => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) && num > 0;
};

/** 整数 >= 1 */
export const isPositiveInt = (value: string | number): boolean => {
  const num = typeof value === 'string' ? parseInt(value, 10) : value;
  return !isNaN(num) && Number.isInteger(num) && num >= 1;
};

// --------------- 带错误信息的校验 ---------------

export interface ValidationRule {
  /** 校验函数，返回 true 表示通过 */
  test: (value: any) => boolean;
  message: string;
}

/** 执行单个校验 */
export const validateField = (
  value: any,
  rules: ValidationRule[]
): string | null => {
  for (const rule of rules) {
    if (!rule.test(value)) {
      return rule.message;
    }
  }
  return null;
};

// --------------- 预定义规则集 ---------------

/** 邮箱校验规则 */
export const emailRules: ValidationRule[] = [
  { test: (v: string) => isNotEmpty(v), message: '请输入邮箱地址' },
  { test: (v: string) => isValidEmail(v), message: '邮箱格式不正确' },
];

/** 密码规则 */
export const passwordRules: ValidationRule[] = [
  { test: (v: string) => isNotEmpty(v), message: '请输入密码' },
  { test: (v: string) => isValidPassword(v), message: '密码至少需要6位' },
];

/** 确认密码规则 */
export const confirmPasswordRules = (
  password: string
): ValidationRule[] => [
  { test: (v: string) => isNotEmpty(v), message: '请再次输入密码' },
  { test: (v: string) => v === password, message: '两次密码不一致' },
];

/** 昵称规则 */
export const nicknameRules: ValidationRule[] = [
  { test: (v: string) => isNotEmpty(v), message: '请输入昵称' },
  { test: (v: string) => isValidNickname(v), message: '昵称须为2-20位中英文或数字下划线' },
];

/** 订单标题 */
export const orderTitleRules: ValidationRule[] = [
  { test: (v: string) => isNotEmpty(v), message: '请输入橱窗名称' },
  { test: (v: string) => v.length <= 100, message: '标题不能超过100个字' },
];

/** 客户名称（可选，若有则长度限制） */
export const clientNameRules: ValidationRule[] = [
  { test: (v: string) => !v || v.length <= 50, message: '客户名称不能超过50个字' },
];

/** 单价 */
export const priceRules: ValidationRule[] = [
  { test: (v: string) => isNotEmpty(v), message: '请输入价格' },
  { test: (v: string) => isPositiveNumber(v), message: '请输入有效的正数价格' },
];

/** 数量 */
export const quantityRules: ValidationRule[] = [
  { test: (v: string) => isNotEmpty(v), message: '请输入数量' },
  { test: (v: string) => isPositiveInt(v), message: '数量必须为整数且不小于1' },
];

/** 描述 */
export const descriptionRules: ValidationRule[] = [
  { test: (v: string) => isNotEmpty(v), message: '请输入要求描述' },
  { test: (v: string) => v.length <= 500, message: '描述不能超过500字' },
];

/** 日期字符串（YYYY-MM-DD） */
export const dateRules: ValidationRule[] = [
  { test: (v: string) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), message: '日期格式不正确' },
];

// --------------- 复合校验（常用于表单提交） ---------------

export interface OrderFormData {
  title: string;
  clientName?: string;
  price: string | number;
  quantity: string | number;
  description: string;
  startDate?: string;
  deadline?: string;
}

/**
 * 验证整个订单表单，返回字段错误映射
 */
export const validateOrderForm = (
  data: OrderFormData
): Record<string, string> => {
  const errors: Record<string, string> = {};

  const titleErr = validateField(data.title, orderTitleRules);
  if (titleErr) errors.title = titleErr;

  if (data.clientName) {
    const clientErr = validateField(data.clientName, clientNameRules);
    if (clientErr) errors.clientName = clientErr;
  }

  const priceErr = validateField(data.price, priceRules);
  if (priceErr) errors.price = priceErr;

  const quantityErr = validateField(data.quantity, quantityRules);
  if (quantityErr) errors.quantity = quantityErr;

  const descErr = validateField(data.description, descriptionRules);
  if (descErr) errors.description = descErr;

  // 日期非必须，若填写则校验格式
  if (data.startDate) {
    const startErr = validateField(data.startDate, dateRules);
    if (startErr) errors.startDate = startErr;
  }
  if (data.deadline) {
    const deadErr = validateField(data.deadline, dateRules);
    if (deadErr) errors.deadline = deadErr;
  }

  return errors;
};

/**
 * 检查错误对象是否为空（表单是否完全通过）
 */
export const isFormValid = (errors: Record<string, string>): boolean =>
  Object.keys(errors).length === 0;