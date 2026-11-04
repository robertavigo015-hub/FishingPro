import { W, H } from './data';
import { initTelegram } from './telegram';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { FishingScene } from './scenes/FishingScene';
import { ShopScene } from './scenes/ShopScene';
import { FishopediaScene } from './scenes/FishopediaScene';

initTelegram();

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#0b2236',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: W,
    height: H,
  },
  input: { activePointers: 3 },
  render: { antialias: true },
  scene: [BootScene, MenuScene, FishingScene, ShopScene, FishopediaScene],
});
