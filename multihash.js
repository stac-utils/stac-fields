const _ = require('./helper');

const Multihash = {

	// Multicodec codes -> hash function name, see https://github.com/multiformats/multicodec/
	names: {
		0x11: 'sha1',
		0x12: 'sha2-256',
		0x13: 'sha2-512',
		0x14: 'sha3-512',
		0x15: 'sha3-384',
		0x16: 'sha3-256',
		0x17: 'sha3-224',
		0x1a: 'keccak-224',
		0x1b: 'keccak-256',
		0x1c: 'keccak-384',
		0x1d: 'keccak-512',
		0x1e: 'blake3',
		0x20: 'sha2-384',
		0x56: 'dbl-sha2-256',
		0xd5: 'md5',
		0x1013: 'sha2-224',
		0x1014: 'sha2-512-224',
		0x1015: 'sha2-512-256',
		0x1053: 'ripemd-160',
		0xb220: 'blake2b-256',
		0xb240: 'blake2b-512',
		0xb260: 'blake2s-256'
	},

	// Read an unsigned varint at offset; returns [value, bytesRead].
	readVarint(bytes, offset = 0) {
		let value = 0;
		let shift = 0;
		let i = offset;
		while (i < bytes.length) {
			const byte = bytes[i++];
			value += (byte & 0x7f) * Math.pow(2, shift);
			if ((byte & 0x80) === 0) {
				return [value, i - offset];
			}
			shift += 7;
		}
		throw new Error('Truncated varint');
	},

	// Decode a multihash hex string into { name, digest }, both as strings.
	decode(hex) {
		const bytes = _.hexToUint8(hex);
		const [code, codeLength] = Multihash.readVarint(bytes, 0);
		const [length, lengthLength] = Multihash.readVarint(bytes, codeLength);
		const digest = bytes.slice(codeLength + lengthLength);
		if (digest.length !== length) {
			throw new Error('Multihash digest length mismatch');
		}
		const name = Multihash.names[code];
		if (!name) {
			throw new Error(`Unsupported hash function code: 0x${code.toString(16)}`);
		}
		return { name, digest: _.uint8ToHex(digest) };
	}

};

module.exports = Multihash;
