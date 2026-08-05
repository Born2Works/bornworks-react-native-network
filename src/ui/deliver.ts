import { Share } from 'react-native';

export type DeliveryResult = 'copied' | 'shared' | 'failed';

/**
 * react-native still exports Clipboard in 0.80, just deprecated, so reaching
 * for it keeps Binar free of native dependencies — a debug tool that forces
 * consumers to install and link a module is a debug tool people skip. The
 * getter warns once when first touched, which is why it is only touched when
 * someone actually taps Copy.
 */
function clipboard(): { setString(text: string): void } | null {
  try {
    const rn = require('react-native');
    return typeof rn?.Clipboard?.setString === 'function' ? rn.Clipboard : null;
  } catch {
    return null;
  }
}

/** Put `text` on the clipboard, falling back to the system share sheet. */
export async function copyOrShare(text: string, title: string): Promise<DeliveryResult> {
  const cb = clipboard();
  if (cb) {
    try {
      cb.setString(text);
      return 'copied';
    } catch {
      // fall through to Share
    }
  }
  return shareText(text, title);
}

/**
 * The share sheet is the better route for a 40 KB dump anyway: it reaches
 * notes, chat and cloud storage directly, where a clipboard paste on a phone
 * usually does not.
 */
export async function shareText(text: string, title: string): Promise<DeliveryResult> {
  try {
    await Share.share({ message: text, title });
    return 'shared';
  } catch {
    return 'failed';
  }
}
