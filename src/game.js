const config = {
    type: Phaser.CANVAS,
    width: window.innerWidth,
    height: window.innerHeight,
     fps: {
        target: 60,
        forceSetTimeOut: true // Принудительный таймер для Chrome
    },
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