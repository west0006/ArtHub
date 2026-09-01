//  安卓原生
// import { MMKV } from 'react-native-mmkv';
//
// const storage = new MMKV();
//
// export const Storage = {
//     get(key: string): string | undefined {
//         return storage.getString(key);
//     },
//     set(key: string, value: string) {
//         storage.set(key, value);
//     },
//     delete(key: string) {
//         storage.delete(key);
//     },
//     clearAll() {
//         storage.clearAll();
//     },
// };

// web测试
export const Storage = {
    get(key: string): string | undefined {
        const value = localStorage.getItem(key);
        return value ?? undefined;
    },
    set(key: string, value: string): void {
        localStorage.setItem(key, value);
    },
    delete(key: string): void {
        localStorage.removeItem(key);
    },
    clearAll(): void {
        localStorage.clear();
    },
};