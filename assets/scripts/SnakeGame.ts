import { _decorator, Component, Node, UITransform, Graphics, Label, Color, Vec3, input, Input, KeyCode } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SnakeGame')
export class SnakeGame extends Component {
    
    @property(Node)
    gameArea: Node = null!;
    
    @property(Label)
    scoreLabel: Label = null!;
    
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
    private isPlaying: boolean = false;
    private moveInterval: number = 0.2;
    private timeAccumulator: number = 0;
    
    private snakeNodes: Node[] = [];
    private foodNode: Node = null!;
    private borderNode: Node = null!;
    private keyHandler: any = null;
    
    start() {
        this.initGame();
        this.setupInput();
        this.hideStartButton();
        this.startGame();
    }
    
    initGame() {
        const width = this.gridWidth * this.cellSize;
        const height = this.gridHeight * this.cellSize;
        
        if (this.gameArea) {
            const transform = this.gameArea.getComponent(UITransform);
            if (transform) {
                transform.setContentSize(width, height);
            }
        }
        
        // 創建邊框節點
        this.borderNode = new Node('Border');
        this.borderNode.parent = this.node;
        this.borderNode.setPosition(0, 0, 0);
        
        const borderTransform = this.borderNode.addComponent(UITransform);
        borderTransform.setContentSize(width + 10, height + 10);
        
        const borderGraphics = this.borderNode.addComponent(Graphics);
        const halfW = width / 2;
        const halfH = height / 2;
        
        // 背景 (深灰)
        borderGraphics.fillColor = new Color(40, 40, 40, 255);
        borderGraphics.rect(-halfW, -halfH, width, height);
        borderGraphics.fill();
        
        // 邊框 (白色，6像素寬)
        borderGraphics.strokeColor = new Color(255, 255, 255, 255);
        borderGraphics.lineWidth = 6;
        borderGraphics.rect(-halfW, -halfH, width, height);
        borderGraphics.stroke();
        
        if (this.scoreLabel) {
            this.scoreLabel.string = 'Score: 0';
            this.scoreLabel.node.setPosition(new Vec3(-250, 300, 0));
        }
        
        this.createFoodNode();
    }
    
    setupInput() {
        input.on(Input.EventType.KEY_DOWN, (event: any) => {
            this.handleKey(event.keyCode);
        }, this);
        
        if (typeof window !== 'undefined') {
            this.keyHandler = (e: KeyboardEvent) => {
                e.preventDefault();
                this.handleKey(e.keyCode);
            };
            window.addEventListener('keydown', this.keyHandler);
        }
    }
    
    handleKey(code: number) {
        console.log('Key:', code, 'Playing:', this.isPlaying);
        if (!this.isPlaying) return;
        
        switch (code) {
            case 38: // Arrow Up
            case KeyCode.ARROW_UP:
                if (this.direction.y !== -1) {
                    this.nextDirection = new Vec3(0, 1, 0);
                    console.log('Direction: UP');
                }
                break;
            case 40: // Arrow Down
            case KeyCode.ARROW_DOWN:
                if (this.direction.y !== 1) {
                    this.nextDirection = new Vec3(0, -1, 0);
                    console.log('Direction: DOWN');
                }
                break;
            case 37: // Arrow Left
            case KeyCode.ARROW_LEFT:
                if (this.direction.x !== 1) {
                    this.nextDirection = new Vec3(-1, 0, 0);
                    console.log('Direction: LEFT');
                }
                break;
            case 39: // Arrow Right
            case KeyCode.ARROW_RIGHT:
                if (this.direction.x !== -1) {
                    this.nextDirection = new Vec3(1, 0, 0);
                    console.log('Direction: RIGHT');
                }
                break;
        }
    }
    
    hideStartButton() {
        if (this.startButton) {
            this.startButton.active = false;
        }
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
        this.isPlaying = true;
        this.timeAccumulator = 0;
        
        this.updateScoreLabel();
        this.createSnakeNodes();
        this.spawnFood();
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
        graphics.rect(0, 0, this.cellSize, this.cellSize);
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
        graphics.rect(0, 0, this.cellSize, this.cellSize);
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
        
        while (!validPosition && attempts < 100) {
            this.food = new Vec3(
                Math.floor(Math.random() * this.gridWidth),
                Math.floor(Math.random() * this.gridHeight),
                0
            );
            
            validPosition = !this.snake.some(pos => 
                pos.x === this.food.x && pos.y === this.food.y
            );
            
            attempts++;
        }
        
        if (this.foodNode) {
            const worldPos = this.gridToWorld(this.food);
            this.foodNode.setPosition(worldPos);
        }
    }
    
    update(deltaTime: number) {
        if (!this.isPlaying) return;
        
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
            this.updateScoreLabel();
            this.spawnFood();
            
            const newNode = this.createCellNode(head, new Color(76, 175, 80, 255));
            this.snakeNodes.unshift(newNode);
        } else {
            const tail = this.snake.pop();
            
            if (this.snakeNodes.length > 0) {
                const lastNode = this.snakeNodes.pop();
                if (lastNode && lastNode.isValid) {
                    lastNode.destroy();
                }
            }
            
            const newNode = this.createCellNode(head, new Color(76, 175, 80, 255));
            this.snakeNodes.unshift(newNode);
        }
        
        this.updateSnakePositions();
    }
    
    checkCollision(pos: Vec3): boolean {
        if (pos.x < 0 || pos.x >= this.gridWidth || pos.y < 0 || pos.y >= this.gridHeight) {
            return true;
        }
        
        // Skip tail check - tail will move away after this frame
        for (let i = 0; i < this.snake.length - 1; i++) {
            if (pos.x === this.snake[i].x && pos.y === this.snake[i].y) {
                return true;
            }
        }
        
        return false;
    }
    
    updateSnakePositions() {
        for (let i = 0; i < this.snake.length; i++) {
            if (this.snakeNodes[i] && this.snakeNodes[i].isValid) {
                const worldPos = this.gridToWorld(this.snake[i]);
                this.snakeNodes[i].setPosition(worldPos);
            }
        }
    }
    
    updateScoreLabel() {
        if (this.scoreLabel) {
            this.scoreLabel.string = `Score: ${this.score}`;
        }
    }
    
    gameOver() {
        this.isPlaying = false;
        
        if (this.scoreLabel) {
            this.scoreLabel.string = `Game Over! Score: ${this.score}`;
        }
        
        if (this.startButton) {
            this.startButton.active = true;
            this.startButton.setPosition(new Vec3(0, 0, 0));
        }
        
        for (const node of this.snakeNodes) {
            if (node && node.isValid) {
                node.destroy();
            }
        }
        this.snakeNodes = [];
    }
    
    onDestroy() {
        input.off(Input.EventType.KEY_DOWN, this.handleKey, this);
        
        if (typeof window !== 'undefined' && this.keyHandler) {
            window.removeEventListener('keydown', this.keyHandler);
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