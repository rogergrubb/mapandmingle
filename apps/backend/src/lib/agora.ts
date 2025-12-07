import crypto from 'crypto';

const AGORA_APP_ID = process.env.AGORA_APP_ID || 'bf73899dfa1d43ec880e01ab1fe9f64d';
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || '';

// Role constants
const RtcRole = {
  PUBLISHER: 1,
  SUBSCRIBER: 2,
};

// Privilege constants
const Privileges = {
  kJoinChannel: 1,
  kPublishAudioStream: 2,
  kPublishVideoStream: 3,
  kPublishDataStream: 4,
};

function generateAccessToken(
  appId: string,
  appCertificate: string,
  channelName: string,
  uid: string | number,
  role: number,
  privilegeExpiredTs: number
): string {
  // If no certificate, return just the app ID (testing mode)
  if (!appCertificate) {
    return '';
  }

  const version = '007';
  const salt = crypto.randomInt(1, 99999999);
  const ts = Math.floor(Date.now() / 1000);
  const expiredTs = privilegeExpiredTs;

  // Build message
  const uidStr = String(uid);
  const message: Record<number, number> = {};
  
  if (role === RtcRole.PUBLISHER) {
    message[Privileges.kJoinChannel] = expiredTs;
    message[Privileges.kPublishAudioStream] = expiredTs;
    message[Privileges.kPublishVideoStream] = expiredTs;
    message[Privileges.kPublishDataStream] = expiredTs;
  } else {
    message[Privileges.kJoinChannel] = expiredTs;
  }

  // Pack message
  const messageBuffer = packMessage(message);
  
  // Build content
  const content = Buffer.concat([
    packString(appId),
    packUint32(ts),
    packUint32(salt),
    packUint32(expiredTs),
    packUint32(messageBuffer.length),
    messageBuffer,
  ]);

  // Sign
  const signature = crypto
    .createHmac('sha256', appCertificate)
    .update(Buffer.concat([
      packString(appId),
      packString(channelName),
      packString(uidStr),
      content,
    ]))
    .digest();

  // Combine
  const token = Buffer.concat([
    packString(version),
    packString(appId),
    signature,
    content,
  ]);

  return token.toString('base64');
}

function packUint16(value: number): Buffer {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16LE(value);
  return buffer;
}

function packUint32(value: number): Buffer {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(value);
  return buffer;
}

function packString(value: string): Buffer {
  const strBuffer = Buffer.from(value, 'utf-8');
  return Buffer.concat([packUint16(strBuffer.length), strBuffer]);
}

function packMessage(message: Record<number, number>): Buffer {
  const items: Buffer[] = [];
  const keys = Object.keys(message).map(Number).sort((a, b) => a - b);
  
  items.push(packUint16(keys.length));
  
  for (const key of keys) {
    items.push(packUint16(key));
    items.push(packUint32(message[key]));
  }
  
  return Buffer.concat(items);
}

// Simple RTC token generator for Agora
// For production, use the official agora-access-token package
export function generateRtcToken(
  channelName: string,
  uid: string | number,
  role: 'publisher' | 'subscriber' = 'publisher',
  expirationTimeInSeconds: number = 3600
): { token: string; appId: string } {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
  
  const rtcRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
  
  const token = generateAccessToken(
    AGORA_APP_ID,
    AGORA_APP_CERTIFICATE,
    channelName,
    uid,
    rtcRole,
    privilegeExpiredTs
  );

  return {
    token,
    appId: AGORA_APP_ID,
  };
}

export function getAppId(): string {
  return AGORA_APP_ID;
}
