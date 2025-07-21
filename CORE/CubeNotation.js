/**
 * 魔方标准记号法解析器
 * 负责解析和验证WCA标准记号法
 */

import { FACES, MODIFIERS } from "../utils/constants.js";

export class CubeNotation {
  constructor() {
    // 基础面转动映射
    this.basicMoves = Object.values(FACES);

    // 宽转动映射 (如 Rw, Uw 等)
    this.wideMoves = this.basicMoves.map((face) => face + "w");

    // 小写面转动映射 (如 r, u, f 等，等同于宽转动)
    this.lowercaseMoves = ["r", "u", "f", "l", "d", "b"];

    // 中层转动映射
    this.sliceMoves = ["M", "E", "S"];

    // 整体旋转映射
    this.rotationMoves = ["x", "y", "z"];

    // 所有有效的转动
    this.allMoves = [
      ...this.basicMoves,
      ...this.wideMoves,
      ...this.lowercaseMoves,
      ...this.sliceMoves,
      ...this.rotationMoves,
    ];
  }

  /**
   * 解析单个转动记号
   * @param {string} notation - 转动记号
   * @returns {Object} 解析结果
   */
  parseMove(notation) {
    // 基础验证
    if (!notation || typeof notation !== "string") {
      return {
        isValid: false,
        error: "转动记号不能为空",
        move: null,
      };
    }

    const trimmed = notation.trim();
    const result = {
      isValid: true,
      error: null,
      move: {
        notation: trimmed,
        face: null,
        modifier: "",
        isWide: false,
        isSlice: false,
        isRotation: false,
        direction: 1, // 1: 顺时针, -1: 逆时针
        angle: 90, // 转动角度
      },
    };

    // 解析面
    let faceMatch = trimmed.match(/^([RLUDFB])(w?)/);
    if (faceMatch) {
      result.move.face = faceMatch[1];
      result.move.isWide = faceMatch[2] === "w";
    } else {
      // 检查小写面转动 (等同于宽转动)
      faceMatch = trimmed.match(/^([rludfb])/);
      if (faceMatch) {
        result.move.face = faceMatch[1].toUpperCase();
        result.move.isWide = true;
      } else {
        // 检查中层转动
        faceMatch = trimmed.match(/^([MES])/);
        if (faceMatch) {
          result.move.face = faceMatch[1];
          result.move.isSlice = true;
        } else {
          // 检查是否是整体旋转
          faceMatch = trimmed.match(/^([xyz])/);
          if (faceMatch) {
            result.move.face = faceMatch[1];
            result.move.isRotation = true;
          } else {
            return {
              isValid: false,
              error: `未知的转动面: ${trimmed}`,
              move: null,
            };
          }
        }
      }
    }

    // 解析修饰符 (支持单引号和prime符号)
    const modifierMatch = trimmed.match(/(['′2]?)$/);
    if (modifierMatch) {
      result.move.modifier = modifierMatch[1];

      switch (result.move.modifier) {
        case "":
          result.move.direction = 1;
          result.move.angle = 90;
          break;
        case "'":
        case "′": // prime符号
          result.move.direction = -1;
          result.move.angle = 90;
          break;
        case "2":
          result.move.direction = 1;
          result.move.angle = 180;
          break;
      }
    }

    return result;
  }

  /**
   * 解析完整算法
   * @param {string} algorithm - 算法字符串
   * @returns {Object} 解析结果
   */
  parseAlgorithm(algorithm) {
    // 基础验证
    if (!algorithm || typeof algorithm !== "string") {
      return {
        isValid: false,
        error: "算法不能为空",
        moves: [],
      };
    }

    const moveStrings = algorithm.trim().split(/\s+/);
    const moves = [];

    for (const moveString of moveStrings) {
      const parseResult = this.parseMove(moveString);
      if (!parseResult.isValid) {
        return {
          isValid: false,
          error: parseResult.error,
          moves: [],
        };
      }
      moves.push(parseResult.move);
    }

    return {
      isValid: true,
      error: null,
      moves,
      length: moves.length,
      algorithm: algorithm.trim(),
    };
  }

  /**
   * 获取转动的逆操作
   * @param {string} notation - 原转动记号
   * @returns {string} 逆转动记号
   */
  getInverse(notation) {
    const parseResult = this.parseMove(notation);
    if (!parseResult.isValid) {
      return notation;
    }

    const move = parseResult.move;
    let inverseFace = move.face;

    // 处理宽转动
    if (move.isWide) {
      inverseFace += "w";
    }

    // 处理修饰符
    switch (move.modifier) {
      case "":
        return inverseFace + "'";
      case "'":
        return inverseFace;
      case "2":
        return inverseFace + "2";
      default:
        return notation;
    }
  }

  /**
   * 获取算法的逆序列
   * @param {string} algorithm - 原算法
   * @returns {string} 逆算法
   */
  getInverseAlgorithm(algorithm) {
    const parseResult = this.parseAlgorithm(algorithm);
    if (!parseResult.isValid) {
      return algorithm;
    }

    const inverseMoves = parseResult.moves
      .reverse()
      .map((move) => this.getInverse(move.notation));

    return inverseMoves.join(" ");
  }

  /**
   * 简化算法 (去除冗余转动)
   * @param {string} algorithm - 原算法
   * @returns {string} 简化后的算法
   */
  simplifyAlgorithm(algorithm) {
    const parseResult = this.parseAlgorithm(algorithm);
    if (!parseResult.isValid) {
      return algorithm;
    }

    const moves = parseResult.moves;
    const simplified = [];

    for (let i = 0; i < moves.length; i++) {
      const currentMove = moves[i];
      let accumulated = this._getAngleFromMove(currentMove);
      let j = i + 1;

      // 查找连续相同面的转动
      while (
        j < moves.length &&
        moves[j].face === currentMove.face &&
        moves[j].isWide === currentMove.isWide &&
        moves[j].isRotation === currentMove.isRotation
      ) {
        accumulated += this._getAngleFromMove(moves[j]);
        j++;
      }

      // 标准化角度到 [0, 360) 范围
      accumulated = ((accumulated % 360) + 360) % 360;

      // 生成简化后的转动
      if (accumulated !== 0) {
        const simplifiedMove = this._createMoveFromAngle(
          currentMove.face,
          accumulated,
          currentMove.isWide
        );
        if (simplifiedMove) {
          simplified.push(simplifiedMove);
        }
      }

      i = j - 1; // 跳过已处理的转动
    }

    return simplified.join(" ");
  }

  /**
   * 验证记号法是否符合标准
   * @param {string} notation - 记号法字符串
   * @returns {Object} 验证结果
   */
  validate(notation) {
    if (notation.includes(" ")) {
      return this.parseAlgorithm(notation);
    } else {
      return this.parseMove(notation);
    }
  }

  /**
   * 格式化算法 (标准化空格和大小写)
   * @param {string} algorithm - 原算法
   * @returns {string} 格式化后的算法
   */
  format(algorithm) {
    const parseResult = this.parseAlgorithm(algorithm);
    if (!parseResult.isValid) {
      return algorithm;
    }

    return parseResult.moves.map((move) => move.notation).join(" ");
  }

  /**
   * 从转动对象获取角度
   * @private
   */
  _getAngleFromMove(move) {
    let angle = move.angle;
    if (move.direction === -1) {
      angle = -angle;
    }
    return angle;
  }

  /**
   * 从角度创建转动记号
   * @private
   */
  _createMoveFromAngle(face, angle, isWide = false) {
    // 标准化角度
    angle = ((angle % 360) + 360) % 360;

    if (angle === 0) {
      return null;
    }

    let notation = face;
    if (isWide) {
      notation += "w";
    }

    if (angle === 90) {
      return notation;
    } else if (angle === 180) {
      return notation + "2";
    } else if (angle === 270) {
      return notation + "'";
    }

    // 非标准角度，返回原始形式
    return notation;
  }

  /**
   * 获取转动的描述信息
   * @param {string} notation - 转动记号
   * @returns {Object} 描述信息
   */
  getDescription(notation) {
    const parseResult = this.parseMove(notation);
    if (!parseResult.isValid) {
      return {
        isValid: false,
        description: "无效转动",
      };
    }

    const move = parseResult.move;
    const faceNames = {
      R: "右面",
      L: "左面",
      U: "上面",
      D: "下面",
      F: "前面",
      B: "后面",
      x: "x轴旋转",
      y: "y轴旋转",
      z: "z轴旋转",
    };

    let description = faceNames[move.face] || move.face;

    if (move.isWide) {
      description += "(双层)";
    }

    switch (move.modifier) {
      case "":
        description += "顺时针90度";
        break;
      case "'":
        description += "逆时针90度";
        break;
      case "2":
        description += "180度";
        break;
    }

    return {
      isValid: true,
      description,
      face: move.face,
      angle: move.angle,
      direction: move.direction,
      isWide: move.isWide,
      isRotation: move.isRotation,
    };
  }
}
