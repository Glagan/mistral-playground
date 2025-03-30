export function fileToB64(file: File) {
	return new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = (error) => reject(error);
	});
}

export const validFileTypes = [/* 'application/pdf', */ 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

export function handleFileUpload(uploadedFiles: File[]) {
	let hasError = false;
	let hasSizeError = false;
	let hasSize2Error = false;
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
				hasSizeError = true;
			} else {
				files.push(file);
			}
		} else {
			if (file.size > 50 * 1024 * 1024) {
				hasSize2Error = true;
			} else {
				files.push(file);
			}
		}
	}
	if (hasError) {
		errors.push('Unsupported file type, only images are supported (.png, .jpeg, .jpg and .webp).');
	}
	if (hasSizeError) {
		errors.push('Image size should be less than 10MB.');
	}
	if (hasSize2Error) {
		errors.push('PDF size should be less than 50MB.');
	}
	return { files, errors };
}
