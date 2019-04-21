import { createHash, randomBytes } from 'crypto';
import { promisify } from 'util';
const randomBytesPromise = promisify(randomBytes);

/**
 * Generate random token.
 */

export const GenerateRandomToken = async () => {
  const bytesSize = 256;
  const buffer = await randomBytesPromise(bytesSize);

  return createHash('sha1')
    .update(buffer)
    .digest('hex');
};
