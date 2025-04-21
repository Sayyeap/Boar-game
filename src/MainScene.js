class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
        this.coinsCollected = 0;
        this.coinValue = 1;
        this.isGamePaused = false;
        this.currentEnemy = null;
        this.enemyObjects = [];
        this.autoAttackTimer = null;
    }

    preload() {
        console.log('MainScene: Preload started');
        try {
            this.load.image('ground', 'assets/ground.gif');
            this.load.image('skybox', 'assets/Skybox.gif');
            this.load.spritesheet('player', 'assets/WomanFighterSprites-Sheet.png', {
                frameWidth: 142,
                frameHeight: 100
            });
            this.load.spritesheet('boar', 'assets/BrownBoar.png', { frameWidth: 48, frameHeight: 32 });
            this.load.image('coinCount', 'assets/CoinCount.png');
            this.load.spritesheet('coin', 'assets/coin.gif', { frameWidth: 16, frameHeight: 16 });
            this.load.image('skills', 'assets/Skills.jpg');
            this.load.image('book', 'assets/Book.png');
            this.load.image('coinValueIcon', 'assets/CoinValueIcon.jpg');
            this.load.image('upgradeGreen', 'assets/UpgradeGreen.png');
            this.load.image('upgradeRed', 'assets/UpgradeRed.png');
            this.load.image('close', 'assets/Close.png');
            this.load.spritesheet('tapButton', 'assets/TapButton.png', { frameWidth: 16, frameHeight: 16 });
            console.log('MainScene: Preload completed');
        } catch (e) {
            console.error('MainScene: Preload error', e);
        }
    }

    create() {
        console.log('MainScene: Create started');
        try {
            // Камера
            this.cameras.main.setBackgroundColor('#87CEEB');
            this.cameras.main.setViewport(0, 0, this.game.config.width, this.game.config.height);
            this.cameras.main.setBounds(0, 0, this.game.config.width, this.game.config.height);

            // Анимации игрока
            this.anims.create({
                key: 'walk',
                frames: this.anims.generateFrameNumbers('player', { start: 17, end: 24 }),
                frameRate: 10,
                repeat: -1
            });
            this.anims.create({
                key: 'idle',
                frames: this.anims.generateFrameNumbers('player', { start: 0, end: 7 }),
                frameRate: 10,
                repeat: -1
            });
            this.anims.create({
                key: 'jump_up',
                frames: [{ key: 'player', frame: 38 }],
                frameRate: 1
            });
            this.anims.create({
                key: 'jump_down',
                frames: [{ key: 'player', frame: 37 }],
                frameRate: 1
            });
            this.anims.create({
                key: 'attack',
                frames: this.anims.generateFrameNumbers('player', { start: 8, end: 16 }),
                frameRate: 10,
                repeat: 0
            });
            console.log('MainScene: Walk (17-24), Idle (0-7), and Attack (8-16) animations created');

            // Анимации кабана
            this.anims.create({
                key: 'boar_idle',
                frames: this.anims.generateFrameNumbers('boar', { start: 0, end: 3 }),
                frameRate: 8,
                repeat: -1
            });
            this.anims.create({
                key: 'boar_hit',
                frames: this.anims.generateFrameNumbers('boar', { start: 4, end: 5 }),
                frameRate: 10,
                repeat: 0
            });
            this.anims.create({
                key: 'boar_death',
                frames: this.anims.generateFrameNumbers('boar', { start: 5, end: 7 }),
                frameRate: 10,
                repeat: 0
            });

            // Анимации монет
            this.anims.create({
                key: 'coin_idle',
                frames: this.anims.generateFrameNumbers('coin', { start: 0, end: 5 }),
                frameRate: 10,
                repeat: -1
            });
            this.anims.create({
                key: 'coin_collect',
                frames: this.anims.generateFrameNumbers('coin', { start: 6, end: 7 }),
                frameRate: 15,
                repeat: 0
            });

            // Анимация кнопки
            this.anims.create({
                key: 'tap_button_idle',
                frames: this.anims.generateFrameNumbers('tapButton', { start: 0, end: 3 }),
                frameRate: 10,
                repeat: -1
            });

            // Фон
            this.background = new Background(this);
            this.background.create();

            // Пустой блок земли с коллизией
            this.ground = this.physics.add.staticGroup();
            const ground = this.ground.create(this.game.config.width / 2, this.game.config.height - 251, null)
                .setSize(this.game.config.width, 300)
                .setOrigin(0.5, 0)
                .setVisible(false)
                .refreshBody();
            console.log('MainScene: Invisible ground created at y=' + (this.game.config.height - 251) + ', size=' + ground.width + 'x' + ground.height);

            // Персонаж
            this.player = new Player(this, Math.min(150, this.game.config.width - 20), this.game.config.height - 251, 251);

            // Коллизия игрока с землёй
            this.physics.add.collider(this.player.sprite, this.ground, () => {
                console.log('MainScene: Player collided with ground, y=' + this.player.sprite.y);
            });

            // Счётчик монет
            this.coinIcon = this.add.image(this.game.config.width / 2 - 20, 30, 'coinCount').setScale(2).setDepth(20);
            this.coinText = this.add.text(this.game.config.width / 2 + 20, 30, '0', {
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '24px',
                color: '#FFFFFF'
            }).setOrigin(0.5).setStroke('#000000', 3).setDepth(20);

            // Группа монет
            this.coins = this.physics.add.group({
                immovable: true,
                allowGravity: false,
                velocityX: -100
            }).setDepth(0);

            // Группа врагов
            this.enemies = this.physics.add.group({
                immovable: true,
                allowGravity: false,
                velocityX: -100
            }).setDepth(5);

            // Столкновения
            this.physics.add.overlap(this.player.sprite, this.coins, this.collectCoin, null, this);
            this.physics.add.overlap(this.player.sprite, this.enemies, this.startCombat, null, this);

            // Иконка Skills
            this.skillsIcon = this.add.image(40, this.game.config.height - 40, 'skills')
                .setOrigin(0.5)
                .setInteractive()
                .setDepth(10)
                .on('pointerdown', (pointer, localX, localY, event) => {
                    console.log('Skills icon clicked');
                    if (!this.upgradeMenu.isOpen) {
                        this.upgradeMenu.open();
                        event.stopPropagation();
                    }
                });

            // Меню прокачки
            this.upgradeMenu = new UpgradeMenu(this);
            // Нет вызова create, так как меню теперь HTML

            // Запуск генерации
            this.spawnCoins();
            this.spawnEnemy();

            // Ресайз
            window.addEventListener('resize', () => {
                this.game.scale.resize(window.innerWidth, window.innerHeight);
                this.cameras.main.setViewport(0, 0, this.game.config.width, this.game.config.height);
                this.cameras.main.setBounds(0, 0, this.game.config.width, this.game.config.height);
                this.background.resize(this.game.config.width, this.game.config.height);
                this.player.updateGroundY(this.game.config.height);
                this.ground.clear(true, true);
                const newGround = this.ground.create(this.game.config.width / 2, this.game.config.height - 251, null)
                    .setSize(this.game.config.width, 300)
                    .setOrigin(0.5, 0)
                    .setVisible(false)
                    .refreshBody();
                console.log('MainScene: Ground resized at y=' + (this.game.config.height - 251));
                this.coinIcon.setPosition(this.game.config.width / 2 - 20, 30);
                this.coinText.setPosition(this.game.config.width / 2 + 20, 30);
                this.skillsIcon.setPosition(40, this.game.config.height - 40);
                if (this.upgradeMenu.isOpen) {
                    this.upgradeMenu.close();
                    this.upgradeMenu.open();
                }
            });

            console.log('MainScene: Create completed');
        } catch (e) {
            console.error('MainScene: Create error', e);
        }
    }

    collectCoin(player, coin) {
        if (coin.collected) return;
        coin.collected = true;
        coin.anims.play('coin_collect', true);
        coin.on('animationcomplete', () => {
            coin.destroy();
        });
        this.coinsCollected += this.coinValue;
        this.coinText.setText(this.coinsCollected);
    }

    startCombat(playerSprite, enemySprite) {
        if (this.isGamePaused) {
            console.log('Combat skipped: Game paused');
            return;
        }

        const enemy = this.enemyObjects.find(e => e.sprite === enemySprite);
        if (!enemy) {
            console.log('Combat skipped: No matching enemy object found');
            return;
        }

        console.log(`Combat initiated with enemy at x=${enemy.sprite.x}, hp=${enemy.hp}`);
        this.currentEnemy = enemy;

        this.isGamePaused = true;
        try {
            this.background.stop();
        } catch (e) {
            console.error('MainScene: Error stopping background', e);
        }
        this.coins.setVelocityX(0);
        this.enemies.setVelocityX(0);
        this.player.disableInput();
        playerSprite.setVelocityY(0);
        playerSprite.y = this.game.config.height - 251;
        this.player.sprite.anims.play('idle', true);
        console.log('MainScene: Player in idle animation at combat start, enemy=' + (this.currentEnemy ? 'set' : 'null'));

        this.startAutoAttack();

        // Кнопка и текст для визуала
        this.tapButton = this.add.sprite(this.player.sprite.x, this.player.sprite.y - 130, 'tapButton')
            .setOrigin(0.5)
            .setScale(2)
            .setDepth(10);
        this.tapButton.anims.play('tap_button_idle', true);

        this.tapText = this.add.text(this.player.sprite.x, this.player.sprite.y - 180, 'Тапай по экрану', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '16px',
            color: '#FFFFFF'
        }).setOrigin(0.5).setStroke('#000000', 3).setDepth(10);

        // Тап по всему экрану
        this.input.on('pointerdown', () => {
            if (!this.isGamePaused || !this.currentEnemy || !this.currentEnemy.isAlive) {
                console.log('Attack skipped: Invalid state, enemy=' + (this.currentEnemy ? 'set' : 'null'));
                return;
            }
            console.log('Screen tapped');
            try {
                this.player.attack(this.currentEnemy);
                this.resetAutoAttack();
            } catch (e) {
                console.error('MainScene: Error triggering player attack', e);
            }
        });

        // Отключаем тапы по экрану при выходе из боя
        this.input.once('pointerdown', () => {
            if (!this.isGamePaused) {
                this.input.off('pointerdown');
            }
        });
    }

    startAutoAttack() {
        if (this.autoAttackTimer) {
            this.autoAttackTimer.remove();
        }
        this.autoAttackTimer = this.time.addEvent({
            delay: 10000,
            callback: () => {
                if (!this.isGamePaused || !this.currentEnemy || !this.currentEnemy.isAlive) {
                    console.log('Auto attack skipped: Invalid state');
                    return;
                }
                console.log('Auto attack triggered');
                try {
                    this.player.attack(this.currentEnemy);
                    this.startAutoAttack();
                } catch (e) {
                    console.error('MainScene: Error triggering auto attack', e);
                }
            },
            loop: false
        });
    }

    resetAutoAttack() {
        if (this.autoAttackTimer) {
            this.autoAttackTimer.remove();
        }
        this.startAutoAttack();
    }

    resumeGame() {
        if (!this.isGamePaused) return;
        this.isGamePaused = false;
        try {
            this.background.resume();
        } catch (e) {
            console.error('MainScene: Error resuming background', e);
        }
        this.coins.setVelocityX(-100);
        this.enemies.setVelocityX(-100);
        this.player.enableInput();
        this.input.off('pointerdown');
        this.input.off('pointerup');
        this.player.setupInput();
        console.log('MainScene: Input setup after resume');
        if (this.tapButton) {
            this.tapButton.destroy();
            this.tapButton = null;
        }
        if (this.tapText) {
            this.tapText.destroy();
            this.tapText = null;
        }
        if (this.autoAttackTimer) {
            this.autoAttackTimer.remove();
            this.autoAttackTimer = null;
        }
        this.currentEnemy = null;
        this.player.sprite.anims.play('walk', true);
        console.log('MainScene: Game resumed, player in walk, isGamePaused=' + this.isGamePaused + ', inputEnabled=' + this.player.isInputEnabled);
    }

    spawnCoins() {
        if (this.isGamePaused) {
            setTimeout(() => this.spawnCoins(), 2000);
            return;
        }
        const coinCount = this.getCoinCount();
        const centerY = Phaser.Math.Between(this.game.config.height - 251 - 450, this.game.config.height - 251 - 180);

        for (let i = 0; i < coinCount; i++) {
            const offsetX = i * 30;
            const coin = this.coins.create(this.game.config.width + 50 + offsetX, centerY, 'coin')
                .setScale(2)
                .setOrigin(0.5);
            coin.anims.play('coin_idle', true);
        }

        setTimeout(() => this.spawnCoins(), Phaser.Math.Between(2000, 3000));
    }

    spawnEnemy() {
        if (this.isGamePaused) {
            setTimeout(() => this.spawnEnemy(), 5000);
            return;
        }
        const enemy = new Enemy(this, this.game.config.width + 50, this.game.config.height - 251);
        this.enemies.add(enemy.sprite);
        this.enemyObjects.push(enemy);
        setTimeout(() => this.spawnEnemy(), Phaser.Math.Between(10000, 15000));
    }

    getCoinCount() {
        const rand = Phaser.Math.Between(0, 100);
        if (rand < 20) return 1;
        if (rand < 50) return 2;
        if (rand < 80) return 3;
        return 4;
    }

    upgradeCoinValue(newValue) {
        this.coinValue = newValue;
    }

    update() {
        if (this.isGamePaused) return;
        this.background.update();
        this.player.update();
        console.log('MainScene: Update, isGamePaused=' + this.isGamePaused);
        this.coins.getChildren().forEach(coin => {
            if (coin.x < -50) {
                coin.destroy();
            }
        });
        this.enemies.getChildren().forEach(enemySprite => {
            if (enemySprite.x < -50) {
                const enemy = this.enemyObjects.find(e => e.sprite === enemySprite);
                if (enemy) {
                    this.enemyObjects = this.enemyObjects.filter(e => e !== enemy);
                    enemy.destroy();
                }
                enemySprite.destroy();
            }
        });
    }
}