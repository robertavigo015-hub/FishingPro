import { W, H } from '../data';
import { loadSave } from '../save';
import { makeTextures } from '../textures';
import { txt } from '../ui';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }
  create(): void {
    txt(this, W / 2, H / 2, 'Готовим снасти…', 36).setOrigin(0.5);
    makeTextures(this);
    loadSave().then(() => this.scene.start('Menu'));
  }
}
