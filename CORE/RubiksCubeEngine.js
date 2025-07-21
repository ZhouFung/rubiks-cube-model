/**
 * 魔方引擎主类
 * 这是整个魔方系统的核心入口点，提供统一的API接口
 */

import { DEFAULT_CONFIG, EVENTS, ERROR_MESSAGES } from "../utils/constants.js";
import { createEventEmitter, generateScramble } from "../utils/helpers.js";
import {
  validateContainer,
  validateOptions,
  validateSolveOptions,
  validateTutorialOptions,
  validateScrambleOptions,
} from "../utils/validators.js";
import { CubeNotation } from "./CubeNotation.js";
import { CubeStateManager } from "./CubeStateManager.js";
import { CubeRenderer3D } from "./CubeRenderer3D.js";

export class RubiksCubeEngine {
  constructor(options = {}) {
    // 验证和合并配置
    const configValidation = validateOptions(options);
    if (!configValidation.isValid) {
      throw new Error(`配置错误: ${configValidation.error}`);
    }

    this.config = { ...DEFAULT_CONFIG, ...configValidation.sanitized };

    // 验证容器
    if (this.config.container) {
      const containerValidation = validateContainer(this.config.container);
      if (!containerValidation.isValid) {
        throw new Error(containerValidation.error);
      }
      this.container = containerValidation.element;
    }

    // 初始化事件系统
    this.eventEmitter = createEventEmitter();

    // 初始化核心模块
    this.notation = new CubeNotation();
    this.stateManager = new CubeStateManager(this.eventEmitter);

    // 状态标记
    this.isInitialized = false;
    this.isAnimating = false;
    this.tutorialMode = false;

    // 教学模式相关
    this.tutorialData = {
      algorithm: "",
      steps: [],
      currentStep: 0,
      isPlaying: false,
      options: {},
    };

    // 延迟初始化渲染器和其他模块
    this._initializeAsync();
  }

  /**
   * 异步初始化
   * @private
   */
  async _initializeAsync() {
    try {
      // 初始化3D渲染器
      if (this.container) {
        this.renderer = new CubeRenderer3D(
          this.container,
          this.config,
          this.eventEmitter
        );
        console.log("3D渲染器初始化完成");
      }

      // TODO: 初始化转动引擎
      // this.moveEngine = new CubeMoveEngine(this.stateManager, this.renderer);

      // TODO: 初始化求解器
      // this.solver = new CubeSolver();

      this.isInitialized = true;

      // 触发初始化完成事件
      this.eventEmitter.emit("initialized", {
        config: this.config,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("RubiksCubeEngine 初始化失败:", error);
      this.eventEmitter.emit(EVENTS.ERROR, {
        operation: "initialization",
        message: `初始化失败: ${error.message}`,
        timestamp: Date.now(),
      });
    }
  }

  // ===== 基础操作接口 =====

  /**
   * 执行转动操作
   * @param {string} notation - 转动记号法
   * @param {Object} options - 选项
   * @returns {Promise<boolean>} 是否成功
   */
  async rotate(notation, options = {}) {
    if (typeof window !== "undefined" && window.logger) {
      window.logger.info("RubiksCubeEngine.rotate 开始执行", {
        notation,
        options,
        isInitialized: this.isInitialized,
        isAnimating: this.isAnimating,
      });
    }

    if (!this.isInitialized) {
      const error = new Error("魔方引擎未初始化完成");
      if (typeof window !== "undefined" && window.logger) {
        window.logger.error("rotate失败：引擎未初始化", {
          error: error.message,
        });
      }
      throw error;
    }

    if (this.isAnimating) {
      const error = new Error(ERROR_MESSAGES.ANIMATION_IN_PROGRESS);
      if (typeof window !== "undefined" && window.logger) {
        window.logger.error("rotate失败：动画正在进行中", {
          error: error.message,
        });
      }
      throw error;
    }

    // 解析记号法
    const parseResult = this.notation.parseAlgorithm(notation);
    if (!parseResult.isValid) {
      const error = new Error(parseResult.error);
      if (typeof window !== "undefined" && window.logger) {
        window.logger.error("rotate失败：记号法解析错误", {
          notation,
          error: error.message,
          parseResult,
        });
      }
      throw error;
    }

    if (typeof window !== "undefined" && window.logger) {
      window.logger.info("记号法解析成功，设置动画状态", {
        notation,
        parsedMoves: parseResult.moves,
        moveCount: parseResult.moves.length,
      });
    }

    this.isAnimating = true;

    try {
      if (typeof window !== "undefined" && window.logger) {
        window.logger.info("开始逐步执行转动", {
          moveCount: parseResult.moves.length,
          moves: parseResult.moves.map((m) => m.notation),
        });
      }

      // 逐步执行每个转动
      for (const move of parseResult.moves) {
        if (typeof window !== "undefined" && window.logger) {
          window.logger.info("执行单个转动", {
            move: move.notation,
            face: move.face,
            direction: move.direction,
            times: move.times,
          });
        }

        await this._executeSingleMove(move, options);

        if (typeof window !== "undefined" && window.logger) {
          window.logger.info("单个转动执行完成", {
            move: move.notation,
          });
        }

        // 为每个单独转动触发事件
        this.eventEmitter.emit(EVENTS.MOVE, {
          move: move.notation,
          success: true,
          timestamp: Date.now(),
        });
      }

      if (typeof window !== "undefined" && window.logger) {
        window.logger.success("rotate方法所有转动执行完成", {
          notation,
          totalMoves: parseResult.moves.length,
        });
      }

      return true;
    } catch (error) {
      if (typeof window !== "undefined" && window.logger) {
        window.logger.error("rotate方法执行失败", {
          notation,
          error: error.message,
          errorStack: error.stack,
        });
      }

      this.eventEmitter.emit(EVENTS.ERROR, {
        operation: "rotate",
        message: error.message,
        timestamp: Date.now(),
      });
      throw error; // 重新抛出错误
    } finally {
      // 确保状态总是被重置
      this.isAnimating = false;

      if (typeof window !== "undefined" && window.logger) {
        window.logger.info("rotate方法结束，重置动画状态", {
          notation,
          isAnimating: this.isAnimating,
        });
      }
    }
  }

  /**
   * 打乱魔方
   * @param {Object} options - 打乱选项
   * @returns {Promise<string>} 打乱算法
   */
  async scramble(options = {}) {
    if (typeof window !== "undefined" && window.logger) {
      window.logger.info("RubiksCubeEngine.scramble 开始执行", {
        options: options,
      });
    }

    const validation = validateScrambleOptions(options);
    if (!validation.isValid) {
      const error = new Error(validation.error);
      if (typeof window !== "undefined" && window.logger) {
        window.logger.error("scramble验证失败", { error: error.message });
      }
      throw error;
    }

    const scrambleOptions = validation.sanitized;
    let algorithm;

    if (scrambleOptions.algorithm) {
      algorithm = scrambleOptions.algorithm;
    } else {
      const steps = scrambleOptions.steps || 20;
      const avoidRedundant = scrambleOptions.avoidRedundant !== false;
      algorithm = generateScramble(steps, avoidRedundant);
    }

    if (typeof window !== "undefined" && window.logger) {
      window.logger.info("生成打乱算法", {
        algorithm,
        steps: algorithm.split(" ").length,
      });
    }

    // 执行打乱 (使用rotate方法确保记录到历史)
    await this.rotate(algorithm, {
      animationSpeed: this.config.animationSpeed,
    });

    if (typeof window !== "undefined" && window.logger) {
      window.logger.success("打乱执行完成");
    }

    // 触发打乱事件
    this.eventEmitter.emit(EVENTS.SCRAMBLE, {
      algorithm,
      timestamp: Date.now(),
    });

    if (typeof window !== "undefined" && window.logger) {
      window.logger.info("scramble方法执行成功", { algorithm });
    }

    return algorithm;
  }

  /**
   * 重置魔方到已还原状态
   * @param {Object} options - 选项
   * @returns {Promise<void>}
   */
  async reset(options = {}) {
    if (this.isAnimating) {
      throw new Error(ERROR_MESSAGES.ANIMATION_IN_PROGRESS);
    }

    this.stateManager.reset();

    // 重置3D渲染器状态
    if (this.renderer) {
      this.renderer.reset();
    }

    this.tutorialMode = false;
    this.tutorialData = {
      algorithm: "",
      steps: [],
      currentStep: 0,
      isPlaying: false,
      options: {},
    };
  }

  /**
   * 还原魔方 - 执行实际的还原算法动画
   * @param {Object} options - 还原选项
   * @returns {Promise<string>} 还原算法
   */
  async solve(options = {}) {
    // 添加日志记录
    if (typeof window !== "undefined" && window.logger) {
      window.logger.info("RubiksCubeEngine.solve 开始执行", {
        options: options,
        isAnimating: this.isAnimating,
        isInitialized: this.isInitialized,
      });
    }

    if (this.isAnimating) {
      const error = new Error(ERROR_MESSAGES.ANIMATION_IN_PROGRESS);
      if (typeof window !== "undefined" && window.logger) {
        window.logger.error("solve失败：动画正在进行中", {
          error: error.message,
        });
      }
      throw error;
    }

    const defaultOptions = {
      method: "kociemba",
      maxLength: 25,
      animate: true,
      showSteps: false,
    };

    const config = { ...defaultOptions, ...options };

    if (typeof window !== "undefined" && window.logger) {
      window.logger.info("solve配置准备完成", { config });
    }

    try {
      // 不要在这里设置isAnimating，让rotate方法自己管理
      // this.isAnimating = config.animate;

      // 获取当前状态的逆向操作序列作为解法
      const history = this.stateManager.getHistory("moves");

      if (typeof window !== "undefined" && window.logger) {
        window.logger.info("获取操作历史", {
          historyLength: history.length,
          history: history,
        });
      }

      if (history.length === 0) {
        const error = new Error("魔方已经是还原状态");
        if (typeof window !== "undefined" && window.logger) {
          window.logger.warn("solve失败：魔方已是还原状态", { history });
        }
        throw error;
      }

      // 生成逆向算法
      const reverseAlgorithm = this._generateReverseAlgorithm(history);

      if (typeof window !== "undefined" && window.logger) {
        window.logger.info("生成逆向算法", {
          reverseAlgorithm,
          originalHistory: history,
        });
      }

      this.eventEmitter.emit(EVENTS.SOLVE_START, {
        algorithm: reverseAlgorithm,
        method: config.method,
        timestamp: Date.now(),
      });

      if (config.animate) {
        if (typeof window !== "undefined" && window.logger) {
          window.logger.info("开始执行还原动画", {
            algorithm: reverseAlgorithm,
            animationSpeed: this.config.animationSpeed,
          });
        }

        // 执行还原动画
        await this.rotate(reverseAlgorithm, {
          animationSpeed: this.config.animationSpeed,
          showDescription: config.showSteps,
        });

        if (typeof window !== "undefined" && window.logger) {
          window.logger.success("还原动画执行完成");
        }
      } else {
        // 直接重置状态
        this.stateManager.reset();
        if (this.renderer) {
          this.renderer.reset();
        }

        if (typeof window !== "undefined" && window.logger) {
          window.logger.info("直接重置状态完成");
        }
      }

      this.eventEmitter.emit(EVENTS.SOLVE_COMPLETE, {
        algorithm: reverseAlgorithm,
        steps: reverseAlgorithm.split(" ").length,
        timestamp: Date.now(),
      });

      if (typeof window !== "undefined" && window.logger) {
        window.logger.success("solve方法执行成功", {
          algorithm: reverseAlgorithm,
          stepCount: reverseAlgorithm.split(" ").length,
        });
      }

      return reverseAlgorithm;
    } catch (error) {
      if (typeof window !== "undefined" && window.logger) {
        window.logger.error("solve方法执行失败", {
          errorMessage: error.message,
          errorStack: error.stack,
          config: config,
        });
      }

      this.eventEmitter.emit(EVENTS.ERROR, {
        operation: "solve",
        message: error.message,
        timestamp: Date.now(),
      });
      throw error;
    } finally {
      this.isAnimating = false;

      if (typeof window !== "undefined" && window.logger) {
        window.logger.info("solve方法结束，重置动画状态");
      }
    }
  }

  /**
   * 生成逆向算法
   * @private
   */
  _generateReverseAlgorithm(moves) {
    const reverseMoves = [];

    // 逆序处理每个动作
    for (let i = moves.length - 1; i >= 0; i--) {
      const move = moves[i];
      const inverseMove = this.notation.getInverse(move);
      reverseMoves.push(inverseMove);
    }

    return reverseMoves.join(" ");
  }

  // ===== 状态管理接口 =====

  /**
   * 获取当前状态
   * @param {string} format - 格式
   * @returns {*} 魔方状态
   */
  getState(format = "object") {
    return this.stateManager.getState(format);
  }

  /**
   * 设置魔方状态
   * @param {*} state - 新状态
   * @param {string} format - 状态格式
   * @returns {Promise<boolean>} 是否成功
   */
  async setState(state, format = "object") {
    const success = this.stateManager.setState(state, format);
    if (success) {
      // TODO: 更新3D渲染器
      // if (this.renderer) {
      //   await this.renderer.updateState(this.stateManager.getState());
      // }
    }
    return success;
  }

  /**
   * 获取操作历史
   * @param {string} format - 格式
   * @returns {Array} 历史记录
   */
  getHistory(format = "array") {
    return this.stateManager.getHistory(format);
  }

  /**
   * 撤销操作
   * @param {number} steps - 步数
   * @returns {Promise<boolean>} 是否成功
   */
  async undo(steps = 1) {
    if (this.isAnimating) {
      throw new Error(ERROR_MESSAGES.ANIMATION_IN_PROGRESS);
    }

    const success = this.stateManager.undo(steps);
    if (success) {
      // TODO: 更新3D渲染器
      // if (this.renderer) {
      //   await this.renderer.updateState(this.stateManager.getState());
      // }
    }
    return success;
  }

  /**
   * 重做操作
   * @param {number} steps - 步数
   * @returns {Promise<boolean>} 是否成功
   */
  async redo(steps = 1) {
    if (this.isAnimating) {
      throw new Error(ERROR_MESSAGES.ANIMATION_IN_PROGRESS);
    }

    const success = this.stateManager.redo(steps);
    if (success) {
      // TODO: 更新3D渲染器
      // if (this.renderer) {
      //   await this.renderer.updateState(this.stateManager.getState());
      // }
    }
    return success;
  }

  // ===== 求解接口 =====

  /**
   * 验证是否已还原
   * @returns {boolean} 是否已还原
   */
  isSolved() {
    return this.stateManager.isSolved();
  }

  // ===== 教学模式接口 =====

  /**
   * 开始教学模式
   * @param {string} algorithm - 算法
   * @param {Object} options - 选项
   * @returns {boolean} 是否成功
   */
  startTutorial(algorithm, options = {}) {
    const validation = validateTutorialOptions(options);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const parseResult = this.notation.parseAlgorithm(algorithm);
    if (!parseResult.isValid) {
      throw new Error(parseResult.error);
    }

    this.tutorialMode = true;
    this.tutorialData = {
      algorithm,
      steps: parseResult.moves,
      currentStep: 0,
      isPlaying: false,
      options: validation.sanitized,
    };

    this.eventEmitter.emit(EVENTS.TUTORIAL_STEP, {
      action: "start",
      algorithm,
      totalSteps: parseResult.moves.length,
      currentStep: 0,
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * 教学模式下一步
   * @returns {Promise<boolean>} 是否成功
   */
  async tutorialNext() {
    if (!this.tutorialMode) {
      throw new Error("未在教学模式中");
    }

    if (this.tutorialData.currentStep >= this.tutorialData.steps.length) {
      return false; // 已经是最后一步
    }

    const currentMove = this.tutorialData.steps[this.tutorialData.currentStep];

    try {
      await this._executeSingleMove(currentMove, this.tutorialData.options);
      this.tutorialData.currentStep++;

      this.eventEmitter.emit(EVENTS.TUTORIAL_STEP, {
        action: "next",
        currentStep: this.tutorialData.currentStep,
        totalSteps: this.tutorialData.steps.length,
        move: currentMove.notation,
        timestamp: Date.now(),
      });

      return true;
    } catch (error) {
      this.eventEmitter.emit(EVENTS.ERROR, {
        operation: "tutorialNext",
        message: error.message,
        timestamp: Date.now(),
      });
      return false;
    }
  }

  /**
   * 教学模式上一步
   * @returns {Promise<boolean>} 是否成功
   */
  async tutorialPrev() {
    if (!this.tutorialMode) {
      throw new Error("未在教学模式中");
    }

    if (this.tutorialData.currentStep <= 0) {
      return false; // 已经是第一步
    }

    this.tutorialData.currentStep--;
    const moveToReverse =
      this.tutorialData.steps[this.tutorialData.currentStep];
    const inverseMove = this.notation.getInverse(moveToReverse.notation);

    try {
      await this.rotate(inverseMove, this.tutorialData.options);

      this.eventEmitter.emit(EVENTS.TUTORIAL_STEP, {
        action: "prev",
        currentStep: this.tutorialData.currentStep,
        totalSteps: this.tutorialData.steps.length,
        move: inverseMove,
        timestamp: Date.now(),
      });

      return true;
    } catch (error) {
      this.eventEmitter.emit(EVENTS.ERROR, {
        operation: "tutorialPrev",
        message: error.message,
        timestamp: Date.now(),
      });
      return false;
    }
  }

  /**
   * 暂停教学
   */
  tutorialPause() {
    if (this.tutorialMode) {
      this.tutorialData.isPlaying = false;
    }
  }

  /**
   * 恢复教学
   */
  tutorialResume() {
    if (this.tutorialMode) {
      this.tutorialData.isPlaying = true;
    }
  }

  // ===== 事件与回调 =====

  /**
   * 注册事件监听
   * @param {string} event - 事件名
   * @param {Function} callback - 回调函数
   */
  on(event, callback) {
    this.eventEmitter.on(event, callback);
  }

  /**
   * 移除事件监听
   * @param {string} event - 事件名
   * @param {Function} callback - 回调函数
   */
  off(event, callback) {
    this.eventEmitter.off(event, callback);
  }

  // ===== 配置接口 =====

  /**
   * 设置动画速度
   * @param {number} speed - 速度(毫秒)
   */
  setAnimationSpeed(speed) {
    this.config.animationSpeed = Math.max(50, Math.min(speed, 5000));
    // TODO: 更新渲染器配置
    // if (this.renderer) {
    //   this.renderer.setAnimationSpeed(this.config.animationSpeed);
    // }
  }

  /**
   * 设置主题
   * @param {string} theme - 主题名
   */
  setTheme(theme) {
    this.config.theme = theme;
    // TODO: 更新渲染器主题
    // if (this.renderer) {
    //   this.renderer.setTheme(theme);
    // }
  }

  /**
   * 启用/禁用触摸控制
   * @param {boolean} enabled - 是否启用
   */
  setTouchControl(enabled) {
    this.config.enableTouch = enabled;
    // TODO: 更新渲染器配置
    // if (this.renderer) {
    //   this.renderer.setTouchControl(enabled);
    // }
  }

  /**
   * 设置相机视角
   * @param {string} view - 视角名称 ("default", "top", "front", "side")
   */
  setCameraView(view = "default") {
    if (this.renderer && this.renderer.setCameraView) {
      this.renderer.setCameraView(view);
    }
  }

  /**
   * 将魔方适配到视野中心并调整大小
   */
  fitCubeToView() {
    if (this.renderer && this.renderer.fitCubeToView) {
      this.renderer.fitCubeToView();
    } else {
      // 默认实现：重置相机位置
      this.setCameraView("default");
    }
  }

  /**
   * 执行算法
   * @param {string} algorithm - 魔方算法字符串
   * @param {Object} options - 执行选项
   * @returns {Promise<void>}
   */
  async executeAlgorithm(algorithm, options = {}) {
    if (!algorithm || typeof algorithm !== "string") {
      throw new Error("算法不能为空");
    }

    await this.rotate(algorithm, options);
  }

  /**
   * 暂停当前动画
   */
  pauseAnimation() {
    if (this.renderer && this.renderer.pauseAnimation) {
      this.renderer.pauseAnimation();
    }
    this.isAnimating = false;
  }

  /**
   * 获取统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    const state = this.stateManager.getState();
    return {
      moveCount: state.moveHistory ? state.moveHistory.length : 0,
      isSolved: this.stateManager.isSolved(),
      currentState: state,
      isAnimating: this.isAnimating,
      tutorialMode: this.tutorialMode,
    };
  }

  /**
   * 导出魔方数据
   * @returns {Object} 导出数据
   */
  export() {
    return {
      ...this.stateManager.export(),
      config: this.config,
      tutorialData: this.tutorialData,
    };
  }

  /**
   * 导入魔方数据
   * @param {Object} data - 导入数据
   * @returns {boolean} 是否成功
   */
  import(data) {
    try {
      const success = this.stateManager.import(data);

      if (success && data.tutorialData) {
        this.tutorialData = { ...this.tutorialData, ...data.tutorialData };
        this.tutorialMode = Boolean(data.tutorialData.algorithm);
      }

      return success;
    } catch (error) {
      this.eventEmitter.emit(EVENTS.ERROR, {
        operation: "import",
        message: error.message,
        timestamp: Date.now(),
      });
      return false;
    }
  }

  /**
   * 销毁魔方引擎
   */
  destroy() {
    // TODO: 清理渲染器
    // if (this.renderer) {
    //   this.renderer.destroy();
    // }

    // 清理事件监听器
    this.eventEmitter.removeAllListeners();

    // 清理状态
    this.stateManager.clearHistory();
    this.isInitialized = false;
  }

  /**
   * 强制重置引擎状态（用于错误恢复）
   * @returns {void}
   */
  forceResetState() {
    this.isAnimating = false;
    this.tutorialMode = false;

    if (this.renderer) {
      this.renderer.isAnimating = false;
    }

    this.eventEmitter.emit(EVENTS.STATE_CHANGE, {
      action: "force_reset",
      message: "引擎状态已强制重置",
      timestamp: Date.now(),
    });

    console.log("引擎状态已强制重置");
  }

  // ===== 私有方法 =====

  /**
   * 执行单个转动
   * @private
   */
  async _executeSingleMove(move, options = {}) {
    // 记录转动到状态管理器
    this.stateManager.applyMove(move.notation, {
      duration: options.speed || this.config.animationSpeed,
    });

    // 执行3D动画
    if (this.renderer) {
      await this.renderer.animateMove(move, options);
    }

    // TODO: 应用转动到逻辑状态
    // if (this.moveEngine) {
    //   const newState = this.moveEngine.applyMove(this.stateManager.getState(), move);
    //   this.stateManager.completeMoveApplication(newState);
    // }

    // 临时：直接完成转动
    this.stateManager.completeMoveApplication(this.stateManager.getState());
  }

  /**
   * 内部转动执行方法（不触发MOVE事件）
   * @param {string} notation - 转动记号法
   * @param {Object} options - 选项
   * @private
   */
  async _executeMovesInternal(notation, options = {}) {
    if (!this.isInitialized) {
      throw new Error("魔方引擎未初始化完成");
    }

    if (this.isAnimating) {
      throw new Error(ERROR_MESSAGES.ANIMATION_IN_PROGRESS);
    }

    // 解析记号法
    const parseResult = this.notation.parseAlgorithm(notation);
    if (!parseResult.isValid) {
      throw new Error(parseResult.error);
    }

    this.isAnimating = true;

    try {
      // 逐步执行每个转动
      for (const move of parseResult.moves) {
        await this._executeSingleMove(move, options);
      }
    } finally {
      // 确保状态总是被重置
      this.isAnimating = false;
    }
  }

  /**
   * 十字还原（Cross）—— 框架方法
   * 自动计算并执行还原十字的步骤，返回步骤序列。
   * TODO: 需实现具体算法逻辑。
   * @returns {Promise<string[]>} 步骤序列
   */
  async solveCross() {
    // 1. 获取当前魔方状态
    const state = this.getState('object');

    // 2. 分析所有白色棱块的位置和朝向
    // TODO: 这里需要实现棱块定位与判断

    // 3. 针对每个棱块，规划归位步骤
    // TODO: 这里需要实现十字还原算法

    // 4. 执行步骤（可选：动画）
    // TODO: 这里可以调用 this.rotate() 执行步骤

    // 5. 返回步骤序列（暂时返回空数组，后续完善）
    return [];
  }
}
