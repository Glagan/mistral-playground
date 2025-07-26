export function fileToB64(file: File) {
	return new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = (error) => reject(error);
	});
}

export const validOcrFileTypes = [
	// Documents
	'text/plain',
	'application/pdf',
	// Images
	'image/png',
	'image/jpeg',
	'image/jpg',
	'image/webp',
	'image/avif'
];
export const mimeTypesAcceptOcr = validOcrFileTypes.join(',');

export const validTranscribeFileTypes = [
	'audio/mpeg',
	'audio/ogg',
	'audio/aac',
	'audio/midi',
	'audio/x-midi',
	'audio/wav',
	'audio/webm',
	'audio/3gpp',
	'audio/3gpp2',
	'audio/flac',
	'audio/x-flac'
];
export const mimeTypesAcceptTranscribe = validTranscribeFileTypes.join(',');

export const validFileTypes = [
	...validOcrFileTypes,
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'application/vnd.openxmlformats-officedocument.presentationml.presentation'
];
export const mimeTypesAccept = validFileTypes.join(',');

export function handleFileUpload(uploadedFiles: File[]) {
	let hasError = false;
	let hasImageSizeError = false;
	let hasFileSizeError = false;
	let files: File[] = [];
	let errors: string[] = [];
	for (let index = 0; index < uploadedFiles.length; index++) {
		const file = uploadedFiles[index];
		if (!validFileTypes.includes(file.type)) {
			hasError = true;
			continue;
		}
		if (file.type.includes('image/')) {
			if (file.size > 10 * 1024 * 1024) {
				hasImageSizeError = true;
			} else {
				files.push(file);
			}
		} else {
			if (file.size > 50 * 1024 * 1024) {
				hasFileSizeError = true;
			} else {
				files.push(file);
			}
		}
	}
	if (hasError) {
		errors.push(
			'Unsupported file type, only images (.png, .jpeg, .jpg, .webp and .avif), PDF, text and documents files are supported.'
		);
	}
	if (hasImageSizeError) {
		errors.push('Image size should be less than 10MB.');
	}
	if (hasFileSizeError) {
		errors.push('File size should be less than 50MB.');
	}
	return { files, errors };
}
