// javascript (closure) port (c) 2017 David Sanders (dsanders11@ucsbalum.com)
/*
 * Copyright 2008 ZXing authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

goog.provide('w69b.ResultMetadataType');

/**
 * Represents some type of metadata about the result of the decoding that the
 * decoder wishes to communicate back to the caller.
 * @enum {number}
 */
w69b.ResultMetadataType = {
  OTHER: 0,
  ORIENTATION: 1,
  BYTE_SEGMENTS: 2,
  ERROR_CORRECTION_LEVEL: 3,
  STRUCTURED_APPEND_SEQUENCE: 4,
  STRUCTURED_APPEND_PARITY: 5
};
