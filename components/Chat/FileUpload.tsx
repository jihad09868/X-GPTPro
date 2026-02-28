
import React, { useRef, useState } from 'react';
import { Plus, X, FileText, Paperclip, Film, ImageIcon, AlertCircle } from 'lucide-react';

// STRICT ALLOWED TYPES — ONLY images (jpg/png) and videos (mp4)
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'mp4', 'webm', 'mov'];
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'video/mp4',
    'video/webm',
    'video/quicktime',  // .mov
];

// Only allow these in the file picker
const ACCEPT_STRING = 'image/jpeg,image/png,video/mp4,video/webm,video/quicktime,.jpg,.jpeg,.png,.mp4,.webm,.mov';

export interface SelectedFile {
    file: File;
    preview: string;  // data URL for preview (images/videos)
    base64: string;    // pure base64 string (no prefix)
    mimeType: string;
    isImage: boolean;
    isVideo: boolean;
}

interface FileUploadProps {
    selectedFiles: SelectedFile[];
    onFilesSelected: (files: SelectedFile[]) => void;
    onRemoveFile: (index: number) => void;
    disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ selectedFiles, onFilesSelected, onRemoveFile, disabled }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const getFileExtension = (filename: string): string => {
        return filename.split('.').pop()?.toLowerCase() || '';
    };

    const isAllowedFile = (file: File): boolean => {
        const ext = getFileExtension(file.name);
        const mimeAllowed = ALLOWED_MIME_TYPES.includes(file.type);
        const extAllowed = ALLOWED_EXTENSIONS.includes(ext);
        return mimeAllowed || extAllowed;
    };

    const processFiles = async (fileList: FileList | File[]) => {
        const files = Array.from(fileList);
        if (files.length === 0) return;

        // STRICTLY filter — only images (jpg/png) and videos (mp4/webm/mov)
        const validFiles: File[] = [];
        const blockedFiles: string[] = [];

        for (const f of files) {
            if (isAllowedFile(f)) {
                validFiles.push(f);
            } else {
                blockedFiles.push(f.name);
                console.warn(`❌ BLOCKED: ${f.name} (${f.type || 'unknown type'}). Only JPG, PNG images and MP4/WebM/MOV videos are allowed.`);
            }
        }

        // Show error for blocked files
        if (blockedFiles.length > 0) {
            const msg = `❌ Blocked: ${blockedFiles.join(', ')}\n\nOnly JPG, PNG images and MP4 videos are allowed!`;
            setErrorMsg(msg);
            setTimeout(() => setErrorMsg(null), 4000);
        }

        if (validFiles.length === 0) return;

        const processed: SelectedFile[] = await Promise.all(
            validFiles.map(file => {
                return new Promise<SelectedFile>((resolve) => {
                    const reader = new FileReader();
                    const isImage = file.type.startsWith('image/');
                    const isVideo = file.type.startsWith('video/');

                    reader.onload = () => {
                        const dataUrl = reader.result as string;
                        const base64 = dataUrl.split(',')[1];

                        let preview = '';
                        if (isImage) {
                            preview = dataUrl;
                        } else if (isVideo) {
                            preview = URL.createObjectURL(file);
                        }

                        resolve({
                            file,
                            preview,
                            base64,
                            mimeType: file.type,
                            isImage,
                            isVideo,
                        });
                    };
                    reader.readAsDataURL(file);
                });
            })
        );

        onFilesSelected([...selectedFiles, ...processed]);
    };

    const handleClick = () => {
        if (!disabled) {
            fileInputRef.current?.click();
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFiles(e.target.files);
            e.target.value = '';
        }
    };

    // Handle drag and drop - block unsupported types
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled) return;
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(e.dataTransfer.files);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    return (
        <>
            {/* Hidden file input — STRICTLY images (jpg/png) and videos (mp4) */}
            <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT_STRING}
                multiple
                onChange={handleChange}
                className="hidden"
            />

            {/* + Button */}
            <button
                onClick={handleClick}
                disabled={disabled}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className={`
                    flex items-center justify-center flex-shrink-0
                    w-8 h-8 rounded-full
                    transition-all duration-300 ease-out
                    ${disabled
                        ? 'text-gray-300 dark:text-[#444] cursor-not-allowed'
                        : 'text-gray-400 dark:text-[#999] hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 hover:scale-110 active:scale-95'
                    }
                `}
                title="Attach image (JPG, PNG) or video (MP4)"
                type="button"
            >
                <Plus size={20} strokeWidth={2} />
            </button>

            {/* Error Toast for blocked files */}
            {errorMsg && (
                <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-4 fade-in duration-300">
                    <div className="bg-red-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 max-w-sm">
                        <AlertCircle size={20} className="flex-shrink-0" />
                        <div className="text-sm font-medium whitespace-pre-line">{errorMsg}</div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fileUploadSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(8px) scale(0.92);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                .file-preview-enter {
                    animation: fileUploadSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                }
            `}</style>
        </>
    );
};

// Separate preview component that renders above the input area
export const FilePreviewBar: React.FC<{
    files: SelectedFile[];
    onRemove: (index: number) => void;
}> = ({ files, onRemove }) => {
    if (files.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2 px-2 sm:px-3 pt-3 pb-1">
            {files.map((file, index) => (
                <div
                    key={index}
                    className="relative group/preview file-preview-enter"
                    style={{ animationDelay: `${index * 80}ms` }}
                >
                    {file.isImage ? (
                        /* Image Thumbnail */
                        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 border-gray-200/50 dark:border-white/10 bg-gray-100 dark:bg-[#383838] shadow-sm hover:shadow-md transition-all duration-200 hover:border-blue-400/50 dark:hover:border-blue-400/30">
                            <img
                                src={file.preview}
                                alt={file.file.name}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover/preview:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover/preview:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                                <ImageIcon size={14} className="text-white opacity-0 group-hover/preview:opacity-80 transition-opacity duration-200 drop-shadow-md" />
                            </div>
                        </div>
                    ) : file.isVideo ? (
                        /* Video Thumbnail */
                        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 border-gray-200/50 dark:border-white/10 bg-gray-100 dark:bg-[#383838] shadow-sm hover:shadow-md transition-all duration-200 hover:border-purple-400/50 dark:hover:border-purple-400/30">
                            <video
                                src={file.preview}
                                className="w-full h-full object-cover"
                                muted
                                preload="metadata"
                            />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                <div className="p-1.5 bg-black/50 backdrop-blur-sm rounded-full">
                                    <Film size={14} className="text-white" />
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {/* Remove button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove(index);
                        }}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-700 dark:bg-[#555] hover:bg-red-500 dark:hover:bg-red-500 text-white rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover/preview:opacity-100 hover:scale-110 shadow-lg z-10"
                        title="Remove"
                    >
                        <X size={10} strokeWidth={3} />
                    </button>
                </div>
            ))}
        </div>
    );
};

export default FileUpload;
