// ------ 基础用户与认证 ------
export interface UserProfile {
    id: number;
    nickname: string;
    avatarUrl?: string;
    phone?: string;
    role: number;
    email?: string;
    createTime?: string;
}

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: UserProfile;
}

// ------ 订单 ------
export interface OrderData {
    id: number;
    title: string;                          // 原 windowName 统一为 title
    clientName?: string;
    price?: number;
    quantity?: number;
    totalAmount?: number;
    startDate?: string;
    deadline?: string;
    status: 'pending' | 'progress' | 'completed';
    description?: string;                   // 覆盖原 windowName 和 settingInfo 的描述
    platform?: string;
    platformOrderId?: string;
    platformUrl?: string;
    importMethod?: string;
    createTime?: string;
}

// ------ 素材 ------
export interface MaterialData {
    id: number;
    title: string;
    description?: string;
    fileUrl: string;
    thumbnailUrl?: string;
    tags?: string;
    colorPalette?: string;
    sourcePlatform?: string;
    sourceUrl?: string;
    copyright?: string;
    fileSize?: number;
    dimension?: string;
    createTime: string;
}

// ------ 仪表盘 ------
export interface DashboardSummary {
    orderCount: number;
    totalIncome: number;
    completedOrders: number;
    pendingOrders: number;
    materialCount: number;
    tutorialCount: number;
}

// ------ 导入 ------
export interface ImportResult {
    id: number;
    message?: string;
    order?: any;
}