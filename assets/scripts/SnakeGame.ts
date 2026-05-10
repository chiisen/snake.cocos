import { _decorator, Component, Node, UITransform, Graphics, Label, Color, Vec3, input, Input, KeyCode, EventKeyboard, tween, Tween, Button, Sprite } from 'cc';
const { ccclass, property } = _decorator;

enum GameState {
    IDLE = 'IDLE',
    PLAYING = 'PLAYING',
    PAUSED = 'PAUSED',
    GAME_OVER = 'GAME_OVER'
}

@ccclass('SnakeGame')
export class SnakeGame extends Component {
    
    @property(Node)
    gameArea: Node = null!;
    
    @property(Label)
    scoreLabel: Label = null!;
    
    @property(Label)
    titleLabel: Label = null!;
    
    @property(Label)
    hintLabel: Label = null!;
    
    @property(Label)
    highScoreLabel: Label = null!;
    
    @property(Node)
    startButton: Node = null!;
    
    private gridWidth: number = 20;
    private gridHeight: number = 15;
    private cellSize: number = 30;
    
    private snake: Vec3[] = [];
    private direction: Vec3 = new Vec3(1, 0, 0);
    private nextDirection: Vec3 = new Vec3(1, 0, 0);
    private food: Vec3 = new Vec3();
    private score: number = 0;
    private highScore: number = 0;
    private gameState: GameState = GameState.IDLE;
    private baseMoveInterval: number = 0.2;
    private moveInterval: number = 0.2;
    private timeAccumulator: number = 0;
    private minMoveInterval: number = 0.05;
    private speedIncreaseThreshold: number = 50;
    
    private snakeNodes: Node[] = [];
    private foodNode: Node = null!;
    private borderNode: Node = null!;
    private keyHandler: any = null;
    private foodFlashTween: Tween<any> | null = null;
    private scoreAnimTween: Tween<any> | null = null;
    
    start() {
        this.loadHighScore();
        this.initGame();
        this.setupInput();
        this.setupButton();
        this.updateUI();
        this.showStartScreen();
    }
    
    loadHighScore() {
        if (typeof localStorage !== 'undefined') {
            const saved = localStorage.getItem('snake_high_score');
            this.highScore = saved ? parseInt(saved) : 0;
        }
    }
    
    saveHighScore() {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('snake_high_score', this.highScore.toString());
        }
    }
    
initGame() {
        const width = this.gridWidth * this.cellSize;
        const height = this.gridHeight * this.cellSize;
        
        if (this.gameArea) {
            const transform = this.gameArea.getComponent(UITransform);
            if (transform) {
                transform.setContentSize(width, height);
            }
            
            // 🔴 禁用 Sprite（沒有 spriteFrame，會遮住 Graphics）
            const sprite = this.gameArea.getComponent(Sprite);
            if (sprite) {
                sprite.enabled = false;  // 或 sprite.node.active = false;
            }
        }
        
        // 創建邊框節點（最底層）
        this.borderNode = new Node('Border');
        this.borderNode.parent = this.node;
        this.borderNode.layer = 1073741824;  // 🔴 DEFAULT 層（確保Camera可見）
        this.borderNode.setPosition(0, 0, -10);  // z-index = -10（最底層）
        
        const borderTransform = this.borderNode.addComponent(UITransform);
        borderTransform.setContentSize(width, height);
        
        const borderGraphics = this.borderNode.addComponent(Graphics);
        const halfW = width / 2;
        const halfH = height / 2;
        
        // 清除舊繪製
        borderGraphics.clear();
        
        // 背景 (深灰)
        borderGraphics.fillColor = new Color(35, 35, 35, 255);
        borderGraphics.rect(-halfW, -halfH, width, height);
        borderGraphics.fill();
        
        // 邊框 (白色，10像素寬)
        borderGraphics.strokeColor = new Color(255, 255, 255, 255);  // 🔴 白色
        borderGraphics.lineWidth = 10;
        borderGraphics.rect(-halfW, -halfH, width, height);  // 🔴 從外圈繪製
        borderGraphics.stroke();
        
        this.createFoodNode();
    }
    
    setupInput() {
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        
        if (typeof window !== 'undefined') {
            this.keyHandler = (e: KeyboardEvent) => {
                e.preventDefault();
                this.handleKey(e.keyCode);
            };
            window.addEventListener('keydown', this.keyHandler);
        }
    }
    
    setupButton() {
        if (this.startButton) {
            const button = this.startButton.getComponent(Button);
            if (button) {
                this.startButton.on(Node.EventType.TOUCH_END, this.onStartButtonClick, this);
            }
        }
    }
    
    onStartButtonClick() {
        if (this.gameState === GameState.IDLE || this.gameState === GameState.GAME_OVER) {
            this.startGame();
        }
    }
    
    private onKeyDown(event: EventKeyboard) {
        this.handleKey(event.keyCode);
    }
    
    handleKey(code: number) {
        if (this.gameState === GameState.GAME_OVER || this.gameState === GameState.IDLE) {
            if (code === 32 || code === KeyCode.SPACE) {
                this.startGame();
            }
            return;
        }
        
        if (this.gameState === GameState.PLAYING) {
            switch (code) {
                case 38:
                case KeyCode.ARROW_UP:
                    if (this.direction.y !== -1) {
                        this.nextDirection = new Vec3(0, 1, 0);
                    }
                    break;
                case 40:
                case KeyCode.ARROW_DOWN:
                    if (this.direction.y !== 1) {
                        this.nextDirection = new Vec3(0, -1, 0);
                    }
                    break;
                case 37:
                case KeyCode.ARROW_LEFT:
                    if (this.direction.x !== 1) {
                        this.nextDirection = new Vec3(-1, 0, 0);
                    }
                    break;
                case 39:
                case KeyCode.ARROW_RIGHT:
                    if (this.direction.x !== -1) {
                        this.nextDirection = new Vec3(1, 0, 0);
                    }
                    break;
                case 80:
                case KeyCode.P:
                    this.pauseGame();
                    break;
            }
        } else if (this.gameState === GameState.PAUSED) {
            if (code === 80 || code === KeyCode.P) {
                this.resumeGame();
            }
        }
    }
    
    showStartScreen() {
        this.gameState = GameState.IDLE;
        
        if (this.titleLabel) {
            this.titleLabel.string = '🐍 Snake Game';
            this.titleLabel.node.active = true;
        }
        
        if (this.hintLabel) {
            hintLabel.string = 'Press SPACE or Click Button to Start\nUse Arrow Keys to Move';
            hintLabel.node.active = true;
        }
        
        if (this.startButton) {
            this.startButton.active = true;
            const btnLabel = this.startButton.getComponentInChildren(Label);
            if (btnLabel) {
                btnLabel.string = 'Start Game';
            }
        }
        
        this.updateHighScoreDisplay();
    }
    
    startGame() {
        this.snake = [
            new Vec3(5, 5, 0),
            new Vec3(4, 5, 0),
            new Vec3(3, 5, 0)
        ];
        
        this.direction = new Vec3(1, 0, 0);
        this.nextDirection = new Vec3(1, 0, 0);
        this.score = 0;
        this.moveInterval = this.baseMoveInterval;
        this.timeAccumulator = 0;
        this.gameState = GameState.PLAYING;
        
        this.hideStartScreen();
        this.updateUI();
        this.createSnakeNodes();
        this.spawnFood();
        this.startFoodFlash();
    }
    
    hideStartScreen() {
        if (this.titleLabel) {
            this.titleLabel.node.active = false;
        }
        
        if (this.hintLabel) {
            this.hintLabel.node.active = false;
        }
        
        if (this.startButton) {
            this.startButton.active = false;
        }
    }
    
    pauseGame() {
        if (this.gameState === GameState.PLAYING) {
            this.gameState = GameState.PAUSED;
            if (this.hintLabel) {
                this.hintLabel.string = 'PAUSED\nPress P to Resume';
                this.hintLabel.node.active = true;
            }
        }
    }
    
    resumeGame() {
        if (this.gameState === GameState.PAUSED) {
            this.gameState = GameState.PLAYING;
            if (this.hintLabel) {
                this.hintLabel.node.active = false;
            }
        }
    }
    
    createSnakeNodes() {
        for (const node of this.snakeNodes) {
            if (node && node.isValid) {
                node.destroy();
            }
        }
        this.snakeNodes = [];
        
        for (const pos of this.snake) {
            const node = this.createCellNode(pos, new Color(76, 175, 80, 255));
            this.snakeNodes.push(node);
        }
    }
    
    createFoodNode() {
        this.foodNode = new Node('Food');
        this.foodNode.parent = this.node;
        
        const transform = this.foodNode.addComponent(UITransform);
        transform.setContentSize(this.cellSize, this.cellSize);
        
        const graphics = this.foodNode.addComponent(Graphics);
        graphics.fillColor = new Color(255, 87, 34, 255);
        const halfSize = this.cellSize / 2;
        graphics.rect(-halfSize, -halfSize, this.cellSize, this.cellSize);
        graphics.fill();
    }
    
    createCellNode(gridPos: Vec3, color: Color): Node {
        const node = new Node('Cell');
        node.parent = this.node;
        
        const worldPos = this.gridToWorld(gridPos);
        node.setPosition(worldPos);
        
        const transform = node.addComponent(UITransform);
        transform.setContentSize(this.cellSize, this.cellSize);
        
        const graphics = node.addComponent(Graphics);
        graphics.fillColor = color;
        const halfSize = this.cellSize / 2;
        graphics.rect(-halfSize, -halfSize, this.cellSize, this.cellSize);
        graphics.fill();
        
        return node;
    }
    
    gridToWorld(gridPos: Vec3): Vec3 {
        const offsetX = -(this.gridWidth * this.cellSize) / 2 + this.cellSize / 2;
        const offsetY = -(this.gridHeight * this.cellSize) / 2 + this.cellSize / 2;
        
        return new Vec3(
            offsetX + gridPos.x * this.cellSize,
            offsetY + gridPos.y * this.cellSize,
            0
        );
    }
    
    spawnFood() {
        let validPosition = false;
        let attempts = 0;
        const maxAttempts = 200;
        
        const emptyPositions: Vec3[] = [];
        for (let x = 0; x < this.gridWidth; x++) {
            for (let y = 0; y < this.gridHeight; y++) {
                const isSnake = this.snake.some(pos => pos.x === x && pos.y === y);
                if (!isSnake) {
                    emptyPositions.push(new Vec3(x, y, 0));
                }
            }
        }
        
        if (emptyPositions.length > 0) {
            const randomIndex = Math.floor(Math.random() * emptyPositions.length);
            this.food = emptyPositions[randomIndex];
        } else {
            this.gameOver();
            return;
        }
        
        if (this.foodNode) {
            const worldPos = this.gridToWorld(this.food);
            this.foodNode.setPosition(worldPos);
            this.foodNode.scale = new Vec3(1, 1, 1);
        }
        
        this.startFoodFlash();
    }
    
    startFoodFlash() {
        if (this.foodFlashTween) {
            this.foodFlashTween.stop();
        }
        
        if (this.foodNode && this.gameState === GameState.PLAYING) {
            this.foodFlashTween = tween(this.foodNode)
                .to(0.3, { scale: new Vec3(1.2, 1.2, 1) })
                .to(0.3, { scale: new Vec3(1, 1, 1) })
                .repeatForever()
                .start();
        }
    }
    
    stopFoodFlash() {
        if (this.foodFlashTween) {
            this.foodFlashTween.stop();
            this.foodFlashTween = null;
        }
    }
    
    update(deltaTime: number) {
        if (this.gameState !== GameState.PLAYING) return;
        
        this.timeAccumulator += deltaTime;
        
        if (this.timeAccumulator >= this.moveInterval) {
            this.timeAccumulator = 0;
            this.moveSnake();
        }
    }
    
    moveSnake() {
        this.direction = this.nextDirection.clone();
        
        const head = this.snake[0].clone();
        head.add(this.direction);
        
        if (this.checkCollision(head)) {
            this.gameOver();
            return;
        }
        
        this.snake.unshift(head);
        
        const ateFood = head.x === this.food.x && head.y === this.food.y;
        
        if (ateFood) {
            this.score += 10;
            this.updateSpeed();
            this.animateScore();
            this.stopFoodFlash();
            this.updateUI();
            this.spawnFood();
            
            const newNode = this.createCellNode(head, new Color(76, 175, 80, 255));
            this.snakeNodes.unshift(newNode);
            newNode.scale = new Vec3(0, 0, 0);
            tween(newNode)
                .to(0.15, { scale: new Vec3(1, 1, 1) })
                .start();
        } else {
            this.snake.pop();
            
            if (this.snakeNodes.length > 0) {
                const lastNode = this.snakeNodes.pop();
                if (lastNode && lastNode.isValid) {
                    lastNode.destroy();
                }
            }
            
            const newNode = this.createCellNode(head, new Color(76, 175, 80, 255));
            this.snakeNodes.unshift(newNode);
        }
        
        this.updateSnakePositionsAnimated();
    }
    
    updateSpeed() {
        const speedLevel = Math.floor(this.score / this.speedIncreaseThreshold);
        this.moveInterval = Math.max(
            this.minMoveInterval,
            this.baseMoveInterval - speedLevel * 0.02
        );
    }
    
    animateScore() {
        if (this.scoreLabel) {
            if (this.scoreAnimTween) {
                this.scoreAnimTween.stop();
            }
            
            this.scoreAnimTween = tween(this.scoreLabel.node)
                .to(0.1, { scale: new Vec3(1.3, 1.3, 1) })
                .to(0.1, { scale: new Vec3(1, 1, 1) })
                .start();
        }
    }
    
    updateSnakePositionsAnimated() {
        for (let i = 0; i < this.snake.length; i++) {
            if (this.snakeNodes[i] && this.snakeNodes[i].isValid) {
                const worldPos = this.gridToWorld(this.snake[i]);
                const node = this.snakeNodes[i];
                
                tween(node)
                    .to(this.moveInterval * 0.8, { position: worldPos })
                    .start();
            }
        }
    }
    
    checkCollision(pos: Vec3): boolean {
        if (pos.x < 0 || pos.x >= this.gridWidth || pos.y < 0 || pos.y >= this.gridHeight) {
            return true;
        }
        
        for (let i = 0; i < this.snake.length - 1; i++) {
            if (pos.x === this.snake[i].x && pos.y === this.snake[i].y) {
                return true;
            }
        }
        
        return false;
    }
    
    updateUI() {
        if (this.scoreLabel) {
            this.scoreLabel.string = `Score: ${this.score}`;
            this.scoreLabel.node.setPosition(new Vec3(-250, 320, 0));  // 🔴 左上角
        }
        
        this.updateHighScoreDisplay();
    }
    
    updateHighScoreDisplay() {
        if (this.highScoreLabel) {
            this.highScoreLabel.string = `High Score: ${this.highScore}`;
            this.highScoreLabel.node.setPosition(new Vec3(0, -320, 0));  // 🔴 底部中央
        }
    }
    
    gameOver() {
        this.gameState = GameState.GAME_OVER;
        this.stopFoodFlash();
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
            this.updateHighScoreDisplay();
            
            if (this.titleLabel) {
                this.titleLabel.string = '🏆 New Record!';
                this.titleLabel.node.active = true;
            }
        } else {
            if (this.titleLabel) {
                this.titleLabel.string = 'Game Over!';
                this.titleLabel.node.active = true;
            }
        }
        
        if (this.hintLabel) {
            hintLabel.string = 'Press SPACE to Restart';
            hintLabel.node.active = true;
        }
        
        if (this.scoreLabel) {
            this.scoreLabel.string = `Final Score: ${this.score}`;
        }
        
        if (this.startButton) {
            this.startButton.active = true;
            const btnLabel = this.startButton.getComponentInChildren(Label);
            if (btnLabel) {
                btnLabel.string = 'Play Again';
            }
        }
        
        for (const node of this.snakeNodes) {
            if (node && node.isValid) {
                tween(node)
                    .to(0.5, { scale: new Vec3(0, 0, 0) })
                    .call(() => {
                        if (node && node.isValid) {
                            node.destroy();
                        }
                    })
                    .start();
        }
        }
        this.snakeNodes = [];
    }
    
    onDestroy() {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        
        if (typeof window !== 'undefined' && this.keyHandler) {
            window.removeEventListener('keydown', this.keyHandler);
        }
        
        this.stopFoodFlash();
        
        if (this.scoreAnimTween) {
            this.scoreAnimTween.stop();
        }
        
        for (const node of this.snakeNodes) {
            if (node && node.isValid) {
                node.destroy();
            }
        }
        
        if (this.foodNode && this.foodNode.isValid) {
            this.foodNode.destroy();
        }
        
        if (this.borderNode && this.borderNode.isValid) {
            this.borderNode.destroy();
        }
    }
}