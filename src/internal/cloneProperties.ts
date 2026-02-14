const getOwnPropertySymbols = Object.getOwnPropertySymbols;
const getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors;
const defineProperty = Object.defineProperty;

// 添加复制属性描述符的工具函数
export function cloneProperties(source: any, target: any): void {
  const descriptors = getOwnPropertyDescriptors(source);
  const symbols = getOwnPropertySymbols(source);
  
  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (descriptor.get || descriptor.set) {
      // 复制 getter/setter
      defineProperty(target, key, descriptor);
    }
  }
  
  // 复制 symbol 属性
  for (const sym of symbols) {
    const descriptor = getOwnPropertyDescriptors(source)[sym as any];
    if (descriptor) {
      defineProperty(target, sym, descriptor);
    }
  }
}
