/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ColoringPicture } from './types';
import { HomeScreen } from './screens/HomeScreen';
import { ColoringScreen } from './screens/ColoringScreen';
import { FreeDrawScreen } from './screens/FreeDrawScreen';
import { requestWakeLock, releaseWakeLock } from './platform/capabilities';

type ScreenState =
  | { type: 'home' }
  | { type: 'coloring'; picture: ColoringPicture }
  | { type: 'freedraw' };

export default function App() {
  const [screen, setScreen] = useState<ScreenState>({ type: 'home' });

  // Manage wake lock during active play
  useEffect(() => {
    if (screen.type !== 'home') {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }
    return () => {
      releaseWakeLock();
    };
  }, [screen.type]);

  return (
    <div className="h-full w-full overflow-hidden bg-[#FFFDF9]">
      {screen.type === 'coloring' && (
        <ColoringScreen
          picture={screen.picture}
          onHomeClick={() => setScreen({ type: 'home' })}
        />
      )}
      {screen.type === 'freedraw' && (
        <FreeDrawScreen
          onHomeClick={() => setScreen({ type: 'home' })}
        />
      )}
      {screen.type === 'home' && (
        <HomeScreen
          onSelectPicture={(picture) => setScreen({ type: 'coloring', picture })}
          onOpenFreeDraw={() => setScreen({ type: 'freedraw' })}
        />
      )}
    </div>
  );
}
