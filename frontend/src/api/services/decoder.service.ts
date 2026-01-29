/**
 * Decoder API Service
 *
 * @description Encoding/decoding and validation endpoints
 * @author Lead Engineer
 */

import { apiClient } from '../client';
import type {
  DecodeResult,
  ValidationResult,
  DecodeRequest,
  EncodeRequest,
  ValidateAttemptRequest,
} from '@/types/api.types';

export const decoderService = {
  /**
   * Decode encrypted pattern to text
   */
  decode: (data: DecodeRequest) =>
    apiClient.post<DecodeResult>('/decoder/decode', data),

  /**
   * Encode text to symbols
   */
  encode: (data: EncodeRequest) =>
    apiClient.post<DecodeResult>('/decoder/encode', data),

  /**
   * Validate user's decode attempt
   */
  validate: (data: ValidateAttemptRequest) =>
    apiClient.post<ValidationResult>('/decoder/validate', data, true),

  /**
   * Get default symbol map
   */
  getSymbolMap: () =>
    apiClient.get<Record<string, string>>('/decoder/symbol-map'),
};
