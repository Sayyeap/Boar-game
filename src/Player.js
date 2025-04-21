class Player {
    constructor(scene, x, y, groundHeight) {
        this.scene = scene;
        this.groundHeight = groundHeight;
        this.groundY = scene.game.config.height - groundHeight; // Синхронизируем с height - 360

        this.sprite = scene.physics.add.sprite(x, this.groundY, 'player')
            .setScale(2)
            .setOrigin(0.5, 1)
            .setCollideWorldBounds(false)
            .setSize(35, 72)
            .setOffset(53.5, 28);
        this.sprite.setVelocityY(0);
        this.sprite.y = this.groundY;

        try {
            this.sprite.anims.play('walk', true);
            console.log('Player: walk animation started');
        } catch (e) {
            console.error('Player: Error starting walk animation', e);
        }

        this.isInputEnabled = true;
        this.coinsCollected = 0;
        this.isJumping = false;
        this.isHoldingJump = false;
        this.jumpPower = 400;
        this.maxJumpPower = 500;
        this.boostPower = 100;
        this.jumpChargeTime = 200;
        this.jumpStartTime = 0;
        this.isAttacking = false;

        // Обработка ввода для прыжков
        this.setupInput();
    }

    setupInput() {
        this.scene.input.off('pointerdown');
        this.scene.input.off('pointerup');
        this.scene.input.on('pointerdown', () => {
            if (this.isInputEnabled && !this.scene.isGamePaused) {
                console.log('Player: Pointer down detected');
                this.startJump();
            } else {
                console.log('Jump input ignored: isInputEnabled=' + this.isInputEnabled + ', isGamePaused=' + this.scene.isGamePaused);
            }
        });
        this.scene.input.on('pointerup', () => {
            if (this.isInputEnabled) {
                this.endJump();
            }
        });
        console.log('Player: Input handlers set up');
    }

    startJump() {
        if (!this.isInputEnabled || this.isJumping || this.sprite.y < this.groundY - 5) {
            console.log('Jump skipped: isInputEnabled=' + this.isInputEnabled + ', isJumping=' + this.isJumping + ', y=' + this.sprite.y + ', groundY=' + this.groundY);
            return;
        }
        this.isJumping = true;
        this.isHoldingJump = true;
        this.jumpStartTime = this.scene.time.now;
        this.sprite.setVelocityY(-this.jumpPower);
        this.sprite.anims.play('jump_up', true);
        console.log('Player: Jump started, velocityY=' + this.sprite.body.velocity.y + ', y=' + this.sprite.y);
    }

    endJump() {
        this.isHoldingJump = false;
    }

    attack(enemy) {
        if (this.isAttacking) {
            console.log('Player: Attack skipped, already attacking');
            return;
        }
        this.isAttacking = true;
        try {
            console.log('Player: Attempting to play attack animation (frames 8-16)');
            this.sprite.anims.play('attack', true);
            console.log('Player: Attack animation started');

            // Наносим урон через 400 мс
            if (enemy && enemy.isAlive) {
                this.scene.time.delayedCall(400, () => {
                    if (enemy && enemy.isAlive) {
                        enemy.takeDamage(1);
                        console.log('Player: Damage dealt to enemy at 400ms');
                    } else {
                        console.log('Player: Damage skipped, enemy invalid or dead');
                    }
                });
            } else {
                console.log('Player: Damage skipped, no valid enemy');
            }

            this.sprite.once('animationcomplete', () => {
                console.log('Player: Attack animation completed');
                this.isAttacking = false;
                if (this.sprite.y >= this.groundY - 5 && (!this.sprite.anims.currentAnim || this.sprite.anims.currentAnim.key !== 'jump_up' && this.sprite.anims.currentAnim.key !== 'jump_down')) {
                    this.sprite.anims.play('idle', true);
                    console.log('Player: Returned to idle animation');
                }
            });
        } catch (e) {
            console.error('Player: Error playing attack animation', e);
            this.isAttacking = false;
            this.sprite.anims.play('idle', true);
        }
    }

    update() {
        if (!this.isInputEnabled) {
            this.sprite.setVelocityY(0);
            this.sprite.y = this.groundY;
            if (!this.isAttacking && (!this.sprite.anims.currentAnim || this.sprite.anims.currentAnim.key !== 'idle')) {
                this.sprite.anims.play('idle', true);
                console.log('Player: Switched to idle animation (input disabled)');
            }
            console.log(`Player: Position y=${this.sprite.y}, groundY=${this.groundY}, isInputEnabled=${this.isInputEnabled}, body.enable=${this.sprite.body.enable}`);
            return;
        }

        if (this.isJumping && this.isHoldingJump && this.sprite.body.velocity.y < 0) {
            const chargeTime = Math.min(this.scene.time.now - this.jumpStartTime, this.jumpChargeTime);
            if (chargeTime < this.jumpChargeTime) {
                this.sprite.setVelocityY(this.sprite.body.velocity.y - this.boostPower);
                console.log('Player: Jump boosted, velocityY=' + this.sprite.body.velocity.y);
            } else {
                this.isHoldingJump = false;
            }
        }

        try {
            if (this.isAttacking) {
                console.log('Player: Update skipped, attack animation in progress');
                return;
            }
            if (this.sprite.y < this.groundY - 10) {
                if (this.sprite.body.velocity.y < 0) {
                    if (!this.sprite.anims.currentAnim || this.sprite.anims.currentAnim.key !== 'jump_up') {
                        this.sprite.anims.play('jump_up', true);
                        console.log('Player: Switched to jump_up animation');
                    }
                } else if (this.sprite.body.velocity.y > 0) {
                    if (!this.sprite.anims.currentAnim || this.sprite.anims.currentAnim.key !== 'jump_down') {
                        this.sprite.anims.play('jump_down', true);
                        console.log('Player: Switched to jump_down animation');
                    }
                }
            } else {
                if (!this.sprite.anims.currentAnim || this.sprite.anims.currentAnim.key !== 'walk') {
                    this.sprite.anims.play('walk', true);
                    console.log('Player: Switched to walk animation');
                }
            }
        } catch (e) {
            console.error('Player: Error in animation switch', e);
        }

        // Сброс прыжка
        if (this.sprite.y >= this.groundY - 5 && this.sprite.body.velocity.y >= 0) {
            this.sprite.setVelocityY(0);
            this.sprite.y = this.groundY;
            this.isJumping = false;
            this.isHoldingJump = false;
            console.log('Player: Jump reset, y=' + this.sprite.y + ', velocityY=' + this.sprite.body.velocity.y);
        }

        // Защита от проваливания
        if (this.sprite.y > this.groundY + 5) {
            this.sprite.y = this.groundY;
            this.sprite.setVelocityY(0);
            console.log('Player: Prevented falling through ground, y=' + this.sprite.y);
        }

        this.sprite.x = Math.min(150, this.scene.cameras.main.width - 20);
        console.log(`Player: Position y=${this.sprite.y}, groundY=${this.groundY}, isInputEnabled=${this.isInputEnabled}, body.enable=${this.sprite.body.enable}`);
    }

    updateGroundY(newHeight) {
        this.groundY = newHeight - this.groundHeight;
        if (!this.isJumping || !this.isInputEnabled) {
            this.sprite.y = this.groundY;
            this.sprite.setVelocityY(0);
        }
        console.log(`Player: Ground updated, y=${this.sprite.y}, groundY=${this.groundY}`);
    }

    upgradeJumpPower(newPower) {
        this.maxJumpPower = newPower;
    }

    disableInput() {
        this.isInputEnabled = false;
        this.sprite.body.enable = false;
        this.sprite.setVelocityY(0);
        this.sprite.y = this.groundY;
        console.log('Player: Input disabled, fixed at y=' + this.sprite.y);
    }

    enableInput() {
        this.isInputEnabled = true;
        this.sprite.body.enable = true;
        this.sprite.setVelocityY(0);
        this.sprite.y = this.groundY;
        this.setupInput();
        console.log('Player: Input enabled, y=' + this.sprite.y + ', body.enable=' + this.sprite.body.enable);
    }

    collectCoin() {}
}