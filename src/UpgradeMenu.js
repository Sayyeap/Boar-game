class UpgradeMenu {
    constructor(scene) {
        this.scene = scene;
        this.isOpen = false;
        this.upgradeLevel = 1;
        this.upgradeCost = 10;
        this.container = null;
        this.upgradeButton = null;
    }

    create() {
        // Создаём элементы только при открытии
    }

    updateButtonColor() {
        if (this.upgradeButton) {
            const canAfford = this.scene.coinsCollected >= this.upgradeCost;
            this.upgradeButton.setTexture(canAfford ? 'upgradeGreen' : 'upgradeRed');
            console.log(`UpgradeMenu: Button color updated to ${canAfford ? 'green' : 'red'}, coins=${this.scene.coinsCollected}, cost=${this.upgradeCost}`);
        }
    }

    open() {
        if (this.isOpen) return;
        this.isOpen = true;

        // Включаем приоритет обработки событий для меню
        this.scene.input.setPollAlways();
        console.log('UpgradeMenu: Opened, input polling set to menu');

        // Фон книги
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        this.container = this.scene.add.container(0, 0).setDepth(15);

        // Прозрачный фон для перехвата кликов
        const bg = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0)
            .setOrigin(0)
            .setInteractive()
            .setDepth(14)
            .on('pointerdown', (pointer, localX, localY, event) => {
                event.stopPropagation();
                console.log('UpgradeMenu: Background click intercepted');
            });
        this.container.add(bg);
        console.log('UpgradeMenu: Click-blocking background added');

        const book = this.scene.add.image(width / 2, 60 + (height - 60) / 2, 'book')
            .setOrigin(0.5)
            .setDisplaySize(width, height - 60)
            .setAlpha(0.9)
            .setDepth(15);
        console.log(`UpgradeMenu: Book at y=${book.y}, displayHeight=${book.displayHeight}`);
        this.container.add(book);

        // Навык: Coin Value
        const skillY = 60 + 100 + 60; // y=220
        const margin = 20; // Отступ слева и справа
        const iconHeight = 60; // Предполагаемая высота иконки
        const icon = this.scene.add.image(margin, skillY, 'coinValueIcon')
            .setOrigin(0, 0.5) // Центр иконки по y
            .setDepth(15);
        console.log(`UpgradeMenu: Icon at x=${margin}, y=${skillY}, height=${iconHeight}`);

        // Текст, выровненный по центру иконки
        const textX = margin + icon.width + 20; // Отступ от иконки
        const name = this.scene.add.text(textX, skillY, 'Coin Value', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '15px',
            color: '#FFFFFF'
        }).setStroke('#000000', 3)
          .setOrigin(0, 0.5) // Центр по y
          .setDepth(15);
        const level = this.scene.add.text(textX, skillY + 30, `Level ${this.upgradeLevel}`, {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '12px',
            color: '#FFFFFF'
        }).setStroke('#000000', 3)
          .setOrigin(0, 0.5) // Центр по y
          .setDepth(15);
        this.container.add([icon, name, level]);

        // Кнопка прокачки
        const canAfford = this.scene.coinsCollected >= this.upgradeCost;
        const buttonKey = canAfford ? 'upgradeGreen' : 'upgradeRed';
        this.upgradeButton = this.scene.add.image(width - margin, skillY, buttonKey)
            .setOrigin(1, 0.5) // Центр по y
            .setDisplaySize(iconHeight * 2, iconHeight) // Высота = высота иконки
            .setInteractive()
            .setDepth(16)
            .on('pointerdown', (pointer, localX, localY, event) => {
                event.stopPropagation();
                this.upgradeSkill();
                console.log('UpgradeMenu: Upgrade button clicked');
            });
        const costText = this.scene.add.text(width - margin - iconHeight - 10, skillY, `${this.upgradeCost}`, {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '16px',
            color: '#FFFFFF'
        }).setStroke('#000000', 3)
          .setOrigin( 0.3, 0.7) // Центр по y
          .setDepth(15);
        this.container.add([this.upgradeButton, costText]);
        console.log(`UpgradeMenu: Button at x=${width - margin}, y=${skillY}, height=${iconHeight}`);

        // Крестик (закрытие)
        this.closeButton = this.scene.add.image(width / 2, height - 50, 'close')
            .setOrigin(0.5)
            .setInteractive()
            .setDepth(16)
            .on('pointerdown', (pointer, localX, localY, event) => {
                event.stopPropagation();
                this.close();
                console.log('UpgradeMenu: Close button clicked');
            });
        this.container.add(this.closeButton);

        // Убедимся, что цвет кнопки актуален
        this.updateButtonColor();
        console.log('UpgradeMenu: Opened');
    }

    close() {
        if (!this.isOpen) return;
        this.isOpen = false;

        // Отключаем приоритет обработки событий
        this.scene.input.setPollAlways(false);
        console.log('UpgradeMenu: Input polling reset');

        this.container.destroy();
        this.container = null;
        this.upgradeButton = null;
        console.log('UpgradeMenu: Closed');
    }

    upgradeSkill() {
        if (this.scene.coinsCollected >= this.upgradeCost) {
            this.scene.coinsCollected -= this.upgradeCost;
            this.scene.coinText.setText(this.scene.coinsCollected);
            this.upgradeLevel++;
            this.scene.upgradeCoinValue(this.upgradeLevel);
            this.upgradeCost *= 2;

            // Обновляем UI
            const skillY = 60 + 100 + 60;
            const width = this.scene.cameras.main.width;
            const margin = 20;
            const iconHeight = 60;
            this.container.getAll().forEach(child => {
                if (child.type === 'Text' && child.y === skillY + 30) {
                    child.setText(`Level ${this.upgradeLevel}`);
                }
                if (child.type === 'Text' && child.y === skillY && child.x === width - margin - iconHeight - 10) {
                    child.setText(`${this.upgradeCost}`);
                }
            });

            // Обновляем цвет кнопки
            this.updateButtonColor();
            console.log('UpgradeMenu: Coin value upgraded to level ' + this.upgradeLevel);
        } else {
            console.log('UpgradeMenu: Not enough coins for upgrade');
        }
    }
}