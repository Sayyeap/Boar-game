class Background {
    constructor(scene) {
        this.scene = scene;
        this.groundHeight = 178 * 2; // 356px
        this.groundSprites = [];
        this.skyboxSprites = [];
        this.groundSpeed = 1; // px/кадр
        this.skyboxSpeed = 0.5; // px/кадр
        this.isMoving = true;
    }

    create() {
        // Скайбокс
        const skyboxScale = Math.max(1, this.scene.cameras.main.height / 639);
        const skyboxWidth = 480 * skyboxScale;
        this.skyboxSprites.push(
            this.scene.add.sprite(0, this.scene.cameras.main.height, 'skybox')
                .setOrigin(0, 1)
                .setScale(skyboxScale)
                .setDepth(-10)
        );
        this.skyboxSprites.push(
            this.scene.add.sprite(skyboxWidth, this.scene.cameras.main.height, 'skybox')
                .setOrigin(0, 1)
                .setScale(skyboxScale)
                .setDepth(-10)
        );
        this.skyboxSprites.push(
            this.scene.add.sprite(skyboxWidth * 2, this.scene.cameras.main.height, 'skybox')
                .setOrigin(0, 1)
                .setScale(skyboxScale)
                .setDepth(-10)
        );

        // Земля
        const groundScale = 2;
        const groundWidth = 1935 * groundScale;
        this.groundSprites.push(
            this.scene.add.sprite(0, this.scene.cameras.main.height, 'ground')
                .setOrigin(0, 1)
                .setScale(groundScale)
                .setDepth(-5)
        );
        this.groundSprites.push(
            this.scene.add.sprite(groundWidth, this.scene.cameras.main.height, 'ground')
                .setOrigin(0, 1)
                .setScale(groundScale)
                .setDepth(-5)
        );
        this.groundSprites.push(
            this.scene.add.sprite(groundWidth * 2, this.scene.cameras.main.height, 'ground')
                .setOrigin(0, 1)
                .setScale(groundScale)
                .setDepth(-5)
        );

        this.groundWidth = groundWidth;
        this.skyboxWidth = skyboxWidth;
    }

    update() {
        if (!this.isMoving) return;

        // Двигаем влево
        this.groundSprites.forEach(sprite => sprite.x -= this.groundSpeed);
        this.skyboxSprites.forEach(sprite => sprite.x -= this.skyboxSpeed);

        // Цикл земли
        this.groundSprites.forEach(sprite => {
            if (sprite.x <= -this.groundWidth) {
                const maxX = Math.max(...this.groundSprites.map(s => s.x));
                sprite.x = maxX + this.groundWidth;
            }
        });

        // Цикл скайбокса
        this.skyboxSprites.forEach(sprite => {
            if (sprite.x <= -this.skyboxWidth) {
                const maxX = Math.max(...this.skyboxSprites.map(s => s.x));
                sprite.x = maxX + this.skyboxWidth;
            }
        });
    }

    stop() {
        this.isMoving = false;
        console.log('Background: Stopped');
    }

    resume() {
        this.isMoving = true;
        console.log('Background: Resumed');
    }

    resize(newWidth, newHeight) {
        const skyboxScale = Math.max(1, newHeight / 639);
        const skyboxWidth = 480 * skyboxScale;
        this.skyboxSprites[0].setPosition(0, newHeight).setScale(skyboxScale);
        this.skyboxSprites[1].setPosition(skyboxWidth, newHeight).setScale(skyboxScale);
        this.skyboxSprites[2].setPosition(skyboxWidth * 2, newHeight).setScale(skyboxScale);

        this.groundSprites[0].setPosition(0, newHeight);
        this.groundSprites[1].setPosition(this.groundWidth, newHeight);
        this.groundSprites[2].setPosition(this.groundWidth * 2, newHeight);

        this.skyboxWidth = skyboxWidth;
    }
}