class Enemy {
    constructor(scene, x, y) {
        this.scene = scene;
        this.hp = 2;
        this.isAlive = true;

        this.sprite = scene.physics.add.sprite(x, scene.game.config.height - 251, 'boar')
            .setScale(2)
            .setOrigin(0.5, 1)
            .setCollideWorldBounds(false);
        console.log('Enemy: Created at x=' + x + ', y=' + (scene.game.config.height - 251) + ', hp=' + this.hp);

        try {
            this.sprite.anims.play('boar_idle', true);
            console.log('Enemy: Boar idle animation started');
        } catch (e) {
            console.error('Enemy: Error starting boar idle animation', e);
        }
    }

    takeDamage(damage) {
        if (!this.isAlive) {
            console.log('Enemy: Damage skipped, already dead');
            return;
        }
        this.hp -= damage;
        console.log('Enemy: Took ' + damage + ' damage, hp=' + this.hp);

        if (this.hp <= 0) {
            this.isAlive = false;
            try {
                this.sprite.anims.play('boar_death', true);
                console.log('Enemy: Death animation started');
                this.sprite.on('animationcomplete', () => {
                    console.log('Enemy: Death animation completed, destroying');
                    // Награда за убийство
                    const coinsReward = 5;
                    this.scene.coinsCollected = (this.scene.coinsCollected || 0) + coinsReward;
                    if (this.scene.coinText) {
                        this.scene.coinText.setText(this.scene.coinsCollected);
                    }
                    console.log(`Enemy: Awarded ${coinsReward} coins, total=${this.scene.coinsCollected}`);
                    // Обновляем цвет кнопки в меню, если оно открыто
                    if (this.scene.upgradeMenu && this.scene.upgradeMenu.isOpen) {
                        this.scene.upgradeMenu.updateButtonColor();
                    }
                    this.scene.time.delayedCall(500, () => {
                        this.scene.resumeGame();
                        this.sprite.destroy();
                    });
                });
            } catch (e) {
                console.error('Enemy: Error playing death animation', e);
                // Награда даже при ошибке анимации
                const coinsReward = 5;
                this.scene.coinsCollected = (this.scene.coinsCollected || 0) + coinsReward;
                if (this.scene.coinText) {
                    this.scene.coinText.setText(this.scene.coinsCollected);
                }
                console.log(`Enemy: Awarded ${coinsReward} coins, total=${this.scene.coinsCollected}`);
                if (this.scene.upgradeMenu && this.scene.upgradeMenu.isOpen) {
                    this.scene.upgradeMenu.updateButtonColor();
                }
                this.scene.resumeGame();
                this.sprite.destroy();
            }
        } else {
            try {
                this.sprite.anims.play('boar_hit', true);
                console.log('Enemy: Hit animation started');
                this.sprite.on('animationcomplete', () => {
                    if (this.isAlive) {
                        this.sprite.anims.play('boar_idle', true);
                        console.log('Enemy: Returned to idle animation');
                    }
                });
            } catch (e) {
                console.error('Enemy: Error playing hit animation', e);
            }
        }
    }

    destroy() {
        if (this.sprite) {
            this.sprite.destroy();
            console.log('Enemy: Destroyed');
        }
    }
}