/*
 * 전면 광고.
 *
 * 웹의 Google AdSense 를 대체한다. 체크리스트가 요구하는 것들:
 *   - 광고는 사전 로딩하고, 예상 못한 타이밍에 띄우지 않는다
 *   - 광고가 재생되는 동안 미니앱 음악은 일시 정지된다
 *   - dismissed / failedToShow 뒤에는 반드시 다시 load 한다
 *
 * 그래서 show() 는 "이미 로드된 광고가 있을 때만" 뜨고, 없으면 조용히 false 를
 * 돌려준다. 광고를 기다리느라 사용자를 세워두지 않는다.
 */

import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/web-framework';
import { AD_GROUP_ID } from '../config.js';
import * as audio from './audio.js';

let supported = false;
let loaded = false;
let unregister = null;

export function isReady() {
  return supported && loaded;
}

export function init() {
  if (!AD_GROUP_ID) return; // 콘솔에 광고 지면을 만들기 전까지는 꺼둔다.
  try {
    supported = loadFullScreenAd.isSupported();
  } catch {
    supported = false;
  }
  if (supported) preload();
}

function preload() {
  if (!supported || !AD_GROUP_ID) return;
  loaded = false;
  try {
    unregister = loadFullScreenAd({
      options: { adGroupId: AD_GROUP_ID },
      onEvent: (event) => {
        if (event?.type === 'loaded') loaded = true;
      },
      onError: () => {
        loaded = false;
      },
    });
  } catch {
    supported = false;
  }
}

/**
 * 로드된 광고를 띄운다. 광고가 없으면 아무것도 하지 않고 false.
 * @returns {Promise<{shown:boolean, rewarded:boolean}>}
 */
export function show() {
  if (!isReady()) return Promise.resolve({ shown: false, rewarded: false });

  return new Promise((resolve) => {
    const releaseAudio = audio.suspend();
    let rewarded = false;
    let done = false;

    const finish = (result) => {
      if (done) return;
      done = true;
      releaseAudio();
      loaded = false;
      preload(); // dismissed/failedToShow 뒤에는 반드시 다시 로드한다.
      resolve(result);
    };

    try {
      showFullScreenAd({
        options: { adGroupId: AD_GROUP_ID },
        onEvent: (event) => {
          switch (event?.type) {
            case 'userEarnedReward':
              rewarded = true;
              break;
            case 'dismissed':
              finish({ shown: true, rewarded });
              break;
            case 'failedToShow':
              finish({ shown: false, rewarded: false });
              break;
            default:
              break;
          }
        },
        onError: () => finish({ shown: false, rewarded: false }),
      });
    } catch {
      finish({ shown: false, rewarded: false });
    }
  });
}

export function dispose() {
  try {
    unregister?.();
  } catch {
    /* 이미 해제된 경우 */
  }
  unregister = null;
}
