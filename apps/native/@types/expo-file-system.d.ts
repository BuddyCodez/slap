declare module "expo-file-system" {
	export interface FileSystemOptions {
		intermediates?: boolean;
	}

	export interface DownloadOptions {
		md5?: boolean;
		cache?: boolean;
		headers?: Record<string, string>;
	}

	export interface DownloadResult {
		uri: string;
		status: number;
		headers: Record<string, string>;
		md5?: string;
	}

	export interface FileSystemInfo {
		exists: boolean;
		isDirectory?: boolean;
		modificationTime?: number;
		size?: number;
		uri?: string;
	}

	export interface CopyOptions {
		from: string;
		to: string;
	}

	const documentDirectory: string | null;
	const cacheDirectory: string | null;
	const temporaryDirectory: string | null;

	export function makeDirectoryAsync(
		fileUri: string,
		options?: FileSystemOptions,
	): Promise<void>;

	export function downloadAsync(
		uri: string,
		fileUri: string,
		options?: DownloadOptions,
	): Promise<DownloadResult>;

	export function copyAsync(options: CopyOptions): Promise<void>;

	export function deleteAsync(fileUri: string): Promise<void>;

	export function getInfoAsync(
		fileUri: string,
		options?: { size?: boolean },
	): Promise<FileSystemInfo>;

	export function readAsStringAsync(
		fileUri: string,
		options?: any,
	): Promise<string>;

	export function writeAsStringAsync(
		fileUri: string,
		contents: string,
		options?: any,
	): Promise<void>;
}
