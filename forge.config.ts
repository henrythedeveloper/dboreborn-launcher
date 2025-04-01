import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import path from 'path';
import sevenBin from '7zip-bin';

// Get the path to 7zip binaries from the package
const sevenZipExe = sevenBin.path7za;
const sevenZipDir = path.dirname(sevenZipExe);

const config: ForgeConfig = {
  packagerConfig: {
    asar: false,  // Disable asar temporarily for debugging
    extraResource: [
      // Copy 7zip binaries directly
      sevenZipExe
    ],
    // Don't ignore any node_modules to ensure all dependencies are included
    ignore: [
      "node_modules/.bin",
      "node_modules/.pnpm",
      ".git",
      "out",
      ".vite"
    ]
  },
  rebuildConfig: {
    // Force rebuild native modules
    force: true,
    // Specify modules to rebuild
    onlyModules: ['node-7z']
  },
  makers: [
    new MakerSquirrel({}),
    new MakerZIP({}, ['darwin']),
    new MakerRpm({}),
    new MakerDeb({})
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: 'src/main.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: false,
      [FuseV1Options.OnlyLoadAppFromAsar]: false,
    }),
  ],
};

// Log the 7zip path for debugging
console.log('7zip binary path:', sevenZipExe);
console.log('7zip directory path:', sevenZipDir);

export default config;
