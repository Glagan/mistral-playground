export function extractTimestampFromUUIDv7(uuid: string): number {
	// split the UUID into its components
	const parts = uuid.split('-');
	// the second part of the UUID contains the high bits of the timestamp (48 bits in total)
	const highBitsHex = parts[0] + parts[1].slice(0, 4);
	// convert the high bits from hex to decimal
	// the UUID v7 timestamp is the number of milliseconds since Unix epoch (January 1, 1970)
	return parseInt(highBitsHex, 16);
}
