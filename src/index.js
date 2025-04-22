// Конфигурация Phaser
const config = {
    type: Phaser.CANVAS, // Для снижения лагов
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    pixelArt: true,
    antialias: false,
    roundPixels: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }, // Глобальная гравитация отключена
            debug: false
        }
    },
    scene: [MainScene]
};

const game = new Phaser.Game(config);

// Отладка FPS
game.events.on('postupdate', (time, delta) => {
    console.log('Game Loop FPS:', 1000 / delta);
});