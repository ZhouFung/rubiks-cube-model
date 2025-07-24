# Rubik's Cube CFOP 教学应用技术方案

## 1. 项目目标

开发一个基于 Web 的 3D 魔方教学应用，帮助用户通过可视化和交互式方式学习三阶魔方 CFOP 解法。核心功能包括：
- 3D 魔方建模与交互
- 魔方打乱与还原
- CFOP 分阶段（十字、F2L、OLL、PLL）演示与引导
- 分步动画与操作提示

---

## 2. 技术选型

### 2.1 前端框架
- **React**：组件化开发，生态丰富，适合构建复杂交互界面。

### 2.2 3D 渲染
- **Three.js**：主流 Web 3D 渲染库，支持魔方建模、动画、交互。

### 2.3 魔方算法
- **cubejs**：开源魔方状态与求解库，支持魔方状态管理与打乱、求解。

### 2.4 状态管理
- **Redux**：全局状态管理，便于魔方状态、教学进度等数据同步。

### 2.5 UI 组件库
- **Ant Design**：高质量 React UI 组件，提升开发效率与界面美观度。

### 2.6 动画库
- **GSAP** 或 **React Spring**：用于魔方旋转、分步演示等动画效果。

---

## 3. 依赖库列表

- react
- react-dom
- three
- @react-three/fiber（Three.js 与 React 集成）
- @react-three/drei（Three.js 常用辅助组件）
- cubejs
- redux
- react-redux
- antd
- gsap 或 react-spring

---

## 4. 目录结构建议

```
/ (项目根目录)
├── public/                # 静态资源
├── src/
│   ├── components/        # 通用组件
│   ├── cube/              # 魔方相关逻辑与3D模型
│   ├── store/             # Redux 状态管理
│   ├── views/             # 各阶段教学页面
│   ├── utils/             # 工具函数
│   ├── App.tsx            # 应用入口
│   └── index.tsx          # 入口文件
├── tests/                 # 单元测试与集成测试
├── package.json
└── README.md
```

---

## 5. 开发流程建议

1. 初始化 React + Three.js 项目，完成 3D 魔方建模与基本交互
2. 集成 cubejs，实现魔方状态管理与打乱/还原
3. 设计并实现 CFOP 各阶段的分步演示与交互
4. 完善 UI，增加操作提示、动画与教学引导
5. 测试与优化，支持移动端适配

---

## 6. 参考资源
- [Three.js 官网](https://threejs.org/)
- [React 官方文档](https://react.dev/)
- [cubejs GitHub](https://github.com/ldez/cubejs)
- [Ant Design](https://ant.design/)
- [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction)

---


## 7. cubejs 数据结构驱动的 3D 魔方演示设计

### 7.1 集成与使用原则

- cubejs 仅作为魔方状态管理与算法核心，无需对其源码进行二次开发。
- 通过 TypeScript 封装 cubejs 的 JS API，保证在 React + TS 项目中类型安全调用。

### 7.2 3D 视图与数据结构同步

- 3D 魔方模型（基于 Three.js/@react-three/fiber）与 cubejs 的状态数据（如各面颜色、魔方操作序列）保持同步。
- 每次 cubejs 状态变更（如 move、打乱、还原），都驱动 3D 视图的动画与渲染。
- 推荐在 `src/cube/` 下实现 cubejs 的 TS 封装（如 `cube-adapter.ts`），并定义魔方状态到 3D 模型的映射逻辑。

### 7.3 设计要点

- 明确 cubejs 的数据结构（如魔方状态字符串、操作方法），并设计对应的 3D 魔方块体、贴图、动画方案。
- 保证 3D 视图的每一步操作都与 cubejs 状态一致，实现“所见即所得”的教学体验。
- 可扩展支持分步高亮、操作提示、CFOP 阶段分解等功能。

---

如需 cubejs 数据结构说明、TS 封装模板或 3D 同步实现示例，请随时告知。

---

## 8. 详细开发 Checklist


 [x] 初始化 Vite + React + TypeScript 项目
   - [x] 使用 Vite 创建项目骨架（`npm create vite@latest` 或 `yarn create vite`）
   - [x] 选择 React + TypeScript 模板
   - [x] 配置 ESLint、Prettier、Git hooks 等开发工具
   - [x] 配置 alias 路径映射（vite.config.ts 中设置）
 [x] 安装依赖库（见第 3 节）
 [x] 目录结构搭建（见第 4 节，包括 tests/ 测试目录）

 [x] cubejs 封装与适配
   - [x] 在 `src/cube/` 下创建 `cube-adapter.ts`
   - [x] 封装 cubejs 的初始化、move、打乱、还原等方法
   - [x] 定义魔方状态类型（如面颜色、操作序列等）
   - [x] 提供魔方状态到 3D 视图的数据映射方法

 [x] 3D 魔方建模与渲染
   - [x] 使用 @react-three/fiber 创建 3D 魔方组件
   - [x] 设计魔方块体、贴图、颜色映射
   - [ ] 支持魔方整体旋转、缩放、拖拽
   - [ ] 支持单层旋转动画

 [ ] 魔方状态与 3D 视图同步
   - [ ] 每次 cubejs 状态变更后，驱动 3D 魔方动画
   - [ ] 保证 3D 视图与 cubejs 状态一致（如 move、打乱、还原后自动刷新贴色）
   - [ ] 支持魔方状态回显与重置

 [ ] 交互与操作
   - [ ] 支持用户点击/拖拽操作魔方
   - [ ] 支持输入公式（如 R U R' U'）并执行
   - [ ] 支持打乱、还原、一键复原等操作

 [ ] CFOP 教学分步实现
   - [ ] 设计分阶段（十字、F2L、OLL、PLL）教学流程
   - [ ] 每阶段支持分步高亮、操作提示
   - [ ] 支持自动演示与手动分步切换
   - [ ] 支持当前步骤/阶段的状态回显

 [ ] UI 设计与优化
   - [ ] 使用 Ant Design 实现主界面、按钮、进度条等
   - [ ] 设计教学提示、操作区、魔方区布局
   - [ ] 响应式适配移动端

 [ ] 动画与视觉效果
   - [ ] 使用 GSAP/React Spring 实现魔方旋转、分步动画
   - [ ] 支持高亮当前操作块体
   - [ ] 支持操作历史回放

 [ ] 状态管理
   - [ ] 使用 Redux 管理魔方状态、教学进度、用户操作等
   - [ ] 设计全局 store 结构

 [ ] 测试与调试
   - [ ] 单元测试 cubejs 封装与 3D 同步逻辑
   - [ ] 交互与动画的集成测试
   - [ ] 教学流程的端到端测试

 [ ] 文档与维护
   - [ ] 编写开发文档、接口说明、组件说明
   - [ ] 代码注释与维护规范

 [ ] 断点调试与开发效率提升
   - [ ] 配置 VSCode 的调试 launch.json，支持 Vite + React 源码断点调试
   - [ ] 熟悉 Vite 的 source map 支持，确保调试时可直接定位到 TypeScript/JSX 源码
   - [ ] 在关键业务逻辑（如 cubejs 封装、3D 同步、交互处理等）添加断点，便于排查问题
   - [ ] 善用 VSCode 调试面板、变量监视、调用堆栈等功能
   - [ ] 如需调试测试代码，可配置 Jest/Vitest 的断点调试
