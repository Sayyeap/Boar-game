export function initTelegramWebApp() {
    const tg = window.Telegram?.WebApp;
    if (!tg) {
        console.error('Telegram WebApp not available');
        return;
    }

    tg.ready();
    console.log('Telegram: WebApp initialized');

    // Запрос полноэкранного режима
    if (tg.requestFullscreen && tg.requestFullscreen.isAvailable()) {
        tg.requestFullscreen();
        console.log('Telegram: Fullscreen requested');
    } else {
        console.warn('Telegram: Fullscreen not supported');
    }

    // Блокировка ориентации (опционально, если нужна только ландшафтная)
    if (tg.lockOrientation) {
        tg.lockOrientation('landscape');
        console.log('Telegram: Orientation locked to landscape');
    }

    // Адаптация к безопасной области (safe area)
    tg.onEvent('safeAreaChanged', () => {
        console.log('Telegram: Safe area changed', tg.safeAreaInset);
    });

    // Обработка активации/деактивации
    tg.onEvent('fullscreenChanged', () => {
        console.log('Telegram: Fullscreen state:', tg.isFullscreen);
    });

    return tg;
}