/**
 * 生成 package.json 配置
 * @param {string} version - 版本号
 * @returns {Object} package.json 配置对象
 */
export function createPackageConfig(version = '0.1.6') {
  return {
    name: 'xfunc',
    version,
    license: 'MIT',
    type: 'module',
    main: 'index.cjs',
    module: 'index.mjs',
    types: 'index.d.ts',
    exports: {
      '.': {
        import: './index.mjs',
        require: './index.cjs',
        default: './index.mjs'
      },
      './package.json': './package.json'
    },
    description: 'A lightweight JavaScript utility library with common functions',
    keywords: ['javascript', 'typescript', 'utils', 'utility', 'functions', 'library', 'tools'],
    homepage: 'https://github.com/uphg/xfunc#readme',
    repository: 'uphg/xfunc',
    bugs: 'https://github.com/uphg/xfunc/issues',
    author: 'Lv Heng <lvheng233@gmail.com>'
  }
}
