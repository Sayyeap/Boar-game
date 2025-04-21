const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 5000 }, // Гравитация для прыжка
            debug: false
        }
    },
    scene: [MainScene]
};

const game = new Phaser.Game(config);