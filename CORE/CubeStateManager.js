/**
 * 魔方状态管理器
 * 负责管理魔方状态、历史记录、撤销重做等功能
 */

import { FACES, EVENTS } from "../utils/constants.js";
import { createSolvedState, deepClone, isSolved } from "../utils/helpers.js";
import { validateCubeState } from "../utils/validators.js";

export class CubeStateManager {
  constructor(eventEmitter) {
    this.eventEmitter = eventEmitter;

    // 当前状态
    this.currentState = createSolvedState();

    // 历史记录
    this.history = [];
    this.historyIndex = -1;
    this.maxHistorySize = 1000;

    // 操作记录
    this.moveHistory = [];
    this.startTime = Date.now();

    // 状态标记
    this.isModified = false;
  }

  /**
   * 获取当前魔方状态
   * @param {string} format - 返回格式 ('object', 'string', 'kociemba', 'array')
   * @returns {*} 魔方状态
   */
  getState(format = "object") {
    switch (format) {
      case "object":
        return deepClone(this.currentState);

      case "string":
        return this._stateToString(this.currentState);

      case "kociemba":
        return this._stateToKociemba(this.currentState);

      case "array":
        return this._stateToArray(this.currentState);

      default:
        return deepClone(this.currentState);
    }
  }

  /**
   * 设置魔方状态
   * @param {*} state - 新状态
   * @param {string} format - 状态格式
   * @returns {boolean} 是否设置成功
   */
  setState(state, format = "object") {
    let newState;

    try {
      switch (format) {
        case "object":
          newState = deepClone(state);
          break;

        case "string":
          newState = this._stringToState(state);
          break;

        case "kociemba":
          newState = this._kociembaToState(state);
          break;

        case "array":
          newState = this._arrayToState(state);
          break;

        default:
          newState = deepClone(state);
      }

      // 验证状态
      const validation = validateCubeState(newState);
      if (!validation.isValid) {
        this._emitError("setState", validation.error);
        return false;
      }

      // 保存当前状态到历史
      this._saveToHistory();

      // 更新当前状态
      this.currentState = newState;
      this.isModified = true;

      // 触发事件
      this.eventEmitter.emit(EVENTS.STATE_CHANGE, {
        state: this.getState(),
        isSolved: this.isSolved(),
        timestamp: Date.now(),
      });

      return true;
    } catch (error) {
      this._emitError("setState", `状态格式错误: ${error.message}`);
      return false;
    }
  }

  /**
   * 应用转动到当前状态
   * @param {string} move - 转动记号
   * @param {Object} metadata - 转动的元数据
   */
  applyMove(move, metadata = {}) {
    // 保存当前状态到历史
    this._saveToHistory();

    // 应用转动 (这里需要与具体的转动引擎配合)
    const oldState = deepClone(this.currentState);

    // 记录转动
    const moveRecord = {
      move,
      timestamp: Date.now(),
      duration: metadata.duration || 0,
      fromState: oldState,
      toState: null, // 将在转动完成后填充
    };

    this.moveHistory.push(moveRecord);
    this.isModified = true;

    // 不在这里触发转动事件，让RubiksCubeEngine统一处理
    // 避免重复事件触发
  }

  /**
   * 完成转动应用 (由转动引擎调用)
   * @param {Object} newState - 转动后的新状态
   */
  completeMoveApplication(newState) {
    this.currentState = deepClone(newState);

    // 更新最后一条转动记录
    if (this.moveHistory.length > 0) {
      this.moveHistory[this.moveHistory.length - 1].toState =
        deepClone(newState);
    }

    // 只在非转动操作时触发状态变化事件（避免与 MOVE 事件重复）
    // 转动完成事件由 RubiksCubeEngine.rotate() 统一处理
  }

  /**
   * 撤销操作
   * @param {number} steps - 撤销步数
   * @returns {boolean} 是否成功
   */
  undo(steps = 1) {
    if (this.historyIndex < steps - 1) {
      return false; // 没有足够的历史记录
    }

    for (let i = 0; i < steps; i++) {
      if (this.historyIndex >= 0) {
        this.currentState = deepClone(this.history[this.historyIndex]);
        this.historyIndex--;
      }
    }

    this.isModified = true;

    // 触发状态变化事件
    this.eventEmitter.emit(EVENTS.STATE_CHANGE, {
      state: this.getState(),
      isSolved: this.isSolved(),
      timestamp: Date.now(),
      action: "undo",
      steps,
    });

    return true;
  }

  /**
   * 重做操作
   * @param {number} steps - 重做步数
   * @returns {boolean} 是否成功
   */
  redo(steps = 1) {
    if (this.historyIndex + steps >= this.history.length) {
      return false; // 没有足够的重做记录
    }

    for (let i = 0; i < steps; i++) {
      this.historyIndex++;
      this.currentState = deepClone(this.history[this.historyIndex]);
    }

    this.isModified = true;

    // 触发状态变化事件
    this.eventEmitter.emit(EVENTS.STATE_CHANGE, {
      state: this.getState(),
      isSolved: this.isSolved(),
      timestamp: Date.now(),
      action: "redo",
      steps,
    });

    return true;
  }

  /**
   * 重置到已还原状态
   */
  reset() {
    this._saveToHistory();
    this.currentState = createSolvedState();
    this.moveHistory = [];
    this.startTime = Date.now();
    this.isModified = false;

    // 触发状态变化事件
    this.eventEmitter.emit(EVENTS.STATE_CHANGE, {
      state: this.getState(),
      isSolved: true,
      timestamp: Date.now(),
      action: "reset",
    });
  }

  /**
   * 检查魔方是否已还原
   * @returns {boolean} 是否已还原
   */
  isSolved() {
    return isSolved(this.currentState);
  }

  /**
   * 获取操作历史
   * @param {string} format - 返回格式 ('array', 'moves', 'detailed')
   * @returns {Array} 历史记录
   */
  getHistory(format = "array") {
    switch (format) {
      case "array":
        return [...this.moveHistory];

      case "moves":
        return this.moveHistory.map((record) => record.move);

      case "detailed":
        return this.moveHistory.map((record) => ({
          move: record.move,
          timestamp: record.timestamp,
          duration: record.duration,
          relativeTime: record.timestamp - this.startTime,
        }));

      default:
        return [...this.moveHistory];
    }
  }

  /**
   * 获取统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    const now = Date.now();
    const totalTime = now - this.startTime;

    return {
      totalMoves: this.moveHistory.length,
      totalTime,
      averageMoveTime:
        this.moveHistory.length > 0 ? totalTime / this.moveHistory.length : 0,
      isSolved: this.isSolved(),
      isModified: this.isModified,
      historySize: this.history.length,
      canUndo: this.historyIndex >= 0,
      canRedo: this.historyIndex < this.history.length - 1,
    };
  }

  /**
   * 清除历史记录
   */
  clearHistory() {
    this.history = [];
    this.historyIndex = -1;
    this.moveHistory = [];
    this.startTime = Date.now();
  }

  /**
   * 导出状态和历史
   * @returns {Object} 导出的数据
   */
  export() {
    return {
      currentState: this.getState(),
      moveHistory: this.getHistory("detailed"),
      stats: this.getStats(),
      exportTime: Date.now(),
    };
  }

  /**
   * 导入状态和历史
   * @param {Object} data - 导入的数据
   * @returns {boolean} 是否成功
   */
  import(data) {
    try {
      if (data.currentState) {
        const success = this.setState(data.currentState);
        if (!success) {
          return false;
        }
      }

      if (data.moveHistory && Array.isArray(data.moveHistory)) {
        this.moveHistory = [...data.moveHistory];
      }

      return true;
    } catch (error) {
      this._emitError("import", `导入失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 保存当前状态到历史记录
   * @private
   */
  _saveToHistory() {
    // 如果当前位置不在历史末尾，删除后续历史
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    // 添加当前状态
    this.history.push(deepClone(this.currentState));
    this.historyIndex++;

    // 限制历史记录大小
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.historyIndex--;
    }
  }

  /**
   * 状态转换为字符串
   * @private
   */
  _stateToString(state) {
    return Object.values(FACES)
      .map((face) => state[face].join(""))
      .join("");
  }

  /**
   * 字符串转换为状态
   * @private
   */
  _stringToState(str) {
    const state = {};
    const faces = Object.values(FACES);

    for (let i = 0; i < faces.length; i++) {
      const faceStr = str.slice(i * 9, (i + 1) * 9);
      state[faces[i]] = faceStr.split("");
    }

    return state;
  }

  /**
   * 状态转换为Kociemba格式
   * @private
   */
  _stateToKociemba(state) {
    // Kociemba格式: UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB
    const faceOrder = ["U", "R", "F", "D", "L", "B"];
    return faceOrder.map((face) => state[face].join("")).join("");
  }

  /**
   * Kociemba格式转换为状态
   * @private
   */
  _kociembaToState(kociembaStr) {
    const state = {};
    const faceOrder = ["U", "R", "F", "D", "L", "B"];

    for (let i = 0; i < faceOrder.length; i++) {
      const face = faceOrder[i];
      const faceStr = kociembaStr.slice(i * 9, (i + 1) * 9);
      state[face] = faceStr.split("");
    }

    return state;
  }

  /**
   * 状态转换为数组
   * @private
   */
  _stateToArray(state) {
    return Object.values(FACES).map((face) => [...state[face]]);
  }

  /**
   * 数组转换为状态
   * @private
   */
  _arrayToState(array) {
    const state = {};
    const faces = Object.values(FACES);

    for (let i = 0; i < faces.length; i++) {
      state[faces[i]] = [...array[i]];
    }

    return state;
  }

  /**
   * 发送错误事件
   * @private
   */
  _emitError(operation, message) {
    this.eventEmitter.emit(EVENTS.ERROR, {
      operation,
      message,
      timestamp: Date.now(),
    });
  }
}
