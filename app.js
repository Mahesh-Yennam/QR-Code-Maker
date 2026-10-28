/**
 * Instant QR Code Maker Pro — Gamility Tools
 * 100% Client-Side QR Matrix Generator & Vector Exporter
 * Copyright © 2026 Gamility. All rights reserved.
 */

(() => {
  'use strict';

  // ==========================================================================
  // EMBEDDED STANDALONE QR CODE ENGINE (ISO/IEC 18004)
  // Zero external dependencies, 100% client-side memory execution
  // ==========================================================================

  const QRMode = { MODE_NUMBER: 1, MODE_ALPHA_NUM: 2, MODE_8BIT_BYTE: 4, MODE_KANJI: 8 };
  const QRErrorCorrectLevel = { L: 1, M: 0, Q: 3, H: 2 };
  const QRMaskPattern = { PATTERN000: 0, PATTERN001: 1, PATTERN010: 2, PATTERN011: 3, PATTERN100: 4, PATTERN101: 5, PATTERN110: 6, PATTERN111: 7 };

  const QRUtil = {
    PATTERN_POSITION_TABLE: [
      [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
      [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50], [6, 30, 54],
      [6, 32, 58], [6, 34, 62], [6, 26, 46, 66], [6, 26, 48, 70], [6, 26, 50, 74],
      [6, 30, 54, 78], [6, 30, 56, 82], [6, 30, 58, 86], [6, 34, 62, 90], [6, 28, 50, 72, 94],
      [6, 26, 50, 74, 98], [6, 30, 54, 78, 102], [6, 28, 54, 80, 106], [6, 32, 58, 84, 110],
      [6, 30, 58, 86, 114], [6, 34, 62, 90, 118], [6, 26, 50, 74, 98, 122], [6, 30, 54, 78, 102, 126],
      [6, 26, 52, 78, 104, 130], [6, 30, 56, 82, 108, 134], [6, 34, 60, 86, 112, 138],
      [6, 30, 58, 86, 114, 142], [6, 34, 62, 90, 118, 146], [6, 30, 54, 78, 102, 126, 150],
      [6, 24, 50, 76, 102, 128, 154], [6, 28, 54, 80, 106, 132, 158], [6, 32, 58, 84, 110, 136, 162],
      [6, 26, 54, 82, 110, 138, 166], [6, 30, 58, 86, 114, 142, 170]
    ],
    G15: (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0),
    G18: (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0),
    G15_MASK: (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1),

    getBCHTypeInfo(data) {
      let d = data << 10;
      while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) >= 0) {
        d ^= (QRUtil.G15 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15)));
      }
      return ((data << 10) | d) ^ QRUtil.G15_MASK;
    },
    getBCHTypeNumber(data) {
      let d = data << 12;
      while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18) >= 0) {
        d ^= (QRUtil.G18 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18)));
      }
      return (data << 12) | d;
    },
    getBCHDigit(data) {
      let digit = 0;
      while (data !== 0) {
        digit++;
        data >>>= 1;
      }
      return digit;
    },
    getPatternPosition(typeNumber) {
      return QRUtil.PATTERN_POSITION_TABLE[typeNumber - 1];
    },
    getMask(maskPattern, i, j) {
      switch (maskPattern) {
        case QRMaskPattern.PATTERN000: return (i + j) % 2 === 0;
        case QRMaskPattern.PATTERN001: return i % 2 === 0;
        case QRMaskPattern.PATTERN010: return j % 3 === 0;
        case QRMaskPattern.PATTERN011: return (i + j) % 3 === 0;
        case QRMaskPattern.PATTERN100: return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0;
        case QRMaskPattern.PATTERN101: return (i * j) % 2 + (i * j) % 3 === 0;
        case QRMaskPattern.PATTERN110: return ((i * j) % 2 + (i * j) % 3) % 2 === 0;
        case QRMaskPattern.PATTERN111: return ((i * j) % 3 + (i + j) % 2) % 2 === 0;
        default: throw new Error("bad maskPattern:" + maskPattern);
      }
    },
    getErrorFactory(errorCorrectLevel) {
      switch (errorCorrectLevel) {
        case QRErrorCorrectLevel.L: return 1;
        case QRErrorCorrectLevel.M: return 0;
        case QRErrorCorrectLevel.Q: return 3;
        case QRErrorCorrectLevel.H: return 2;
        default: return 0;
      }
    },
    getLengthInBits(mode, type) {
      if (1 <= type && type < 10) {
        switch (mode) {
          case QRMode.MODE_NUMBER: return 10;
          case QRMode.MODE_ALPHA_NUM: return 9;
          case QRMode.MODE_8BIT_BYTE: return 8;
          case QRMode.MODE_KANJI: return 8;
          default: throw new Error("mode:" + mode);
        }
      } else if (type < 27) {
        switch (mode) {
          case QRMode.MODE_NUMBER: return 12;
          case QRMode.MODE_ALPHA_NUM: return 11;
          case QRMode.MODE_8BIT_BYTE: return 16;
          case QRMode.MODE_KANJI: return 10;
          default: throw new Error("mode:" + mode);
        }
      } else if (type < 41) {
        switch (mode) {
          case QRMode.MODE_NUMBER: return 14;
          case QRMode.MODE_ALPHA_NUM: return 13;
          case QRMode.MODE_8BIT_BYTE: return 16;
          case QRMode.MODE_KANJI: return 12;
          default: throw new Error("mode:" + mode);
        }
      } else {
        throw new Error("type:" + type);
      }
    },
    getLostPoint(qrCode) {
      const moduleCount = qrCode.getModuleCount();
      let lostPoint = 0;
      // LEVEL1
      for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
          let sameCount = 0;
          const dark = qrCode.isDark(row, col);
          for (let r = -1; r <= 1; r++) {
            if (row + r < 0 || moduleCount <= row + r) continue;
            for (let c = -1; c <= 1; c++) {
              if (col + c < 0 || moduleCount <= col + c) continue;
              if (r === 0 && c === 0) continue;
              if (dark === qrCode.isDark(row + r, col + c)) sameCount++;
            }
          }
          if (sameCount > 5) lostPoint += (3 + sameCount - 5);
        }
      }
      // LEVEL2
      for (let row = 0; row < moduleCount - 1; row++) {
        for (let col = 0; col < moduleCount - 1; col++) {
          let count = 0;
          if (qrCode.isDark(row, col)) count++;
          if (qrCode.isDark(row + 1, col)) count++;
          if (qrCode.isDark(row, col + 1)) count++;
          if (qrCode.isDark(row + 1, col + 1)) count++;
          if (count === 0 || count === 4) lostPoint += 3;
        }
      }
      // LEVEL3
      for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount - 6; col++) {
          if (qrCode.isDark(row, col) &&
            !qrCode.isDark(row, col + 1) &&
            qrCode.isDark(row, col + 2) &&
            qrCode.isDark(row, col + 3) &&
            qrCode.isDark(row, col + 4) &&
            !qrCode.isDark(row, col + 5) &&
            qrCode.isDark(row, col + 6)) {
            lostPoint += 40;
          }
        }
      }
      for (let col = 0; col < moduleCount; col++) {
        for (let row = 0; row < moduleCount - 6; row++) {
          if (qrCode.isDark(row, col) &&
            !qrCode.isDark(row + 1, col) &&
            qrCode.isDark(row + 2, col) &&
            qrCode.isDark(row + 3, col) &&
            qrCode.isDark(row + 4, col) &&
            !qrCode.isDark(row + 5, col) &&
            qrCode.isDark(row + 6, col)) {
            lostPoint += 40;
          }
        }
      }
      // LEVEL4
      let darkCount = 0;
      for (let col = 0; col < moduleCount; col++) {
        for (let row = 0; row < moduleCount; row++) {
          if (qrCode.isDark(row, col)) darkCount++;
        }
      }
      const ratio = Math.abs((100 * darkCount / moduleCount / moduleCount) - 50) / 5;
      lostPoint += ratio * 10;
      return lostPoint;
    }
  };

  // Math GF(256)
  const QRMath = {
    glog(n) {
      if (n < 1) throw new Error("glog(" + n + ")");
      return QRMath.LOG_TABLE[n];
    },
    gexp(n) {
      while (n < 0) n += 255;
      while (n >= 255) n -= 255;
      return QRMath.EXP_TABLE[n];
    },
    EXP_TABLE: new Array(256),
    LOG_TABLE: new Array(256)
  };
  for (let i = 0; i < 8; i++) QRMath.EXP_TABLE[i] = 1 << i;
  for (let i = 8; i < 256; i++) QRMath.EXP_TABLE[i] = QRMath.EXP_TABLE[i - 4] ^ QRMath.EXP_TABLE[i - 5] ^ QRMath.EXP_TABLE[i - 6] ^ QRMath.EXP_TABLE[i - 8];
  for (let i = 0; i < 255; i++) QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]] = i;

  function QRPolynomial(num, shift) {
    if (num.length === undefined) throw new Error(num.length + "/" + shift);
    let offset = 0;
    while (offset < num.length && num[offset] === 0) offset++;
    this.num = new Array(num.length - offset + shift);
    for (let i = 0; i < num.length - offset; i++) this.num[i] = num[i + offset];
  }
  QRPolynomial.prototype = {
    get(index) { return this.num[index]; },
    getLength() { return this.num.length; },
    multiply(e) {
      const num = new Array(this.getLength() + e.getLength() - 1);
      for (let i = 0; i < this.getLength(); i++) {
        for (let j = 0; j < e.getLength(); j++) {
          num[i + j] ^= QRMath.gexp(QRMath.glog(this.get(i)) + QRMath.glog(e.get(j)));
        }
      }
      return new QRPolynomial(num, 0);
    },
    mod(e) {
      if (this.getLength() - e.getLength() < 0) return this;
      const ratio = QRMath.glog(this.get(0)) - QRMath.glog(e.get(0));
      const num = new Array(this.getLength());
      for (let i = 0; i < this.getLength(); i++) num[i] = this.get(i);
      for (let i = 0; i < e.getLength(); i++) num[i] ^= QRMath.gexp(QRMath.glog(e.get(i)) + ratio);
      return new QRPolynomial(num, 0).mod(e);
    }
  };

  function QRRSBlock(totalCount, dataCount) {
    this.totalCount = totalCount;
    this.dataCount = dataCount;
  }
  QRRSBlock.RS_BLOCK_TABLE = [
    // L, M, Q, H
    [1, 26, 19], [1, 26, 16], [1, 26, 13], [1, 26, 9],
    [1, 44, 34], [1, 44, 28], [1, 44, 22], [1, 44, 16],
    [1, 70, 55], [1, 70, 44], [2, 35, 17], [2, 35, 13],
    [1, 100, 80], [2, 50, 32], [2, 50, 24], [4, 25, 9],
    [1, 134, 108], [2, 67, 43], [2, 33, 15, 2, 34, 16], [2, 33, 11, 2, 34, 12],
    [2, 86, 68], [4, 43, 27], [4, 43, 19], [4, 43, 15],
    [2, 98, 78], [4, 49, 31], [2, 32, 14, 4, 33, 15], [4, 39, 13, 1, 40, 14],
    [2, 121, 97], [2, 60, 38, 2, 61, 39], [4, 40, 18, 2, 41, 19], [4, 40, 14, 2, 41, 15],
    [2, 146, 116], [3, 58, 36, 2, 59, 37], [4, 36, 16, 4, 37, 17], [4, 36, 12, 4, 37, 13],
    [2, 86, 68, 2, 87, 69], [4, 69, 43, 1, 70, 44], [6, 43, 19, 2, 44, 20], [6, 43, 15, 2, 44, 16]
  ];
  QRRSBlock.getRSBlocks = function (typeNumber, errorCorrectLevel) {
    const rsBlock = QRRSBlock.getRsBlockTable(typeNumber, errorCorrectLevel);
    if (rsBlock === undefined) throw new Error("bad rs block @ typeNumber:" + typeNumber);
    const length = rsBlock.length / 3;
    const list = [];
    for (let i = 0; i < length; i++) {
      const count = rsBlock[i * 3 + 0];
      const totalCount = rsBlock[i * 3 + 1];
      const dataCount = rsBlock[i * 3 + 2];
      for (let j = 0; j < count; j++) list.push(new QRRSBlock(totalCount, dataCount));
    }
    return list;
  };
  QRRSBlock.getRsBlockTable = function (typeNumber, errorCorrectLevel) {
    switch (errorCorrectLevel) {
      case QRErrorCorrectLevel.L: return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0];
      case QRErrorCorrectLevel.M: return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1];
      case QRErrorCorrectLevel.Q: return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2];
      case QRErrorCorrectLevel.H: return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3];
      default: return undefined;
    }
  };

  function QRBitBuffer() {
    this.buffer = [];
    this.length = 0;
  }
  QRBitBuffer.prototype = {
    get(index) {
      const bufIndex = Math.floor(index / 8);
      return ((this.buffer[bufIndex] >>> (7 - index % 8)) & 1) === 1;
    },
    put(num, length) {
      for (let i = 0; i < length; i++) this.putBit(((num >>> (length - i - 1)) & 1) === 1);
    },
    getLengthInBits() { return this.length; },
    putBit(bit) {
      const bufIndex = Math.floor(this.length / 8);
      if (this.buffer.length <= bufIndex) this.buffer.push(0);
      if (bit) this.buffer[bufIndex] |= (0x80 >>> (this.length % 8));
      this.length++;
    }
  };

  function QR8bitByte(data) {
    this.mode = QRMode.MODE_8BIT_BYTE;
    this.data = data;
    this.parsedData = [];
    // Convert utf-8
    for (let i = 0, l = this.data.length; i < l; i++) {
      const byteArray = [];
      const code = this.data.charCodeAt(i);
      if (code > 0x10000) {
        byteArray[0] = 0xF0 | ((code & 0x1C0000) >>> 18);
        byteArray[1] = 0x80 | ((code & 0x3F000) >>> 12);
        byteArray[2] = 0x80 | ((code & 0xFC0) >>> 6);
        byteArray[3] = 0x80 | (code & 0x3F);
      } else if (code > 0x800) {
        byteArray[0] = 0xE0 | ((code & 0xF000) >>> 12);
        byteArray[1] = 0x80 | ((code & 0xFC0) >>> 6);
        byteArray[2] = 0x80 | (code & 0x3F);
      } else if (code > 0x80) {
        byteArray[0] = 0xC0 | ((code & 0x7C0) >>> 6);
        byteArray[1] = 0x80 | (code & 0x3F);
      } else {
        byteArray[0] = code;
      }
      this.parsedData.push(byteArray);
    }
    this.parsedData = Array.prototype.concat.apply([], this.parsedData);
  }
  QR8bitByte.prototype = {
    getLength(buffer) { return this.parsedData.length; },
    write(buffer) {
      for (let i = 0, l = this.parsedData.length; i < l; i++) {
        buffer.put(this.parsedData[i], 8);
      }
    }
  };

  function QRCodeModel(typeNumber, errorCorrectLevel) {
    this.typeNumber = typeNumber;
    this.errorCorrectLevel = errorCorrectLevel;
    this.modules = null;
    this.moduleCount = 0;
    this.dataCache = null;
    this.dataList = [];
  }
  QRCodeModel.prototype = {
    addData(data) {
      this.dataList.push(new QR8bitByte(data));
      this.dataCache = null;
    },
    isDark(row, col) {
      if (row < 0 || this.moduleCount <= row || col < 0 || this.moduleCount <= col) {
        throw new Error(row + "," + col);
      }
      return this.modules[row][col];
    },
    getModuleCount() { return this.moduleCount; },
    make() {
      if (this.typeNumber < 1) {
        let typeNumber = 1;
        for (typeNumber = 1; typeNumber < 40; typeNumber++) {
          const rsBlocks = QRRSBlock.getRSBlocks(typeNumber, this.errorCorrectLevel);
          const buffer = new QRBitBuffer();
          let totalDataCount = 0;
          for (let i = 0; i < rsBlocks.length; i++) totalDataCount += rsBlocks[i].dataCount;
          for (let i = 0; i < this.dataList.length; i++) {
            const data = this.dataList[i];
            buffer.put(data.mode, 4);
            buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, typeNumber));
            data.write(buffer);
          }
          if (buffer.getLengthInBits() <= totalDataCount * 8) break;
        }
        this.typeNumber = typeNumber;
      }
      this.makeImpl(false, this.getBestMaskPattern());
    },
    makeImpl(test, maskPattern) {
      this.moduleCount = this.typeNumber * 4 + 17;
      this.modules = new Array(this.moduleCount);
      for (let row = 0; row < this.moduleCount; row++) {
        this.modules[row] = new Array(this.moduleCount);
        for (let col = 0; col < this.moduleCount; col++) this.modules[row][col] = null;
      }
      this.setupPositionProbePattern(0, 0);
      this.setupPositionProbePattern(this.moduleCount - 7, 0);
      this.setupPositionProbePattern(0, this.moduleCount - 7);
      this.setupPositionAdjustPattern();
      this.setupTimingPattern();
      this.setupTypeInfo(test, maskPattern);
      if (this.typeNumber >= 7) this.setupTypeNumber(test);
      if (this.dataCache == null) {
        this.dataCache = QRCodeModel.createData(this.typeNumber, this.errorCorrectLevel, this.dataList);
      }
      this.mapData(this.dataCache, maskPattern);
    },
    setupPositionProbePattern(row, col) {
      for (let r = -1; r <= 7; r++) {
        if (row + r <= -1 || this.moduleCount <= row + r) continue;
        for (let c = -1; c <= 7; c++) {
          if (col + c <= -1 || this.moduleCount <= col + c) continue;
          if ((0 <= r && r <= 6 && (c === 0 || c === 6)) ||
            (0 <= c && c <= 6 && (r === 0 || r === 6)) ||
            (2 <= r && r <= 4 && 2 <= c && c <= 4)) {
            this.modules[row + r][col + c] = true;
          } else {
            this.modules[row + r][col + c] = false;
          }
        }
      }
    },
    getBestMaskPattern() {
      let minLostPoint = 0;
      let pattern = 0;
      for (let i = 0; i < 8; i++) {
        this.makeImpl(true, i);
        const lostPoint = QRUtil.getLostPoint(this);
        if (i === 0 || minLostPoint > lostPoint) {
          minLostPoint = lostPoint;
          pattern = i;
        }
      }
      return pattern;
    },
    setupTimingPattern() {
      for (let r = 8; r < this.moduleCount - 8; r++) {
        if (this.modules[r][6] !== null) continue;
        this.modules[r][6] = (r % 2 === 0);
      }
      for (let c = 8; c < this.moduleCount - 8; c++) {
        if (this.modules[6][c] !== null) continue;
        this.modules[6][c] = (c % 2 === 0);
      }
    },
    setupPositionAdjustPattern() {
      const pos = QRUtil.getPatternPosition(this.typeNumber);
      if (!pos) return;
      for (let i = 0; i < pos.length; i++) {
        for (let j = 0; j < pos.length; j++) {
          const row = pos[i];
          const col = pos[j];
          if (this.modules[row][col] !== null) continue;
          for (let r = -2; r <= 2; r++) {
            for (let c = -2; c <= 2; c++) {
              if (r === -2 || r === 2 || c === -2 || c === 2 || (r === 0 && c === 0)) {
                this.modules[row + r][col + c] = true;
              } else {
                this.modules[row + r][col + c] = false;
              }
            }
          }
        }
      }
    },
    setupTypeNumber(test) {
      const bits = QRUtil.getBCHTypeNumber(this.typeNumber);
      for (let i = 0; i < 18; i++) {
        const mod = (!test && ((bits >> i) & 1) === 1);
        this.modules[Math.floor(i / 3)][i % 3 + this.moduleCount - 8 - 3] = mod;
      }
      for (let i = 0; i < 18; i++) {
        const mod = (!test && ((bits >> i) & 1) === 1);
        this.modules[i % 3 + this.moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
      }
    },
    setupTypeInfo(test, maskPattern) {
      const data = (QRUtil.getErrorFactory(this.errorCorrectLevel) << 3) | maskPattern;
      const bits = QRUtil.getBCHTypeInfo(data);
      for (let i = 0; i < 15; i++) {
        const mod = (!test && ((bits >> i) & 1) === 1);
        if (i < 6) this.modules[i][8] = mod;
        else if (i < 8) this.modules[i + 1][8] = mod;
        else this.modules[this.moduleCount - 15 + i][8] = mod;
      }
      for (let i = 0; i < 15; i++) {
        const mod = (!test && ((bits >> i) & 1) === 1);
        if (i < 8) this.modules[8][this.moduleCount - i - 1] = mod;
        else if (i < 9) this.modules[8][15 - i - 1 + 1] = mod;
        else this.modules[8][15 - i - 1] = mod;
      }
      this.modules[this.moduleCount - 8][8] = (!test);
    },
    mapData(data, maskPattern) {
      let inc = -1;
      let row = this.moduleCount - 1;
      let bitIndex = 7;
      let byteIndex = 0;
      for (let col = this.moduleCount - 1; col > 0; col -= 2) {
        if (col === 6) col--;
        while (true) {
          for (let c = 0; c < 2; c++) {
            if (this.modules[row][col - c] === null) {
              let dark = false;
              if (byteIndex < data.length) dark = (((data[byteIndex] >>> bitIndex) & 1) === 1);
              const mask = QRUtil.getMask(maskPattern, row, col - c);
              if (mask) dark = !dark;
              this.modules[row][col - c] = dark;
              bitIndex--;
              if (bitIndex === -1) {
                byteIndex++;
                bitIndex = 7;
              }
            }
          }
          row += inc;
          if (row < 0 || this.moduleCount <= row) {
            row -= inc;
            inc = -inc;
            break;
          }
        }
      }
    }
  };

  QRCodeModel.createData = function (typeNumber, errorCorrectLevel, dataList) {
    const rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectLevel);
    const buffer = new QRBitBuffer();
    for (let i = 0; i < dataList.length; i++) {
      const data = dataList[i];
      buffer.put(data.mode, 4);
      buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, typeNumber));
      data.write(buffer);
    }
    let totalDataCount = 0;
    for (let i = 0; i < rsBlocks.length; i++) totalDataCount += rsBlocks[i].dataCount;
    if (buffer.getLengthInBits() > totalDataCount * 8) {
      throw new Error("code length overflow. (" + buffer.getLengthInBits() + ">" + (totalDataCount * 8) + "bit)");
    }
    if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) buffer.put(0, 4);
    while (buffer.getLengthInBits() % 8 !== 0) buffer.putBit(false);
    while (true) {
      if (buffer.getLengthInBits() >= totalDataCount * 8) break;
      buffer.put(0xEC, 8);
      if (buffer.getLengthInBits() >= totalDataCount * 8) break;
      buffer.put(0x11, 8);
    }
    return QRCodeModel.createBytes(buffer, rsBlocks);
  };

  QRCodeModel.createBytes = function (buffer, rsBlocks) {
    let offset = 0;
    let maxDcCount = 0;
    let maxEcCount = 0;
    const dcdata = new Array(rsBlocks.length);
    const ecdata = new Array(rsBlocks.length);
    for (let r = 0; r < rsBlocks.length; r++) {
      const dcCount = rsBlocks[r].dataCount;
      const ecCount = rsBlocks[r].totalCount - dcCount;
      maxDcCount = Math.max(maxDcCount, dcCount);
      maxEcCount = Math.max(maxEcCount, ecCount);
      dcdata[r] = new Array(dcCount);
      for (let i = 0; i < dcdata[r].length; i++) dcdata[r][i] = 0xFF & buffer.buffer[i + offset];
      offset += dcCount;
      const rsPoly = QRCodeModel.getErrorCorrectPolynomial(ecCount);
      const rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1);
      const modPoly = rawPoly.mod(rsPoly);
      ecdata[r] = new Array(rsPoly.getLength() - 1);
      for (let i = 0; i < ecdata[r].length; i++) {
        const modIndex = i + modPoly.getLength() - ecdata[r].length;
        ecdata[r][i] = (modIndex >= 0) ? modPoly.get(modIndex) : 0;
      }
    }
    let totalCodeCount = 0;
    for (let i = 0; i < rsBlocks.length; i++) totalCodeCount += rsBlocks[i].totalCount;
    const data = new Array(totalCodeCount);
    let index = 0;
    for (let i = 0; i < maxDcCount; i++) {
      for (let r = 0; r < rsBlocks.length; r++) {
        if (i < dcdata[r].length) data[index++] = dcdata[r][i];
      }
    }
    for (let i = 0; i < maxEcCount; i++) {
      for (let r = 0; r < rsBlocks.length; r++) {
        if (i < ecdata[r].length) data[index++] = ecdata[r][i];
      }
    }
    return data;
  };

  QRCodeModel.getErrorCorrectPolynomial = function (errorCorrectLength) {
    let a = new QRPolynomial([1], 0);
    for (let i = 0; i < errorCorrectLength; i++) {
      a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0));
    }
    return a;
  };

  // ==========================================================================
  // APPLICATION CONTROLLER
  // ==========================================================================

  // --- DOM Elements ---
  const typeTabs = document.querySelectorAll('.type-tab');
  const formPanels = document.querySelectorAll('.form-panel');

  // Input Fields
  const inpUrl = document.getElementById('inp-url');
  const inpText = document.getElementById('inp-text');

  const inpWifiSsid = document.getElementById('inp-wifi-ssid');
  const inpWifiPass = document.getElementById('inp-wifi-pass');
  const selectWifiEnc = document.getElementById('select-wifi-enc');
  const chkWifiHidden = document.getElementById('chk-wifi-hidden');

  const inpVcardFirst = document.getElementById('inp-vcard-first');
  const inpVcardLast = document.getElementById('inp-vcard-last');
  const inpVcardPhone = document.getElementById('inp-vcard-phone');
  const inpVcardEmail = document.getElementById('inp-vcard-email');
  const inpVcardCompany = document.getElementById('inp-vcard-company');
  const inpVcardTitle = document.getElementById('inp-vcard-title');

  const inpEmailTo = document.getElementById('inp-email-to');
  const inpEmailSubject = document.getElementById('inp-email-subject');
  const inpEmailBody = document.getElementById('inp-email-body');

  const inpSmsPhone = document.getElementById('inp-sms-phone');
  const inpSmsMsg = document.getElementById('inp-sms-msg');

  // Styling
  const colorFg = document.getElementById('color-fg');
  const colorBg = document.getElementById('color-bg');
  const labelFgHex = document.getElementById('label-fg-hex');
  const labelBgHex = document.getElementById('label-bg-hex');
  const themePills = document.querySelectorAll('.theme-pill');
  const selectEcl = document.getElementById('select-ecl');
  const selectMargin = document.getElementById('select-margin');

  // Quick Action Buttons
  const btnSampleData = document.getElementById('btn-sample-data');
  const btnClearData = document.getElementById('btn-clear-data');

  // Canvas & Preview
  const qrCanvas = document.getElementById('qr-canvas');
  const canvasWrapper = document.getElementById('canvas-wrapper');
  const statPayloadLen = document.getElementById('stat-payload-len');
  const statEclLabel = document.getElementById('stat-ecl-label');
  const sizeButtons = document.querySelectorAll('.size-btn');

  // Export Buttons
  const btnDownloadPng = document.getElementById('btn-download-png');
  const btnDownloadSvg = document.getElementById('btn-download-svg');
  const btnCopyImage = document.getElementById('btn-copy-image');

  // Toast
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');

  // State
  let activeType = 'url'; // 'url', 'text', 'wifi', 'vcard', 'email', 'sms'
  let exportSize = 512;
  let currentQrModel = null;
  let currentPayload = '';
  let toastTimer = null;

  // --- Toast Helper ---
  function showToast(msg) {
    if (toastTimer) clearTimeout(toastTimer);
    toastMessage.textContent = msg;
    toast.classList.add('show');
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2200);
  }

  // --- Payload Formatter ---
  function getPayload() {
    switch (activeType) {
      case 'url': {
        let val = inpUrl.value.trim();
        if (val && !/^https?:\/\//i.test(val)) {
          val = 'https://' + val;
        }
        return val || 'https://mahesh-yennam.github.io/Gamility/';
      }
      case 'text':
        return inpText.value.trim() || 'Gamility Smart Utility Portal';
      case 'wifi': {
        const ssid = inpWifiSsid.value.trim();
        const pass = inpWifiPass.value.trim();
        const enc = selectWifiEnc.value;
        const hidden = chkWifiHidden.checked;
        if (!ssid) return 'WIFI:S:Gamility_Guest;T:WPA;P:gamility2026;;';
        return `WIFI:S:${ssid};T:${enc};P:${pass};H:${hidden ? 'true' : 'false'};;`;
      }
      case 'vcard': {
        const first = inpVcardFirst.value.trim();
        const last = inpVcardLast.value.trim();
        const phone = inpVcardPhone.value.trim();
        const email = inpVcardEmail.value.trim();
        const company = inpVcardCompany.value.trim();
        const title = inpVcardTitle.value.trim();
        if (!first && !last && !phone && !email) {
          return `BEGIN:VCARD\nVERSION:3.0\nN:Smith;Alex;;;\nFN:Alex Smith\nORG:Gamility Studio\nTITLE:Platform Architect\nTEL:+1-555-019-2834\nEMAIL:alex@gamility.com\nEND:VCARD`;
        }
        return [
          'BEGIN:VCARD',
          'VERSION:3.0',
          `N:${last};${first};;;`,
          `FN:${[first, last].filter(Boolean).join(' ')}`,
          company ? `ORG:${company}` : '',
          title ? `TITLE:${title}` : '',
          phone ? `TEL:${phone}` : '',
          email ? `EMAIL:${email}` : '',
          'END:VCARD'
        ].filter(Boolean).join('\n');
      }
      case 'email': {
        const to = inpEmailTo.value.trim();
        const subj = inpEmailSubject.value.trim();
        const body = inpEmailBody.value.trim();
        if (!to) return 'mailto:support@gamility.com?subject=Inquiry&body=Hello%20Gamility%20Team';
        const params = [];
        if (subj) params.push(`subject=${encodeURIComponent(subj)}`);
        if (body) params.push(`body=${encodeURIComponent(body)}`);
        return `mailto:${to}${params.length ? '?' + params.join('&') : ''}`;
      }
      case 'sms': {
        const phone = inpSmsPhone.value.trim();
        const msg = inpSmsMsg.value.trim();
        if (!phone) return 'sms:+15550192834?body=Hello%20from%20Gamility';
        return `sms:${phone}${msg ? '?body=' + encodeURIComponent(msg) : ''}`;
      }
      default:
        return 'https://mahesh-yennam.github.io/Gamility/';
    }
  }

  // --- Render QR Code ---
  function renderQrCode() {
    currentPayload = getPayload();
    const eclLevel = selectEcl.value; // 'L', 'M', 'Q', 'H'
    const margin = parseInt(selectMargin.value, 10);
    const fg = colorFg.value;
    const bg = colorBg.value;

    labelFgHex.textContent = fg.toUpperCase();
    labelBgHex.textContent = bg.toUpperCase();

    // Update stats
    statPayloadLen.textContent = `${currentPayload.length} characters encoded`;
    statEclLabel.textContent = `ECC Level: ${eclLevel}`;

    try {
      const qr = new QRCodeModel(0, QRErrorCorrectLevel[eclLevel]);
      qr.addData(currentPayload);
      qr.make();
      currentQrModel = qr;

      const moduleCount = qr.getModuleCount();
      const previewResolution = 280;
      const totalModules = moduleCount + margin * 2;
      const cellSize = previewResolution / totalModules;

      qrCanvas.width = previewResolution;
      qrCanvas.height = previewResolution;

      const ctx = qrCanvas.getContext('2d');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, previewResolution, previewResolution);

      ctx.fillStyle = fg;
      for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
          if (qr.isDark(row, col)) {
            const x = Math.round((col + margin) * cellSize);
            const y = Math.round((row + margin) * cellSize);
            const w = Math.ceil(cellSize);
            const h = Math.ceil(cellSize);
            ctx.fillRect(x, y, w, h);
          }
        }
      }

      // Update background of canvas wrapper for visual harmony
      canvasWrapper.style.backgroundColor = bg;

    } catch (err) {
      console.error('QR Generation failed:', err);
      // If payload is too large for version limit, fallback alert
      statPayloadLen.textContent = 'Payload too large for selected ECC level';
    }
  }

  // --- High-Resolution Canvas Generator ---
  function generateHighResCanvas(targetSize) {
    if (!currentQrModel) return null;
    const qr = currentQrModel;
    const margin = parseInt(selectMargin.value, 10);
    const fg = colorFg.value;
    const bg = colorBg.value;

    const moduleCount = qr.getModuleCount();
    const totalModules = moduleCount + margin * 2;
    const cellSize = targetSize / totalModules;

    const canvas = document.createElement('canvas');
    canvas.width = targetSize;
    canvas.height = targetSize;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, targetSize, targetSize);

    ctx.fillStyle = fg;
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (qr.isDark(row, col)) {
          const x = Math.round((col + margin) * cellSize);
          const y = Math.round((row + margin) * cellSize);
          const w = Math.ceil(cellSize);
          const h = Math.ceil(cellSize);
          ctx.fillRect(x, y, w, h);
        }
      }
    }
    return canvas;
  }

  // --- SVG Vector String Generator ---
  function generateSvgString() {
    if (!currentQrModel) return '';
    const qr = currentQrModel;
    const margin = parseInt(selectMargin.value, 10);
    const fg = colorFg.value;
    const bg = colorBg.value;
    const moduleCount = qr.getModuleCount();
    const totalModules = moduleCount + margin * 2;

    let rects = '';
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (qr.isDark(row, col)) {
          rects += `<rect x="${col + margin}" y="${row + margin}" width="1" height="1" fill="${fg}" />`;
        }
      }
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalModules} ${totalModules}" width="${exportSize}" height="${exportSize}" shape-rendering="crispEdges">
  <rect width="${totalModules}" height="${totalModules}" fill="${bg}" />
  ${rects}
</svg>`;
  }

  // --- Download Handlers ---

  btnDownloadPng.addEventListener('click', () => {
    const canvas = generateHighResCanvas(exportSize);
    if (!canvas) return;

    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gamility-qr-${activeType}-${exportSize}px.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`Downloaded PNG (${exportSize}x${exportSize}px)`);
    }, 'image/png');
  });

  btnDownloadSvg.addEventListener('click', () => {
    const svgContent = generateSvgString();
    if (!svgContent) return;

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gamility-qr-${activeType}-vector.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded Scalable Vector SVG');
  });

  btnCopyImage.addEventListener('click', async () => {
    const canvas = generateHighResCanvas(exportSize);
    if (!canvas) return;

    try {
      if (navigator.clipboard && window.ClipboardItem) {
        canvas.toBlob(async blob => {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            showToast('QR Code copied to clipboard!');
          } catch (e) {
            fallbackCopyDataUrl(canvas);
          }
        }, 'image/png');
      } else {
        fallbackCopyDataUrl(canvas);
      }
    } catch (e) {
      fallbackCopyDataUrl(canvas);
    }
  });

  function fallbackCopyDataUrl(canvas) {
    const dataUrl = canvas.toDataURL('image/png');
    navigator.clipboard.writeText(dataUrl).then(() => {
      showToast('Copied QR image Base64 to clipboard!');
    }).catch(() => {
      showToast('Unable to copy directly (browser permission restricted)');
    });
  }

  // --- Sample & Clear Actions ---

  btnSampleData.addEventListener('click', () => {
    switch (activeType) {
      case 'url':
        inpUrl.value = 'https://mahesh-yennam.github.io/Gamility/games/neon-retro-arcade/index.html';
        break;
      case 'text':
        inpText.value = 'Gamility — Smart Browser Games & 100% Private Offline Utility Tools.';
        break;
      case 'wifi':
        inpWifiSsid.value = 'Cyber_Arcade_5G';
        inpWifiPass.value = 'Matrix#Secure#2026';
        selectWifiEnc.value = 'WPA';
        chkWifiHidden.checked = false;
        break;
      case 'vcard':
        inpVcardFirst.value = 'Morgan';
        inpVcardLast.value = 'Vance';
        inpVcardPhone.value = '+1 (555) 948-2041';
        inpVcardEmail.value = 'morgan.vance@gamility.com';
        inpVcardCompany.value = 'Gamility Technologies';
        inpVcardTitle.value = 'Director of Engineering';
        break;
      case 'email':
        inpEmailTo.value = 'hello@gamility.com';
        inpEmailSubject.value = 'Partnership & Feedback';
        inpEmailBody.value = 'Hi team, I would like to suggest a new utility tool for your platform!';
        break;
      case 'sms':
        inpSmsPhone.value = '+1 (555) 304-9182';
        inpSmsMsg.value = 'Check out this awesome new game on Gamility!';
        break;
    }
    renderQrCode();
    showToast('Loaded sample data');
  });

  btnClearData.addEventListener('click', () => {
    switch (activeType) {
      case 'url': inpUrl.value = ''; break;
      case 'text': inpText.value = ''; break;
      case 'wifi':
        inpWifiSsid.value = '';
        inpWifiPass.value = '';
        selectWifiEnc.value = 'WPA';
        chkWifiHidden.checked = false;
        break;
      case 'vcard':
        inpVcardFirst.value = '';
        inpVcardLast.value = '';
        inpVcardPhone.value = '';
        inpVcardEmail.value = '';
        inpVcardCompany.value = '';
        inpVcardTitle.value = '';
        break;
      case 'email':
        inpEmailTo.value = '';
        inpEmailSubject.value = '';
        inpEmailBody.value = '';
        break;
      case 'sms':
        inpSmsPhone.value = '';
        inpSmsMsg.value = '';
        break;
    }
    renderQrCode();
    showToast('Cleared input fields');
  });

  // --- Tab Switching ---

  typeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      typeTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      activeType = tab.getAttribute('data-type');

      formPanels.forEach(panel => {
        panel.classList.toggle('active', panel.id === `panel-${activeType}`);
      });

      renderQrCode();
    });
  });

  // --- Color Themes ---

  themePills.forEach(pill => {
    pill.addEventListener('click', () => {
      themePills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      colorFg.value = pill.getAttribute('data-fg');
      colorBg.value = pill.getAttribute('data-bg');

      renderQrCode();
    });
  });

  // --- Size Resolution Buttons ---

  sizeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      sizeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      exportSize = parseInt(btn.getAttribute('data-size'), 10);
      showToast(`Export size set to ${exportSize}x${exportSize}px`);
    });
  });

  // --- Real-Time Input Listeners ---

  const inputElements = [
    inpUrl, inpText, inpWifiSsid, inpWifiPass, selectWifiEnc, chkWifiHidden,
    inpVcardFirst, inpVcardLast, inpVcardPhone, inpVcardEmail, inpVcardCompany, inpVcardTitle,
    inpEmailTo, inpEmailSubject, inpEmailBody, inpSmsPhone, inpSmsMsg,
    colorFg, colorBg, selectEcl, selectMargin
  ];

  inputElements.forEach(el => {
    if (el) {
      el.addEventListener('input', renderQrCode);
      el.addEventListener('change', renderQrCode);
    }
  });

  // --- Initialize ---
  window.addEventListener('DOMContentLoaded', () => {
    renderQrCode();
  });

})();
