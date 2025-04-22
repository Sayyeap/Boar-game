class Player {
    constructor(scene, x, y, groundHeight) {
        this.scene = scene;
        this.groundHeight = groundHeight;
        this.groundY = scene.game.config.height - groundHeight;

        this.sprite = scene.physics.add.sprite(x, this.groundY, 'player')
            .setScale(2)
            .setOrigin(0.5, 1)
            .setCollideWorldBounds(false)
            .setSize(35, 72)
            .setOffset(53.5, 28);
        this.sprite.body.gravity.y = 4500; // Гравитация только для игрока
        this.sprite.setVelocityY(0);
        this.sprite.y = this.groundY;

        this.sprite.anims.play('walk', true);

        this.isInputEnabled = true;
        this.coinsCollected = 0;
        this.isJumping = false;
        this.isHoldingJump = false;
        this.jumpPower = 1000; // Базовая сила прыжка
        this.maxJumpPower = 2000; // Максимальная скорость прыжка
        this.boostPower = 700; // Максимальный прирост для высоты
        this.jumpChargeTime = 115; // Время для буста
        this.jumpStartTime = 0;
        this.isAttacking = false;
        this.jumpTimer = null; // Таймер для буста

        this.setupInput();
    }

    setupInput() {
        this.scene.input.off('pointerdown');
        this.scene.input.off('pointerup');
        this.scene.input.on('pointerdown', () => {
            if (this.isInputEnabled && !this.scene.isGamePaused) {
                console.log('Player: pointerdown received');
                this.startJump();
            } else {
                console.log('Player: pointerdown blocked', {
                    isInputEnabled: this.isInputEnabled,
                    isGamePaused: this.scene.isGamePaused
                });
            }
        });
        this.scene.input.on('pointerup', () => {
            if (this.isInputEnabled) {
                console.log('Player: pointerup received');
                this.endJump();
            } else {
                console.log('Player: pointerup blocked', { isInputEnabled: this.isInputEnabled });
            }
        });
    }

    startJump() {
        if (!this.isInputEnabled || this.isJumping || this.sprite.y < this.groundY - 5) {
            console.log('Player: startJump blocked', {
                isInputEnabled: this.isInputEnabled,
                isJumping: this.isJumping,
                y: this.sprite.y,
                groundY: this.groundY
            });
            return;
        }
        this.isJumping = true;
        this.isHoldingJump = true;
        this.jumpStartTime = this.scene.time.now;
        this.sprite.setVelocityY(-this.jumpPower); // Базовый прыжок
        this.sprite.anims.play('jump_up', true);
        console.log('Player: startJump, velocity.y=', this.sprite.body.velocity.y);

        // Запускаем таймер для буста
        this.jumpTimer = this.scene.time.delayedCall(this.jumpChargeTime, () => {
            if (this.isJumping && this.isHoldingJump) {
                const chargeTime = Math.min(this.scene.time.now - this.jumpStartTime, this.jumpChargeTime);
                const boostFactor = chargeTime / this.jumpChargeTime; // 0 to 1
                const boost = this.boostPower * boostFactor; // Прирост скорости
                const newVelocity = Math.max(-(this.jumpPower + boost), -this.maxJumpPower);
                this.sprite.setVelocityY(newVelocity);
                console.log(`Player: Jump boost applied: chargeTime=${chargeTime}, boostFactor=${boostFactor}, boost=${boost}, velocity.y=${newVelocity}, y=${this.sprite.y}`);
            }
            this.jumpTimer = null;
        }, [], this);
    }

    endJump() {
        if (this.isHoldingJump && this.jumpTimer) {
            this.scene.time.removeEvent(this.jumpTimer); // Отменяем таймер
            const chargeTime = Math.min(this.scene.time.now - this.jumpStartTime, this.jumpChargeTime);
            const boostFactor = chargeTime / this.jumpChargeTime; // 0 to 1
            const boost = this.boostPower * boostFactor; // Прирост скорости
            const newVelocity = Math.max(-(this.jumpPower + boost), -this.maxJumpPower);
            this.sprite.setVelocityY(newVelocity);
            console.log(`Player: Jump boost applied on release: chargeTime=${chargeTime}, boostFactor=${boostFactor}, boost=${boost}, velocity.y=${newVelocity}, y=${this.sprite.y}`);
            this.jumpTimer = null;
        }
        this.isHoldingJump = false;
        console.log('Player: endJump, chargeTime=', this.scene.time.now - this.jumpStartTime);
    }

    attack(enemy) {
        if (this.isAttacking) {
            return;
        }
        this.isAttacking = true;
        this.sprite.anims.play('attack', true);

        if (enemy && enemy.isAlive) {
            this.scene.time.delayedCall(400, () => {
                if (enemy && enemy.isAlive) {
                    enemy.takeDamage(1);
                }
            });
        }

        this.sprite.once('animationcomplete', () => {
            this.isAttacking = false;
            if (this.sprite.y >= this.groundY - 5 && (!this.sprite.anims.currentAnim || !['jump_up', 'jump_down'].includes(this.sprite.anims.currentAnim.key))) {
                this.sprite.anims.play('idle', true);
            }
        });
    }

    update(time, delta) {
        if (!this.isInputEnabled) {
            this.sprite.setVelocityY(0);
            this.sprite.y = this.groundY;
            if (!this.isAttacking && (!this.sprite.anims.currentAnim || this.sprite.anims.currentAnim.key !== 'idle')) {
                this.sprite.anims.play('idle', true);
            }
            console.log('Player: Input disabled, y=', this.sprite.y, 'velocity.y=', this.sprite.body.velocity.y);
            return;
        }

        if (this.isAttacking) {
            return;
        }

        // Анимации
        if (this.sprite.y < this.groundY - 10) {
            if (this.sprite.body.velocity.y < 0 && (!this.sprite.anims.currentAnim || this.sprite.anims.currentAnim.key !== 'jump_up')) {
                this.sprite.anims.play('jump_up', true);
            } else if (this.sprite.body.velocity.y > 0 && (!this.sprite.anims.currentAnim || this.sprite.anims.currentAnim.key !== 'jump_down')) {
                this.sprite.anims.play('jump_down', true);
            }
        } else if (!this.sprite.anims.currentAnim || this.sprite.anims.currentAnim.key !== 'walk') {
            this.sprite.anims.play('walk', true);
        }

        // Сброс прыжка
        if (this.sprite.y >= this.groundY - 5 && this.sprite.body.velocity.y >= 0) {
            this.sprite.setVelocityY(0);
            this.sprite.y = this.groundY;
            this.isJumping = false;
            this.isHoldingJump = false;
            if (this.jumpTimer) {
                this.scene.time.removeEvent(this.jumpTimer);
                this.jumpTimer = null;
            }
            console.log('Player: Jump reset, y=', this.sprite.y);
        }

        // Защита от проваливания
        if (this.sprite.y > this.groundY + 5) {
            this.sprite.y = this.groundY;
            this.sprite.setVelocityY(0);
            console.log('Player: Prevented falling, y=', this.sprite.y);
        }

        // Защита от улёта
        if (this.sprite.y < -500) {
            this.sprite.y = -500;
            this.sprite.setVelocityY(0);
            this.isJumping = false;
            this.isHoldingJump = false;
            if (this.jumpTimer) {
                this.scene.time.removeEvent(this.jumpTimer);
                this.jumpTimer = null;
            }
            console.log('Player: Hit height limit, y=', this.sprite.y);
        }

        this.sprite.x = Math.min(150, this.scene.cameras.main.width - 20);
    }

    updateGroundY(newHeight) {
        this.groundY = newHeight - this.groundHeight;
        if (!this.isJumping || !this.isInputEnabled) {
            this.sprite.y = this.groundY;
            this.sprite.setVelocityY(0);
            console.log('Player: Updated groundY, y=', this.sprite.y);
        }
    }

    upgradeJumpPower(newPower) {
        this.maxJumpPower = newPower;
    }

    disableInput() {
        this.isInputEnabled = false;
        this.sprite.body.enable = false;
        this.sprite.setVelocityY(0);
        this.sprite.y = this.groundY;
        if (this.jumpTimer) {
            this.scene.time.removeEvent(this.jumpTimer);
            this.jumpTimer = null;
        }
        console.log('Player: Input disabled');
    }

    enableInput() {
        this.isInputEnabled = true;
        this.sprite.body.enable = true;
        this.sprite.setVelocityY(0);
        this.sprite.y = this.groundY;
        this.setupInput();
        console.log('Player: Input enabled');
    }

    collectCoin() {}
}