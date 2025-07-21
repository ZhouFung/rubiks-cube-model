/**
 * 3D魔方渲染器
 * 将现有的RubiksCube3D适配到新的引擎架构中
 */

import { EVENTS } from "../utils/constants.js";

export class CubeRenderer3D {
  constructor(container, config, eventEmitter) {
    this.container =
      typeof container === "string"
        ? document.getElementById(container)
        : container;
    this.config = config;
    this.eventEmitter = eventEmitter;

    // 初始化动画相关属性
    this.isAnimating = false;
    this.animationSpeed = config.animationSpeed || 300;

    if (!this.container) {
      throw new Error("容器元素未找到");
    }

    // 检查Three.js是否加载
    if (typeof THREE === "undefined") {
      throw new Error("Three.js未加载");
    }

    // 检查OrbitControls是否加载
    if (typeof THREE.OrbitControls === "undefined") {
      throw new Error("OrbitControls未加载");
    }

    // 初始化3D场景
    this.initScene();
    this.createPieces();
    this.initializeSolvedState();

    // 启动渲染循环
    this.animate();

    console.log("3D魔方渲染器初始化完成");
  }

  /**
   * 初始化3D场景
   */
  initScene() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);

    // 相机
    this.camera = new THREE.PerspectiveCamera(
      this.config.cameraFov || 50,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(4, 5, 7);

    // 渲染器
    this.renderer = new THREE.WebGLRenderer({
      antialias: this.config.enableAntialiasing !== false,
    });
    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    );

    // 清空容器并添加渲染器
    this.container.innerHTML = "";
    this.container.appendChild(this.renderer.domElement);

    // 灯光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(10, 20, 15);
    this.scene.add(directionalLight);

    // 控件 (用于用户操作相机)
    this.controls = new THREE.OrbitControls(
      this.camera,
      this.renderer.domElement
    );
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
    this.controls.screenSpacePanning = false;

    // 整个魔方的总枢轴
    this.cubePivot = new THREE.Group();
    this.scene.add(this.cubePivot);

    // 动画枢轴 (用于临时执行转动动画)
    this.animationPivot = new THREE.Group();
    this.scene.add(this.animationPivot);

    // 处理窗口大小变化
    window.addEventListener("resize", () => this.onWindowResize(), false);
  }

  /**
   * 创建魔方小块
   */
  createPieces() {
    const pieceSize = this.config.pieceSize || 1;
    const gap = this.config.pieceGap || 0.05;
    const geometry = new THREE.BoxGeometry(pieceSize, pieceSize, pieceSize);

    this.pieces = [];
    this.materialSet = this.createMaterials(); // 材质集合

    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          if (x === 0 && y === 0 && z === 0) continue; // 跳过中心块

          // 为每个小块创建材质数组
          const pieceMaterials = this.createPieceMaterials(x, y, z);
          const piece = new THREE.Mesh(geometry, pieceMaterials);

          piece.position.set(
            x * (pieceSize + gap),
            y * (pieceSize + gap),
            z * (pieceSize + gap)
          );

          // 添加用户数据以识别小块
          piece.userData.originalPosition = new THREE.Vector3(x, y, z);
          piece.userData.currentPosition = new THREE.Vector3(x, y, z);

          // 确定颜色
          const colors = [];
          if (y === 1) colors.push("U"); // 上面
          if (y === -1) colors.push("D"); // 下面
          if (x === 1) colors.push("R"); // 右面
          if (x === -1) colors.push("L"); // 左面
          if (z === 1) colors.push("F"); // 前面
          if (z === -1) colors.push("B"); // 后面
          piece.userData.colors = colors;

          // 确定小块类型
          const zeroCount = [x, y, z].filter((v) => Math.abs(v) < 0.5).length;
          if (zeroCount === 2) {
            piece.userData.type = "center";
          } else if (zeroCount === 1) {
            piece.userData.type = "edge";
          } else {
            piece.userData.type = "corner";
          }

          this.pieces.push(piece);
          this.cubePivot.add(piece);
        }
      }
    }
  }

  /**
   * 为单个小块创建材质
   */
  createPieceMaterials(x, y, z) {
    const materials = [];

    // 材质顺序: +X(右), -X(左), +Y(上), -Y(下), +Z(前), -Z(后)

    // 右面 (+X)
    if (x === 1) {
      materials.push(this.materialSet.R);
    } else {
      materials.push(this.materialSet.black);
    }

    // 左面 (-X)
    if (x === -1) {
      materials.push(this.materialSet.L);
    } else {
      materials.push(this.materialSet.black);
    }

    // 上面 (+Y)
    if (y === 1) {
      materials.push(this.materialSet.U);
    } else {
      materials.push(this.materialSet.black);
    }

    // 下面 (-Y)
    if (y === -1) {
      materials.push(this.materialSet.D);
    } else {
      materials.push(this.materialSet.black);
    }

    // 前面 (+Z)
    if (z === 1) {
      materials.push(this.materialSet.F);
    } else {
      materials.push(this.materialSet.black);
    }

    // 后面 (-Z)
    if (z === -1) {
      materials.push(this.materialSet.B);
    } else {
      materials.push(this.materialSet.black);
    }

    return materials;
  }

  /**
   * 创建材质
   */
  createMaterials() {
    const colors = this.config.colors || {
      U: 0xffffff, // 白色
      D: 0xffff00, // 黄色
      R: 0xff0000, // 红色
      L: 0xff8000, // 橙色
      F: 0x0000ff, // 蓝色
      B: 0x00ff00, // 绿色
    };

    return {
      U: new THREE.MeshLambertMaterial({ color: colors.U }),
      D: new THREE.MeshLambertMaterial({ color: colors.D }),
      R: new THREE.MeshLambertMaterial({ color: colors.R }),
      L: new THREE.MeshLambertMaterial({ color: colors.L }),
      F: new THREE.MeshLambertMaterial({ color: colors.F }),
      B: new THREE.MeshLambertMaterial({ color: colors.B }),
      black: new THREE.MeshLambertMaterial({ color: 0x222222 }), // 内部面
    };
  }

  /**
   * 初始化到已还原状态（同步）
   */
  initializeSolvedState() {
    // 设置初始状态，所有块都在正确位置
    this.isAnimating = false;
    console.log("魔方初始化为还原状态");
  }

  /**
   * 重置到已还原状态
   */
  async resetToSolvedState() {
    this.pieces.forEach((piece) => {
      piece.position.copy(piece.userData.originalPosition);
      piece.rotation.set(0, 0, 0);
      piece.userData.currentPosition.copy(piece.userData.originalPosition);
    });

    this.isAnimating = false;

    this.eventEmitter.emit(EVENTS.ANIMATION_COMPLETE, {
      action: "reset",
      timestamp: Date.now(),
    });
  }

  /**
   * 执行转动动画
   */
  async animateMove(move, options = {}) {
    if (typeof window !== "undefined" && window.logger) {
      window.logger.info("CubeRenderer3D.animateMove 开始执行", {
        move: move.notation,
        options,
        isAnimating: this.isAnimating,
      });
    }

    if (this.isAnimating) {
      const error = new Error("动画正在进行中");
      if (typeof window !== "undefined" && window.logger) {
        window.logger.error("animateMove失败：动画正在进行中", {
          move: move.notation,
        });
      }
      throw error;
    }

    this.isAnimating = true;

    if (typeof window !== "undefined" && window.logger) {
      window.logger.info("发射动画开始事件", { move: move.notation });
    }

    this.eventEmitter.emit(EVENTS.ANIMATION_START, {
      move: move.notation,
      timestamp: Date.now(),
    });

    try {
      const face = move.notation.charAt(0).toUpperCase();
      const isPrime = move.notation.includes("'");
      const isDouble = move.notation.includes("2");

      if (typeof window !== "undefined" && window.logger) {
        window.logger.info("解析转动参数", {
          face,
          isPrime,
          isDouble,
          notation: move.notation,
        });
      }

      const angle = (Math.PI / 2) * (isPrime ? -1 : 1) * (isDouble ? 2 : 1);
      const axis = new THREE.Vector3(0, 0, 0);

      // 确定旋转轴
      switch (face) {
        case "R":
          axis.set(1, 0, 0);
          break;
        case "L":
          axis.set(-1, 0, 0);
          break;
        case "U":
          axis.set(0, 1, 0);
          break;
        case "D":
          axis.set(0, -1, 0);
          break;
        case "F":
          axis.set(0, 0, 1);
          break;
        case "B":
          axis.set(0, 0, -1);
          break;
        // 中层转动
        case "M": // 中层垂直切片 (与L方向相同)
          axis.set(-1, 0, 0);
          break;
        case "E": // 中层水平切片 (与D方向相同)
          axis.set(0, -1, 0);
          break;
        case "S": // 中层前后切片 (与F方向相同)
          axis.set(0, 0, 1);
          break;
        default:
          const error = new Error(`不支持的转动: ${move.notation}`);
          if (typeof window !== "undefined" && window.logger) {
            window.logger.error("不支持的转动", {
              notation: move.notation,
              face,
            });
          }
          throw error;
      }

      if (typeof window !== "undefined" && window.logger) {
        window.logger.info("确定旋转轴", {
          face,
          axis: { x: axis.x, y: axis.y, z: axis.z },
          angle,
        });
      }

      // 获取需要转动的块
      const piecesToMove = this._getPiecesForMove(face, axis);

      if (typeof window !== "undefined" && window.logger) {
        window.logger.info("获取需要转动的块", {
          face,
          piecesToMoveCount: piecesToMove.length,
        });
      }

      // 将需要转动的块附加到动画枢轴上
      this.animationPivot.rotation.set(0, 0, 0);
      piecesToMove.forEach((piece) => this.animationPivot.attach(piece));

      if (typeof window !== "undefined" && window.logger) {
        window.logger.info("开始执行动画", {
          duration: options.speed || this.config.animationSpeed || 300,
          angle,
        });
      }

      // 执行动画
      const duration = options.speed || this.config.animationSpeed || 300;
      await this._animatePivot(axis, angle, duration);

      if (typeof window !== "undefined" && window.logger) {
        window.logger.info("动画执行完成，重新附加块到魔方枢轴");
      }

      // 将这些块从动画枢轴上分离，并重新附加到魔方总枢轴上
      piecesToMove.forEach((piece) => this.cubePivot.attach(piece));

      if (typeof window !== "undefined" && window.logger) {
        window.logger.success("animateMove执行成功", {
          move: move.notation,
        });
      }

      this.eventEmitter.emit(EVENTS.ANIMATION_COMPLETE, {
        move: move.notation,
        timestamp: Date.now(),
      });
    } catch (error) {
      if (typeof window !== "undefined" && window.logger) {
        window.logger.error("animateMove执行失败", {
          move: move.notation,
          error: error.message,
          errorStack: error.stack,
        });
      }

      this.eventEmitter.emit(EVENTS.ERROR, {
        operation: "animation",
        message: error.message,
        timestamp: Date.now(),
      });
      throw error;
    } finally {
      this.isAnimating = false;

      if (typeof window !== "undefined" && window.logger) {
        window.logger.info("animateMove结束，重置动画状态", {
          move: move.notation,
          isAnimating: this.isAnimating,
        });
      }
    }
  }

  /**
   * 获取需要转动的块
   */
  _getPiecesForMove(face, axis) {
    const threshold = 0.5;

    // 对于中层转动，需要特殊处理
    if (face === "M" || face === "E" || face === "S") {
      return this.pieces.filter((p) => {
        const worldPos = new THREE.Vector3();
        p.getWorldPosition(worldPos);
        const posRelativeToPivot = worldPos
          .clone()
          .sub(this.cubePivot.position);

        if (face === "M") {
          // M层：x坐标接近0的块
          return Math.abs(posRelativeToPivot.x) < threshold;
        } else if (face === "E") {
          // E层：y坐标接近0的块
          return Math.abs(posRelativeToPivot.y) < threshold;
        } else if (face === "S") {
          // S层：z坐标接近0的块
          return Math.abs(posRelativeToPivot.z) < threshold;
        }
        return false;
      });
    }

    // 对于普通面转动，使用原有逻辑
    return this.pieces.filter((p) => {
      const worldPos = new THREE.Vector3();
      p.getWorldPosition(worldPos);
      // 检查块相对于魔方中心的位置与旋转轴的点积
      const posRelativeToPivot = worldPos.clone().sub(this.cubePivot.position);
      return posRelativeToPivot.dot(axis) > threshold;
    });
  }

  /**
   * 执行枢轴动画
   */
  _animatePivot(axis, angle, duration) {
    if (typeof window !== "undefined" && window.logger) {
      window.logger.info("CubeRenderer3D._animatePivot 开始执行", {
        axis: { x: axis.x, y: axis.y, z: axis.z },
        angle,
        duration,
        tweenAvailable: typeof TWEEN !== "undefined",
      });
    }

    return new Promise((resolve) => {
      const start = { rotation: 0 };
      const end = { rotation: angle };

      // 检查 TWEEN 是否可用
      if (typeof TWEEN === "undefined") {
        if (typeof window !== "undefined" && window.logger) {
          window.logger.warn("TWEEN不可用，使用简单延迟", { duration });
        }

        // 如果 TWEEN 不可用，使用简单的延迟
        setTimeout(() => {
          if (axis.x) this.animationPivot.rotation.x = angle;
          if (axis.y) this.animationPivot.rotation.y = angle;
          if (axis.z) this.animationPivot.rotation.z = angle;

          if (typeof window !== "undefined" && window.logger) {
            window.logger.info("简单延迟动画完成", {
              finalRotation: {
                x: this.animationPivot.rotation.x,
                y: this.animationPivot.rotation.y,
                z: this.animationPivot.rotation.z,
              },
            });
          }

          resolve();
        }, duration);
        return;
      }

      if (typeof window !== "undefined" && window.logger) {
        window.logger.info("使用TWEEN执行动画");
      }

      new TWEEN.Tween(start)
        .to(end, duration)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate(() => {
          if (axis.x) this.animationPivot.rotation.x = start.rotation;
          if (axis.y) this.animationPivot.rotation.y = start.rotation;
          if (axis.z) this.animationPivot.rotation.z = start.rotation;
        })
        .onComplete(() => {
          // 手动设置最终状态以避免精度误差
          if (axis.x) this.animationPivot.rotation.x = angle;
          if (axis.y) this.animationPivot.rotation.y = angle;
          if (axis.z) this.animationPivot.rotation.z = angle;

          if (typeof window !== "undefined" && window.logger) {
            window.logger.success("TWEEN动画完成", {
              finalRotation: {
                x: this.animationPivot.rotation.x,
                y: this.animationPivot.rotation.y,
                z: this.animationPivot.rotation.z,
              },
            });
          }

          resolve();
        })
        .start();
    });
  }

  /**
   * 设置相机视角
   * @param {string} view - 视角名称
   */
  setCameraView(view = "default") {
    if (!this.camera || !this.controls) return;

    const views = {
      default: { position: [4, 5, 7], target: [0, 0, 0] },
      top: { position: [0, 8, 0], target: [0, 0, 0] },
      front: { position: [0, 0, 8], target: [0, 0, 0] },
      side: { position: [8, 0, 0], target: [0, 0, 0] },
      corner: { position: [5, 5, 5], target: [0, 0, 0] },
    };

    const targetView = views[view] || views.default;

    // 平滑过渡到新位置
    this.animateCameraTo(targetView.position, targetView.target);
  }

  /**
   * 动画移动相机到指定位置
   * @param {Array} position - 目标位置 [x, y, z]
   * @param {Array} target - 目标焦点 [x, y, z]
   */
  animateCameraTo(position, target) {
    if (typeof TWEEN === "undefined") {
      // 如果没有TWEEN，直接设置
      this.camera.position.set(...position);
      this.controls.target.set(...target);
      this.controls.update();
      return;
    }

    // 相机位置动画
    new TWEEN.Tween(this.camera.position)
      .to({ x: position[0], y: position[1], z: position[2] }, 800)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .start();

    // 相机目标动画
    new TWEEN.Tween(this.controls.target)
      .to({ x: target[0], y: target[1], z: target[2] }, 800)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate(() => {
        this.controls.update();
      })
      .start();
  }

  /**
   * 将魔方适配到视野中心
   */
  fitCubeToView() {
    if (!this.cubePivot || !this.camera) return;

    // 计算魔方边界框
    const box = new THREE.Box3().setFromObject(this.cubePivot);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // 计算适合的相机距离
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    const distance = Math.abs(maxDim / Math.sin(fov / 2)) * 1.2; // 1.2倍的边距

    // 设置相机位置（保持当前角度但调整距离）
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    direction.multiplyScalar(-distance);

    const newPosition = center.clone().add(direction);

    this.animateCameraTo(
      [newPosition.x, newPosition.y, newPosition.z],
      [center.x, center.y, center.z]
    );
  }

  /**
   * 暂停当前动画
   */
  pauseAnimation() {
    this.isAnimating = false;
    // 停止所有TWEEN动画
    if (typeof TWEEN !== "undefined") {
      TWEEN.removeAll();
    }
  }

  /**
   * 设置动画速度
   * @param {number} speed - 动画速度（毫秒）
   */
  setAnimationSpeed(speed) {
    this.animationSpeed = speed;
  }

  /**
   * 设置主题
   */
  setTheme(theme) {
    this.config.theme = theme;
    // TODO: 更新材质颜色
  }

  /**
   * 渲染循环
   */
  animate() {
    requestAnimationFrame(() => this.animate());

    // 更新 TWEEN 动画
    if (typeof TWEEN !== "undefined") {
      TWEEN.update();
    }

    if (this.controls) {
      this.controls.update();
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * 执行打乱
   */
  async scramble(algorithm, options = {}) {
    if (this.isAnimating) {
      throw new Error("动画正在进行中，无法打乱");
    }

    // 使用快速模式进行打乱
    const fastOptions = { ...options, speed: 50 };

    // 解析并执行算法
    const moves = algorithm
      .trim()
      .split(" ")
      .filter((move) => move.length > 0);

    for (const moveNotation of moves) {
      const move = { notation: moveNotation };
      await this.animateMove(move, fastOptions);
    }

    console.log("魔方打乱完成:", algorithm);
  }

  /**
   * 重置魔方到复位状态
   */
  reset() {
    if (this.isAnimating) {
      console.warn("动画进行中，无法重置");
      return;
    }

    // 重置所有块的位置和旋转
    this.cubePivot.rotation.set(0, 0, 0);
    this.animationPivot.rotation.set(0, 0, 0);

    this.pieces.forEach((piece) => {
      // 重新附加到主枢轴（如果在动画枢轴上的话）
      if (piece.parent === this.animationPivot) {
        this.cubePivot.attach(piece);
      }

      // 重置块的旋转
      piece.rotation.set(0, 0, 0);

      // 重置块的位置到原始位置
      const originalPos = piece.userData.originalPosition;
      if (originalPos) {
        piece.position.copy(originalPos).multiplyScalar(1.05); // 1.05 is pieceSize + gap
      }
    });

    console.log("魔方已重置到复位状态");
  }

  /**
   * 窗口大小变化处理
   */
  onWindowResize() {
    if (!this.container || !this.camera || !this.renderer) return;

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * 销毁渲染器
   */
  destroy() {
    if (this.renderer) {
      this.renderer.dispose();
    }

    if (this.container && this.renderer) {
      this.container.removeChild(this.renderer.domElement);
    }

    window.removeEventListener("resize", this.onWindowResize);
  }

  /**
   * 强制停止所有动画并重置状态
   */
  forceStop() {
    this.isAnimating = false;

    // 重置动画枢轴
    this.animationPivot.rotation.set(0, 0, 0);

    // 将所有可能在动画枢轴上的块重新附加到主枢轴
    const piecesInAnimation = [];
    this.animationPivot.traverse((child) => {
      if (child.userData && child.userData.type) {
        piecesInAnimation.push(child);
      }
    });

    piecesInAnimation.forEach((piece) => {
      this.cubePivot.attach(piece);
    });

    console.log("渲染器状态已强制重置");
  }
}
